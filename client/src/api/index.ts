// ============================================
// CalApp01 — HTTP API Client
// ============================================
// AGENT_INSTRUCTION:
// Обёртка над fetch для запросов к серверу.
// Автоматически добавляет Authorization header с JWT.
// При 401 (TOKEN_EXPIRED) — автоматически вызывает refresh и повторяет запрос.

const API_BASE = import.meta.env.VITE_API_URL || '/api';

/** Получить токен из localStorage */
function getAccessToken(): string | null {
  return localStorage.getItem('accessToken');
}

/** Сохранить токен */
export function setAccessToken(token: string): void {
  localStorage.setItem('accessToken', token);
}

/** Удалить токен */
export function clearAccessToken(): void {
  localStorage.removeItem('accessToken');
}

/** Refresh token (через httpOnly cookie) */
async function refreshAccessToken(): Promise<string | null> {
  try {
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      credentials: 'include', // Отправляем cookie
    });
    if (!res.ok) return null;
    const data = await res.json();
    setAccessToken(data.accessToken);
    return data.accessToken;
  } catch {
    return null;
  }
}

/**
 * Универсальный HTTP-запрос к API
 * 
 * AGENT_INSTRUCTION:
 * - Автоматически добавляет Bearer token
 * - При 401 с code=TOKEN_EXPIRED — рефрешит и повторяет
 * - Парсит JSON ответ
 * - При ошибках — бросает ApiError
 */
export async function api<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getAccessToken();
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  let response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
    credentials: 'include',
  });

  // Auto-refresh при истёкшем токене
  if (response.status === 401) {
    const errorData = await response.json().catch(() => ({}));
    if (errorData.code === 'TOKEN_EXPIRED') {
      const newToken = await refreshAccessToken();
      if (newToken) {
        // Повторяем запрос с новым токеном
        response = await fetch(`${API_BASE}${endpoint}`, {
          ...options,
          headers: {
            ...headers,
            Authorization: `Bearer ${newToken}`,
          },
          credentials: 'include',
        });
      }
    }
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Ошибка сети' }));
    throw new ApiError(errorData.error || 'Ошибка', response.status, errorData);
  }

  // 204 No Content
  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

/** Класс ошибки API */
export class ApiError extends Error {
  status: number;
  data: any;

  constructor(message: string, status: number, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

// --- Утилиты для конкретных методов ---

export const apiGet = <T>(endpoint: string) => api<T>(endpoint);

export const apiPost = <T>(endpoint: string, body?: any) => 
  api<T>(endpoint, { method: 'POST', body: body ? JSON.stringify(body) : undefined });

export const apiPatch = <T>(endpoint: string, body?: any) =>
  api<T>(endpoint, { method: 'PATCH', body: body ? JSON.stringify(body) : undefined });

export const apiDelete = <T>(endpoint: string) =>
  api<T>(endpoint, { method: 'DELETE' });
