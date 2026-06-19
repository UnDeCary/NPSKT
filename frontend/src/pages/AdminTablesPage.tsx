import { useQuery } from '@tanstack/react-query';
import { api } from '../api';

function SimpleTable({ title, rows }: { title: string; rows: Array<Record<string, unknown>> }) {
  const columns = rows[0] ? Object.keys(rows[0]) : [];
  return (
    <section className="panel">
      <div className="panel-heading">
        <h2>{title}</h2>
      </div>
      <table className="data-table">
        <thead>
          <tr>{columns.map((column) => <th key={column}>{column}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index}>{columns.map((column) => <td key={column}>{String(row[column] ?? '')}</td>)}</tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

export function AdminTablesPage() {
  const { data: users = [] } = useQuery({ queryKey: ['users'], queryFn: api.users });
  const { data: plans = [] } = useQuery({ queryKey: ['plans'], queryFn: api.plans });
  const { data: minimumBases = [] } = useQuery({ queryKey: ['minimum-bases'], queryFn: api.minimumBases });
  const { data: products = [] } = useQuery({ queryKey: ['dictionary-products'], queryFn: () => api.dictionary('products') });

  return (
    <div className="page">
      <div className="page-heading">
        <div>
          <div className="breadcrumbs">Администрирование &gt; Настройки</div>
          <h1>Настройки</h1>
        </div>
      </div>
      <SimpleTable title="Пользователи" rows={users as unknown as Array<Record<string, unknown>>} />
      <SimpleTable title="Продукты" rows={products as Array<Record<string, unknown>>} />
      <SimpleTable title="Планы" rows={plans as Array<Record<string, unknown>>} />
      <SimpleTable title="Минимальные базы" rows={minimumBases as Array<Record<string, unknown>>} />
    </div>
  );
}
