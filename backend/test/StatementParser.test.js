import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { parseBrlToCents } from '../src/domain/money.js';
import { StatementParser } from '../src/services/StatementParser.js';

describe('parseBrlToCents', () => {
  it('converte formatos brasileiros para centavos', () => {
    assert.equal(parseBrlToCents('8.500,00'), 850000);
    assert.equal(parseBrlToCents('-2.200,00'), -220000);
    assert.equal(parseBrlToCents('R$ 10,5'), 1050);
    assert.equal(parseBrlToCents('99,90-'), -9990);
    assert.equal(parseBrlToCents('1234,56'), 123456);
  });
});

describe('StatementParser', () => {
  const parser = new StatementParser({ now: () => new Date('2026-10-25T00:00:00Z') });

  it('extrai transações e ignora cabeçalhos e totais', () => {
    const text = [
      'Banco Exemplo S.A.',
      'DATA DESCRICAO VALOR (R$)',
      '01/10/2026 SALARIO EMPRESA XYZ LTDA 8.500,00',
      '04/10/2026 UBER *TRIP SAO PAULO -32,90',
      'Total de saidas: R$ -32,90',
    ].join('\n');

    assert.deepEqual(parser.parse([text]), [
      { date: '2026-10-01', description: 'SALARIO EMPRESA XYZ LTDA', amountCents: 850000 },
      { date: '2026-10-04', description: 'UBER *TRIP SAO PAULO', amountCents: -3290 },
    ]);
  });

  it('respeita indicadores D/C e infere o ano quando ausente', () => {
    const [debit, credit] = parser.parse(['Fatura 2025\n05/03 IFOOD R$ 78,50 D\n06/03 ESTORNO LOJA 10,00 C']);
    assert.deepEqual(debit, { date: '2025-03-05', description: 'IFOOD', amountCents: -7850 });
    assert.equal(credit.amountCents, 1000);
  });

  it('não confunde números na descrição com o valor', () => {
    const [transaction] = parser.parse(['07/10/2026 DROGASIL FARMACIA 1234 -89,75']);
    assert.equal(transaction.description, 'DROGASIL FARMACIA 1234');
    assert.equal(transaction.amountCents, -8975);
  });

  it('descarta datas inválidas', () => {
    assert.deepEqual(parser.parse(['31/02/2026 COMPRA -10,00']), []);
  });
});
