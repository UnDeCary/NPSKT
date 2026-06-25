import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { RefreshCw } from 'lucide-react';
import { api } from '../api';
import { WaveControls } from '../components/WaveControls';
import { KpiCard } from '../components/KpiCard';
import { StructureChart, TrendChart } from '../components/Charts';

export function DashboardPage({ apiPath }: { apiPath: string }) {
  const [wave, setWave] = useState('I полугодие 2026');
  const [periodicity, setPeriodicity] = useState('half');
  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard', apiPath, wave, periodicity],
    queryFn: () => api.dashboard(apiPath, wave, periodicity)
  });
  const { data: update } = useQuery({ queryKey: ['last-update'], queryFn: api.lastUpdate });
  const isHome = apiPath.includes('/home');

  if (isLoading) return <div className="state-panel">Загрузка dashboard...</div>;
  if (error || !data) return <div className="state-panel error">Не удалось загрузить страницу</div>;

  const currentPeriodIndex = data.trend.findIndex((point) => point.period === data.wave);
  const previousPoint = data.trend[(currentPeriodIndex >= 0 ? currentPeriodIndex : data.trend.length) - 1];
  const previousNps = (key: string) => previousPoint?.values[key];

  return (
    <div className={`page ${isHome ? 'home-page' : 'product-page'}`}>
      <div className="page-heading">
        <div>
          <h1>NPS Dashboard</h1>
          <div className="breadcrumbs">{data.breadcrumbs.join(' › ')}</div>
        </div>
        <div className="heading-actions">
          {isHome ? <WaveControls wave={wave} periodicity={periodicity} onWave={setWave} onPeriodicity={setPeriodicity} /> : null}
          <div className="update-card">
            <span>Данные обновлены</span>
            <strong>{update?.last_update ? new Date(update.last_update).toLocaleString('ru-RU') : '09.06.2026 10:30'}</strong>
            <RefreshCw size={17} />
          </div>
          {isHome ? (
            <div className="header-wordmark">
              <strong>PHONETIC</strong>
              <span>ANALYTIC LAB</span>
            </div>
          ) : null}
        </div>
      </div>

      <section className={`kpi-grid comparison-count-${data.comparisons.length}`}>
        <KpiCard
          kpi={data.primary}
          large
          previousNps={previousNps(data.primary.key)}
          previousPeriod={previousPoint?.period}
        />
        <div className="comparison-grid">
          {data.comparisons.map((kpi) => (
            <KpiCard
              key={kpi.key}
              kpi={kpi}
              previousNps={previousNps(kpi.key)}
              previousPeriod={previousPoint?.period}
            />
          ))}
        </div>
      </section>

      <TrendChart data={data} periodicity={periodicity} onPeriodicity={setPeriodicity} />
      <StructureChart data={data} periodicity={periodicity} onPeriodicity={setPeriodicity} />
    </div>
  );
}
