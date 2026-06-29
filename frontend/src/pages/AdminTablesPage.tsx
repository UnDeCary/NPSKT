import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { KeyRound, Lock, Plus, Save, Settings2, Trash2, Unlock, UserPlus, Users } from 'lucide-react';
import { api } from '../api';
import type { MinimumBaseInput, PlanSettingInput, UserCreate } from '../types';

type SettingsTab = 'users' | 'constants';

const EMPTY_USER: UserCreate = {
  login: '',
  email: '',
  full_name: '',
  password: '',
  role: 'viewer',
  is_active: true
};

const EMPTY_PLAN: PlanSettingInput = {
  segment: 'B2C',
  product: '',
  company: null,
  technology: null,
  wave: 'I полугодие 2026',
  target: 0
};

const SCOPE_OPTIONS = [
  ['total', 'Total NPS Казахтелеком'],
  ['b2c', 'NPS B2C'],
  ['b2b', 'NPS B2B'],
  ['b2c-internet', 'Интернет B2C'],
  ['b2c-tv', 'Телевидение B2C'],
  ['b2c-fms', 'FMS B2C'],
  ['b2b-internet', 'Корпоративный интернет'],
  ['b2b-ict', 'ИКТ / Хостинг'],
  ['b2b-video', 'Облачное видеонаблюдение'],
  ['adsl-b2c', 'ADSL B2C'],
  ['gpon-b2c', 'GPON B2C'],
  ['beeline-internet', 'Beeline Интернет'],
  ['kt-tv', 'Казахтелеком TV'],
  ['alma-tv', 'Alma TV'],
  ['beeline-tv', 'Beeline TV'],
  ['kt-fms', 'Казахтелеком FMS'],
  ['beeline-fms', 'Beeline FMS'],
  ['adsl-b2b', 'ADSL B2B'],
  ['gpon-b2b', 'GPON B2B'],
  ['transtelecom-b2b-internet', 'Транстелеком — интернет'],
  ['jusan-b2b-internet', 'Jusan — интернет'],
  ['kt-ict', 'Казахтелеком — ИКТ'],
  ['transtelecom-ict', 'Транстелеком — ИКТ'],
  ['jusan-ict', 'Jusan — ИКТ'],
  ['beeline-ict', 'Beeline — ИКТ'],
  ['kt-b2b-video', 'Казахтелеком — видеонаблюдение'],
  ['beeline-b2b-video', 'Beeline — видеонаблюдение']
] as const;

function message(error: unknown) {
  return error instanceof Error ? error.message : 'Не удалось сохранить изменения';
}

function optional(value: string) {
  return value || null;
}

