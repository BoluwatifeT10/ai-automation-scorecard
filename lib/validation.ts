import { z } from "zod";
import { calculate } from "./calculations";
import type {
  AssessmentInput,
  CategoryValue,
  CurrencyCode,
  DataQuality,
  FormValues,
  FrequencyValue,
  Scorecard,
} from "./types";
import { CATEGORIES, CURRENCIES, FREQUENCIES } from "./types";

export const EMPTY_FORM: FormValues = {
  workflowName: "",
  businessCategory: "",
  description: "",
  monthlyTaskVolume: "",
  frequency: "",
  manualMinutesPerTask: "",
  peopleInvolved: "",
  hourlyLaborCost: "",
  currency: "",
  automatedMinutesPerTask: "",
  interventionMinutesPerTask: "",
  monthlySoftwareCost: "",
  monthlyApiCost: "",
  otherRecurringCosts: "",
  implementationCost: "",
  implementationLifespanMonths: "",
  totalEvaluated: "",
  successfulTasks: "",
  failedTasks: "",
  tasksRequiringCorrection: "",
  correctionMinutes: "",
  dataQuality: "",
};

export type FieldErrors = Partial<Record<keyof FormValues | "form", string>>;

const MAX_VALUE = 1_000_000_000_000;

function numericIssue(
  label: string,
  required: boolean,
  raw: string,
  min = 0,
  tooSmall?: string,
): string | null {
  const value = raw.trim();
  if (value === "") return required ? `Enter ${label}.` : null;
  if (value.startsWith("-")) return "Enter zero or a positive number.";
  const normalized = value.replace(/,/g, "");
  if (!/^\d+(\.\d+)?$/.test(normalized)) {
    return "Use digits and a decimal point. For example, 12.5.";
  }
  const parsed = Number(normalized);
  if (!Number.isFinite(parsed)) return "Enter a valid number.";
  if (parsed < min) return tooSmall ?? "Enter zero or a positive number.";
  if (parsed > MAX_VALUE) return "Enter a smaller value.";
  return null;
}

function readNumber(raw: string): number {
  return Number(raw.trim().replace(/,/g, ""));
}

function optionalNumber(raw: string): number | null {
  return raw.trim() === "" ? null : readNumber(raw);
}

const categoryValues = CATEGORIES.map((item) => item.value) as [CategoryValue, ...CategoryValue[]];
const frequencyValues = FREQUENCIES.map((item) => item.value) as [FrequencyValue, ...FrequencyValue[]];
const currencyValues = [...CURRENCIES] as [CurrencyCode, ...CurrencyCode[]];

const step1Schema = z.object({
  workflowName: z
    .string()
    .trim()
    .min(1, "Enter a workflow name.")
    .max(120, "Use 120 characters or fewer."),
  businessCategory: z.enum(categoryValues, { message: "Select a business category." }),
  description: z.string().trim().max(600, "Use 600 characters or fewer."),
  monthlyTaskVolume: z.string(),
  frequency: z.enum(frequencyValues, { message: "Select how often this runs." }),
});

const step2Schema = z.object({
  manualMinutesPerTask: z.string(),
  peopleInvolved: z.string(),
  hourlyLaborCost: z.string(),
  currency: z.enum(currencyValues, { message: "Select a currency." }),
});

const step3Schema = z.object({
  automatedMinutesPerTask: z.string(),
  interventionMinutesPerTask: z.string(),
  monthlySoftwareCost: z.string(),
  monthlyApiCost: z.string(),
  otherRecurringCosts: z.string(),
  implementationCost: z.string(),
  implementationLifespanMonths: z.string(),
});

const step4Schema = z.object({
  totalEvaluated: z.string(),
  successfulTasks: z.string(),
  failedTasks: z.string(),
  tasksRequiringCorrection: z.string(),
  correctionMinutes: z.string(),
  dataQuality: z.enum(["measured", "estimated"], {
    message: "Say whether these figures are measured or estimated.",
  }),
});

function issuesFrom(result: z.SafeParseReturnType<unknown, unknown>): FieldErrors {
  if (result.success) return {};
  const errors: FieldErrors = {};
  for (const issue of result.error.issues) {
    const key = String(issue.path[0] ?? "form") as keyof FieldErrors;
    if (!errors[key]) errors[key] = issue.message;
  }
  return errors;
}

function checkNumber(
  errors: FieldErrors,
  key: keyof FormValues,
  label: string,
  raw: string,
  required: boolean,
  min = 0,
  tooSmall?: string,
) {
  const message = numericIssue(label, required, raw, min, tooSmall);
  if (message) errors[key] = message;
}

