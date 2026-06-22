import { auth } from "@repo/api";
import { toNodeHandler } from "better-auth/node";

const handler = toNodeHandler(auth);

export { handler as GET, handler as POST };
