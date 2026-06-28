import { Octokit } from "@octokit/rest";
import { createAppAuth } from "@octokit/auth-app";

/**
 * GitHub App integration helpers.
 *
 * MetroFlow authenticates as a GitHub App (not a personal OAuth token) so it can
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

/**
 * Octokit scoped to a specific installation. Use this for anything that touches
 * a workspace's repositories (listing repos, reading diffs, posting reviews).
 */
export function getInstallationOctokit(installationId: number): Octokit {
  return new Octokit({
    authStrategy: createAppAuth,
    auth: {
      ...appAuthConfig(),
      installationId,
    },
  });
}

/** Build the GitHub App installation URL the user is redirected to. */
export function getInstallUrl(state?: string): string {
  const slug = process.env.GITHUB_APP_SLUG || "metroflow-ai";
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
