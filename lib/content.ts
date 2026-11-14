export const PRODUCT_NAME = "AI Automation Scorecard";

export const PAGE_TITLE =
  "AI Automation Scorecard | Measure Your AI Workflow Performance";

export const PAGE_DESCRIPTION =
  "Free AI automation calculator to measure workflow accuracy, operating costs, time saved and estimated financial returns. No signup required.";

export const DISCLAIMER =
  "This tool provides estimates based on information supplied by the user. Actual business results may differ. Labor value saved does not necessarily represent cash received or an actual reduction in payroll expenses. The performance score is an internal evaluation framework, not an independently certified industry benchmark.";

export const ESTIMATE_DISCLAIMER =
  "Estimated inputs produce estimated results. For a reliable assessment, use actual workflow data.";

export const categoryLabel = (value: string) => {
  const labels: Record<string, string> = {
    agency: "Agency",
    ecommerce: "E-commerce",
    freelancing: "Freelancing",
    content: "Content creation",
    consulting: "Consulting",
    support: "Customer support",
    sales: "Sales",
    administration: "Administration",
    other: "Other",
  };
  return labels[value] ?? value;
};

export const frequencyLabel = (value: string) => {
  const labels: Record<string, string> = {
    daily: "Daily",
    weekly: "Weekly",
    monthly: "Monthly",
    on_demand: "On demand",
  };
  return labels[value] ?? value;
};
