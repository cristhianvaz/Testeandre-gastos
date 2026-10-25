import { Router } from 'express';
import multer from 'multer';
import { ValidationError } from '../domain/errors.js';

export function createRouter({ statementController, transactionController, categoryController, uploadDir, maxUploadBytes }) {
  const upload = multer({
    dest: uploadDir,
    limits: { fileSize: maxUploadBytes, files: 1 },
    fileFilter: (_req, file, accept) => {
      const isPdf = file.mimetype === 'application/pdf' || file.originalname.toLowerCase().endsWith('.pdf');
      accept(isPdf ? null : new ValidationError('Apenas arquivos PDF são aceitos.'), isPdf);
    },
  });

  const router = Router();

  router.get('/health', (_req, res) => res.json({ status: 'ok' }));

  router.get('/categories', categoryController.list);

  router.get('/statements', statementController.list);
  router.post('/statements', upload.single('file'), statementController.upload);
  router.delete('/statements/:id', statementController.remove);

  router.get('/transactions', transactionController.list);
  router.get('/transactions/summary', transactionController.summary);
  router.patch('/transactions/:id/category', transactionController.updateCategory);

  return router;
}
