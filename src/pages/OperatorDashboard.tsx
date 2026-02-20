import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import {
    LogOut, ClipboardList, Play, MapPin, Clock, Tractor, Square,
    AlertTriangle, Truck, FileText, CheckCircle,
    Leaf, BarChart2
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import html2canvas from 'html2canvas';
import { Receipt } from '../components/Receipt';

// ─── Types ────────────────────────────────────────────────────────────────────

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
    suertes: { codigo: string; hacienda: string; zona: number; area_neta: number };
    labores: { nombre: string };
    maquinaria: { nombre: string; tarifa_hora: number };
    contratistas: { nombre: string };
    prioridades?: { nivel: number; asunto: string };
    tecnico?: { nombre: string };
    ejecuciones?: { recibo_url: string | null; firma_tecnico_url: string | null; horas_reales: number | null; costo_real: number | null; fin: string | null }[];
}

interface ActiveExecution {
    id: string;
    inicio: string;
    programacion_id?: string;
    tipo: 'LABOR' | 'TRASLADO' | 'EMERGENCIA';
    horometro_inicio?: number;
    lat_inicio?: number;
    lon_inicio?: number;
    maquinaria_id?: string;
    operador_id?: string;
}

type LaborKey = '1RA' | '2DA' | 'FER';

interface RoturacionAsignacion {
    id: string;
    roturacion_id: string;
    contratista_id: string;
    labor: LaborKey;
    area_asignada: number;
    fecha_asignacion: string | null;
    roturacion_seguimiento: {
        id: string;
        estado_1ra_labor: string;
        estado_2da_labor: string;
        estado_fertilizacion: string;
        area_avance_1ra: number;
        area_avance_2da: number;
        area_avance_fertilizacion: number;
        area_programada_1ra: number;
        area_programada_2da: number;
        area_programada_fer: number;
        suertes: { codigo: string; hacienda: string; area_neta: number; zona: number };
    };
}

interface ActiveRotExecution {
    id: string;
    asignacion_id: string;
    inicio: string;
    horometro_inicio: number;
    lat_inicio?: number;
    lon_inicio?: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const laborLabel: Record<LaborKey, string> = {
    '1RA': '1ª Roturación',
    '2DA': '2ª Roturación',
    'FER': 'Fertilización',
};

const estadoColor: Record<string, string> = {
    PENDIENTE: 'bg-gray-500/20 text-gray-400 border-gray-400/30',
    PROGRAMADO: 'bg-yellow-500/20 text-yellow-400 border-yellow-400/30',
    EN_EJECUCION: 'bg-emerald-500/20 text-emerald-400 border-emerald-400/30',
    PARCIAL: 'bg-blue-500/20 text-blue-400 border-blue-400/30',
    TERMINADO: 'bg-emerald-500/20 text-emerald-400 border-emerald-400/30',
};

const estadoField: Record<LaborKey, 'estado_1ra_labor' | 'estado_2da_labor' | 'estado_fertilizacion'> = {
    '1RA': 'estado_1ra_labor',
    '2DA': 'estado_2da_labor',
    'FER': 'estado_fertilizacion',
};

const avanceField: Record<LaborKey, 'area_avance_1ra' | 'area_avance_2da' | 'area_avance_fertilizacion'> = {
    '1RA': 'area_avance_1ra',
    '2DA': 'area_avance_2da',
    'FER': 'area_avance_fertilizacion',
};

const fmt = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 });

// ─── Component ────────────────────────────────────────────────────────────────

