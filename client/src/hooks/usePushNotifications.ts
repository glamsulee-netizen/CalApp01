// ============================================
// CalApp01 — usePushNotifications Hook
// ============================================
// AGENT_INSTRUCTION:
// Hook для подписки на Web Push уведомления.
// 1. Запрос разрешения (Notification.requestPermission())
// 2. Получение VAPID public key (GET /api/push/vapid-key)
// 3. Регистрация ServiceWorker push subscription
// 4. Отправка subscription на сервер (POST /api/push/subscribe)
// 5. При unmount: не отписываемся (подписка сохраняется между сессиями)

import { useEffect, useState } from 'react';
import { apiGet, apiPost, apiDelete } from '../api';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

export function usePushNotifications() {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    setIsSupported('serviceWorker' in navigator && 'PushManager' in window);
  }, []);

  const subscribe = async () => {
    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') return;

      const { vapidPublicKey } = await apiGet<{ vapidPublicKey: string }>('/push/vapid-key');
      if (!vapidPublicKey) return;

      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      });

      const { endpoint, keys } = subscription.toJSON() as { endpoint: string; keys: { p256dh: string; auth: string } };
      await apiPost('/push/subscribe', { endpoint, keys });
      setIsSubscribed(true);
    } catch (error) {
      console.error('[Push] Ошибка подписки:', error);
    }
  };

  const unsubscribe = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        const endpoint = subscription.endpoint;
        await subscription.unsubscribe();
        await apiDelete(`/push/unsubscribe?endpoint=${encodeURIComponent(endpoint)}`);
      }
      setIsSubscribed(false);
    } catch (error) {
      console.error('[Push] Ошибка отписки:', error);
    }
  };

  return { isSupported, isSubscribed, subscribe, unsubscribe };
}
