import { isValidCategoryId } from '../domain/categories.js';
import { NotFoundError, ValidationError } from '../domain/errors.js';
import { parseId, parseTransactionFilters } from './params.js';

export class TransactionController {
  #transactions;

  constructor({ transactionRepository }) {
    this.#transactions = transactionRepository;
  }

  list = (req, res) => {
    res.json(this.#transactions.findAll(parseTransactionFilters(req.query)));
  };

  summary = (req, res) => {
    const { month } = parseTransactionFilters(req.query);
    res.json({ ...this.#transactions.summarize({ month }), months: this.#transactions.listMonths() });
  };

  updateCategory = (req, res) => {
    const id = parseId(req.params.id);
    const { categoryId } = req.body ?? {};
    if (!isValidCategoryId(categoryId)) throw new ValidationError('Categoria inválida.');

    if (!this.#transactions.updateCategory(id, categoryId)) throw new NotFoundError('Transação não encontrada.');
    res.json(this.#transactions.findById(id));
  };
}
