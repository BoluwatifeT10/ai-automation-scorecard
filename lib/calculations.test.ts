import { describe, expect, it } from "vitest";
import {
  calculate,
  pointsForAccuracy,
  pointsForFinancial,
  pointsForIntervention,
  pointsForTime,
} from "./calculations";
import { roundTo } from "./format";
import type { AssessmentInput } from "./types";

function base(overrides: Partial<AssessmentInput> = {}): AssessmentInput {
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
    totalEvaluated: null,
    successfulTasks: null,
    failedTasks: null,
    tasksRequiringCorrection: null,
    averageCorrectionMinutes: null,
    dataQuality: "measured",
    ...overrides,
  };
}

describe("calculation engine", () => {
  it("matches the published worked example", () => {
    const result = calculate(base());
    expect(roundTo(result.manualHours, 2)).toBe(166.67);
    expect(roundTo(result.processingHours, 2)).toBe(33.33);
    expect(roundTo(result.routineInterventionHours, 2)).toBe(16.67);
    expect(roundTo(result.netHoursSaved, 2)).toBe(116.67);
    expect(roundTo(result.manualLaborValue, 2)).toBe(3333.33);
    expect(roundTo(result.automatedLaborValue, 2)).toBe(333.33);
    expect(roundTo(result.monthlyOperatingCost, 2)).toBe(150);
    expect(roundTo(result.netMonthlyBenefit, 2)).toBe(2850);
    expect(result.roi.status).toBe("value");
    expect(result.roi.percent).toBe(1900);
    expect(result.timeSavedPercent).toBe(70);
  });

  it("shows a negative financial benefit when costs exceed labor value saved", () => {
    const result = calculate(
      base({
        monthlyTaskVolume: 100,
        manualMinutesPerTask: 5,
        automatedMinutesPerTask: 1,
        interventionMinutesPerTask: 1,
        hourlyLaborCost: 10,
        monthlySoftwareCost: 5000,
        monthlyApiCost: 0,
        otherRecurringCosts: 0,
      }),
    );
    expect(result.netMonthlyBenefit).toBeLessThan(0);
    expect(roundTo(result.netMonthlyBenefit, 2)).toBeLessThan(0);
    const netBar = result.waterfall.find((bar) => bar.shortLabel === "Net benefit");
    expect(netBar?.signed).toBeLessThan(0);
    expect(netBar?.tone).toBe("negative");
  });

  it("does not treat missing accuracy data as 0%", () => {
    const result = calculate(base());
    expect(result.accuracy).toEqual({ status: "insufficient", percent: null });
    expect(result.errorRate.status).toBe("insufficient");
    expect(result.interventionRate.status).toBe("insufficient");
    expect(result.score.accuracy.points).toBe(0);
    expect(result.score.accuracy.provisional).toBe(true);
    expect(result.score.provisional).toBe(true);
    expect(result.score.reasons.join(" ")).toMatch(/Accuracy data is missing/i);
  });

  it("returns not applicable ROI when automation cost is zero", () => {
    const result = calculate(
      base({
        monthlySoftwareCost: 0,
        monthlyApiCost: 0,
        otherRecurringCosts: 0,
      }),
    );
    expect(result.monthlyAutomationCost).toBe(0);
    expect(result.roi).toMatchObject({ status: "not_applicable", percent: null });
    expect(result.score.financial.points).toBe(20);
  });

  it("shows negative time saved when review time exceeds manual time", () => {
    const result = calculate(
      base({
        monthlyTaskVolume: 10,
        manualMinutesPerTask: 5,
        automatedMinutesPerTask: 1,
        interventionMinutesPerTask: 30,
        hourlyLaborCost: 25,
      }),
    );
    expect(result.netHoursSaved).toBeLessThan(0);
    expect(result.timeSavedPercent).toBeLessThan(0);
    expect(result.score.time.points).toBe(2);
  });

  it("does not double-count correction time already covered by review minutes", () => {
    const result = calculate(
      base({
        monthlyTaskVolume: 100,
        interventionMinutesPerTask: 2,
        totalEvaluated: 100,
        successfulTasks: 90,
        failedTasks: 10,
        tasksRequiringCorrection: 10,
        averageCorrectionMinutes: 12,
        monthlySoftwareCost: 0,
        monthlyApiCost: 0,
      }),
    );
    expect(result.routineInterventionHours).toBeCloseTo(100 * 2 / 60, 8);
    expect(result.additionalCorrectionHours).toBeCloseTo((10 * 10) / 60, 8);
    expect(result.humanHours).toBeCloseTo(5, 8);
    expect(result.correctionNote).toBe("added");
    expect(result.interventionRate.percent).toBe(10);
    expect(result.accuracy.percent).toBe(90);
  });

  it("does not add correction minutes that are already inside review time", () => {
    const result = calculate(
      base({
        totalEvaluated: 50,
        successfulTasks: 40,
        failedTasks: 10,
        tasksRequiringCorrection: 10,
        averageCorrectionMinutes: 1,
        interventionMinutesPerTask: 2,
      }),
    );
    expect(result.additionalCorrectionHours).toBe(0);
    expect(result.correctionNote).toBe("already_included");
  });

  it("does not change labor value when headcount is recorded", () => {
    const withoutPeople = calculate(base());
    const withPeople = calculate(base({ peopleInvolved: 5 }));
    expect(withPeople.manualLaborValue).toBe(withoutPeople.manualLaborValue);
    expect(withPeople.netMonthlyBenefit).toBe(withoutPeople.netMonthlyBenefit);
  });

  it("amortizes implementation cost only when a lifespan is provided", () => {
    const amortized = calculate(
      base({ implementationCost: 1200, implementationLifespanMonths: 12 }),
    );
    expect(amortized.monthlyImplementationCost).toBe(100);
    expect(roundTo(amortized.netMonthlyBenefit, 2)).toBe(2750);
    expect(amortized.implementationExcluded).toBe(false);

    const excluded = calculate(base({ implementationCost: 1200, implementationLifespanMonths: null }));
    expect(excluded.monthlyImplementationCost).toBe(0);
    expect(excluded.implementationExcluded).toBe(true);
    expect(roundTo(excluded.netMonthlyBenefit, 2)).toBe(2850);
    expect(excluded.score.financial.provisional).toBe(true);
  });

  it("states that volume alone will not break even when each task saves no labor value", () => {
    const result = calculate(
      base({
        manualMinutesPerTask: 5,
        interventionMinutesPerTask: 8,
        automatedMinutesPerTask: 1,
      }),
    );
    expect(result.breakEven.status).toBe("no_savings");
    expect(result.breakEven.summary).toMatch(/will not produce break-even/i);
  });

  it("scores a complete measured example in the strong band without calling it certified", () => {
    const result = calculate(
      base({
        totalEvaluated: 500,
        successfulTasks: 480,
        failedTasks: 20,
        tasksRequiringCorrection: 20,
        averageCorrectionMinutes: 1,
      }),
    );
    expect(result.accuracy.percent).toBe(96);
    expect(result.score.accuracy.points).toBe(36);
    expect(result.interventionRate.percent).toBe(4);
    expect(result.score.intervention.points).toBe(20);
    expect(result.score.time.points).toBe(16);
    expect(result.score.financial.points).toBe(20);
    expect(result.score.total).toBe(92);
    expect(result.score.bandLabel).toBe("Strong performance");
    expect(result.score.provisional).toBe(false);
    expect(result.completeness.percent).toBe(100);
  });

  it("keeps zero operating cost and zero benefit at break-even", () => {
    const result = calculate(
      base({
        manualMinutesPerTask: 0,
        automatedMinutesPerTask: 0,
        interventionMinutesPerTask: 0,
        hourlyLaborCost: 0,
        monthlySoftwareCost: 0,
        monthlyApiCost: 0,
        monthlyTaskVolume: 10,
      }),
    );
    expect(roundTo(result.netMonthlyBenefit, 2)).toBe(0);
    expect(result.score.financial.points).toBe(8);
    expect(result.roi.status).toBe("not_applicable");
    expect(result.timeSavedPercent).toBeNull();
  });
});

