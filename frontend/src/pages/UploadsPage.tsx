import { ChangeEvent, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertCircle, CheckCircle2, Database, FileSpreadsheet, History, UploadCloud } from 'lucide-react';
import { api } from '../api';

type UploadKind = 'nps' | 'calls';
type UploadResult = {
  total_rows?: number;
  new_rows?: number;
  duplicate_rows?: number;
  error_rows?: number;
  duplicate_ids?: string[];
  errors?: Array<{ row: number; field: string; message: string }>;
  is_valid?: boolean;
};

const uploadTypes: Array<{
  kind: UploadKind;
  title: string;
  description: string;
  columns: string;
}> = [
  {
    kind: 'nps',
    title: 'NPS-анкеты',
    description: 'Основной файл оценок клиентов для дашборда, регионов и продуктовых страниц.',
    columns: 'ВОЛНА, Сегмент, Услуга, Продукт, Компания, ID Анкеты, Оценка, NPS, региональные колонки'
  },
  {
    kind: 'calls',
    title: 'Контроль поля',
    description: 'Файл обзвона для воронки: звонки, недозвоны, дозвоны, скринер, полные анкеты и выполнение плана.',
    columns: 'ID звонка, период, сегмент, база, продукт, всего звонков, недозвоны, дозвоны, план, собрано'
  }
];

export function UploadsPage() {
  const [activeKind, setActiveKind] = useState<UploadKind>('nps');
  const [files, setFiles] = useState<Record<UploadKind, File | null>>({ nps: null, calls: null });
  const [result, setResult] = useState<UploadResult | null>(null);
  const [error, setError] = useState('');
  const { data: history = [], refetch } = useQuery({ queryKey: ['upload-history'], queryFn: api.uploadHistory, retry: false });
  const activeFile = files[activeKind];

  function chooseFile(kind: UploadKind, event: ChangeEvent<HTMLInputElement>) {
    setFiles((current) => ({ ...current, [kind]: event.target.files?.[0] ?? null }));
    setActiveKind(kind);
    setResult(null);
    setError('');
  }

  async function run(action: 'validate' | 'commit') {
    if (!activeFile) return;
    setError('');
    try {
      const payload = action === 'validate' ? await api.uploadValidate(activeKind, activeFile) : await api.uploadCommit(activeKind, activeFile);
      setResult(payload as UploadResult);
      if (action === 'commit') await refetch();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось загрузить файл');
    }
  }

  return (
    <div className="page uploads-page">
      <div className="page-heading">
        <div>
          <div className="breadcrumbs">Администрирование <span>› Загрузка данных</span></div>
          <h1>Загрузка данных</h1>
        </div>
      </div>

      <section className="upload-flow-grid">
        {uploadTypes.map((type) => {
          const selected = activeKind === type.kind;
          const file = files[type.kind];
          return (
            <article key={type.kind} className={`upload-type-card ${selected ? 'active' : ''}`}>
              <div className="upload-type-head">
                <FileSpreadsheet size={28} />
                <div>
                  <h2>{type.title}</h2>
                  <p>{type.description}</p>
                </div>
              </div>
              <div className="upload-columns">{type.columns}</div>
              <label className="file-picker wide-picker">
                <UploadCloud size={18} />
                <span>{file ? file.name : 'Выбрать .xlsx'}</span>
                <input type="file" accept=".xlsx" onChange={(event) => chooseFile(type.kind, event)} />
              </label>
              <button className="secondary-button" onClick={() => setActiveKind(type.kind)}>
                Сделать активным
              </button>
            </article>
          );
        })}
      </section>

      <section className="panel upload-command-panel">
        <div className="upload-command-copy">
          <Database size={26} />
          <div>
            <h2>{activeKind === 'nps' ? 'Загрузка NPS-данных' : 'Загрузка данных контроля поля'}</h2>
            <p>{activeFile ? activeFile.name : 'Выберите XLSX-файл в одной из карточек выше, затем выполните проверку и загрузку.'}</p>
          </div>
        </div>
        <div className="upload-actions">
          <button className="secondary-button" onClick={() => run('validate')} disabled={!activeFile}>
            Проверить
          </button>
          <button className="primary-button compact" onClick={() => run('commit')} disabled={!activeFile || result?.is_valid === false}>
            Загрузить в систему
          </button>
        </div>

        {error && <div className="upload-alert error"><AlertCircle size={18} />{error}</div>}
        {result && (
          <div className={`upload-result ${result.is_valid ? 'valid' : 'invalid'}`}>
            <div className="upload-alert">
              {result.is_valid ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
              {result.is_valid ? 'Файл прошел проверку' : 'Найдены ошибки, загрузка заблокирована'}
            </div>
            <div className="upload-stats">
              <span><strong>{result.total_rows ?? 0}</strong> строк всего</span>
              <span><strong>{result.new_rows ?? 0}</strong> новых</span>
              <span><strong>{result.duplicate_rows ?? 0}</strong> дублей</span>
              <span><strong>{result.error_rows ?? 0}</strong> строк с ошибками</span>
            </div>
            {!!result.errors?.length && (
              <div className="upload-errors">
                {result.errors.slice(0, 10).map((item, index) => (
                  <div key={`${item.row}-${item.field}-${index}`}>
                    <b>Строка {item.row}</b> · {item.field}: {item.message}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </section>

      <section className="panel">
        <div className="panel-heading">
          <h2>История загрузок</h2>
          <History size={18} />
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Дата</th>
              <th>Тип</th>
              <th>Файл</th>
              <th>Новые</th>
              <th>Дубли</th>
              <th>Ошибки</th>
              <th>Статус</th>
            </tr>
          </thead>
          <tbody>
            {history.map((row) => (
              <tr key={String(row.id)}>
                <td>{String(row.created_at).replace('T', ' ').slice(0, 16)}</td>
                <td>{String(row.upload_type)}</td>
                <td>{String(row.filename)}</td>
                <td>{String(row.new_rows)}</td>
                <td>{String(row.duplicate_rows)}</td>
                <td>{String(row.error_rows)}</td>
                <td>{String(row.status)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
