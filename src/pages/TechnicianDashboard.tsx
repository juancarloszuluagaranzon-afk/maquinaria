import { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, Tractor, Clock, MapPin, LogOut, CheckCircle, FileText, PenTool } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { GlassCard } from '../components/ui/GlassCard';
import SignatureCanvas from 'react-signature-canvas';
import toast from 'react-hot-toast';

export default function TechnicianDashboard() {
    const { user, profile, signOut } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [requests, setRequests] = useState<any[]>([]);
    const [executions, setExecutions] = useState<any[]>([]);
    const [signedExecutions, setSignedExecutions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Default tab from URL or 'solicitudes'
    const [activeTab, setActiveTab] = useState<'solicitudes' | 'ejecuciones' | 'firmadas'>(
        (searchParams.get('tab') as 'solicitudes' | 'ejecuciones' | 'firmadas') || 'solicitudes'
    );

    // Signature Modal
    const [showSignModal, setShowSignModal] = useState(false);
    const [selectedExecution, setSelectedExecution] = useState<any>(null);
    const sigCanvas = useRef<SignatureCanvas>(null);

    // Update activeTab if URL changes (optional but good for nav)
    useEffect(() => {
        const tab = searchParams.get('tab');
        if (tab && ['solicitudes', 'ejecuciones', 'firmadas'].includes(tab)) {
            setActiveTab(tab as any);
        }
    }, [searchParams]);

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            if (activeTab === 'solicitudes') {
                await fetchMyRequests();
            } else if (activeTab === 'ejecuciones') {
                await fetchPendingSignatures();
            } else {
                await fetchSignedExecutions();
            }
            setLoading(false);
        };
        loadData();
    }, [user, activeTab]);

    const fetchSignedExecutions = async () => {
        try {
            if (!user) return;

            let query = supabase
                .from('ejecuciones')
                .select(`
                    *,
                    programaciones!inner (
                        tecnico_id,
                        suertes (codigo, hacienda),
                        labores (nombre),
                        actividades (nombre),
                        tecnico:usuarios!tecnico_id (nombre)
                    ),
                    maquinaria (nombre, tarifa_hora)
                `)
                .not('firma_tecnico_url', 'is', null) // Signed
                .order('fin', { ascending: false });

            // Only filter by user if NOT analyst or admin
            const isAnalystOrAdmin = profile?.rol === 'analista' || profile?.rol === 'admin';
            if (!isAnalystOrAdmin) {
                query = query.eq('programaciones.tecnico_id', user.id);
            }

            const { data, error } = await query;

            if (error) throw error;
            setSignedExecutions(data || []);
        } catch (error) {
            console.error('Error fetching signed:', error);
            toast.error('Error cargando ejecuciones firmadas');
        }
    };

    const fetchPendingSignatures = async () => {
        try {
            if (!user) return;

            // Fetch executions for my programaciones that are finished but not signed
            const { data, error } = await supabase
                .from('ejecuciones')
                .select(`
                    *,
                    programaciones!inner (
                        tecnico_id,
                        suertes (codigo, hacienda),
                        labores (nombre),
                        actividades (nombre)
                    ),
                    maquinaria (nombre)
                `)
                .eq('programaciones.tecnico_id', user.id)
                .is('firma_tecnico_url', null)
                .not('recibo_url', 'is', null)
                .order('fin', { ascending: false });

            if (error) throw error;
            setExecutions(data || []);
        } catch (error) {
            console.error('Error fetching signatures:', error);
            toast.error('Error cargando ejecuciones para firma');
        }
    };

    const fetchMyRequests = async () => {
        try {
            if (!user) return;

            // QUERY CRITICA: Solo mis solicitudes (.eq 'tecnico_id')
            // Traemos también datos de la suerte y labor relacionados
            const { data, error } = await supabase
                .from('programaciones')
                .select(`
                  *,
                  suertes (codigo, hacienda, area_neta),
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
        }
    };

    const handleOpenSignModal = (execution: any) => {
        setSelectedExecution(execution);
        setShowSignModal(true);
    };

    const handleSaveSignature = async () => {
        if (!processSignature()) return;
    };

    const processSignature = async () => {
        if (!sigCanvas.current || sigCanvas.current.isEmpty()) {
            toast.error('Por favor firme antes de guardar');
            return false;
        }

        try {
            // Access the underlying canvas to get the blob
            // Use getCanvas() as getTrimmedCanvas() is causing bundler issues
            // @ts-ignore
            const canvas = sigCanvas.current.getCanvas();
            const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/png'));

            if (!blob || !selectedExecution) return false;

            const fileName = `signature_${selectedExecution.id}_${Date.now()}.png`;
            const { error: uploadError } = await supabase.storage
                .from('receipts') // Reuse receipts bucket
                .upload(fileName, blob);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('receipts')
                .getPublicUrl(fileName);

            const { error: updateError } = await supabase.rpc('sign_execution', {
                execution_id: selectedExecution.id,
                signature_url: publicUrl
            });

            if (updateError) throw updateError;

            toast.success('Documento firmado correctamente');
            setShowSignModal(false);
            // Refresh list
            fetchPendingSignatures();
            return true;

        } catch (error: any) {
            console.error('Error signing:', error);
            toast.error('Error al guardar la firma: ' + error.message);
            return false;
        }
    };

    const clearSignature = () => {
        sigCanvas.current?.clear();
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

            {/* Tabs */}
            <div className="flex gap-4 border-b border-white/10 pb-4 overflow-x-auto">
                <button
                    onClick={() => setActiveTab('solicitudes')}
                    className={`px-4 py-2 rounded-lg font-bold transition-all whitespace-nowrap ${activeTab === 'solicitudes' ? 'bg-emerald-500 text-black' : 'text-white/60 hover:text-white hover:bg-white/5'}`}
                >
                    Mis Solicitudes
                </button>
                <button
                    onClick={() => setActiveTab('ejecuciones')}
                    className={`px-4 py-2 rounded-lg font-bold transition-all whitespace-nowrap ${activeTab === 'ejecuciones' ? 'bg-blue-500 text-black' : 'text-white/60 hover:text-white hover:bg-white/5'}`}
                >
                    Validar ({executions.length})
                </button>
                <button
                    onClick={() => setActiveTab('firmadas')}
                    className={`px-4 py-2 rounded-lg font-bold transition-all whitespace-nowrap ${activeTab === 'firmadas' ? 'bg-purple-500 text-black' : 'text-white/60 hover:text-white hover:bg-white/5'}`}
                >
                    Ejecutadas
                </button>
            </div>

            {/* Lista de Tarjetas */}
            {loading ? (
                <div className="text-center py-10 text-white/50 animate-pulse">Cargando registros...</div>
            ) : (
                <>
                    {activeTab === 'solicitudes' && (
                        requests.length === 0 ? (
                            <div className="text-center py-12 bg-white/5 rounded-2xl border border-white/10">
                                <Tractor className="w-12 h-12 text-white/20 mx-auto mb-4" />
                                <p className="text-white/60">No tienes solicitudes pendientes.</p>
                                <p className="text-sm text-white/40">¡Crea la primera ahora!</p>
                            </div>
                        ) : (
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {requests.map((req) => (
                                    <GlassCard key={req.id} className="relative group hover:border-white/30 transition-all flex flex-col">
                                        <div className="flex items-start justify-between gap-2 mb-3">
                                            {/* Título: Suerte */}
                                            <div className="flex flex-wrap items-center gap-2 text-emerald-400">
                                                <MapPin size={18} className="shrink-0" />
                                                <span className="font-bold text-xl leading-none">{req.suertes?.codigo}</span>
                                                <span className="text-sm text-white/50 leading-none">({req.suertes?.hacienda})</span>
                                            </div>

                                            {/* Badge de Estado */}
                                            <div className={`px-2 py-1 rounded-full text-xs text-center font-bold border whitespace-nowrap shrink-0 ${getStatusColor(req.estado)}`}>
                                                {req.estado.replace('_', ' ')}
                                            </div>
                                        </div>

                                        {/* Detalles */}
                                        <div className="space-y-2 text-base text-white/80">
                                            <div className="flex items-center gap-2">
                                                <Tractor size={16} className="text-blue-400" />
                                                <span>{req.labores?.nombre}</span>
                                            </div>
                                            <div className="pl-6 text-white/50 text-sm">
                                                ↳ {req.actividades?.nombre}
                                            </div>

                                            {/* Footer con Fecha, Costos y Prioridad */}
                                            <div className="mt-3 pt-3 border-t border-white/10 space-y-2">
                                                <div className="flex items-center gap-2 text-white/30 text-sm">
                                                    <Clock size={14} />
                                                    {new Date(req.created_at).toLocaleDateString()}
                                                </div>

                                                <div className="flex items-center justify-between gap-2 flex-wrap">
                                                    {req.maquinaria?.tarifa_hora ? (
                                                        <div className="flex gap-2">
                                                            <div className="bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded text-sm text-emerald-400 font-mono whitespace-nowrap">
                                                                <span className="text-white/40 mr-1">Total:</span>
                                                                {formatCurrency(req.horas_estimadas * req.maquinaria.tarifa_hora)}
                                                            </div>
                                                            <div className="bg-blue-500/10 border border-blue-500/20 px-2 py-1 rounded text-sm text-blue-400 font-mono whitespace-nowrap">
                                                                <span className="text-white/40 mr-1">$/Ha:</span>
                                                                {formatCurrency((req.horas_estimadas * req.maquinaria.tarifa_hora) / (req.suertes?.area_neta || 1))}
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="text-sm text-white/20 italic">Sin tarifa definida</div>
                                                    )}

                                                    <div className={`px-2 py-1 rounded text-sm font-mono border whitespace-nowrap ${req.prioridades?.nivel <= 3 ? "text-red-400 border-red-400/30 bg-red-400/10" : "text-yellow-400 border-yellow-400/30 bg-yellow-400/10"}`}>
                                                        {req.prioridades?.asunto || 'Normal'}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </GlassCard>
                                ))}
                            </div>
                        )
                    )}

                    {activeTab === 'ejecuciones' && (
                        executions.length === 0 ? (
                            <div className="text-center py-12 bg-white/5 rounded-2xl border border-white/10">
                                <CheckCircle className="w-12 h-12 text-blue-400 mx-auto mb-4" />
                                <p className="text-white/60">No hay documentos pendientes de firma.</p>
                                <p className="text-sm text-white/40">¡Todo al día!</p>
                            </div>
                        ) : (
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {executions.map((exec) => (
                                    <GlassCard key={exec.id} className="relative group hover:border-blue-400/30 transition-all flex flex-col">
                                        <div className="flex items-start justify-between gap-2 mb-3">
                                            <div className="flex flex-wrap items-center gap-2 text-blue-400">
                                                <FileText size={18} className="shrink-0" />
                                                <span className="font-bold text-xl leading-none">Reporte de Labor</span>
                                            </div>
                                            <div className="px-2 py-1 rounded-full text-xs font-bold border border-blue-400/30 bg-blue-400/10 text-blue-400 whitespace-nowrap shrink-0 text-center">
                                                PENDIENTE FIRMA
                                            </div>
                                        </div>

                                        <div className="space-y-2 text-base text-white/80">
                                            <p className="font-bold text-white">{exec.programaciones?.labores?.nombre}</p>
                                            <p className="text-sm text-white/50">{exec.programaciones?.suertes?.codigo} - {exec.programaciones?.suertes?.hacienda}</p>

                                            <div className="flex items-center gap-2 mt-2 pt-2 border-t border-white/10">
                                                <Tractor size={14} />
                                                <span>{exec.maquinaria?.nombre}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Clock size={14} />
                                                <span>{new Date(exec.fin).toLocaleDateString()}</span>
                                                <span className="text-white/40">({exec.horas_reales} hrs)</span>
                                            </div>

                                            <div className="flex gap-2 mt-4">
                                                <a
                                                    href={exec.recibo_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex-1 bg-white/5 hover:bg-white/10 text-center py-2 rounded-lg text-sm font-bold transition-colors border border-white/10 relative z-10"
                                                >
                                                    Ver Recibo
                                                </a>
                                                <button
                                                    onClick={() => handleOpenSignModal(exec)}
                                                    className="flex-1 bg-blue-500 hover:bg-blue-400 text-black text-center py-2 rounded-lg text-sm font-bold transition-colors flex items-center justify-center gap-1 relative z-10"
                                                >
                                                    <PenTool size={14} />
                                                    Firmar
                                                </button>
                                            </div>
                                        </div>
                                    </GlassCard>
                                ))}
                            </div>
                        )
                    )}

                    {activeTab === 'firmadas' && (
                        signedExecutions.length === 0 ? (
                            <div className="text-center py-12 bg-white/5 rounded-2xl border border-white/10">
                                <CheckCircle className="w-12 h-12 text-purple-400 mx-auto mb-4" />
                                <p className="text-white/60">No hay labores ejecutadas aún.</p>
                            </div>
                        ) : (
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {signedExecutions.map((exec) => (
                                    <GlassCard key={exec.id} className="relative group hover:border-purple-400/30 transition-all bg-purple-500/5 flex flex-col">
                                        <div className="flex items-start justify-between gap-2 mb-3">
                                            <div className="flex flex-wrap items-center gap-2 text-purple-400">
                                                <FileText size={18} className="shrink-0" />
                                                <span className="font-bold text-xl leading-none">Labor Ejecutada</span>
                                            </div>
                                            <div className="px-2 py-1 rounded-full text-xs font-bold border border-purple-400/30 bg-purple-400/10 text-purple-400 flex items-center gap-1 justify-center whitespace-nowrap shrink-0">
                                                <CheckCircle size={12} /> FIRMADO
                                            </div>
                                        </div>

                                        <div className="space-y-2 text-base text-white/80">
                                            <p className="font-bold text-white">{exec.programaciones?.labores?.nombre}</p>
                                            <p className="text-sm text-white/50">{exec.programaciones?.suertes?.codigo} - {exec.programaciones?.suertes?.hacienda}</p>

                                            <div className="flex items-center gap-2 mt-2 pt-2 border-t border-white/10">
                                                <Tractor size={14} />
                                                <span>{exec.maquinaria?.nombre}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Clock size={14} />
                                                <span>{new Date(exec.fin).toLocaleDateString()}</span>
                                                <span className="text-white/40">({exec.horas_reales} hrs)</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm text-emerald-400">
                                                <CheckCircle size={12} />
                                                <span>Firmado el {new Date(exec.fecha_firma_tecnico).toLocaleDateString()}</span>
                                            </div>

                                            {/* Detalles Adicionales */}
                                            <div className="mt-3 pt-3 border-t border-white/10 text-sm space-y-1">
                                                <div className="flex justify-between text-white/70">
                                                    <span>Horómetros:</span>
                                                    <span className="font-mono text-white">{exec.horometro_inicio || 0} - {exec.horometro_fin}</span>
                                                </div>
                                                <div className="flex justify-between text-white/70">
                                                    <span>Costo Labor:</span>
                                                    <span className="font-mono text-emerald-400">
                                                        {exec.maquinaria?.tarifa_hora
                                                            ? formatCurrency(exec.horas_reales * exec.maquinaria.tarifa_hora)
                                                            : '$0'}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between text-white/70">
                                                    <span>Aprobado por:</span>
                                                    <span className="text-white">{exec.programaciones?.tecnico?.nombre || 'Técnico'}</span>
                                                </div>
                                            </div>

                                            <div className="flex gap-2 mt-4">
                                                <a
                                                    href={exec.recibo_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex-1 bg-white/5 hover:bg-white/10 text-center py-2 rounded-lg text-sm font-bold transition-colors border border-white/10 relative z-10"
                                                >
                                                    {exec.recibo_url?.includes('fake-receipt') ? 'Recibo (Prueba)' : 'Ver Recibo'}
                                                </a>
                                                <a
                                                    href={exec.firma_tecnico_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex-1 bg-gray-500/20 hover:bg-gray-500/30 text-gray-300 text-center py-2 rounded-lg text-sm font-bold transition-colors border border-gray-500/30 relative z-10"
                                                >
                                                    Ver Firma
                                                </a>
                                            </div>
                                        </div>
                                    </GlassCard>
                                ))}
                            </div>
                        )
                    )}
                </>
            )}

            {/* Signature Modal */}
            {showSignModal && selectedExecution && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
                        <div className="p-4 border-b border-white/10 flex justify-between items-center">
                            <h3 className="font-bold text-lg text-white">Firmar Documento</h3>
                            <button onClick={() => setShowSignModal(false)} className="text-white/60 hover:text-white">
                                <LogOut size={20} className="rotate-180" /> {/* Using logout icon rotated as close or just X */}
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            <p className="text-sm text-white/60">
                                Yo, <span className="text-white font-bold">{profile?.nombre}</span>, certifico que he revisado y apruebo la labor realizada en la suerte <span className="text-white font-bold">{selectedExecution.programaciones.suertes.codigo}</span>.
                            </p>

                            <div className="border-2 border-dashed border-white/20 rounded-xl bg-white/5 relative h-48 touch-none">
                                <SignatureCanvas
                                    ref={sigCanvas}
                                    penColor="white"
                                    canvasProps={{ className: 'signature-canvas w-full h-full' }}
                                    backgroundColor="rgba(255,255,255,0.05)"
                                />
                                <div className="absolute bottom-2 right-2 text-xs text-white/30 pointer-events-none">
                                    Firme aquí
                                </div>
                            </div>

                            <div className="flex justify-between">
                                <button onClick={clearSignature} className="text-xs text-red-400 hover:text-red-300 underline">
                                    Borrar Firma
                                </button>
                                <a href={selectedExecution.recibo_url} target="_blank" className="text-xs text-blue-400 hover:text-blue-300 underline">
                                    Ver Documento Original
                                </a>
                            </div>
                        </div>

                        <div className="p-4 border-t border-white/10 bg-white/5 flex justify-end gap-3">
                            <button
                                onClick={() => setShowSignModal(false)}
                                className="px-4 py-2 rounded-lg text-white/60 hover:bg-white/10 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSaveSignature}
                                className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-bold shadow-lg shadow-emerald-500/20 transition-all hover:scale-105"
                            >
                                Confirmar Firma
                            </button>
                        </div>
                    </div>
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
