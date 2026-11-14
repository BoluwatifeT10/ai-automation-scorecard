import { formatCount, formatMoney, formatNumber, roundTo } from "./format";
import type {
  AssessmentInput,
  BreakEven,
  CategoryScore,
  RatioResult,
  RoiResult,
  Scorecard,
  WaterfallBar,
} from "./types";

const ACCURACY_MAX = 40;
const INTERVENTION_MAX = 20;
const TIME_MAX = 20;
const FINANCIAL_MAX = 20;

export function pointsForAccuracy(percent: number | null): number {
  if (percent == null) return 0;
  if (percent >= 98) return 40;
  if (percent >= 95) return 36;
  if (percent >= 90) return 30;
  if (percent >= 80) return 20;
  return 10;
}

export function pointsForIntervention(percent: number | null): number {
  if (percent == null) return 0;
  if (percent <= 5) return 20;
  if (percent <= 10) return 16;
  if (percent <= 20) return 12;
  if (percent <= 40) return 6;
  return 2;
}

export function pointsForTime(percent: number | null): number {
  if (percent == null) return 0;
  if (percent >= 80) return 20;
  if (percent >= 60) return 16;
  if (percent >= 40) return 12;
  if (percent >= 20) return 6;
  return 2;
}

export function pointsForFinancial(netRounded: number, roiPercent: number | null): number {
  if (netRounded === 0) return 8;
  if (netRounded < 0) return 2;
  if (roiPercent == null) return 20;
  if (roiPercent > 100) return 20;
  if (roiPercent >= 50) return 16;
  if (roiPercent >= 0) return 12;
  return 2;
}

function hours(tasks: number, minutes: number): number {
  return (tasks * minutes) / 60;
}

function ratio(part: number | null, total: number | null): RatioResult {
  if (total == null || total <= 0 || part == null) {
    return { status: "insufficient", percent: null };
  }
  return { status: "value", percent: roundTo((part / total) * 100, 2) };
}

function band(total: number): { bandLabel: string; bandSummary: string } {
  if (total >= 80) {
    return {
      bandLabel: "Strong performance",
      bandSummary:
        "Most scored categories land in the upper bands of this framework. Treat the result as a planning signal, and keep measuring the workflow.",
    };
  }
  if (total >= 60) {
    return {
      bandLabel: "Performing, with room for improvement",
      bandSummary:
        "The workflow is producing measurable value, and at least one category still has room to improve.",
    };
  }
  if (total >= 40) {
    return {
      bandLabel: "Needs optimization",
      bandSummary:
        "The current mix of time, cost, or quality is limiting the result. The category breakdown shows where to look first.",
    };
  }
  return {
    bandLabel: "Underperforming",
    bandSummary:
      "On the numbers entered, this workflow scores in the lowest band of the framework. Review time, cost, and quality before expanding it.",
  };
}

function buildWaterfall(input: {
  manualLaborValue: number;
  automatedLaborValue: number;
  monthlyOperatingCost: number;
  monthlyImplementationCost: number;
  netMonthlyBenefit: number;
}): WaterfallBar[] {
  const bars: WaterfallBar[] = [];
  let cursor = 0;

  const add = (
    label: string,
    shortLabel: string,
    delta: number,
    tone: WaterfallBar["tone"],
  ) => {
    const base = delta >= 0 ? cursor : cursor + delta;
    bars.push({
      label,
      shortLabel,
      base,
      value: Math.abs(delta),
      signed: delta,
      tone,
    });
    cursor += delta;
  };

  add("Manual labor value", "Manual labor", input.manualLaborValue, "neutral");
  add("Automated labor value", "Human labor", -input.automatedLaborValue, "cost");
  add("Operating costs", "Operating cost", -input.monthlyOperatingCost, "cost");
  if (input.monthlyImplementationCost > 0) {
    add(
      "Implementation amortization",
      "Setup / month",
      -input.monthlyImplementationCost,
      "cost",
    );
  }

  const net = input.netMonthlyBenefit;
  bars.push({
    label: "Estimated monthly net financial benefit",
    shortLabel: "Net benefit",
    base: 0,
    value: net,
    signed: net,
    tone: roundTo(net, 2) < 0 ? "negative" : "positive",
  });

  return bars;
}

