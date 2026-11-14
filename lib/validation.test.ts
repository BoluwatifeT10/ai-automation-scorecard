import { describe, expect, it } from "vitest";
import { EMPTY_FORM, toAssessmentInput, validateAll, validateStep } from "./validation";
import type { FormValues } from "./types";

function form(overrides: Partial<FormValues> = {}): FormValues {
  return {
    ...EMPTY_FORM,
    workflowName: "Inbox triage",
    businessCategory: "support",
    monthlyTaskVolume: "1,000",
    frequency: "daily",
    manualMinutesPerTask: "10",
    hourlyLaborCost: "20",
    currency: "USD",
    automatedMinutesPerTask: "2",
    interventionMinutesPerTask: "1",
    dataQuality: "measured",
    ...overrides,
  };
}

describe("validation", () => {
  it("rejects negative numbers and empty required fields", () => {
    const errors = validateStep(2, form({ manualMinutesPerTask: "-5", hourlyLaborCost: "", currency: "" }));
    expect(errors.manualMinutesPerTask).toMatch(/positive/i);
    expect(errors.hourlyLaborCost).toBeTruthy();
    expect(errors.currency).toBeTruthy();
  });

  it("accepts decimals and thousands separators", () => {
    const errors = validateAll(form({ manualMinutesPerTask: "10.5", monthlyTaskVolume: "1,000.5" }));
    expect(errors.manualMinutesPerTask).toBeUndefined();
    expect(errors.monthlyTaskVolume).toBeUndefined();
    const input = toAssessmentInput(form({ manualMinutesPerTask: "10.5", monthlyTaskVolume: "1,000" }));
    expect(input.manualMinutesPerTask).toBe(10.5);
    expect(input.monthlyTaskVolume).toBe(1000);
    expect(input.monthlySoftwareCost).toBe(0);
  });

  it("stops successful and failed tasks from exceeding the sample", () => {
    const errors = validateStep(
      4,
      form({
        totalEvaluated: "10",
        successfulTasks: "8",
        failedTasks: "4",
        tasksRequiringCorrection: "2",
      }),
    );
    expect(errors.failedTasks).toMatch(/cannot exceed/i);
  });

  it("does not rewrite a blank quality sample into zeros", () => {
    const errors = validateAll(form());
    expect(errors.totalEvaluated).toBeUndefined();
    const input = toAssessmentInput(form());
    expect(input.totalEvaluated).toBeNull();
    expect(input.successfulTasks).toBeNull();
  });

  it("requires an explicit zero when a sample total is entered", () => {
    const errors = validateStep(4, form({ totalEvaluated: "20", successfulTasks: "", failedTasks: "" }));
    expect(errors.successfulTasks).toMatch(/Enter 0/i);
    expect(errors.failedTasks).toMatch(/Enter 0/i);
  });

  it("requires lifespan when an implementation cost is entered", () => {
    const errors = validateStep(3, form({ implementationCost: "1200" }));
    expect(errors.implementationLifespanMonths).toMatch(/lifespan/i);
  });
});
