import path from 'node:path';

const PROJECT_ROOT = path.resolve(import.meta.dirname, '..', '..', '..');
const BACKEND_ROOT = path.join(PROJECT_ROOT, 'backend');

export const config = Object.freeze({
  port: Number(process.env.PORT) || 3333,
  databaseFile: process.env.DATABASE_FILE || path.join(BACKEND_ROOT, 'data', 'gastos.db'),
  uploadDir: process.env.UPLOAD_DIR || path.join(BACKEND_ROOT, 'data', 'uploads'),
  maxUploadBytes: 10 * 1024 * 1024,
  extractor: Object.freeze({
    pythonBin: process.env.PYTHON_BIN || path.join(PROJECT_ROOT, 'extractor', '.venv', 'bin', 'python'),
    scriptPath: path.join(PROJECT_ROOT, 'extractor', 'extract.py'),
    timeoutMs: 120_000,
  }),
  twilio: Object.freeze({
    accountSid: process.env.TWILIO_ACCOUNT_SID || process.env.TWILLIO_ACCOUNT_ID || '',
    authToken: process.env.TWILIO_AUTH_TOKEN || process.env.TWILLIO_SECRET || '',
    // Desligue apenas para testes locais sem a Twilio (nunca em ambiente exposto).
    validateSignature: process.env.TWILIO_VALIDATE_SIGNATURE !== 'false',
  }),
});