function buildBreakEven(
  input: AssessmentInput,
  savingsPerTask: number,
  operating: number,
  fullMonthly: number,
): BreakEven {
  const savings = roundTo(savingsPerTask, 4);
  const currency = input.currency;

  if (savings <= 0) {
    return {
      savingsPerTask: savings,
      status: "no_savings",
      tasksForOperatingCost: null,
      tasksForFullMonthlyCost: null,
      summary:
        "Increasing volume alone will not produce break-even through labor savings. Each additional task costs at least as much labor value as it saves.",
    };
  }

  if (operating <= 0 && fullMonthly <= 0) {
    return {
      savingsPerTask: savings,
      status: "no_cost",
      tasksForOperatingCost: 0,
      tasksForFullMonthlyCost: 0,
      summary: `Operating costs are zero, so there is no monthly cost to recover. Labor value saved is about ${formatMoney(savings, currency)} per task.`,
    };
  }

  const tasksForOperating =
    operating > 0 ? Math.ceil(operating / savings - 1e-9) : 0;
  const tasksForFull =
    fullMonthly > 0 ? Math.ceil(fullMonthly / savings - 1e-9) : 0;
  const current = input.monthlyTaskVolume;
  const comparison =
    operating > 0
      ? current >= tasksForOperating
        ? `Current volume of ${formatCount(current)} is at or above that level.`
        : `Current volume of ${formatCount(current)} is below that level.`
      : `Current volume is ${formatCount(current)}.`;

  const operatingSentence =
    operating > 0
      ? `About ${formatCount(tasksForOperating)} tasks per month would cover operating costs of ${formatMoney(operating, currency)}.`
      : "There is no separate operating bill to cover.";

  const fullSentence =
    fullMonthly > operating
      ? ` About ${formatCount(tasksForFull)} tasks per month would also cover amortized implementation cost.`
      : "";

  return {
    savingsPerTask: savings,
    status: "volume",
    tasksForOperatingCost: tasksForOperating,
    tasksForFullMonthlyCost: tasksForFull,
    summary: `${operatingSentence}${fullSentence} Labor value saved is about ${formatMoney(savings, currency)} per task. ${comparison}`,
  };
}

