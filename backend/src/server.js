import { createApp } from './app.js';
import { config } from './config/index.js';
import { createDatabase } from './database/connection.js';
import { PythonPdfTextExtractor } from './services/PythonPdfTextExtractor.js';

const db = createDatabase(config.databaseFile);

const app = createApp({
  db,
  textExtractor: new PythonPdfTextExtractor(config.extractor),
  uploadDir: config.uploadDir,
  maxUploadBytes: config.maxUploadBytes,
  twilio: config.twilio,
});

const server = app.listen(config.port, () => {
  console.log(`API de gastos rodando em http://localhost:${config.port}/api`);
  const hasTwilio = Boolean(config.twilio.accountSid && config.twilio.authToken);
  console.log(`WhatsApp webhook: POST /whatsapp/webhook (${hasTwilio ? 'ativo' : 'desativado: sem credenciais Twilio'})`);
});

function shutdown() {
  server.close(() => {
    db.close();
    process.exit(0);
  });
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
