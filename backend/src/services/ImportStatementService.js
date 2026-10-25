import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import { ConflictError, ExtractionError } from '../domain/errors.js';

/**
 * Caso de uso: importar um extrato em PDF.
 * extrair texto -> interpretar transações -> categorizar -> persistir (atomicamente).
 *
 * Todas as dependências são injetadas, o que permite trocar o extrator,
 * o parser ou o categorizador sem alterar este fluxo (Dependency Inversion).
 */
export class ImportStatementService {
  #textExtractor;
  #parser;
  #categorizer;
  #statements;
  #transactions;
  #runInTransaction;

  constructor({ textExtractor, parser, categorizer, statementRepository, transactionRepository, runInTransaction }) {
    this.#textExtractor = textExtractor;
    this.#parser = parser;
    this.#categorizer = categorizer;
    this.#statements = statementRepository;
    this.#transactions = transactionRepository;
    this.#runInTransaction = runInTransaction;
  }

  /**
   * @param {{ filePath: string, fileName: string }} input
   */
  async execute({ filePath, fileName }) {
    const fileHash = await hashFile(filePath);
    if (this.#statements.findByHash(fileHash)) {
      throw new ConflictError(`O arquivo "${fileName}" já foi importado anteriormente.`);
    }

    const { method, pages, warnings = [] } = await this.#textExtractor.extract(filePath);
    const parsed = this.#parser.parse(pages);
    if (parsed.length === 0) {
      throw new ExtractionError('Nenhuma transação reconhecida no PDF. Verifique se é um extrato ou fatura.');
    }

    const transactions = parsed.map((transaction) => ({
      ...transaction,
      type: transaction.amountCents < 0 ? 'expense' : 'income',
      categoryId: this.#categorizer.categorize(transaction),
    }));

    const statementId = this.#runInTransaction(() => {
      const id = this.#statements.create({ fileName, fileHash, extractionMethod: method });
      this.#transactions.insertMany(id, transactions);
      return id;
    });

    return { statementId, extractionMethod: method, warnings, importedCount: transactions.length };
  }
}

async function hashFile(filePath) {
  const content = await fs.readFile(filePath);
  return crypto.createHash('sha256').update(content).digest('hex');
}
