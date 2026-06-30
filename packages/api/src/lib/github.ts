import { Octokit } from "@octokit/rest";
import { createAppAuth } from "@octokit/auth-app";

/**
 * GitHub App integration helpers.
 *
 * ShipFlow authenticates as a GitHub App (not a personal OAuth token) so it can
 * act on behalf of an installation across a workspace's repositories. The App's
 * credentials come from the GitHub Developer Settings:
 *   - GITHUB_APP_ID
 *   - GITHUB_APP_PRIVATE_KEY  (PEM; newlines may be escaped as \n in the env)
 *   - GITHUB_WEBHOOK_SECRET   (used by the webhook route to verify signatures)
 */

function getPrivateKey(): string {
  const key = process.env.GITHUB_APP_PRIVATE_KEY || "";
  // Support keys stored on a single line with escaped newlines.
  return key.includes("\\n") ? key.replace(/\\n/g, "\n") : key;
}

function appAuthConfig() {
  return {
    appId: process.env.GITHUB_APP_ID || "",
    privateKey: getPrivateKey(),
  };
}

/** Octokit authenticated as the App itself (for app-level endpoints). */
export function getAppOctokit(): Octokit {
  return new Octokit({
    authStrategy: createAppAuth,
    auth: appAuthConfig(),
  });
}

const installationCache = new Map<
  number,
  { instance: Octokit; expiresAt: number }
>();

/**
 * Octokit scoped to a specific installation. Use this for anything that touches
 * a workspace's repositories (listing repos, reading diffs, posting reviews).
 * Instances are cached for 55 minutes to reduce API latency and token issuance.
 */
export function getInstallationOctokit(installationId: number): Octokit {
  const cached = installationCache.get(installationId);
  const now = Date.now();
  if (cached && cached.expiresAt > now) {
    return cached.instance;
  }

  const instance = new Octokit({
    authStrategy: createAppAuth,
    auth: {
      ...appAuthConfig(),
      installationId,
    },
  });

  installationCache.set(installationId, {
    instance,
    expiresAt: now + 55 * 60 * 1000,
  });

  return instance;
}

/** Evict an installation's Octokit instance from the cache (e.g. on uninstallation). */
export function evictInstallationOctokit(installationId: number) {
  installationCache.delete(installationId);
}

/** Build the GitHub App installation URL the user is redirected to. */
export function getInstallUrl(state?: string): string {
  const slug = process.env.GITHUB_APP_SLUG || "shipflow-ai";
  const base = `https://github.com/apps/${slug}/installations/new`;
  return state ? `${base}?state=${encodeURIComponent(state)}` : base;
}

/** Parse "Closes SF-123" style references out of a PR body. Returns task refs. */
export function parseTaskRefs(body: string | null | undefined): number[] {
  if (!body) return [];
  const matches = body.matchAll(/SF-(\d+)/gi);
  const refs = new Set<number>();
  for (const m of matches) {
    const n = Number(m[1]);
    if (!Number.isNaN(n)) refs.add(n);
  }
  return [...refs];
}

// ---------------------------------------------------------------------------
// Write helpers used by AI codegen (branch + commit + draft PR).
// These are intentionally narrow: codegen only ever creates a NEW branch and a
// DRAFT PR — it never touches the default branch directly.
// ---------------------------------------------------------------------------

/** Resolve a repo's default branch and its current head SHA. */
export async function getDefaultBranch(
  octokit: Octokit,
  owner: string,
  repo: string,
): Promise<{ branch: string; sha: string }> {
  const { data: repoData } = await octokit.rest.repos.get({ owner, repo });
  const branch = repoData.default_branch;
  const { data: ref } = await octokit.rest.git.getRef({
    owner,
    repo,
    ref: `heads/${branch}`,
  });
  return { branch, sha: ref.object.sha };
}

/**
 * Read a handful of files from the repo (truncated) to ground the model.
 * Missing files are skipped silently. Each file is capped to `maxBytes`.
 */
export async function readRepoContext(
  octokit: Octokit,
  owner: string,
  repo: string,
  paths: string[],
  maxBytes = 16_000,
): Promise<{ path: string; content: string }[]> {
  const out: { path: string; content: string }[] = [];
  for (const path of paths) {
    try {
      const { data } = await octokit.rest.repos.getContent({
        owner,
        repo,
        path,
      });
      if (!Array.isArray(data) && data.type === "file" && data.content) {
        let content = Buffer.from(data.content, "base64").toString("utf8");
        if (content.length > maxBytes) {
          content = content.slice(0, maxBytes) + "\n...[truncated]...";
        }
        out.push({ path, content });
      }
    } catch {
      // file doesn't exist on this repo — skip
    }
  }
  return out;
}

/** Create a new branch pointing at `fromSha`. */
export async function createBranch(
  octokit: Octokit,
  owner: string,
  repo: string,
  fromSha: string,
  branchName: string,
): Promise<void> {
  await octokit.rest.git.createRef({
    owner,
    repo,
    ref: `refs/heads/${branchName}`,
    sha: fromSha,
  });
}

export type PatchFile = {
  path: string;
  action: "create" | "modify";
  newContent: string;
};

/**
 * Commit a set of file changes onto `branch` as a single commit, using the Git
 * Data API (blobs → tree → commit → update ref). Returns the new commit SHA.
 */
export async function commitPatch(
  octokit: Octokit,
  owner: string,
  repo: string,
  branch: string,
  baseSha: string,
  files: PatchFile[],
  message: string,
): Promise<string> {
  const { data: baseCommit } = await octokit.rest.git.getCommit({
    owner,
    repo,
    commit_sha: baseSha,
  });

  const tree = await Promise.all(
    files.map(async (f) => {
      const { data: blob } = await octokit.rest.git.createBlob({
        owner,
        repo,
        content: f.newContent,
        encoding: "utf-8",
      });
      return {
        path: f.path,
        mode: "100644" as const,
        type: "blob" as const,
        sha: blob.sha,
      };
    }),
  );

  const { data: newTree } = await octokit.rest.git.createTree({
    owner,
    repo,
    base_tree: baseCommit.tree.sha,
    tree,
  });

  const { data: commit } = await octokit.rest.git.createCommit({
    owner,
    repo,
    message,
    tree: newTree.sha,
    parents: [baseSha],
  });

  await octokit.rest.git.updateRef({
    owner,
    repo,
    ref: `heads/${branch}`,
    sha: commit.sha,
  });

  return commit.sha;
}

/** Open a draft PR and best-effort apply the `ai-generated` label. */
export async function openDraftPr(
  octokit: Octokit,
  owner: string,
  repo: string,
  args: { head: string; base: string; title: string; body: string },
): Promise<{ number: number; url: string; headSha: string }> {
  const { data: pr } = await octokit.rest.pulls.create({
    owner,
    repo,
    head: args.head,
    base: args.base,
    title: args.title,
    body: args.body,
    draft: true,
  });

  try {
    await octokit.rest.issues.addLabels({
      owner,
      repo,
      issue_number: pr.number,
      labels: ["ai-generated"],
    });
  } catch {
    // label may not exist / insufficient perms — non-fatal
  }

  return { number: pr.number, url: pr.html_url, headSha: pr.head.sha };
}
