"use client";

import { use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { trpc } from "@/trpc/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Mail } from "lucide-react";

export default function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);
  const router = useRouter();
  const { data: session, isPending } = useSession();

  const inv = trpc.member.getInvitation.useQuery(
    { token },
    { enabled: !!session }
  );
  const accept = trpc.member.acceptInvitation.useMutation({
    onSuccess: (d) => router.push(`/dashboard/${d.workspaceId}/board`),
  });

  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground p-4">
      <Card className="w-full max-w-md border-border bg-card">
        <CardHeader className="text-center space-y-2">
          <CardTitle className="text-2xl font-bold text-primary">
            Workspace invitation
          </CardTitle>
          <CardDescription>You've been invited to join a MetroFlow workspace.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isPending ? (
            <div className="flex justify-center py-6">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : !session ? (
            <div className="text-center space-y-4">
              <p className="text-sm text-muted-foreground">
                Sign in to accept this invitation.
              </p>
              <Button asChild className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                <Link href={`/login?redirect=/invite/${token}`}>Sign in</Link>
              </Button>
            </div>
          ) : inv.isLoading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : inv.isError || !inv.data ? (
            <p className="text-sm text-red-400 text-center">
              This invitation could not be found.
            </p>
          ) : inv.data.status !== "PENDING" || inv.data.expired ? (
            <p className="text-sm text-red-400 text-center">
              This invitation is no longer valid{inv.data.expired ? " (expired)" : ""}.
            </p>
          ) : (
            <div className="space-y-4">
              <div className="rounded-lg border border-border p-4 text-center">
                <p className="font-semibold text-lg">{inv.data.workspaceName}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Role: {inv.data.role}
                </p>
              </div>

              {!inv.data.emailMatches ? (
                <p className="text-sm text-amber-400 flex items-start gap-2">
                  <Mail className="h-4 w-4 mt-0.5 shrink-0" />
                  This invite was sent to {inv.data.email}. Sign in with that
                  email to accept.
                </p>
              ) : (
                <Button
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                  disabled={accept.isPending}
                  onClick={() => accept.mutate({ token })}
                >
                  {accept.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Accept &amp; join
                </Button>
              )}

              {accept.error && (
                <p className="text-sm text-red-400">{accept.error.message}</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
