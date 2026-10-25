import { useCallback, useMemo, useState } from 'react';
import { api } from './api/client.js';
import { CategoryBreakdown } from './components/CategoryBreakdown.jsx';
import { Filters } from './components/Filters.jsx';
import { MonthlyChart } from './components/MonthlyChart.jsx';
import { StatementsPanel } from './components/StatementsPanel.jsx';
import { StatTiles } from './components/StatTiles.jsx';
import { Toast } from './components/Toast.jsx';
import { TransactionsTable } from './components/TransactionsTable.jsx';
import { UploadDropzone } from './components/UploadDropzone.jsx';
import { useDebouncedValue } from './hooks/useDebouncedValue.js';
import { useExpenseData } from './hooks/useExpenseData.js';
import { formatMonth } from './utils/format.js';

const EMPTY_FILTERS = { month: '', categoryId: '', type: '', search: '' };

export default function App() {
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [isUploading, setIsUploading] = useState(false);
  const [toast, setToast] = useState(null);

  const debouncedSearch = useDebouncedValue(filters.search);
  const queryFilters = useMemo(() => ({ ...filters, search: debouncedSearch }), [filters, debouncedSearch]);
  const { categories, statements, transactions, summary, error, reload } = useExpenseData(queryFilters);

  const categoriesById = useMemo(() => Object.fromEntries(categories.map((c) => [c.id, c])), [categories]);
  const closeToast = useCallback(() => setToast(null), []);

  const handleUpload = async (file) => {
    setIsUploading(true);
    try {
      const result = await api.uploadStatement(file);
      setToast({ kind: 'success', message: `${result.importedCount} transações importadas de "${file.name}".` });
      await reload();
    } catch (err) {
      setToast({ kind: 'error', message: err.message });
    } finally {
      setIsUploading(false);
    }
  };

  const handleChangeCategory = async (transactionId, categoryId) => {
    try {
      await api.updateTransactionCategory(transactionId, categoryId);
      await reload();
    } catch (err) {
      setToast({ kind: 'error', message: err.message });
    }
  };

  const handleDeleteStatement = async (statement) => {
    if (!window.confirm(`Remover "${statement.fileName}" e suas ${statement.transactionCount} transações?`)) return;
    try {
      await api.deleteStatement(statement.id);
      setToast({ kind: 'info', message: 'Extrato removido.' });
      await reload();
    } catch (err) {
      setToast({ kind: 'error', message: err.message });
    }
  };

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="brand__logo" aria-hidden>💸</span>
          <div>
            <h1>Controle de Gastos</h1>
            <p className="muted">
              {filters.month ? formatMonth(filters.month) : 'Visão geral de todos os períodos'}
            </p>
          </div>
        </div>
      </header>

      <main className="layout">
        <UploadDropzone onUpload={handleUpload} isUploading={isUploading} />

        {error && <div className="alert">Não foi possível falar com a API: {error}</div>}

        <Filters
          filters={filters}
          onChange={setFilters}
          months={summary?.months ?? []}
          categories={categories}
        />

        <StatTiles totals={summary?.totals} />

        <div className="charts">
          <CategoryBreakdown
            items={summary?.byCategory ?? []}
            categoriesById={categoriesById}
            selectedCategoryId={filters.categoryId}
            onSelect={(categoryId) => setFilters((current) => ({ ...current, categoryId }))}
          />
          <MonthlyChart months={summary?.byMonth ?? []} selectedMonth={filters.month} />
        </div>

        <TransactionsTable
          transactions={transactions}
          categories={categories}
          onChangeCategory={handleChangeCategory}
        />

        <StatementsPanel statements={statements} onDelete={handleDeleteStatement} />
      </main>

      <Toast toast={toast} onClose={closeToast} />
    </div>
  );
}
