import { useTooltip } from '../hooks/useTooltip.js';
import { formatCents, formatCentsCompact, formatMonth } from '../utils/format.js';
import { Tooltip } from './Tooltip.jsx';

const SERIES = [
  { key: 'incomeCents', label: 'Receitas', className: 'series-1' },
  { key: 'expenseCents', label: 'Despesas', className: 'series-2' },
];

const TICK_COUNT = 4;

function niceMax(value) {
  if (value <= 0) return 1;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  const step = [1, 2, 2.5, 5, 10].find((candidate) => candidate * magnitude * TICK_COUNT >= value);
  return step * magnitude * TICK_COUNT;
}

/** Receitas x despesas por mês: barras agrupadas num único eixo. */
export function MonthlyChart({ months, selectedMonth }) {
  const { tooltip, show, hide } = useTooltip();
  const max = niceMax(Math.max(...months.flatMap((m) => [m.incomeCents, m.expenseCents]), 0));
  const ticks = Array.from({ length: TICK_COUNT + 1 }, (_, index) => (max / TICK_COUNT) * index).reverse();

  return (
    <section className="card chart-card">
      <header className="card__header">
        <div>
          <h2>Evolução mensal</h2>
          <p className="muted">Últimos 12 meses</p>
        </div>
        <ul className="legend" aria-label="Legenda">
          {SERIES.map((series) => (
            <li key={series.key}>
              <span className={`legend__swatch ${series.className}`} aria-hidden />
              {series.label}
            </li>
          ))}
        </ul>
      </header>

      {months.length === 0 ? (
        <p className="empty">Importe um extrato para ver a evolução.</p>
      ) : (
        <div className="vchart">
          <div className="vchart__axis" aria-hidden>
            {ticks.map((tick) => (
              <span key={tick}>{formatCentsCompact(tick)}</span>
            ))}
          </div>
          <div className="vchart__plot">
            <div className="vchart__grid" aria-hidden>
              {ticks.map((tick) => (
                <span key={tick} />
              ))}
            </div>
            <div className="vchart__groups">
              {months.map((month) => {
                const balance = month.incomeCents - month.expenseCents;
                const content = (
                  <>
                    <strong>{formatMonth(month.month)}</strong>
                    {SERIES.map((series) => (
                      <span key={series.key} className="tooltip__row">
                        <span className={`legend__swatch ${series.className}`} aria-hidden />
                        {series.label}: {formatCents(month[series.key])}
                      </span>
                    ))}
                    <span>Saldo: {formatCents(balance)}</span>
                  </>
                );
                const isDimmed = selectedMonth && selectedMonth !== month.month;

                return (
                  <div
                    key={month.month}
                    className={`vchart__group ${isDimmed ? 'vchart__group--dimmed' : ''}`}
                    onMouseMove={(event) => show(event, content)}
                    onMouseLeave={hide}
                    tabIndex={0}
                    onFocus={(event) => show(event, content)}
                    onBlur={hide}
                    aria-label={`${formatMonth(month.month)}: receitas ${formatCents(month.incomeCents)}, despesas ${formatCents(month.expenseCents)}`}
                  >
                    <div className="vchart__bars">
                      {SERIES.map((series) => (
                        <span
                          key={series.key}
                          className={`vchart__bar ${series.className}`}
                          style={{ height: `${(month[series.key] / max) * 100}%` }}
                        />
                      ))}
                    </div>
                    <span className="vchart__label">{formatMonth(month.month, 'short')}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
      <Tooltip tooltip={tooltip} />
    </section>
  );
}