describe("score bands", () => {
  it("maps accuracy thresholds", () => {
    expect(pointsForAccuracy(null)).toBe(0);
    expect(pointsForAccuracy(100)).toBe(40);
    expect(pointsForAccuracy(98)).toBe(40);
    expect(pointsForAccuracy(97.99)).toBe(36);
    expect(pointsForAccuracy(95)).toBe(36);
    expect(pointsForAccuracy(94.99)).toBe(30);
    expect(pointsForAccuracy(90)).toBe(30);
    expect(pointsForAccuracy(89.99)).toBe(20);
    expect(pointsForAccuracy(80)).toBe(20);
    expect(pointsForAccuracy(79.99)).toBe(10);
    expect(pointsForAccuracy(0)).toBe(10);
  });

  it("maps intervention thresholds", () => {
    expect(pointsForIntervention(null)).toBe(0);
    expect(pointsForIntervention(0)).toBe(20);
    expect(pointsForIntervention(5)).toBe(20);
    expect(pointsForIntervention(5.01)).toBe(16);
    expect(pointsForIntervention(10)).toBe(16);
    expect(pointsForIntervention(10.01)).toBe(12);
    expect(pointsForIntervention(20)).toBe(12);
    expect(pointsForIntervention(20.01)).toBe(6);
    expect(pointsForIntervention(40)).toBe(6);
    expect(pointsForIntervention(40.01)).toBe(2);
  });

  it("maps time and financial thresholds", () => {
    expect(pointsForTime(null)).toBe(0);
    expect(pointsForTime(80)).toBe(20);
    expect(pointsForTime(60)).toBe(16);
    expect(pointsForTime(40)).toBe(12);
    expect(pointsForTime(20)).toBe(6);
    expect(pointsForTime(19.99)).toBe(2);
    expect(pointsForTime(-30)).toBe(2);
    expect(pointsForFinancial(0, null)).toBe(8);
    expect(pointsForFinancial(-1, -10)).toBe(2);
    expect(pointsForFinancial(10, 150)).toBe(20);
    expect(pointsForFinancial(10, 100)).toBe(16);
    expect(pointsForFinancial(10, 50)).toBe(16);
    expect(pointsForFinancial(10, 49.99)).toBe(12);
    expect(pointsForFinancial(10, 0)).toBe(12);
    expect(pointsForFinancial(10, null)).toBe(20);
  });
});
