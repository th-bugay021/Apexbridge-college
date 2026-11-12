import { FiArrowDownRight, FiArrowUpRight } from "react-icons/fi";
import CountUp from "../common/CountUp";
import { SHOW_SAMPLE_DATA_LABELS } from "../../config/sampleDataLabels";

function StatsCard({ title, value, Icon, trend, tone = "accent", loading = false, error = "", empty = false, animate = false, caption = "Compared with the previous period" }) {
  if (loading) {
    return (
      <article className={`dashboard-stat-card dashboard-stat-card--${tone}`} aria-label={`Loading ${title}`}>
        <div className="dashboard-skeleton dashboard-skeleton-icon" />
        <div className="dashboard-skeleton dashboard-skeleton-label" />
        <div className="dashboard-skeleton dashboard-skeleton-value" />
        <div className="dashboard-skeleton dashboard-skeleton-trend" />
      </article>
    );
  }

  if (error) {
    return (
      <article className={`dashboard-stat-card dashboard-stat-card--${tone} dashboard-state-card`} role="alert">
        <span className="dashboard-state-title">{title}</span>
        <span className="dashboard-state-message">{error}</span>
      </article>
    );
  }

  if (empty || value === null || value === undefined) {
    return (
      <article className={`dashboard-stat-card dashboard-stat-card--${tone} dashboard-state-card`}>
        <span className="dashboard-state-title">{title}</span>
        <span className="dashboard-state-message">No data available yet.</span>
      </article>
    );
  }

  const TrendIcon = trend?.direction === "down" ? FiArrowDownRight : FiArrowUpRight;

  return (
    <article className={`dashboard-stat-card dashboard-stat-card--${tone}`}>
      <div className="dashboard-stat-card-top">
        <span className="dashboard-stat-icon" aria-hidden="true"><Icon size={20} /></span>
        {trend && (
          <span className={`dashboard-trend dashboard-trend--${trend.direction}`}>
            <TrendIcon aria-hidden="true" />
            {trend.percent}%
          </span>
        )}
        {SHOW_SAMPLE_DATA_LABELS && <span className="dashboard-sample-tag">Sample data</span>}
      </div>
      <p className="dashboard-stat-value">{animate ? <CountUp value={value} /> : value}</p>
      <h2 className="dashboard-stat-title">{title}</h2>
      <p className="dashboard-stat-caption">{caption}</p>
    </article>
  );
}

export default StatsCard;
