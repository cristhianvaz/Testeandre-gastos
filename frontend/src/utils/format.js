const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const compactCurrency = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  notation: 'compact',
  maximumFractionDigits: 1,
});

export const formatCents = (cents) => currency.format(cents / 100);
export const formatCentsCompact = (cents) => compactCurrency.format(cents / 100);

export function formatDate(isoDate) {
  const [year, month, day] = isoDate.split('-');
  return `${day}/${month}/${year}`;
}

export function formatMonth(yearMonth, style = 'long') {
  const [year, month] = yearMonth.split('-').map(Number);
  const label = new Date(year, month - 1, 1).toLocaleDateString('pt-BR', { month: style, year: 'numeric' });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function formatPercent(part, total) {
  if (!total) return '0%';
  return `${Math.round((part / total) * 100)}%`;
}
