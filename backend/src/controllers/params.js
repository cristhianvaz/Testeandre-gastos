import { ValidationError } from '../domain/errors.js';

const MONTH_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;
const TRANSACTION_TYPES = new Set(['expense', 'income']);

export function parseId(raw) {
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) throw new ValidationError('Id inválido.');
  return id;
}

/** Extrai e valida os filtros de listagem a partir da query string. */
export function parseTransactionFilters({ month, categoryId, type, search } = {}) {
  if (month && !MONTH_PATTERN.test(month)) throw new ValidationError('Mês deve estar no formato AAAA-MM.');
  if (type && !TRANSACTION_TYPES.has(type)) throw new ValidationError('Tipo deve ser "expense" ou "income".');

  return {
    month: month || undefined,
    categoryId: categoryId || undefined,
    type: type || undefined,
    search: search?.trim() || undefined,
  };
}
