import { describe, expect, it } from "vitest";
import { calculate } from "./calculations";
import { buildReportSections } from "./pdf";
import type { AssessmentInput } from "./types";

const input: AssessmentInput = {
  workflowName: "Lead qualification",
  businessCategory: "sales",
  description: "Route new leads",
  monthlyTaskVolume: 1000,
  frequency: "daily",
  manualMinutesPerTask: 10,
  peopleInvolved: 2,
  hourlyLaborCost: 20,
  currency: "USD",
  automatedMinutesPerTask: 2,
  interventionMinutesPerTask: 1,
  monthlySoftwareCost: 100,
  monthlyApiCost: 50,
  otherRecurringCosts: 0,
  implementationCost: null,
  implementationLifespanMonths: null,
  totalEvaluated: null,
  successfulTasks: null,
  failedTasks: null,
  tasksRequiringCorrection: null,
  averageCorrectionMinutes: null,
  dataQuality: "measured",
};

describe("report content", () => {
  it("includes the financial result, insufficient accuracy, and the disclaimer", () => {
    const sections = buildReportSections(calculate(input), "2026-11-14T12:00:00.000Z");
    const text = sections.flatMap((section) => [section.heading, ...section.lines]).join("\n");
    expect(text).toContain("USD 2,850.00");
    expect(text).toContain("Insufficient data");
    expect(text).toContain("If the cost is zero, ROI is not applicable.");
    expect(text).toContain("not an independently certified industry benchmark");
    expect(text).toContain("Lead qualification");
  });
});
