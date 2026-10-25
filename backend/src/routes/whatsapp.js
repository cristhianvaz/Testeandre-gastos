import express, { Router } from 'express';

/** @param {{ whatsAppController: import('../controllers/WhatsAppController.js').WhatsAppController | null }} deps */
export function createWhatsAppRouter({ whatsAppController }) {
  const router = Router();

  if (!whatsAppController) {
    router.all('/webhook', (_req, res) =>
      res.status(503).json({ error: 'WhatsApp desativado: defina as credenciais da Twilio no .env.' }),
    );
    return router;
  }

  // A Twilio envia o webhook como application/x-www-form-urlencoded.
  router.post('/webhook', express.urlencoded({ extended: false }), whatsAppController.webhook);
  return router;
}
