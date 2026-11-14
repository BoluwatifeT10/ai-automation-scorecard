import { formatCount, formatMoney, roundTo } from "./format";
import type { Recommendation, Scorecard } from "./types";

export function recommend(scorecard: Scorecard): Recommendation[] {
  const items: Recommendation[] = [];
  const { input } = scorecard;
  const currency = input.currency;

  if (input.dataQuality === "estimated") {
    items.push({
      id: "estimated",
      title: "Replace estimates with measured workflow data",
      detail:
        "These results are estimates. Record actual task times, failures, and corrections for another sample before you treat the score as reliable.",
    });
  }

  if (scorecard.accuracy.status === "insufficient") {
    items.push({
      id: "accuracy-missing",
      title: "Add an accuracy sample",
      detail:
        "No evaluated tasks were entered, so accuracy is shown as insufficient data rather than 0%. Count successful and failed tasks from a real sample.",
    });
  } else if ((scorecard.accuracy.percent ?? 100) < 90) {
    items.push({
      id: "accuracy-low",
      title: "Check output validation before raising volume",
      detail:
        "Review the workflow's output validation process before increasing task volume.",
    });
  }

  if (scorecard.errorRate.status === "value" && (scorecard.errorRate.percent ?? 0) >= 10) {
    items.push({
      id: "errors",
      title: "Inspect failed tasks",
      detail:
        "The error rate is high enough to create rework. Inspect failed tasks before relying on this workflow for customer-facing work.",
    });
  }

  if (scorecard.interventionRate.status === "value" && (scorecard.interventionRate.percent ?? 0) > 20) {
    items.push({
      id: "intervention-high",
      title: "Find the steps that keep needing correction",
      detail:
        "Identify which steps require repeated manual correction. Consider improving instructions or adding validation.",
    });
  } else if (
    scorecard.interventionRate.status === "value" &&
    (scorecard.interventionRate.percent ?? 0) > 10
  ) {
    items.push({
      id: "intervention-moderate",
      title: "Sample the tasks people still correct",
      detail:
        "Human correction is still common. Sample the corrected tasks and tighten the steps that fail most often.",
    });
  }

  if (scorecard.netHoursSaved < 0) {
    items.push({
      id: "time-negative",
      title: "Compare automated time with the original process",
      detail:
        "Compare automated processing and human review time against the original manual process.",
    });
  }

  if (scorecard.monthlyOperatingCost > scorecard.laborValueSaved) {
    items.push({
      id: "cost-exceeds-labor",
      title: "Review subscriptions and API usage",
      detail: "Review API usage, software subscriptions and processing frequency.",
    });
  }

  if (scorecard.breakEven.status === "no_savings") {
    items.push({
      id: "no-variable-savings",
      title: "Volume will not close the gap by itself",
      detail:
        "Increasing volume alone will not produce break-even through labor savings, because each additional task costs at least as much labor value as it saves.",
    });
  } else if (
    scorecard.breakEven.status === "volume" &&
    scorecard.breakEven.tasksForOperatingCost != null &&
    input.monthlyTaskVolume < scorecard.breakEven.tasksForOperatingCost
  ) {
    items.push({
      id: "below-break-even",
      title: "Current volume is below operating break-even",
      detail: `At the current labor saving per task, about ${formatCount(scorecard.breakEven.tasksForOperatingCost)} tasks per month are needed to cover operating costs of ${formatMoney(scorecard.monthlyOperatingCost, currency)}.`,
    });
  }

  if (roundNegative(scorecard.netMonthlyBenefit) < 0) {
    items.push({
      id: "benefit-negative",
      title: "Costs are higher than the labor value saved",
      detail:
        "Estimated costs exceed labor value saved. Reduce operating cost or remove steps that add review time before expanding this workflow.",
    });
  }

  if (scorecard.implementationExcluded) {
    items.push({
      id: "implementation",
      title: "Add a lifespan if you want setup cost included",
      detail: `A one-time implementation cost of ${formatMoney(input.implementationCost ?? 0, currency)} is recorded, but it is not in the monthly result because no useful lifespan was entered.`,
    });
  }

  if (roundNegative(scorecard.netMonthlyBenefit) > 0) {
    items.push({
      id: "track",
      title: "Confirm the result over another month",
      detail:
        "Track the results over another month to confirm that the estimated savings are sustained.",
    });
  }

  if (items.length === 0) {
    items.push({
      id: "keep-measuring",
      title: "Keep a monthly record",
      detail:
        "Keep a monthly record of volume, review time, and failures so the score stays based on measured performance.",
    });
  }

  return items;
}

function roundNegative(value: number): number {
  return roundTo(value, 2);
}
