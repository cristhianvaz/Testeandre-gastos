/**
 * Migrações versionadas via PRAGMA user_version.
 * Para evoluir o schema, adicione um novo item ao final da lista (nunca edite um já aplicado).
 */
const MIGRATIONS = [
  `
  CREATE TABLE statements (
    id                INTEGER PRIMARY KEY AUTOINCREMENT,
    file_name         TEXT    NOT NULL,
    file_hash         TEXT    NOT NULL UNIQUE,
    extraction_method TEXT    NOT NULL,
    imported_at       TEXT    NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE transactions (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    statement_id    INTEGER NOT NULL REFERENCES statements(id) ON DELETE CASCADE,
    date            TEXT    NOT NULL,
    description     TEXT    NOT NULL,
    amount_cents    INTEGER NOT NULL,
    type            TEXT    NOT NULL CHECK (type IN ('expense', 'income')),
    category_id     TEXT    NOT NULL,
    category_source TEXT    NOT NULL DEFAULT 'auto' CHECK (category_source IN ('auto', 'manual')),
    created_at      TEXT    NOT NULL DEFAULT (datetime('now'))
  );

  CREATE INDEX idx_transactions_date ON transactions(date);
  CREATE INDEX idx_transactions_category ON transactions(category_id);
  CREATE INDEX idx_transactions_statement ON transactions(statement_id);
  `,
];

export function migrate(db) {
  const currentVersion = db.pragma('user_version', { simple: true });

  const pending = MIGRATIONS.slice(currentVersion);
  if (pending.length === 0) return;

  db.transaction(() => {
    pending.forEach((sql) => db.exec(sql));
    db.pragma(`user_version = ${MIGRATIONS.length}`);
  })();
}
