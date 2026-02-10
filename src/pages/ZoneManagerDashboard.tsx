import { useEffect, useState, useRef } from 'react';
import { Check, X, Tractor, MapPin, Clock, Calendar, AlertCircle, Hammer } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { GlassCard } from '../components/ui/GlassCard';
import { GlassToast } from '../components/ui/GlassToast';

export default function ZoneManagerDashboard() {
    const { profile } = useAuth();
    const [searchParams] = useSearchParams();
    const approvalId = searchParams.get('id');
    const statusFilter = searchParams.get('status') || 'PENDIENTE_APROBACION';

    const [requests, setRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
    const [highlightedId, setHighlightedId] = useState<string | null>(null);
    const itemRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

    useEffect(() => {
        if (profile?.zona) {
            fetchZoneRequests();
        }
    }, [profile, statusFilter]); // Re-fetch when filter changes

    // Handle deep link focus
    useEffect(() => {
        if (approvalId && requests.length > 0) {
            const targetRequest = requests.find(r => r.id === approvalId);
            if (targetRequest) {
                setHighlightedId(approvalId);

                // Scroll into view
                setTimeout(() => {
                    itemRefs.current[approvalId]?.scrollIntoView({ behavior: 'smooth', block: 'center' });

                    // Show prompt if it's pending
                    if (targetRequest.estado === 'PENDIENTE_APROBACION') {
                        setToast({
                            message: 'Solicitud encontrada. Confirma para aprobar.',
                            type: 'info'
                        });
                    }
                }, 500);
            }
        }
    }, [approvalId, requests]);

    const fetchZoneRequests = async () => {
        try {
            setLoading(true);
            // 1. Fetch suertes in my zone
            const { data: suertesData } = await supabase
                .from('suertes')
                .select('id')
                .eq('zona', profile?.zona); // Strict Zone Filter

            if (!suertesData || suertesData.length === 0) {
                setRequests([]);
                return;
            }

            const suerteIds = suertesData.map(s => s.id);

            // 2. Fetch requests for those suertes AND matching status
            const { data, error } = await supabase
                .from('programaciones')
                .select(`
                  *,
                  suertes (codigo, hacienda, zona),
                  labores (nombre),
                  actividades (nombre),
                  prioridades (asunto, nivel),
                  usuarios (nombre),
                  maquinaria (id, nombre, tarifa_hora)
                `)
                .in('suerte_id', suerteIds)
                .eq('estado', statusFilter) // Filter by status
                .order('orden_ejecucion', { ascending: true })
                .order('created_at', { ascending: false });

            if (error) throw error;
            setRequests(data || []);
        } catch (error: any) {
            console.error('Error fetching zone requests:', error);
            setToast({ message: 'Error cargando ruta: ' + error.message, type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const updateStatus = async (id: string, newStatus: string) => {
        try {
            const { error } = await supabase
                .from('programaciones')
                .update({ estado: newStatus, updated_at: new Date().toISOString() })
                .eq('id', id);

            if (error) throw error;

            setToast({
                message: newStatus === 'APROBADO_ZONA' ? 'Solicitud Aprobada' : 'Solicitud Rechazada',
                type: newStatus === 'APROBADO_ZONA' ? 'success' : 'info'
            });

            // Refresh list to update UI state
            fetchZoneRequests();

        } catch (error: any) {
            console.error('Error updating status:', error);
            setToast({ message: 'Error actualizando estado', type: 'error' });
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'PENDIENTE_APROBACION': return 'text-yellow-400 border-yellow-400/30 bg-yellow-400/10';
            case 'APROBADO_ZONA': return 'text-emerald-400 border-emerald-400/30 bg-emerald-400/10';
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

    // Group requests by Machine
    const groupedRequests = requests.reduce((groups, req) => {
        const machineName = req.maquinaria?.nombre || 'Sin Maquinaria Asignada';
        if (!groups[machineName]) {
            groups[machineName] = [];
        }
        groups[machineName].push(req);
        return groups;
    }, {} as Record<string, typeof requests>);

    const getTitle = () => {
        switch (statusFilter) {
            case 'APROBADO_ZONA': return 'Solicitudes Aprobadas';
            case 'RECHAZADO': return 'Solicitudes Rechazadas';
            default: return 'Por Aprobar';
        }
    };

    return (
        <div className="space-y-6 pb-20">
            <header className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">{getTitle()} - Zona {profile?.zona}</h1>
                    <p className="text-white/60">
                        {statusFilter === 'PENDIENTE_APROBACION'
                            ? 'Organiza y aprueba las labores pendientes'
                            : 'Historial de solicitudes procesadas'}
                    </p>
                </div>
                <div className="bg-white/5 border border-white/10 px-4 py-2 rounded-xl">
                    <span className="text-sm text-white/40 uppercase tracking-wider">Total</span>
                    <p className="text-2xl font-bold text-white">{requests.length}</p>
                </div>
            </header>

            {toast && (
                <GlassToast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(null)}
                />
            )}

            {loading ? (
                <div className="text-center py-12 text-white/40 animate-pulse">Cargando ruta...</div>
            ) : requests.length === 0 ? (
                <div className="text-center py-16 bg-white/5 rounded-3xl border border-white/10 border-dashed">
                    <Tractor className="w-16 h-16 text-white/20 mx-auto mb-4" />
                    <p className="text-lg text-white/60">No hay labores {statusFilter === 'PENDIENTE_APROBACION' ? 'pendientes' : 'en este estado'}.</p>
                </div>
            ) : (
                <div className="space-y-8">
                    {(Object.entries(groupedRequests) as [string, any[]][]).map(([machineName, machineRequests]) => (
                        <div key={machineName} className="space-y-3">
                            {/* Machine Header */}
                            <div className="flex items-center gap-3 px-2">
                                <div className="p-2 rounded-lg bg-brand-liquid/20 text-brand-liquid border border-brand-liquid/30">
                                    <Tractor size={20} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-white/90">{machineName}</h2>
                                    <p className="text-sm text-white/40">{machineRequests.length} labor(es) asignada(s)</p>
                                </div>
                            </div>

                            {/* Requests List (No DND for now to avoid complexity with grouping) */}
                            <div className="space-y-3 pl-4 border-l-2 border-white/5 ml-4">
                                {machineRequests.map((req) => {
                                    const isHighlighted = highlightedId === req.id;

                                    return (
                                        <div
                                            key={req.id}
                                            ref={(el) => {
                                                itemRefs.current[req.id] = el;
                                            }}
                                            className="transition-all duration-500"
                                        >
                                            <GlassCard className={`
                                                p-0 overflow-hidden flex flex-col md:flex-row gap-0 group 
                                                ${isHighlighted
                                                    ? 'ring-2 ring-emerald-500 shadow-[0_0_50px_rgba(16,185,129,0.3)] scale-[1.02] bg-emerald-900/10'
                                                    : 'border-white/10 hover:border-white/20'}
                                            `}>
                                                {/* Status Strip (Replacing Drag Handle) */}
                                                <div className={`w-2 md:w-2 transition-colors ${req.estado === 'APROBADO_ZONA' ? 'bg-emerald-500' :
                                                    req.estado === 'RECHAZADO' ? 'bg-red-500' : 'bg-yellow-500'
                                                    }`} />

                                                {/* Content */}
                                                <div className="flex-1 p-5 grid md:grid-cols-[2fr,1.5fr,1fr] gap-4 items-center">

                                                    {/* Info Principal */}
                                                    <div>
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <div className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getStatusColor(req.estado)}`}>
                                                                {req.estado.replace('_', ' ')}
                                                            </div>
                                                            {/* Global Order Display Only */}
                                                            <span className="text-xs text-white/40 font-mono">Orden General: #{req.orden_ejecucion || '-'}</span>
                                                            {isHighlighted && (
                                                                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500 text-black text-[10px] font-bold animate-pulse">
                                                                    <AlertCircle size={10} /> SOLICITUD ACTUAL
                                                                </span>
                                                            )}
                                                        </div>
                                                        <h3 className="font-bold text-white text-lg flex items-center gap-2">
                                                            <MapPin size={16} className="text-emerald-400" />
                                                            {req.suertes?.codigo} <span className="text-white/40 text-sm font-normal">({req.suertes?.hacienda})</span>
                                                        </h3>
                                                        <p className="text-brand-liquid-light text-sm mt-1 flex items-center gap-2">
                                                            <Hammer size={14} /> {req.labores?.nombre}
                                                        </p>
                                                        <p className="text-white/40 text-xs ml-6">
                                                            {req.actividades?.nombre}
                                                        </p>
                                                    </div>

                                                    {/* Info Técnico y Prioridad */}
                                                    <div className="space-y-1">
                                                        <div className="flex items-center gap-2 text-sm text-white/70">
                                                            <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-blue-500 to-cyan-400 flex items-center justify-center text-[10px] font-bold text-black">
                                                                {req.usuarios?.nombre?.charAt(0) || 'T'}
                                                            </div>
                                                            {req.usuarios?.nombre || 'Técnico'}
                                                        </div>
                                                        <div className="flex items-center gap-2 text-xs text-white/40 ml-1">
                                                            <Calendar size={12} />
                                                            {new Date(req.created_at).toLocaleDateString()}
                                                            <Clock size={12} className="ml-2" />
                                                            {req.horas_estimadas}h est.
                                                        </div>
                                                        <div className={`
                                                            inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold mt-1 ml-1 border
                                                            ${req.prioridades?.nivel >= 8 ? 'text-red-400 border-red-400/30 bg-red-400/10' :
                                                                req.prioridades?.nivel >= 5 ? 'text-amber-400 border-amber-400/30 bg-amber-400/10' :
                                                                    'text-emerald-400 border-emerald-400/30 bg-emerald-400/10'}
                                                        `}>
                                                            Prioridad: {req.prioridades?.asunto || 'Normal'}
                                                        </div>
                                                    </div>

                                                    {/* Actions */}
                                                    <div className="flex items-center justify-end gap-2">
                                                        {req.estado === 'PENDIENTE_APROBACION' && (
                                                            <>
                                                                <button
                                                                    onClick={() => updateStatus(req.id, 'APROBADO_ZONA')}
                                                                    className={`
                                                                        p-2 rounded-full transition-all duration-300
                                                                        ${isHighlighted
                                                                            ? 'bg-emerald-500 text-black scale-110 shadow-[0_0_20px_rgba(16,185,129,0.5)] animate-pulse'
                                                                            : 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500 hover:text-black hover:scale-110'}
                                                                    `}
                                                                    title="Aprobar"
                                                                >
                                                                    <Check size={20} />
                                                                </button>
                                                                <button
                                                                    onClick={() => updateStatus(req.id, 'RECHAZADO')}
                                                                    className="p-2 rounded-full bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white hover:scale-110 transition-all"
                                                                    title="Rechazar"
                                                                >
                                                                    <X size={20} />
                                                                </button>
                                                            </>
                                                        )}
                                                        {req.estado === 'APROBADO_ZONA' && (
                                                            <div className="flex flex-col items-center text-emerald-400">
                                                                <Check size={24} />
                                                                <span className="text-[10px] font-bold">APROBADO</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </GlassCard>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
