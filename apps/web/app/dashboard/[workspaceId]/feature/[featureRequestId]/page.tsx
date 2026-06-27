"use client";

import { use, useState } from "react";
import Link from "next/link";
import { trpc } from "@/trpc/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  Loader2,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  GitPullRequest,
  Sparkles,
  ShieldAlert,
  ShieldCheck,
  Info,
  HelpCircle,
  Pencil,
  Activity,
} from "lucide-react";

const STATUS_STYLES: Record<string, string> = {
  DISCOVERY: "bg-muted text-muted-foreground",
  GENERATING_PRD: "bg-blue-500/15 text-blue-400",
  PLANNING: "bg-blue-500/15 text-blue-400",
  IN_PROGRESS: "bg-amber-500/15 text-amber-400",
  IN_REVIEW: "bg-purple-500/15 text-purple-400",
  FIX_NEEDED: "bg-red-500/15 text-red-400",
  APPROVED: "bg-emerald-500/15 text-emerald-400",
  SHIPPED: "bg-primary/20 text-primary",
  REJECTED: "bg-red-500/15 text-red-400",
};

export default function FeatureCommandCenter({
  params,
}: {
  params: Promise<{ workspaceId: string; featureRequestId: string }>;
}) {
  const { workspaceId, featureRequestId } = use(params);

  const featureQuery = trpc.review.getFeatureDetail.useQuery(
    { featureRequestId },
    {
      // Poll while the async Inngest PRD workflow is running.
      refetchInterval: (data: any) =>
        data?.status === "GENERATING_PRD" ? 2500 : false,
    }
  );
  const feature = featureQuery.data;

  const workflows = trpc.workflow.listForFeature.useQuery(
    { featureRequestId },
    {
      refetchInterval: (data: any) =>
        Array.isArray(data) && data.some((r: any) => r.status === "RUNNING")
          ? 2000
          : false,
    }
  );

  const analyze = trpc.clarify.analyze.useMutation({
    onSuccess: () => featureQuery.refetch(),
  });
  const answer = trpc.clarify.answer.useMutation({
    onSuccess: () => featureQuery.refetch(),
  });
  const generatePRD = trpc.prd.generate.useMutation({
    onSuccess: () => featureQuery.refetch(),
  });
  const runReview = trpc.review.runReview.useMutation({
    onSuccess: () => featureQuery.refetch(),
  });
  const approve = trpc.review.approveAndShip.useMutation({
    onSuccess: () => featureQuery.refetch(),
  });
  const reject = trpc.review.reject.useMutation({
    onSuccess: () => featureQuery.refetch(),
  });

  if (featureQuery.isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  if (!feature) return <div className="p-8">Feature not found.</div>;

  const prd = feature.prds[0];
  const content = (prd?.contentJson ?? {}) as any;
  const clar = (feature as any).clarificationJson as any;
  // Require a deliberate confirmation before overriding a non-READY decision
  // (ALREADY_EXISTS / NEEDS_CLARIFICATION) and generating a PRD anyway.
  const [confirmOverride, setConfirmOverride] = useState(false);
  const hasBlocking = feature.pullRequests.some(
    (pr: any) => (pr.reviews[0]?.blockingCount ?? 0) > 0
  );
  const shipped = feature.status === "SHIPPED";
  const isDiscovery = feature.status === "DISCOVERY";
  const isGenerating = feature.status === "GENERATING_PRD";

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6">
      <div>
        <Link
          href={`/dashboard/${workspaceId}/projects`}
          className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-4"
        >
          <ArrowLeft className="mr-1 h-4 w-4" /> Back to projects
        </Link>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
              {feature.title}
            </h1>
            <p className="text-muted-foreground mt-1">{feature.project.name}</p>
          </div>
          <span
            className={`self-start px-3 py-1 rounded-full text-xs font-semibold ${
              STATUS_STYLES[feature.status] ?? "bg-muted"
            }`}
          >
            {feature.status}
          </span>
        </div>
      </div>

      {/* Phase 1 — Product Discovery */}
      {isDiscovery && (
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Sparkles className="h-5 w-5 text-primary" /> Product Discovery
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              The AI Product Manager reviews your request, checks for existing
              functionality, and asks for missing context before writing a PRD.
            </p>

            {(analyze.error || generatePRD.error || answer.error) && (
              <p className="text-sm text-red-400">
                {analyze.error?.message ||
                  generatePRD.error?.message ||
                  answer.error?.message}
              </p>
            )}

            {!clar && (
              <Button
                onClick={() => analyze.mutate({ featureRequestId })}
                disabled={analyze.isPending}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {analyze.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="mr-2 h-4 w-4" />
                )}
                Analyze Request
              </Button>
            )}

            {clar && (
              <div className="space-y-4">
                {clar.decision === "ALREADY_EXISTS" && (
                  <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-sm">
                    <p className="flex items-center gap-2 font-medium text-amber-400">
                      <Info className="h-4 w-4" /> This may already exist
                    </p>
                    <p className="text-muted-foreground mt-1">
                      {clar.existingFeatureNote || clar.reasoning}
                    </p>
                  </div>
                )}

                {clar.decision === "NEEDS_CLARIFICATION" && (
                  <ClarifyQuestions
                    questions={clar.clarifyingQuestions ?? []}
                    reasoning={clar.reasoning}
                    pending={answer.isPending}
                    onSubmit={(text) =>
                      answer.mutate({ featureRequestId, answers: text })
                    }
                  />
                )}

                {clar.decision === "READY" && (
                  <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm">
                    <p className="flex items-center gap-2 font-medium text-emerald-400">
                      <CheckCircle2 className="h-4 w-4" /> Ready to spec
                    </p>
                    <p className="text-muted-foreground mt-1">{clar.reasoning}</p>
                  </div>
                )}

                {/* Override confirmation: skipping a non-READY decision must be deliberate. */}
                {clar.decision !== "READY" && confirmOverride && (
                  <p className="text-sm text-amber-400">
                    The analysis didn’t mark this request as ready
                    {clar.decision === "ALREADY_EXISTS"
                      ? " (it may already exist)"
                      : " (more context was requested)"}
                    . Generate the PRD anyway? Click again to confirm.
                  </p>
                )}
                <div className="flex flex-wrap gap-2">
                  <Button
                    onClick={() => {
                      if (clar.decision !== "READY" && !confirmOverride) {
                        setConfirmOverride(true);
                        return;
                      }
                      generatePRD.mutate({ featureRequestId });
                    }}
                    disabled={generatePRD.isPending}
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    {generatePRD.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Sparkles className="mr-2 h-4 w-4" />
                    )}
                    {clar.decision === "READY"
                      ? "Generate PRD & Tasks"
                      : confirmOverride
                        ? "Confirm: Generate anyway"
                        : "Generate PRD anyway"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setConfirmOverride(false);
                      analyze.mutate({ featureRequestId });
                    }}
                    disabled={analyze.isPending}
                  >
                    Re-analyze
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Async PRD generation in progress */}
      {isGenerating && (
        <Card className="border-border">
          <CardContent className="flex items-center gap-3 p-6">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <div>
              <p className="font-medium">Drafting your PRD…</p>
              <p className="text-sm text-muted-foreground">
                Running as a background workflow. This page updates
                automatically.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* PRD + editor */}
      {prd && <PrdSection prd={prd} content={content} onSaved={() => featureQuery.refetch()} />}

      {/* Tasks */}
      {prd?.tasks?.length ? (
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-lg">Engineering Tasks</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {prd.tasks.map((t: any) => (
              <div
                key={t.id}
                className="flex items-start gap-3 rounded-lg border border-border p-3"
              >
                <span className="font-mono text-xs text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                  SF-{t.ref}
                </span>
                <div>
                  <p className="font-medium">{t.title}</p>
                  <p className="text-sm text-muted-foreground">{t.description}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      {/* Pull requests + AI reviews */}
      {prd && (
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <GitPullRequest className="h-5 w-5 text-primary" /> Pull Requests &amp;
              AI Review
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {runReview.error && (
              <p className="text-sm text-red-400">{runReview.error.message}</p>
            )}
            {feature.pullRequests.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No pull requests linked yet. Reference a task (e.g.{" "}
                <code className="text-primary">Closes SF-1</code>) in a PR
                description to link it automatically.
              </p>
            ) : (
              feature.pullRequests.map((pr: any) => {
                const latest = pr.reviews[0];
                return (
                  <div key={pr.id} className="rounded-lg border border-border p-4">
                    <div className="flex items-center justify-between gap-3">
                      <a
                        href={pr.url}
                        target="_blank"
                        rel="noreferrer"
                        className="font-medium hover:text-primary"
                      >
                        #{pr.number} {pr.title}
                      </a>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={runReview.isPending}
                        onClick={() => runReview.mutate({ pullRequestId: pr.id })}
                      >
                        {runReview.isPending &&
                        runReview.variables?.pullRequestId === pr.id ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : null}
                        Run AI Review
                      </Button>
                    </div>

                    {latest ? (
                      <div className="mt-3 space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          {latest.blockingCount > 0 ? (
                            <span className="inline-flex items-center gap-1 text-red-400">
                              <ShieldAlert className="h-4 w-4" />
                              {latest.blockingCount} blocking
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-emerald-400">
                              <ShieldCheck className="h-4 w-4" /> Passed AI review
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {latest.summary}
                        </p>
                        <div className="space-y-1">
                          {(Array.isArray(latest.issuesJson)
                            ? latest.issuesJson
                            : []
                          ).map((issue: any, i: number) => (
                            <div
                              key={i}
                              className="text-xs rounded border border-border px-2 py-1"
                            >
                              <span
                                className={
                                  issue.severity === "BLOCKING"
                                    ? "text-red-400 font-semibold"
                                    : "text-amber-400 font-semibold"
                                }
                              >
                                {issue.severity}
                              </span>{" "}
                              <span className="text-muted-foreground">
                                [{issue.category}]
                              </span>{" "}
                              {issue.title}
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <p className="mt-2 text-sm text-muted-foreground">
                        Queued / not yet reviewed.
                      </p>
                    )}
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      )}

      {/* Workflow activity (async Inngest runs) */}
      {workflows.data && workflows.data.length > 0 && (
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Activity className="h-5 w-5 text-primary" /> Workflow Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {workflows.data.map((run: any) => {
              const steps = Array.isArray(run.stepsJson) ? run.stepsJson : [];
              const color =
                run.status === "RUNNING"
                  ? "text-blue-400"
                  : run.status === "FAILED"
                  ? "text-red-400"
                  : "text-emerald-400";
              return (
                <div key={run.id} className="rounded-lg border border-border p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium">
                      {run.label ?? run.type}
                    </span>
                    <span className={`text-xs inline-flex items-center gap-1 ${color}`}>
                      {run.status === "RUNNING" && (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      )}
                      {run.status}
                    </span>
                  </div>
                  {steps.length > 0 && (
                    <ul className="mt-2 space-y-1">
                      {steps.map((s: any, i: number) => (
                        <li
                          key={i}
                          className="text-xs text-muted-foreground flex items-center gap-2"
                        >
                          <span className="h-1 w-1 rounded-full bg-primary" />
                          {s.label}
                        </li>
                      ))}
                    </ul>
                  )}
                  {run.error && (
                    <p className="text-xs text-red-400 mt-1">{run.error}</p>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Phase 5 — human approval */}
      {prd && (
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-lg">Release Decision</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {shipped ? (
              <p className="inline-flex items-center gap-2 text-primary font-medium">
                <CheckCircle2 className="h-5 w-5" /> Shipped 🎉
              </p>
            ) : (
              <>
                {hasBlocking && (
                  <p className="text-sm text-red-400">
                    Resolve all blocking issues before shipping.
                  </p>
                )}
                {(approve.error || reject.error) && (
                  <p className="text-sm text-red-400">
                    {approve.error?.message || reject.error?.message}
                  </p>
                )}
                <div className="flex gap-3">
                  <Button
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                    disabled={hasBlocking || approve.isPending}
                    onClick={() => approve.mutate({ featureRequestId })}
                  >
                    {approve.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                    )}
                    Approve &amp; Ship
                  </Button>
                  <Button
                    variant="outline"
                    disabled={reject.isPending}
                    onClick={() => reject.mutate({ featureRequestId })}
                  >
                    <XCircle className="mr-2 h-4 w-4" /> Reject
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Only workspace Admins or Leads can approve a release.
                </p>
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function ClarifyQuestions({
  questions,
  reasoning,
  pending,
  onSubmit,
}: {
  questions: string[];
  reasoning: string;
  pending: boolean;
  onSubmit: (text: string) => void;
}) {
  const [text, setText] = useState("");
  return (
    <div className="rounded-lg border border-border p-4 space-y-3">
      <p className="flex items-center gap-2 font-medium text-foreground">
        <HelpCircle className="h-4 w-4 text-primary" /> A few questions first
      </p>
      <p className="text-sm text-muted-foreground">{reasoning}</p>
      <ul className="list-disc pl-5 space-y-1 text-sm">
        {questions.map((q, i) => (
          <li key={i}>{q}</li>
        ))}
      </ul>
      <Textarea
        placeholder="Answer the questions here to give the AI more context…"
        className="h-28"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <Button
        size="sm"
        disabled={!text.trim() || pending}
        onClick={() => onSubmit(text)}
      >
        {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Submit Answers
      </Button>
    </div>
  );
}

function PrdSection({
  prd,
  content,
  onSaved,
}: {
  prd: any;
  content: any;
  onSaved: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({
    problemStatement: content.problemStatement ?? "",
    goals: (content.goals ?? []).join("\n"),
    nonGoals: (content.nonGoals ?? []).join("\n"),
    userStories: (content.userStories ?? []).join("\n"),
    acceptanceCriteria: (content.acceptanceCriteria ?? []).join("\n"),
    edgeCases: (content.edgeCases ?? []).join("\n"),
    successMetrics: (content.successMetrics ?? []).join("\n"),
  });

  const update = trpc.prd.update.useMutation({
    onSuccess: () => {
      setEditing(false);
      onSaved();
    },
  });

  const toLines = (s: string) =>
    s
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);

  const save = () =>
    update.mutate({
      prdId: prd.id,
      content: {
        problemStatement: draft.problemStatement,
        goals: toLines(draft.goals),
        nonGoals: toLines(draft.nonGoals),
        userStories: toLines(draft.userStories),
        acceptanceCriteria: toLines(draft.acceptanceCriteria),
        edgeCases: toLines(draft.edgeCases),
        successMetrics: toLines(draft.successMetrics),
      },
    });

  return (
    <Card className="border-border">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Sparkles className="h-5 w-5 text-primary" /> Product Requirements
        </CardTitle>
        {!editing ? (
          <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
            <Pencil className="mr-2 h-4 w-4" /> Edit
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button size="sm" disabled={update.isPending} onClick={save}>
              {update.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Save
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setEditing(false)}
            >
              Cancel
            </Button>
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        {editing ? (
          <div className="space-y-4">
            <EditField
              label="Problem statement"
              value={draft.problemStatement}
              onChange={(v) => setDraft({ ...draft, problemStatement: v })}
            />
            <EditField
              label="Goals (one per line)"
              value={draft.goals}
              onChange={(v) => setDraft({ ...draft, goals: v })}
            />
            <EditField
              label="Non-goals (one per line)"
              value={draft.nonGoals}
              onChange={(v) => setDraft({ ...draft, nonGoals: v })}
            />
            <EditField
              label="User stories (one per line)"
              value={draft.userStories}
              onChange={(v) => setDraft({ ...draft, userStories: v })}
            />
            <EditField
              label="Acceptance criteria (one per line)"
              value={draft.acceptanceCriteria}
              onChange={(v) => setDraft({ ...draft, acceptanceCriteria: v })}
            />
            <EditField
              label="Edge cases (one per line)"
              value={draft.edgeCases}
              onChange={(v) => setDraft({ ...draft, edgeCases: v })}
            />
            <EditField
              label="Success metrics (one per line)"
              value={draft.successMetrics}
              onChange={(v) => setDraft({ ...draft, successMetrics: v })}
            />
          </div>
        ) : (
          <>
            <Section title="Problem">
              <p className="text-muted-foreground">{content.problemStatement}</p>
            </Section>
            <BulletSection title="Goals" items={content.goals} />
            <BulletSection title="Non-goals" items={content.nonGoals} />
            <BulletSection title="User stories" items={content.userStories} />
            <BulletSection
              title="Acceptance criteria"
              items={content.acceptanceCriteria}
            />
            <BulletSection title="Edge cases" items={content.edgeCases} />
            <BulletSection title="Success metrics" items={content.successMetrics} />
          </>
        )}
      </CardContent>
    </Card>
  );
}

function EditField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="font-semibold block mb-1">{label}</label>
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="min-h-20"
      />
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="font-semibold mb-1">{title}</h3>
      {children}
    </div>
  );
}

function BulletSection({ title, items }: { title: string; items?: string[] }) {
  if (!items || items.length === 0) return null;
  return (
    <div>
      <h3 className="font-semibold mb-1">{title}</h3>
      <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
        {items.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
