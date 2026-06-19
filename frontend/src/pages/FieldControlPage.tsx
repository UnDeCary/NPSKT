import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  AlertTriangle,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  Cloud,
  Database,
  Globe2,
  Monitor,
  Phone,
  PhoneCall,
  PhoneOff,
  Radio,
  RefreshCw,
  Search,
  Tv
} from 'lucide-react';
import { api } from '../api';

type FieldRow = {
  segment?: string | number;
  product?: string | number;
  base?: string | number;
  company?: string | number;
  total_calls?: string | number;
  no_answer?: string | number;
  answered?: string | number;
  refusal?: string | number;
  screener?: string | number;
  completed?: string | number;
  plan_target?: string | number;
  collected?: string | number;
  completion?: string | number;
};

type Funnel = {
  total_calls: number;
  no_answer: number;
  answered: number;
  refusal: number;
  screener: number;
  completed: number;
  plan_target: number;
  collected: number;
};

type FieldGroup = {
  key: string;
  title: string;
  segment: string;
  base: string;
  company: string;
  rows: FieldRow[];
  totals: Funnel;
};

function n(value: unknown) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function add(a: Funnel, row: FieldRow): Funnel {
  return {
    total_calls: a.total_calls + n(row.total_calls),
    no_answer: a.no_answer + n(row.no_answer),
    answered: a.answered + n(row.answered),
    refusal: a.refusal + n(row.refusal),
    screener: a.screener + n(row.screener),
    completed: a.completed + n(row.completed),
    plan_target: a.plan_target + n(row.plan_target),
    collected: a.collected + (n(row.collected) || n(row.completed))
  };
}

function emptyFunnel(): Funnel {
  return { total_calls: 0, no_answer: 0, answered: 0, refusal: 0, screener: 0, completed: 0, plan_target: 0, collected: 0 };
}

function sumRows(rows: FieldRow[]) {
  return rows.reduce((acc, row) => add(acc, row), emptyFunnel());
}

function pctValue(value: number, total: number) {
  return total ? value / total * 100 : 0;
}

function pct(value: number, total: number) {
  return `${pctValue(value, total).toFixed(1).replace('.', ',')}%`;
}

function fmt(value: number) {
  return value.toLocaleString('ru-RU');
}

function completionOf(data: Funnel) {
  return data.plan_target ? data.collected / data.plan_target * 100 : 0;
}

function productIcon(product: string) {
  const text = product.toLowerCase();
  if (text.includes('телевид') || text.includes('tv')) return Tv;
  if (text.includes('fms')) return Radio;
  if (text.includes('икт') || text.includes('хост')) return Monitor;
  if (text.includes('видео') || text.includes('cloud')) return Cloud;
  if (text.includes('корпоратив')) return BriefcaseBusiness;
  return Globe2;
}

function formatDate(value?: string | null) {
  if (!value) return 'Нет загрузок';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString('ru-RU', { dateStyle: 'short', timeStyle: 'short' });
}

function statusLabel(completion: number) {
  if (completion >= 100) return 'План закрыт';
  if (completion >= 85) return 'В зоне контроля';
  return 'Нужен добор';
}

function buildGroups(rows: FieldRow[]): FieldGroup[] {
  const groups = new Map<string, FieldRow[]>();
  rows.forEach((row) => {
    const segment = String(row.segment ?? 'Без сегмента');
    const base = String(row.base ?? 'Без базы');
    const company = String(row.company ?? '');
    const key = `${segment}::${base}::${company}`;
    groups.set(key, [...(groups.get(key) ?? []), row]);
  });

  return [...groups.entries()].map(([key, groupRows]) => {
    const first = groupRows[0] ?? {};
    const segment = String(first.segment ?? 'Без сегмента');
    const base = String(first.base ?? 'Без базы');
    const company = String(first.company ?? '');
    return {
      key,
      title: [base, segment].filter(Boolean).join(' / '),
      segment,
      base,
      company,
      rows: groupRows,
      totals: sumRows(groupRows)
    };
  });
}

function Metric({ label, value, percent, tone, icon: Icon }: { label: string; value: number; percent?: string; tone: 'blue' | 'red' | 'green' | 'amber'; icon?: typeof Phone }) {
  return (
    <div className={`field-metric ${tone}`}>
      <div className="metric-line">
        {Icon && <Icon size={18} />}
        <span>{label}</span>
      </div>
      <strong>{fmt(value)}</strong>
      {percent ? <small>{percent}</small> : null}
    </div>
  );
}

