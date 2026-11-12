import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { SHOW_SAMPLE_DATA_LABELS } from "../../config/sampleDataLabels";

function FeeChart({ data, colors, formatCurrency }) {
  const totals = data.reduce((result, term) => ({
    collected: result.collected + term.collected,
    outstanding: result.outstanding + term.outstanding,
  }), { collected: 0, outstanding: 0 });
  const totalExpected = totals.collected + totals.outstanding;

  return (
    <section className="dashboard-chart-card" aria-labelledby="fee-chart-title">
      <header className="dashboard-chart-header">
        <div><p className="dashboard-chart-eyebrow">School fees</p><h2 id="fee-chart-title" className="dashboard-chart-title">Fee collection</h2></div>
        {SHOW_SAMPLE_DATA_LABELS && <span className="dashboard-sample-tag">Sample data</span>}
      </header>
      <div className="dashboard-fee-summary" aria-label="Fee collection totals">
        <div><span>Collected</span><strong>{formatCurrency(totals.collected)}</strong></div>
        <div><span>Outstanding</span><strong>{formatCurrency(totals.outstanding)}</strong></div>
        <div><span>Total</span><strong>{formatCurrency(totalExpected)}</strong></div>
      </div>
      <div className="dashboard-chart-frame dashboard-secondary-chart-frame">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, left: -14, bottom: 0 }} barGap={6}>
            <CartesianGrid stroke={colors.grid} vertical={false} />
            <XAxis dataKey="term" tick={{ fill: colors.muted, fontSize: 12 }} axisLine={{ stroke: colors.border }} tickLine={false} />
            <YAxis tickFormatter={(value) => formatCurrency(value)} tick={{ fill: colors.muted, fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip
              formatter={(value, name) => [formatCurrency(value), name]}
              contentStyle={{ backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 12, color: colors.text }}
              labelStyle={{ color: colors.text }}
              itemStyle={{ color: colors.text }}
            />
            <Bar dataKey="collected" name="Collected" fill={colors.success} radius={[5, 5, 0, 0]} />
            <Bar dataKey="outstanding" name="Outstanding" fill={colors.warning} radius={[5, 5, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="dashboard-chart-legend"><span><i className="dashboard-legend-dot dashboard-legend-dot--collected" />Collected</span><span><i className="dashboard-legend-dot dashboard-legend-dot--outstanding" />Outstanding</span></div>
    </section>
  );
}

export default FeeChart;
