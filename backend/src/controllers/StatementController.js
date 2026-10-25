import fs from 'node:fs/promises';
import { NotFoundError, ValidationError } from '../domain/errors.js';
import { parseId } from './params.js';

export class StatementController {
  #importStatement;
  #statements;

  constructor({ importStatementService, statementRepository }) {
    this.#importStatement = importStatementService;
    this.#statements = statementRepository;
  }

  upload = async (req, res) => {
    if (!req.file) throw new ValidationError('Envie um arquivo PDF no campo "file".');

    try {
      const result = await this.#importStatement.execute({
        filePath: req.file.path,
        fileName: req.file.originalname,
      });
      res.status(201).json(result);
    } finally {
      // Os dados já estão no banco; o arquivo temporário não é mais necessário.
      await fs.rm(req.file.path, { force: true });
    }
  };

  list = (_req, res) => {
    res.json(this.#statements.findAll());
  };

  remove = (req, res) => {
    const id = parseId(req.params.id);
    if (!this.#statements.delete(id)) throw new NotFoundError('Extrato não encontrado.');
    res.status(204).end();
  };
}
