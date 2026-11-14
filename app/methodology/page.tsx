import type { Metadata } from "next";
import { DISCLAIMER, ESTIMATE_DISCLAIMER } from "@/lib/content";

export const metadata: Metadata = {
  title: "Methodology",
  description: "How the AI Automation Scorecard calculates hours, cost, ROI, accuracy, and the 100-point performance score.",
};

export default function MethodologyPage() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      <p className="text-sm font-medium text-accent">Methodology</p>
      <h1 className="mt-2 text-4xl font-semibold tracking-tight">How the scorecard calculates a result</h1>
      <p className="mt-4 text-base leading-7 text-muted">
        Every figure is calculated in your browser from the numbers you enter. The same inputs always produce the same result. Nothing here is an industry certification.
      </p>

      <Section title="What you need for a reliable result">
        <p>
          Use a real monthly volume, a measured manual time, the labor cost you would actually apply, and the bills you pay for the automation. Accuracy and the human-intervention rate also need a counted sample: total tasks evaluated, successes, failures, and tasks that needed correction. {ESTIMATE_DISCLAIMER}
        </p>
        <p>
          Blank optional costs count as zero and are labeled that way. Headcount is stored for context and is not multiplied into the labor cost. Frequency describes the workflow. The monthly volume is the quantity the formulas use.
        </p>
      </Section>

      <Section title="Hours saved">
        <ul className="list-disc space-y-2 pl-5">
          <li>Manual hours = monthly task volume × manual minutes per task ÷ 60.</li>
          <li>Automated processing hours = monthly task volume × automated processing minutes ÷ 60.</li>
          <li>Routine review hours = monthly task volume × human review minutes per task ÷ 60.</li>
          <li>
            Additional correction hours apply only when you provide a sample and a correction time. The share of tasks that needed correction is applied to the monthly volume. Only minutes above the review time already counted are added, so the same minutes are not billed twice.
          </li>
          <li>Net hours saved = manual hours − automated processing hours − routine review hours − additional correction hours.</li>
        </ul>
        <p>
          A negative result means the automated workflow consumes more time than the manual one. The report shows that negative number. Automated processing time is treated as time consumed. It is not also multiplied by the hourly labor cost, because software and API fees are counted separately.
        </p>
      </Section>

      <Section title="Financial benefit">
        <ul className="list-disc space-y-2 pl-5">
          <li>Manual labor value = manual hours × the hourly labor cost you entered.</li>
          <li>Automated labor value = (routine review hours + additional correction hours) × the same hourly cost.</li>
          <li>Monthly operating cost = software + API or model usage + other recurring costs.</li>
          <li>When you enter both a one-time implementation cost and a useful lifespan, monthly implementation cost = one-time cost ÷ lifespan in months. Otherwise that monthly amount is zero. It is an economic allocation, not a second vendor invoice.</li>
          <li>Estimated monthly net financial benefit = manual labor value − automated labor value − monthly operating cost − monthly implementation cost.</li>
        </ul>
        <p>
          This is estimated labor value minus automation expenses. It is not cash received, and it is not proof that payroll went down.
        </p>
      </Section>

      <Section title="ROI">
        <p>
          Estimated monthly ROI = (estimated monthly net financial benefit ÷ monthly automation cost) × 100. The denominator is operating cost plus amortized implementation cost. If that denominator is zero, ROI is shown as not applicable instead of an infinite number.
        </p>
      </Section>

      <Section title="Accuracy, errors, and intervention">
        <ul className="list-disc space-y-2 pl-5">
          <li>Accuracy = successful tasks ÷ evaluated tasks × 100.</li>
          <li>Error rate = failed or incorrect tasks ÷ evaluated tasks × 100.</li>
          <li>Human intervention rate = tasks requiring correction ÷ evaluated tasks × 100.</li>
        </ul>
        <p>
          If there is no evaluated sample, each of these is insufficient data. The product does not substitute 0%. Successful tasks plus failed tasks cannot be greater than the sample. The intervention rate is not assumed to equal the review minutes.
        </p>
      </Section>

      <Section title="Break-even volume">
        <p>
          Variable labor saving per task is the manual labor cost of one task minus the human labor cost that remains after automation. If that saving is above zero, break-even volume is the monthly operating cost divided by the saving per task. If the saving is zero or negative, the report states that increasing volume alone will not produce break-even through labor savings.
        </p>
      </Section>

      <Section title="Performance score">
        <p>The score is 0 to 100, from four published bands. Missing data scores 0 for that category and marks the total provisional. It does not receive full points.</p>
        <h3 className="mt-4 font-semibold">Accuracy, up to 40</h3>
        <BandList items={["98–100%: 40", "95–97.99%: 36", "90–94.99%: 30", "80–89.99%: 20", "Below 80%, when a sample exists: 10", "No sample: 0, provisional"]} />
        <h3 className="mt-4 font-semibold">Human intervention rate, up to 20</h3>
        <BandList items={["0–5%: 20", "Above 5% through 10%: 16", "Above 10% through 20%: 12", "Above 20% through 40%: 6", "Above 40%: 2", "No sample: 0, provisional"]} />
        <h3 className="mt-4 font-semibold">Time efficiency, up to 20</h3>
        <p className="mt-2">This is the percentage of manual time saved after processing and human time.</p>
        <BandList items={["80% or higher: 20", "60–79.99%: 16", "40–59.99%: 12", "20–39.99%: 6", "Below 20%, including negative: 2", "Manual time is zero: 0, provisional"]} />
        <h3 className="mt-4 font-semibold">Financial performance, up to 20</h3>
        <BandList items={["Positive net benefit and ROI above 100%: 20", "Positive net benefit and ROI from 50% to 100%: 16", "Positive net benefit and ROI from 0% up to 50%: 12", "Break-even: 8", "Negative net benefit: 2", "Positive benefit with zero automation cost: 20, and ROI stays not applicable"]} />
        <h3 className="mt-4 font-semibold">How to read the total</h3>
        <BandList items={["80–100: Strong performance", "60–79: Performing, with room for improvement", "40–59: Needs optimization", "0–39: Underperforming"]} />
        <p>A high score does not mean a workflow is ready for customers. It means the entered numbers landed in the upper bands of this framework.</p>
      </Section>

      <Section title="Worked example">
        <p>These are illustrative inputs, not a customer result. 1,000 tasks, 10 manual minutes, 2 processing minutes, 1 review minute, labor at USD 20, software USD 100, API USD 50.</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>Manual hours: 166.67. Processing hours: 33.33. Review hours: 16.67. Net hours saved: 116.67.</li>
          <li>Manual labor value: USD 3,333.33. Automated labor value: USD 333.33. Operating cost: USD 150.</li>
          <li>Estimated monthly net financial benefit: USD 2,850.00.</li>
        </ul>
      </Section>

      <section className="mt-10 rounded-lg border border-line bg-card p-5">
        <h2 className="text-lg font-semibold">Disclaimer</h2>
        <p className="mt-3 text-sm leading-6 text-muted">{DISCLAIMER}</p>
      </section>
    </article>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
      <div className="mt-3 space-y-3 text-sm leading-6 text-muted">{children}</div>
    </section>
  );
}

function BandList({ items }: { items: string[] }) {
  return (
    <ul className="mt-2 list-disc space-y-1 pl-5">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}
