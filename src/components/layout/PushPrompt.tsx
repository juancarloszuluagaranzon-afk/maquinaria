import { useState, useEffect } from 'react';
import { Bell, X, Check } from 'lucide-react';
import { usePushNotifications } from '../../hooks/usePushNotifications';

export default function PushPrompt() {
    const { isSupported, permission, subscribeUser } = usePushNotifications();
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Mostrar si es soportado, el permiso es 'default' y no lo hemos ocultado en esta sesión
        const dismissed = sessionStorage.getItem('push-prompt-dismissed');
        if (isSupported && permission === 'default' && !dismissed) {
            const timer = setTimeout(() => setIsVisible(true), 2000); // Aparece tras 2 segundos
            return () => clearTimeout(timer);
        }
    }, [isSupported, permission]);

    const handleSubscribe = async () => {
        const success = await subscribeUser();
        if (success) {
            setIsVisible(false);
        }
    };

    const handleDismiss = () => {
        setIsVisible(false);
        sessionStorage.setItem('push-prompt-dismissed', 'true');
    };

    if (!isVisible) return null;

    return (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-md z-50 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-zinc-900/90 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden p-5 flex items-center gap-4 relative">
                {/* Background Glow */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500/0 via-emerald-500/50 to-emerald-500/0" />

                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 shrink-0">
                    <Bell className="text-emerald-400" size={24} />
                </div>

                <div className="flex-1">
                    <h3 className="text-sm font-bold text-white mb-0.5">Activar Notificaciones</h3>
                    <p className="text-xs text-white/50 leading-relaxed">
                        Recibe alertas críticas de tus labores asignadas en tiempo real.
                    </p>
                </div>

                <div className="flex flex-col gap-2">
                    <button
                        onClick={handleSubscribe}
                        className="bg-emerald-500 hover:bg-emerald-400 text-black text-[10px] font-bold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                    >
                        <Check size={12} />
                        Activar
                    </button>
                    <button
                        onClick={handleDismiss}
                        className="text-white/40 hover:text-white/70 text-[10px] font-medium px-3 py-1.5 transition-colors flex items-center gap-1 justify-center underline underline-offset-2"
                    >
                        Ahora no
                    </button>
                </div>

                <button
                    onClick={handleDismiss}
                    className="absolute top-2 right-2 p-1 text-white/20 hover:text-white/50 transition-colors"
                >
                    <X size={14} />
                </button>
            </div>
        </div>
    );
}
