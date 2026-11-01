function ActivityList({ title, items = [] }) {
  return (
    <section className="dashboard-activity-card" aria-label={title}>
      <header className="dashboard-activity-header">
        <h2>{title}</h2>
        <span className="dashboard-sample-tag">Sample data</span>
      </header>
      {items.length ? (
        <ul className="dashboard-activity-list">
          {items.map((item) => (
            <li className="dashboard-activity-item" key={item.id}>
              <div><strong>{item.primary}</strong><span>{item.secondary}</span></div>
              {item.meta && <span className="dashboard-activity-meta">{item.meta}</span>}
            </li>
          ))}
        </ul>
      ) : <p className="dashboard-activity-empty">No recent items to show.</p>}
    </section>
  );
}

export default ActivityList;