export default function OperatorDashboard() {
    const { profile, user, signOut } = useAuth();
    const navigate = useNavigate();

    // ── Tab state ──
    const [activeTab, setActiveTab] = useState<'labores' | 'roturacion' | 'historial'>('labores');

    // ── Maquinaria state ──
    const [jobs, setJobs] = useState<Job[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeExecution, setActiveExecution] = useState<ActiveExecution | null>(null);
    const [timer, setTimer] = useState<string>('00:00:00');
    const [showStartModal, setShowStartModal] = useState(false);
    const [showEndModal, setShowEndModal] = useState(false);
    const receiptRef = useRef<HTMLDivElement>(null);
    const [receiptData, setReceiptData] = useState<any>(null);
    const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
    const [executionType, setExecutionType] = useState<'LABOR' | 'TRASLADO' | 'EMERGENCIA'>('LABOR');
    const [horometro, setHorometro] = useState<string>('');
    const [gpsCoords, setGpsCoords] = useState<{ lat: number; lng: number } | null>(null);
    const [gettingGps, setGettingGps] = useState(false);
    const [historyJobs, setHistoryJobs] = useState<Job[]>([]);
    const [historyRotJobs, setHistoryRotJobs] = useState<RoturacionAsignacion[]>([]);

    // ── Roturacion state ──
    const [roturacionJobs, setRoturacionJobs] = useState<RoturacionAsignacion[]>([]);
    const [loadingRot, setLoadingRot] = useState(false);
    const [activeRotExec, setActiveRotExec] = useState<ActiveRotExecution | null>(null);
    const [rotTimer, setRotTimer] = useState<string>('00:00:00');
    const [showRotStartModal, setShowRotStartModal] = useState(false);
    const [showRotEndModal, setShowRotEndModal] = useState(false);
    const [selectedRotId, setSelectedRotId] = useState<string | null>(null);
    const [reportArea, setReportArea] = useState<string>('');

    // ── Effects ──
    useEffect(() => {
        if (!user?.id) return;
        fetchActiveExecutions();
    }, [user?.id]);

    useEffect(() => {
        if (profile?.rol !== 'operador') return;
        if (activeTab === 'labores') fetchJobs();
        else if (activeTab === 'historial') fetchHistory();
        else if (activeTab === 'roturacion') fetchRoturacion();
    }, [profile, activeTab]);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (activeExecution?.inicio) {
            interval = setInterval(() => {
                const diff = Date.now() - new Date(activeExecution.inicio).getTime();
                const h = Math.floor(diff / 3600000);
                const m = Math.floor((diff % 3600000) / 60000);
                const s = Math.floor((diff % 60000) / 1000);
                setTimer(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [activeExecution]);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (activeRotExec?.inicio) {
            interval = setInterval(() => {
                const diff = Date.now() - new Date(activeRotExec.inicio).getTime();
                const h = Math.floor(diff / 3600000);
                const m = Math.floor((diff % 3600000) / 60000);
                const s = Math.floor((diff % 60000) / 1000);
                setRotTimer(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [activeRotExec]);

    // ── Fetch functions ──

    const fetchActiveExecutions = async () => {
        if (!user?.id) return;
        try {
            // Check machinery
            const { data: machineryExec } = await supabase
                .from('ejecuciones')
                .select('*')
                .eq('operador_id', user.id)
                .is('fin', null)
                .order('inicio', { ascending: false })
                .limit(1)
                .maybeSingle();

            // Check roturacion
            const { data: rotExec } = await supabase
                .from('roturacion_ejecuciones')
                .select('*')
                .eq('operador_id', user.id)
                .is('fin', null)
                .order('inicio', { ascending: false })
                .limit(1)
                .maybeSingle();

            setActiveExecution(machineryExec);
            setActiveRotExec(rotExec);
        } catch (err) {
            console.error('Error fetching active executions:', err);
        }
    };

    const fetchJobs = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('programaciones')
                .select(`
                    *,
                    suertes (codigo, hacienda, zona, area_neta),
                    labores (nombre),
                    maquinaria (nombre, tarifa_hora),
                    contratistas (nombre),
                    prioridades (nivel, asunto),
                    tecnico:usuarios!programaciones_tecnico_id_fkey (nombre)
                `)
                .or('estado.eq.PROGRAMADO,estado.eq.ASIGNADO,estado.eq.EN_EJECUCION')
                .order('orden_ejecucion', { ascending: true });

            if (error) throw error;

            // Filter by empresa client-side (RLS handles server-side)
            const filtered = profile?.empresa
                ? (data || []).filter((j: any) => j.contratistas?.nombre === profile.empresa)
                : (data || []);

            setJobs(filtered);
        } catch (err: any) {
            toast.error(`Error: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const fetchHistory = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('programaciones')
                .select(`
                    *,
                    suertes (codigo, hacienda, zona, area_neta),
                    labores (nombre),
                    maquinaria (nombre, tarifa_hora),
                    contratistas (nombre),
                    ejecuciones (recibo_url, firma_tecnico_url, horas_reales, costo_real, fin)
                `)
                .eq('estado', 'FINALIZADO')
                .order('updated_at', { ascending: false })
                .limit(60);

            if (error) throw error;

            const filtered = profile?.empresa
                ? (data || []).filter((j: any) => j.contratistas?.nombre === profile.empresa)
                : (data || []);

            setHistoryJobs(filtered);

            // Fetch Roturación History
            let rotQuery = supabase
                .from('roturacion_asignaciones')
                .select(`
                    *,
                    roturacion_seguimiento (
                        id,
                        estado_1ra_labor,
                        estado_2da_labor,
                        estado_fertilizacion,
                        area_avance_1ra,
                        area_avance_2da,
                        area_avance_fertilizacion,
                        suertes (codigo, hacienda)
                    )
                `);

            if (profile?.rol === 'operador') {
                rotQuery = rotQuery.or(`contratista_id.eq.${profile.empresa},operador_id.eq.${user?.id}`);
            }

            const { data: rotData, error: rotErr } = await rotQuery;

            if (rotErr) throw rotErr;

            const finishedRot = (rotData || []).filter(asig => {
                const rs = asig.roturacion_seguimiento;
                const status = rs?.[estadoField[asig.labor as LaborKey]];
                return status === 'TERMINADO';
            });

            setHistoryRotJobs(finishedRot);

        } catch (err: any) {
            toast.error('Error cargando historial');
        } finally {
            setLoading(false);
        }
    };

    const fetchRoturacion = async () => {
        try {
            setLoadingRot(true);
            const { data, error } = await supabase
                .from('roturacion_asignaciones')
                .select(`
                    *,
                    roturacion_seguimiento (
                        id,
                        estado_1ra_labor,
                        estado_2da_labor,
                        estado_fertilizacion,
                        area_avance_1ra,
                        area_avance_2da,
                        area_avance_fertilizacion,
                        area_programada_1ra,
                        area_programada_2da,
                        area_programada_fer,
                        suertes (codigo, hacienda, area_neta, zona)
                    )
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;

            setRoturacionJobs(data || []);
        } catch (err: any) {
            toast.error('Error cargando asignaciones de roturación');
        } finally {
            setLoadingRot(false);
        }
    };

    // ── Roturacion Actions ──

    const openRotStartModal = (asigId: string) => {
        if (activeRotExec || activeExecution) { toast.error('Ya tienes una actividad en curso.'); return; }
        setSelectedRotId(asigId);
        setHorometro('');
        setGpsCoords(null);
        setShowRotStartModal(true);
        getGpsLocation();
    };

    const handleStartRotExecution = async () => {
        if (!horometro) { toast.error('Ingrese el Horómetro'); return; }
        if (!gpsCoords) { toast.error('Capture la ubicación GPS'); return; }
        if (!selectedRotId) return;

        try {
            const asig = roturacionJobs.find(a => a.id === selectedRotId);
            if (!asig) throw new Error('Asignación no encontrada');

            // 1. Insert execution
            const { data: newExec, error: execErr } = await supabase
                .from('roturacion_ejecuciones')
                .insert({
                    asignacion_id: selectedRotId,
                    operador_id: user?.id,
                    inicio: new Date().toISOString(),
                    horometro_inicio: parseFloat(horometro),
                    lat_inicio: gpsCoords.lat,
                    lon_inicio: gpsCoords.lng
                })
                .select()
                .single();

            if (execErr) throw execErr;

            // 2. Update global state in roturacion_seguimiento
            const rs = asig.roturacion_seguimiento;
            const { error: rsErr } = await supabase
                .from('roturacion_seguimiento')
                .update({ [estadoField[asig.labor]]: 'EN_EJECUCION' })
                .eq('id', rs.id);

            if (rsErr) throw rsErr;

            setActiveRotExec(newExec);
            setShowRotStartModal(false);
            toast.success('Labor de roturación iniciada');
            fetchRoturacion();
        } catch (err: any) {
            toast.error('Error al iniciar: ' + err.message);
        }
    };

    const openRotEndModal = () => {
        setHorometro('');
        setReportArea('');
        setGpsCoords(null);
        setShowRotEndModal(true);
        getGpsLocation();
    };

    const handleStopRotExecution = async () => {
        if (!horometro) { toast.error('Ingrese el Horómetro'); return; }
        if (!reportArea) { toast.error('Ingrese el Área trabajada'); return; }
        if (!gpsCoords) { toast.error('Capture la ubicación GPS'); return; }
        if (!activeRotExec) return;

        try {
            const asig = roturacionJobs.find(a => a.id === activeRotExec.asignacion_id);
            if (!asig) throw new Error('Asignación no encontrada');

            const area = parseFloat(reportArea);
            if (isNaN(area) || area < 0) { toast.error('Área inválida'); return; }

            // 1. Update execution
            const { error: execErr } = await supabase
                .from('roturacion_ejecuciones')
                .update({
                    fin: new Date().toISOString(),
                    horometro_fin: parseFloat(horometro),
                    lat_fin: gpsCoords.lat,
                    lon_fin: gpsCoords.lng,
                    area_trabajada: area
                })
                .eq('id', activeRotExec.id);

            if (execErr) throw execErr;

            // 2. Update global state in roturacion_seguimiento
            const rs = asig.roturacion_seguimiento;
            const currentAvance = rs[avanceField[asig.labor]] || 0;
            const newTotalAvance = currentAvance + area;

            // Lógica: Solo TERMINADO si llega al área asignada
            const newEstado = newTotalAvance >= asig.area_asignada ? 'TERMINADO' : 'PARCIAL';

            const { error: rsErr } = await supabase
                .from('roturacion_seguimiento')
                .update({
                    [estadoField[asig.labor]]: newEstado,
                    [avanceField[asig.labor]]: newTotalAvance
                })
                .eq('id', rs.id);

            if (rsErr) throw rsErr;

            setActiveRotExec(null);
            setShowRotEndModal(false);
            toast.success(newEstado === 'TERMINADO' ? '✅ Labor de roturación TERMINADA' : '🟠 Labor guardada como PARCIAL');
            fetchRoturacion();
        } catch (err: any) {
            toast.error('Error al finalizar: ' + err.message);
        }
    };

    // ── GPS ──
    const getGpsLocation = () => {
        setGettingGps(true);
        navigator.geolocation?.getCurrentPosition(
            pos => { setGpsCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setGettingGps(false); toast.success('Ubicación capturada'); },
            err => { console.error(err); toast.error('Error obteniendo GPS.'); setGettingGps(false); },
            { enableHighAccuracy: true, timeout: 15000 }
        ) ?? (() => { toast.error('GPS no soportado'); setGettingGps(false); })();
    };

    // ── Execution helpers ──
    const openStartModal = (type: 'LABOR' | 'TRASLADO' | 'EMERGENCIA', jobId: string | null = null) => {
        if (activeExecution || activeRotExec) { toast.error('Ya hay una actividad en ejecución.'); return; }
        setExecutionType(type); setSelectedJobId(jobId); setHorometro(''); setGpsCoords(null);
        setShowStartModal(true); getGpsLocation();
    };

    const openEndModal = () => { setHorometro(''); setGpsCoords(null); setShowEndModal(true); getGpsLocation(); };

    const sendWhatsApp = (type: 'START' | 'END', job: Job | undefined, execData: any, endData?: any, receiptUrl?: string) => {
        let message = '';
        const mapLink = `https://www.google.com/maps?q=${execData.lat_inicio || execData.lat_fin},${execData.lon_inicio || execData.lon_fin}`;
        if (type === 'START') {
            message = job
                ? `🚜 *INICIO DE LABOR*\n\n📍 *Suerte:* ${job.suertes.codigo}\n🚜 *Maquinaria:* ${job.maquinaria.nombre}\n👤 *Operador:* ${profile?.nombre}\n🕓 *Inicio:* ${new Date(execData.inicio).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}\n⏰ *Horómetro:* ${execData.horometro_inicio}\n📍 *Ubicación:* ${mapLink}`
                : `⚠️ *INICIO DE ${execData.tipo}*\n\n👤 *Operador:* ${profile?.nombre}\n🕓 *Inicio:* ${new Date(execData.inicio).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}\n⏰ *Horómetro:* ${execData.horometro_inicio}\n📍 *Ubicación:* ${mapLink}`;
        } else {
            const dur = ((new Date(execData.fin).getTime() - new Date(execData.inicio).getTime()) / 3600000).toFixed(2);
            message = `🧾 *REPORTE DE FINALIZACIÓN*\n\n`;
            if (job) {
                message += `🏭 *Empresa:* ${job.contratistas.nombre}\n📅 *Fecha:* ${new Date(execData.fin).toLocaleDateString('es-CO')}\n🚜 *Máquina:* ${job.maquinaria.nombre}\n👤 *Operador:* ${profile?.nombre}\n\n🕓 *Inicio:* ${new Date(execData.inicio).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}\n🏁 *Fin:* ${new Date(execData.fin).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}\n⏱️ *Total Horas:* ${dur}\n💵 *Costo Total:* ${fmt.format(endData?.costo_real || 0)}`;
            } else {
                message += `⚠️ *${execData.tipo}*\n👤 *Operador:* ${profile?.nombre}\n⏱️ *Duración:* ${dur} hrs`;
            }
            if (receiptUrl) message += `\n📄 *Ver Recibo:* ${receiptUrl}`;
        }
        window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
    };

    const handleStartExecution = async () => {
        if (!horometro) { toast.error('Ingrese el Horómetro'); return; }
        if (!gpsCoords) { toast.error('Capture la ubicación GPS'); return; }
        try {
            const job = selectedJobId ? jobs.find(j => j.id === selectedJobId) : undefined;
            const machineId = executionType === 'LABOR' && job ? job.maquinaria_id : jobs[0]?.maquinaria_id || null;
            const { data: newExec, error } = await supabase.from('ejecuciones').insert({
                programacion_id: selectedJobId, operador_id: user?.id, maquinaria_id: machineId,
                inicio: new Date().toISOString(), horometro_inicio: parseFloat(horometro),
                lat_inicio: gpsCoords.lat, lon_inicio: gpsCoords.lng, tipo: executionType
            }).select().single();
            if (error) throw error;
            if (executionType === 'LABOR' && selectedJobId) {
                await supabase.from('programaciones').update({ estado: 'EN_EJECUCION' }).eq('id', selectedJobId);
            }
            setActiveExecution(newExec); setShowStartModal(false);
            toast.success(`${executionType} iniciado`);
            fetchJobs();
            sendWhatsApp('START', job, newExec);
        } catch (err: any) { toast.error('Error al iniciar: ' + err.message); }
    };

    const handleStopExecution = async () => {
        if (!horometro) { toast.error('Ingrese el Horómetro'); return; }
        if (!gpsCoords) { toast.error('Capture la ubicación GPS'); return; }
        if (!activeExecution) return;
        try {
            const endTime = new Date();
            const durationHours = (endTime.getTime() - new Date(activeExecution.inicio).getTime()) / 3600000;
            const job = activeExecution.programacion_id ? jobs.find(j => j.id === activeExecution.programacion_id) : undefined;
            const realCost = activeExecution.tipo === 'LABOR' && job ? durationHours * job.tarifa_hora : 0;

            const rData = {
                empresa: job?.contratistas.nombre || 'N/A', fecha: endTime.toLocaleDateString('es-CO'),
                maquina: job?.maquinaria.nombre || 'N/A', operador: profile?.nombre || 'N/A',
                inicio: new Date(activeExecution.inicio).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }),
                fin: endTime.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }),
                totalHoras: durationHours.toFixed(2),
                tarifaHora: job?.tarifa_hora ? fmt.format(job.tarifa_hora) : undefined,
                costoTotal: fmt.format(realCost),
                costoPorHa: job?.suertes.area_neta ? fmt.format(realCost / job.suertes.area_neta) : undefined,
                tipo: activeExecution.tipo, horometroInicio: activeExecution.horometro_inicio || 0,
                horometroFin: parseFloat(horometro), aprobadoPor: job?.tecnico?.nombre
            };
            setReceiptData(rData);
            await new Promise(r => setTimeout(r, 500));

            let publicUrl = null;
            if (receiptRef.current) {
                const canvas = await html2canvas(receiptRef.current, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
                const blob = await new Promise<Blob | null>(r => canvas.toBlob(r, 'image/png'));
                if (blob) {
                    const fileName = `receipt_${activeExecution.id}_${Date.now()}.png`;
                    const { error: ul } = await supabase.storage.from('receipts').upload(fileName, blob);
                    if (!ul) { publicUrl = supabase.storage.from('receipts').getPublicUrl(fileName).data.publicUrl; }
                    else { toast.error('Error subiendo recibo.'); }
                }
            }

            const updatePayload = {
                fin: endTime.toISOString(), horometro_fin: parseFloat(horometro),
                lat_fin: gpsCoords.lat, lon_fin: gpsCoords.lng,
                horas_reales: durationHours, costo_real: realCost, recibo_url: publicUrl
            };
            const { error } = await supabase.from('ejecuciones').update(updatePayload).eq('id', activeExecution.id);
            if (error) throw error;
            if (activeExecution.tipo === 'LABOR' && activeExecution.programacion_id) {
                await supabase.from('programaciones').update({ estado: 'FINALIZADO' }).eq('id', activeExecution.programacion_id);
            }
            sendWhatsApp('END', job, { ...activeExecution, ...updatePayload }, updatePayload, publicUrl || undefined);
            setActiveExecution(null); setShowEndModal(false); setReceiptData(null);
            toast.success('Actividad finalizada');
            fetchJobs();
        } catch (err: any) { toast.error('Error al finalizar: ' + err.message); }
    };

    const handleSignOut = async () => { await signOut(); navigate('/login'); };

    if (loading && activeTab !== 'roturacion') return <div className="p-8 text-center text-white animate-pulse">Cargando...</div>;

    const activeJob = activeExecution?.programacion_id ? jobs.find(j => j.id === activeExecution.programacion_id) : null;
    const activeRotJob = activeRotExec ? roturacionJobs.find(a => a.id === activeRotExec.asignacion_id) : null;

    // ─────────────────────────────────────────────────────────────────────────
    // RENDER
    // ─────────────────────────────────────────────────────────────────────────
    return (
        <div className="relative min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 pb-28">
            {/* Background blobs */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-purple-500/20 blur-3xl" />
                <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-blue-500/20 blur-3xl" />
            </div>

            {/* Hidden Receipt */}
            {receiptData && (
                <div style={{ position: 'fixed', zIndex: 50, top: 0, left: 0, opacity: 0.01, pointerEvents: 'none' }}>
                    <Receipt ref={receiptRef} data={receiptData} />
                </div>
            )}

            {/* Header */}
            <header className="bg-black/30 border-b border-white/10 p-4 sticky top-0 z-20 backdrop-blur-md">
                <div className="flex items-center justify-between max-w-2xl mx-auto">
                    <div>
                        <h1 className="text-lg font-bold text-white">{profile?.empresa || profile?.nombre}</h1>
                        <p className="text-xs text-white/40">Contratista · {profile?.nombre}</p>
                    </div>
                    <button onClick={handleSignOut} className="rounded-full bg-white/10 p-2 text-white hover:bg-white/20">
                        <LogOut className="h-5 w-5" />
                    </button>
                </div>
            </header>

            {/* Active Execution Banner (Maquinaria) */}
            {activeExecution && (
                <div className="sticky top-[73px] z-10 bg-amber-500/10 px-4 py-4 backdrop-blur-md border-b border-amber-500/20">
                    <div className="flex items-center justify-between max-w-2xl mx-auto">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-emerald-500 rounded-xl animate-bounce"><Play size={20} fill="white" className="text-white" /></div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="font-mono font-bold text-xl text-amber-400">{timer}</span>
                                    <span className={`text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${activeExecution.tipo === 'EMERGENCIA' ? 'bg-red-500/20 text-red-400' : activeExecution.tipo === 'TRASLADO' ? 'bg-blue-500/20 text-blue-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                                        {activeExecution.tipo}
                                    </span>
                                </div>
                                {activeJob && <p className="text-xs text-white/50">Suerte {activeJob.suertes.codigo} · {activeJob.labores.nombre}</p>}
                            </div>
                        </div>
                        <button onClick={openEndModal} className="bg-red-500 hover:bg-red-600 text-white font-bold px-4 py-3 rounded-xl shadow-lg transition-all active:scale-95 flex items-center gap-2">
                            <Square size={18} fill="white" /> FINALIZAR
                        </button>
                    </div>
                </div>
            )}

            {/* Active Roturacion Banner */}
            {activeRotExec && (
                <div className="sticky top-[73px] z-10 bg-purple-500/10 px-4 py-4 backdrop-blur-md border-b border-purple-500/20">
                    <div className="flex items-center justify-between max-w-2xl mx-auto">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-purple-500 rounded-xl animate-bounce"><Leaf size={20} className="text-white" /></div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="font-mono font-bold text-xl text-purple-400">{rotTimer}</span>
                                    <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400">
                                        Roturación activa
                                    </span>
                                </div>
                                {activeRotJob && <p className="text-xs text-white/50">Suerte {activeRotJob.roturacion_seguimiento.suertes.codigo} · {laborLabel[activeRotJob.labor]}</p>}
                            </div>
                        </div>
                        <button onClick={openRotEndModal} className="bg-red-500 hover:bg-red-600 text-white font-bold px-4 py-3 rounded-xl shadow-lg transition-all active:scale-95 flex items-center gap-2">
                            <Square size={18} fill="white" /> FINALIZAR
                        </button>
                    </div>
                </div>
            )}

            {/* Quick Actions */}
            {!activeExecution && !activeRotExec && activeTab === 'labores' && (
                <div className="grid grid-cols-2 gap-4 px-4 mt-4 max-w-2xl mx-auto">
                    <button onClick={() => openStartModal('TRASLADO')} className="flex flex-col items-center justify-center gap-2 bg-blue-600/20 border border-blue-500/30 p-5 rounded-xl text-blue-200 hover:bg-blue-600/30 transition-all active:scale-95">
                        <Truck size={28} /><span className="font-bold text-sm">Registrar Traslado</span>
                    </button>
                    <button onClick={() => openStartModal('EMERGENCIA')} className="flex flex-col items-center justify-center gap-2 bg-red-600/20 border border-red-500/30 p-5 rounded-xl text-red-200 hover:bg-red-600/30 transition-all active:scale-95">
                        <AlertTriangle size={28} /><span className="font-bold text-sm">Reportar Emergencia</span>
                    </button>
                </div>
            )}

            {/* ── Main Content ── */}
            <main className="px-4 py-6 relative z-10 max-w-2xl mx-auto">

                {/* Tab Bar */}
                <div className="flex gap-1 mb-6 bg-black/30 rounded-2xl p-1 border border-white/10">
                    {[
                        { key: 'labores', label: 'Maquinaria', Icon: Tractor },
                        { key: 'roturacion', label: 'Roturación', Icon: Leaf },
                        { key: 'historial', label: 'Historial', Icon: BarChart2 },
                    ].map(({ key, label, Icon }) => (
                        <button
                            key={key}
                            onClick={() => setActiveTab(key as any)}
                            className={`flex-1 flex flex-col items-center gap-1 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === key ? 'bg-purple-500 text-white shadow-lg' : 'text-white/40 hover:text-white/60'}`}
                        >
                            <Icon size={18} />{label}
                        </button>
                    ))}
                </div>

                {/* ══════════════════════════════════════════ */}
                {/* TAB: MAQUINARIA (Labores activas)         */}
                {/* ══════════════════════════════════════════ */}
                {activeTab === 'labores' && (
                    loading ? (
                        <div className="flex justify-center py-8"><div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-purple-500" /></div>
                    ) : jobs.length === 0 ? (
                        <div className="mt-10 text-center">
                            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/5"><ClipboardList className="h-8 w-8 text-white/30" /></div>
                            <h3 className="text-lg font-medium text-white">No hay labores asignadas</h3>
                            <p className="mt-2 text-sm text-white/50">Todo está al día. ¡Buen trabajo!</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {jobs.map((job) => {
                                const isActiveJob = activeExecution?.programacion_id === job.id;
                                const isDisabled = (activeExecution !== null || activeRotExec !== null) && !isActiveJob;
                                return (
                                    <div key={job.id} className={`relative overflow-hidden rounded-xl border p-5 transition-all ${isActiveJob ? 'border-purple-500/50 bg-purple-500/10 shadow-lg shadow-purple-900/20' : 'border-white/10 bg-white/5'} ${isDisabled ? 'opacity-50 grayscale' : ''}`}>
                                        {isActiveJob && <div className="absolute right-0 top-0 rounded-bl-xl bg-purple-500 px-3 py-1 text-xs font-bold text-white">EN PROGRESO</div>}
                                        <div className="mb-4 flex items-start justify-between">
                                            <div>
                                                <div className="flex items-center gap-2 text-sm font-medium text-white/70"><MapPin className="h-4 w-4 text-purple-400" />{job.suertes?.hacienda}</div>
                                                <h3 className="mt-1 text-2xl font-bold text-white">Suerte {job.suertes?.codigo}</h3>
                                            </div>
                                            <div className="rounded-lg bg-white/5 px-3 py-2 text-center">
                                                <span className="block text-xs text-white/40">Zona</span>
                                                <span className="font-bold text-white">{job.suertes?.zona}</span>
                                            </div>
                                        </div>
                                        <div className="mb-4 grid grid-cols-2 gap-4">
                                            <div className="space-y-1"><span className="text-xs text-white/40">Labor</span><div className="flex items-center gap-2 text-sm text-white/90"><Tractor className="h-4 w-4 text-green-400" />{job.labores?.nombre}</div></div>
                                            <div className="space-y-1"><span className="text-xs text-white/40">Maquinaria</span><div className="text-sm text-white/90">{job.maquinaria?.nombre}</div></div>
                                            <div className="space-y-1"><span className="text-xs text-white/40">Duración Est.</span><div className="text-sm text-white/90">{job.horas_estimadas} hrs</div></div>
                                            {job.maquinaria?.tarifa_hora && (
                                                <div className="space-y-1"><span className="text-xs text-white/40">Costo Est.</span><div className="text-sm text-emerald-400 font-mono">{fmt.format(job.horas_estimadas * job.maquinaria.tarifa_hora)}</div></div>
                                            )}
                                        </div>
                                        <div className="flex gap-3">
                                            {(job.estado === 'PROGRAMADO' || job.estado === 'ASIGNADO') && (
                                                <button onClick={() => openStartModal('LABOR', job.id)} disabled={isDisabled} className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-green-600 to-green-500 py-3 font-bold text-white shadow-lg transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-50">
                                                    <Play className="h-5 w-5 fill-current" />INICIAR
                                                </button>
                                            )}
                                            {job.estado === 'EN_EJECUCION' && isActiveJob && (
                                                <button onClick={openEndModal} className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-red-600 to-red-500 py-3 font-bold text-white shadow-lg transition-all active:scale-95">
                                                    <Square className="h-5 w-5 fill-current" />FINALIZAR
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )
                )}

                {/* ══════════════════════════════════════════ */}
                {/* TAB: ROTURACIÓN                           */}
                {/* ══════════════════════════════════════════ */}
                {activeTab === 'roturacion' && (
                    loadingRot ? (
                        <div className="flex justify-center py-8"><div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-purple-500" /></div>
                    ) : roturacionJobs.length === 0 ? (
                        <div className="mt-10 text-center">
                            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/5"><Leaf className="h-8 w-8 text-white/30" /></div>
                            <h3 className="text-lg font-medium text-white">Sin asignaciones de roturación</h3>
                            <p className="mt-2 text-sm text-white/50">Aún no tienes labores asignadas en este módulo</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {roturacionJobs.map((asig) => {
                                const rs = asig.roturacion_seguimiento;
                                const s = rs?.suertes;
                                const currentEstado = rs?.[estadoField[asig.labor]] || 'PENDIENTE';
                                const currentAvance = rs?.[avanceField[asig.labor]] || 0;
                                const pct = asig.area_asignada > 0 ? Math.min(100, (currentAvance / asig.area_asignada) * 100) : 0;
                                const isTerminado = currentEstado === 'TERMINADO';
                                const isActive = activeRotExec?.asignacion_id === asig.id;
                                const isOtherActive = (activeExecution !== null || activeRotExec !== null) && !isActive;

                                return (
                                    <div key={asig.id} className={`rounded-xl border p-5 transition-all ${isActive ? 'border-purple-500/50 bg-purple-500/10' : isTerminado ? 'border-emerald-500/30 bg-emerald-900/10' : 'border-white/10 bg-white/5'} ${isOtherActive ? 'opacity-50 grayscale' : ''}`}>
                                        {/* Header */}
                                        <div className="flex items-start justify-between mb-3">
                                            <div>
                                                <p className="text-xs text-white/40 flex items-center gap-1"><MapPin size={12} />{s?.hacienda}</p>
                                                <h3 className="text-xl font-bold text-white">Suerte {s?.codigo}</h3>
                                            </div>
                                            <span className={`text-xs font-bold px-3 py-1 rounded-full border ${estadoColor[currentEstado] || estadoColor.PENDIENTE}`}>
                                                {currentEstado}
                                            </span>
                                        </div>

                                        {/* Labor badge */}
                                        <div className="flex items-center gap-2 mb-3">
                                            <span className="bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-bold px-3 py-1 rounded-full">
                                                {laborLabel[asig.labor]}
                                            </span>
                                        </div>

                                        {/* Progress */}
                                        <div className="mb-4">
                                            <div className="flex justify-between text-xs text-white/50 mb-1">
                                                <span>Avance: <span className="text-white font-bold">{currentAvance} ha</span></span>
                                                <span>Asignado: <span className="text-white font-bold">{asig.area_asignada} ha</span></span>
                                            </div>
                                            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full transition-all ${isTerminado ? 'bg-emerald-500' : 'bg-purple-500'}`}
                                                    style={{ width: `${pct}%` }}
                                                />
                                            </div>
                                            <p className="text-right text-xs text-white/40 mt-1">{pct.toFixed(0)}%</p>
                                        </div>

                                        {/* Action */}
                                        {!isTerminado && !isActive && (
                                            <button
                                                onClick={() => openRotStartModal(asig.id)}
                                                disabled={isOtherActive}
                                                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-green-600 to-green-500 text-white font-bold py-3 rounded-xl shadow-lg transition-all active:scale-95 disabled:opacity-50"
                                            >
                                                <Play size={18} fill="white" /> INICIAR
                                            </button>
                                        )}
                                        {isActive && (
                                            <button
                                                onClick={openRotEndModal}
                                                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-red-600 to-red-500 text-white font-bold py-3 rounded-xl shadow-lg transition-all active:scale-95"
                                            >
                                                <Square size={18} fill="white" /> FINALIZAR
                                            </button>
                                        )}
                                        {isTerminado && (
                                            <div className="flex items-center justify-center gap-2 text-emerald-400 text-sm font-bold py-2">
                                                <CheckCircle size={18} /> Labor Completada
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )
                )}

                {/* ══════════════════════════════════════════ */}
                {/* TAB: HISTORIAL                            */}
                {/* ══════════════════════════════════════════ */}
                {activeTab === 'historial' && (
                    loading ? (
                        <div className="flex justify-center py-8"><div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-purple-500" /></div>
                    ) : historyJobs.length === 0 && historyRotJobs.length === 0 ? (
                        <div className="mt-10 text-center">
                            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/5"><Clock className="h-8 w-8 text-white/30" /></div>
                            <h3 className="text-lg font-medium text-white">No hay historial aún</h3>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {/* Roturación History */}
                            {historyRotJobs.map((asig) => {
                                const rs = asig.roturacion_seguimiento;
                                return (
                                    <div key={asig.id} className="relative overflow-hidden rounded-xl border border-white/10 bg-white/5 p-5">
                                        <div className="absolute right-0 top-0 rounded-bl-xl bg-purple-500/20 text-purple-300 px-3 py-1 text-xs font-bold border-b border-l border-purple-500/30 flex items-center gap-1">
                                            <CheckCircle size={12} /> ROTURACIÓN
                                        </div>
                                        <div className="mb-3">
                                            <div className="flex items-center gap-2 text-sm text-white/60"><MapPin className="h-4 w-4 text-gray-400" />{rs?.suertes?.hacienda}</div>
                                            <h3 className="text-xl font-bold text-white">Suerte {rs?.suertes?.codigo}</h3>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                                            <div><span className="block text-xs text-white/40 uppercase mb-1">Labor</span><span className="text-white">{laborLabel[asig.labor]}</span></div>
                                            <div><span className="block text-xs text-white/40 uppercase mb-1">Área Total</span><span className="text-white">{asig.area_asignada} ha</span></div>
                                            <div><span className="block text-xs text-white/40 uppercase mb-1">Estado</span><span className="text-emerald-400 font-bold">TERMINADO</span></div>
                                        </div>
                                    </div>
                                );
                            })}

                            {/* Machinery History */}
                            {historyJobs.map((job) => {
                                const exec = job.ejecuciones?.[0];
                                const hasFirmado = !!exec?.firma_tecnico_url;
                                const hasRecibo = !!exec?.recibo_url;

                                return (
                                    <div key={job.id} className="relative overflow-hidden rounded-xl border border-white/10 bg-white/5 p-5">
                                        <div className="absolute right-0 top-0 rounded-bl-xl bg-emerald-500/20 text-emerald-300 px-3 py-1 text-xs font-bold border-b border-l border-emerald-500/30 flex items-center gap-1">
                                            <CheckCircle size={12} /> FINALIZADO
                                        </div>
                                        <div className="mb-3">
                                            <div className="flex items-center gap-2 text-sm text-white/60"><MapPin className="h-4 w-4 text-gray-400" />{job.suertes?.hacienda}</div>
                                            <h3 className="text-xl font-bold text-white">Suerte {job.suertes?.codigo}</h3>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                                            <div><span className="block text-xs text-white/40 uppercase mb-1">Labor</span><span className="text-white">{job.labores?.nombre}</span></div>
                                            <div><span className="block text-xs text-white/40 uppercase mb-1">Máquina</span><span className="text-white">{job.maquinaria?.nombre}</span></div>
                                            {exec?.horas_reales && (
                                                <div><span className="block text-xs text-white/40 uppercase mb-1">Horas Reales</span><span className="text-white">{Number(exec.horas_reales).toFixed(2)} hrs</span></div>
                                            )}
                                            {exec?.costo_real && (
                                                <div><span className="block text-xs text-white/40 uppercase mb-1">Costo Real</span><span className="text-emerald-400 font-mono">{fmt.format(exec.costo_real)}</span></div>
                                            )}
                                            {exec?.fin && (
                                                <div className="col-span-2"><span className="block text-xs text-white/40 uppercase mb-1">Fecha</span><span className="text-white">{new Date(exec.fin).toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' })}</span></div>
                                            )}
                                        </div>

                                        {/* Recibos */}
                                        <div className="flex flex-wrap gap-2 pt-3 border-t border-white/10">
                                            {hasRecibo && (
                                                <a href={exec!.recibo_url!} target="_blank" rel="noopener noreferrer"
                                                    className="flex items-center gap-2 bg-blue-500/20 border border-blue-500/30 text-blue-300 hover:bg-blue-500/40 px-3 py-2 rounded-lg text-sm font-bold transition-all">
                                                    <FileText size={16} /> Ver Recibo
                                                </a>
                                            )}
                                            {hasFirmado && (
                                                <a href={exec!.firma_tecnico_url!} target="_blank" rel="noopener noreferrer"
                                                    className="flex items-center gap-2 bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/40 px-3 py-2 rounded-lg text-sm font-bold transition-all">
                                                    <CheckCircle size={16} /> Recibo Firmado
                                                </a>
                                            )}
                                            {!hasRecibo && !hasFirmado && (
                                                <span className="text-xs text-white/30 italic">Sin recibos disponibles</span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )
                )}
            </main>

            {/* ══════════════════════════════════════════ */}
            {/* MODAL: Inicio / Fin de Ejecución (Maq)   */}
            {/* ══════════════════════════════════════════ */}
            {(showStartModal || showEndModal) && (
                <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
                    <div className="bg-slate-900 w-full max-w-md rounded-3xl p-6 border border-white/10 shadow-2xl">
                        <h2 className="text-2xl font-bold text-white mb-6 text-center">
                            {showStartModal ? `Iniciar ${executionType === 'LABOR' ? 'Labor' : executionType}` : 'Finalizar Actividad'}
                        </h2>
                        <div className="space-y-6">
                            <div>
                                <label className="block text-white/60 text-sm font-bold mb-2 ml-1">HORÓMETRO {showStartModal ? 'INICIAL' : 'FINAL'}</label>
                                <div className="relative">
                                    <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={20} />
                                    <input type="number" inputMode="decimal" step="0.1" value={horometro} onChange={e => setHorometro(e.target.value)}
                                        className="w-full bg-white/5 border border-white/20 rounded-xl py-4 pl-12 pr-4 text-white text-xl font-bold focus:outline-none focus:border-purple-500 transition-all"
                                        placeholder="0000.0" />
                                </div>
                            </div>
                            <div className="bg-white/5 rounded-xl p-4 border border-white/10 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${gpsCoords ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}><MapPin size={24} /></div>
                                    <div>
                                        <p className="text-white font-bold text-sm">Ubicación GPS</p>
                                        <p className="text-xs text-white/40">{gettingGps ? 'Obteniendo...' : gpsCoords ? `${gpsCoords.lat.toFixed(5)}, ${gpsCoords.lng.toFixed(5)}` : 'Requerida'}</p>
                                    </div>
                                </div>
                                {!gpsCoords && !gettingGps && <button onClick={getGpsLocation} className="text-xs bg-white/10 px-3 py-1 rounded-full text-white hover:bg-white/20">Reintentar</button>}
                                {gettingGps && <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/20 border-t-purple-500" />}
                            </div>
                            <div className="grid grid-cols-2 gap-4 pt-2">
                                <button onClick={() => { setShowStartModal(false); setShowEndModal(false); }} className="py-4 rounded-xl border border-white/10 text-white/60 font-bold hover:bg-white/5 transition-all">Cancelar</button>
                                <button onClick={showStartModal ? handleStartExecution : handleStopExecution} disabled={!horometro || !gpsCoords}
                                    className={`py-4 rounded-xl font-bold text-white shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95 ${(!horometro || !gpsCoords) ? 'bg-gray-600 opacity-50 cursor-not-allowed' : showStartModal ? 'bg-gradient-to-r from-green-600 to-green-500' : 'bg-gradient-to-r from-red-600 to-red-500'}`}>
                                    {showStartModal ? <Play size={20} className="fill-current" /> : <Square size={20} className="fill-current" />}
                                    {showStartModal ? 'INICIAR' : 'FINALIZAR'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ══════════════════════════════════════════ */}
            {/* MODAL: Inicio / Fin Roturación             */}
            {/* ══════════════════════════════════════════ */}
            {(showRotStartModal || showRotEndModal) && (
                <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
                    <div className="bg-slate-900 w-full max-w-md rounded-3xl p-6 border border-white/10 shadow-2xl">
                        <h2 className="text-2xl font-bold text-white mb-6 text-center">
                            {showRotStartModal ? 'Iniciar Roturación' : 'Finalizar Roturación'}
                        </h2>
                        <div className="space-y-6">
                            {/* Horómetro */}
                            <div>
                                <label className="block text-white/60 text-sm font-bold mb-2 ml-1">HORÓMETRO {showRotStartModal ? 'INICIAL' : 'FINAL'}</label>
                                <div className="relative">
                                    <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={20} />
                                    <input type="number" inputMode="decimal" step="0.1" value={horometro} onChange={e => setHorometro(e.target.value)}
                                        className="w-full bg-white/5 border border-white/20 rounded-xl py-4 pl-12 pr-4 text-white text-xl font-bold focus:outline-none focus:border-purple-500 transition-all"
                                        placeholder="0000.0" />
                                </div>
                            </div>

                            {/* Área (solo al finalizar) */}
                            {showRotEndModal && (
                                <div>
                                    <label className="block text-white/60 text-sm font-bold mb-2 ml-1">ÁREA TOTAL TRABAJADA (ha)</label>
                                    <div className="relative">
                                        <Leaf className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={20} />
                                        <input type="number" inputMode="decimal" step="0.01" value={reportArea} onChange={e => setReportArea(e.target.value)}
                                            className="w-full bg-white/5 border border-white/20 rounded-xl py-4 pl-12 pr-4 text-white text-xl font-bold focus:outline-none focus:border-purple-500 transition-all"
                                            placeholder="0.00" />
                                    </div>
                                    {activeRotJob && <p className="text-xs text-white/30 mt-1 ml-1">Asignado: {activeRotJob.area_asignada} ha</p>}
                                </div>
                            )}

                            {/* GPS */}
                            <div className="bg-white/5 rounded-xl p-4 border border-white/10 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${gpsCoords ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}><MapPin size={24} /></div>
                                    <div>
                                        <p className="text-white font-bold text-sm">Ubicación GPS</p>
                                        <p className="text-xs text-white/40">{gettingGps ? 'Obteniendo...' : gpsCoords ? `${gpsCoords.lat.toFixed(5)}, ${gpsCoords.lng.toFixed(5)}` : 'Requerida'}</p>
                                    </div>
                                </div>
                                {!gpsCoords && !gettingGps && <button onClick={getGpsLocation} className="text-xs bg-white/10 px-3 py-1 rounded-full text-white hover:bg-white/20">Reintentar</button>}
                            </div>

                            {/* Actions */}
                            <div className="grid grid-cols-2 gap-4 pt-2">
                                <button onClick={() => { setShowRotStartModal(false); setShowRotEndModal(false); }} className="py-4 rounded-xl border border-white/10 text-white/60 font-bold hover:bg-white/5 transition-all">Cancelar</button>
                                <button onClick={showRotStartModal ? handleStartRotExecution : handleStopRotExecution} disabled={!horometro || !gpsCoords || (showRotEndModal && !reportArea)}
                                    className={`py-4 rounded-xl font-bold text-white shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95 ${(!horometro || !gpsCoords || (showRotEndModal && !reportArea)) ? 'bg-gray-600 opacity-50 cursor-not-allowed' : 'bg-gradient-to-r from-purple-600 to-purple-500'}`}>
                                    {showRotStartModal ? <Play size={20} fill="white" /> : <Square size={20} fill="white" />}
                                    {showRotStartModal ? 'INICIAR' : 'TERMINAR'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
