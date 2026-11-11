import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import './responsive-table.css';

export default function ResponsiveTable({
  columns,
  rows,
  rowKey = (row) => row.id,
  primary,
  secondary,
  avatar,
  tableClassName = 'mu-table',
  wrapClassName = 'mu-table-wrap',
  label = 'Data list',
  selection,
}) {
  const [expandedId, setExpandedId] = useState(null);
  const normalColumns = columns.filter((column) => !column.selection);
  const selectionColumn = columns.find((column) => column.selection);
  const valueFor = (column, row) => column.render ? column.render(row) : row[column.key];

  return <>
    <div className={`responsive-table-wide ${wrapClassName}`}>
      <table className={tableClassName}>
        <thead><tr>
          {selectionColumn && <th className={selectionColumn.className} scope="col">{selection?.header}</th>}
          {normalColumns.map((column) => <th className={column.className} key={column.key} scope="col">{column.label}</th>)}
        </tr></thead>
        <tbody>{rows.map((row) => <tr key={rowKey(row)}>
          {selectionColumn && <td className={selectionColumn.className}>{selection?.render(row)}</td>}
          {normalColumns.map((column) => <td className={column.className} key={column.key}>{valueFor(column, row)}</td>)}
        </tr>)}</tbody>
      </table>
    </div>
    <div className="responsive-table-cards" aria-label={label}>
      {selection?.header && <div className="responsive-table-select-all">{selection.header}</div>}
      {rows.map((row) => {
        const id = rowKey(row);
        const expanded = expandedId === id;
        const renderedAvatar = avatar?.(row);
        return <article className={`responsive-table-card${expanded ? ' is-expanded' : ''}`} key={id}>
          <div className="responsive-table-card-head">
            {selectionColumn && <span className="responsive-table-card-selection">{selection?.render(row)}</span>}
            <button className="responsive-table-card-toggle" type="button" aria-expanded={expanded} aria-controls={`responsive-table-details-${id}`} onClick={() => setExpandedId(expanded ? null : id)}>
              {renderedAvatar && <span className="responsive-table-card-avatar">{renderedAvatar}</span>}
              <span className="responsive-table-card-summary"><strong>{primary(row)}</strong><small>{secondary(row)}</small></span>
              <ChevronDown className="responsive-table-card-chevron" size={20} aria-hidden="true" />
            </button>
          </div>
          <div className="responsive-table-card-details" id={`responsive-table-details-${id}`} aria-hidden={!expanded} inert={!expanded}>
            <div className="responsive-table-card-details-inner">
              <dl>{normalColumns.flatMap((column) => {
                if (column.mobileDetails) return column.mobileDetails(row).map((detail, index) => <div key={`${column.key}-mobile-${index}`}><dt>{detail.label}</dt><dd>{detail.value}</dd></div>);
                if (column.primary || column.actions) return [];
                return [<div key={column.key}><dt>{column.label}</dt><dd>{valueFor(column, row)}</dd></div>];
              })}</dl>
              {(normalColumns.some((column) => column.actions || column.mobileActions) ) && <div className="responsive-table-card-actions">{normalColumns.filter((column) => column.actions || column.mobileActions).map((column) => <div key={column.key}>{column.mobileActions ? column.mobileActions(row) : valueFor(column, row)}</div>)}</div>}
            </div>
          </div>
        </article>;
      })}
    </div>
  </>;
}
