import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { SHOW_SAMPLE_DATA_LABELS } from "../../config/sampleDataLabels";

function PerformanceChart({ data, colors }) {
  return (
    <section className="dashboard-chart-card" aria-labelledby="performance-chart-title">
      <header className="dashboard-chart-header">
        <div><p className="dashboard-chart-eyebrow">Examinations</p><h2 id="performance-chart-title" className="dashboard-chart-title">Student performance</h2></div>
        {SHOW_SAMPLE_DATA_LABELS && <span className="dashboard-sample-tag">Sample data</span>}
      </header>
      <div className="dashboard-chart-frame dashboard-secondary-chart-frame">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
            <CartesianGrid stroke={colors.grid} vertical={false} />
            <XAxis dataKey="className" tick={{ fill: colors.muted, fontSize: 11 }} axisLine={{ stroke: colors.border }} tickLine={false} interval={0} angle={-15} textAnchor="end" height={42} />
            <YAxis domain={[0, 100]} tick={{ fill: colors.muted, fontSize: 12 }} axisLine={false} tickLine={false} />
            <Tooltip
              formatter={(value) => [value + "%", "Average score"]}
              contentStyle={{ backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 12, color: colors.text }}
              labelStyle={{ color: colors.text }}
              itemStyle={{ color: colors.text }}
            />
            <Bar dataKey="averageScore" name="Average score" fill={colors.accent} radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

export default PerformanceChart;
