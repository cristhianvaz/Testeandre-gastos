import { toTwiml } from '../services/whatsapp/TwilioWhatsAppGateway.js';
import { PROCESSING_MESSAGE, importErrorMessage } from '../services/whatsapp/messages.js';

/**
 * Webhook de mensagens recebidas no WhatsApp (Twilio).
 *
 * A Twilio aguarda no máximo 15s pela resposta. Texto é respondido na hora via TwiML;
 * PDFs são confirmados imediatamente e o resultado chega depois por mensagem ativa.
 */
export class WhatsAppController {
  #handler;
  #gateway;
  #validateSignature;

  constructor({ whatsAppMessageHandler, gateway, validateSignature }) {
    this.#handler = whatsAppMessageHandler;
    this.#gateway = gateway;
    this.#validateSignature = validateSignature;
  }

  webhook = async (req, res) => {
    if (this.#validateSignature && !this.#hasValidSignature(req)) {
      res.status(403).type('text/plain').send('Assinatura Twilio inválida.');
      return;
    }

    const message = parseIncomingMessage(req.body);
    res.type('text/xml');

    if (message.media.length === 0) {
      res.send(toTwiml(await this.#handler.handle(message)));
      return;
    }

    res.send(toTwiml(PROCESSING_MESSAGE));
    this.#processInBackground(message);
  };

  async #processInBackground(message) {
    try {
      const body = await this.#handler.handle(message);
      await this.#handler.reply({ ...message, body });
    } catch (error) {
      console.error('[whatsapp] falha ao processar mensagem', message.messageSid, error);
      await this.#handler
        .reply({ ...message, body: importErrorMessage('Erro inesperado. Tente novamente em instantes.') })
        .catch((replyError) => console.error('[whatsapp] falha ao responder', replyError));
    }
  }

  #hasValidSignature(req) {
    // Atrás do túnel, a URL assinada pela Twilio é a pública (https + host do túnel).
    const protocol = req.get('x-forwarded-proto')?.split(',')[0] ?? req.protocol;
    const host = req.get('x-forwarded-host') ?? req.get('host');
    return this.#gateway.isValidSignature({
      signature: req.get('x-twilio-signature'),
      url: `${protocol}://${host}${req.originalUrl}`,
      params: req.body,
    });
  }
}

function parseIncomingMessage(body = {}) {
  const mediaCount = Number(body.NumMedia) || 0;
  return {
    messageSid: body.MessageSid ?? 'unknown',
    from: body.From,
    to: body.To,
    body: body.Body ?? '',
    media: Array.from({ length: mediaCount }, (_, index) => ({
      url: body[`MediaUrl${index}`],
      contentType: body[`MediaContentType${index}`],
    })),
  };
}
