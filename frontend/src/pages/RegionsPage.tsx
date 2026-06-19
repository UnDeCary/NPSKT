import { RefreshCw, Users } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import { api } from '../api';
import {
  KAZAKHSTAN_MACROREGIONS,
  KAZAKHSTAN_MAP_VIEWBOX,
  kazakhstanMapRegions
} from '../data/kazakhstanMap';
import type { RegionMetric } from '../types';

type SegmentTab = 'total' | 'b2c' | 'b2b';
type SettlementMode = 'all' | 'city' | 'village';

const tabs: Array<{ key: SegmentTab; label: string; segment?: string }> = [
  { key: 'total', label: 'TOTAL' },
  { key: 'b2c', label: 'РОЗНИЦА (B2C)', segment: 'B2C' },
  { key: 'b2b', label: 'КОРПОРАТИВНЫЙ (B2B)', segment: 'B2B' }
];

const productChips: Record<SegmentTab, string[]> = {
  total: ['Все продукты', 'Интернет', 'Телевидение', 'FMS', 'ИКТ / Хостинг', 'Облачное видеонаблюдение'],
  b2c: ['Все продукты', 'Интернет', 'Телевидение', 'FMS'],
  b2b: ['Все продукты', 'Корпоративный интернет', 'ИКТ / Хостинг', 'Облачное видеонаблюдение']
};

const lineColors = ['#159447', '#2366f3', '#7a4bd8', '#2ca9c2', '#f3a10a', '#ff3632', '#08135d', '#708090'];

function formatInt(value: number) {
  return new Intl.NumberFormat('ru-RU').format(value);
}

function formatPercent(value: number | string) {
  const numeric = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(numeric)) return `${value}%`;
  return `${Number(numeric.toFixed(2))}%`;
}

function npsClass(value: number) {
  if (value >= 50) return 'excellent';
  if (value >= 20) return 'good';
  if (value >= 0) return 'watch';
  return 'risk';
}

function PeriodTick({ x = 0, y = 0, payload }: { x?: number; y?: number; payload?: { value: string } }) {
  const value = String(payload?.value ?? '').replace(' год', '').replace('I полугодие', 'I полуг.').replace('II полугодие', 'II полуг.');
  const lines = value.match(/^(\d{4})\s+(.*)$/) ? value.replace(/^(\d{4})\s+/, '$1\n').split('\n') : [value];
  return (
    <g transform={`translate(${x},${y})`} className="period-tick">
      {lines.map((line, index) => (
        <text key={`${line}-${index}`} x={0} y={index * 13} textAnchor="middle">
          {line}
        </text>
      ))}
    </g>
  );
}

function KazakhstanMap({ regions }: { regions: RegionMetric[] }) {
  const metricByRegion = new Map(regions.map((region) => [region.region, region]));

  return (
    <div className="kazakhstan-map-wrap">
      <svg className="kazakhstan-map" viewBox={KAZAKHSTAN_MAP_VIEWBOX} role="img" aria-label={'\u041a\u0430\u0440\u0442\u0430 \u041a\u0430\u0437\u0430\u0445\u0441\u0442\u0430\u043d\u0430 \u0441 \u043c\u0430\u043a\u0440\u043e\u0440\u0435\u0433\u0438\u043e\u043d\u0430\u043c\u0438'} preserveAspectRatio="xMidYMid meet">
        <defs>
          <filter id="pinShadow" x="-20%" y="-20%" width="140%" height="150%">
            <feDropShadow dx="0" dy="8" stdDeviation="7" floodColor="#08135d" floodOpacity=".16" />
          </filter>
        </defs>
        {kazakhstanMapRegions.map((mapRegion) => {
          const metric = metricByRegion.get(mapRegion.name);

          return (
            <path
              key={mapRegion.id}
              className={`kz-region-shape macro-${mapRegion.macroregion}${metric ? '' : ' no-data'}`}
              d={mapRegion.path}
            >
              <title>{metric ? `${mapRegion.name}: NPS ${metric.nps}, n=${metric.n}` : `${mapRegion.name}: \u043d\u0435\u0442 \u0434\u0430\u043d\u043d\u044b\u0445 \u0432 \u0411\u0414`}</title>
            </path>
          );
        })}
        {kazakhstanMapRegions.map((mapRegion) => {
          const metric = metricByRegion.get(mapRegion.name);
          if (!metric) return null;

          return (
            <g key={`${mapRegion.id}-pin`} className={`region-pin ${npsClass(metric.nps)}`} transform={`translate(${mapRegion.labelX} ${mapRegion.labelY})`} filter="url(#pinShadow)">
              <title>{`${mapRegion.name}: NPS ${metric.nps}, n=${metric.n}`}</title>
              <circle r="27" />
              <text className="pin-nps" x="0" y="-2" textAnchor="middle">{metric.nps}</text>
              <text className="pin-n" x="0" y="15" textAnchor="middle">n={formatInt(metric.n)}</text>
              <text className="pin-name" x="0" y="45" textAnchor="middle">{mapRegion.name.replace(' \u043e\u0431\u043b\u0430\u0441\u0442\u044c', '')}</text>
            </g>
          );
        })}
      </svg>
      <div className="map-legend macroregion-legend" aria-label={'\u041c\u0430\u043a\u0440\u043e\u0440\u0435\u0433\u0438\u043e\u043d\u044b'}>
        {KAZAKHSTAN_MACROREGIONS.map((macroregion) => (
          <span key={macroregion.key} className={`macro-legend-item macro-${macroregion.key}`}>
            <i />
            {macroregion.name}
          </span>
        ))}
      </div>
      {regions.length === 0 ? (
        <div className="map-empty">
          <strong>{'\u041d\u0435\u0442 \u0434\u0430\u043d\u043d\u044b\u0445 \u043f\u043e \u0432\u044b\u0431\u0440\u0430\u043d\u043d\u044b\u043c \u0444\u0438\u043b\u044c\u0442\u0440\u0430\u043c'}</strong>
          <span>{'\u041a\u0430\u0440\u0442\u0430 \u043f\u043e\u043a\u0430\u0437\u044b\u0432\u0430\u0435\u0442 \u0440\u0435\u0430\u043b\u044c\u043d\u044b\u0435 \u0433\u0440\u0430\u043d\u0438\u0446\u044b, \u0430 \u0437\u043d\u0430\u0447\u0435\u043d\u0438\u044f NPS \u0432\u044b\u0432\u043e\u0434\u044f\u0442\u0441\u044f \u0442\u043e\u043b\u044c\u043a\u043e \u0434\u043b\u044f \u0440\u0435\u0433\u0438\u043e\u043d\u043e\u0432, \u043d\u0430\u0439\u0434\u0435\u043d\u043d\u044b\u0445 \u0432 \u0431\u0430\u0437\u0435.'}</span>
        </div>
      ) : null}
    </div>
  );
}

