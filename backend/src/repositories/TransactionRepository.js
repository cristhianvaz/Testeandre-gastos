const SELECT_COLUMNS = `
  id, statement_id AS statementId, date, description, amount_cents AS amountCents,
  type, category_id AS categoryId, category_source AS categorySource`;

export class TransactionRepository {
  #db;

  constructor(db) {
    this.#db = db;
  }

  insertMany(statementId, transactions) {
    const insert = this.#db.prepare(
      `INSERT INTO transactions (statement_id, date, description, amount_cents, type, category_id)
       VALUES (@statementId, @date, @description, @amountCents, @type, @categoryId)`,
    );
    transactions.forEach((transaction) => insert.run({ statementId, ...transaction }));
  }

  /** @param {{ month?: string, categoryId?: string, type?: string, search?: string }} filters */
  findAll(filters = {}) {
    const { where, args } = buildWhere(filters);
    return this.#db
      .prepare(`SELECT ${SELECT_COLUMNS} FROM transactions ${where} ORDER BY date DESC, id DESC`)
      .all(...args);
  }

  findById(id) {
    return this.#db.prepare(`SELECT ${SELECT_COLUMNS} FROM transactions WHERE id = ?`).get(id);
  }

  updateCategory(id, categoryId) {
    return (
      this.#db
        .prepare(`UPDATE transactions SET category_id = ?, category_source = 'manual' WHERE id = ?`)
        .run(categoryId, id).changes > 0
    );
  }

  /** @param {{ month?: string, statementId?: number }} filters */
  summarize(filters = {}) {
    const { where, args } = buildWhere(filters);

    const totals = this.#db
      .prepare(
        `SELECT COALESCE(SUM(CASE WHEN type = 'income'  THEN amount_cents END), 0) AS incomeCents,
                COALESCE(SUM(CASE WHEN type = 'expense' THEN -amount_cents END), 0) AS expenseCents,
                COUNT(*) AS count
           FROM transactions ${where}`,
      )
      .get(...args);

    const byCategory = this.#db
      .prepare(
        `SELECT category_id AS categoryId, SUM(-amount_cents) AS totalCents, COUNT(*) AS count
           FROM transactions ${appendCondition(where, "type = 'expense'")}
          GROUP BY category_id
          ORDER BY totalCents DESC`,
      )
      .all(...args);

    const byMonth = this.#db
      .prepare(
        `SELECT substr(date, 1, 7) AS month,
                COALESCE(SUM(CASE WHEN type = 'income'  THEN amount_cents END), 0) AS incomeCents,
                COALESCE(SUM(CASE WHEN type = 'expense' THEN -amount_cents END), 0) AS expenseCents
           FROM transactions
          GROUP BY month
          ORDER BY month DESC
          LIMIT 12`,
      )
      .all()
      .reverse();

    return {
      totals: { ...totals, balanceCents: totals.incomeCents - totals.expenseCents },
      byCategory,
      byMonth,
    };
  }

  listMonths() {
    return this.#db
      .prepare('SELECT DISTINCT substr(date, 1, 7) AS month FROM transactions ORDER BY month DESC')
      .pluck()
      .all();
  }
}

function buildWhere({ statementId, month, categoryId, type, search } = {}) {
  const conditions = [];
  const params = {};

  if (statementId) {
    conditions.push('statement_id = @statementId');
    params.statementId = statementId;
  }
  if (month) {
    conditions.push('substr(date, 1, 7) = @month');
    params.month = month;
  }
  if (categoryId) {
    conditions.push('category_id = @categoryId');
    params.categoryId = categoryId;
  }
  if (type) {
    conditions.push('type = @type');
    params.type = type;
  }
  if (search) {
    conditions.push('description LIKE @search');
    params.search = `%${search}%`;
  }

  const hasConditions = conditions.length > 0;
  return {
    where: hasConditions ? `WHERE ${conditions.join(' AND ')}` : '',
    args: hasConditions ? [params] : [],
  };
}

function appendCondition(where, condition) {
  return where ? `${where} AND ${condition}` : `WHERE ${condition}`;
}
