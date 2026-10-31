import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

function AttendanceChart({ data, period, onPeriodChange, colors, loading = false, error = "" }) {
  const isEmpty = !loading && !error && (!data?.length || data.every((item) => item.present === 0 && item.absent === 0));

  return (
    <section className="dashboard-chart-card dashboard-attendance-card" aria-labelledby="attendance-trends-title">
      <header className="dashboard-chart-header">
        <div>
          <p className="dashboard-chart-eyebrow">Attendance</p>
          <h2 id="attendance-trends-title" className="dashboard-chart-title">Attendance trends</h2>
        </div>
        <label className="dashboard-period-label">
          <span className="dashboard-visually-hidden">Attendance trend period</span>
          <select value={period} onChange={(event) => onPeriodChange(event.target.value)}>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
        </label>
      </header>

      {loading ? (
        <div className="dashboard-chart-skeleton" role="status" aria-label="Loading attendance trends">
          <div className="dashboard-skeleton dashboard-chart-skeleton-grid" />
          <div className="dashboard-skeleton dashboard-chart-skeleton-bar" />
        </div>
      ) : error ? (
        <div className="dashboard-chart-state" role="alert">{error}</div>
      ) : isEmpty ? (
        <div className="dashboard-chart-state">No attendance records for this period.</div>
      ) : (
        <div className="dashboard-chart-frame">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }} barGap={6}>
              <CartesianGrid stroke={colors.grid} vertical={false} />
              <XAxis dataKey="day" tick={{ fill: colors.muted, fontSize: 12 }} axisLine={{ stroke: colors.border }} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fill: colors.muted, fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip
                cursor={{ fill: colors.grid }}
                contentStyle={{ backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 12, color: colors.text }}
                labelStyle={{ color: colors.text }}
                itemStyle={{ color: colors.text }}
              />
              <Bar dataKey="present" name="Present" fill={colors.success} radius={[5, 5, 0, 0]} />
              <Bar dataKey="absent" name="Absent" fill={colors.danger} radius={[5, 5, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
      <div className="dashboard-chart-legend" aria-hidden="true">
        <span><i className="dashboard-legend-dot dashboard-legend-dot--present" />Present (includes late)</span>
        <span><i className="dashboard-legend-dot dashboard-legend-dot--absent" />Absent</span>
      </div>
    </section>
  );
}

export default AttendanceChart;
