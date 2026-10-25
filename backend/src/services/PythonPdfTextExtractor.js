import { execFile } from 'node:child_process';
import { ExtractionError } from '../domain/errors.js';

/**
 * Adaptador para o extrator Python (texto nativo + OCR).
 * Implementa o contrato `extract(filePath) => Promise<{ method, pages, warnings }>`.
 */
export class PythonPdfTextExtractor {
  #pythonBin;
  #scriptPath;
  #timeoutMs;

  constructor({ pythonBin, scriptPath, timeoutMs }) {
    this.#pythonBin = pythonBin;
    this.#scriptPath = scriptPath;
    this.#timeoutMs = timeoutMs;
  }

  extract(filePath) {
    return new Promise((resolve, reject) => {
      execFile(
        this.#pythonBin,
        [this.#scriptPath, filePath],
        { timeout: this.#timeoutMs, maxBuffer: 20 * 1024 * 1024 },
        (error, stdout, stderr) => {
          if (error) {
            reject(new ExtractionError(this.#readErrorMessage(stderr, error)));
            return;
          }
          try {
            resolve(JSON.parse(stdout));
          } catch {
            reject(new ExtractionError('Resposta inválida do extrator de PDF'));
          }
        },
      );
    });
  }

  #readErrorMessage(stderr, error) {
    try {
      return JSON.parse(stderr).error;
    } catch {
      if (error.code === 'ENOENT') {
        return `Python não encontrado em "${this.#pythonBin}". Rode "npm run setup" na raiz do projeto.`;
      }
      return stderr?.trim() || error.message;
    }
  }
}
