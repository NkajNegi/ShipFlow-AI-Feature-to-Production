import { tool } from "ai";
import { z } from "zod";
const t = tool({
  description: "test",
  parameters: z.object({ foo: z.string() }),
  execute: async () => ({})
});
console.log(Object.keys(t));
