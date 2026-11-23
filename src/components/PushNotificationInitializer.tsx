import React, { useEffect, useRef } from 'react';
import { db, getFirebaseMessaging } from '@/integrations/firebase/client';
import { collection, query, orderBy, limit, onSnapshot, doc, setDoc } from 'firebase/firestore';
import { sendBrowserNotification, playNewOrderSound, unlockAudio } from '@/hooks/useAdminOrderNotifications';
import { getOrGenerateFCMToken } from '@/services/notificationService';
import { useAuth } from '@/contexts/AuthContext';
import { onMessage } from 'firebase/messaging';
import { Capacitor } from '@capacitor/core';

export const PushNotificationInitializer: React.FC = () => {
  const { user } = useAuth();
  const registeredTokenRef = useRef<string | null>(null);

  // 1. Register Service Workers & Obtain Real FCM Token
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let isMounted = true;

    const setupPushServices = async () => {
      // Register standard application service worker
      if ('serviceWorker' in navigator) {
        try {
          await navigator.serviceWorker.register('/sw.js');
        } catch (swErr) {
          console.warn('[PushNotificationInitializer] Service worker register warning:', swErr);
        }
      }

      // Generate or retrieve FCM token & sync to Firestore
      try {
        const token = await getOrGenerateFCMToken(user?.id, user?.email || undefined);
        if (isMounted && token) {
          registeredTokenRef.current = token;
        }
      } catch (err) {
        console.warn('[PushNotificationInitializer] Token sync notice:', err);
      }

      // Initialize Firebase Cloud Messaging Foreground Listener
      try {
        const messaging = await getFirebaseMessaging();
        if (messaging && isMounted) {
          onMessage(messaging, (payload) => {
            console.log('[PushNotificationInitializer] Foreground FCM payload received:', payload);
            playNewOrderSound();

            const title = payload.notification?.title || payload.data?.title || '🛍️ Durtup.shop';
            const body = payload.notification?.body || payload.data?.body || payload.data?.message || '';
            const image = payload.notification?.image || payload.data?.image || payload.data?.image_url;
            const targetUrl = payload.data?.url || payload.data?.action_url || '/';

            sendBrowserNotification(title, {
              body,
              product_image: image,
              data: { url: targetUrl, ...payload.data }
            });
          });
        }
      } catch (fcmErr) {
        console.warn('[PushNotificationInitializer] FCM foreground listener warning:', fcmErr);
      }
    };

    setupPushServices();

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

    // Audio unlock on interaction
    const handleFirstInteraction = () => {
      unlockAudio();
    };

    window.addEventListener('click', handleFirstInteraction, { once: true, passive: true });
    window.addEventListener('touchstart', handleFirstInteraction, { once: true, passive: true });

    return () => {
      isMounted = false;
      window.removeEventListener('click', handleFirstInteraction);
      window.removeEventListener('touchstart', handleFirstInteraction);
    };
  }, [user?.id, user?.email]);

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
                body: data.message || data.body || 'Check out the latest discounts and deals!',
                product_image: data.image_url || data.image || '/icon-512.png',
                tag: `campaign-${campaignId}`,
                data: {
                  url: data.action_url || data.url || '/',
                  campaign_id: campaignId
                }
              });
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

  return null;
};

export default PushNotificationInitializer;
