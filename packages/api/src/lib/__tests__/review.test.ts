import { describe, it, expect } from "vitest";
import { formatReviewComment } from "../review";

describe("review pure logic", () => {
  it("should format review comments without issues", () => {
    const result = {
      summary: "Looks good",
      meetsAcceptanceCriteria: true,
      issues: [],
      dimensions: [],
      suggestedTests: [],
    };
    const comment = formatReviewComment(result, 0);
    expect(comment).toContain("No issues found. ✅");
    expect(comment).toContain("Looks good");
  });

  it("should format review comments with blocking issues", () => {
    const result = {
      summary: "Needs work",
      meetsAcceptanceCriteria: false,
      issues: [
        {
          severity: "BLOCKING" as const,
          category: "SECURITY" as const,
          title: "SQL Injection",
          detail: "Found query string concat",
          file: "db.ts",
        },
      ],
      dimensions: [],
      suggestedTests: [],
    };
    const comment = formatReviewComment(result, 1);
    expect(comment).toContain("1 blocking");
    expect(comment).toContain("🔴 BLOCKING");
    expect(comment).toContain("[SECURITY] SQL Injection");
    expect(comment).toContain("db.ts");
  });
});
