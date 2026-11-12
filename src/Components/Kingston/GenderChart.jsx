import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { SHOW_SAMPLE_DATA_LABELS } from "../../config/sampleDataLabels";

function GenderChart({ data, colors, loading = false, error = "" }) {
  const isEmpty = !loading && !error && (!data?.length || data.every((item) => item.value === 0));
  const total = data?.reduce((sum, item) => sum + item.value, 0) || 0;
  const segments = [colors.info, colors.accent];

  return (
    <section className="dashboard-chart-card dashboard-gender-card" aria-labelledby="gender-distribution-title">
      <header className="dashboard-chart-header">
        <div>
          <p className="dashboard-chart-eyebrow">Students</p>
          <h2 id="gender-distribution-title" className="dashboard-chart-title">Gender distribution</h2>
        </div>
        {SHOW_SAMPLE_DATA_LABELS && <span className="dashboard-sample-tag">Sample data</span>}
      </header>
      {loading ? (
        <div className="dashboard-chart-skeleton" role="status" aria-label="Loading gender distribution">
          <div className="dashboard-skeleton dashboard-donut-skeleton" />
        </div>
      ) : error ? (
        <div className="dashboard-chart-state" role="alert">{error}</div>
      ) : isEmpty ? (
        <div className="dashboard-chart-state">No student demographics available yet.</div>
      ) : (
        <>
          <div className="dashboard-donut-frame">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data} dataKey="value" nameKey="name" innerRadius="63%" outerRadius="88%" paddingAngle={3} stroke="none">
                  {data.map((item, index) => <Cell key={item.name} fill={segments[index % segments.length]} />)}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 12, color: colors.text }}
                  itemStyle={{ color: colors.text }}
                  formatter={(value, name) => [value, name]}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="dashboard-donut-center">
              <strong>{total.toLocaleString()}</strong>
              <span>Students</span>
            </div>
          </div>
          <div className="dashboard-gender-legend">
            {data.map((item, index) => (
              <div className="dashboard-gender-row" key={item.name}>
                <span className="dashboard-gender-name"><i className="dashboard-legend-dot" style={{ backgroundColor: segments[index % segments.length] }} />{item.name}</span>
                <strong>{total ? Math.round((item.value / total) * 100) : 0}%</strong>
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  );
}

export default GenderChart;
