"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  BadgeDollarSign,
  Clock,
  Download,
  Pencil,
  Plus,
  Printer,
  RotateCcw,
  Target,
  Users,
} from "lucide-react";
import { TimeChart, WaterfallChart } from "@/components/charts";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Button, ButtonLink, Card, cn } from "@/components/ui";
import { useAssessment } from "@/context/assessment-context";
import { calculate } from "@/lib/calculations";
import { categoryLabel, DISCLAIMER, frequencyLabel } from "@/lib/content";
import { formatCount, formatDate, formatHours, formatMoney, formatNumber, formatPercent } from "@/lib/format";
import { downloadReport } from "@/lib/pdf";
import { recommend } from "@/lib/recommendations";
import { toAssessmentInput } from "@/lib/validation";
import type { RatioResult, Scorecard } from "@/lib/types";

export function ResultsDashboard() {
  const router = useRouter();
  const { draft, hydrated, markAssessed, reset } = useAssessment();
  const [confirmReset, setConfirmReset] = useState(false);
  const [pdfState, setPdfState] = useState<"idle" | "working" | "error">("idle");
  const [notice, setNotice] = useState("");

  const parsed = useMemo(() => {
    if (!hydrated || !draft.assessedAt) return { status: "empty" as const };
    try {
      return {
        status: "ready" as const,
        scorecard: calculate(toAssessmentInput(draft.values)),
        assessedAt: draft.assessedAt,
      };
    } catch {
      return { status: "invalid" as const };
    }
  }, [draft.assessedAt, draft.values, hydrated]);

  if (!hydrated) {
    return (
      <div className="mx-auto max-w-content px-4 py-10 sm:px-6">
        <div className="h-10 w-72 rounded bg-elevated" />
        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }, (_, index) => (
            <div key={index} className="h-32 rounded-lg border border-line bg-card" />
          ))}
        </div>
      </div>
    );
  }

  if (parsed.status === "empty") {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <Card>
          <h1 className="text-3xl font-semibold tracking-tight">No assessment yet</h1>
          <p className="mt-3 text-sm leading-6 text-muted">
            Complete the four-step assessment to calculate hours, cost, accuracy, and the performance score.
          </p>
          <ButtonLink href="/assess" className="mt-6 w-full sm:w-auto">
            Start assessment
          </ButtonLink>
        </Card>
      </div>
    );
  }

  if (parsed.status === "invalid") {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <Card>
          <h1 className="text-3xl font-semibold tracking-tight">This draft needs a correction</h1>
          <p className="mt-3 text-sm leading-6 text-muted">
            A saved value no longer passes validation, so the report is not showing a substituted result.
          </p>
          <ButtonLink href="/assess" className="mt-6 w-full sm:w-auto">
            Edit assessment
          </ButtonLink>
        </Card>
      </div>
    );
  }

  const { scorecard, assessedAt } = parsed;
  const recommendations = recommend(scorecard);
  const currency = scorecard.input.currency;

  const recalculate = () => {
    const next = new Date().toISOString();
    markAssessed(next);
    setNotice("Report recalculated from the current inputs.");
  };

  const download = async () => {
    setPdfState("working");
    setNotice("");
    try {
      await downloadReport(scorecard, assessedAt);
      setPdfState("idle");
    } catch {
      setPdfState("error");
    }
  };

  return (
    <div className="mx-auto max-w-content px-4 py-8 sm:px-6 sm:py-10">
      <div className="print-surface">
        <p className="text-sm font-medium text-accent">Your Automation Performance Report</p>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{scorecard.input.workflowName}</h1>
            <p className="mt-2 text-sm text-muted">
              {formatDate(assessedAt)} · {currency} · {categoryLabel(scorecard.input.businessCategory)} ·{" "}
              {frequencyLabel(scorecard.input.frequency)}
            </p>
          </div>
          <p className="text-sm text-muted">Data completeness {scorecard.completeness.percent}%</p>
        </div>

        <div className="no-print mt-5 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <Button onClick={recalculate} className="w-full sm:w-auto">
            <RotateCcw aria-hidden="true" size={16} />
            Recalculate
          </Button>
          <Button variant="secondary" onClick={() => router.push("/assess")} className="w-full sm:w-auto">
            <Pencil aria-hidden="true" size={16} />
            Edit assessment
          </Button>
          <Button variant="secondary" onClick={() => setConfirmReset(true)} className="w-full sm:w-auto">
            <Plus aria-hidden="true" size={16} />
            Start a new assessment
          </Button>
          <Button variant="secondary" onClick={download} disabled={pdfState === "working"} className="w-full sm:w-auto">
            <Download aria-hidden="true" size={16} />
            {pdfState === "working" ? "Preparing PDF" : "Download report as PDF"}
          </Button>
          <Button variant="secondary" onClick={() => window.print()} className="w-full sm:w-auto">
            <Printer aria-hidden="true" size={16} />
            Print report
          </Button>
        </div>
        {notice ? <p className="mt-3 text-sm text-success">{notice}</p> : null}
        {pdfState === "error" ? (
          <p className="mt-3 text-sm text-danger" role="alert">
            The PDF could not be created in this browser. Use Print report and choose Save as PDF.
          </p>
        ) : null}

        {scorecard.score.provisional ? (
          <div className="mt-5 rounded-md border border-warning/40 bg-warning/10 px-3 py-3 text-sm leading-6">
            <p className="font-semibold">Provisional score</p>
            <ul className="mt-1 list-disc pl-5 text-muted">
              {scorecard.score.reasons.map((reason) => (
                <li key={reason}>{reason}</li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="mt-5 text-sm text-muted">Every scored category has the inputs it needs. The score is still an internal framework.</p>
        )}

        <div className="mt-6 grid gap-4 lg:grid-cols-[280px_1fr]">
          <Card className="flex flex-col items-center text-center">
            <ScoreGauge score={scorecard.score.total} />
            <p className="mt-2 text-4xl font-semibold tabular-nums">{scorecard.score.total}/100</p>
            <p className="mt-1 text-lg font-medium">{scorecard.score.bandLabel}</p>
            <p className="mt-3 text-sm leading-6 text-muted">{scorecard.score.bandSummary}</p>
          </Card>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <Kpi icon={Clock} label="Net hours saved monthly" value={formatHours(scorecard.netHoursSaved)} tone={scorecard.netHoursSaved < 0 ? "danger" : "success"} detail="Manual time minus processing time and human time." />
            <Kpi icon={BadgeDollarSign} label="Estimated monthly net financial benefit" value={formatMoney(scorecard.netMonthlyBenefit, currency)} tone={scorecard.netMonthlyBenefit < 0 ? "danger" : "success"} detail="Labor value less automation expenses. Not cash received." />
            <Kpi icon={Target} label="Task accuracy" value={ratioText(scorecard.accuracy)} tone={scorecard.accuracy.status === "insufficient" ? "muted" : "default"} detail="Successful tasks divided by evaluated tasks." />
            <Kpi icon={BadgeDollarSign} label="Monthly automation operating cost" value={formatMoney(scorecard.monthlyOperatingCost, currency)} tone="default" detail="Software, API or model usage, and other recurring costs." />
            <Kpi icon={Users} label="Human intervention rate" value={ratioText(scorecard.interventionRate)} tone={scorecard.interventionRate.status === "insufficient" ? "muted" : "default"} detail="Share of evaluated tasks that needed correction." />
            <Kpi icon={AlertTriangle} label="Error rate" value={ratioText(scorecard.errorRate)} tone={scorecard.errorRate.status === "value" && (scorecard.errorRate.percent ?? 0) >= 10 ? "warning" : "default"} detail="Failed or incorrect tasks divided by evaluated tasks." />
          </div>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <Card>
            <h2 className="text-xl font-semibold">Financial breakdown</h2>
            <p className="mt-2 text-sm leading-6 text-muted">
              Negative amounts stay visible. Operating cost is the monthly bill. Amortization is an optional economic cost.
            </p>
            <div className="no-print mt-4">
              <WaterfallChart bars={scorecard.waterfall} currency={currency} />
            </div>
            <AmountList
              rows={[
                ["Manual labor value", scorecard.manualLaborValue],
                ["Automated labor value", scorecard.automatedLaborValue],
                ["Automation operating costs", scorecard.monthlyOperatingCost],
                ["Implementation amortization", scorecard.monthlyImplementationCost],
                ["Estimated monthly net financial benefit", scorecard.netMonthlyBenefit],
              ]}
              currency={currency}
              emphasizeLast
            />
            <p className="mt-4 text-sm leading-6 text-muted">
              Estimated monthly ROI:{" "}
              <span className="font-semibold text-text tabular-nums">
                {scorecard.roi.status === "value" && scorecard.roi.percent != null
                  ? formatPercent(scorecard.roi.percent)
                  : "Not applicable"}
              </span>
              . {scorecard.roi.reason}
            </p>
            {scorecard.implementationExcluded ? (
              <p className="mt-2 text-sm leading-6 text-warning">
                A one-time cost of {formatMoney(scorecard.input.implementationCost ?? 0, currency)} is excluded because no lifespan was entered.
              </p>
            ) : null}
          </Card>

          <Card>
            <h2 className="text-xl font-semibold">Time comparison</h2>
            <p className="mt-2 text-sm leading-6 text-muted">
              Automated processing time counts as time the workflow still consumes. It is not priced again as labor.
            </p>
            <div className="no-print mt-4">
              <TimeChart
                rows={[
                  { label: "Manual workflow time", shortLabel: "Manual", hours: scorecard.manualHours, tone: "manual" },
                  { label: "Automated processing time", shortLabel: "Processing", hours: scorecard.processingHours, tone: "processing" },
                  { label: "Human review and correction", shortLabel: "Human time", hours: scorecard.humanHours, tone: "human" },
                ]}
              />
            </div>
            <dl className="mt-4 space-y-2 text-sm">
              <MetricRow label="Manual workflow time" value={formatHours(scorecard.manualHours)} />
              <MetricRow label="Automated processing time" value={formatHours(scorecard.processingHours)} />
              <MetricRow label="Routine human review" value={formatHours(scorecard.routineInterventionHours)} />
              <MetricRow label="Additional correction time" value={formatHours(scorecard.additionalCorrectionHours)} />
              <MetricRow label="Net hours saved" value={formatHours(scorecard.netHoursSaved)} strong />
            </dl>
          </Card>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <Card>
            <h2 className="text-xl font-semibold">Quality metrics</h2>
            <div className="mt-5 space-y-5">
              <QualityMeter label="Accuracy" result={scorecard.accuracy} tone="#35C58A" />
              <QualityMeter label="Error rate" result={scorecard.errorRate} tone="#EF6464" />
              <QualityMeter label="Human intervention rate" result={scorecard.interventionRate} tone="#E8B45A" />
            </div>
            <p className="mt-4 text-sm leading-6 text-muted">
              The intervention rate is the share of sampled tasks that needed correction. Review minutes per task are a separate input.
            </p>
          </Card>
          <Card>
            <h2 className="text-xl font-semibold">Performance breakdown</h2>
            <div className="mt-5 space-y-5">
              {(["accuracy", "intervention", "time", "financial"] as const).map((key) => {
                const category = scorecard.score[key];
                return (
                  <div key={key}>
                    <div className="flex items-baseline justify-between gap-3 text-sm">
                      <p className="font-medium">
                        {category.label}
                        {category.provisional ? " · provisional" : ""}
                      </p>
                      <p className="tabular-nums text-muted">
                        {category.points}/{category.max}
                      </p>
                    </div>
                    <div className="mt-2 h-2 rounded-full bg-line" role="meter" aria-valuemin={0} aria-valuemax={category.max} aria-valuenow={category.points} aria-label={category.label}>
                      <div className="h-full rounded-full bg-accent" style={{ width: `${(category.points / category.max) * 100}%` }} />
                    </div>
                    <p className="mt-2 text-sm leading-6 text-muted">{category.explanation}</p>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        <Card className="mt-4">
          <h2 className="text-xl font-semibold">Improvement recommendations</h2>
          <ol className="mt-4 space-y-4">
            {recommendations.map((item, index) => (
              <li key={item.id} className="flex gap-3">
                <span className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-elevated text-sm tabular-nums">
                  {index + 1}
                </span>
                <div>
                  <p className="font-medium">{item.title}</p>
                  <p className="mt-1 text-sm leading-6 text-muted">{item.detail}</p>
                </div>
              </li>
            ))}
          </ol>
        </Card>

        <Card className="mt-4">
          <h2 className="text-xl font-semibold">Break-even</h2>
          <p className="mt-3 text-sm leading-6 text-muted">{scorecard.breakEven.summary}</p>
        </Card>

        <Card className="mt-4">
          <h2 className="text-xl font-semibold">How these numbers were calculated</h2>
          <p className="mt-2 text-sm leading-6 text-muted">
            Hours on the cards are rounded to two decimals. Money is calculated before that rounding, then shown to the cent.
          </p>
          <dl className="mt-4 space-y-3 text-sm leading-6">
            <Formula label="Manual hours" value={`${formatCount(scorecard.input.monthlyTaskVolume)} × ${formatNumber(scorecard.input.manualMinutesPerTask, 2)} ÷ 60 = ${formatHours(scorecard.manualHours)}`} />
            <Formula label="Automated processing hours" value={`${formatCount(scorecard.input.monthlyTaskVolume)} × ${formatNumber(scorecard.input.automatedMinutesPerTask, 2)} ÷ 60 = ${formatHours(scorecard.processingHours)}`} />
            <Formula label="Routine review hours" value={`${formatCount(scorecard.input.monthlyTaskVolume)} × ${formatNumber(scorecard.input.interventionMinutesPerTask, 2)} ÷ 60 = ${formatHours(scorecard.routineInterventionHours)}`} />
            <Formula label="Additional correction hours" value={correctionCopy(scorecard)} />
            <Formula label="Net hours saved" value={`${formatHours(scorecard.manualHours)} − ${formatHours(scorecard.processingHours)} − ${formatHours(scorecard.humanHours)} = ${formatHours(scorecard.netHoursSaved)}`} />
            <Formula label="Manual labor value" value={`${formatHours(scorecard.manualHours)} × ${formatMoney(scorecard.input.hourlyLaborCost, currency)} = ${formatMoney(scorecard.manualLaborValue, currency)}`} />
            <Formula label="Automated labor value" value={`${formatHours(scorecard.humanHours)} × ${formatMoney(scorecard.input.hourlyLaborCost, currency)} = ${formatMoney(scorecard.automatedLaborValue, currency)}`} />
            <Formula label="Monthly operating cost" value={`${formatMoney(scorecard.input.monthlySoftwareCost, currency)} + ${formatMoney(scorecard.input.monthlyApiCost, currency)} + ${formatMoney(scorecard.input.otherRecurringCosts, currency)} = ${formatMoney(scorecard.monthlyOperatingCost, currency)}`} />
            <Formula
              label="Implementation amortization"
              value={
                scorecard.monthlyImplementationCost > 0
                  ? `${formatMoney(scorecard.input.implementationCost ?? 0, currency)} ÷ ${formatNumber(scorecard.input.implementationLifespanMonths ?? 0, 2)} months = ${formatMoney(scorecard.monthlyImplementationCost, currency)}`
                  : "Not applied. Blank implementation inputs count as zero."
              }
            />
            <Formula label="Estimated monthly net financial benefit" value={`${formatMoney(scorecard.manualLaborValue, currency)} − ${formatMoney(scorecard.automatedLaborValue, currency)} − ${formatMoney(scorecard.monthlyOperatingCost, currency)} − ${formatMoney(scorecard.monthlyImplementationCost, currency)} = ${formatMoney(scorecard.netMonthlyBenefit, currency)}`} />
          </dl>
          <p className="mt-4 text-sm">
            <a href="/methodology" className="text-accent underline-offset-2 hover:underline">
              Read the full methodology
            </a>
          </p>
        </Card>

        <Card className="mt-4">
          <h2 className="text-xl font-semibold">Assessment inputs</h2>
          <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
            <InputRow label="Description" value={scorecard.input.description || "Not provided"} />
            <InputRow label="Data quality" value={scorecard.input.dataQuality === "measured" ? "Measured" : "Estimated"} />
            <InputRow label="People involved" value={scorecard.input.peopleInvolved == null ? "Not provided" : formatCount(scorecard.input.peopleInvolved)} />
            <InputRow label="Evaluated tasks" value={scorecard.input.totalEvaluated == null ? "Not entered" : formatCount(scorecard.input.totalEvaluated)} />
            <InputRow label="Successful tasks" value={scorecard.input.successfulTasks == null ? "Not entered" : formatCount(scorecard.input.successfulTasks)} />
            <InputRow label="Failed tasks" value={scorecard.input.failedTasks == null ? "Not entered" : formatCount(scorecard.input.failedTasks)} />
            <InputRow label="Tasks needing correction" value={scorecard.input.tasksRequiringCorrection == null ? "Not entered" : formatCount(scorecard.input.tasksRequiringCorrection)} />
            <InputRow label="Average correction minutes" value={scorecard.input.averageCorrectionMinutes == null ? "Not entered" : formatNumber(scorecard.input.averageCorrectionMinutes, 2)} />
          </dl>
          {scorecard.completeness.missing.length ? (
            <p className="mt-4 text-sm text-muted">Still missing: {scorecard.completeness.missing.join(", ")}.</p>
          ) : null}
        </Card>

        <p className="mt-6 text-sm leading-6 text-muted">{DISCLAIMER}</p>
      </div>
      <ConfirmDialog
        open={confirmReset}
        title="Start a new assessment?"
        body="This removes the saved draft and report from this browser."
        confirmLabel="Start new"
        onClose={() => setConfirmReset(false)}
        onConfirm={() => {
          reset();
          setConfirmReset(false);
          router.push("/assess");
        }}
      />
    </div>
  );
}

function ScoreGauge({ score }: { score: number }) {
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const bounded = Math.max(0, Math.min(100, score));
  const color = bounded >= 80 ? "#35C58A" : bounded >= 60 ? "#477BFF" : bounded >= 40 ? "#E8B45A" : "#EF6464";
  return (
    <svg viewBox="0 0 120 120" className="h-36 w-36" role="img" aria-label={`Score ${score} out of 100`}>
      <circle cx="60" cy="60" r={radius} stroke="#273142" strokeWidth="8" fill="none" />
      <circle
        cx="60"
        cy="60"
        r={radius}
        stroke={color}
        strokeWidth="8"
        fill="none"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={circumference - (bounded / 100) * circumference}
        transform="rotate(-90 60 60)"
      />
    </svg>
  );
}

function Kpi({
  icon: Icon,
  label,
  value,
  detail,
  tone,
}: {
  icon: typeof Clock;
  label: string;
  value: string;
  detail: string;
  tone: "default" | "success" | "danger" | "warning" | "muted";
}) {
  const color = {
    default: "text-text",
    success: "text-success",
    danger: "text-danger",
    warning: "text-warning",
    muted: "text-muted",
  }[tone];
  return (
    <Card className="p-4 sm:p-5">
      <div className="flex items-center gap-2 text-muted">
        <Icon aria-hidden="true" size={16} />
        <h2 className="text-sm font-medium text-text">{label}</h2>
      </div>
      <p className={cn("mt-3 text-2xl font-semibold tabular-nums tracking-tight", color)}>{value}</p>
      <p className="mt-2 text-sm leading-6 text-muted">{detail}</p>
    </Card>
  );
}

function ratioText(result: RatioResult) {
  if (result.status !== "value" || result.percent == null) return "Insufficient data";
  return formatPercent(result.percent);
}

function AmountList({
  rows,
  currency,
  emphasizeLast,
}: {
  rows: Array<[string, number]>;
  currency: Scorecard["input"]["currency"];
  emphasizeLast?: boolean;
}) {
  return (
    <dl className="mt-4 space-y-2 text-sm">
      {rows.map(([label, amount], index) => (
        <div key={label} className="flex items-baseline justify-between gap-4">
          <dt className="text-muted">{label}</dt>
          <dd className={cn("tabular-nums", amount < 0 ? "text-danger" : "text-text", emphasizeLast && index === rows.length - 1 && "font-semibold")}>
            {formatMoney(amount, currency)}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function MetricRow({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="text-muted">{label}</dt>
      <dd className={cn("tabular-nums", strong && "font-semibold")}>{value}</dd>
    </div>
  );
}

function QualityMeter({ label, result, tone }: { label: string; result: RatioResult; tone: string }) {
  const value = result.status === "value" ? result.percent ?? 0 : null;
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3 text-sm">
        <p className="font-medium">{label}</p>
        <p className="tabular-nums text-muted">{value == null ? "Insufficient data" : formatPercent(value)}</p>
      </div>
      <div
        className="mt-2 h-2 rounded-full bg-line"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={value ?? undefined}
        aria-valuetext={value == null ? "Insufficient data" : formatPercent(value)}
        aria-label={label}
      >
        <div className="h-full rounded-full" style={{ width: `${value ?? 0}%`, background: value == null ? "transparent" : tone }} />
      </div>
    </div>
  );
}

function Formula({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="font-medium">{label}</dt>
      <dd className="text-muted tabular-nums">{value}</dd>
    </div>
  );
}

function InputRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-line bg-surface px-3 py-2">
      <dt className="text-muted">{label}</dt>
      <dd className="mt-1 text-text">{value}</dd>
    </div>
  );
}

function correctionCopy(scorecard: Scorecard) {
  if (scorecard.correctionNote === "added") {
    return `Extra minutes beyond review time, applied only to corrected tasks: ${formatHours(scorecard.additionalCorrectionHours)}.`;
  }
  if (scorecard.correctionNote === "already_included") {
    return "Correction time did not add hours because it is already covered by the per-task review time.";
  }
  if (scorecard.correctionNote === "not_supplied") {
    return "Correction minutes were not applied. Enter both the correction count and the minutes to include extra time.";
  }
  return "No correction sample was entered, so additional correction hours are zero.";
}
