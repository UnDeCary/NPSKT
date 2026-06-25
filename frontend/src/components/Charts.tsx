import { useEffect, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
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

export function formatBarPercent(value: number | string) {
  const numeric = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(numeric) && numeric > 0 ? formatPercent(numeric) : '';
}

export function scoreTooltipOrder(item: { dataKey?: string | number }) {
  const order: Record<string, number> = { promoters: 0, neutrals: 1, detractors: 2 };
  return order[String(item.dataKey)] ?? 99;
}

function splitPeriod(value: string) {
  const halfYear = value.match(/^(I|II)\s+полугодие\s+(\d{4})$/);
  if (halfYear) return [`${halfYear[1] === 'I' ? 'H1' : 'H2'} ${halfYear[2].slice(-2)}`];
  const normalized = value.replace(' год', '');
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

function NpsLineLabel({ x = 0, y = 0, value = 0, color }: { x?: number; y?: number; value?: number; color: string }) {
  return (
    <text x={x} y={y - 8} textAnchor="middle" fill={value < 0 ? '#ef2d24' : color} fontSize={11} fontWeight={800}>
      {value}%
    </text>
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
  const [visibleKeys, setVisibleKeys] = useState(() => new Set(keys));
  useEffect(() => setVisibleKeys(new Set(keys)), [data.primary.key, data.comparisons.map((item) => item.key).join('|')]);

  const toggleKey = (key: string) => {
    setVisibleKeys((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  return (
    <section className="panel chart-panel trend-panel">
      <div className="panel-heading">
        <h2>Динамика NPS</h2>
        <PeriodicitySelect periodicity={periodicity} onPeriodicity={onPeriodicity} />
      </div>
      <div className="trend-legend" aria-label="Отображаемые линии графика">
        {keys.map((key, index) => (
          <button
            type="button"
            key={key}
            className={visibleKeys.has(key) ? 'active' : ''}
            aria-pressed={visibleKeys.has(key)}
            onClick={() => toggleKey(key)}
          >
            <i style={{ backgroundColor: palette[index % palette.length] }} />
            <span>{labels.get(key)}</span>
          </button>
        ))}
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={rows} margin={{ top: 18, right: 24, left: 0, bottom: 28 }}>
          <CartesianGrid stroke="#e9eef5" vertical={false} />
          <XAxis dataKey="period" tick={<PeriodTick />} interval={0} height={42} tickMargin={13} padding={{ left: 26, right: 26 }} />
          <YAxis domain={[-110, 110]} ticks={[-100, 0, 100]} tick={{ fontSize: 11, fill: '#06164a', fontWeight: 700 }} />
          <Tooltip formatter={(value) => `${value}%`} />
          {keys.map((key, index) => (
            <Line
              key={key}
              hide={!visibleKeys.has(key)}
              type="monotone"
              dataKey={key}
              name={labels.get(key)}
              stroke={palette[index % palette.length]}
              strokeWidth={2}
              dot={{ r: 3, strokeWidth: 1 }}
              label={<NpsLineLabel color={palette[index % palette.length]} />}
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
                <Tooltip formatter={(value) => formatPercent(value as number)} itemSorter={scoreTooltipOrder} />
                <Bar dataKey="detractors" stackId={STRUCTURE_STACK_ID} name="Детракторы (0-6)" fill="#ef2d24">
                  <LabelList dataKey="detractors" position="center" fill="#fff" fontSize={9} fontWeight={800} formatter={formatBarPercent} />
                </Bar>
                <Bar dataKey="neutrals" stackId={STRUCTURE_STACK_ID} name="Нейтралы (7-8)" fill="#f0b10a">
                  <LabelList dataKey="neutrals" position="center" fill="#06164a" fontSize={9} fontWeight={800} formatter={formatBarPercent} />
                </Bar>
                <Bar dataKey="promoters" stackId={STRUCTURE_STACK_ID} name="Промоутеры (9-10)" fill="#159447">
                  <LabelList dataKey="promoters" position="center" fill="#fff" fontSize={9} fontWeight={800} formatter={formatBarPercent} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="mini-legend">
              <span><i className="red-bg" />Детракторы (0-6)</span>
              <span><i className="amber-bg" />Нейтралы (7-8)</span>
              <span><i className="green-bg" />Промоутеры (9-10)</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
