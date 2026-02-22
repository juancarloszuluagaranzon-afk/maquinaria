import { Bell, Smartphone, ShieldCheck } from 'lucide-react';
import { usePushNotifications } from '../hooks/usePushNotifications';
import toast from 'react-hot-toast';

export default function Settings() {
    const { isSupported, permission, subscribeUser, unsubscribeUser } = usePushNotifications();

    const handleTogglePush = async () => {
        if (permission === 'granted') {
            const success = await unsubscribeUser();
            if (success) toast.success('Notificaciones push desactivadas');
        } else {
            const success = await subscribeUser();
            if (success) {
                toast.success('¡Suscripción exitosa!');
            } else {
                toast.error('No se pudo activar la suscripción. Revisa los permisos del navegador.');
            }
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                    <Bell className="text-emerald-400" size={24} />
                </div>
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">Configuración</h1>
                    <p className="text-white/50">Personaliza tus preferencias y notificaciones</p>
                </div>
            </div>

            <div className="bg-zinc-900/50 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden">
                <div className="p-6 border-b border-white/10 flex items-center gap-3 bg-white/5">
                    <Smartphone className="text-emerald-400" size={20} />
                    <h2 className="text-lg font-bold text-white">Notificaciones Push</h2>
                </div>

                <div className="p-6 space-y-6">
                    {!isSupported ? (
                        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 flex gap-4">
                            <div className="p-2 bg-yellow-500/20 rounded-lg h-fit">
                                <ShieldCheck className="text-yellow-500" size={20} />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-yellow-500 mb-1">Push no soportado</p>
                                <p className="text-xs text-yellow-500/70">Tu navegador actual no soporta notificaciones push nativas. Te recomendamos usar Chrome o Edge en Android/Escritorio.</p>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5">
                            <div>
                                <p className="text-sm font-bold text-white mb-1">Activar alertas en el equipo</p>
                                <p className="text-xs text-white/40">Recibe avisos de inicio y fin de labores incluso con la app cerrada.</p>
                            </div>
                            <button
                                onClick={handleTogglePush}
                                className={`
                                    relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none
                                    ${permission === 'granted' ? 'bg-emerald-500' : 'bg-zinc-700'}
                                `}
                            >
                                <span
                                    className={`
                                        inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                                        ${permission === 'granted' ? 'translate-x-6' : 'translate-x-1'}
                                    `}
                                />
                            </button>
                        </div>
                    )}

                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
                        <p className="text-[10px] text-blue-400 font-bold uppercase tracking-widest mb-2 text-center">Cómo funciona</p>
                        <ul className="space-y-2 text-xs text-blue-200/70">
                            <li className="flex gap-2">
                                <span className="text-blue-400 font-bold">•</span>
                                <span>Recibirás una notificación nativa cuando un operador inicie o termine una labor en tus suertes.</span>
                            </li>
                            <li className="flex gap-2">
                                <span className="text-blue-400 font-bold">•</span>
                                <span>No consumimos batería extra ya que usamos el estándar web push.</span>
                            </li>
                            <li className="flex gap-2">
                                <span className="text-blue-400 font-bold">•</span>
                                <span>Puedes desactivar esto en cualquier momento desde este panel.</span>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}
