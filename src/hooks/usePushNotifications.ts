import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

// En una app real, esta clave vendría de una variable de entorno
const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || 'BEl6zC3R4T7S3D3E3F3G3H3I3J3K3L3M3N3O3P3Q3R3S3T3U3V3W3X3Y3Z1234567890';

export function usePushNotifications() {
    const { user } = useAuth();
    const [isSupported, setIsSupported] = useState(false);
    const [permission, setPermission] = useState<NotificationPermission>('default');

    useEffect(() => {
        if ('serviceWorker' in navigator && 'PushManager' in window) {
            setIsSupported(true);
            setPermission(Notification.permission);
        }
    }, []);

    const subscribeUser = async () => {
        if (!isSupported || !user) return;

        try {
            // Asegurarse de que el worker esté listo
            const registration = await navigator.serviceWorker.ready;

            // Solicitar suscripción
            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
            });

            const { endpoint, keys } = subscription.toJSON();
            if (!endpoint || !keys) return;

            // Guardar en Supabase
            const { error } = await supabase
                .from('push_subscriptions')
                .upsert({
                    user_id: user.id,
                    endpoint,
                    p256dh: keys.p256dh,
                    auth: keys.auth,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'endpoint' });

            if (error) throw error;

            setPermission('granted');
            return true;
        } catch (err) {
            console.error('Error al suscribir al usuario:', err);
            return false;
        }
    };

    const unsubscribeUser = async () => {
        try {
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.getSubscription();
            if (subscription) {
                await subscription.unsubscribe();
                // Opcional: Eliminar de Supabase
                await supabase
                    .from('push_subscriptions')
                    .delete()
                    .eq('endpoint', subscription.endpoint);
            }
            setPermission('default');
            return true;
        } catch (err) {
            console.error('Error al desuscribir:', err);
            return false;
        }
    };

    return { isSupported, permission, subscribeUser, unsubscribeUser };
}

/**
 * Convierte una clave pública VAPID de Base64 a Uint8Array
 */
export function urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}
