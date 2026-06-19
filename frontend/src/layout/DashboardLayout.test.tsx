import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { DashboardLayout } from './DashboardLayout';

vi.mock('../api', () => ({
  api: {
    me: vi.fn(async () => ({ login: 'admin', full_name: 'Admin', role: 'admin' })),
    lastUpdate: vi.fn(async () => ({ last_update: null }))
  },
  setToken: vi.fn()
}));

describe('DashboardLayout', () => {
  it('shows admin navigation entries for admin role', async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={['/']}>
          <Routes>
            <Route path="/" element={<DashboardLayout />}>
              <Route index element={<div>content</div>} />
            </Route>
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    );

    expect(await screen.findByText('Загрузка данных')).toBeInTheDocument();
    expect(await screen.findByText('Настройки')).toBeInTheDocument();
  });
});