export function calculate(input: AssessmentInput): Scorecard {
  const volume = input.monthlyTaskVolume;
  const manualHours = hours(volume, input.manualMinutesPerTask);
  const processingHours = hours(volume, input.automatedMinutesPerTask);
  const routineInterventionHours = hours(volume, input.interventionMinutesPerTask);

  const accuracy = ratio(input.successfulTasks, input.totalEvaluated);
  const errorRate = ratio(input.failedTasks, input.totalEvaluated);
  const interventionRate = ratio(input.tasksRequiringCorrection, input.totalEvaluated);

  let additionalCorrectionHours = 0;
  let estimatedCorrectedTasks: number | null = null;
  let correctionNote: Scorecard["correctionNote"] = "no_sample";

  const sampleSize = input.totalEvaluated;
  const hasSample = sampleSize != null && sampleSize > 0;
  const correctionMinutes = input.averageCorrectionMinutes;
  const correctionTasks = input.tasksRequiringCorrection;

  if (!hasSample || sampleSize == null || correctionTasks == null) {
    correctionNote = correctionMinutes != null ? "not_supplied" : "no_sample";
  } else {
    estimatedCorrectedTasks = volume * (correctionTasks / sampleSize);
    if (correctionMinutes == null) {
      correctionNote = "not_supplied";
    } else {
      const extraMinutes = Math.max(0, correctionMinutes - input.interventionMinutesPerTask);
      additionalCorrectionHours = (estimatedCorrectedTasks * extraMinutes) / 60;
      if (extraMinutes > 0 && estimatedCorrectedTasks > 0) correctionNote = "added";
      else if (
        correctionMinutes > 0 &&
        correctionMinutes <= input.interventionMinutesPerTask &&
        estimatedCorrectedTasks > 0
      ) {
        correctionNote = "already_included";
      } else correctionNote = "not_supplied";
    }
  }

  const humanHours = routineInterventionHours + additionalCorrectionHours;
  const netHoursSaved = manualHours - processingHours - humanHours;
  const timeSavedPercent =
    manualHours > 0 ? roundTo((netHoursSaved / manualHours) * 100, 2) : null;

  const manualLaborValue = manualHours * input.hourlyLaborCost;
  const automatedLaborValue = humanHours * input.hourlyLaborCost;
  const laborValueSaved = manualLaborValue - automatedLaborValue;

  const monthlyOperatingCost =
    input.monthlySoftwareCost + input.monthlyApiCost + input.otherRecurringCosts;

  const lifespan = input.implementationLifespanMonths;
  const implementationCost = input.implementationCost;
  const implementationExcluded =
    implementationCost != null &&
    implementationCost > 0 &&
    (lifespan == null || lifespan <= 0);
  const monthlyImplementationCost =
    implementationCost != null && lifespan != null && lifespan > 0
      ? implementationCost / lifespan
      : 0;

  const netMonthlyBenefit =
    manualLaborValue -
    automatedLaborValue -
    monthlyOperatingCost -
    monthlyImplementationCost;
  const monthlyAutomationCost = monthlyOperatingCost + monthlyImplementationCost;
  const netRounded = roundTo(netMonthlyBenefit, 2);

  let roi: RoiResult;
  if (monthlyAutomationCost <= 0) {
    roi = {
      status: "not_applicable",
      percent: null,
      reason:
        "Monthly automation cost is zero, so ROI cannot be calculated. A zero denominator would not be a meaningful return.",
    };
  } else {
    roi = {
      status: "value",
      percent: roundTo((netMonthlyBenefit / monthlyAutomationCost) * 100, 2),
      reason:
        "Estimated monthly ROI compares net financial benefit with monthly automation cost, including amortized implementation cost when it was entered.",
    };
  }

  const averageExtraMinutes =
    volume > 0 ? (additionalCorrectionHours * 60) / volume : 0;
  const savingsPerTask =
    ((input.manualMinutesPerTask - input.interventionMinutesPerTask - averageExtraMinutes) /
      60) *
    input.hourlyLaborCost;

  const breakEven = buildBreakEven(
    input,
    savingsPerTask,
    monthlyOperatingCost,
    monthlyAutomationCost,
  );

  const accuracyPoints = pointsForAccuracy(accuracy.percent);
  const interventionPoints = pointsForIntervention(interventionRate.percent);
  const timePoints = pointsForTime(timeSavedPercent);
  const financialPoints = pointsForFinancial(
    netRounded,
    roi.status === "value" ? roi.percent : null,
  );

  const accuracyScore: CategoryScore = {
    id: "accuracy",
    label: "Accuracy",
    points: accuracyPoints,
    max: ACCURACY_MAX,
    provisional: accuracy.status === "insufficient",
    explanation:
      accuracy.status === "insufficient"
        ? "No evaluated sample was entered. This category scores 0 of 40 until successful and failed tasks are recorded."
        : `Accuracy is ${formatNumber(accuracy.percent ?? 0, 2)}%. That scores ${accuracyPoints} of 40.`,
  };

  const interventionScore: CategoryScore = {
    id: "intervention",
    label: "Human intervention",
    points: interventionPoints,
    max: INTERVENTION_MAX,
    provisional: interventionRate.status === "insufficient",
    explanation:
      interventionRate.status === "insufficient"
        ? "No correction sample was entered. This category scores 0 of 20. Review minutes are still included in time and labor value."
        : `${formatNumber(interventionRate.percent ?? 0, 2)}% of evaluated tasks needed correction. That scores ${interventionPoints} of 20. This rate is separate from review minutes per task.`,
  };

  const timeScore: CategoryScore = {
    id: "time",
    label: "Time efficiency",
    points: timePoints,
    max: TIME_MAX,
    provisional: timeSavedPercent == null,
    explanation:
      timeSavedPercent == null
        ? "Manual time is zero, so the share of time saved cannot be calculated. This category scores 0 of 20."
        : `${formatNumber(timeSavedPercent, 2)}% of manual time is saved after automated processing and human time. That scores ${timePoints} of 20.`,
  };

  const financialProvisional = implementationExcluded;
  const financialScore: CategoryScore = {
    id: "financial",
    label: "Financial performance",
    points: financialPoints,
    max: FINANCIAL_MAX,
    provisional: financialProvisional,
    explanation: financialExplanation(netRounded, roi, financialPoints, implementationExcluded),
  };

  const reasons: string[] = [];
  if (input.dataQuality === "estimated") {
    reasons.push("You marked the inputs as estimates.");
  }
  if (accuracyScore.provisional) {
    reasons.push("Accuracy data is missing, so that category scores 0.");
  }
  if (interventionScore.provisional) {
    reasons.push("The human-intervention rate is missing, so that category scores 0.");
  }
  if (timeScore.provisional) {
    reasons.push("Time efficiency could not be calculated.");
  }
  if (financialScore.provisional) {
    reasons.push(
      "A one-time implementation cost was entered without a lifespan, so it is excluded from the monthly result.",
    );
  }

  const total =
    accuracyScore.points +
    interventionScore.points +
    timeScore.points +
    financialScore.points;
  const provisional = reasons.length > 0;
  const { bandLabel, bandSummary } = band(total);

  const completenessItems = [
    { label: "Workflow name", ok: input.workflowName.trim().length > 0 },
    { label: "Monthly task volume", ok: input.monthlyTaskVolume > 0 },
    { label: "Manual time per task", ok: input.manualMinutesPerTask >= 0 },
    { label: "Hourly labor cost", ok: input.hourlyLaborCost >= 0 },
    { label: "Automated processing time", ok: input.automatedMinutesPerTask >= 0 },
    { label: "Human review time", ok: input.interventionMinutesPerTask >= 0 },
    { label: "Evaluated tasks", ok: hasSample },
    {
      label: "Successful tasks",
      ok: hasSample && input.successfulTasks != null,
    },
    { label: "Failed tasks", ok: hasSample && input.failedTasks != null },
    {
      label: "Tasks needing correction",
      ok: hasSample && input.tasksRequiringCorrection != null,
    },
  ];
  const missing = completenessItems.filter((item) => !item.ok).map((item) => item.label);
  const completeness = {
    percent: Math.round(
      ((completenessItems.length - missing.length) / completenessItems.length) * 100,
    ),
    missing,
  };

  return {
    input,
    manualHours,
    processingHours,
    routineInterventionHours,
    additionalCorrectionHours,
    humanHours,
    netHoursSaved,
    timeSavedPercent,
    manualLaborValue,
    automatedLaborValue,
    laborValueSaved,
    monthlyOperatingCost,
    monthlyImplementationCost,
    implementationExcluded,
    netMonthlyBenefit,
    monthlyAutomationCost,
    roi,
    accuracy,
    errorRate,
    interventionRate,
    estimatedCorrectedTasks,
    correctionNote,
    breakEven,
    waterfall: buildWaterfall({
      manualLaborValue,
      automatedLaborValue,
      monthlyOperatingCost,
      monthlyImplementationCost,
      netMonthlyBenefit,
    }),
    score: {
      accuracy: accuracyScore,
      intervention: interventionScore,
      time: timeScore,
      financial: financialScore,
      total,
      provisional,
      reasons,
      bandLabel,
      bandSummary,
    },
    completeness,
  };
}

function financialExplanation(
  netRounded: number,
  roi: RoiResult,
  points: number,
  implementationExcluded: boolean,
): string {
  const exclusion = implementationExcluded
    ? " The one-time implementation cost is not in this monthly figure because no lifespan was entered."
    : "";
  if (netRounded === 0) {
    return `The monthly result rounds to break-even, which scores ${points} of 20.${exclusion}`;
  }
  if (netRounded < 0) {
    return `Estimated monthly net financial benefit is negative, which scores ${points} of 20.${exclusion}`;
  }
  if (roi.status === "not_applicable") {
    return `Net benefit is positive and monthly automation cost is zero, so ROI is not applicable. That scores ${points} of 20.${exclusion}`;
  }
  return `Net benefit is positive and estimated monthly ROI is ${formatNumber(roi.percent ?? 0, 2)}%, which scores ${points} of 20.${exclusion}`;
}
