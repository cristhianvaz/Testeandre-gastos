const METHOD_LABELS = { 'text-layer': 'Texto do PDF', ocr: 'OCR' };

export function StatementsPanel({ statements, onDelete }) {
  if (statements.length === 0) return null;

  return (
    <section className="card">
      <header className="card__header">
        <h2>Extratos importados</h2>
      </header>
      <ul className="statements">
        {statements.map((statement) => (
          <li key={statement.id} className="statement">
            <span className="statement__icon" aria-hidden>📄</span>
            <div className="statement__info">
              <strong>{statement.fileName}</strong>
              <span className="muted">
                {statement.transactionCount} transações · {METHOD_LABELS[statement.extractionMethod] ?? statement.extractionMethod} ·{' '}
                {new Date(`${statement.importedAt}Z`).toLocaleString('pt-BR')}
              </span>
            </div>
            <button
              type="button"
              className="btn btn--ghost btn--danger"
              onClick={() => onDelete(statement)}
              aria-label={`Remover ${statement.fileName}`}
            >
              Remover
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
