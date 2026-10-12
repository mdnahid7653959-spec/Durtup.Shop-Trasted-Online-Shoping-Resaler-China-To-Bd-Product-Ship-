import React, { useEffect } from 'react';
import { db } from '@/integrations/firebase/client';
import { collection, query, orderBy, limit, onSnapshot, doc, setDoc } from 'firebase/firestore';
import { sendBrowserNotification, playNewOrderSound, unlockAudio } from '@/hooks/useAdminOrderNotifications';
import { Capacitor } from '@capacitor/core';

export const PushNotificationInitializer: React.FC = () => {
  // 1. Register Service Worker & Save Device Token to Firestore + Auto-request native permission on user gesture
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Register Service Worker for Mobile Notifications
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch((err) => {
        console.warn('[PushNotificationInitializer] Service worker register warning:', err);
      });
    }

    const registerDeviceToken = async () => {
      try {
        let deviceId = localStorage.getItem('durtup_device_id');
        if (!deviceId) {
          deviceId = 'dev_' + Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
          localStorage.setItem('durtup_device_id', deviceId);
        }

        const ua = navigator.userAgent;
        let platform: 'android' | 'ios' | 'web' = 'web';
        if (/android/i.test(ua)) platform = 'android';
        else if (/iphone|ipad|ipod/i.test(ua)) platform = 'ios';

        const tokenDocRef = doc(db, 'push_tokens', deviceId);
        await setDoc(tokenDocRef, {
          id: deviceId,
          token: deviceId,
          platform: platform,
          is_active: true,
          permission: 'Notification' in window ? Notification.permission : 'unsupported',
          user_agent: ua,
          last_seen: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, { merge: true });
      } catch (err) {
        console.warn('[PushNotificationInitializer] Device registration warning:', err);
      }
    };

    registerDeviceToken();

    // If native Capacitor app, register push notifications channel
    if (Capacitor.isNativePlatform() && Capacitor.isPluginAvailable('PushNotifications')) {
      import('@capacitor/push-notifications').then(({ PushNotifications }) => {
        PushNotifications.createChannel({
          id: 'durtup_broadcasts',
          name: 'Offers & Announcements',
          description: 'Flash sales, mega offers and order notifications',
          importance: 4,
          visibility: 1,
          sound: 'default',
          vibration: true
        }).catch(() => {});
        PushNotifications.requestPermissions().then((perm) => {
          if (perm.receive === 'granted') {
            PushNotifications.register().catch(() => {});
          }
        }).catch(() => {});
      }).catch(() => {});
    }

    // Audio unlock on interaction without prompting push notifications
    const handleFirstInteraction = () => {
      unlockAudio();
    };

    window.addEventListener('click', handleFirstInteraction, { once: true, passive: true });
    window.addEventListener('touchstart', handleFirstInteraction, { once: true, passive: true });

    return () => {
      window.removeEventListener('click', handleFirstInteraction);
      window.removeEventListener('touchstart', handleFirstInteraction);
    };
  }, []);

  // 2. Real-time broadcast notification listener: delivers real OS / Browser push notifications
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const notifiedCampaigns = new Set<string>();

    try {
      const q = query(
        collection(db, 'broadcast_notifications'),
        orderBy('created_at', 'desc'),
        limit(5)
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            const data = change.doc.data();
            const campaignId = change.doc.id;

            // Only notify for fresh campaigns (within last 2 minutes)
            const campaignTime = data.created_at ? new Date(data.created_at).getTime() : (data.timestamp || Date.now());
            const isFresh = Date.now() - campaignTime < 120000;

            if (isFresh && !notifiedCampaigns.has(campaignId)) {
              notifiedCampaigns.add(campaignId);

              // 🔊 1. Sound & Vibration
              playNewOrderSound();

              // 📱 2. System Notification Shade (Native OS / Android / Web push notification)
              sendBrowserNotification(data.title || '🛍️ Durtup.shop Special Offer!', {
                body: data.message || 'Check out the latest discounts and deals!',
                product_image: data.image_url || data.image || '/icon-512.png',
                tag: `campaign-${campaignId}`,
                data: {
                  url: data.action_url || data.url || '/',
                  campaign_id: campaignId
                }
              });
              // Note: No in-app floating banner is displayed. Notifications come strictly as original device/system notifications.
            }
          }
        });
      }, (err) => {
        console.warn('[PushNotificationInitializer] Broadcast listener warning:', err);
      });

      return () => unsubscribe();
    } catch (e) {
      console.warn('[PushNotificationInitializer] Broadcast listener setup error:', e);
    }
  }, []);

  // No floating banner or in-app popup overlay is rendered on the screen
  return null;
};

export default PushNotificationInitializer;