export function validateStep(step: number, values: FormValues): FieldErrors {
  if (step === 1) {
    const errors = issuesFrom(step1Schema.safeParse(values));
    checkNumber(
      errors,
      "monthlyTaskVolume",
      "the monthly task volume",
      values.monthlyTaskVolume,
      true,
      0.0000001,
      "Enter a monthly task volume greater than zero.",
    );
    return errors;
  }

  if (step === 2) {
    const errors = issuesFrom(step2Schema.safeParse(values));
    checkNumber(errors, "manualMinutesPerTask", "the manual minutes per task", values.manualMinutesPerTask, true);
    checkNumber(errors, "hourlyLaborCost", "the hourly labor cost", values.hourlyLaborCost, true);
    if (values.peopleInvolved.trim() !== "") {
      checkNumber(
        errors,
        "peopleInvolved",
        "the number of people",
        values.peopleInvolved,
        false,
        1,
        "Enter at least 1 person, or leave this blank.",
      );
      if (!errors.peopleInvolved && !Number.isInteger(readNumber(values.peopleInvolved))) {
        errors.peopleInvolved = "Enter a whole number of people.";
      }
    }
    return errors;
  }

  if (step === 3) {
    const errors: FieldErrors = {};
    checkNumber(errors, "automatedMinutesPerTask", "the automated processing minutes", values.automatedMinutesPerTask, true);
    checkNumber(
      errors,
      "interventionMinutesPerTask",
      "the human review minutes",
      values.interventionMinutesPerTask,
      true,
    );
    checkNumber(errors, "monthlySoftwareCost", "the software cost", values.monthlySoftwareCost, false);
    checkNumber(errors, "monthlyApiCost", "the API or model cost", values.monthlyApiCost, false);
    checkNumber(errors, "otherRecurringCosts", "the other recurring costs", values.otherRecurringCosts, false);
    checkNumber(errors, "implementationCost", "the implementation cost", values.implementationCost, false);
    checkNumber(
      errors,
      "implementationLifespanMonths",
      "the useful lifespan",
      values.implementationLifespanMonths,
      false,
      0.000001,
    );

    const cost = values.implementationCost.trim();
    const life = values.implementationLifespanMonths.trim();
    if (cost && !life && !errors.implementationCost) {
      errors.implementationLifespanMonths =
        "Enter the useful lifespan in months so this cost can be amortized, or clear both fields.";
    }
    if (life && !cost && !errors.implementationLifespanMonths) {
      errors.implementationCost =
        "Enter the one-time implementation cost, or clear both fields.";
    }
    if (cost && life && !errors.implementationLifespanMonths && !errors.implementationCost) {
      if (readNumber(life) <= 0) {
        errors.implementationLifespanMonths = "Enter a lifespan of at least a fraction of a month, or clear both fields.";
      }
    }
    return errors;
  }

  const errors = issuesFrom(step4Schema.safeParse(values));
  const fields: Array<[keyof FormValues, string, boolean]> = [
    ["totalEvaluated", "the number of evaluated tasks", false],
    ["successfulTasks", "the successful tasks", false],
    ["failedTasks", "the failed tasks", false],
    ["tasksRequiringCorrection", "the tasks needing correction", false],
    ["correctionMinutes", "the correction minutes", false],
  ];
  for (const [key, label] of fields) {
    checkNumber(errors, key, label, values[key], false);
  }

  const anyQuality = [
    values.totalEvaluated,
    values.successfulTasks,
    values.failedTasks,
    values.tasksRequiringCorrection,
    values.correctionMinutes,
  ].some((value) => value.trim() !== "");

  if (anyQuality && values.totalEvaluated.trim() === "") {
    errors.totalEvaluated = "Enter the total number of tasks in the sample.";
  }

  if (values.totalEvaluated.trim() !== "" && !errors.totalEvaluated) {
    if (values.successfulTasks.trim() === "") {
      errors.successfulTasks = "Enter 0 if none of the evaluated tasks succeeded.";
    }
    if (values.failedTasks.trim() === "") {
      errors.failedTasks = "Enter 0 if none of the evaluated tasks failed.";
    }
    if (values.tasksRequiringCorrection.trim() === "") {
      errors.tasksRequiringCorrection = "Enter 0 if none of the evaluated tasks needed correction.";
    }
  }

  if (values.correctionMinutes.trim() !== "" && values.tasksRequiringCorrection.trim() === "") {
    errors.tasksRequiringCorrection =
      "Enter how many tasks needed correction so this time is not applied to every task.";
  }

  const ready = (key: keyof FormValues) => values[key].trim() !== "" && !errors[key];
  if (ready("totalEvaluated") && ready("successfulTasks") && ready("failedTasks")) {
    const total = readNumber(values.totalEvaluated);
    const success = readNumber(values.successfulTasks);
    const failed = readNumber(values.failedTasks);
    if (success + failed > total + 1e-9) {
      errors.failedTasks =
        "Successful tasks and failed tasks together cannot exceed the total evaluated tasks.";
    }
  }
  if (ready("totalEvaluated") && ready("tasksRequiringCorrection")) {
    if (readNumber(values.tasksRequiringCorrection) > readNumber(values.totalEvaluated) + 1e-9) {
      errors.tasksRequiringCorrection = "Tasks needing correction cannot exceed the total evaluated tasks.";
    }
  }

  return errors;
}

