import { AlertTriangle, Frown, Meh, Smile, Users } from 'lucide-react';
import type { Kpi } from '../types';
import { NpsGauge } from './NpsGauge';

function formatInt(value: number) {
  return new Intl.NumberFormat('ru-RU').format(value);
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

export function KpiCard({ kpi, large = false }: { kpi: Kpi; large?: boolean }) {
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
        <NpsGauge value={kpi.nps} small={!large} />
        <ScoreBreakdown kpi={kpi} />
        {!large && <PlanProgress kpi={kpi} />}
      </div>

      {large ? (
        <div className="kpi-footer">
          <div className="sample">
            <Users size={22} />
            <span>Выборка (n)</span>
            <strong>{formatInt(kpi.n)}</strong>
          </div>
          <div className="wave-delta">
            <span>II полугодие 2026:</span>
            <strong>{Math.max(0, kpi.nps - 5)}</strong>
            <b>▲ 5</b>
          </div>
        </div>
      ) : null}
    </article>
  );
}
