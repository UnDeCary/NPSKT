import { AlertTriangle, Frown, Meh, Smile, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Kpi } from '../types';
import { NpsGauge } from './NpsGauge';

function formatInt(value: number) {
  return new Intl.NumberFormat('ru-RU').format(value);
}

const KPI_ROUTES: Record<string, string> = {
  b2c: '/b2c',
  b2b: '/b2b',
  'b2c-internet': '/products/b2c-internet',
  'b2c-tv': '/products/b2c-tv',
  'b2c-fms': '/products/b2c-fms',
  'b2b-internet': '/b2b/products/internet',
  'b2b-ict': '/b2b/products/ict-hosting',
  'b2b-video': '/b2b/products/cloud-video'
};

function formatPeriodShort(period?: string) {
  if (!period) return 'Прошлый период';
  const halfYear = period.match(/^(I|II)\s+полугодие\s+(\d{4})$/);
  if (halfYear) return `${halfYear[1] === 'I' ? 'H1' : 'H2'} ${halfYear[2].slice(-2)}`;
  return period.replace(/\s+год$/, '');
}

function ScoreBreakdown({ kpi }: { kpi: Kpi }) {
  const rows = [
    { icon: Smile, cls: 'green', label: 'Промоутеры (9-10)', value: kpi.promoter_share },
    { icon: Meh, cls: 'amber', label: 'Нейтралы (7-8)', value: kpi.neutral_share },
    { icon: Frown, cls: 'red', label: 'Детракторы (0-6)', value: kpi.detractor_share }
  ];
  return (
    <div className="score-breakdown">
      {rows.map((row) => {
        const count = Math.round((kpi.n * row.value) / 100);
        return (
          <div className="score-row" key={row.label}>
            <row.icon className={row.cls} size={22} />
            <span>{row.label}</span>
            <strong className={row.cls}>
              {formatInt(count)} <small>({row.value}%)</small>
            </strong>
          </div>
        );
      })}
    </div>
  );
}

function PlanProgress({ kpi }: { kpi: Kpi }) {
  return (
    <div className="plan-box">
      <h4>Выполнение плана</h4>
      <div className="plan-grid">
        <span>План (n)</span>
        <strong>{formatInt(kpi.plan_target)}</strong>
        <span>Собрано (n)</span>
        <strong>{formatInt(kpi.plan_fact)}</strong>
        <span>Выполнение</span>
        <strong className="green">{kpi.plan_completion}%</strong>
      </div>
      <div className="progress-track">
        <div style={{ width: `${Math.min(100, kpi.plan_completion)}%` }} />
      </div>
      <div className="progress-labels">
        <span>0%</span>
        <span>100%</span>
      </div>
    </div>
  );
}

function NpsDelta({ kpi, previousNps, previousPeriod }: { kpi: Kpi; previousNps?: number; previousPeriod?: string }) {
  if (previousNps === undefined) return null;
  const delta = kpi.nps - previousNps;
  const direction = delta > 0 ? 'up' : delta < 0 ? 'down' : 'flat';
  return (
    <div className={`nps-delta ${direction}`}>
      <span>{formatPeriodShort(previousPeriod)}</span>
      <strong>{previousNps}%</strong>
      <b>{delta > 0 ? '▲' : delta < 0 ? '▼' : '●'} {Math.abs(delta)} п.п.</b>
    </div>
  );
}

export function KpiCard({
  kpi,
  large = false,
  previousNps,
  previousPeriod
}: {
  kpi: Kpi;
  large?: boolean;
  previousNps?: number;
  previousPeriod?: string;
}) {
  const route = KPI_ROUTES[kpi.key];
  const gauge = <NpsGauge value={kpi.nps} small={!large} />;
  return (
    <article className={`kpi-card ${large ? 'large' : 'compact'}`}>
      <div className="kpi-title-row">
        <h3>{kpi.label}</h3>
        {kpi.is_small_base && (
          <span className="warning" title="Малая база">
            <AlertTriangle size={16} />
          </span>
        )}
      </div>

      <div className="kpi-body">
        {route ? (
          <Link className="gauge-link" to={route} aria-label={`Открыть раздел ${kpi.label}`}>
            {gauge}
          </Link>
        ) : gauge}
        <ScoreBreakdown kpi={kpi} />
        {!large && <NpsDelta kpi={kpi} previousNps={previousNps} previousPeriod={previousPeriod} />}
        {!large && <PlanProgress kpi={kpi} />}
      </div>

      {large ? (
        <div className="kpi-footer">
          <div className="sample">
            <Users size={22} />
            <span>Выборка (n)</span>
            <strong>{formatInt(kpi.n)}</strong>
          </div>
          <NpsDelta kpi={kpi} previousNps={previousNps} previousPeriod={previousPeriod} />
        </div>
      ) : null}
    </article>
  );
}
