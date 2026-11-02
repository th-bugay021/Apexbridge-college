// Replace with the student aggregate API when a dashboard totals endpoint is available.
export const mockStudentTotal = 842;

// Replace with the student demographics API when gender totals are exposed by the backend.
export const mockGenderDistribution = [
  { name: "Boys", value: 458 },
  { name: "Girls", value: 384 },
];

// Replace with the finance dashboard API when outstanding fee and revenue totals are implemented.
export const mockFinanceTotals = {
  outstandingFees: 55000,
  revenue: 195000,
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

// Replace with the fee collection API when term-level collected and outstanding totals are available.
export const mockFeeCollection = {
  terms: [
    { term: "First", collected: 65000, outstanding: 18000 },
    { term: "Second", collected: 63000, outstanding: 19000 },
    { term: "Third", collected: 67000, outstanding: 18000 },
  ],
};

// Replace with the examinations/results API when class average scores can be queried.
export const mockPerformanceByClass = [
  { className: "Nursery 1", averageScore: 74 },
  { className: "Nursery 2", averageScore: 78 },
  { className: classLabel(1), averageScore: 72 },
  { className: classLabel(2), averageScore: 81 },
  { className: classLabel(3), averageScore: 76 },
  { className: classLabel(4), averageScore: 84 },
];

// Replace with the admissions API when recent student admissions can be listed.
export const mockRecentAdmissions = [
  { id: "admission-1", primary: "Amara Okafor", secondary: `${classLabel(2)} · 28 Oct 2026`, meta: "New" },
  { id: "admission-2", primary: "Daniel Bello", secondary: "Nursery 2 · 26 Oct 2026", meta: "New" },
  { id: "admission-3", primary: "Zara Ibrahim", secondary: `${classLabel(1)} · 24 Oct 2026`, meta: "New" },
  { id: "admission-4", primary: "Tomi Adeyemi", secondary: `${classLabel(3)} · 22 Oct 2026`, meta: "New" },
];

// Replace with the school fees API when recent payments can be listed.
export const mockRecentPayments = [
  { id: "payment-1", primary: "K. Okafor", secondary: "Tuition · 29 Oct 2026", meta: money(4500) },
  { id: "payment-2", primary: "M. Bello", secondary: "Tuition · 28 Oct 2026", meta: money(3250) },
  { id: "payment-3", primary: "A. Ibrahim", secondary: "Transport · 27 Oct 2026", meta: money(850) },
  { id: "payment-4", primary: "T. Adeyemi", secondary: "Tuition · 25 Oct 2026", meta: money(4100) },
];

// Replace with the school events API when upcoming events can be listed.
export const mockUpcomingEvents = [
  { id: "event-1", primary: "Inter-house sports", secondary: "School field · 06 Nov 2026", meta: "06 Nov" },
  { id: "event-2", primary: "Parents consultation", secondary: "Main hall · 12 Nov 2026", meta: "12 Nov" },
  { id: "event-3", primary: "Science exhibition", secondary: "Science block · 18 Nov 2026", meta: "18 Nov" },
  { id: "event-4", primary: "End-of-term assembly", secondary: "Main hall · 27 Nov 2026", meta: "27 Nov" },
];

// Replace with the examinations API when upcoming exam schedules can be listed.
export const mockUpcomingExams = [
  { id: "exam-1", primary: "Mathematics assessment", secondary: `${classLabel(4)} · 09 Nov 2026`, meta: "09 Nov" },
  { id: "exam-2", primary: "English language", secondary: `${classLabel(3)} · 11 Nov 2026`, meta: "11 Nov" },
  { id: "exam-3", primary: "Basic science", secondary: `${classLabel(2)} · 13 Nov 2026`, meta: "13 Nov" },
  { id: "exam-4", primary: "End-of-term exams", secondary: "All classes · 23 Nov 2026", meta: "23 Nov" },
];
import { classLabel } from "../../../config/school";
import { money } from "../../../Components/Great/money";

