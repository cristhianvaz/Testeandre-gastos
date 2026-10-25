import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { before, describe, it } from 'node:test';
import { config } from '../src/config/index.js';
import { CATEGORIES } from '../src/domain/categories.js';
import { createDatabase } from '../src/database/connection.js';
import { StatementRepository } from '../src/repositories/StatementRepository.js';
import { TransactionRepository } from '../src/repositories/TransactionRepository.js';
import { CategorizationService } from '../src/services/CategorizationService.js';
import { ImportStatementService } from '../src/services/ImportStatementService.js';
import { PythonPdfTextExtractor } from '../src/services/PythonPdfTextExtractor.js';
import { StatementParser } from '../src/services/StatementParser.js';

const SAMPLES_DIR = path.resolve(import.meta.dirname, '..', '..', 'samples');
const SAMPLE_PDF = path.join(SAMPLES_DIR, 'extrato-teste.pdf');
const expected = JSON.parse(fs.readFileSync(path.join(SAMPLES_DIR, 'extrato-teste.expected.json'), 'utf8'));
const categoryIdByName = new Map(CATEGORIES.map(({ id, name }) => [name, id]));

describe('Importação ponta a ponta do PDF de testes (Python + SQLite)', () => {
  let service;
  let transactionRepository;

  before(() => {
    const db = createDatabase(':memory:');
    transactionRepository = new TransactionRepository(db);
    service = new ImportStatementService({
      textExtractor: new PythonPdfTextExtractor(config.extractor),
      parser: new StatementParser(),
      categorizer: new CategorizationService(CATEGORIES),
      statementRepository: new StatementRepository(db),
      transactionRepository,
      runInTransaction: (work) => db.transaction(work)(),
    });
  });

  it('importa as 20 transações com valores e categorias corretos', async () => {
    const result = await service.execute({ filePath: SAMPLE_PDF, fileName: 'extrato-teste.pdf' });
    assert.equal(result.importedCount, 20);

    const stored = transactionRepository
      .findAll()
      .map(({ date, description, amountCents, categoryId }) => ({ date, description, amountCents, categoryId }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const wanted = expected.map(({ category, ...rest }) => ({ ...rest, categoryId: categoryIdByName.get(category) }));
    assert.deepEqual(stored, wanted);
  });

  it('rejeita importar o mesmo arquivo duas vezes', async () => {
    await assert.rejects(
      service.execute({ filePath: SAMPLE_PDF, fileName: 'extrato-teste.pdf' }),
      { statusCode: 409 },
    );
  });
});
