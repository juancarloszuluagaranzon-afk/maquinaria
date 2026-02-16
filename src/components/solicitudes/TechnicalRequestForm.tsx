import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { GlassInput } from '../ui/GlassInput';
import { GlassTextarea } from '../ui/GlassTextarea';
import { GlassSelect } from '../ui/GlassSelect';
import { GlassCombobox } from '../ui/GlassCombobox';
import { GlassToast } from '../ui/GlassToast';
import { Clock, Send, CheckCircle2, Loader2, Info, MessageCircle, Home } from 'lucide-react';

interface Labor { id: string; nombre: string; }
interface Actividad { id: string; nombre: string; codigo: number; }
interface Prioridad { id: string; nivel: number; asunto: string; }
interface Maquinaria { id: string; nombre: string; tarifa_hora: number; }

export function TechnicalRequestForm() {
    const { user } = useAuth();
    const navigate = useNavigate();

    // Data lists
    const [labores, setLabores] = useState<Labor[]>([]);
    const [actividades, setActividades] = useState<Actividad[]>([]);
    const [prioridades, setPrioridades] = useState<Prioridad[]>([]);
    const [maquinariaList, setMaquinariaList] = useState<Maquinaria[]>([]);
    const [actividadLabores, setActividadLabores] = useState<{ actividad_id: string; labor_id: string }[]>([]);

    // User Context
    const [userZone, setUserZone] = useState<number | null>(null);
    const [userContextLoading, setUserContextLoading] = useState(true);

    // Form State
    const [selectedSuerte, setSelectedSuerte] = useState<any>(null);
    const [selectedLabor, setSelectedLabor] = useState('');
    const [selectedActividad, setSelectedActividad] = useState('');
    const [selectedPrioridad, setSelectedPrioridad] = useState('');
    const [selectedMaquinaria, setSelectedMaquinaria] = useState('');
    const [horasEstimadas, setHorasEstimadas] = useState('');
    const [observaciones, setObservaciones] = useState('');
    const [filteredLabors, setFilteredLabors] = useState<Labor[]>([]);

    // UI
    const [submitting, setSubmitting] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const [isSuccess, setIsSuccess] = useState(false);
    const [createdRequestId, setCreatedRequestId] = useState<string | null>(null);

    // 1. Fetch User Context (Zone) & Catalogs
    useEffect(() => {
        const init = async () => {
            if (!user) return;
            setUserContextLoading(true);
            try {
                // Get User Zone & Assigned Haciendas
                const { data: userData, error: userError } = await supabase
                    .from('usuarios')
                    .select('zona, hacienda_asignada')
                    .eq('id', user.id)
                    .single();

                if (userError) {
                    console.error('Error fetching user profile:', userError);
                } else {
                    setUserZone(userData?.zona);
                    // Store hacienda_asignada in a ref or state if needed, 
                    // or just use it directly in the query below if we moved the catalogs fetch here.
                    // But catalogs are fetched in parallel. 
                    // Let's optimize: Fetch catalogs AFTER we know the user context to apply filters immediately if possible.
                    // For now, I'll update the GlassCombobox to filter CLIENT-SIDE or updated the Suerte Fetch logic.
                    // Wait, GlassCombobox fetches suertes internally? 
                    // Let's check GlassCombobox. If it fetches, we need to pass filters.
                }

                // Get Catalogs
                const [labRes, actRes, priRes, maqRes, relRes] = await Promise.all([
                    supabase.from('labores').select('id, nombre'),
                    supabase.from('actividades').select('id, nombre, codigo'),
                    supabase.from('prioridades').select('id, nivel, asunto').order('nivel', { ascending: true }), // Sorted by level ascending for dropdown
                    supabase.from('maquinaria').select('id, nombre, tarifa_hora'),
                    supabase.from('actividad_labores').select('actividad_id, labor_id')
                ]);

                if (labRes.error) throw labRes.error;
                if (actRes.error) throw actRes.error;
                if (priRes.error) throw priRes.error;
                if (maqRes.error) throw maqRes.error;
                if (relRes.error) throw relRes.error;

                setLabores(labRes.data || []);
                setActividades(actRes.data || []);
                setPrioridades(priRes.data || []);
                setMaquinariaList(maqRes.data || []);
                setActividadLabores(relRes.data || []);

            } catch (err) {
                console.error("Initialization error:", err);
                setToast({ message: "Error cargando configuración inicial.", type: 'error' });
            } finally {
                setUserContextLoading(false);
            }
        };

        init();
    }, [user]);

    // Filter Labors when Activity changes
    useEffect(() => {
        if (!selectedActividad) {
            setFilteredLabors([]);
            setSelectedLabor('');
            return;
        }

        // Filter based on Many-to-Many relationship (Activity -> Labors)
        const allowedLaborIds = new Set(
            actividadLabores
                .filter(rel => rel.actividad_id === selectedActividad)
                .map(rel => rel.labor_id)
        );

        setFilteredLabors(labores.filter(l => allowedLaborIds.has(l.id)));
        setSelectedLabor(''); // Reset Labor
    }, [selectedActividad, labores, actividadLabores]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedSuerte || !selectedLabor || !selectedActividad || !selectedPrioridad || !horasEstimadas) {
            setToast({ message: 'Todos los campos marcados son obligatorios.', type: 'error' });
            return;
        }

        setSubmitting(true);
        try {
            const { data, error } = await supabase
                .from('programaciones')
                .insert({
                    tecnico_id: user?.id,
                    suerte_id: selectedSuerte.id,
                    labor_id: selectedLabor,
                    actividad_id: selectedActividad,
                    prioridad_id: selectedPrioridad,
                    maquinaria_id: selectedMaquinaria || null,
                    horas_estimadas: parseFloat(horasEstimadas),
                    observaciones: observaciones,
                    estado: 'PENDIENTE_APROBACION',
                    fecha_programada: new Date().toISOString().split('T')[0],
                    created_at: new Date().toISOString()
                })
                .select();

            if (error) throw error;

            if (data && data.length > 0) {
                setCreatedRequestId(data[0].id);
                setIsSuccess(true);
            }

        } catch (err: any) {
            console.error('Error submitting:', err);
            setToast({ message: `Error: ${err.message}`, type: 'error' });
        } finally {
            setSubmitting(false);
        }
    };

    const handleNotifyBoss = () => {
        if (!createdRequestId || !selectedSuerte) return;

        const baseUrl = window.location.origin;
        const approvalUrl = `${baseUrl}/aprobaciones?id=${createdRequestId}`;

        const machine = maquinariaList.find(m => m.id === selectedMaquinaria);
        const machineName = machine?.nombre || "No especificada";

        let costInfo = "";
        if (machine && horasEstimadas) {
            const cost = parseFloat(horasEstimadas) * machine.tarifa_hora;
            const formattedCost = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(cost);
            costInfo = `💰 *Costo Est.:* ${formattedCost}\n`;
        }

        const message = `👋 Hola Jefe, he creado una nueva solicitud de maquinaria.\n\n` +
            `📍 *Hacienda:* ${selectedSuerte.hacienda} (Suerte ${selectedSuerte.codigo})\n` +
            `🛠 *Labor:* ${labores.find(l => l.id === selectedLabor)?.nombre}\n` +
            `🚜 *Maquinaria:* ${machineName}\n` +
            costInfo +
            `⚠️ *Prioridad:* ${prioridades.find(p => p.id === selectedPrioridad)?.asunto}\n\n` +
            `Por favor revísela y apruébela aquí: \n${approvalUrl}`;

        window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
    };

    if (userContextLoading) {
        return <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-brand-liquid" size={32} /></div>;
    }

    if (isSuccess) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-center animate-in zoom-in-50 duration-500">
                <div className="w-24 h-24 bg-emerald-500/20 rounded-full flex items-center justify-center mb-6 ring-4 ring-emerald-500/10">
                    <CheckCircle2 size={48} className="text-emerald-400" />
                </div>

                <h2 className="text-3xl font-bold text-white mb-2">¡Solicitud Creada!</h2>
                <p className="text-white/60 mb-8 max-w-md">
                    La labor ha sido programada correctamente. Ahora notifica a tu jefe de zona para agilizar la aprobación.
                </p>

                <div className="flex flex-col w-full max-w-sm gap-4">
                    <button
                        onClick={handleNotifyBoss}
                        className="flex items-center justify-center gap-3 w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold transition-all shadow-lg hover:shadow-emerald-500/20 active:scale-95"
                    >
                        <MessageCircle size={24} />
                        Notificar por WhatsApp
                    </button>

                    <button
                        onClick={() => navigate('/')}
                        className="flex items-center justify-center gap-2 w-full py-3 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white rounded-xl font-medium transition-all"
                    >
                        <Home size={20} />
                        Volver al Inicio
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="relative">
            {toast && <GlassToast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            <form onSubmit={handleSubmit} className="space-y-8 animate-in fade-in duration-500">

                {/* Information Banner */}
                {userZone !== null && (
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-brand-liquid/10 border border-brand-liquid/20 text-brand-liquid-light text-sm mb-6">
                        <Info size={16} />
                        <span>Perfil Técnico activo: Mostrando suertes de <strong>Zona {userZone}</strong></span>
                    </div>
                )}

                {/* Step A: Ubicación */}
                <section className="space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-6 h-6 rounded-full bg-brand-liquid/20 flex items-center justify-center text-xs font-bold text-brand-liquid border border-brand-liquid/30">A</div>
                        <h3 className="text-lg font-semibold text-white/90">Ubicación (Sector-Suerte)</h3>
                    </div>
                    <GlassCombobox
                        label="Suerte"
                        onSelect={setSelectedSuerte}
                        error={!selectedSuerte && submitting ? "Requerido" : undefined}
                        filters={userZone ? {
                            zona: userZone,
                            // Pass hacienda_asignada if available
                            ...(user?.hacienda_asignada && user.hacienda_asignada.length > 0 ? { hacienda: user.hacienda_asignada } : {})
                        } : undefined}
                    />
                </section>

                {/* Step B: Actividad Requerida */}
                <section className="space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-6 h-6 rounded-full bg-brand-liquid/20 flex items-center justify-center text-xs font-bold text-brand-liquid border border-brand-liquid/30">B</div>
                        <h3 className="text-lg font-semibold text-white/90">Actividad Requerida</h3>
                    </div>
                    <GlassSelect
                        label="Actividad"
                        placeholder="Seleccione actividad..."
                        options={actividades.map(a => ({ value: a.id, label: `${a.codigo} - ${a.nombre}` }))}
                        value={selectedActividad}
                        onChange={(e) => {
                            setSelectedActividad(e.target.value);
                            setSelectedLabor(''); // Reset Labor when Activity changes
                        }}
                        error={!selectedActividad && submitting ? "Requerido" : undefined}
                    />
                </section>

                {/* Step C: Labor Requerida */}
                <section className="space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-6 h-6 rounded-full bg-brand-liquid/20 flex items-center justify-center text-xs font-bold text-brand-liquid border border-brand-liquid/30">C</div>
                        <h3 className="text-lg font-semibold text-white/90">Labor Requerida</h3>
                    </div>
                    <GlassSelect
                        label="Labor"
                        placeholder={selectedActividad ? "Seleccione labor..." : "Primero seleccione actividad"}
                        options={filteredLabors.map(l => ({ value: l.id, label: l.nombre }))}
                        value={selectedLabor}
                        onChange={(e) => setSelectedLabor(e.target.value)}
                        disabled={!selectedActividad}
                        error={!selectedLabor && submitting ? "Requerido" : undefined}
                    />
                </section>

                {/* Step D: Maquinaria Sugerida */}
                <section className="space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-6 h-6 rounded-full bg-brand-liquid/20 flex items-center justify-center text-xs font-bold text-brand-liquid border border-brand-liquid/30">D</div>
                        <h3 className="text-lg font-semibold text-white/90">Maquinaria Sugerida (Opcional)</h3>
                    </div>
                    <GlassSelect
                        label="Equipo"
                        placeholder="Sugerir maquinaria..."
                        options={maquinariaList.map(m => ({ value: m.id, label: m.nombre }))}
                        value={selectedMaquinaria}
                        onChange={(e) => setSelectedMaquinaria(e.target.value)}
                    />
                </section>

                {/* Step E: Prioridad */}
                <section className="space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-6 h-6 rounded-full bg-brand-liquid/20 flex items-center justify-center text-xs font-bold text-brand-liquid border border-brand-liquid/30">E</div>
                        <h3 className="text-lg font-semibold text-white/90">Prioridad</h3>
                    </div>
                    <GlassSelect
                        label="Nivel de Prioridad"
                        placeholder="Seleccione prioridad..."
                        options={prioridades.map(p => ({ value: p.id, label: `${p.nivel} - ${p.asunto}` }))}
                        value={selectedPrioridad}
                        onChange={(e) => setSelectedPrioridad(e.target.value)}
                        error={!selectedPrioridad && submitting ? "Requerido" : undefined}
                    />
                </section>

                {/* Step F: Tiempo Estimado */}
                <section className="space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-6 h-6 rounded-full bg-brand-liquid/20 flex items-center justify-center text-xs font-bold text-brand-liquid border border-brand-liquid/30">F</div>
                        <h3 className="text-lg font-semibold text-white/90">Tiempo Estimado</h3>
                    </div>
                    <GlassInput
                        type="number"
                        label="Horas"
                        placeholder="0.0"
                        step="0.5"
                        min="0"
                        value={horasEstimadas}
                        onChange={(e) => setHorasEstimadas(e.target.value)}
                        icon={<Clock size={16} />}
                        error={!horasEstimadas && submitting ? "Requerido" : undefined}
                    />
                </section>

                {/* Step G: Observaciones */}
                <section className="space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-6 h-6 rounded-full bg-brand-liquid/20 flex items-center justify-center text-xs font-bold text-brand-liquid border border-brand-liquid/30">G</div>
                        <h3 className="text-lg font-semibold text-white/90">Observaciones</h3>
                    </div>
                    <GlassTextarea
                        label="Detalles Adicionales"
                        placeholder="Condiciones de terreno, accesos, etc."
                        value={observaciones}
                        onChange={(e) => setObservaciones(e.target.value)}
                        className="h-32"
                    />
                </section>

                <div className="pt-6 border-t border-white/10 flex justify-between items-center">
                    <button
                        type="button"
                        onClick={() => {
                            // Reset form
                            setSelectedSuerte(null);
                            setSelectedLabor('');
                            setSelectedActividad('');
                            setSelectedPrioridad('');
                            setSelectedMaquinaria('');
                            setHorasEstimadas('');
                            setObservaciones('');
                        }}
                        className="text-sm text-white/40 hover:text-white transition-colors"
                    >
                        Limpiar Formulario
                    </button>

                    <button
                        type="submit"
                        disabled={submitting}
                        className={`
                            flex items-center gap-2 px-8 py-4 rounded-xl font-bold text-white shadow-lg shadow-brand-liquid/20
                            transition-all duration-300 hover:scale-[1.02] active:scale-95
                            ${submitting
                                ? 'bg-slate-700 cursor-not-allowed opacity-70'
                                : 'bg-gradient-to-r from-blue-600 to-brand-liquid hover:shadow-brand-liquid/40'}
                        `}
                    >
                        {submitting ? <Loader2 className="animate-spin" /> : <Send size={20} />}
                        Solicitar Maquinaria
                    </button>
                </div>
            </form>
        </div>
    );
}