function FunnelSummaryCard({ title, subtitle, data }: { title: string; subtitle: string; data: Funnel }) {
  const completion = completionOf(data);
  return (
    <section className="field-summary-card field-summary-card-live">
      <div className="field-summary-head">
        <div>
          <h2>{title}</h2>
          <span>{subtitle}</span>
        </div>
        <strong className={completion >= 100 ? 'green' : 'red'}>{completion.toFixed(1).replace('.', ',')}%</strong>
      </div>
      <div className="field-funnel">
        <Metric icon={Phone} label="Всего звонков" value={data.total_calls} percent="100%" tone="blue" />
        <Metric icon={PhoneOff} label="Недозвоны" value={data.no_answer} percent={pct(data.no_answer, data.total_calls)} tone="red" />
        <Metric icon={PhoneCall} label="Дозвоны" value={data.answered} percent={pct(data.answered, data.total_calls)} tone="green" />
        <div className="field-stage-box">
          <Metric label="Отказ / сброс" value={data.refusal} percent={pct(data.refusal, data.total_calls)} tone="red" />
          <Metric label="Скринер" value={data.screener} percent={pct(data.screener, data.total_calls)} tone="amber" />
          <Metric label="Полная анкета" value={data.completed} percent={pct(data.completed, data.total_calls)} tone="green" />
        </div>
        <div className="field-plan-box">
          <span>План анкет</span>
          <strong>{fmt(data.plan_target)}</strong>
          <span>Собрано анкет</span>
          <strong className="green">{fmt(data.collected)}</strong>
          <span>Статус</span>
          <strong className={completion >= 100 ? 'green' : 'red'}>{statusLabel(completion)}</strong>
        </div>
      </div>
    </section>
  );
}

function FieldRadar({ data }: { data: Funnel }) {
  const completion = Math.min(100, completionOf(data));
  const response = pctValue(data.answered, data.total_calls);
  const loss = pctValue(data.no_answer + data.refusal, data.total_calls);
  const screener = pctValue(data.screener, data.total_calls);
  const points = [
    { label: 'План', value: completion, className: 'green' },
    { label: 'Дозвон', value: response, className: 'blue' },
    { label: 'Потери', value: loss, className: loss > 35 ? 'red' : 'amber' },
    { label: 'Скринер', value: screener, className: 'amber' }
  ];

  return (
    <section className="field-radar-panel">
      <div className="field-radar-core">
        <span>Field pulse</span>
        <strong>{completion.toFixed(0)}%</strong>
        <small>{statusLabel(completion)}</small>
      </div>
      <div className="field-radar-list">
        {points.map((point) => (
          <div key={point.label} className="field-radar-row">
            <span>{point.label}</span>
            <div><i className={point.className} style={{ width: `${Math.min(100, point.value)}%` }} /></div>
            <strong>{point.value.toFixed(1).replace('.', ',')}%</strong>
          </div>
        ))}
      </div>
    </section>
  );
}

function DirectionCard({ row }: { row: FieldRow }) {
  const product = String(row.product ?? 'Без продукта');
  const Icon = productIcon(product);
  const total = n(row.total_calls);
  const completion = n(row.plan_target) ? (n(row.collected) || n(row.completed)) / n(row.plan_target) * 100 : n(row.completion);
  return (
    <article className="direction-card direction-card-live">
      <div className="direction-title">
        <Icon size={22} />
        <div>
          <h3>{product}</h3>
          <span>{String(row.company || row.base || '')}</span>
        </div>
        <strong className={completion >= 100 ? 'green' : completion >= 85 ? 'amber' : 'red'}>{completion.toFixed(1).replace('.', ',')}%</strong>
      </div>
      <div className="field-progress-line">
        <i style={{ width: `${Math.min(100, completion)}%` }} />
      </div>
      <div className="direction-grid">
        <Metric label="Всего звонков" value={total} tone="blue" />
        <Metric label="Недозвоны" value={n(row.no_answer)} percent={pct(n(row.no_answer), total)} tone="red" />
        <Metric label="Дозвоны" value={n(row.answered)} percent={pct(n(row.answered), total)} tone="green" />
        <Metric label="Отказ / сброс" value={n(row.refusal)} percent={pct(n(row.refusal), total)} tone="red" />
        <Metric label="Скринер" value={n(row.screener)} percent={pct(n(row.screener), total)} tone="amber" />
        <Metric label="Полная анкета" value={n(row.completed)} percent={pct(n(row.completed), total)} tone="green" />
      </div>
    </article>
  );
}

function EmptyFieldState({ wave }: { wave: string }) {
  return (
    <section className="field-empty-state">
      <Database size={34} />
      <h2>Нет данных контроля поля</h2>
      <p>В базе нет строк звонков для волны “{wave}”. Загрузите файл контроля поля или выберите период, где есть реальные данные.</p>
    </section>
  );
}

