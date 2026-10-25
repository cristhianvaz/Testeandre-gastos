import { parseBrlToCents } from '../domain/money.js';

/**
 * Linha de transação: "DD/MM[/AAAA] DESCRIÇÃO VALOR [D|C]"
 * Exemplos aceitos:
 *   01/10/2026 SALARIO EMPRESA XYZ 8.500,00
 *   04/10 UBER *TRIP -32,90
 *   05/10/26 IFOOD R$ 78,50 D
 *   06/10/2026 NETFLIX 55,90-
 */
const TRANSACTION_LINE = new RegExp(
  [
    '^(?<day>\\d{2})[/.-](?<month>\\d{2})(?:[/.-](?<year>\\d{2}|\\d{4}))?',
    '\\s+(?<description>.+?)',
    '\\s+(?<amount>-?\\s?(?:R\\$\\s?)?-?(?:\\d{1,3}(?:\\.\\d{3})+|\\d+),\\d{2}-?)',
    '(?:\\s*(?<flag>[DC]))?\\s*$',
  ].join(''),
);

const YEAR_HINT = /\b(20\d{2})\b/;

/**
 * Converte o texto bruto do extrato em transações estruturadas.
 * Linhas que não seguem o padrão (cabeçalhos, totais, rodapés) são ignoradas.
 */
export class StatementParser {
  #now;

  /** @param {{ now?: () => Date }} [options] */
  constructor({ now = () => new Date() } = {}) {
    this.#now = now;
  }

  /**
   * @param {string[]} pages texto de cada página
   * @returns {{ date: string, description: string, amountCents: number }[]}
   */
  parse(pages) {
    const fullText = pages.join('\n');
    const fallbackYear = this.#inferYear(fullText);

    return fullText
      .split(/\r?\n/)
      .map((line) => line.trim())
      .map((line) => this.#parseLine(line, fallbackYear))
      .filter(Boolean);
  }

  #parseLine(line, fallbackYear) {
    const match = TRANSACTION_LINE.exec(line);
    if (!match) return null;

    const { day, month, year, description, amount, flag } = match.groups;
    const date = this.#toIsoDate(day, month, year, fallbackYear);
    if (!date) return null;

    let amountCents = parseBrlToCents(amount);
    if (flag === 'D') amountCents = -Math.abs(amountCents);
    if (flag === 'C') amountCents = Math.abs(amountCents);
    if (amountCents === 0) return null;

    return { date, description: description.replace(/\s+/g, ' ').trim(), amountCents };
  }

  #toIsoDate(day, month, year, fallbackYear) {
    const fullYear = year ? (year.length === 2 ? 2000 + Number(year) : Number(year)) : fallbackYear;
    const date = new Date(Date.UTC(fullYear, Number(month) - 1, Number(day)));
    const isRealDate = date.getUTCDate() === Number(day) && date.getUTCMonth() === Number(month) - 1;
    return isRealDate ? date.toISOString().slice(0, 10) : null;
  }

  #inferYear(text) {
    const hint = YEAR_HINT.exec(text);
    return hint ? Number(hint[1]) : this.#now().getFullYear();
  }
}
