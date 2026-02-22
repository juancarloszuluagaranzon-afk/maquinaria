import { useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';

export function useLaboresRealtime() {
    const { user } = useAuth();

    useEffect(() => {
        if (!user) return;

        const channel = supabase
            .channel('public:notificaciones')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'notificaciones',
                },
                (payload) => {
                    const notification = payload.new;

                    // 1. Excluir notificaciones del mismo usuario
                    if (notification.created_by === user.id) return;

                    // 2. Lógica de filtrado de tiempo (opcional según el payload)
                    // El usuario pidió "filtra cambios >5min". 
                    // Si es un FIN, el SQL ya calcula duracion_min.
                    if (notification.tipo === 'FIN' && notification.data?.duracion_min <= 5) {
                        console.log('Notificación ignorada por duración corta (<5min)');
                        return;
                    }

                    // 3. Mostrar toast con Sonner
                    const type = notification.tipo;
                    const title = notification.titulo;
                    const message = notification.mensaje;

                    if (type === 'INICIO') {
                        toast.success(title, {
                            description: message,
                            duration: 5000,
                        });
                    } else if (type === 'FIN') {
                        toast.info(title, {
                            description: message,
                            duration: 8000,
                        });
                    } else {
                        toast(title, {
                            description: message,
                        });
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user]);
}
