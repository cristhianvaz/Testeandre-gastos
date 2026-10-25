import { formatCents } from '../utils/format.js';

export function StatTiles({ totals }) {
  const { incomeCents = 0, expenseCents = 0, balanceCents = 0, count = 0 } = totals ?? {};

  const tiles = [
    { label: 'Receitas', value: formatCents(incomeCents), icon: '↗' },
    { label: 'Despesas', value: formatCents(expenseCents), icon: '↘' },
    {
      label: 'Saldo',
      value: formatCents(balanceCents),
      icon: balanceCents >= 0 ? '▲' : '▼',
      tone: balanceCents >= 0 ? 'good' : 'critical',
      hint: balanceCents >= 0 ? 'positivo' : 'negativo',
    },
    { label: 'Transações', value: count.toLocaleString('pt-BR'), icon: '#' },
  ];

  return (
    <section className="tiles" aria-label="Resumo do período">
      {tiles.map((tile) => (
        <article key={tile.label} className="card tile">
          <span className="tile__label">
            <span className="tile__icon" aria-hidden>{tile.icon}</span>
            {tile.label}
          </span>
          <span className="tile__value">{tile.value}</span>
          {tile.hint && <span className={`tile__hint tone-${tile.tone}`}>{tile.icon} {tile.hint}</span>}
        </article>
      ))}
    </section>
  );
}
