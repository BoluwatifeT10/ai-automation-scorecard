import type { Metadata } from "next";
import { AssessmentWizard } from "@/components/assessment-wizard";

export const metadata: Metadata = {
  title: "Assessment",
  description: "Enter one AI workflow and calculate time saved, operating cost, accuracy, and estimated financial benefit.",
};

export default function AssessPage() {
  return <AssessmentWizard />;
}
