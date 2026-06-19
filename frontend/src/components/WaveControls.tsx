import { CalendarDays } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api';

export function WaveControls({
  wave,
  periodicity,
  onWave,
  onPeriodicity
}: {
  wave: string;
  periodicity: string;
  onWave: (value: string) => void;
  onPeriodicity: (value: string) => void;
}) {
  const { data: waves = [] } = useQuery({ queryKey: ['waves'], queryFn: api.waves });
  return (
    <div className="header-controls">
      <label className="control-card wide">
        <span>Период сбора данных</span>
        <strong>{wave === 'I полугодие 2026' ? '01.01.2026 - 15.06.2026' : wave}</strong>
        <CalendarDays size={17} />
        <select value={wave} onChange={(event) => onWave(event.target.value)} aria-label="Волна">
          {waves.map((item) => (
            <option key={item.code} value={item.code}>
              {item.label}
            </option>
          ))}
        </select>
      </label>
      <label className="control-card">
        <span>Периодичность</span>
        <strong>{periodicity === 'half' ? 'Полугодие' : 'Год'}</strong>
        <select value={periodicity} onChange={(event) => onPeriodicity(event.target.value)} aria-label="Периодичность">
          <option value="half">Полугодие</option>
          <option value="year">Год</option>
        </select>
      </label>
    </div>
  );
}