export function RegionsPage() {
  const [tab, setTab] = useState<SegmentTab>('total');
  const [product, setProduct] = useState('Все продукты');
  const [settlement, setSettlement] = useState<SettlementMode>('all');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [wave, setWave] = useState('I полугодие 2026');

  const selectedTab = tabs.find((item) => item.key === tab) ?? tabs[0];
  const productParam = product === 'Все продукты' ? undefined : product;
  const settlementParam = settlement === 'all' ? undefined : settlement === 'city' ? 'Город' : 'Село';
  const products = productChips[tab];

  const { data: waves = [] } = useQuery({ queryKey: ['waves'], queryFn: api.waves });
  const { data: update } = useQuery({ queryKey: ['last-update'], queryFn: api.lastUpdate });
  const { data, isLoading, error } = useQuery({
    queryKey: ['regions-dashboard', wave, selectedTab.segment, productParam, settlementParam],
    queryFn: () => api.regions({ wave, segment: selectedTab.segment, product: productParam, settlement_type: settlementParam })
  });

  const trendRows = useMemo(() => data?.trend.map((point) => ({ period: point.period, ...point.values })) ?? [], [data]);
  const trendKeys = useMemo(() => data?.regions.map((region) => region.region) ?? [], [data]);
  const topRegion = data?.regions.reduce<RegionMetric | null>((best, region) => (!best || region.nps > best.nps ? region : best), null) ?? null;

  function selectTab(next: SegmentTab) {
    setTab(next);
    setProduct('Все продукты');
    if (next !== 'b2c') setSettlement('all');
  }

  if (isLoading) return <div className="state-panel">Загрузка регионов...</div>;
  if (error || !data) return <div className="state-panel error">Не удалось загрузить реальные данные по регионам</div>;

  return (
    <div className="page regions-page">
      <div className="page-heading">
        <div>
          <h1>NPS Dashboard / Регионы</h1>
          <div className="breadcrumbs">{tab === 'b2b' ? 'B2B / Корпоративный бизнес' : tab === 'b2c' ? 'B2C / Розничный бизнес' : 'Total'} <span>› Регионы</span></div>
        </div>
        <div className="heading-actions">
          <label className="control-card">
            <span>Волна</span>
            <strong>{wave}</strong>
            <select value={wave} onChange={(event) => setWave(event.target.value)} aria-label="Волна">
              {waves.map((item) => <option key={item.code} value={item.code}>{item.label}</option>)}
            </select>
          </label>
          <div className="update-card">
            <span>Данные обновлены</span>
            <strong>{update?.last_update ? new Date(update.last_update).toLocaleString('ru-RU') : 'Нет загрузок'}</strong>
            <RefreshCw size={17} />
          </div>
        </div>
      </div>

      <section className="region-filter-panel">
        <div className="region-tabs">
          {tabs.map((item) => (
            <button key={item.key} className={tab === item.key ? 'active' : ''} onClick={() => selectTab(item.key)}>
              {item.label}
            </button>
          ))}
        </div>
        <div className="chip-row">
          <span>Продукт</span>
          {products.map((item) => (
            <button key={item} className={product === item ? 'active' : ''} onClick={() => setProduct(item)}>
              {item}
            </button>
          ))}
        </div>
        <div className="chip-row settlement-row">
          <span>Тип населенного пункта</span>
          {(['all', 'city', 'village'] as SettlementMode[]).map((item) => (
            <button key={item} disabled={tab !== 'b2c'} className={settlement === item ? 'active' : ''} onClick={() => setSettlement(item)}>
              {item === 'all' ? 'Все НП' : item === 'city' ? 'Город' : 'Село'}
            </button>
          ))}
          {tab !== 'b2c' && <em>Фильтр город/село доступен только для B2C</em>}
        </div>
      </section>

      <section className="region-atlas">
        <div className="panel region-map-panel">
          <div className="panel-heading">
            <h2>Карта NPS по регионам ({tab === 'total' ? 'Total' : tab.toUpperCase()})</h2>
            <div className="map-legend">
              <span><i className="pin-excellent" />50+</span>
              <span><i className="pin-good" />20–49</span>
              <span><i className="pin-watch" />0–19</span>
              <span><i className="pin-risk" />ниже 0</span>
            </div>
          </div>
          <KazakhstanMap regions={data.regions} />
          <button className="drawer-tab" onClick={() => setDrawerOpen(true)}>Структура оценок</button>
          <aside className={`structure-drawer ${drawerOpen ? 'open' : ''}`}>
            <div className="drawer-heading">
              <h2>Структура оценок</h2>
              <button onClick={() => setDrawerOpen(false)}>Закрыть</button>
            </div>
            {data.structure.length ? (
              <ResponsiveContainer width="100%" height={390}>
                <BarChart data={data.structure} margin={{ top: 12, right: 4, left: -18, bottom: 30 }}>
                  <CartesianGrid stroke="#eef3f7" vertical={false} />
                  <XAxis dataKey="region" tick={{ fontSize: 10, fontWeight: 800, fill: '#06164a' }} interval={0} height={44} />
                  <YAxis domain={[0, 100]} ticks={[0, 50, 100]} tickFormatter={formatPercent} tick={{ fontSize: 10, fontWeight: 800, fill: '#06164a' }} />
                  <Tooltip formatter={(value) => formatPercent(value as number)} />
                  <Bar dataKey="promoters" stackId="a" fill="#159447" name="Промоутеры (9-10)" label={{ position: 'center', fill: '#fff', fontSize: 10, fontWeight: 800, formatter: formatPercent }} />
                  <Bar dataKey="neutrals" stackId="a" fill="#f0a400" name="Нейтралы (7-8)" label={{ position: 'center', fill: '#06164a', fontSize: 10, fontWeight: 800, formatter: formatPercent }} />
                  <Bar dataKey="detractors" stackId="a" fill="#ef2d24" name="Детракторы (0-6)" label={{ position: 'center', fill: '#fff', fontSize: 10, fontWeight: 800, formatter: formatPercent }} />
                </BarChart>
              </ResponsiveContainer>
            ) : <div className="state-panel">Нет структуры по выбранным фильтрам</div>}
          </aside>
        </div>

        <aside className="region-rank-panel">
          <div className="region-total-card">
            <span>Выборка</span>
            <strong>{formatInt(data.sample_total)}</strong>
            <small>{data.regions.length} регионов в базе</small>
          </div>
          <div className="region-total-card accent">
            <span>Лучший NPS</span>
            <strong>{topRegion ? topRegion.nps : '—'}</strong>
            <small>{topRegion?.region ?? 'Нет данных'}</small>
          </div>
          <div className="region-table">
            {data.regions.map((region) => (
              <div className="region-row-card" key={region.region}>
                <div>
                  <strong>{region.region}</strong>
                  <span>{region.macroregion}</span>
                </div>
                <b className={npsClass(region.nps)}>{region.nps}</b>
                <em><Users size={13} />{formatInt(region.n)}</em>
              </div>
            ))}
          </div>
        </aside>
      </section>

      <section className="panel region-trend-panel">
        <div className="panel-heading">
          <h2>Динамика NPS по регионам</h2>
          <div className="mini-period">Только периоды с данными из БД</div>
        </div>
        {trendRows.length > 1 && trendKeys.length ? (
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={trendRows} margin={{ top: 18, right: 24, left: -12, bottom: 34 }}>
              <CartesianGrid stroke="#e9eef5" vertical={false} />
              <XAxis dataKey="period" tick={<PeriodTick />} interval={0} height={50} tickMargin={14} />
              <YAxis domain={[-110, 110]} ticks={[-100, 0, 100]} tick={{ fontSize: 11, fill: '#06164a', fontWeight: 800 }} />
              <Tooltip />
              {trendKeys.map((key, index) => (
                <Line key={key} type="monotone" dataKey={key} stroke={lineColors[index % lineColors.length]} strokeWidth={2} dot={{ r: 3 }} label={{ position: 'top', fontSize: 10, fontWeight: 800, fill: lineColors[index % lineColors.length] }} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        ) : <div className="state-panel">Для динамики нужен минимум два периода с данными в БД</div>}
      </section>
    </div>
  );
}
