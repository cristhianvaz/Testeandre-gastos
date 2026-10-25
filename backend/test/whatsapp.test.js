import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { after, before, describe, it } from 'node:test';
import twilio from 'twilio';
import { createApp } from '../src/app.js';
import { config } from '../src/config/index.js';
import { createDatabase } from '../src/database/connection.js';
import { PythonPdfTextExtractor } from '../src/services/PythonPdfTextExtractor.js';

const SAMPLE_PDF = path.resolve(import.meta.dirname, '..', '..', 'samples', 'extrato-teste.pdf');
const AUTH_TOKEN = 'test-auth-token';

describe('Webhook do WhatsApp', () => {
  let server;
  let baseUrl;
  const sentMessages = [];

  before(async () => {
    const app = createApp({
      db: createDatabase(':memory:'),
      textExtractor: new PythonPdfTextExtractor(config.extractor),
      uploadDir: fs.mkdtempSync(path.join(os.tmpdir(), 'gastos-test-')),
      maxUploadBytes: config.maxUploadBytes,
      twilio: { accountSid: 'ACtest', authToken: AUTH_TOKEN, validateSignature: true },
    });

    // Substitui apenas a borda externa (rede da Twilio) por um fake.
    const { TwilioWhatsAppGateway } = await import('../src/services/whatsapp/TwilioWhatsAppGateway.js');
    TwilioWhatsAppGateway.prototype.downloadMedia = async () => fs.readFileSync(SAMPLE_PDF);
    TwilioWhatsAppGateway.prototype.sendMessage = async (message) => {
      sentMessages.push(message);
    };

    await new Promise((resolve) => {
      server = app.listen(0, resolve);
    });
    baseUrl = `http://127.0.0.1:${server.address().port}`;
  });

  after(() => server.close());

  const post = (params, { sign = true } = {}) => {
    const url = `${baseUrl}/whatsapp/webhook`;
    const headers = { 'Content-Type': 'application/x-www-form-urlencoded' };
    if (sign) headers['X-Twilio-Signature'] = twilio.getExpectedTwilioSignature(AUTH_TOKEN, url, params);
    return fetch(url, { method: 'POST', headers, body: new URLSearchParams(params) });
  };

  const baseMessage = { MessageSid: 'SM1', From: 'whatsapp:+5511999999999', To: 'whatsapp:+14155238886' };

  it('rejeita requisições sem assinatura válida', async () => {
    const response = await post({ ...baseMessage, Body: 'oi' }, { sign: false });
    assert.equal(response.status, 403);
  });

  it('responde com ajuda para mensagens de texto', async () => {
    const response = await post({ ...baseMessage, Body: 'oi', NumMedia: '0' });
    assert.equal(response.status, 200);
    assert.match(await response.text(), /Envie um \*extrato/);
  });

  it('importa o PDF recebido e envia o resumo categorizado', async () => {
    const response = await post({
      ...baseMessage,
      NumMedia: '1',
      MediaUrl0: 'https://api.twilio.com/fake-media',
      MediaContentType0: 'application/pdf',
    });
    assert.match(await response.text(), /Recebi seu PDF/);

    for (let attempt = 0; attempt < 50 && sentMessages.length === 0; attempt++) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    const [reply] = sentMessages;
    assert.equal(reply.to, baseMessage.From);
    assert.equal(reply.from, baseMessage.To);
    assert.match(reply.body, /20 transações importadas/);
    assert.match(reply.body, /Despesas: \*R\$\s4\.531,62\*/);
    assert.match(reply.body, /Moradia: \*R\$\s2\.517,41\*/);
  });

  it('responde ao comando "resumo"', async () => {
    const response = await post({ ...baseMessage, MessageSid: 'SM2', Body: 'Resumo', NumMedia: '0' });
    assert.match(await response.text(), /Resumo geral/);
  });
});
