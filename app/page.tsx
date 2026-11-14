import Link from "next/link";
import { BadgeDollarSign, Clock, Search, Target, TrendingUp, Wallet } from "lucide-react";
import { DemoPreview } from "@/components/demo-preview";
import { ButtonLink } from "@/components/ui";

const benefits = [
  { icon: Wallet, title: "Understand your automation costs", text: "Separate software, API usage, and the human time that is still in the loop." },
  { icon: Clock, title: "Identify wasted time", text: "Compare the old manual task with processing time and review time." },
  { icon: Target, title: "Measure task accuracy", text: "Use a real sample. If you have no sample, the report says so." },
  { icon: Search, title: "Find expensive workflows", text: "See when the monthly bill is larger than the labor value saved." },
  { icon: TrendingUp, title: "Understand financial returns", text: "Estimate net benefit and ROI from your own labor cost, not a default wage." },
  { icon: BadgeDollarSign, title: "Discover opportunities for improvement", text: "Recommendations come from the result you just calculated." },
];

export default function HomePage() {
  return (
    <>
      <section className="mx-auto grid max-w-content items-center gap-10 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-2 lg:py-20">
        <div>
          <h1 className="max-w-xl text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
            Is Your AI Automation Actually Saving You Money?
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-8 text-muted">
            Measure your automation&apos;s efficiency, accuracy, operating costs and financial impact in minutes.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <ButtonLink href="/assess" className="w-full sm:w-auto">
              Evaluate My Automation
            </ButtonLink>
            <ButtonLink href="/#how-it-works" variant="secondary" className="w-full sm:w-auto">
              See How It Works
            </ButtonLink>
          </div>
          <p className="mt-5 text-sm text-muted">Free to use. No account required. Your calculations stay in your browser.</p>
        </div>
        <DemoPreview />
      </section>

      <section id="how-it-works" className="border-t border-line">
        <div className="mx-auto max-w-content px-4 py-14 sm:px-6">
          <h2 className="text-3xl font-semibold tracking-tight">How it works</h2>
          <ol className="mt-8 grid gap-4 md:grid-cols-3">
            {[
              ["01", "Describe your workflow.", "Name the task, the monthly volume, and the kind of business it belongs to."],
              ["02", "Enter your automation performance data.", "Add manual time, labor cost, machine time, review time, bills, and any accuracy sample you have."],
              ["03", "Get your performance scorecard.", "See hours, money, quality, a transparent score, and what to look at next."],
            ].map(([number, title, text]) => (
              <li key={number} className="rounded-lg border border-line bg-card p-5">
                <p className="text-sm font-semibold tabular-nums text-accent">{number}</p>
                <h3 className="mt-3 text-lg font-semibold">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted">{text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="border-t border-line">
        <div className="mx-auto max-w-content px-4 py-14 sm:px-6">
          <h2 className="max-w-2xl text-3xl font-semibold tracking-tight">What you can learn from one workflow</h2>
          <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {benefits.map((benefit) => (
              <li key={benefit.title} className="rounded-lg border border-line bg-surface p-5">
                <benefit.icon aria-hidden="true" className="text-accent" size={18} />
                <h3 className="mt-3 font-semibold">{benefit.title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted">{benefit.text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="border-t border-line">
        <div className="mx-auto max-w-content px-4 py-16 sm:px-6">
          <div className="rounded-lg border border-line bg-card px-5 py-8 sm:px-8">
            <h2 className="max-w-2xl text-3xl font-semibold tracking-tight">Stop guessing whether your automation works.</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
              The score uses your inputs and a published point system. It is not a certified industry benchmark.
            </p>
            <ButtonLink href="/assess" className="mt-6 w-full sm:w-auto">
              Calculate My Automation Performance
            </ButtonLink>
            <p className="mt-4 text-sm text-muted">
              Want the formulas first? <Link href="/methodology" className="text-accent hover:underline">Read the methodology</Link>.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
