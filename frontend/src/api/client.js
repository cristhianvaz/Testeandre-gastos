const BASE_URL = '/api';

async function request(path, options = {}) {
  const response = await fetch(`${BASE_URL}${path}`, options);
  if (response.status === 204) return null;

  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || `Erro ${response.status}`);
  return body;
}

function toQuery(params) {
  const entries = Object.entries(params).filter(([, value]) => value);
  return entries.length ? `?${new URLSearchParams(entries)}` : '';
}

export const api = {
  getCategories: () => request('/categories'),
  getStatements: () => request('/statements'),
  getTransactions: (filters) => request(`/transactions${toQuery(filters)}`),
  getSummary: (month) => request(`/transactions/summary${toQuery({ month })}`),

  uploadStatement(file) {
    const body = new FormData();
    body.append('file', file);
    return request('/statements', { method: 'POST', body });
  },

  deleteStatement: (id) => request(`/statements/${id}`, { method: 'DELETE' }),

  updateTransactionCategory: (id, categoryId) =>
    request(`/transactions/${id}/category`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ categoryId }),
    }),
};
