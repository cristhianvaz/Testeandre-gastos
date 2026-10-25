/**
 * Valores monetários são sempre manipulados em centavos (inteiros)
 * para evitar erros de ponto flutuante.
 */

/**
 * Converte um valor no formato brasileiro ("-1.234,56", "R$ 10,00", "99,90-") em centavos.
 * @param {string} raw
 * @returns {number}
 */
export function parseBrlToCents(raw) {
  const text = String(raw).trim();
  const isNegative = text.startsWith('-') || text.endsWith('-') || /^R\$\s*-/.test(text);
  const digits = text.replace(/[^\d,]/g, '');
  const [integerPart, decimalPart = '00'] = digits.split(',');

  if (!integerPart && !decimalPart) {
    throw new TypeError(`Valor monetário inválido: "${raw}"`);
  }

  const cents = Number(integerPart || '0') * 100 + Number(decimalPart.padEnd(2, '0').slice(0, 2));
  return isNegative ? -cents : cents;
}
