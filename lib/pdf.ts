import { categoryLabel, DISCLAIMER, frequencyLabel } from "./content";
import { recommend } from "./recommendations";
import { fileSlug, formatDate, formatHours, formatMoney, formatNumber, formatPercent } from "./format";
import type { Scorecard } from "./types";

export interface ReportSection {
  heading: string;
  lines: string[];
}

export function buildReportSections(scorecard: Scorecard, assessedAt: string): ReportSection[] {
  const { input } = scorecard;
  const currency = input.currency;
  const ratio = (label: string, status: string, percent: number | null) =>
    status === "value" && percent != null ? `${label}: ${formatPercent(percent)}` : `${label}: Insufficient data`;

  return [
    {
      heading: "Workflow",
      lines: [
        `Name: ${input.workflowName}`,
        `Category: ${categoryLabel(input.businessCategory)}`,
        `Frequency: ${frequencyLabel(input.frequency)}`,
        `Assessment date: ${formatDate(assessedAt)}`,
        `Currency: ${currency}`,
        `Data quality: ${input.dataQuality === "measured" ? "Measured inputs" : "Estimated inputs"}`,
        input.description ? `Description: ${input.description}` : "Description: Not provided",
        input.peopleInvolved != null
          ? `People involved (context only, not multiplied): ${input.peopleInvolved}`
          : "People involved: Not provided",
      ],
    },
    {
      heading: "Performance score",
      lines: [
        `Score: ${scorecard.score.total} / 100`,
        `Band: ${scorecard.score.bandLabel}`,
        scorecard.score.provisional ? "Status: Provisional" : "Status: Complete enough to score every category",
        ...scorecard.score.reasons,
        scorecard.score.bandSummary,
        `Data completeness: ${scorecard.completeness.percent}%`,
        scorecard.completeness.missing.length
          ? `Missing: ${scorecard.completeness.missing.join(", ")}`
          : "Missing: none of the tracked inputs",
        `Accuracy: ${scorecard.score.accuracy.points} / ${scorecard.score.accuracy.max}. ${scorecard.score.accuracy.explanation}`,
        `Human intervention: ${scorecard.score.intervention.points} / ${scorecard.score.intervention.max}. ${scorecard.score.intervention.explanation}`,
        `Time efficiency: ${scorecard.score.time.points} / ${scorecard.score.time.max}. ${scorecard.score.time.explanation}`,
        `Financial performance: ${scorecard.score.financial.points} / ${scorecard.score.financial.max}. ${scorecard.score.financial.explanation}`,
        "This score is an internal framework, not an independently certified benchmark.",
      ],
    },
    {
      heading: "Key metrics",
      lines: [
        `Net hours saved monthly: ${formatHours(scorecard.netHoursSaved)}`,
        `Estimated monthly net financial benefit: ${formatMoney(scorecard.netMonthlyBenefit, currency)}`,
        ratio("Task accuracy", scorecard.accuracy.status, scorecard.accuracy.percent),
        `Monthly automation operating cost: ${formatMoney(scorecard.monthlyOperatingCost, currency)}`,
        ratio("Human intervention rate", scorecard.interventionRate.status, scorecard.interventionRate.percent),
        ratio("Error rate", scorecard.errorRate.status, scorecard.errorRate.percent),
      ],
    },
    {
      heading: "Financial breakdown",
      lines: [
        `Manual labor value: ${formatMoney(scorecard.manualLaborValue, currency)}`,
        `Automated labor value: ${formatMoney(scorecard.automatedLaborValue, currency)}`,
        `Operating costs: ${formatMoney(scorecard.monthlyOperatingCost, currency)}`,
        `Implementation amortization: ${formatMoney(scorecard.monthlyImplementationCost, currency)}`,
        `Estimated monthly net financial benefit: ${formatMoney(scorecard.netMonthlyBenefit, currency)}`,
        scorecard.roi.status === "value" && scorecard.roi.percent != null
          ? `Estimated monthly ROI: ${formatPercent(scorecard.roi.percent, 2)}`
          : "Estimated monthly ROI: Not applicable",
        scorecard.roi.reason,
        "Labor value saved is not the same as cash received or a payroll reduction.",
      ],
    },
    {
      heading: "Time and quality",
      lines: [
        `Manual hours: ${formatHours(scorecard.manualHours)}`,
        `Automated processing hours: ${formatHours(scorecard.processingHours)}`,
        `Routine human review hours: ${formatHours(scorecard.routineInterventionHours)}`,
        `Additional correction hours: ${formatHours(scorecard.additionalCorrectionHours)}`,
        `Net hours saved: ${formatHours(scorecard.netHoursSaved)}`,
        ratio("Accuracy", scorecard.accuracy.status, scorecard.accuracy.percent),
        ratio("Error rate", scorecard.errorRate.status, scorecard.errorRate.percent),
        ratio("Human intervention rate", scorecard.interventionRate.status, scorecard.interventionRate.percent),
        "Automated processing time is subtracted from hours saved and is not also priced at the hourly labor rate.",
      ],
    },
    {
      heading: "Inputs",
      lines: [
        `Monthly task volume: ${formatNumber(input.monthlyTaskVolume, 2)}`,
        `Manual minutes per task: ${formatNumber(input.manualMinutesPerTask, 2)}`,
        `Hourly labor cost: ${formatMoney(input.hourlyLaborCost, currency)}`,
        `Automated processing minutes: ${formatNumber(input.automatedMinutesPerTask, 2)}`,
        `Human review minutes per task: ${formatNumber(input.interventionMinutesPerTask, 2)}`,
        `Software cost: ${formatMoney(input.monthlySoftwareCost, currency)}`,
        `API or model cost: ${formatMoney(input.monthlyApiCost, currency)}`,
        `Other recurring costs: ${formatMoney(input.otherRecurringCosts, currency)}`,
        `Implementation cost: ${input.implementationCost == null ? "Not entered" : formatMoney(input.implementationCost, currency)}`,
        `Useful lifespan (months): ${input.implementationLifespanMonths == null ? "Not entered" : formatNumber(input.implementationLifespanMonths, 2)}`,
        `Evaluated tasks: ${input.totalEvaluated == null ? "Not entered" : formatNumber(input.totalEvaluated, 2)}`,
        `Successful tasks: ${input.successfulTasks == null ? "Not entered" : formatNumber(input.successfulTasks, 2)}`,
        `Failed tasks: ${input.failedTasks == null ? "Not entered" : formatNumber(input.failedTasks, 2)}`,
        `Tasks needing correction: ${input.tasksRequiringCorrection == null ? "Not entered" : formatNumber(input.tasksRequiringCorrection, 2)}`,
        `Average correction minutes: ${input.averageCorrectionMinutes == null ? "Not entered" : formatNumber(input.averageCorrectionMinutes, 2)}`,
      ],
    },
    {
      heading: "Break-even",
      lines: [scorecard.breakEven.summary],
    },
    {
      heading: "Recommendations",
      lines: recommend(scorecard).flatMap((item, index) => [
        `${index + 1}. ${item.title}`,
        item.detail,
      ]),
    },
    {
      heading: "Methodology",
      lines: [
        "Manual hours = monthly task volume × manual minutes ÷ 60.",
        "Automated processing hours = monthly task volume × processing minutes ÷ 60.",
        "Routine review hours = monthly task volume × review minutes ÷ 60.",
        "Additional correction hours apply only to the share of tasks that need correction, and only for minutes beyond the review time already counted.",
        "Net hours saved = manual hours − processing hours − routine review hours − additional correction hours.",
        "Manual labor value = manual hours × hourly labor cost.",
        "Automated labor value = human hours × hourly labor cost.",
        "Operating cost = software + API or model usage + other recurring costs.",
        "Monthly implementation cost = one-time cost ÷ lifespan, when both are provided.",
        "Estimated monthly net financial benefit = manual labor value − automated labor value − operating cost − amortized implementation cost.",
        "ROI = net financial benefit ÷ monthly automation cost × 100. If the cost is zero, ROI is not applicable.",
        "Accuracy = successful tasks ÷ evaluated tasks × 100. With no sample, the result is insufficient data.",
        "The score awards up to 40 points for accuracy, 20 for human intervention rate, 20 for time efficiency, and 20 for financial performance. Missing data scores 0 for that category.",
      ],
    },
    {
      heading: "Disclaimer",
      lines: [DISCLAIMER],
    },
  ];
}

