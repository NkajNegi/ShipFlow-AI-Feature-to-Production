import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the AI layer so we can drive the ensemble/critic behaviour deterministically.
vi.mock("../ai", () => ({
  generateEnsembleObject: vi.fn(),
  generateCriticObject: vi.fn(),
}));
// codegen.ts imports these at module load; stub their db/network side effects.
vi.mock("@repo/db", () => ({ prisma: {} }));

import { generateCodePatch } from "../codegen";
import { generateEnsembleObject, generateCriticObject } from "../ai";

const ensemble = vi.mocked(generateEnsembleObject);
const critic = vi.mocked(generateCriticObject);

const baseArgs = {
  keys: {},
  title: "Add dark mode",
  context: "Users want a dark theme.",
  prd: { goals: ["dark mode"] },
  tasks: [{ ref: 1, title: "Add toggle", description: "..." }],
  repoContext: [],
};

function validPatch(path = "src/theme.ts") {
  return {
    files: [
      { path, action: "create" as const, newContent: "export const x = 1;", rationale: "r" },
    ],
    prTitle: "Add dark mode",
    prBody: "Closes SF-1",
    testNotes: ["toggle works"],
  };
}

describe("generateCodePatch — ensemble + critic", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns an approved patch when the critic passes (no revision)", async () => {
    ensemble.mockResolvedValueOnce(validPatch());
    critic.mockResolvedValueOnce({ approved: true, score: 92, issues: [] });

    const out = await generateCodePatch(baseArgs);

    expect(out.critique.approved).toBe(true);
    expect(out.strategy).toContain("approved");
    expect(ensemble).toHaveBeenCalledTimes(1);
    expect(critic).toHaveBeenCalledTimes(1);
  });

  it("revises once when the critic rejects, then re-audits", async () => {
    ensemble
      .mockResolvedValueOnce(validPatch())
      .mockResolvedValueOnce(validPatch("src/theme2.ts"));
    critic
      .mockResolvedValueOnce({
        approved: false,
        score: 30,
        issues: [{ severity: "BLOCKING", title: "Missing test", detail: "no test" }],
      })
      .mockResolvedValueOnce({ approved: true, score: 88, issues: [] });

    const out = await generateCodePatch(baseArgs);

    expect(ensemble).toHaveBeenCalledTimes(2); // draft + revision
    expect(critic).toHaveBeenCalledTimes(2);
    expect(out.strategy).toContain("revision");
    expect(out.critique.approved).toBe(true);
  });

  it("rejects a patch that touches too many files WITHOUT calling the critic", async () => {
    const files = Array.from({ length: 13 }, (_, i) => ({
      path: `src/f${i}.ts`,
      action: "create" as const,
      newContent: "x",
      rationale: "r",
    }));
    ensemble.mockResolvedValueOnce({
      files,
      prTitle: "t",
      prBody: "b",
      testNotes: [],
    });

    const out = await generateCodePatch(baseArgs);

    expect(out.critique.approved).toBe(false);
    // @ts-ignore
    expect(out.critique!.issues![0].title).toBe("Guardrail violation");
    expect(critic).not.toHaveBeenCalled(); // never even audited → never pushed
  });

  it("blocks injection: a patch targeting a protected CI path is rejected", async () => {
    ensemble.mockResolvedValueOnce(validPatch(".github/workflows/evil.yml"));

    const out = await generateCodePatch(baseArgs);

    expect(out.critique.approved).toBe(false);
    // @ts-ignore
    expect(out.critique!.issues![0].detail).toMatch(/protected path/i);
    expect(critic).not.toHaveBeenCalled();
  });

  it("blocks path traversal escaping the repo", async () => {
    ensemble.mockResolvedValueOnce(validPatch("../../etc/passwd"));

    const out = await generateCodePatch(baseArgs);

    expect(out.critique.approved).toBe(false);
    expect(critic).not.toHaveBeenCalled();
  });
});
