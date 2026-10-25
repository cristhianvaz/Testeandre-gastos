import { formatMonth } from '../utils/format.js';

export function Filters({ filters, onChange, months, categories }) {
  const update = (field) => (event) => onChange({ ...filters, [field]: event.target.value });
  const hasActiveFilters = Object.values(filters).some(Boolean);

  return (
    <div className="filters">
      <label className="field">
        <span>Período</span>
        <select value={filters.month} onChange={update('month')}>
          <option value="">Todos os meses</option>
          {months.map((month) => (
            <option key={month} value={month}>
              {formatMonth(month)}
            </option>
          ))}
        </select>
      </label>

      <label className="field">
        <span>Categoria</span>
        <select value={filters.categoryId} onChange={update('categoryId')}>
          <option value="">Todas</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.icon} {category.name}
            </option>
          ))}
        </select>
      </label>

      <label className="field">
        <span>Tipo</span>
        <select value={filters.type} onChange={update('type')}>
          <option value="">Entradas e saídas</option>
          <option value="expense">Somente despesas</option>
          <option value="income">Somente receitas</option>
        </select>
      </label>

      <label className="field field--grow">
        <span>Buscar</span>
        <input type="search" placeholder="Descrição da transação…" value={filters.search} onChange={update('search')} />
      </label>

      {hasActiveFilters && (
        <button type="button" className="btn btn--ghost" onClick={() => onChange({ month: '', categoryId: '', type: '', search: '' })}>
          Limpar filtros
        </button>
      )}
    </div>
  );
}
