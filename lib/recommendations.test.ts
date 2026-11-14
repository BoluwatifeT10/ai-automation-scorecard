import { describe, expect, it } from "vitest";
import { calculate } from "./calculations";
import { recommend } from "./recommendations";
import type { AssessmentInput } from "./types";

function input(overrides: Partial<AssessmentInput> = {}): AssessmentInput {
  return {
    workflowName: "Lead qualification",
    businessCategory: "sales",
    description: "",
    monthlyTaskVolume: 1000,
    frequency: "daily",
    manualMinutesPerTask: 10,
    peopleInvolved: null,
    hourlyLaborCost: 20,
    currency: "USD",
    automatedMinutesPerTask: 2,
    interventionMinutesPerTask: 1,
    monthlySoftwareCost: 100,
    monthlyApiCost: 50,
    otherRecurringCosts: 0,
    implementationCost: null,
    implementationLifespanMonths: null,
    totalEvaluated: 100,
    successfulTasks: 70,
    failedTasks: 30,
    tasksRequiringCorrection: 40,
    averageCorrectionMinutes: 1,
    dataQuality: "measured",
    ...overrides,
  };
}

describe("recommendations", () => {
  it("ties low accuracy and high intervention to the specified guidance", () => {
    const items = recommend(calculate(input()));
    const text = items.map((item) => item.detail).join(" ");
    expect(text).toMatch(/output validation process/i);
    expect(text).toMatch(/repeated manual correction/i);
  });

  it("asks for a sample when accuracy is missing and does not invent a zero", () => {
    const items = recommend(
      calculate(
        input({
          totalEvaluated: null,
          successfulTasks: null,
          failedTasks: null,
          tasksRequiringCorrection: null,
          dataQuality: "estimated",
        }),
      ),
    );
    const text = items.map((item) => `${item.title} ${item.detail}`).join(" ");
    expect(text).toMatch(/insufficient data/i);
    expect(text).toMatch(/estimates/i);
  });

  it("flags negative time and negative financial benefit from the actual result", () => {
    const items = recommend(
      calculate(
        input({
          manualMinutesPerTask: 4,
          interventionMinutesPerTask: 20,
          monthlySoftwareCost: 8000,
          totalEvaluated: 100,
          successfulTasks: 99,
          failedTasks: 1,
          tasksRequiringCorrection: 2,
        }),
      ),
    );
    const text = items.map((item) => item.detail).join(" ");
    expect(text).toMatch(/original manual process/i);
    expect(text).toMatch(/API usage, software subscriptions/i);
    expect(text).toMatch(/will not produce break-even/i);
  });

  it("includes the follow-up suggestion when the benefit is positive", () => {
    const items = recommend(
      calculate(
        input({
          totalEvaluated: 100,
          successfulTasks: 99,
          failedTasks: 1,
          tasksRequiringCorrection: 1,
        }),
      ),
    );
    expect(items.map((item) => item.detail).join(" ")).toMatch(/another month/i);
  });
});
