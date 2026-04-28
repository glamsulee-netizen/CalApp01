// ============================================
// CalApp01 — App Component (роутинг)
// ============================================
// AGENT_INSTRUCTION:
// Маршрутизация:
//   /login              — Страница входа
//   /register           — Страница регистрации
//   /                   — Дашборд пользователя (защищённый)
//   /calendar/:shareLink — Публичный просмотр календаря
//   /specialist          — Дашборд специалиста (защищённый)
//   /specialist/calendar — Редактор календаря специалиста
//   /admin               — Админ-панель (только ADMIN)
//   /settings            — Настройки профиля
//
// Компонент AuthGuard: оборачивает защищённые маршруты,
//   редиректит на /login если не авторизован.
// Компонент AdminGuard: оборачивает /admin,
//   редиректит если role !== ADMIN.
//
// При загрузке App: вызвать useAuth().initialize()
//   — проверить localStorage, обновить токен через refresh.

import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';

// --- Lazy-loaded Pages ---
const LoginPage = React.lazy(() => import('./pages/LoginPage'));
const RegisterPage = React.lazy(() => import('./pages/RegisterPage'));
const LandingPage = React.lazy(() => import('./pages/LandingPage'));
const UserDashboard = React.lazy(() => import('./pages/UserDashboard'));
const CalendarView = React.lazy(() => import('./pages/CalendarView'));
const SpecialistDashboard = React.lazy(() => import('./pages/SpecialistDashboard'));
const SpecialistCalendar = React.lazy(() => import('./pages/SpecialistCalendar'));
const AdminDashboard = React.lazy(() => import('./pages/AdminDashboard'));
const Settings = React.lazy(() => import('./pages/Settings'));

// --- Loading Fallback ---
function LoadingScreen() {
  return (
    <div className="loading-screen">
      <div className="loading-spinner" />
      <p>Загрузка...</p>
    </div>
  );
}

// --- Auth Guard ---
function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuthStore();
  
  if (isLoading) return <LoadingScreen />;
  if (!isAuthenticated) return <Navigate to="/" replace />;
  
  return <>{children}</>;
}

// --- Public Route (only for unauthenticated) ---
function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuthStore();
  
  if (isLoading) return <LoadingScreen />;
  if (isAuthenticated) return <Navigate to="/" replace />;
  
  return <>{children}</>;
}

// --- Admin Guard ---
function AdminGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuthStore();
  
  if (isLoading) return <LoadingScreen />;
  if (!user || user.role !== 'ADMIN') return <Navigate to="/" replace />;
  
  return <>{children}</>;
}

export default function App() {
  const { initialize } = useAuthStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <React.Suspense fallback={<LoadingScreen />}>
      <Routes>
        {/* Публичные маршруты — только для неавторизованных */}
        <Route path="/" element={<PublicRoute><LandingPage /></PublicRoute>} />
        <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
        <Route path="/calendar/:shareLink" element={<CalendarView />} />

        {/* Защищённые маршруты — пользователь */}
        <Route path="/" element={<AuthGuard><UserDashboard /></AuthGuard>} />
        <Route path="/settings" element={<AuthGuard><Settings /></AuthGuard>} />

        {/* Защищённые маршруты — специалист */}
        <Route path="/specialist" element={<AuthGuard><SpecialistDashboard /></AuthGuard>} />
        <Route path="/specialist/calendar" element={<AuthGuard><SpecialistCalendar /></AuthGuard>} />

        {/* Защищённые маршруты — администратор */}
        <Route path="/admin" element={<AdminGuard><AdminDashboard /></AdminGuard>} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </React.Suspense>
  );
}
