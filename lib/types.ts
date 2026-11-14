export const CURRENCIES = ["USD", "EUR", "GBP", "NGN", "CAD", "AUD"] as const;
export type CurrencyCode = (typeof CURRENCIES)[number];

export const CATEGORIES = [
  { value: "agency", label: "Agency" },
  { value: "ecommerce", label: "E-commerce" },
  { value: "freelancing", label: "Freelancing" },
  { value: "content", label: "Content creation" },
  { value: "consulting", label: "Consulting" },
  { value: "support", label: "Customer support" },
  { value: "sales", label: "Sales" },
  { value: "administration", label: "Administration" },
  { value: "other", label: "Other" },
] as const;

export type CategoryValue = (typeof CATEGORIES)[number]["value"];

export const FREQUENCIES = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "on_demand", label: "On demand" },
] as const;

export type FrequencyValue = (typeof FREQUENCIES)[number]["value"];

export type DataQuality = "measured" | "estimated";

export interface FormValues {
  workflowName: string;
  businessCategory: string;
  description: string;
  monthlyTaskVolume: string;
  frequency: string;
  manualMinutesPerTask: string;
  peopleInvolved: string;
  hourlyLaborCost: string;
  currency: string;
  automatedMinutesPerTask: string;
  interventionMinutesPerTask: string;
  monthlySoftwareCost: string;
  monthlyApiCost: string;
  otherRecurringCosts: string;
  implementationCost: string;
  implementationLifespanMonths: string;
  totalEvaluated: string;
  successfulTasks: string;
  failedTasks: string;
  tasksRequiringCorrection: string;
  correctionMinutes: string;
  dataQuality: string;
}

export interface AssessmentInput {
  workflowName: string;
  businessCategory: CategoryValue;
  description: string;
  monthlyTaskVolume: number;
  frequency: FrequencyValue;
  manualMinutesPerTask: number;
  peopleInvolved: number | null;
  hourlyLaborCost: number;
  currency: CurrencyCode;
  automatedMinutesPerTask: number;
  interventionMinutesPerTask: number;
  monthlySoftwareCost: number;
  monthlyApiCost: number;
  otherRecurringCosts: number;
  implementationCost: number | null;
  implementationLifespanMonths: number | null;
  totalEvaluated: number | null;
  successfulTasks: number | null;
  failedTasks: number | null;
  tasksRequiringCorrection: number | null;
  averageCorrectionMinutes: number | null;
  dataQuality: DataQuality;
}

export interface RatioResult {
  status: "value" | "insufficient";
  percent: number | null;
}

export interface RoiResult {
  status: "value" | "not_applicable";
  percent: number | null;
  reason: string;
}

export interface BreakEven {
  savingsPerTask: number;
  status: "no_savings" | "no_cost" | "volume";
  tasksForOperatingCost: number | null;
  tasksForFullMonthlyCost: number | null;
  summary: string;
}

export interface WaterfallBar {
  label: string;
  shortLabel: string;
  base: number;
  value: number;
  signed: number;
  tone: "neutral" | "cost" | "positive" | "negative";
}

export interface CategoryScore {
  id: "accuracy" | "intervention" | "time" | "financial";
  label: string;
  points: number;
  max: number;
  provisional: boolean;
  explanation: string;
}

export interface Scorecard {
  input: AssessmentInput;
  manualHours: number;
  processingHours: number;
  routineInterventionHours: number;
  additionalCorrectionHours: number;
  humanHours: number;
  netHoursSaved: number;
  timeSavedPercent: number | null;
  manualLaborValue: number;
  automatedLaborValue: number;
  laborValueSaved: number;
  monthlyOperatingCost: number;
  monthlyImplementationCost: number;
  implementationExcluded: boolean;
  netMonthlyBenefit: number;
  monthlyAutomationCost: number;
  roi: RoiResult;
  accuracy: RatioResult;
  errorRate: RatioResult;
  interventionRate: RatioResult;
  estimatedCorrectedTasks: number | null;
  correctionNote: "not_supplied" | "already_included" | "added" | "no_sample";
  breakEven: BreakEven;
  waterfall: WaterfallBar[];
  score: {
    accuracy: CategoryScore;
    intervention: CategoryScore;
    time: CategoryScore;
    financial: CategoryScore;
    total: number;
    provisional: boolean;
    reasons: string[];
    bandLabel: string;
    bandSummary: string;
  };
  completeness: {
    percent: number;
    missing: string[];
  };
}

export interface Recommendation {
  id: string;
  title: string;
  detail: string;
}
