# AI Automation Scorecard

A browser-based calculator for one AI automation. It estimates time saved, labor value, operating cost, accuracy, and a transparent 0–100 performance score. There is no account, no payment, and no server-side storage of assessment data.

## Install

Requires Node.js 20 or newer.

```bash
npm install
```

## Develop

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Test

```bash
npm test
```

Unit tests cover the calculation engine, validation, recommendations, and report text. They include the published worked example, a negative financial result, missing accuracy, zero-cost ROI, and negative time saved.

```bash
npm run typecheck
npm run build
```

## Production

```bash
npm run build
npm start
```

`npm start` serves the production build on port 3000. Deploy the repository to any Node host that runs `npm run build` and `npm start`. No environment variables are required. Vercel and similar platforms can use the default Next.js build.

## Calculation methodology

All formulas live in `lib/calculations.ts` and run in the browser.

- Manual hours = monthly volume × manual minutes ÷ 60.
- Processing hours = monthly volume × processing minutes ÷ 60.
- Routine review hours = monthly volume × review minutes ÷ 60.
- Additional correction hours use only the share of tasks that needed correction, and only the minutes beyond the review time already counted.
- Net hours saved = manual hours − processing hours − review hours − additional correction hours. Negative results are shown.
- Manual labor value = manual hours × the hourly cost you enter.
- Automated labor value = human hours × the same hourly cost. Machine time is not priced as labor.
- Operating cost = software + API or model usage + other recurring costs. Blank optional costs count as zero.
- Amortized implementation cost = one-time cost ÷ lifespan, only when both are entered.
- Estimated monthly net financial benefit = manual labor value − automated labor value − operating cost − amortized implementation cost.
- ROI = net benefit ÷ (operating cost + amortization) × 100. A zero denominator is **Not applicable**.
- Accuracy, error rate, and intervention rate use the evaluated sample. No sample is **Insufficient data**, not 0%.
- The score is accuracy (40) + intervention rate (20) + time efficiency (20) + financial performance (20). Missing categories score 0 and the total is marked provisional.

Labor value is not cash received and not a payroll reduction. The score is an internal framework, not a certified benchmark. The same wording is on the methodology page.

## Project structure

```text
app/                routes: landing, assessment, results, methodology, about, privacy
components/         interface, charts, report
context/            local draft state
lib/calculations.ts deterministic scorecard math
lib/validation.ts   Zod-backed step validation
lib/recommendations.ts
lib/pdf.ts          client-side PDF text report
lib/*.test.ts       unit tests
```

Drafts are stored in `localStorage` under `ai-automation-scorecard:v1`. Reset is available in the assessment, on the report, and on the privacy page.

An earlier printable checklist (`index.html` and `AI-Automation-Testing-Checklist.pdf`) remains in the folder. The running site is the Next.js app.
