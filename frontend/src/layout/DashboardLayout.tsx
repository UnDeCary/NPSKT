import { useMemo, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  BarChart3,
  ChevronDown,
  CloudUpload,
  Home,
  LogOut,
  MapPinned,
  Menu,
  MonitorUp,
  Phone,
  RadioTower,
  Settings,
  Tv,
  Users,
  Wifi
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { api, setToken } from '../api';

type SidebarItem = {
  to: string;
  label: string;
  icon: typeof Home;
  end?: boolean;
};

const b2cNav: SidebarItem[] = [
  { to: '/b2c', label: 'Общий обзор', icon: Users, end: true },
  { to: '/products/b2c-internet', label: 'Интернет', icon: Wifi },
  { to: '/products/b2c-tv', label: 'Телевидение', icon: Tv },
  { to: '/products/b2c-fms', label: 'FMS', icon: MonitorUp }
];

const b2bNav: SidebarItem[] = [
  { to: '/b2b', label: 'Общий обзор', icon: Users, end: true },
  { to: '/b2b/products/internet', label: 'Корпоративный интернет', icon: Wifi },
  { to: '/b2b/products/ict-hosting', label: 'ИКТ / Хостинг', icon: MonitorUp },
  { to: '/b2b/products/cloud-video', label: 'Облачное видеонаблюдение', icon: RadioTower }
];

function SidebarLink({ item, className = '' }: { item: SidebarItem; className?: string }) {
  return (
    <NavLink
      to={item.to}
      end={item.end}
      className={({ isActive }) => `nav-item ${className} ${isActive ? 'active accent-green' : ''}`}
    >
      <item.icon size={16} />
      <span>{item.label}</span>
    </NavLink>
  );
}

function SidebarSection({ title, items, defaultOpen }: { title: string; items: SidebarItem[]; defaultOpen: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const location = useLocation();
  const sectionActive = items.some((item) => (item.end ? location.pathname === item.to : location.pathname.startsWith(item.to)));

  return (
    <div className={`nav-section ${open ? 'open' : 'collapsed'} ${sectionActive ? 'section-active' : ''}`}>
      <button type="button" className="nav-section-title" onClick={() => setOpen((value) => !value)} aria-expanded={open}>
        <span>{title}</span>
        <ChevronDown size={14} />
      </button>
      {open ? (
        <div className="nav-section-items">
          {items.map((item) => (
            <SidebarLink key={item.to} item={item} className="nested" />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function DashboardLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { data: user } = useQuery({ queryKey: ['me'], queryFn: api.me, retry: false });
  const { data: update } = useQuery({ queryKey: ['last-update'], queryFn: api.lastUpdate });
  const isAdmin = user?.role === 'admin';
  const initialOpen = useMemo(
    () => ({
      b2c: location.pathname === '/b2c' || location.pathname.startsWith('/products/b2c'),
      b2b: location.pathname === '/b2b' || location.pathname.startsWith('/b2b/')
    }),
    []
  );

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="wordmark">
            <strong>PHONETIC</strong>
            <span>ANALYTIC LAB</span>
          </div>
          <Menu size={18} />
        </div>

        <nav className="nav-list">
          <NavLink to="/" end className={({ isActive }) => `nav-item ${isActive ? 'active accent-blue' : ''}`}>
            <Home size={16} />
            <span>Главная</span>
          </NavLink>

          <SidebarSection title="B2C / Розничный бизнес" items={b2cNav} defaultOpen={initialOpen.b2c} />
          <SidebarSection title="B2B / Корпоративный бизнес" items={b2bNav} defaultOpen={initialOpen.b2b} />

          <div className="nav-divider" />
          <SidebarLink item={{ to: '/regions', label: 'Регионы', icon: MapPinned }} />

          <div className="nav-divider" />
          <SidebarLink item={{ to: '/field-control', label: 'Контроль поля', icon: Phone }} />

          <div className="nav-divider" />
          <SidebarLink item={{ to: '/admin/uploads', label: 'Загрузка данных', icon: CloudUpload }} />
        </nav>

        <div className="sidebar-bottom">
          {isAdmin ? <SidebarLink item={{ to: '/admin/settings', label: 'Настройки', icon: Settings }} className="bottom-link" /> : null}
          <button
            className="logout-button"
            onClick={() => {
              setToken(null);
              navigate('/login');
            }}
          >
            <LogOut size={16} />
            Выйти
          </button>
        </div>
        <span className="sr-only">{user?.full_name || user?.login || 'Пользователь'} {update?.last_update}</span>
      </aside>
      <main className="workspace">
        <Outlet />
      </main>
    </div>
  );
}
