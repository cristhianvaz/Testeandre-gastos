import fs from 'node:fs';
import cors from 'cors';
import express from 'express';
import { CategoryController } from './controllers/CategoryController.js';
import { StatementController } from './controllers/StatementController.js';
import { TransactionController } from './controllers/TransactionController.js';
import { CATEGORIES } from './domain/categories.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { StatementRepository } from './repositories/StatementRepository.js';
import { TransactionRepository } from './repositories/TransactionRepository.js';
import { createRouter } from './routes/index.js';
import { CategorizationService } from './services/CategorizationService.js';
import { ImportStatementService } from './services/ImportStatementService.js';
import { StatementParser } from './services/StatementParser.js';
import { TwilioWhatsAppGateway } from './services/whatsapp/TwilioWhatsAppGateway.js';
import { WhatsAppMessageHandler } from './services/whatsapp/WhatsAppMessageHandler.js';
import { WhatsAppController } from './controllers/WhatsAppController.js';
import { createWhatsAppRouter } from './routes/whatsapp.js';

/**
 * Composition root: o único lugar que conhece as implementações concretas.
 * @param {{ db: import('better-sqlite3').Database, textExtractor: { extract(path: string): Promise<object> }, uploadDir: string, maxUploadBytes: number, twilio?: { accountSid: string, authToken: string, validateSignature: boolean } }} deps
 */
export function createApp({ db, textExtractor, uploadDir, maxUploadBytes, twilio }) {
  fs.mkdirSync(uploadDir, { recursive: true });

  const statementRepository = new StatementRepository(db);
  const transactionRepository = new TransactionRepository(db);

  const importStatementService = new ImportStatementService({
    textExtractor,
    parser: new StatementParser(),
    categorizer: new CategorizationService(CATEGORIES),
    statementRepository,
    transactionRepository,
    runInTransaction: (work) => db.transaction(work)(),
  });

  const app = express();
  app.use(cors());
  app.use(express.json());
  app.use(
    '/api',
    createRouter({
      statementController: new StatementController({ importStatementService, statementRepository }),
      transactionController: new TransactionController({ transactionRepository }),
      categoryController: new CategoryController({ categories: CATEGORIES }),
      uploadDir,
      maxUploadBytes,
    }),
  );
  app.use('/whatsapp', createWhatsAppRouter({ whatsAppController: createWhatsAppController() }));
  app.use(errorHandler);

  function createWhatsAppController() {
    if (!twilio?.accountSid || !twilio?.authToken) return null;

    const gateway = new TwilioWhatsAppGateway(twilio);
    const whatsAppMessageHandler = new WhatsAppMessageHandler({
      gateway,
      importStatementService,
      transactionRepository,
      categories: CATEGORIES,
      tempDir: uploadDir,
    });
    return new WhatsAppController({ whatsAppMessageHandler, gateway, validateSignature: twilio.validateSignature });
  }

  return app;
}
