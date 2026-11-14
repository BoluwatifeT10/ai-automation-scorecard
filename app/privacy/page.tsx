import type { Metadata } from "next";
import { ResetDataButton } from "@/components/reset-data-button";

export const metadata: Metadata = {
  title: "Privacy",
  description: "The AI Automation Scorecard keeps assessment data in your browser and does not transmit it.",
};

export default function PrivacyPage() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      <p className="text-sm font-medium text-accent">Privacy</p>
      <h1 className="mt-2 text-4xl font-semibold tracking-tight">Your assessment stays on this device</h1>
      <div className="mt-6 space-y-4 text-sm leading-6 text-muted">
        <p>There is no account, no email field, and no payment. The assessment is not sent to an analytics service or an AI API.</p>
        <p>
          A draft is saved in this browser&apos;s local storage so you can refresh the page without losing it. That includes the numbers you type and the time of the latest report. Clearing the site data in your browser removes it. The reset control does the same thing.
        </p>
        <p>The typeface is delivered with the application. Calculations run locally. A downloaded PDF is created in the browser and is not uploaded.</p>
        <p>Do not enter secrets, customer records, or personal data you would not want stored on this device. Workflow names and descriptions remain in local storage until you reset them.</p>
      </div>
      <div className="mt-8 flex flex-col items-start gap-3">
        <ResetDataButton />
      </div>
    </article>
  );
}
