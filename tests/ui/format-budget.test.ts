import { describe, expect, it } from "vitest";
import { formatBudgetAed } from "@/lib/format";

describe("formatBudgetAed", () => {
  it("shows an em dash for empty optional budgets", () => {
    expect(formatBudgetAed(null)).toBe("—");
    expect(formatBudgetAed(undefined)).toBe("—");
  });

  it("formats a genuine zero budget as 0", () => {
    expect(formatBudgetAed(0)).toBe("0");
  });

  it("formats positive budgets with grouping", () => {
    expect(formatBudgetAed(850000)).toBe("850,000");
  });
});
