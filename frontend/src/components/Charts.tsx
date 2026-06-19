import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import type { DashboardResponse } from '../types';

const palette = ['#159447', '#2462d1', '#7a4bd8', '#f0a400', '#55a7e8', '#0f8f72'];
export const STRUCTURE_STACK_ID = 'score-structure';

type TickProps = {
  x?: number;
  y?: number;
  payload?: { value: string };
};

type PeriodicityProps = {
  periodicity: string;
  onPeriodicity: (value: string) => void;
};

export function formatPercent(value: number | string) {
  const numeric = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(numeric)) return `${value}%`;
  return `${Number(numeric.toFixed(2))}%`;
}

function splitPeriod(value: string) {
  const normalized = value
    .replace(' год', '')
    .replace('I полугодие', 'I полуг.')
    .replace('II полугодие', 'II полуг.');
  if (normalized.includes('\n')) return normalized.split('\n');
  const match = normalized.match(/^(\d{4})\s+(.*)$/);
  return match ? [match[1], match[2]] : [normalized];
}

function PeriodTick({ x = 0, y = 0, payload }: TickProps) {
  const lines = splitPeriod(String(payload?.value ?? ''));
  return (
    <g transform={`translate(${x},${y})`} className="period-tick">
      {lines.map((line, index) => (
        <text key={line} x={0} y={index * 12} textAnchor="middle">
          {line}
        </text>
      ))}
    </g>
  );
}

function PeriodicitySelect({ periodicity, onPeriodicity }: PeriodicityProps) {
  return (
    <label className="mini-period">
      Периодичность
      <select value={periodicity} onChange={(event) => onPeriodicity(event.target.value)} aria-label="Периодичность графика">
        <option value="half">Полугодие</option>
        <option value="year">Год</option>
      </select>
    </label>
  );
}

export function TrendChart({ data, periodicity, onPeriodicity }: { data: DashboardResponse } & PeriodicityProps) {
  const rows = data.trend.map((point) => ({ period: point.period, ...point.values }));
  const keys = [data.primary.key, ...data.comparisons.map((item) => item.key)];
  const labels = new Map([[data.primary.key, data.primary.label], ...data.comparisons.map((item) => [item.key, item.label] as const)]);
  return (
    <section className="panel chart-panel trend-panel">
      <div className="panel-heading">
        <h2>Динамика NPS</h2>
        <PeriodicitySelect periodicity={periodicity} onPeriodicity={onPeriodicity} />
      </div>
      <ResponsiveContainer width="100%" height={208}>
        <LineChart data={rows} margin={{ top: 18, right: 24, left: 0, bottom: 28 }}>
          <CartesianGrid stroke="#e9eef5" vertical={false} />
          <XAxis dataKey="period" tick={<PeriodTick />} interval={0} height={42} tickMargin={13} padding={{ left: 26, right: 26 }} />
          <YAxis domain={[-110, 110]} ticks={[-100, 0, 100]} tick={{ fontSize: 11, fill: '#06164a', fontWeight: 700 }} />
          <Tooltip />
          <Legend iconType="circle" wrapperStyle={{ fontSize: 12, fontWeight: 700, paddingBottom: 8 }} verticalAlign="top" />
          {keys.map((key, index) => (
            <Line
              key={key}
              type="monotone"
              dataKey={key}
              name={labels.get(key)}
              stroke={palette[index % palette.length]}
              strokeWidth={2}
              dot={{ r: 3, strokeWidth: 1 }}
              label={{ position: 'top', fontSize: 11, fill: palette[index % palette.length], fontWeight: 800 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </section>
  );
}

export function StructureChart({ data, periodicity, onPeriodicity }: { data: DashboardResponse } & PeriodicityProps) {
  const cards = data.structure;
  return (
    <section className="panel structure-panel">
      <div className="panel-heading">
        <h2>Динамика структуры оценок (%)</h2>
        <PeriodicitySelect periodicity={periodicity} onPeriodicity={onPeriodicity} />
      </div>
      <div className={`structure-grid count-${Math.min(cards.length, 4)}`}>
        {cards.map((card) => (
          <div className="mini-structure" key={card.key}>
            <h3>{card.label}</h3>
            <ResponsiveContainer width="100%" height={210}>
              <BarChart data={card.rows} margin={{ top: 10, right: 4, left: -22, bottom: 24 }}>
                <CartesianGrid stroke="#eef3f7" vertical={false} />
                <XAxis dataKey="period" tick={<PeriodTick />} interval={0} height={42} tickMargin={12} />
                <YAxis domain={[0, 100]} tickFormatter={formatPercent} tick={{ fontSize: 10, fill: '#06164a', fontWeight: 700 }} ticks={[0, 50, 100]} />
                <Tooltip formatter={(value) => formatPercent(value as number)} />
                <Bar dataKey="promoters" stackId={STRUCTURE_STACK_ID} name="Промоутеры (9-10)" fill="#159447" label={{ position: 'center', fill: '#fff', fontSize: 9, fontWeight: 800, formatter: formatPercent }} />
                <Bar dataKey="neutrals" stackId={STRUCTURE_STACK_ID} name="Нейтралы (7-8)" fill="#f0b10a" label={{ position: 'center', fill: '#06164a', fontSize: 9, fontWeight: 800, formatter: formatPercent }} />
                <Bar dataKey="detractors" stackId={STRUCTURE_STACK_ID} name="Детракторы (0-6)" fill="#ef2d24" label={{ position: 'center', fill: '#fff', fontSize: 9, fontWeight: 800, formatter: formatPercent }} />
              </BarChart>
            </ResponsiveContainer>
            <div className="mini-legend">
              <span><i className="green-bg" />Промоутеры (9-10)</span>
              <span><i className="amber-bg" />Нейтралы (7-8)</span>
              <span><i className="red-bg" />Детракторы (0-6)</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
