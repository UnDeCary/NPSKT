import { useQuery } from '@tanstack/react-query';
import { Navigate, Route, Routes } from 'react-router-dom';
import { LoginPage } from './pages/LoginPage';
import { DashboardLayout } from './layout/DashboardLayout';
import { DashboardPage } from './pages/DashboardPage';
import { FieldControlPage } from './pages/FieldControlPage';
import { UploadsPage } from './pages/UploadsPage';
import { AdminTablesPage } from './pages/AdminTablesPage';
import { RegionsPage } from './pages/RegionsPage';
import { api, getToken } from './api';

function RequireAuth({ children }: { children: JSX.Element }) {
  return getToken() ? children : <Navigate to="/login" replace />;
}

function RequireAdmin({ children }: { children: JSX.Element }) {
  const { data: user, isLoading } = useQuery({ queryKey: ['me'], queryFn: api.me, retry: false });
  if (isLoading) return <div className="state-panel">Проверка прав доступа...</div>;
  return user?.role === 'admin' ? children : <Navigate to="/" replace />;
}

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <RequireAuth>
            <DashboardLayout />
          </RequireAuth>
        }
      >
        <Route index element={<DashboardPage apiPath="/api/dashboard/home" />} />
        <Route path="b2c" element={<DashboardPage apiPath="/api/dashboard/segment/b2c" />} />
        <Route path="b2b" element={<DashboardPage apiPath="/api/dashboard/segment/b2b" />} />
        <Route path="b2b/products/internet" element={<DashboardPage apiPath="/api/dashboard/product/b2b-internet" />} />
        <Route path="b2b/products/ict-hosting" element={<DashboardPage apiPath="/api/dashboard/product/b2b-ict" />} />
        <Route path="b2b/products/cloud-video" element={<DashboardPage apiPath="/api/dashboard/product/b2b-video" />} />
        <Route path="products/b2c-internet" element={<DashboardPage apiPath="/api/dashboard/product/b2c-internet" />} />
        <Route path="products/b2c-tv" element={<DashboardPage apiPath="/api/dashboard/product/b2c-tv" />} />
        <Route path="products/b2c-fms" element={<DashboardPage apiPath="/api/dashboard/product/b2c-fms" />} />
        <Route path="regions" element={<RegionsPage />} />
        <Route path="field-control" element={<FieldControlPage />} />
        <Route path="admin/uploads" element={<UploadsPage />} />
        <Route path="admin/settings" element={<RequireAdmin><AdminTablesPage /></RequireAdmin>} />
      </Route>
    </Routes>
  );
}
