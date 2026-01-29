import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Tractor, AlertCircle, Calendar, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

interface Request {
    id: string;
    created_at: string;
    estado: string;
    suertes: any; // Using any to handle Supabase join inconsistency (sometimes array, sometimes object)
    labores: any;
    prioridades: any;
    horas_estimadas: number;
}

export function TechnicianDashboard() {
    const { user } = useAuth();
    const [requests, setRequests] = useState<Request[]>([]);
    const [loading, setLoading] = useState(true);
    const [userZone, setUserZone] = useState<number | null>(null);

    useEffect(() => {
        if (!user) return;

        const fetchData = async () => {
            setLoading(true);
            try {
                // 1. Get User Zone
                const { data: userData } = await supabase
                    .from('usuarios')
                    .select('zona')
                    .eq('id', user.id)
                    .single();

                if (userData) setUserZone(userData.zona);

                // 2. Get Requests
                const { data: reqData, error } = await supabase
                    .from('programaciones')
                    .select(`
                        id,
                        created_at,
                        estado,
                        horas_estimadas,
                        suertes ( codigo, hacienda ),
                        labores ( nombre ),
                        prioridades ( asunto, nivel )
                    `)
                    .eq('tecnico_id', user.id)
                    .order('created_at', { ascending: false })
                    .limit(20);

                if (error) throw error;

                // Transform data to ensure joined fields are handled correctly
                const formattedData = (reqData || []).map(item => ({
                    ...item,
                    suertes: Array.isArray(item.suertes) ? item.suertes[0] : item.suertes,
                    labores: Array.isArray(item.labores) ? item.labores[0] : item.labores,
                    prioridades: Array.isArray(item.prioridades) ? item.prioridades[0] : item.prioridades,
                }));

                setRequests(formattedData);

            } catch (err) {
                console.error('Error fetching dashboard data:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();

        // Realtime subscription could go here

    }, [user]);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'PENDIENTE_APROBACION': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
            case 'APROBADO': return 'text-brand-liquid bg-brand-liquid/10 border-brand-liquid/20';
            case 'RECHAZADO': return 'text-red-400 bg-red-400/10 border-red-400/20';
            case 'FINALIZADO': return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
            default: return 'text-white/50 bg-white/5 border-white/10';
        }
    };

    const getStatusLabel = (status: string) => {
        return status.replace('_', ' ');
    };

    return (
        <div className="relative min-h-screen pb-20">
            {/* Header */}
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-white mb-2">
                    Mis Solicitudes
                    {userZone !== null && <span className="text-brand-liquid ml-3 text-2xl">Zona {userZone}</span>}
                </h1>
                <p className="text-white/50">Gestiona tus requerimientos de maquinaria.</p>
            </header>

            {/* Requests List */}
            <div className="space-y-4">
                {loading ? (
                    <div className="text-white/50 text-center py-10">Cargando solicitudes...</div>
                ) : requests.length === 0 ? (
                    <div className="text-white/50 text-center py-10 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm">
                        <Tractor className="mx-auto h-12 w-12 mb-3 opacity-20" />
                        <p>No has realizado ninguna solicitud aún.</p>
                    </div>
                ) : (
                    requests.map((req) => (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            key={req.id}
                            className="group relative bg-white/5 hover:bg-white/10 border border-white/10 hover:border-brand-liquid/30 rounded-2xl p-5 transition-all duration-300 backdrop-blur-md"
                        >
                            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                                {/* Left: Info */}
                                <div className="space-y-2 flex-1">
                                    <div className="flex items-center gap-3">
                                        <div className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(req.estado)}`}>
                                            {getStatusLabel(req.estado)}
                                        </div>
                                        <span className="text-white/40 text-xs flex items-center gap-1">
                                            <Calendar size={12} />
                                            {new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }).format(new Date(req.created_at))}
                                        </span>
                                    </div>

                                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                        <Tractor className="text-brand-liquid" size={20} />
                                        {req.labores?.nombre}
                                    </h3>

                                    <div className="flex items-center gap-4 text-sm text-white/70">
                                        <div className="flex items-center gap-1.5">
                                            <MapPin size={14} className="text-brand-liquid/70" />
                                            <span className="font-medium text-white">{req.suertes?.codigo}</span>
                                            <span className="text-white/40">({req.suertes?.hacienda})</span>
                                        </div>
                                        {req.prioridades && (
                                            <div className="flex items-center gap-1.5" style={{ color: req.prioridades.nivel > 2 ? '#ef4444' : '#eab308' }}>
                                                <AlertCircle size={14} />
                                                <span>{req.prioridades.asunto}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Right: Hours */}
                                <div className="text-right pl-4 border-l border-white/10 hidden md:block">
                                    <div className="text-xs text-white/40 mb-1">Estimado</div>
                                    <div className="text-2xl font-bold text-white">{req.horas_estimadas}h</div>
                                </div>
                            </div>
                        </motion.div>
                    ))
                )}
            </div>

            {/* FAB - Floating Action Button */}
            <Link
                to="/solicitudes/nueva"
                className="fixed bottom-8 right-8 md:bottom-12 md:right-12 z-40 group"
            >
                <div className="absolute inset-0 bg-brand-liquid rounded-full blur opacity-40 group-hover:opacity-60 transition-opacity duration-300" />
                <button className="relative bg-brand-liquid hover:bg-brand-liquid/90 text-black p-4 rounded-full shadow-lg transition-transform duration-300 group-hover:scale-105 flex items-center gap-2 pr-6">
                    <Plus size={24} strokeWidth={2.5} />
                    <span className="font-bold text-lg">Nueva Solicitud</span>
                </button>
            </Link>
        </div>
    );
}