export function validateAll(values: FormValues): FieldErrors {
  return {
    ...validateStep(1, values),
    ...validateStep(2, values),
    ...validateStep(3, values),
    ...validateStep(4, values),
  };
}

function moneyOrZero(raw: string): number {
  return raw.trim() === "" ? 0 : readNumber(raw);
}

export function toAssessmentInput(values: FormValues): AssessmentInput {
  const errors = validateAll(values);
  if (Object.keys(errors).length > 0) {
    throw new Error("Assessment is incomplete.");
  }

  const total = optionalNumber(values.totalEvaluated);

  return {
    workflowName: values.workflowName.trim(),
    businessCategory: values.businessCategory as CategoryValue,
    description: values.description.trim(),
    monthlyTaskVolume: readNumber(values.monthlyTaskVolume),
    frequency: values.frequency as FrequencyValue,
    manualMinutesPerTask: readNumber(values.manualMinutesPerTask),
    peopleInvolved: optionalNumber(values.peopleInvolved),
    hourlyLaborCost: readNumber(values.hourlyLaborCost),
    currency: values.currency as CurrencyCode,
    automatedMinutesPerTask: readNumber(values.automatedMinutesPerTask),
    interventionMinutesPerTask: readNumber(values.interventionMinutesPerTask),
    monthlySoftwareCost: moneyOrZero(values.monthlySoftwareCost),
    monthlyApiCost: moneyOrZero(values.monthlyApiCost),
    otherRecurringCosts: moneyOrZero(values.otherRecurringCosts),
    implementationCost: optionalNumber(values.implementationCost),
    implementationLifespanMonths: optionalNumber(values.implementationLifespanMonths),
    totalEvaluated: total,
    successfulTasks: total == null ? null : optionalNumber(values.successfulTasks),
    failedTasks: total == null ? null : optionalNumber(values.failedTasks),
    tasksRequiringCorrection: total == null ? null : optionalNumber(values.tasksRequiringCorrection),
    averageCorrectionMinutes: optionalNumber(values.correctionMinutes),
    dataQuality: values.dataQuality as DataQuality,
  };
}

export function tryCoreScorecard(values: FormValues): Scorecard | null {
  const volumeError = numericIssue("volume", true, values.monthlyTaskVolume, 0.000001);
  const manualError = numericIssue("manual", true, values.manualMinutesPerTask);
  const rateError = numericIssue("rate", true, values.hourlyLaborCost);
  const autoError = numericIssue("auto", true, values.automatedMinutesPerTask);
  const reviewError = numericIssue("review", true, values.interventionMinutesPerTask);
  const currencyOk = CURRENCIES.includes(values.currency as CurrencyCode);
  if (volumeError || manualError || rateError || autoError || reviewError || !currencyOk) return null;
  if (readNumber(values.monthlyTaskVolume) <= 0) return null;

  const costFields: Array<keyof FormValues> = [
    "monthlySoftwareCost",
    "monthlyApiCost",
    "otherRecurringCosts",
  ];
  for (const key of costFields) {
    if (numericIssue("cost", false, values[key])) return null;
  }

  const input: AssessmentInput = {
    workflowName: values.workflowName.trim() || "Draft workflow",
    businessCategory: (CATEGORIES.some((item) => item.value === values.businessCategory)
      ? values.businessCategory
      : "other") as CategoryValue,
    description: values.description.trim(),
    monthlyTaskVolume: readNumber(values.monthlyTaskVolume),
    frequency: (FREQUENCIES.some((item) => item.value === values.frequency)
      ? values.frequency
      : "monthly") as FrequencyValue,
    manualMinutesPerTask: readNumber(values.manualMinutesPerTask),
    peopleInvolved: null,
    hourlyLaborCost: readNumber(values.hourlyLaborCost),
    currency: values.currency as CurrencyCode,
    automatedMinutesPerTask: readNumber(values.automatedMinutesPerTask),
    interventionMinutesPerTask: readNumber(values.interventionMinutesPerTask),
    monthlySoftwareCost: moneyOrZero(values.monthlySoftwareCost),
    monthlyApiCost: moneyOrZero(values.monthlyApiCost),
    otherRecurringCosts: moneyOrZero(values.otherRecurringCosts),
    implementationCost: null,
    implementationLifespanMonths: null,
    totalEvaluated: null,
    successfulTasks: null,
    failedTasks: null,
    tasksRequiringCorrection: null,
    averageCorrectionMinutes: null,
    dataQuality: values.dataQuality === "measured" ? "measured" : "estimated",
  };

  return calculate(input);
}
