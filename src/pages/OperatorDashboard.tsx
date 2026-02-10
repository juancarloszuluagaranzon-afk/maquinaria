import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { LogOut, ClipboardList, Play, MapPin, Clock, Tractor, Square, AlertTriangle, Truck } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface Job {
    id: string;
    suerte_id: string;
    labor_id: string;
    maquinaria_id: string;
    contratista_id: string;
    estado: 'PROGRAMADO' | 'ASIGNADO' | 'EN_EJECUCION' | 'FINALIZADO';
    orden_ejecucion: number;
    horas_estimadas: number;
    tarifa_hora: number;
    tecnico_id?: string;
    suertes: { codigo: string; hacienda: string; zona: number };
    labores: { nombre: string };
    maquinaria: { nombre: string };
    contratistas: { nombre: string };
}

interface ActiveExecution {
    id: string;
    fecha_inicio: string;
    programacion_id?: string;
    tipo: 'LABOR' | 'TRASLADO' | 'EMERGENCIA';
    horometro_inicio?: number;
    lat_inicio?: number;
    lon_inicio?: number;
    maquinaria_id?: string;
    operador_id?: string;
}

export default function OperatorDashboard() {
    const { profile, user, signOut } = useAuth();
    const navigate = useNavigate();
    const [jobs, setJobs] = useState<Job[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeExecution, setActiveExecution] = useState<ActiveExecution | null>(null);
    const [timer, setTimer] = useState<string>('00:00:00');

    // Modal State
    const [showStartModal, setShowStartModal] = useState(false);
    const [showEndModal, setShowEndModal] = useState(false);

    // Form State
    const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
    const [executionType, setExecutionType] = useState<'LABOR' | 'TRASLADO' | 'EMERGENCIA'>('LABOR');
    const [horometro, setHorometro] = useState<string>('');
    const [gpsCoords, setGpsCoords] = useState<{ lat: number; lng: number } | null>(null);
    const [gettingGps, setGettingGps] = useState(false);

    useEffect(() => {
        if (profile?.rol !== 'operador') return;
        fetchJobs();
    }, [profile]);

    // Timer for active execution
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (activeExecution?.fecha_inicio) {
            interval = setInterval(() => {
                const start = new Date(activeExecution.fecha_inicio).getTime();
                const now = Date.now();
                const diff = now - start;
                const hours = Math.floor(diff / (1000 * 60 * 60));
                const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((diff % (1000 * 60)) / 1000);
                setTimer(
                    `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
                );
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [activeExecution]);

    const fetchJobs = async () => {
        try {
            setLoading(true);

            const { data: jobsData, error: jobsError } = await supabase
                .from('programaciones')
                .select(`
                    *,
                    suertes (codigo, hacienda, zona),
                    labores (nombre),
                    maquinaria (nombre),
                    contratistas (nombre)
                `)
                .or('estado.eq.PROGRAMADO,estado.eq.ASIGNADO,estado.eq.EN_EJECUCION')
                .order('orden_ejecucion', { ascending: true });

            if (jobsError) throw jobsError;

            // Fetch active execution for this operator
            const { data: execData, error: execError } = await supabase
                .from('ejecuciones')
                .select('*')
                .eq('operador_id', user?.id)
                .is('fecha_fin', null)
                .maybeSingle();

            if (execError) throw execError;

            setJobs(jobsData || []);
            setActiveExecution(execData);

        } catch (error: any) {
            console.error('Error fetching jobs:', error);
            toast.error(`Error: ${error.message || 'Error cargando datos'}`);
        } finally {
            setLoading(false);
        }
    };

    // ---- GPS ----
    const getGpsLocation = () => {
        setGettingGps(true);
        if (!navigator.geolocation) {
            toast.error('Geolocalización no soportada en este dispositivo');
            setGettingGps(false);
            return;
        }
        navigator.geolocation.getCurrentPosition(
            (position) => {
                setGpsCoords({ lat: position.coords.latitude, lng: position.coords.longitude });
                setGettingGps(false);
                toast.success('Ubicación capturada');
            },
            (err) => {
                console.error(err);
                toast.error('Error obteniendo ubicación. Active el GPS.');
                setGettingGps(false);
            },
            { enableHighAccuracy: true, timeout: 15000 }
        );
    };

    // ---- Open Modals ----
    const openStartModal = (type: 'LABOR' | 'TRASLADO' | 'EMERGENCIA', jobId: string | null = null) => {
        if (activeExecution) {
            toast.error('Ya tienes una actividad en ejecución. Finalízala primero.');
            return;
        }
        setExecutionType(type);
        setSelectedJobId(jobId);
        setHorometro('');
        setGpsCoords(null);
        setShowStartModal(true);
        getGpsLocation();
    };

    const openEndModal = () => {
        setHorometro('');
        setGpsCoords(null);
        setShowEndModal(true);
        getGpsLocation();
    };

    // ---- Start Execution ----
    const handleStartExecution = async () => {
        if (!horometro) {
            toast.error('Debe registrar el Horómetro');
            return;
        }
        if (!gpsCoords) {
            toast.error('Debe capturar la ubicación GPS');
            return;
        }

        try {
            // Determine machine: use job's machine for LABOR, or first available job's machine for others
            let machineId: string | null = null;
            if (executionType === 'LABOR' && selectedJobId) {
                const job = jobs.find(j => j.id === selectedJobId);
                machineId = job?.maquinaria_id || null;
            } else {
                machineId = jobs[0]?.maquinaria_id || null;
            }

            const { data: newExec, error: execError } = await supabase
                .from('ejecuciones')
                .insert({
                    programacion_id: selectedJobId, // null for Traslado/Emergencia
                    operador_id: user?.id,
                    maquinaria_id: machineId,
                    fecha_inicio: new Date().toISOString(),
                    horometro_inicio: parseFloat(horometro),
                    lat_inicio: gpsCoords.lat,
                    lon_inicio: gpsCoords.lng,
                    tipo: executionType
                })
                .select()
                .single();

            if (execError) throw execError;

            // If Labor, update Job status
            if (executionType === 'LABOR' && selectedJobId) {
                await supabase
                    .from('programaciones')
                    .update({ estado: 'EN_EJECUCION' })
                    .eq('id', selectedJobId);
            }

            setActiveExecution(newExec);
            setShowStartModal(false);
            toast.success(`${executionType} iniciado`);
            fetchJobs();

        } catch (error: any) {
            console.error('Error starting:', error);
            toast.error('Error al iniciar: ' + error.message);
        }
    };

    // ---- Stop Execution ----
    const handleStopExecution = async () => {
        if (!horometro) {
            toast.error('Debe registrar el Horómetro');
            return;
        }
        if (!gpsCoords) {
            toast.error('Debe capturar la ubicación GPS');
            return;
        }
        if (!activeExecution) return;

        try {
            const { error: execError } = await supabase
                .from('ejecuciones')
                .update({
                    fecha_fin: new Date().toISOString(),
                    horometro_fin: parseFloat(horometro),
                    lat_fin: gpsCoords.lat,
                    lon_fin: gpsCoords.lng
                })
                .eq('id', activeExecution.id);

            if (execError) throw execError;

            // If Labor, update Job status
            if (activeExecution.tipo === 'LABOR' && activeExecution.programacion_id) {
                await supabase
                    .from('programaciones')
                    .update({ estado: 'FINALIZADO' })
                    .eq('id', activeExecution.programacion_id);
            }

            setActiveExecution(null);
            setShowEndModal(false);
            toast.success('Actividad finalizada');
            fetchJobs();

        } catch (error: any) {
            console.error('Error stopping:', error);
            toast.error('Error al finalizar: ' + error.message);
        }
    };

    const handleSignOut = async () => {
        await signOut();
        navigate('/login');
    };

    if (loading) return <div className="p-8 text-center text-white animate-pulse">Cargando...</div>;

    const activeJob = activeExecution?.programacion_id
        ? jobs.find(j => j.id === activeExecution.programacion_id)
        : null;

    return (
        <div className="relative min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 pb-20">
            {/* Background effects */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-purple-500/20 blur-3xl"></div>
                <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-blue-500/20 blur-3xl"></div>
            </div>

            {/* Header */}
            <header className="sticky top-0 z-10 border-b border-white/10 bg-slate-900/80 px-4 py-4 backdrop-blur-xl">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold text-white">Ejecución</h1>
                        <p className="text-xs text-white/50">{profile?.nombre} • Zona {profile?.zona || 'N/A'}</p>
                    </div>
                    <button onClick={handleSignOut} className="rounded-full bg-white/10 p-2 text-white hover:bg-white/20">
                        <LogOut className="h-5 w-5" />
                    </button>
                </div>
            </header>

            {/* Active Execution Banner */}
            {activeExecution && (
                <div className="sticky top-[73px] z-10 bg-amber-500/10 px-4 py-4 backdrop-blur-md border-b border-amber-500/20">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-emerald-500 rounded-xl animate-bounce">
                                <Play size={20} fill="white" className="text-white" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="font-mono font-bold text-xl text-amber-400">{timer}</span>
                                    <span className={`text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${activeExecution.tipo === 'EMERGENCIA' ? 'bg-red-500/20 text-red-400' :
                                            activeExecution.tipo === 'TRASLADO' ? 'bg-blue-500/20 text-blue-400' :
                                                'bg-emerald-500/20 text-emerald-400'
                                        }`}>{activeExecution.tipo}</span>
                                </div>
                                {activeJob && (
                                    <p className="text-xs text-white/50">
                                        Suerte {activeJob.suertes.codigo} • {activeJob.labores.nombre}
                                    </p>
                                )}
                            </div>
                        </div>
                        <button
                            onClick={openEndModal}
                            className="bg-red-500 hover:bg-red-600 text-white font-bold px-4 py-3 rounded-xl shadow-lg transition-all active:scale-95 flex items-center gap-2"
                        >
                            <Square size={18} fill="white" /> FINALIZAR
                        </button>
                    </div>
                </div>
            )}

            {/* Quick Actions (Traslado / Emergencia) - Only when idle */}
            {!activeExecution && (
                <div className="grid grid-cols-2 gap-4 px-4 mt-4">
                    <button
                        onClick={() => openStartModal('TRASLADO')}
                        className="flex flex-col items-center justify-center gap-2 bg-blue-600/20 border border-blue-500/30 p-5 rounded-xl text-blue-200 hover:bg-blue-600/30 transition-all active:scale-95"
                    >
                        <Truck size={28} />
                        <span className="font-bold text-sm">Registrar Traslado</span>
                    </button>
                    <button
                        onClick={() => openStartModal('EMERGENCIA')}
                        className="flex flex-col items-center justify-center gap-2 bg-red-600/20 border border-red-500/30 p-5 rounded-xl text-red-200 hover:bg-red-600/30 transition-all active:scale-95"
                    >
                        <AlertTriangle size={28} />
                        <span className="font-bold text-sm">Reportar Emergencia</span>
                    </button>
                </div>
            )}

            {/* Job List */}
            <main className="px-4 py-6 relative z-10">
                <h3 className="text-white/60 font-bold uppercase tracking-wider text-sm ml-2 mb-4">Mis Labores Asignadas</h3>
                {loading ? (
                    <div className="flex justify-center py-8">
                        <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-purple-500"></div>
                    </div>
                ) : jobs.length === 0 ? (
                    <div className="mt-10 text-center">
                        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/5">
                            <ClipboardList className="h-8 w-8 text-white/30" />
                        </div>
                        <h3 className="text-lg font-medium text-white">No hay labores asignadas</h3>
                        <p className="mt-2 text-sm text-white/50">Todo está al día. ¡Buen trabajo!</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {jobs.map((job) => {
                            const isActiveJob = activeExecution?.programacion_id === job.id;
                            const isDisabled = activeExecution !== null && !isActiveJob;

                            return (
                                <div
                                    key={job.id}
                                    className={`relative overflow-hidden rounded-xl border p-5 transition-all
                                        ${isActiveJob
                                            ? 'border-purple-500/50 bg-purple-500/10 shadow-lg shadow-purple-900/20'
                                            : 'border-white/10 bg-white/5'
                                        }
                                        ${isDisabled ? 'opacity-50 grayscale' : ''}
                                    `}
                                >
                                    {isActiveJob && (
                                        <div className="absolute right-0 top-0 rounded-bl-xl bg-purple-500 px-3 py-1 text-xs font-bold text-white">
                                            EN PROGRESO
                                        </div>
                                    )}

                                    <div className="mb-4 flex items-start justify-between">
                                        <div>
                                            <div className="flex items-center gap-2 text-sm font-medium text-white/70">
                                                <MapPin className="h-4 w-4 text-purple-400" />
                                                {job.suertes?.hacienda}
                                            </div>
                                            <h3 className="mt-1 text-2xl font-bold text-white">
                                                Suerte {job.suertes?.codigo}
                                            </h3>
                                        </div>
                                        <div className="rounded-lg bg-white/5 px-3 py-2 text-center">
                                            <span className="block text-xs text-white/40">Zona</span>
                                            <span className="font-bold text-white">{job.suertes?.zona}</span>
                                        </div>
                                    </div>

                                    <div className="mb-6 grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <span className="text-xs text-white/40">Labor</span>
                                            <div className="flex items-center gap-2 text-sm text-white/90">
                                                <Tractor className="h-4 w-4 text-green-400" />
                                                {job.labores?.nombre}
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <span className="text-xs text-white/40">Maquinaria</span>
                                            <div className="text-sm text-white/90">{job.maquinaria?.nombre}</div>
                                        </div>
                                        <div className="space-y-1">
                                            <span className="text-xs text-white/40">Contratista</span>
                                            <div className="text-sm text-white/90">{job.contratistas?.nombre}</div>
                                        </div>
                                        <div className="space-y-1">
                                            <span className="text-xs text-white/40">Duración Est.</span>
                                            <div className="text-sm text-white/90">{job.horas_estimadas} hrs</div>
                                        </div>
                                    </div>

                                    <div className="flex gap-3">
                                        {(job.estado === 'PROGRAMADO' || job.estado === 'ASIGNADO') && (
                                            <button
                                                onClick={() => openStartModal('LABOR', job.id)}
                                                disabled={isDisabled}
                                                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-green-600 to-green-500 py-3 font-bold text-white shadow-lg transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                                            >
                                                <Play className="h-5 w-5 fill-current" />
                                                INICIAR
                                            </button>
                                        )}

                                        {job.estado === 'EN_EJECUCION' && isActiveJob && (
                                            <button
                                                onClick={openEndModal}
                                                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-red-600 to-red-500 py-3 font-bold text-white shadow-lg transition-all active:scale-95"
                                            >
                                                <Square className="h-5 w-5 fill-current" />
                                                FINALIZAR
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </main>

            {/* ============================================================ */}
            {/* START / END MODAL                                            */}
            {/* ============================================================ */}
            {(showStartModal || showEndModal) && (
                <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-slate-900 w-full max-w-md rounded-3xl p-6 border border-white/10 shadow-2xl">
                        <h2 className="text-2xl font-bold text-white mb-6 text-center">
                            {showStartModal
                                ? `Iniciar ${executionType === 'LABOR' ? 'Labor' : executionType === 'TRASLADO' ? 'Traslado' : 'Emergencia'}`
                                : 'Finalizar Actividad'}
                        </h2>

                        <div className="space-y-6">
                            {/* Horometro Input */}
                            <div>
                                <label className="block text-white/60 text-sm font-bold mb-2 ml-1">
                                    HORÓMETRO {showStartModal ? 'INICIAL' : 'FINAL'}
                                </label>
                                <div className="relative">
                                    <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={20} />
                                    <input
                                        type="number"
                                        inputMode="decimal"
                                        step="0.1"
                                        value={horometro}
                                        onChange={(e) => setHorometro(e.target.value)}
                                        className="w-full bg-white/5 border border-white/20 rounded-xl py-4 pl-12 pr-4 text-white text-xl font-bold focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
                                        placeholder="0000.0"
                                    />
                                </div>
                            </div>

                            {/* GPS Status */}
                            <div className="bg-white/5 rounded-xl p-4 border border-white/10 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${gpsCoords ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                                        <MapPin size={24} />
                                    </div>
                                    <div>
                                        <p className="text-white font-bold text-sm">Ubicación GPS</p>
                                        <p className="text-xs text-white/40">
                                            {gettingGps ? 'Obteniendo...' : gpsCoords ? `${gpsCoords.lat.toFixed(5)}, ${gpsCoords.lng.toFixed(5)}` : 'Requerida'}
                                        </p>
                                    </div>
                                </div>
                                {!gpsCoords && !gettingGps && (
                                    <button onClick={getGpsLocation} className="text-xs bg-white/10 px-3 py-1 rounded-full text-white hover:bg-white/20">
                                        Reintentar
                                    </button>
                                )}
                                {gettingGps && (
                                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/20 border-t-purple-500"></div>
                                )}
                            </div>

                            {/* Action Buttons */}
                            <div className="grid grid-cols-2 gap-4 pt-4">
                                <button
                                    onClick={() => { setShowStartModal(false); setShowEndModal(false); }}
                                    className="py-4 rounded-xl border border-white/10 text-white/60 font-bold hover:bg-white/5 transition-all"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={showStartModal ? handleStartExecution : handleStopExecution}
                                    disabled={!horometro || !gpsCoords}
                                    className={`py-4 rounded-xl font-bold text-white shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95
                                        ${(!horometro || !gpsCoords)
                                            ? 'bg-gray-600 opacity-50 cursor-not-allowed'
                                            : showStartModal
                                                ? 'bg-gradient-to-r from-green-600 to-green-500'
                                                : 'bg-gradient-to-r from-red-600 to-red-500'
                                        }
                                    `}
                                >
                                    {showStartModal ? <Play size={20} className="fill-current" /> : <Square size={20} className="fill-current" />}
                                    {showStartModal ? 'INICIAR' : 'FINALIZAR'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
