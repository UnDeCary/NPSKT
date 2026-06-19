import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { api } from '../api';
import { FieldControlPage } from './FieldControlPage';

vi.mock('../api', () => ({
  api: {
    fieldControl: vi.fn(),
    waves: vi.fn(),
    lastUpdate: vi.fn()
  }
}));

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <FieldControlPage />
    </QueryClientProvider>
  );
}

describe('FieldControlPage', () => {
  beforeEach(() => {
    vi.mocked(api.fieldControl).mockReset();
    vi.mocked(api.waves).mockResolvedValue([{ code: 'I полугодие 2026', label: 'I полугодие 2026' }]);
    vi.mocked(api.lastUpdate).mockResolvedValue({ last_update: null });
  });

  it('renders funnel summary and direction detail cards from API rows', async () => {
    vi.mocked(api.fieldControl).mockResolvedValue({
      title: 'Контроль поля',
      wave: 'I полугодие 2026',
      rows: [
        {
          segment: 'B2C',
          product: 'Интернет',
          base: 'Казахтелеком',
          total_calls: 111,
          no_answer: 10,
          answered: 101,
          refusal: 20,
          screener: 11,
          completed: 70,
          plan_target: 100,
          collected: 70,
          completion: 70
        }
      ]
    });

    renderPage();

    expect(await screen.findByText('TOTAL ПО ВОЛНЕ')).toBeInTheDocument();
    expect(screen.getByText('Field pulse')).toBeInTheDocument();
    expect(screen.getByText('Разрез по направлениям')).toBeInTheDocument();
    expect(screen.getAllByText('Интернет').length).toBeGreaterThan(0);
    expect(screen.getAllByText('111').length).toBeGreaterThan(0);
  });

  it('does not render demo rows when the database response is empty', async () => {
    vi.mocked(api.fieldControl).mockResolvedValue({
      title: 'Контроль поля',
      wave: 'I полугодие 2026',
      rows: []
    });

    renderPage();

    expect(await screen.findByText('Нет данных контроля поля')).toBeInTheDocument();
    expect(screen.queryByText('52 340')).not.toBeInTheDocument();
  });
});
