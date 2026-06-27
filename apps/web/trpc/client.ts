import { createTRPCReact, type CreateTRPCReact } from "@trpc/react-query";
import type { AppRouter } from "@repo/api";

export const trpc: CreateTRPCReact<AppRouter, any, any> = createTRPCReact<AppRouter>();
