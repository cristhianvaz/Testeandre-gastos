import { CATEGORY_IDS } from '../domain/categories.js';
import { normalizeText } from '../domain/text.js';

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Categoriza transações por palavras-chave.
 * Quando várias regras casam, vence a palavra-chave mais longa (mais específica):
 * "UBER EATS" (Alimentação) prevalece sobre "UBER" (Transporte).
 */
export class CategorizationService {
  #rules;

  /** @param {{ id: string, keywords: string[] }[]} categories */
  constructor(categories) {
    this.#rules = categories
      .flatMap(({ id, keywords }) =>
        keywords.map((keyword) => {
          const normalized = normalizeText(keyword);
          return {
            categoryId: id,
            length: normalized.length,
            pattern: new RegExp(`(?:^|[^A-Z0-9])${escapeRegExp(normalized)}(?:$|[^A-Z0-9])`),
          };
        }),
      )
      .sort((a, b) => b.length - a.length);
  }

  /**
   * @param {{ description: string, amountCents: number }} transaction
   * @returns {string} id da categoria
   */
  categorize({ description, amountCents }) {
    const text = normalizeText(description);
    const match = this.#rules.find((rule) => rule.pattern.test(text));
    if (match) return match.categoryId;

    return amountCents > 0 ? CATEGORY_IDS.INCOME : CATEGORY_IDS.OTHER;
  }
}
