import { createTRPCReact, type CreateTRPCReact } from "@trpc/react-query";
import type { AppRouter } from "@repo/api";

// Explicit annotation avoids TS2742 ("inferred type cannot be named") so the
// type is portable across the monorepo and CI `check-types` stays green.
export const trpc: CreateTRPCReact<AppRouter, unknown> =
  createTRPCReact<AppRouter>();
