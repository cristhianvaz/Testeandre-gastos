import multer from 'multer';
import { AppError } from '../domain/errors.js';

// eslint-disable-next-line no-unused-vars -- o Express identifica error handlers pela aridade 4
export function errorHandler(error, _req, res, _next) {
  if (error instanceof AppError) {
    res.status(error.statusCode).json({ error: error.message });
    return;
  }
  if (error instanceof multer.MulterError) {
    res.status(400).json({ error: `Falha no upload: ${error.message}` });
    return;
  }

  console.error(error);
  res.status(500).json({ error: 'Erro interno inesperado.' });
}
