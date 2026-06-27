"use client";

import { use, useState } from "react";
import { trpc } from "@/trpc/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Loader2,
  CreditCard,
  Users,
  Gauge,
  CheckCircle2,
  Rocket,
  KeyRound,
  Trash2,
  Bell,
  GitBranch,
  Sparkles,
  History,
} from "lucide-react";

export default function SettingsPage({
  params,
}: {
  params: Promise<{ workspaceId: string }>;
}) {
  const { workspaceId } = use(params);

  const ghStatus = trpc.github.getStatus.useQuery({ workspaceId });
  const ghInstall = trpc.github.getInstallUrl.useQuery({ workspaceId });
  const billing = trpc.billing.getStatus.useQuery({ workspaceId });
  const metrics = trpc.review.getWorkspaceMetrics.useQuery({ workspaceId });

  const upgrade = trpc.billing.upgrade.useMutation({
    onSuccess: (data) => {
      if (data.shortUrl) window.location.href = data.shortUrl;
    },
  });

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage integrations, billing, and your team.
        </p>
      </div>

      {/* Metrics */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Gauge className="h-5 w-5 text-primary" /> Velocity &amp; AI Metrics
          </CardTitle>
        </CardHeader>
        <CardContent>
          {metrics.isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Metric label="Features shipped" value={metrics.data?.shippedCount ?? 0} />
              <Metric
                label="Avg cycle (hrs)"
                value={metrics.data?.avgCycleHours ?? 0}
              />
              <Metric label="AI reviews" value={metrics.data?.reviewCount ?? 0} />
              <Metric
                label="Bugs caught"
                value={metrics.data?.bugsCaught ?? 0}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* GitHub */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <GitBranch className="h-5 w-5" /> GitHub Integration
          </CardTitle>
          <CardDescription>
            Connect the ShipFlow GitHub App to enable PR sync and the AI review
            loop.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {ghStatus.isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          ) : ghStatus.data?.connected ? (
            <div className="flex items-center gap-2 text-emerald-400">
              <CheckCircle2 className="h-5 w-5" />
              Connected
              {ghStatus.data.accountLogin
                ? ` as @${ghStatus.data.accountLogin}`
                : ""}
            </div>
          ) : (
            <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90">
              <a href={ghInstall.data?.url ?? "#"}>
                <GitBranch className="mr-2 h-4 w-4" /> Connect GitHub
              </a>
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Repositories + AI analysis */}
      <ReposCard workspaceId={workspaceId} />

      {/* Notifications */}
      <NotificationsCard workspaceId={workspaceId} />

      {/* Bring your own AI key */}
      <AiKeyCard workspaceId={workspaceId} />

      {/* Billing */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <CreditCard className="h-5 w-5 text-primary" /> Billing
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {billing.isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          ) : (
            <>
              <div className="flex flex-wrap gap-6 text-sm">
                <div>
                  <p className="text-muted-foreground">Plan</p>
                  <p className="font-semibold">{billing.data?.planLabel}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">AI review credits</p>
                  <p className="font-semibold">{billing.data?.aiReviewCredits}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Projects</p>
                  <p className="font-semibold">
                    {billing.data?.projectCount} /{" "}
                    {billing.data?.projectLimit === Infinity
                      ? "∞"
                      : billing.data?.projectLimit}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Repositories</p>
                  <p className="font-semibold">
                    {billing.data?.repositoryCount} /{" "}
                    {billing.data?.repositoryLimit === Infinity
                      ? "∞"
                      : billing.data?.repositoryLimit}
                  </p>
                </div>
              </div>
              {billing.data?.planTier !== "PRO" && (
                <Button
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                  disabled={upgrade.isPending}
                  onClick={() => upgrade.mutate({ workspaceId })}
                >
                  {upgrade.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Rocket className="mr-2 h-4 w-4" />
                  )}
                  Upgrade to Pro
                </Button>
              )}
              {upgrade.error && (
                <p className="text-sm text-red-400">{upgrade.error.message}</p>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Team */}
      <TeamCard workspaceId={workspaceId} />

      {/* Audit log */}
      <AuditCard workspaceId={workspaceId} />
    </div>
  );
}

function AuditCard({ workspaceId }: { workspaceId: string }) {
  const ws = trpc.workspace.getById.useQuery({ workspaceId });
  const role = (ws.data as any)?.currentUserRole as string | undefined;
  const canManage = role === "ADMIN" || role === "LEAD";
  const logs = trpc.workspace.getAuditLog.useQuery(
    { workspaceId },
    { enabled: canManage }
  );

  if (!canManage) return null;

  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <History className="h-5 w-5 text-primary" /> Activity Log
        </CardTitle>
        <CardDescription>
          Sensitive actions: approvals, role changes, removals, invites.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {logs.isLoading ? (
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        ) : !logs.data || logs.data.length === 0 ? (
          <p className="text-sm text-muted-foreground">No activity yet.</p>
        ) : (
          <div className="divide-y divide-border">
            {logs.data.map((l: any) => (
              <div
                key={l.id}
                className="flex items-center justify-between gap-3 py-2 text-sm"
              >
                <div className="min-w-0">
                  <span className="font-medium">{l.actorName ?? "Someone"}</span>{" "}
                  <span className="text-muted-foreground">{l.action}</span>{" "}
                  {l.target && <span className="truncate">· {l.target}</span>}
                </div>
                <span className="text-xs text-muted-foreground shrink-0">
                  {new Date(l.createdAt).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function TeamCard({ workspaceId }: { workspaceId: string }) {
  const utils = trpc.useUtils();
  const ws = trpc.workspace.getById.useQuery({ workspaceId });
  const role = (ws.data as any)?.currentUserRole as string | undefined;
  const canManage = role === "ADMIN" || role === "LEAD";
  const canAdmin = role === "ADMIN";

  const members = trpc.workspace.getMembers.useQuery({ workspaceId });
  const invites = trpc.member.listInvitations.useQuery(
    { workspaceId },
    { enabled: canManage }
  );

  const [email, setEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("MEMBER");
  const [link, setLink] = useState("");
  const [copied, setCopied] = useState(false);

  const refresh = () => {
    members.refetch();
    invites.refetch();
  };

  const invite = trpc.member.invite.useMutation({
    onSuccess: (d) => {
      setEmail("");
      setLink(`${window.location.origin}/invite/${d.token}`);
      setCopied(false);
      invites.refetch();
    },
  });
  const revoke = trpc.member.revokeInvitation.useMutation({
    onSuccess: () => invites.refetch(),
  });
  const updateRole = trpc.member.updateRole.useMutation({ onSuccess: refresh });
  const removeMember = trpc.member.remove.useMutation({ onSuccess: refresh });

  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Users className="h-5 w-5 text-primary" /> Team
        </CardTitle>
        <CardDescription>
          Invite teammates and manage their roles. Admins can change roles and
          remove members.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Members */}
        {members.isLoading ? (
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        ) : (
          <div className="divide-y divide-border">
            {members.data?.map((m: any) => (
              <div
                key={m.id}
                className="flex items-center justify-between gap-3 py-2"
              >
                <div className="min-w-0">
                  <p className="font-medium truncate">{m.user.name}</p>
                  <p className="text-sm text-muted-foreground truncate">
                    {m.user.email}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {canAdmin ? (
                    <select
                      value={m.role}
                      onChange={(e) =>
                        updateRole.mutate({ memberId: m.id, role: e.target.value as any })
                      }
                      className="bg-background border border-border rounded-md text-xs px-2 py-1"
                    >
                      <option value="ADMIN">ADMIN</option>
                      <option value="LEAD">LEAD</option>
                      <option value="MEMBER">MEMBER</option>
                    </select>
                  ) : (
                    <span className="text-xs bg-muted px-2 py-1 rounded-full">
                      {m.role}
                    </span>
                  )}
                  {canAdmin && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeMember.mutate({ memberId: m.id })}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {(updateRole.error || removeMember.error) && (
          <p className="text-sm text-red-400">
            {updateRole.error?.message || removeMember.error?.message}
          </p>
        )}

        {/* Invite */}
        {canManage && (
          <div className="border-t border-border pt-4 space-y-3">
            <p className="text-sm font-medium">Invite a teammate</p>
            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                type="email"
                placeholder="teammate@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
                className="bg-background border border-border rounded-md text-sm px-2"
              >
                <option value="MEMBER">Member</option>
                <option value="LEAD">Lead</option>
                <option value="ADMIN">Admin</option>
              </select>
              <Button
                className="bg-primary text-primary-foreground hover:bg-primary/90"
                disabled={!email.trim() || invite.isPending}
                onClick={() =>
                  invite.mutate({ workspaceId, email: email.trim(), role: inviteRole as any })
                }
              >
                {invite.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create invite
              </Button>
            </div>
            {invite.error && (
              <p className="text-sm text-red-400">{invite.error.message}</p>
            )}
            {link && (
              <div className="flex items-center gap-2 rounded-md border border-border bg-muted/40 p-2">
                <code className="text-xs truncate flex-1">{link}</code>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    navigator.clipboard?.writeText(link);
                    setCopied(true);
                  }}
                >
                  {copied ? "Copied" : "Copy link"}
                </Button>
              </div>
            )}

            {/* Pending invitations */}
            {invites.data && invites.data.length > 0 && (
              <div className="space-y-2 pt-2">
                <p className="text-xs text-muted-foreground">Pending invites</p>
                {invites.data.map((inv: any) => (
                  <div
                    key={inv.id}
                    className="flex items-center justify-between gap-2 text-sm"
                  >
                    <span className="truncate">
                      {inv.email}{" "}
                      <span className="text-xs text-muted-foreground">
                        ({inv.role})
                      </span>
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => revoke.mutate({ invitationId: inv.id })}
                    >
                      Revoke
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ReposCard({ workspaceId }: { workspaceId: string }) {
  const utils = trpc.useUtils();
  const repos = trpc.github.listLinkedRepositories.useQuery({ workspaceId });
  const analyze = trpc.github.analyzeRepository.useMutation({
    onSuccess: () => repos.refetch(),
  });

  // Connect-a-repository flow: pick an installation repo + a project to link it.
  const available = trpc.github.listRepositories.useQuery(
    { workspaceId },
    { retry: false }
  );
  const projects = trpc.project.list.useQuery({ workspaceId });
  const [repoSel, setRepoSel] = useState("");
  const [projSel, setProjSel] = useState("");
  const link = trpc.github.linkRepository.useMutation({
    onSuccess: () => {
      setRepoSel("");
      repos.refetch();
      utils.billing.getStatus.invalidate({ workspaceId });
    },
  });

  const connect = () => {
    const r = available.data?.find((x) => String(x.githubId) === repoSel);
    if (r && projSel) {
      link.mutate({
        projectId: projSel,
        githubId: r.githubId,
        name: r.name,
        fullName: r.fullName,
        url: r.url,
      });
    }
  };

  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <GitBranch className="h-5 w-5 text-primary" /> Repositories
        </CardTitle>
        <CardDescription>
          Linked repos and AI analysis (stack, architecture, risks).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Connect a repository (installation repo → project) */}
        {available.isError ? (
          <p className="text-sm text-muted-foreground">
            Connect GitHub above, then link repositories to a project here.
          </p>
        ) : (
          <div className="rounded-lg border border-border p-3 space-y-2">
            <p className="text-sm font-medium">Connect a repository</p>
            <div className="flex flex-col sm:flex-row gap-2">
              <select
                value={repoSel}
                onChange={(e) => setRepoSel(e.target.value)}
                className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm"
              >
                <option value="">
                  {available.isLoading ? "Loading repos…" : "Select a repository"}
                </option>
                {(available.data ?? []).map((r) => (
                  <option key={r.githubId} value={String(r.githubId)}>
                    {r.fullName}
                    {r.private ? " (private)" : ""}
                  </option>
                ))}
              </select>
              <select
                value={projSel}
                onChange={(e) => setProjSel(e.target.value)}
                className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm"
              >
                <option value="">
                  {projects.isLoading ? "Loading projects…" : "Select a project"}
                </option>
                {(projects.data ?? []).map((p: any) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              <Button
                className="bg-primary text-primary-foreground hover:bg-primary/90"
                disabled={!repoSel || !projSel || link.isPending}
                onClick={connect}
              >
                {link.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Connect
              </Button>
            </div>
            {link.error && (
              <p className="text-sm text-red-400">{link.error.message}</p>
            )}
          </div>
        )}

        {repos.isLoading ? (
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        ) : !repos.data || repos.data.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No repositories linked yet. Select one above to link it to a project.
          </p>
        ) : (
          repos.data.map((r: any) => (
            <div key={r.id} className="rounded-lg border border-border p-3">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-medium truncate">{r.fullName ?? r.name}</p>
                  <p className="text-xs text-muted-foreground">{r.project?.name}</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={analyze.isPending}
                  onClick={() => analyze.mutate({ repositoryId: r.id })}
                >
                  {analyze.isPending &&
                  analyze.variables?.repositoryId === r.id ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="mr-2 h-4 w-4" />
                  )}
                  {r.analyzedAt ? "Re-analyze" : "Analyze"}
                </Button>
              </div>
              {r.analysisJson && (
                <div className="mt-2 text-sm space-y-1">
                  <p className="text-muted-foreground">
                    {(r.analysisJson as any).summary}
                  </p>
                  {Array.isArray((r.analysisJson as any).stack) && (
                    <p className="text-xs">
                      <span className="text-muted-foreground">Stack: </span>
                      {(r.analysisJson as any).stack.join(", ")}
                    </p>
                  )}
                </div>
              )}
            </div>
          ))
        )}
        {analyze.error && (
          <p className="text-sm text-red-400">{analyze.error.message}</p>
        )}
      </CardContent>
    </Card>
  );
}

function NotificationsCard({ workspaceId }: { workspaceId: string }) {
  const status = trpc.workspace.getNotifyStatus.useQuery({ workspaceId });
  const utils = trpc.useUtils();
  const [url, setUrl] = useState("");
  const [type, setType] = useState("SLACK");

  const save = trpc.workspace.setNotifications.useMutation({
    onSuccess: () => {
      setUrl("");
      utils.workspace.getNotifyStatus.invalidate({ workspaceId });
    },
  });

  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Bell className="h-5 w-5 text-primary" /> Notifications
        </CardTitle>
        <CardDescription>
          Get a Slack or Discord message when a PRD is ready or a PR fails AI
          review. Paste an incoming webhook URL.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {status.data?.enabled && (
          <p className="flex items-center gap-2 text-sm text-emerald-400">
            <CheckCircle2 className="h-4 w-4" /> Connected ({status.data.type})
          </p>
        )}
        <div className="flex flex-col sm:flex-row gap-2">
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="bg-background border border-border rounded-md text-sm px-2"
          >
            <option value="SLACK">Slack</option>
            <option value="DISCORD">Discord</option>
          </select>
          <Input
            placeholder="https://hooks.slack.com/services/..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
          <Button
            className="bg-primary text-primary-foreground hover:bg-primary/90"
            disabled={save.isPending}
            onClick={() =>
              save.mutate({ workspaceId, webhookUrl: url.trim(), type: type as any })
            }
          >
            {save.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save
          </Button>
        </div>
        {status.data?.enabled && (
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              save.mutate({ workspaceId, webhookUrl: "", type: type as any })
            }
          >
            Disable
          </Button>
        )}
        {save.error && (
          <p className="text-sm text-red-400">{save.error.message}</p>
        )}
      </CardContent>
    </Card>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-border p-4">
      <p className="text-2xl font-bold text-primary">{value}</p>
      <p className="text-xs text-muted-foreground mt-1">{label}</p>
    </div>
  );
}

function AiKeyCard({ workspaceId }: { workspaceId: string }) {
  const status = trpc.workspace.getAiKeyStatus.useQuery({ workspaceId });
  const utils = trpc.useUtils();
  const [apiKey, setApiKey] = useState("");

  const save = trpc.workspace.setAnthropicKey.useMutation({
    onSuccess: () => {
      setApiKey("");
      utils.workspace.getAiKeyStatus.invalidate({ workspaceId });
    },
  });
  const remove = trpc.workspace.removeAnthropicKey.useMutation({
    onSuccess: () => utils.workspace.getAiKeyStatus.invalidate({ workspaceId }),
  });

  const invalidFormat = apiKey.length > 0 && !apiKey.trim().startsWith("sk-ant-");

  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <KeyRound className="h-5 w-5 text-primary" /> AI Provider Key (BYOK)
        </CardTitle>
        <CardDescription>
          Use a workspace Anthropic (Claude) API key so AI usage is billed here.
          This overrides each member’s personal key. ShipFlow runs Claude Opus
          only, so the key must have access to{" "}
          <code className="text-primary">claude-opus-4-8</code> (verified on
          save). Keys start with{" "}
          <code className="text-primary">sk-ant-</code> and are stored encrypted.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {status.isLoading ? (
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        ) : status.data?.hasKey ? (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-emerald-400">
              <CheckCircle2 className="h-5 w-5" />
              <span className="text-sm">
                Using your key{" "}
                <code className="text-muted-foreground">
                  {status.data.maskedKey}
                </code>
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              disabled={remove.isPending}
              onClick={() => remove.mutate({ workspaceId })}
            >
              {remove.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="mr-2 h-4 w-4" />
              )}
              Remove
            </Button>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Currently using the platform key. Add your own to control cost.
          </p>
        )}

        <div className="flex flex-col sm:flex-row gap-2">
          <Input
            type="password"
            placeholder="sk-ant-..."
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            className="font-mono"
          />
          <Button
            className="bg-primary text-primary-foreground hover:bg-primary/90"
            disabled={!apiKey.trim() || invalidFormat || save.isPending}
            onClick={() => save.mutate({ workspaceId, apiKey: apiKey.trim() })}
          >
            {save.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {status.data?.hasKey ? "Replace key" : "Save key"}
          </Button>
        </div>
        {invalidFormat && (
          <p className="text-sm text-red-400">
            Only Anthropic keys are allowed (must start with sk-ant-).
          </p>
        )}
        {save.error && (
          <p className="text-sm text-red-400">{save.error.message}</p>
        )}
      </CardContent>
    </Card>
  );
}
