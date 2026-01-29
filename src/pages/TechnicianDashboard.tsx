import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Tractor, Clock, AlertTriangle, MapPin, LogOut } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
// Adjusted import if necessary, but sticking to user request for now unless I find it elsewhere
import { GlassCard } from '../components/ui/GlassCard';

export default function TechnicianDashboard() {
    const { user, profile, signOut } = useAuth();
    const navigate = useNavigate();
    const [requests, setRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchMyRequests();
    }, [user]);

    const fetchMyRequests = async () => {
        try {
            if (!user) return;

            // QUERY CRITICA: Solo mis solicitudes (.eq 'tecnico_id')
            // Traemos también datos de la suerte y labor relacionados
            const { data, error } = await supabase
                .from('programaciones')
                .select(`
          *,
          suertes (codigo, hacienda),
          labores (nombre),
          actividades (nombre),
          prioridades (asunto, nivel),
          maquinaria (tarifa_hora)
        `)
                .eq('tecnico_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setRequests(data || []);
        } catch (error) {
            console.error('Error cargando solicitudes:', error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'PENDIENTE_APROBACION': return 'text-yellow-400 border-yellow-400/30 bg-yellow-400/10';
            case 'APROBADO_ZONA': return 'text-blue-400 border-blue-400/30 bg-blue-400/10';
            case 'RECHAZADO': return 'text-red-400 border-red-400/30 bg-red-400/10';
            default: return 'text-gray-400';
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0
        }).format(amount);
    };

    return (
        <div className="space-y-6 pb-20"> {/* Padding bottom para el botón flotante */}

            {/* Header Personalizado */}
            <header className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">Mis Solicitudes</h1>
                    <p className="text-white/60">Zona {profile?.zona} • {profile?.nombre}</p>
                </div>
                <button
                    onClick={signOut}
                    className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-white/60 hover:text-red-400 transition-colors border border-white/10"
                    title="Cerrar Sesión"
                >
                    <LogOut size={20} />
                </button>
            </header>

            {/* Lista de Tarjetas */}
            {loading ? (
                <div className="text-center py-10 text-white/50 animate-pulse">Cargando registros...</div>
            ) : requests.length === 0 ? (
                <div className="text-center py-12 bg-white/5 rounded-2xl border border-white/10">
                    <Tractor className="w-12 h-12 text-white/20 mx-auto mb-4" />
                    <p className="text-white/60">No tienes solicitudes pendientes.</p>
                    <p className="text-sm text-white/40">¡Crea la primera ahora!</p>
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {requests.map((req) => (
                        <GlassCard key={req.id} className="relative group hover:border-white/30 transition-all">
                            {/* Badge de Estado */}
                            <div className={`absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(req.estado)}`}>
                                {req.estado.replace('_', ' ')}
                            </div>

                            {/* Título: Suerte */}
                            <div className="flex items-center gap-2 mb-3 text-emerald-400">
                                <MapPin size={18} />
                                <span className="font-bold text-lg">{req.suertes?.codigo}</span>
                                <span className="text-xs text-white/50 ml-1">({req.suertes?.hacienda})</span>
                            </div>

                            {/* Detalles */}
                            <div className="space-y-2 text-sm text-white/80">
                                <div className="flex items-center gap-2">
                                    <Tractor size={16} className="text-blue-400" />
                                    <span>{req.labores?.nombre}</span>
                                </div>
                                <div className="pl-6 text-white/50 text-xs">
                                    ↳ {req.actividades?.nombre}
                                </div>

                                {/* Prioridad */}
                                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/10">
                                    <AlertTriangle size={14} className={req.prioridades?.nivel <= 3 ? "text-red-400" : "text-yellow-400"} />
                                    <span className="text-xs font-mono">
                                        {req.prioridades?.asunto} (Nivel {req.prioridades?.nivel})
                                    </span>
                                </div>

                                {/* Fecha y Costo Evaluado */}
                                <div className="flex flex-col gap-1 text-white/30 text-xs mt-1">
                                    <div className="flex items-center gap-2">
                                        <Clock size={12} />
                                        {new Date(req.created_at).toLocaleDateString()}
                                    </div>

                                    {req.maquinaria?.tarifa_hora && (
                                        <div className="flex items-center gap-2 text-sm text-emerald-400 font-bold bg-emerald-500/10 px-3 py-1.5 rounded-lg w-fit mt-1 border border-emerald-500/20">
                                            <span>{formatCurrency(req.horas_estimadas * req.maquinaria.tarifa_hora)}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </GlassCard>
                    ))}
                </div>
            )}

            {/* FAB (Floating Action Button) - Botón Flotante para Crear */}
            <div className="fixed bottom-6 right-6 z-50">
                <button
                    onClick={() => navigate('/solicitudes/nueva')}
                    className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-black font-bold py-4 px-6 rounded-full shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-all transform hover:scale-105 active:scale-95"
                >
                    <Plus size={24} />
                    <span>Nueva Solicitud</span>
                </button>
            </div>
        </div>
    );
}
