export class StatementRepository {
  #db;

  constructor(db) {
    this.#db = db;
  }

  findByHash(fileHash) {
    return this.#db.prepare('SELECT * FROM statements WHERE file_hash = ?').get(fileHash);
  }

  create({ fileName, fileHash, extractionMethod }) {
    const result = this.#db
      .prepare('INSERT INTO statements (file_name, file_hash, extraction_method) VALUES (?, ?, ?)')
      .run(fileName, fileHash, extractionMethod);
    return Number(result.lastInsertRowid);
  }

  findAll() {
    return this.#db
      .prepare(
        `SELECT s.id, s.file_name AS fileName, s.extraction_method AS extractionMethod,
                s.imported_at AS importedAt, COUNT(t.id) AS transactionCount
           FROM statements s
           LEFT JOIN transactions t ON t.statement_id = s.id
          GROUP BY s.id
          ORDER BY s.imported_at DESC, s.id DESC`,
      )
      .all();
  }

  /** @returns {boolean} true se removeu algum registro */
  delete(id) {
    return this.#db.prepare('DELETE FROM statements WHERE id = ?').run(id).changes > 0;
  }
}
