import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { CATEGORIES, CATEGORY_IDS } from '../src/domain/categories.js';
import { CategorizationService } from '../src/services/CategorizationService.js';

describe('CategorizationService', () => {
  const categorizer = new CategorizationService(CATEGORIES);
  const categorize = (description, amountCents = -1000) => categorizer.categorize({ description, amountCents });

  it('categoriza por palavra-chave ignorando acentos e caixa', () => {
    assert.equal(categorize('Farmácia São João'), CATEGORY_IDS.HEALTH);
    assert.equal(categorize('netflix.com'), CATEGORY_IDS.LEISURE);
  });

  it('prioriza a palavra-chave mais específica', () => {
    assert.equal(categorize('UBER EATS PEDIDO'), CATEGORY_IDS.FOOD);
    assert.equal(categorize('UBER *TRIP'), CATEGORY_IDS.TRANSPORT);
  });

  it('casa apenas palavras inteiras', () => {
    assert.equal(categorize('ESTIMATIVA XPTO'), CATEGORY_IDS.OTHER);
  });

  it('usa o sinal do valor como fallback', () => {
    assert.equal(categorize('LOJA DESCONHECIDA', -500), CATEGORY_IDS.OTHER);
    assert.equal(categorize('CREDITO DESCONHECIDO', 500), CATEGORY_IDS.INCOME);
  });
});
