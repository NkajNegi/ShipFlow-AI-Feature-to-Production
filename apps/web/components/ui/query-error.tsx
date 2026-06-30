"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Graceful, reusable error state for failed tRPC/React-Query loads.
 * Shows a message and an optional retry, instead of a blank screen or a crash.
 */
export function QueryError({
  title = "Couldn't load this",
  message,
  onRetry,
  retrying,
}: {
  title?: string;
  message?: string;
  onRetry?: () => void;
  retrying?: boolean;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-red-500/20 bg-red-500/[0.04] px-6 py-12 text-center">
      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-red-500/10 text-red-400">
        <AlertTriangle className="h-5 w-5" />
      </div>
      <div>
        <p className="font-semibold text-white">{title}</p>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          {message ?? "Something went wrong while loading. Please try again."}
        </p>
      </div>
      {onRetry && (
        <Button
          variant="outline"
          size="sm"
          onClick={onRetry}
          disabled={retrying}
          className="mt-1"
        >
          <RefreshCw
            className={`h-4 w-4 ${retrying ? "animate-spin" : ""}`}
          />
          Retry
        </Button>
      )}
    </div>
  );
}
