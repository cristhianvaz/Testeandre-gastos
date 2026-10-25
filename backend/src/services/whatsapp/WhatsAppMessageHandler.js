import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { AppError } from '../../domain/errors.js';
import {
  EMPTY_SUMMARY_MESSAGE,
  HELP_MESSAGE,
  NOT_PDF_MESSAGE,
  importErrorMessage,
  summaryMessage,
} from './messages.js';

const SUMMARY_COMMAND = /^\s*resumo\s*$/i;

/**
 * Caso de uso: responder a uma mensagem recebida no WhatsApp.
 * PDF -> importa e devolve o resumo do extrato; "resumo" -> visão geral; outro texto -> ajuda.
 */
export class WhatsAppMessageHandler {
  #gateway;
  #importStatement;
  #transactions;
  #categoriesById;
  #tempDir;

  constructor({ gateway, importStatementService, transactionRepository, categories, tempDir }) {
    this.#gateway = gateway;
    this.#importStatement = importStatementService;
    this.#transactions = transactionRepository;
    this.#categoriesById = Object.fromEntries(categories.map((category) => [category.id, category]));
    this.#tempDir = tempDir;
  }

  /**
   * @param {{ from: string, to: string, body: string, media: { url: string, contentType: string }[], messageSid: string }} message
   * @returns {Promise<string>} texto da resposta
   */
  async handle({ body, media, messageSid }) {
    if (media.length > 0) return this.#importPdfs(media, messageSid);
    if (SUMMARY_COMMAND.test(body)) return this.#overallSummary();
    return HELP_MESSAGE;
  }

  /** Envia uma mensagem ativa (fora da resposta do webhook). */
  reply({ from, to, body }) {
    // No webhook, "to" é o número da Twilio; a resposta sai dele para quem enviou.
    return this.#gateway.sendMessage({ from: to, to: from, body });
  }

  async #importPdfs(media, messageSid) {
    const pdfs = media.filter(({ contentType }) => contentType === 'application/pdf');
    if (pdfs.length === 0) return NOT_PDF_MESSAGE;

    const replies = [];
    for (const [index, item] of pdfs.entries()) {
      replies.push(await this.#importOne(item, `whatsapp-${messageSid}-${index + 1}.pdf`));
    }
    return replies.join('\n\n────────\n\n');
  }

  async #importOne({ url }, fileName) {
    const filePath = path.join(this.#tempDir, `${crypto.randomUUID()}.pdf`);
    try {
      await fs.writeFile(filePath, await this.#gateway.downloadMedia(url));
      const { statementId, importedCount } = await this.#importStatement.execute({ filePath, fileName });

      const { totals, byCategory } = this.#transactions.summarize({ statementId });
      return summaryMessage({
        title: `✅ *${importedCount} transações importadas!*`,
        totals,
        byCategory,
        categoriesById: this.#categoriesById,
      });
    } catch (error) {
      if (error instanceof AppError) return importErrorMessage(error.message);
      throw error;
    } finally {
      await fs.rm(filePath, { force: true });
    }
  }

  #overallSummary() {
    const { totals, byCategory } = this.#transactions.summarize();
    if (totals.count === 0) return EMPTY_SUMMARY_MESSAGE;

    return summaryMessage({
      title: '📊 *Resumo geral dos seus gastos*',
      totals,
      byCategory,
      categoriesById: this.#categoriesById,
    });
  }
}
