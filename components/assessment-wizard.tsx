"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useAssessment } from "@/context/assessment-context";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Button, cn, fieldClass } from "@/components/ui";
import { ESTIMATE_DISCLAIMER } from "@/lib/content";
import { formatHours, formatMoney } from "@/lib/format";
import { CATEGORIES, CURRENCIES, FREQUENCIES, type FormValues } from "@/lib/types";
import { EMPTY_FORM, toAssessmentInput, tryCoreScorecard, validateAll, validateStep, type FieldErrors } from "@/lib/validation";

const STEPS = [
  {
    title: "What are you automating?",
    explanation: "Name the workflow and how much of it runs each month. Frequency is context. The monthly volume is what the math uses.",
  },
  {
    title: "How much does this task cost without automation?",
    explanation: "The tool uses the labor cost you supply. It does not assume a universal wage.",
  },
  {
    title: "What happens after automation?",
    explanation: "Separate machine time, human review, and the bills you actually pay. Optional costs can stay blank.",
  },
  {
    title: "How reliably does your automation work?",
    explanation: "A counted sample is what makes accuracy meaningful. Leave the sample blank if you have not measured it.",
  },
];

export function AssessmentWizard() {
  const router = useRouter();
  const { draft, hydrated, resetId, setValues, setProgress, markAssessed, reset } = useAssessment();
  const methods = useForm<FormValues>({ defaultValues: EMPTY_FORM, shouldUnregister: false });
  const { register, getValues, reset: resetForm, watch } = methods;
  const [ready, setReady] = useState(false);
  const [step, setStep] = useState(1);
  const [maxReached, setMaxReached] = useState(1);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [errorNonce, setErrorNonce] = useState(0);
  const [confirmReset, setConfirmReset] = useState(false);
  const summaryRef = useRef<HTMLDivElement>(null);
  const draftRef = useRef(draft);
  draftRef.current = draft;

  useEffect(() => {
    if (!hydrated) return;
    resetForm(draftRef.current.values);
    setStep(draftRef.current.step);
    setMaxReached(draftRef.current.maxStep);
    setErrors({});
    setReady(true);
  }, [hydrated, resetId, resetForm]);

  useEffect(() => {
    const subscription = watch((values) => {
      setValues(values as FormValues);
      setErrors((current) => (Object.keys(current).length ? {} : current));
    });
    return () => subscription.unsubscribe();
  }, [setValues, watch]);

  useEffect(() => {
    if (!ready) return;
    setProgress(step, maxReached);
  }, [maxReached, ready, setProgress, step]);

  useEffect(() => {
    if (errorNonce) summaryRef.current?.focus();
  }, [errorNonce]);

  const values = watch();
  const estimate = ready ? tryCoreScorecard(values) : null;
  const errorEntries = Object.entries(errors).filter((entry): entry is [string, string] => Boolean(entry[1]));

  const fail = (next: FieldErrors, nextStep = step) => {
    setStep(nextStep);
    setErrors(next);
    setErrorNonce((current) => current + 1);
  };

  const goTo = (target: number) => {
    if (target === step) return;
    if (target < step) {
      setStep(target);
      setErrors({});
      return;
    }
    const currentValues = getValues();
    for (let index = 1; index < target; index += 1) {
      const nextErrors = validateStep(index, currentValues);
      if (Object.keys(nextErrors).length) {
        fail(nextErrors, index);
        return;
      }
    }
    setMaxReached((current) => Math.max(current, target));
    setStep(target);
    setErrors({});
  };

  const onContinue = () => {
    const currentValues = getValues();
    if (step < 4) {
      const nextErrors = validateStep(step, currentValues);
      if (Object.keys(nextErrors).length) {
        fail(nextErrors);
        return;
      }
      setMaxReached((current) => Math.max(current, step + 1));
      setStep(step + 1);
      setErrors({});
      return;
    }

    for (let index = 1; index <= 4; index += 1) {
      const nextErrors = validateStep(index, currentValues);
      if (Object.keys(nextErrors).length) {
        fail(nextErrors, index);
        return;
      }
    }
    if (Object.keys(validateAll(currentValues)).length) return;
    toAssessmentInput(currentValues);
    markAssessed(new Date().toISOString());
    router.push("/results");
  };

  if (!ready) {
    return (
      <div className="mx-auto max-w-content px-4 py-10 sm:px-6">
        <div className="h-8 w-48 rounded bg-elevated" />
        <div className="mt-6 h-64 rounded-lg border border-line bg-card" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-content px-4 py-8 sm:px-6 sm:py-10">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-accent">Assessment</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">Evaluate one workflow</h1>
        </div>
        <Button variant="ghost" onClick={() => setConfirmReset(true)}>
          Reset saved data
        </Button>
      </div>

      <div className="mt-6">
        <div className="mb-2 flex items-center justify-between text-sm text-muted">
          <p>
            Step {step} of {STEPS.length}
          </p>
          <p>{STEPS[step - 1].title}</p>
        </div>
        <div
          className="h-1.5 overflow-hidden rounded-full bg-line"
          role="progressbar"
          aria-valuemin={1}
          aria-valuemax={4}
          aria-valuenow={step}
          aria-label="Assessment progress"
        >
          <div className="h-full bg-accent transition-[width] duration-200" style={{ width: `${(step / 4) * 100}%` }} />
        </div>
        <ol className="mt-4 grid grid-cols-4 gap-2">
          {STEPS.map((item, index) => {
            const number = index + 1;
            const active = number === step;
            return (
              <li key={item.title}>
                <button
                  type="button"
                  onClick={() => goTo(number)}
                  aria-current={active ? "step" : undefined}
                  className={cn(
                    "min-h-11 w-full rounded-md border px-2 py-2 text-left text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent sm:text-sm",
                    active ? "border-accent bg-elevated text-text" : "border-line text-muted hover:text-text",
                  )}
                >
                  <span className="tabular-nums">{number.toString().padStart(2, "0")}</span>
                  <span className="mt-1 hidden sm:block">{item.title}</span>
                </button>
              </li>
            );
          })}
        </ol>
      </div>

      <form
        className="mt-6"
        onSubmit={(event) => {
          event.preventDefault();
          onContinue();
        }}
        noValidate
      >
        <div className="rounded-lg border border-line bg-card p-5 sm:p-6">
          <h2 className="text-2xl font-semibold tracking-tight">{STEPS[step - 1].title}</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">{STEPS[step - 1].explanation}</p>

          {errorEntries.length ? (
            <div
              ref={summaryRef}
              tabIndex={-1}
              role="alert"
              className="mt-4 rounded-md border border-danger/40 bg-danger/10 px-3 py-3 text-sm text-text outline-none"
            >
              Fix {errorEntries.length === 1 ? "this field" : "these fields"} before continuing.
              <ul className="mt-2 list-disc pl-5 text-muted">
                {errorEntries.map(([key, message]) => (
                  <li key={key}>{message}</li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            {step === 1 ? <StepOne register={register} errors={errors} /> : null}
            {step === 2 ? <StepTwo register={register} errors={errors} /> : null}
            {step === 3 ? <StepThree register={register} errors={errors} /> : null}
            {step === 4 ? <StepFour register={register} errors={errors} dataQuality={values.dataQuality} /> : null}
          </div>
        </div>

        {estimate ? (
          <p className="mt-4 rounded-md border border-line bg-surface px-3 py-3 text-sm leading-6 text-muted">
            Live estimate from the numbers on this form:{" "}
            <span className="font-semibold text-text tabular-nums">{formatHours(estimate.netHoursSaved)}</span> net hours
            saved and{" "}
            <span className={cn("font-semibold tabular-nums", estimate.netMonthlyBenefit < 0 ? "text-danger" : "text-success")}>
              {formatMoney(estimate.netMonthlyBenefit, estimate.input.currency)}
            </span>{" "}
            estimated monthly net financial benefit. Quality is not included until you finish the assessment.
          </p>
        ) : null}

        <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
          <Button variant="secondary" onClick={() => goTo(step - 1)} disabled={step === 1} className="w-full sm:w-auto">
            <ChevronLeft aria-hidden="true" size={16} />
            Back
          </Button>
          <Button type="submit" className="w-full sm:w-auto">
            {step === 4 ? (draft.assessedAt ? "Update scorecard" : "View scorecard") : "Continue"}
            <ChevronRight aria-hidden="true" size={16} />
          </Button>
        </div>
      </form>

      <ConfirmDialog
        open={confirmReset}
        title="Clear this assessment?"
        body="This removes the saved draft and report from this browser."
        confirmLabel="Reset"
        onClose={() => setConfirmReset(false)}
        onConfirm={() => {
          reset();
          setConfirmReset(false);
        }}
      />
    </div>
  );
}

function Field({
  label,
  hint,
  example,
  error,
  children,
  className,
}: {
  label: string;
  hint?: string;
  example?: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("block", className)}>
      <span className="text-sm font-medium">{label}</span>
      {example ? <span className="mt-1 block text-sm text-muted">Example: {example}</span> : null}
      <span className="mt-2 block">{children}</span>
      {hint ? <span className="mt-2 block text-sm leading-6 text-muted">{hint}</span> : null}
      {error ? (
        <span className="mt-2 block text-sm text-danger" role="alert">
          {error}
        </span>
      ) : null}
    </label>
  );
}

function StepOne({
  register,
  errors,
}: {
  register: ReturnType<typeof useForm<FormValues>>["register"];
  errors: FieldErrors;
}) {
  return (
    <>
      <Field className="sm:col-span-2" label="Workflow name" example="Lead qualification" error={errors.workflowName}>
        <input id="workflowName" className={fieldClass} aria-invalid={Boolean(errors.workflowName)} {...register("workflowName")} />
      </Field>
      <Field label="Business category" error={errors.businessCategory}>
        <select id="businessCategory" className={fieldClass} defaultValue="" aria-invalid={Boolean(errors.businessCategory)} {...register("businessCategory")}>
          <option value="" disabled>
            Select a category
          </option>
          {CATEGORIES.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Automation frequency" hint="Describes the rhythm. Calculations use the monthly volume you enter." error={errors.frequency}>
        <select id="frequency" className={fieldClass} defaultValue="" aria-invalid={Boolean(errors.frequency)} {...register("frequency")}>
          <option value="" disabled>
            Select a frequency
          </option>
          {FREQUENCIES.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
      </Field>
      <Field
        className="sm:col-span-2"
        label="What does this automation do?"
        hint="Optional. This is shown on the report and is not used in the math."
        error={errors.description}
      >
        <textarea id="description" rows={3} className={fieldClass} {...register("description")} />
      </Field>
      <Field
        className="sm:col-span-2"
        label="Monthly task volume"
        hint="How many tasks this workflow handles in a typical month."
        example="400"
        error={errors.monthlyTaskVolume}
      >
        <input id="monthlyTaskVolume" inputMode="decimal" className={cn(fieldClass, "tabular-nums")} aria-invalid={Boolean(errors.monthlyTaskVolume)} {...register("monthlyTaskVolume")} />
      </Field>
    </>
  );
}

function StepTwo({
  register,
  errors,
}: {
  register: ReturnType<typeof useForm<FormValues>>["register"];
  errors: FieldErrors;
}) {
  return (
    <>
      <Field label="Average manual completion time per task" hint="Minutes, before automation." example="12" error={errors.manualMinutesPerTask}>
        <input id="manualMinutesPerTask" inputMode="decimal" className={cn(fieldClass, "tabular-nums")} aria-invalid={Boolean(errors.manualMinutesPerTask)} {...register("manualMinutesPerTask")} />
      </Field>
      <Field
        label="Number of people involved"
        hint="Optional context. Headcount is not multiplied into the labor cost. If several people work one task, include their combined minutes above and use a blended hourly cost."
        error={errors.peopleInvolved}
      >
        <input id="peopleInvolved" inputMode="numeric" className={cn(fieldClass, "tabular-nums")} {...register("peopleInvolved")} />
      </Field>
      <Field label="Average hourly labor cost" hint="Use the cost you would apply to this work. The tool does not assume a wage." example="25" error={errors.hourlyLaborCost}>
        <input id="hourlyLaborCost" inputMode="decimal" className={cn(fieldClass, "tabular-nums")} aria-invalid={Boolean(errors.hourlyLaborCost)} {...register("hourlyLaborCost")} />
      </Field>
      <Field label="Currency" error={errors.currency}>
        <select id="currency" className={fieldClass} defaultValue="" aria-invalid={Boolean(errors.currency)} {...register("currency")}>
          <option value="" disabled>
            Select a currency
          </option>
          {CURRENCIES.map((currency) => (
            <option key={currency} value={currency}>
              {currency}
            </option>
          ))}
        </select>
      </Field>
    </>
  );
}

function StepThree({
  register,
  errors,
}: {
  register: ReturnType<typeof useForm<FormValues>>["register"];
  errors: FieldErrors;
}) {
  return (
    <>
      <Field
        label="Average automated processing time per task"
        hint="Machine time in minutes. It is counted in hours saved and is not multiplied by the hourly labor cost."
        example="1"
        error={errors.automatedMinutesPerTask}
      >
        <input id="automatedMinutesPerTask" inputMode="decimal" className={cn(fieldClass, "tabular-nums")} aria-invalid={Boolean(errors.automatedMinutesPerTask)} {...register("automatedMinutesPerTask")} />
      </Field>
      <Field
        label="Average human review or intervention time per task"
        hint="Minutes a person spends on each task, including tasks that do not need a correction."
        example="2"
        error={errors.interventionMinutesPerTask}
      >
        <input id="interventionMinutesPerTask" inputMode="decimal" className={cn(fieldClass, "tabular-nums")} aria-invalid={Boolean(errors.interventionMinutesPerTask)} {...register("interventionMinutesPerTask")} />
      </Field>
      <Field label="Monthly automation software cost" hint="Leave blank if you do not pay a separate subscription. Blank is counted as zero." error={errors.monthlySoftwareCost}>
        <input id="monthlySoftwareCost" inputMode="decimal" className={cn(fieldClass, "tabular-nums")} placeholder="0" {...register("monthlySoftwareCost")} />
      </Field>
      <Field label="Monthly API or model usage cost" hint="Leave blank if this is already inside the software cost, or if there is no usage bill." error={errors.monthlyApiCost}>
        <input id="monthlyApiCost" inputMode="decimal" className={cn(fieldClass, "tabular-nums")} placeholder="0" {...register("monthlyApiCost")} />
      </Field>
      <Field className="sm:col-span-2" label="Other recurring operating costs" hint="Optional monthly costs that exist only because this automation runs." error={errors.otherRecurringCosts}>
        <input id="otherRecurringCosts" inputMode="decimal" className={cn(fieldClass, "tabular-nums")} placeholder="0" {...register("otherRecurringCosts")} />
      </Field>
      <Field
        label="One-time implementation cost"
        hint="Optional. If you enter a cost, also enter how many months you expect the setup to stay in use."
        error={errors.implementationCost}
      >
        <input id="implementationCost" inputMode="decimal" className={cn(fieldClass, "tabular-nums")} {...register("implementationCost")} />
      </Field>
      <Field label="Expected useful lifespan" hint="Months. Used only to spread the one-time cost. This is an economic cost, not a vendor bill." error={errors.implementationLifespanMonths}>
        <input id="implementationLifespanMonths" inputMode="decimal" className={cn(fieldClass, "tabular-nums")} {...register("implementationLifespanMonths")} />
      </Field>
    </>
  );
}

function StepFour({
  register,
  errors,
  dataQuality,
}: {
  register: ReturnType<typeof useForm<FormValues>>["register"];
  errors: FieldErrors;
  dataQuality: string;
}) {
  return (
    <>
      <fieldset className="sm:col-span-2">
        <legend className="text-sm font-medium">Are these figures measured or estimated?</legend>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {[
            ["measured", "I have measured data"],
            ["estimated", "I am estimating"],
          ].map(([value, label]) => (
            <label key={value} className={cn("flex min-h-11 cursor-pointer items-center gap-3 rounded-md border px-3", dataQuality === value ? "border-accent bg-elevated" : "border-line")}>
              <input type="radio" value={value} className="h-4 w-4 accent-[#477BFF]" {...register("dataQuality")} />
              <span className="text-sm">{label}</span>
            </label>
          ))}
        </div>
        {errors.dataQuality ? (
          <p className="mt-2 text-sm text-danger" role="alert">
            {errors.dataQuality}
          </p>
        ) : null}
      </fieldset>
      <p className="rounded-md border border-warning/40 bg-warning/10 px-3 py-3 text-sm leading-6 text-text sm:col-span-2" role="note">
        {ESTIMATE_DISCLAIMER}
      </p>
      <Field label="Total automated tasks evaluated" hint="Size of the sample you are judging." error={errors.totalEvaluated}>
        <input id="totalEvaluated" inputMode="decimal" className={cn(fieldClass, "tabular-nums")} {...register("totalEvaluated")} />
      </Field>
      <Field label="Successfully completed tasks" error={errors.successfulTasks}>
        <input id="successfulTasks" inputMode="decimal" className={cn(fieldClass, "tabular-nums")} {...register("successfulTasks")} />
      </Field>
      <Field label="Failed or incorrect tasks" error={errors.failedTasks}>
        <input id="failedTasks" inputMode="decimal" className={cn(fieldClass, "tabular-nums")} {...register("failedTasks")} />
      </Field>
      <Field
        label="Tasks requiring human correction"
        hint="This count is the intervention rate. It is not the same as review minutes per task."
        error={errors.tasksRequiringCorrection}
      >
        <input id="tasksRequiringCorrection" inputMode="decimal" className={cn(fieldClass, "tabular-nums")} {...register("tasksRequiringCorrection")} />
      </Field>
      <Field
        className="sm:col-span-2"
        label="Average correction time in minutes"
        hint="Optional. If this already includes the review time entered earlier, only the extra minutes are added, and only for the share of tasks that need correction."
        error={errors.correctionMinutes}
      >
        <input id="correctionMinutes" inputMode="decimal" className={cn(fieldClass, "tabular-nums")} {...register("correctionMinutes")} />
      </Field>
    </>
  );
}
