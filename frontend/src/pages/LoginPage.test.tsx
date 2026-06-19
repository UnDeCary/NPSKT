import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { LoginPage } from './LoginPage';

vi.mock('../api', () => ({
  api: {
    login: vi.fn(async () => ({ access_token: 'token' })),
    forgotPassword: vi.fn(async () => ({ status: 'accepted', message: 'ok' }))
  },
  setToken: vi.fn()
}));

describe('LoginPage', () => {
  it('keeps login disabled until confidentiality checkbox is accepted', async () => {
    render(
      <BrowserRouter>
        <LoginPage />
      </BrowserRouter>
    );

    const button = screen.getByRole('button', { name: 'Войти' });
    expect(button).toBeDisabled();

    await userEvent.click(screen.getByRole('checkbox'));

    expect(button).toBeEnabled();
  });
});
