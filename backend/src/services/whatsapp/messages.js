/**
 * Textos enviados no WhatsApp. Isolados aqui para que regras de negócio
 * não se misturem com redação/formatação.
 */
const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const brl = (cents) => currency.format(cents / 100);

export const HELP_MESSAGE = [
  '👋 Olá! Sou seu assistente de gastos.',
  '',
  '📄 Envie um *extrato ou fatura em PDF* e eu extraio, categorizo e salvo as transações.',
  '📊 Envie *resumo* para ver o total de gastos por categoria.',
].join('\n');

export const PROCESSING_MESSAGE = '📄 Recebi seu PDF! Lendo e categorizando as transações…';

export const NOT_PDF_MESSAGE = '⚠️ Só consigo ler arquivos *PDF*. Envie o extrato como documento PDF.';

export const EMPTY_SUMMARY_MESSAGE = '📭 Ainda não há transações. Envie um extrato em PDF para começar.';

export function importErrorMessage(reason) {
  return `❌ Não consegui importar esse PDF.\n${reason}`;
}

/**
 * @param {{ title: string, totals: object, byCategory: object[], categoriesById: Record<string, {name: string, icon: string}> }} input
 */
export function summaryMessage({ title, totals, byCategory, categoriesById }) {
  const categoryLines = byCategory.map(({ categoryId, totalCents, count }) => {
    const category = categoriesById[categoryId] ?? { name: categoryId, icon: '•' };
    return `${category.icon} ${category.name}: *${brl(totalCents)}* (${count})`;
  });

  return [
    title,
    '',
    `💰 Receitas: *${brl(totals.incomeCents)}*`,
    `💸 Despesas: *${brl(totals.expenseCents)}*`,
    `${totals.balanceCents >= 0 ? '🟢' : '🔴'} Saldo: *${brl(totals.balanceCents)}*`,
    '',
    ...(categoryLines.length ? ['*Gastos por categoria*', ...categoryLines] : []),
  ].join('\n');
}
