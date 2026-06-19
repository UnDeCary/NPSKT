import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, setToken } from '../api';

const confidentiality =
  'Доступ к dashboard является персональным. Пользователь не имеет права передавать логин и пароль третьим лицам. Все действия, выполненные под учетной записью пользователя, считаются действиями данного пользователя. Пользователь несет ответственность за сохранность своих учетных данных и возможные последствия их передачи третьим лицам. Компания Phonetic’s Analytic Lab не несет ответственности за утечку данных, произошедшую вследствие передачи пользователем своих учетных данных другим лицам';

export function LoginPage() {
  const navigate = useNavigate();
  const [login, setLogin] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [accepted, setAccepted] = useState(false);
  const [forgot, setForgot] = useState(false);
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  async function submit(event: FormEvent) {
    event.preventDefault();
    const response = await api.login(login, password);
    setToken(response.access_token);
    navigate('/');
  }

  async function resetPassword(event: FormEvent) {
    event.preventDefault();
    const response = await api.forgotPassword(email);
    setMessage(response.message);
  }

  return (
    <main className="login-page">
      <section className="login-card">
        <div className="login-brand">
          <div className="brand-mark">PAL</div>
          <div>
            <h1>Phonetic’s Analytic Lab</h1>
            <span>Dashboard NPS KT</span>
          </div>
        </div>
        {!forgot ? (
          <form onSubmit={submit} className="login-form">
            <label>
              Логин
              <input value={login} onChange={(event) => setLogin(event.target.value)} />
            </label>
            <label>
              Пароль
              <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
            </label>
            <p className="confidentiality">{confidentiality}</p>
            <label className="check-row">
              <input type="checkbox" checked={accepted} onChange={(event) => setAccepted(event.target.checked)} />
              <span>Я ознакомлен(а) с условиями доступа и принимаю ответственность за сохранность логина и пароля</span>
            </label>
            <button className="primary-button" disabled={!accepted}>
              Войти
            </button>
            <button type="button" className="link-button" onClick={() => setForgot(true)}>
              Забыли пароль?
            </button>
          </form>
        ) : (
          <form onSubmit={resetPassword} className="login-form">
            <label>
              Email учетной записи
              <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
            </label>
            <p className="confidentiality">Если вы не помните email или не имеете доступа к нему, обратитесь к администратору dashboard</p>
            <button className="primary-button">Отправить ссылку</button>
            {message && <p className="status-note">{message}</p>}
            <button type="button" className="link-button" onClick={() => setForgot(false)}>
              Вернуться ко входу
            </button>
          </form>
        )}
      </section>
    </main>
  );
}
