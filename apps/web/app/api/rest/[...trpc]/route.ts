import { createOpenApiFetchHandler } from "trpc-to-openapi";
import { appRouter, createTRPCContext } from "@repo/api";
import { NextRequest } from "next/server";

const handler = (req: NextRequest) => {
  return createOpenApiFetchHandler({
    endpoint: "/api/rest",
    router: appRouter,
    createContext: () => createTRPCContext({ headers: req.headers }),
    req,
  });
};

export {
  handler as GET,
  handler as POST,
  handler as PUT,
  handler as PATCH,
  handler as DELETE,
  handler as OPTIONS,
};
