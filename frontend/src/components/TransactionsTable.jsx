import { formatCents, formatDate } from '../utils/format.js';

export function TransactionsTable({ transactions, categories, onChangeCategory }) {
  return (
    <section className="card">
      <header className="card__header">
        <div>
          <h2>Transações</h2>
          <p className="muted">
            {transactions.length} resultado{transactions.length === 1 ? '' : 's'} · ajuste a categoria se a engine errar
          </p>
        </div>
      </header>

      {transactions.length === 0 ? (
        <p className="empty">Nenhuma transação encontrada.</p>
      ) : (
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Data</th>
                <th>Descrição</th>
                <th>Categoria</th>
                <th className="num">Valor</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((transaction) => (
                <tr key={transaction.id}>
                  <td className="nowrap muted num-font">{formatDate(transaction.date)}</td>
                  <td className="description">{transaction.description}</td>
                  <td>
                    <div className="category-cell">
                      <select
                        className="category-select"
                        value={transaction.categoryId}
                        onChange={(event) => onChangeCategory(transaction.id, event.target.value)}
                        aria-label={`Categoria de ${transaction.description}`}
                      >
                        {categories.map((category) => (
                          <option key={category.id} value={category.id}>
                            {category.icon} {category.name}
                          </option>
                        ))}
                      </select>
                      {transaction.categorySource === 'manual' && (
                        <span className="badge" title="Categoria ajustada manualmente">manual</span>
                      )}
                    </div>
                  </td>
                  <td className={`num num-font nowrap amount amount--${transaction.type}`}>
                    {transaction.type === 'income' ? '+ ' : '− '}
                    {formatCents(Math.abs(transaction.amountCents))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
