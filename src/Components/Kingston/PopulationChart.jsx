import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

function PopulationChart({ data, colors, loading = false, error = "" }) {
  const isEmpty = !loading && !error && (!data?.length || data.every((item) => item.students === 0));

  return (
    <section className="dashboard-chart-card" aria-labelledby="population-chart-title">
      <header className="dashboard-chart-header">
        <div>
          <p className="dashboard-chart-eyebrow">Enrollment</p>
          <h2 id="population-chart-title" className="dashboard-chart-title">Student population by class</h2>
        </div>
      </header>
      {loading ? (
        <div className="dashboard-chart-skeleton" role="status" aria-label="Loading student population by class">
          <div className="dashboard-skeleton dashboard-chart-skeleton-grid" />
          <div className="dashboard-skeleton dashboard-chart-skeleton-bar" />
        </div>
      ) : error ? (
        <div className="dashboard-chart-state" role="alert">{error}</div>
      ) : isEmpty ? (
        <div className="dashboard-chart-state">No students enrolled yet.</div>
      ) : (
        <div className="dashboard-chart-frame dashboard-population-frame">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 8, right: 12, left: -18, bottom: 0 }}>
              <CartesianGrid stroke={colors.grid} vertical={false} />
              <XAxis dataKey="name" tick={{ fill: colors.muted, fontSize: 12 }} axisLine={{ stroke: colors.border }} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fill: colors.muted, fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip
                cursor={{ fill: colors.grid }}
                contentStyle={{ backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 12, color: colors.text }}
                labelStyle={{ color: colors.text }}
                itemStyle={{ color: colors.text }}
              />
              <Bar dataKey="students" name="Students" fill={colors.accent} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}

export default PopulationChart;
