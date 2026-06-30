import "server-only";

import { createTRPCContext } from "@repo/api";
import { appRouter } from "@repo/api";
import { headers } from "next/headers";

// Explicit return annotation avoids TS2742 ("inferred type cannot be named")
// now that the router's output types reference shared lib types.
export const getTRPCServer = async (): Promise<
  ReturnType<typeof appRouter.createCaller>
> => {
  return appRouter.createCaller(
    await createTRPCContext({ headers: await headers() }),
  );
};
