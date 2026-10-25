import twilio from 'twilio';

const MAX_MEDIA_BYTES = 10 * 1024 * 1024;

/** Resposta síncrona do webhook no formato TwiML. */
export function toTwiml(text) {
  const response = new twilio.twiml.MessagingResponse();
  if (text) response.message(text);
  return response.toString();
}

/**
 * Adaptador para a Twilio: única classe que conhece a SDK/HTTP da Twilio.
 */
export class TwilioWhatsAppGateway {
  #accountSid;
  #authToken;
  #client;

  constructor({ accountSid, authToken }) {
    this.#accountSid = accountSid;
    this.#authToken = authToken;
    this.#client = twilio(accountSid, authToken);
  }

  /** Confere o header X-Twilio-Signature contra a URL pública e os parâmetros do POST. */
  isValidSignature({ signature, url, params }) {
    return Boolean(signature) && twilio.validateRequest(this.#authToken, signature, url, params);
  }

  /** Baixa a mídia anexada (a URL da Twilio exige Basic Auth e redireciona para o storage). */
  async downloadMedia(mediaUrl) {
    const credentials = Buffer.from(`${this.#accountSid}:${this.#authToken}`).toString('base64');
    const response = await fetch(mediaUrl, { headers: { Authorization: `Basic ${credentials}` } });
    if (!response.ok) throw new Error(`Falha ao baixar mídia da Twilio (HTTP ${response.status})`);

    const content = Buffer.from(await response.arrayBuffer());
    if (content.length > MAX_MEDIA_BYTES) throw new Error('Arquivo maior que 10 MB.');
    return content;
  }

  async sendMessage({ from, to, body }) {
    await this.#client.messages.create({ from, to, body });
  }
}
