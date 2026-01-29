import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { GlassInput } from '../ui/GlassInput';
import { GlassTextarea } from '../ui/GlassTextarea';
import { GlassSelect } from '../ui/GlassSelect';
import { GlassCombobox } from '../ui/GlassCombobox';
import { GlassToast } from '../ui/GlassToast';
import { Clock, Send, CheckCircle2, Loader2 } from 'lucide-react';

interface Labor {
    id: string;
    nombre: string;
}

interface Actividad {
    id: string;
    nombre: string;
    labor_id: string;
}

interface Prioridad {
    id: string;
    nivel: number;
    asunto: string;
}

export function MachineryRequestForm() {
    const { user } = useAuth();
    const navigate = useNavigate();

    // Data lists
    const [labores, setLabores] = useState<Labor[]>([]);
    const [actividades, setActividades] = useState<Actividad[]>([]);
    const [prioridades, setPrioridades] = useState<Prioridad[]>([]);

    // Filtered lists
    const [filteredActividades, setFilteredActividades] = useState<Actividad[]>([]);

    // Form State
    const [selectedSuerte, setSelectedSuerte] = useState<any>(null);
    const [selectedLabor, setSelectedLabor] = useState('');
    const [selectedActividad, setSelectedActividad] = useState('');
    const [selectedPrioridad, setSelectedPrioridad] = useState('');
    const [horasEstimadas, setHorasEstimadas] = useState('');
    const [observaciones, setObservaciones] = useState('');

    // UI State
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    // Initial Data Fetch
    useEffect(() => {
        const fetchCatalogs = async () => {
            setLoading(true);
            try {
                const [labRes, actRes, priRes] = await Promise.all([
                    supabase.from('labores').select('id, nombre'),
                    supabase.from('actividades').select('id, nombre, labor_id'),
                    supabase.from('prioridades').select('id, nivel, asunto').order('nivel', { ascending: false })
                ]);

                if (labRes.error) throw labRes.error;
                if (actRes.error) throw actRes.error;
                if (priRes.error) throw priRes.error;

                setLabores(labRes.data || []);
                setActividades(actRes.data || []);
                setPrioridades(priRes.data || []);
            } catch (err) {
                console.error('Error fetching catalogs:', err);
                setToast({ message: 'Error cargando datos del formulario.', type: 'error' });
            } finally {
                setLoading(false);
            }
        };

        fetchCatalogs();
    }, []);

    // Filter Activities when Labor changes
    useEffect(() => {
        if (!selectedLabor) {
            setFilteredActividades([]);
            setSelectedActividad('');
            return;
        }
        const filtered = actividades.filter(a => a.labor_id === selectedLabor);
        setFilteredActividades(filtered);
        setSelectedActividad(''); // Reset activity selection
    }, [selectedLabor, actividades]);

    if (loading) {
        return (
            <div className="flex justify-center p-12">
                <Loader2 className="animate-spin text-brand-liquid" size={32} />
            </div>
        );
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Basic Validation
        if (!selectedSuerte || !selectedLabor || !selectedActividad || !selectedPrioridad || !horasEstimadas) {
            setToast({ message: 'Por favor complete todos los campos obligatorios.', type: 'error' });
            return;
        }

        setSubmitting(true);
        try {
            const { error } = await supabase
                .from('programaciones')
                .insert({
                    tecnico_id: user?.id,
                    suerte_id: selectedSuerte.id,
                    labor_id: selectedLabor,
                    actividad_id: selectedActividad,
                    prioridad_id: selectedPrioridad,
                    horas_estimadas: parseFloat(horasEstimadas),
                    observaciones: observaciones,
                    estado: 'PENDIENTE_APROBACION',
                    created_at: new Date().toISOString()
                });

            if (error) throw error;

            setToast({ message: 'Solicitud creada exitosamente. Redirigiendo...', type: 'success' });

            // Redirect after 1.5s
            setTimeout(() => {
                navigate('/');
            }, 1500);

        } catch (err: any) {
            console.error('Error submitting request:', err);
            setToast({ message: `Error al crear solicitud: ${err.message}`, type: 'error' });
            setSubmitting(false);
        }
    };

    return (
        <div className="relative">
            {toast && (
                <GlassToast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(null)}
                />
            )}

            <form onSubmit={handleSubmit} className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

                {/* 1. Selección de Suerte */}
                <section className="space-y-4">
                    <h3 className="text-lg font-semibold text-white/90 border-b border-white/10 pb-2">
                        1. Ubicación
                    </h3>
                    <GlassCombobox
                        label="Seleccionar Suerte (Código o Hacienda)"
                        onSelect={setSelectedSuerte}
                        error={!selectedSuerte && submitting ? "Requerido" : undefined}
                    />
                </section>

                {/* 2. Labor y Actividad */}
                <section className="space-y-4">
                    <h3 className="text-lg font-semibold text-white/90 border-b border-white/10 pb-2">
                        2. Detalle de Labor
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <GlassSelect
                            label="Labor"
                            placeholder="Seleccione una labor..."
                            options={labores.map(l => ({ value: l.id, label: l.nombre }))}
                            value={selectedLabor}
                            onChange={(e) => setSelectedLabor(e.target.value)}
                            error={!selectedLabor && submitting ? "Requerido" : undefined}
                        />
                        <GlassSelect
                            label="Actividad"
                            placeholder={selectedLabor ? "Seleccione una actividad..." : "Primero seleccione una labor"}
                            options={filteredActividades.map(a => ({ value: a.id, label: a.nombre }))}
                            value={selectedActividad}
                            onChange={(e) => setSelectedActividad(e.target.value)}
                            disabled={!selectedLabor}
                            error={!selectedActividad && submitting ? "Requerido" : undefined}
                        />
                    </div>
                </section>

                {/* 3. Prioridad */}
                <section className="space-y-4">
                    <h3 className="text-lg font-semibold text-white/90 border-b border-white/10 pb-2">
                        3. Prioridad
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {prioridades.map((p) => {
                            const isSelected = selectedPrioridad === p.id;
                            let colorClass = "border-white/10 bg-white/5 hover:bg-white/10"; // Default
                            if (p.nivel >= 8) colorClass = isSelected ? "border-red-500 bg-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.3)]" : "border-red-500/30 hover:border-red-500/60 transition-colors";
                            else if (p.nivel >= 5) colorClass = isSelected ? "border-amber-500 bg-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.3)]" : "border-amber-500/30 hover:border-amber-500/60 transition-colors";
                            else colorClass = isSelected ? "border-emerald-500 bg-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.3)]" : "border-emerald-500/30 hover:border-emerald-500/60 transition-colors";

                            return (
                                <div
                                    key={p.id}
                                    onClick={() => setSelectedPrioridad(p.id)}
                                    className={`
                                        cursor-pointer rounded-xl border p-4 transition-all duration-300 relative overflow-hidden group
                                        ${colorClass}
                                        ${isSelected ? 'scale-[1.02]' : ''}
                                    `}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <span className={`text-xs font-bold px-2 py-0.5 rounded ${isSelected ? 'bg-white/20' : 'bg-white/5'} text-white`}>
                                            Nivel {p.nivel}
                                        </span>
                                        {isSelected && <CheckCircle2 size={16} className="text-white" />}
                                    </div>
                                    <p className="text-white font-medium text-sm">{p.asunto}</p>

                                    {/* Glass sheen effect */}
                                    <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/5 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                                </div>
                            );
                        })}
                    </div>
                </section>

                {/* 4. Estimación y Observaciones */}
                <section className="space-y-4">
                    <h3 className="text-lg font-semibold text-white/90 border-b border-white/10 pb-2">
                        4. Detalles Finales
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="md:col-span-1">
                            <GlassInput
                                type="number"
                                label="Horas Estimadas"
                                placeholder="0.0"
                                step="0.5"
                                min="0"
                                value={horasEstimadas}
                                onChange={(e) => setHorasEstimadas(e.target.value)}
                                icon={<Clock size={16} />}
                                error={!horasEstimadas && submitting ? "Requerido" : undefined}
                            />
                        </div>
                        <div className="md:col-span-2">
                            <GlassTextarea
                                label="Observaciones"
                                placeholder="Detalles adicionales sobre el terreno o requerimientos especiales..."
                                value={observaciones}
                                onChange={(e) => setObservaciones(e.target.value)}
                            />
                        </div>
                    </div>
                </section>

                {/* Actions */}
                <div className="pt-6 flex justify-end gap-4">
                    <button
                        type="button"
                        onClick={() => navigate('/')}
                        className="px-6 py-3 rounded-xl text-white/60 hover:text-white hover:bg-white/5 transition-colors"
                        disabled={submitting}
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        disabled={submitting}
                        className={`
                            flex items-center gap-2 px-8 py-3 rounded-xl font-bold text-white shadow-lg shadow-brand-liquid/20
                            transition-all duration-300 hover:scale-[1.02]
                            ${submitting
                                ? 'bg-slate-700 cursor-not-allowed opacity-70'
                                : 'bg-gradient-to-r from-blue-600 to-brand-liquid hover:shadow-brand-liquid/40'}
                        `}
                    >
                        {submitting ? (
                            <>
                                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Guardando...
                            </>
                        ) : (
                            <>
                                <Send size={18} />
                                Crear Solicitud
                            </>
                        )}
                    </button>
                </div>

            </form>
        </div>
    );
}