export function FieldControlPage() {
  const [wave, setWave] = useState('I полугодие 2026');
  const [activeGroupIndex, setActiveGroupIndex] = useState(0);
  const { data: waves = [] } = useQuery({ queryKey: ['waves'], queryFn: api.waves });
  const { data: update } = useQuery({ queryKey: ['last-update'], queryFn: api.lastUpdate });
  const { data, isLoading, error } = useQuery({ queryKey: ['field-control', wave], queryFn: () => api.fieldControl(wave) });
  const rows = (data?.rows ?? []) as FieldRow[];
  const groups = useMemo(() => buildGroups(rows), [rows]);
  const total = useMemo(() => sumRows(rows), [rows]);
  const activeGroup = groups[Math.min(activeGroupIndex, Math.max(groups.length - 1, 0))];

  function selectWave(nextWave: string) {
    setWave(nextWave);
    setActiveGroupIndex(0);
  }

  return (
    <div className="page field-page">
      <div className="page-heading">
        <div>
          <h1>Контроль поля</h1>
          <div className="breadcrumbs">Реальные данные звонков из базы <span>› {wave}</span></div>
        </div>
        <div className="heading-actions">
          <label className="control-card wide">
            <span>Волна</span>
            <strong>{wave}</strong>
            <select value={wave} onChange={(event) => selectWave(event.target.value)} aria-label="Волна контроля поля">
              {waves.map((item) => <option key={item.code} value={item.code}>{item.label}</option>)}
            </select>
          </label>
          <div className="update-card">
            <span>Данные обновлены</span>
            <strong>{formatDate(update?.last_update)}</strong>
            <RefreshCw size={17} />
          </div>
        </div>
      </div>

      {isLoading ? <div className="state-panel">Загрузка контроля поля...</div> : null}
      {error ? <div className="state-panel error">Не удалось загрузить реальные данные контроля поля</div> : null}
      {!isLoading && !error && rows.length === 0 ? <EmptyFieldState wave={wave} /> : null}

      {!isLoading && !error && rows.length > 0 ? (
        <>
          <div className="field-command-strip">
            <div>
              <span>Звонки</span>
              <strong>{fmt(total.total_calls)}</strong>
            </div>
            <div>
              <span>Анкеты</span>
              <strong>{fmt(total.collected)} / {fmt(total.plan_target)}</strong>
            </div>
            <div>
              <span>Дозвон</span>
              <strong>{pct(total.answered, total.total_calls)}</strong>
            </div>
            <div>
              <span>Группы</span>
              <strong>{groups.length}</strong>
            </div>
          </div>

          <div className="field-summary-grid field-overview-grid">
            <FunnelSummaryCard title="TOTAL ПО ВОЛНЕ" subtitle={`${rows.length} строк в базе`} data={total} />
            <FieldRadar data={total} />
          </div>

          <section className="field-detail-panel field-detail-panel-live">
            <div className="field-detail-head">
              <div>
                <h2>Разрез по направлениям</h2>
                <span>Группировка по базе, сегменту и компании из БД</span>
              </div>
              <div className="field-tabs" role="tablist" aria-label="Группы контроля поля">
                {groups.map((group, index) => (
                  <button key={group.key} className={index === activeGroupIndex ? 'active' : ''} onClick={() => setActiveGroupIndex(index)}>
                    {group.title}
                  </button>
                ))}
              </div>
            </div>

            {activeGroup ? (
              <>
                <div className="field-group-banner">
                  <div>
                    <span>{activeGroup.segment}</span>
                    <h2>{activeGroup.title}</h2>
                    {activeGroup.company ? <p>{activeGroup.company}</p> : null}
                  </div>
                  <div>
                    <CheckCircle2 size={18} />
                    {statusLabel(completionOf(activeGroup.totals))}
                  </div>
                </div>
                <div className="direction-grid-cards">
                  {activeGroup.rows.map((row) => <DirectionCard key={`${row.segment}-${row.base}-${row.company}-${row.product}`} row={row} />)}
                </div>
              </>
            ) : null}
          </section>

          <section className="field-table-panel">
            <div className="field-table-head">
              <div>
                <Search size={18} />
                <h2>Все строки из базы</h2>
              </div>
              <span>Без демо-данных и синтетических пересчетов</span>
            </div>
            <div className="field-table-scroll">
              <table className="field-live-table">
                <thead>
                  <tr>
                    <th>Сегмент</th>
                    <th>База</th>
                    <th>Продукт</th>
                    <th>Звонки</th>
                    <th>Дозвон</th>
                    <th>Анкеты</th>
                    <th>План</th>
                    <th>Выполнение</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => {
                    const rowCompletion = n(row.plan_target) ? (n(row.collected) || n(row.completed)) / n(row.plan_target) * 100 : n(row.completion);
                    return (
                      <tr key={`${row.segment}-${row.base}-${row.company}-${row.product}`}>
                        <td>{row.segment}</td>
                        <td>{row.base}</td>
                        <td>{row.product}</td>
                        <td>{fmt(n(row.total_calls))}</td>
                        <td>{pct(n(row.answered), n(row.total_calls))}</td>
                        <td>{fmt(n(row.collected) || n(row.completed))}</td>
                        <td>{fmt(n(row.plan_target))}</td>
                        <td><span className={rowCompletion >= 100 ? 'status-pill green' : rowCompletion >= 85 ? 'status-pill amber' : 'status-pill red'}>{rowCompletion.toFixed(1).replace('.', ',')}%</span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          <div className="field-footnote">
            <AlertTriangle size={14} />
            Проценты считаются от реальных звонков в выбранной волне. Если строки не загружены в БД, экран показывает пустое состояние.
          </div>
        </>
      ) : null}
    </div>
  );
}
