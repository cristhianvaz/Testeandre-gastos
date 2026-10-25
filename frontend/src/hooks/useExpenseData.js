import { useCallback, useEffect, useState } from 'react';
import { api } from '../api/client.js';

/**
 * Centraliza o carregamento de dados do dashboard.
 * Componentes de UI recebem apenas dados prontos e callbacks.
 */
export function useExpenseData(filters) {
  const [categories, setCategories] = useState([]);
  const [statements, setStatements] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const { month, categoryId, type, search } = filters;

  const reload = useCallback(async () => {
    setIsLoading(true);
    try {
      const [statementList, transactionList, summaryData] = await Promise.all([
        api.getStatements(),
        api.getTransactions({ month, categoryId, type, search }),
        api.getSummary(month),
      ]);
      setStatements(statementList);
      setTransactions(transactionList);
      setSummary(summaryData);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [month, categoryId, type, search]);

  useEffect(() => {
    api.getCategories().then(setCategories).catch((err) => setError(err.message));
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  return { categories, statements, transactions, summary, isLoading, error, reload };
}
