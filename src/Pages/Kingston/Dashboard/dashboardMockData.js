// Replace with the student aggregate API when a dashboard totals endpoint is available.
export const mockStudentTotal = 842;

// Replace with the student demographics API when gender totals are exposed by the backend.
export const mockGenderDistribution = [
  { name: "Boys", value: 458 },
  { name: "Girls", value: 384 },
];

// Replace with the finance dashboard API when outstanding fee and revenue totals are implemented.
export const mockFinanceTotals = {
  outstandingFees: 4800000,
  revenue: 12600000,
};

// Replace with period-comparison KPI values from the dashboard metrics API.
export const mockTrendBadges = {
  students: { direction: "up", percent: 4.2 },
  teachers: { direction: "up", percent: 2.1 },
  classes: { direction: "up", percent: 1.4 },
  attendance: { direction: "up", percent: 3.8 },
  fees: { direction: "down", percent: 1.6 },
  revenue: { direction: "up", percent: 6.4 },
};
