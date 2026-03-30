// ============================================
// CalApp01 — Main Entry Point
// ============================================
// AGENT_INSTRUCTION:
// Инициализация React, Router, регистрация Service Worker.
// При первом рендере проверяем токен в localStorage
// и делаем refresh если есть.

import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './styles/index.css';

// Регистрация Service Worker для PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((error) => {
      console.log('[SW] Ошибка регистрации:', error);
    });
  });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
