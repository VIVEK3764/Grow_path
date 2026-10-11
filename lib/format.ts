export const money = (n: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(n);
export const dateLabel = (v: string) =>
  new Intl.DateTimeFormat("en-IN", {
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(v));
export const stageLabels = {
  STUDENT: "Studying",
  FIRST_JOB: "First job",
  VARIABLE_INCOME: "Freelancing / variable income",
  ALREADY_INVESTING: "Earning & already investing",
};
export const categoryLabels = {
  SAFETY: "Safety cushion",
  PURCHASE: "Buy something",
  EXPERIENCE: "Experience",
  UPSKILL: "Upskill",
  WEALTH: "Grow wealth",
  OTHER: "Just starting",
};
