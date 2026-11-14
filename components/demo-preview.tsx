export function DemoPreview() {
  const metrics = [
    { label: "Hours saved monthly", value: "42 hours" },
    { label: "Task accuracy", value: "94%" },
    { label: "Monthly automation cost", value: "$180" },
    { label: "Estimated monthly net savings", value: "$720" },
  ];

  return (
    <div className="rounded-lg border border-line bg-card p-4 shadow-card sm:p-5" aria-label="Illustrative preview of a results dashboard">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-3">
        <p className="text-sm font-semibold">Performance report</p>
        <p className="rounded-full border border-line px-2.5 py-1 text-xs font-medium text-warning">
          Illustrative demo data
        </p>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {metrics.map((metric) => (
          <div key={metric.label} className="rounded-md border border-line bg-surface px-3 py-3">
            <p className="text-xs text-muted">{metric.label}</p>
            <p className="mt-1 text-xl font-semibold tabular-nums tracking-tight">{metric.value}</p>
            <p className="mt-1 text-xs text-muted">Example only. Not a customer result.</p>
          </div>
        ))}
      </div>
      <p className="mt-4 text-sm leading-6 text-muted">
        Your score appears after an assessment. These figures show the layout, not a calculated outcome.
      </p>
    </div>
  );
}