export async function downloadReport(scorecard: Scorecard, assessedAt: string) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const margin = 48;
  const width = doc.internal.pageSize.getWidth();
  const height = doc.internal.pageSize.getHeight();
  const maxWidth = width - margin * 2;
  let y = margin;

  const ensure = (needed: number) => {
    if (y + needed <= height - margin) return;
    doc.addPage();
    y = margin;
  };

  const write = (text: string, size: number, weight: "normal" | "bold", gap: number) => {
    doc.setFont("helvetica", weight);
    doc.setFontSize(size);
    const lines = doc.splitTextToSize(text, maxWidth) as string[];
    const lineHeight = size + 4;
    ensure(lines.length * lineHeight + gap);
    doc.text(lines, margin, y);
    y += lines.length * lineHeight + gap;
  };

  write("AI Automation Scorecard", 18, "bold", 4);
  write(scorecard.input.workflowName, 14, "bold", 8);
  write("Your Automation Performance Report", 11, "normal", 12);

  for (const section of buildReportSections(scorecard, assessedAt)) {
    write(section.heading, 12, "bold", 4);
    for (const line of section.lines) write(line, 10, "normal", 2);
    y += 8;
  }

  const pages = doc.getNumberOfPages();
  for (let page = 1; page <= pages; page += 1) {
    doc.setPage(page);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(`Page ${page} of ${pages}`, width - margin, height - 28, { align: "right" });
    doc.text("Estimates from user-supplied inputs. Not a certified benchmark.", margin, height - 28);
  }

  doc.save(`ai-automation-scorecard-${fileSlug(scorecard.input.workflowName)}.pdf`);
}