export function AdminTablesPage() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<SettingsTab>('users');
  const [notice, setNotice] = useState('');
  const [errorText, setErrorText] = useState('');
  const [newUser, setNewUser] = useState<UserCreate>(EMPTY_USER);
  const [passwordTarget, setPasswordTarget] = useState<{ id: number; name: string } | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [planDraft, setPlanDraft] = useState<PlanSettingInput>(EMPTY_PLAN);
  const [editingPlanId, setEditingPlanId] = useState<number | null>(null);
  const [minimumDraft, setMinimumDraft] = useState<MinimumBaseInput>({ scope_key: 'total', minimum_n: 30 });
  const [editingMinimumId, setEditingMinimumId] = useState<number | null>(null);

  const { data: currentUser } = useQuery({ queryKey: ['me'], queryFn: api.me });
  const { data: users = [] } = useQuery({ queryKey: ['users'], queryFn: api.users });
  const { data: plans = [] } = useQuery({ queryKey: ['plans'], queryFn: api.plans });
  const { data: minimumBases = [] } = useQuery({ queryKey: ['minimum-bases'], queryFn: api.minimumBases });
  const { data: waves = [] } = useQuery({ queryKey: ['waves'], queryFn: api.waves });
  const { data: segments = [] } = useQuery({ queryKey: ['dictionary-segments'], queryFn: () => api.dictionary('segments') });
  const { data: products = [] } = useQuery({ queryKey: ['dictionary-products'], queryFn: () => api.dictionary('products') });
  const { data: companies = [] } = useQuery({ queryKey: ['dictionary-companies'], queryFn: () => api.dictionary('companies') });
  const { data: technologies = [] } = useQuery({ queryKey: ['dictionary-technologies'], queryFn: () => api.dictionary('technologies') });

  const activeValues = (items: typeof products) => items.filter((item) => item.is_active).map((item) => item.value);
  const segmentOptions = useMemo(() => activeValues(segments), [segments]);
  const productOptions = useMemo(() => activeValues(products), [products]);
  const companyOptions = useMemo(() => activeValues(companies), [companies]);
  const technologyOptions = useMemo(() => activeValues(technologies), [technologies]);

  function success(text: string, keys: string[]) {
    setErrorText('');
    setNotice(text);
    keys.forEach((key) => queryClient.invalidateQueries({ queryKey: [key] }));
  }

  function fail(error: unknown) {
    setNotice('');
    setErrorText(message(error));
  }

  const createUser = useMutation({
    mutationFn: api.createUser,
    onSuccess: () => {
      setNewUser(EMPTY_USER);
      success('Пользователь создан', ['users']);
    },
    onError: fail
  });
  const updateUser = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Parameters<typeof api.updateUser>[1] }) => api.updateUser(id, payload),
    onSuccess: () => success('Настройки пользователя обновлены', ['users']),
    onError: fail
  });
  const deleteUser = useMutation({
    mutationFn: api.deleteUser,
    onSuccess: () => success('Пользователь удалён', ['users']),
    onError: fail
  });
  const savePlan = useMutation({
    mutationFn: ({ id, payload }: { id: number | null; payload: PlanSettingInput }) => id ? api.updatePlan(id, payload) : api.createPlan(payload),
    onSuccess: () => {
      setPlanDraft(EMPTY_PLAN);
      setEditingPlanId(null);
      success('Плановое значение сохранено', ['plans']);
    },
    onError: fail
  });
  const deletePlan = useMutation({
    mutationFn: api.deletePlan,
    onSuccess: () => success('Плановое значение удалено', ['plans']),
    onError: fail
  });
  const saveMinimum = useMutation({
    mutationFn: ({ id, payload }: { id: number | null; payload: MinimumBaseInput }) => id ? api.updateMinimumBase(id, payload) : api.createMinimumBase(payload),
    onSuccess: () => {
      setMinimumDraft({ scope_key: 'total', minimum_n: 30 });
      setEditingMinimumId(null);
      success('Минимальная база сохранена', ['minimum-bases']);
    },
    onError: fail
  });
  const deleteMinimum = useMutation({
    mutationFn: api.deleteMinimumBase,
    onSuccess: () => success('Минимальная база удалена', ['minimum-bases']),
    onError: fail
  });

  const scopeName = (key: string) => SCOPE_OPTIONS.find(([scope]) => scope === key)?.[1] ?? key;
  const selectedMinimum = minimumBases.find((item) => item.scope_key === minimumDraft.scope_key);

  return (
    <div className="page admin-settings-page">
      <div className="page-heading">
        <div>
          <div className="breadcrumbs">Администрирование › Настройки</div>
          <h1>Настройки</h1>
        </div>
        <div className="admin-access-badge"><Lock size={15} /> Только для администраторов</div>
      </div>

      <div className="settings-tabs" role="tablist">
        <button className={tab === 'users' ? 'active' : ''} onClick={() => setTab('users')}><Users size={17} />Пользователи</button>
        <button className={tab === 'constants' ? 'active' : ''} onClick={() => setTab('constants')}><Settings2 size={17} />Константы</button>
      </div>

      {notice ? <div className="settings-message success">{notice}</div> : null}
      {errorText ? <div className="settings-message error">{errorText}</div> : null}

      {tab === 'users' ? (
        <div className="settings-stack">
          <section className="panel settings-section">
            <div className="settings-section-heading">
              <div><h2>Создать пользователя</h2><p>Добавьте сотрудника и назначьте ему уровень доступа.</p></div>
              <UserPlus size={22} />
            </div>
            <form className="settings-form user-create-form" onSubmit={(event) => { event.preventDefault(); createUser.mutate(newUser); }}>
              <label>Логин<input required minLength={3} value={newUser.login} onChange={(event) => setNewUser({ ...newUser, login: event.target.value })} /></label>
              <label>ФИО<input value={newUser.full_name} onChange={(event) => setNewUser({ ...newUser, full_name: event.target.value })} /></label>
              <label>Email<input required type="email" value={newUser.email} onChange={(event) => setNewUser({ ...newUser, email: event.target.value })} /></label>
              <label>Пароль<input required minLength={8} type="password" value={newUser.password} onChange={(event) => setNewUser({ ...newUser, password: event.target.value })} /></label>
              <label>Роль<select value={newUser.role} onChange={(event) => setNewUser({ ...newUser, role: event.target.value as UserCreate['role'] })}><option value="viewer">Пользователь</option><option value="admin">Администратор</option></select></label>
              <button className="primary-button" disabled={createUser.isPending}><Plus size={16} />Создать</button>
            </form>
          </section>

          {passwordTarget ? (
            <section className="panel password-panel">
              <div><KeyRound size={20} /><span>Новый пароль для <strong>{passwordTarget.name}</strong></span></div>
              <form onSubmit={(event) => { event.preventDefault(); updateUser.mutate({ id: passwordTarget.id, payload: { password: newPassword } }, { onSuccess: () => { setPasswordTarget(null); setNewPassword(''); } }); }}>
                <input required minLength={8} type="password" placeholder="Не менее 8 символов" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} />
                <button className="primary-button">Сохранить пароль</button>
                <button type="button" className="secondary-button" onClick={() => setPasswordTarget(null)}>Отмена</button>
              </form>
            </section>
          ) : null}

          <section className="panel settings-section">
            <div className="settings-section-heading"><div><h2>Пользователи</h2><p>{users.length} учётных записей</p></div></div>
            <div className="admin-user-list">
              {users.map((user) => {
                const isSelf = user.id === currentUser?.id;
                return (
                  <article className={`admin-user-row${user.is_active ? '' : ' blocked'}`} key={user.id}>
                    <div className="user-avatar">{(user.full_name || user.login).slice(0, 1).toUpperCase()}</div>
                    <div className="user-identity"><strong>{user.full_name || user.login}{isSelf ? ' (вы)' : ''}</strong><span>{user.login} · {user.email}</span></div>
                    <span className={`role-badge ${user.role}`}>{user.role === 'admin' ? 'Администратор' : 'Пользователь'}</span>
                    <span className={`status-badge ${user.is_active ? 'active' : 'blocked'}`}>{user.is_active ? 'Активен' : 'Заблокирован'}</span>
                    <div className="row-actions">
                      <button title="Изменить пароль" onClick={() => { setPasswordTarget({ id: user.id, name: user.full_name || user.login }); setNewPassword(''); }}><KeyRound size={16} /></button>
                      <button disabled={isSelf} title={user.is_active ? 'Заблокировать' : 'Разблокировать'} onClick={() => updateUser.mutate({ id: user.id, payload: { is_active: !user.is_active } })}>{user.is_active ? <Lock size={16} /> : <Unlock size={16} />}</button>
                      <button className="danger" disabled={isSelf} title="Удалить" onClick={() => { if (window.confirm(`Удалить пользователя ${user.login}?`)) deleteUser.mutate(user.id); }}><Trash2 size={16} /></button>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        </div>
      ) : (
        <div className="settings-stack">
          <section className="panel settings-section">
            <div className="settings-section-heading"><div><h2>Плановые значения</h2><p>Планы по продуктам, сегментам и компаниям-конкурентам.</p></div></div>
            <form className="settings-form plan-form" onSubmit={(event) => { event.preventDefault(); savePlan.mutate({ id: editingPlanId, payload: planDraft }); }}>
              <label>Сегмент<select value={planDraft.segment} onChange={(event) => setPlanDraft({ ...planDraft, segment: event.target.value })}>{(segmentOptions.length ? segmentOptions : ['B2C', 'B2B']).map((item) => <option key={item}>{item}</option>)}</select></label>
              <label>Продукт<select required value={planDraft.product} onChange={(event) => setPlanDraft({ ...planDraft, product: event.target.value })}><option value="">Выберите</option>{productOptions.map((item) => <option key={item}>{item}</option>)}</select></label>
              <label>Компания / конкурент<select value={planDraft.company ?? ''} onChange={(event) => setPlanDraft({ ...planDraft, company: optional(event.target.value) })}><option value="">Все компании</option>{companyOptions.map((item) => <option key={item}>{item}</option>)}</select></label>
              <label>Технология<select value={planDraft.technology ?? ''} onChange={(event) => setPlanDraft({ ...planDraft, technology: optional(event.target.value) })}><option value="">Все технологии</option>{technologyOptions.map((item) => <option key={item}>{item}</option>)}</select></label>
              <label>Период<select value={planDraft.wave} onChange={(event) => setPlanDraft({ ...planDraft, wave: event.target.value })}>{waves.map((item) => <option key={item.code} value={item.code}>{item.label}</option>)}</select></label>
              <label>План (n)<input required min={0} type="number" value={planDraft.target} onChange={(event) => setPlanDraft({ ...planDraft, target: Number(event.target.value) })} /></label>
              <div className="form-actions"><button className="primary-button"><Save size={16} />{editingPlanId ? 'Сохранить' : 'Добавить'}</button>{editingPlanId ? <button type="button" className="secondary-button" onClick={() => { setEditingPlanId(null); setPlanDraft(EMPTY_PLAN); }}>Отмена</button> : null}</div>
            </form>
            <div className="settings-table-wrap"><table className="data-table settings-data-table"><thead><tr><th>Сегмент</th><th>Продукт</th><th>Компания</th><th>Технология</th><th>Период</th><th>План</th><th /></tr></thead><tbody>{plans.map((plan) => <tr key={plan.id}><td>{plan.segment}</td><td>{plan.product}</td><td>{plan.company || 'Все'}</td><td>{plan.technology || 'Все'}</td><td>{plan.wave}</td><td><strong>{plan.target}</strong></td><td><div className="row-actions"><button onClick={() => { setEditingPlanId(plan.id); setPlanDraft({ segment: plan.segment, product: plan.product, company: plan.company, technology: plan.technology, wave: plan.wave, target: plan.target }); }}>Изменить</button><button className="danger" onClick={() => { if (window.confirm('Удалить плановое значение?')) deletePlan.mutate(plan.id); }}><Trash2 size={15} /></button></div></td></tr>)}</tbody></table></div>
          </section>

          <section className="panel settings-section">
            <div className="settings-section-heading"><div><h2>Минимальные базы n</h2><p>Порог выборки, ниже которого показатель помечается как малая база.</p></div></div>
            <form className="settings-form minimum-form" onSubmit={(event) => { event.preventDefault(); saveMinimum.mutate({ id: editingMinimumId ?? selectedMinimum?.id ?? null, payload: minimumDraft }); }}>
              <label>Продукт / уровень<select value={minimumDraft.scope_key} onChange={(event) => setMinimumDraft({ ...minimumDraft, scope_key: event.target.value })}>{SCOPE_OPTIONS.map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
              <label>Минимальное n<input required min={1} type="number" value={minimumDraft.minimum_n} onChange={(event) => setMinimumDraft({ ...minimumDraft, minimum_n: Number(event.target.value) })} /></label>
              <div className="form-actions"><button className="primary-button"><Save size={16} />{editingMinimumId || selectedMinimum ? 'Сохранить' : 'Добавить'}</button>{editingMinimumId ? <button type="button" className="secondary-button" onClick={() => { setEditingMinimumId(null); setMinimumDraft({ scope_key: 'total', minimum_n: 30 }); }}>Отмена</button> : null}</div>
            </form>
            <div className="minimum-grid">{minimumBases.map((item) => <article key={item.id} className="minimum-card"><div><span>{scopeName(item.scope_key)}</span><small>{item.scope_key}</small></div><strong>n ≥ {item.minimum_n}</strong><div className="row-actions"><button onClick={() => { setEditingMinimumId(item.id); setMinimumDraft({ scope_key: item.scope_key, minimum_n: item.minimum_n }); }}>Изменить</button><button className="danger" onClick={() => { if (window.confirm('Удалить минимальную базу?')) deleteMinimum.mutate(item.id); }}><Trash2 size={15} /></button></div></article>)}</div>
          </section>
        </div>
      )}
    </div>
  );
}
