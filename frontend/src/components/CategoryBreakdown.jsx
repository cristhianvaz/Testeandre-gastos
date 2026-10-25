import { useTooltip } from '../hooks/useTooltip.js';
import { formatCents, formatPercent } from '../utils/format.js';
import { Tooltip } from './Tooltip.jsx';

/** Gastos por categoria: barras horizontais ordenadas por valor (uma única cor = magnitude). */
export function CategoryBreakdown({ items, categoriesById, selectedCategoryId, onSelect }) {
  const { tooltip, show, hide } = useTooltip();
  const total = items.reduce((sum, item) => sum + item.totalCents, 0);
  const max = Math.max(...items.map((item) => item.totalCents), 1);

  return (
    <section className="card chart-card">
      <header className="card__header">
        <div>
          <h2>Gastos por categoria</h2>
          <p className="muted">Clique em uma categoria para filtrar as transações</p>
        </div>
      </header>

      {items.length === 0 ? (
        <p className="empty">Nenhuma despesa no período.</p>
      ) : (
        <ul className="hbars">
          {items.map((item) => {
            const category = categoriesById[item.categoryId];
            const isSelected = selectedCategoryId === item.categoryId;
            const isDimmed = selectedCategoryId && !isSelected;
            const tooltipContent = (
              <>
                <strong>{category?.name}</strong>
                <span>{formatCents(item.totalCents)} · {formatPercent(item.totalCents, total)} das despesas</span>
                <span>{item.count} transaç{item.count === 1 ? 'ão' : 'ões'}</span>
              </>
            );

            return (
              <li key={item.categoryId}>
                <button
                  type="button"
                  className={`hbar ${isSelected ? 'hbar--selected' : ''} ${isDimmed ? 'hbar--dimmed' : ''}`}
                  onClick={() => onSelect(isSelected ? '' : item.categoryId)}
                  onMouseMove={(event) => show(event, tooltipContent)}
                  onMouseLeave={hide}
                  onFocus={(event) => show(event, tooltipContent)}
                  onBlur={hide}
                  aria-pressed={isSelected}
                >
                  <span className="hbar__label">
                    <span aria-hidden>{category?.icon}</span> {category?.name ?? item.categoryId}
                  </span>
                  <span className="hbar__track">
                    <span className="hbar__fill" style={{ width: `${(item.totalCents / max) * 100}%` }} />
                  </span>
                  <span className="hbar__value">
                    {formatCents(item.totalCents)}
                    <span className="muted">{formatPercent(item.totalCents, total)}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
      <Tooltip tooltip={tooltip} />
    </section>
  );
}
