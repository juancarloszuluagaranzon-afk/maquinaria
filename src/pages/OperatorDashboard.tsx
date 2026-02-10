import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { LogOut, ClipboardList, Play, MapPin, Clock, Tractor, Square } from 'lucide-react';
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
    suertes: {
        codigo: string;
        hacienda: string;
        zona: number;
    };
    labores: {
        nombre: string;
    };
    maquinaria: {
        nombre: string;
    };
    contratistas: {
        nombre: string;
    };
    execution?: Execution;
}

interface Execution {
    id: string;
    inicio: string;
    programacion_id: string;
}

export default function OperatorDashboard() {
    const { profile, user, signOut } = useAuth();
    const navigate = useNavigate();
    const [jobs, setJobs] = useState<Job[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeJobId, setActiveJobId] = useState<string | null>(null);
    const [timer, setTimer] = useState<string>('00:00:00');

    useEffect(() => {
        if (profile?.rol !== 'operador') return;
        fetchJobs();
    }, [profile]);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (activeJobId) {
            const job = jobs.find((j) => j.id === activeJobId);
            if (job?.execution?.inicio) {
                interval = setInterval(() => {
                    const start = new Date(job.execution!.inicio).getTime();
                    const now = new Date().getTime();
                    const diff = now - start;
                    const hours = Math.floor(diff / (1000 * 60 * 60));
                    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
                    setTimer(
                        `${hours.toString().padStart(2, '0')}:${minutes
                            .toString()
                            .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
                    );
                }, 1000);
            }
        }
        return () => clearInterval(interval);
    }, [activeJobId, jobs]);

    const fetchJobs = async () => {
        try {
            setLoading(true);

            // 1. Fetch accessible jobs
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

            // 2. Fetch active executions for this operator
            const { data: execData, error: execError } = await supabase
                .from('ejecuciones')
                .select('*')
                .eq('operador_id', user?.id)
                .is('fin', null);

            if (execError) throw execError;

            // 3. Merge data
            const mappedJobs = jobsData
                .filter(job => {
                    // Filter by zone if profile has zone
                    if (profile?.zona && job.suertes?.zona !== profile.zona) return false;
                    return true;
                })
                .map(job => {
                    const activeExec = execData.find(e => e.programacion_id === job.id);
                    if (activeExec) setActiveJobId(job.id);
                    return { ...job, execution: activeExec };
                });

            setJobs(mappedJobs as Job[]);
        } catch (error: any) {
            console.error('Error fetching jobs:', error);
            toast.error(`Error: ${error.message || 'Error cargando datos'}`);
        } finally {
            setLoading(false);
        }
    };

    const handleStartJob = async (job: Job) => {
        if (activeJobId) {
            toast.error('Ya tienes una labor en ejecución');
            return;
        }

        try {
            // First insert, but we don't need to assign execData result if we just want to verify success via error check
            // However, to update local state optimistically or correctly, we might want it.
            // But fetchJobs() is called at the end, so simply awaiting is fine.
            const { error: execError } = await supabase
                .from('ejecuciones')
                .insert({
                    programacion_id: job.id,
                    operador_id: user?.id,
                    inicio: new Date().toISOString()
                })
                .select()
                .single();

            if (execError) throw execError;

            const { error: progError } = await supabase
                .from('programaciones')
                .update({ estado: 'EN_EJECUCION' })
                .eq('id', job.id);

            if (progError) throw progError;

            // Notify Technician
            if (job.tecnico_id) {
                await supabase.from('notificaciones').insert({
                    usuario_id: job.tecnico_id,
                    mensaje: `Operador ${profile?.nombre} inició labor en Suerte ${job.suertes.codigo}`
                });
            }

            toast.success('Labor iniciada correctamente');
            fetchJobs();
        } catch (error) {
            console.error('Error starting job:', error);
            toast.error('Error al iniciar labor');
        }
    };

    const handleFinishJob = async (job: Job) => {
        if (!confirm('¿Estás seguro de finalizar esta labor?')) return;

        try {
            const endTime = new Date();
            const startTime = new Date(job.execution!.inicio);
            const durationMs = endTime.getTime() - startTime.getTime();
            const durationHours = durationMs / (1000 * 60 * 60); // Decimal hours
            const realCost = durationHours * job.tarifa_hora;

            const { error: execError } = await supabase
                .from('ejecuciones')
                .update({
                    fin: endTime.toISOString(),
                    horas_reales: durationHours,
                    costo_real: realCost
                })
                .eq('id', job.execution!.id);

            if (execError) throw execError;

            const { error: progError } = await supabase
                .from('programaciones')
                .update({ estado: 'FINALIZADO' })
                .eq('id', job.id);

            if (progError) throw progError;

            // Notify Technician
            if (job.tecnico_id) {
                await supabase.from('notificaciones').insert({
                    usuario_id: job.tecnico_id,
                    mensaje: `Operador ${profile?.nombre} finalizó labor en Suerte ${job.suertes.codigo}`
                });
            }

            toast.success('Labor finalizada exitosamente');
            setActiveJobId(null);
            fetchJobs();
        } catch (error: any) {
            console.error('Error finishing job:', error);
            toast.error(`Error: ${error.message || 'Error al finalizar labor'}`);
        }
    };

    const handleSignOut = async () => {
        await signOut();
        navigate('/login');
    };

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
            {activeJobId && (
                <div className="sticky top-[73px] z-10 animate-pulse bg-amber-500/10 px-4 py-3 backdrop-blur-md">
                    <div className="flex items-center justify-center gap-2 text-amber-400">
                        <Clock className="h-4 w-4" />
                        <span className="font-mono font-bold">{timer}</span>
                        <span className="text-xs uppercase tracking-wider">En Ejecución</span>
                    </div>
                </div>
            )}

            {/* Job List */}
            <main className="px-4 py-6 relative z-10">
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
                            const isActive = job.id === activeJobId;
                            const isOthersActive = activeJobId !== null && !isActive;

                            return (
                                <div
                                    key={job.id}
                                    className={`relative overflow-hidden rounded-xl border p-5 transition-all
                                        ${isActive
                                            ? 'border-purple-500/50 bg-purple-500/10 shadow-lg shadow-purple-900/20'
                                            : 'border-white/10 bg-white/5'
                                        }
                                        ${isOthersActive ? 'opacity-50 grayscale' : ''}
                                    `}
                                >
                                    {isActive && (
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
                                            <div className="text-sm text-white/90">
                                                {job.maquinaria?.nombre}
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <span className="text-xs text-white/40">Contratista</span>
                                            <div className="text-sm text-white/90">
                                                {job.contratistas?.nombre}
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <span className="text-xs text-white/40">Duración Est.</span>
                                            <div className="text-sm text-white/90">
                                                {job.horas_estimadas} hrs
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex gap-3">
                                        {(job.estado === 'PROGRAMADO' || job.estado === 'ASIGNADO') && (
                                            <button
                                                onClick={() => handleStartJob(job)}
                                                disabled={isOthersActive}
                                                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-green-600 to-green-500 py-3 font-bold text-white shadow-lg transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                                            >
                                                <Play className="h-5 w-5 fill-current" />
                                                INICIAR
                                            </button>
                                        )}

                                        {job.estado === 'EN_EJECUCION' && (
                                            <button
                                                onClick={() => handleFinishJob(job)}
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
        </div>
    );
}
