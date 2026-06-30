import "server-only";

import { createTRPCContext } from "@repo/api";
import { appRouter } from "@repo/api";
import { headers } from "next/headers";

export const getTRPCServer = async () => {
  return appRouter.createCaller(
    await createTRPCContext({ headers: await headers() }),
  );
};
