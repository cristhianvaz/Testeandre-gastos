/**
 * Catálogo de categorias e palavras-chave usadas na categorização automática.
 * Para ensinar a engine uma nova regra basta adicionar a palavra-chave aqui.
 * Palavras-chave são comparadas sem acento e em caixa alta.
 */
export const CATEGORY_IDS = Object.freeze({
  FOOD: 'alimentacao',
  TRANSPORT: 'transporte',
  HOUSING: 'moradia',
  HEALTH: 'saude',
  LEISURE: 'lazer',
  SHOPPING: 'compras',
  EDUCATION: 'educacao',
  FEES: 'taxas',
  INCOME: 'receitas',
  OTHER: 'outros',
});

export const CATEGORIES = Object.freeze([
  {
    id: CATEGORY_IDS.FOOD,
    name: 'Alimentação',
    icon: '🍽️',
    keywords: [
      'SUPERMERCADO', 'MERCADO EXTRA', 'CARREFOUR', 'PAO DE ACUCAR', 'ASSAI', 'ATACADAO',
      'IFOOD', 'RAPPI', 'UBER EATS', 'RESTAURANTE', 'LANCHONETE', 'PADARIA', 'PIZZARIA',
      'BURGER', 'MCDONALDS', 'OUTBACK', 'HORTIFRUTI', 'ACOUGUE', 'CAFE',
    ],
  },
  {
    id: CATEGORY_IDS.TRANSPORT,
    name: 'Transporte',
    icon: '🚗',
    keywords: [
      'UBER', '99APP', '99 POP', 'CABIFY', 'POSTO', 'COMBUSTIVEL', 'GASOLINA', 'SHELL', 'IPIRANGA',
      'ESTACIONAMENTO', 'SEM PARAR', 'CONECTCAR', 'PEDAGIO', 'METRO', 'BILHETE UNICO',
    ],
  },
  {
    id: CATEGORY_IDS.HOUSING,
    name: 'Moradia',
    icon: '🏠',
    keywords: [
      'ALUGUEL', 'CONDOMINIO', 'IPTU', 'ENERGIA', 'ENEL', 'CEMIG', 'LIGHT', 'COPEL', 'SABESP',
      'AGUA', 'GAS NATURAL', 'COMGAS', 'INTERNET', 'VIVO FIBRA', 'CLARO', 'TIM', 'OI FIBRA',
    ],
  },
  {
    id: CATEGORY_IDS.HEALTH,
    name: 'Saúde',
    icon: '💊',
    keywords: [
      'FARMACIA', 'DROGASIL', 'DROGA RAIA', 'PAGUE MENOS', 'HOSPITAL', 'CLINICA', 'LABORATORIO',
      'UNIMED', 'AMIL', 'SULAMERICA', 'BRADESCO SAUDE', 'ACADEMIA', 'SMART FIT', 'DENTISTA',
    ],
  },
  {
    id: CATEGORY_IDS.LEISURE,
    name: 'Lazer',
    icon: '🎬',
    keywords: [
      'NETFLIX', 'SPOTIFY', 'DISNEY', 'HBO', 'PRIME VIDEO', 'YOUTUBE', 'CINEMA', 'CINEMARK',
      'INGRESSO', 'STEAM', 'PLAYSTATION', 'XBOX', 'SHOW', 'TEATRO', 'BAR',
    ],
  },
  {
    id: CATEGORY_IDS.SHOPPING,
    name: 'Compras',
    icon: '🛍️',
    keywords: [
      'AMAZON', 'MERCADO LIVRE', 'MERCADOLIVRE', 'MAGAZINE LUIZA', 'MAGALU', 'SHOPEE', 'SHEIN',
      'ALIEXPRESS', 'AMERICANAS', 'RENNER', 'RIACHUELO', 'ZARA', 'C&A', 'CENTAURO',
    ],
  },
  {
    id: CATEGORY_IDS.EDUCATION,
    name: 'Educação',
    icon: '📚',
    keywords: ['ALURA', 'UDEMY', 'COURSERA', 'ESCOLA', 'FACULDADE', 'UNIVERSIDADE', 'CURSO', 'LIVRARIA'],
  },
  {
    id: CATEGORY_IDS.FEES,
    name: 'Taxas e Tarifas',
    icon: '🏦',
    keywords: ['TARIFA', 'ANUIDADE', 'IOF', 'JUROS', 'MULTA', 'TAXA'],
  },
  {
    id: CATEGORY_IDS.INCOME,
    name: 'Receitas',
    icon: '💰',
    keywords: ['SALARIO', 'PIX RECEBIDO', 'TED RECEBIDA', 'DOC RECEBIDO', 'RENDIMENTO', 'REEMBOLSO', 'ESTORNO'],
  },
  {
    id: CATEGORY_IDS.OTHER,
    name: 'Outros',
    icon: '📦',
    keywords: [],
  },
]);

const CATEGORY_ID_SET = new Set(CATEGORIES.map((category) => category.id));

export function isValidCategoryId(id) {
  return CATEGORY_ID_SET.has(id);
}
