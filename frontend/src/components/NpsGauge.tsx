const GAUGE_START = -120;
const GAUGE_END = 120;
const GAUGE_SWEEP = GAUGE_END - GAUGE_START;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function npsToGaugeAngle(value: number) {
  return GAUGE_START + ((clamp(value, -100, 100) + 100) / 200) * GAUGE_SWEEP;
}

function polarToCartesian(cx: number, cy: number, radius: number, angle: number) {
  const radians = ((angle - 90) * Math.PI) / 180;
  return {
    x: cx + radius * Math.cos(radians),
    y: cy + radius * Math.sin(radians)
  };
}

function arcPath(startAngle: number, endAngle: number) {
  const start = polarToCartesian(100, 96, 74, startAngle);
  const end = polarToCartesian(100, 96, 74, endAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? 0 : 1;
  return `M ${start.x} ${start.y} A 74 74 0 ${largeArcFlag} 1 ${end.x} ${end.y}`;
}

export function NpsGauge({ value, small }: { value: number; small?: boolean }) {
  const angle = npsToGaugeAngle(value);
  return (
    <div className={`gauge ${small ? 'small' : ''}`} aria-label={`NPS ${value}`}>
      <svg className="gauge-track" viewBox="0 0 200 145" aria-hidden="true">
        <path className="gauge-segment gauge-red" d={arcPath(-120, -4)} />
        <path className="gauge-segment gauge-amber" d={arcPath(2, 58)} />
        <path className="gauge-segment gauge-green" d={arcPath(64, 120)} />
        <g className="gauge-needle" transform={`rotate(${angle} 100 96)`}>
          <line x1="100" y1="96" x2="100" y2="34" />
          <circle cx="100" cy="96" r="4.5" />
        </g>
      </svg>
      <strong>{value}</strong>
      <span>NPS</span>
      <em className="min-label">-100</em>
      <em className="max-label">100</em>
    </div>
  );
}
