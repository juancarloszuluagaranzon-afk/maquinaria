import { useState, useEffect } from 'react';
import { Bell, Check, Clock } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

export default function NotificationBell() {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState<any[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        if (!user) return;

        fetchNotifications();

        // Suscribirse a cambios en tiempo real para el badge
        const channel = supabase
            .channel('bell-notifications')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'notificaciones' },
                () => {
                    fetchNotifications();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user]);

    const fetchNotifications = async () => {
        // Mostramos las últimas 20 notificaciones globales/relevantes
        const { data, error } = await supabase
            .from('notificaciones')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(20);

        if (!error && data) {
            setNotifications(data);
            setUnreadCount(data.filter(n => !n.leido).length);
        }
    };

    const markAsRead = async (id: string) => {
        const { error } = await supabase
            .from('notificaciones')
            .update({ leido: true })
            .eq('id', id);

        if (!error) {
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, leido: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        }
    };

    const clearAll = async () => {
        // En una app real, marcaríamos todas como leídas
        const { error } = await supabase
            .from('notificaciones')
            .update({ leido: true })
            .eq('leido', false);

        if (!error) {
            setNotifications(prev => prev.map(n => ({ ...n, leido: true })));
            setUnreadCount(0);
        }
    };

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-2 text-white/70 hover:text-white transition-colors relative bg-white/5 rounded-xl border border-white/10"
            >
                <Bell size={20} />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 text-black text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-black animate-pulse">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <>
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsOpen(false)}
                    />
                    <div className="absolute right-0 mt-3 w-80 md:w-96 bg-zinc-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50 animate-in fade-in zoom-in duration-200">
                        <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/5">
                            <h3 className="text-sm font-bold text-white uppercase tracking-widest">Notificaciones</h3>
                            <button
                                onClick={clearAll}
                                className="text-[10px] text-emerald-400 hover:text-emerald-300 font-bold uppercase transition-colors"
                            >
                                Marcar todo como leído
                            </button>
                        </div>

                        <div className="max-h-[400px] overflow-auto">
                            {notifications.length === 0 ? (
                                <div className="p-8 text-center text-white/30 text-xs italic">
                                    No hay notificaciones recientes
                                </div>
                            ) : (
                                notifications.map((n) => (
                                    <div
                                        key={n.id}
                                        className={`p-4 border-b border-white/5 hover:bg-white/5 transition-colors relative group ${!n.leido ? 'bg-emerald-500/5' : ''}`}
                                    >
                                        <div className="flex gap-3">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${n.tipo === 'INICIO' ? 'bg-blue-500/20 text-blue-400' :
                                                n.tipo === 'FIN' ? 'bg-emerald-500/20 text-emerald-400' :
                                                    'bg-zinc-800 text-zinc-400'
                                                }`}>
                                                {n.tipo === 'INICIO' ? <Clock size={14} /> : <Check size={14} />}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-start mb-1">
                                                    <p className="text-xs font-bold text-white truncate">{n.titulo}</p>
                                                    <p className="text-[10px] text-white/30 whitespace-nowrap">
                                                        {formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: es })}
                                                    </p>
                                                </div>
                                                <p className="text-xs text-white/60 leading-relaxed mb-2">
                                                    {n.mensaje}
                                                </p>
                                                {!n.leido && (
                                                    <button
                                                        onClick={() => markAsRead(n.id)}
                                                        className="text-[10px] text-emerald-400 font-bold uppercase hover:underline"
                                                    >
                                                        Entendido
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="p-3 border-t border-white/10 bg-white/5 text-center">
                            <p className="text-[10px] text-white/40 uppercase font-bold">Monitoreo en tiempo real activo</p>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
