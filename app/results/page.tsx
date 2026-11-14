import type { Metadata } from "next";
import { ResultsDashboard } from "@/components/results-dashboard";

export const metadata: Metadata = {
  title: "Performance report",
  description: "Review the calculated performance, cost, accuracy, and recommendations for your AI automation.",
};

export default function ResultsPage() {
  return <ResultsDashboard />;
}
