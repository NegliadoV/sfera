'use client';

import { useState, useEffect } from 'react';

export function usePushNotifications() {
  const [isSupported, setIsSupported] = useState(false);
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if ('serviceWorker' in navigator && 'PushManager' in window && typeof window !== 'undefined') {
      setIsSupported(true);
      checkSubscription();
    }
  }, []);

  const checkSubscription = async () => {
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      setSubscription(sub);
      setPermission(Notification.permission);
    } catch (err) {
      console.error('Error getting subscription', err);
    }
  };

  const getVapidKey = async () => {
    const envKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (envKey) return envKey;
    
    // Fallback directly to server api
    const res = await fetch('/api/push/vapid-public-key');
    return await res.text();
  };

  const subscribe = async () => {
    setLoading(true);
    try {
      const permissionRes = await Notification.requestPermission();
      setPermission(permissionRes);
      
      if (permissionRes !== 'granted') {
        throw new Error('Пожалуйста, разрешите уведомления в настройках браузера. На iOS нужно добавить сайт на главный экран (Домой).');
      }

      const reg = await navigator.serviceWorker.ready;
      const vapidKey = await getVapidKey();

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: vapidKey,
      });

      // Save to server
      const res = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sub),
      });

      if (!res.ok) throw new Error('Failed to save subscription to server');
      
      setSubscription(sub);
    } catch (err) {
      console.error('Subscription error:', err);
      if (err instanceof Error) {
        alert(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const unsubscribe = async () => {
    setLoading(true);
    try {
      if (!subscription) return;
      
      // Remove from server
      await fetch('/api/push/unsubscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ endpoint: subscription.endpoint }),
      });

      // Unsubscribe locally
      await subscription.unsubscribe();
      setSubscription(null);
    } catch (err) {
      console.error('Unsubscribe error:', err);
    } finally {
      setLoading(false);
    }
  };

  const testPush = async () => {
    try {
      const res = await fetch('/api/push/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Horizon Push Test',
          body: 'Если вы это читаете, всё работает на 100%! 🎉',
        }),
      });
      if (!res.ok) alert('Ошибка отправки теста (или подписка удалена)');
    } catch (err) {
      console.error('Test push err', err);
    }
  };

  return {
    isSupported,
    subscription,
    permission,
    loading,
    subscribe,
    unsubscribe,
    testPush
  };
}
