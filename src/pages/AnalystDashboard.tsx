import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { GlassCard } from '../components/ui/GlassCard';
import { GlassSelect } from '../components/ui/GlassSelect';
import { GlassToast } from '../components/ui/GlassToast';
import { MapPin, Tractor, Calendar, User, MessageCircle, AlertCircle } from 'lucide-react';

// ... interfaces ...

export default function AnalystDashboard() {
    const { } = useAuth();
    const [requests, setRequests] = useState<Request[]>([]);
    const [contractors, setContractors] = useState<Contractor[]>([]);
    const [machinery, setMachinery] = useState<Machinery[]>([]);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    // State for assignments (keyed by request ID)
    const [assignments, setAssignments] = useState<{ [key: string]: { contractorId: string; machineryId: string } }>({});

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [reqRes, contRes, maqRes] = await Promise.all([
                supabase
                    .from('programaciones')
                    .select(`
                        *,
                        suertes (codigo, hacienda, area_neta),
                        labores (nombre),
                        actividades (nombre),
                        prioridades (nivel, asunto),
                        usuarios (nombre)
                    `)
                    .or('estado.eq.APROBADO_ZONA,estado.eq.ASIGNADO') // Show approved and already assigned
                    .order('created_at', { ascending: false }),
                supabase.from('contratistas').select('*'),
                supabase.from('maquinaria').select('*')
            ]);

            if (reqRes.error) throw reqRes.error;
            if (contRes.error) throw contRes.error;
            if (maqRes.error) throw maqRes.error;

            setRequests(reqRes.data || []);
            setContractors(contRes.data || []);
            setMachinery(maqRes.data || []);

            // Initialize assignments state
            const initialAssignments: any = {};
            reqRes.data?.forEach((r: any) => {
                if (r.contratista_id || r.maquinaria_id) {
                    initialAssignments[r.id] = {
                        contractorId: r.contratista_id || '',
                        machineryId: r.maquinaria_id || ''
                    };
                }
            });
            setAssignments(initialAssignments);

        } catch (error) {
            console.error('Error fetching data:', error);
            setToast({ message: 'Error cargando datos', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleAssignmentChange = (reqId: string, field: 'contractorId' | 'machineryId', value: string) => {
        setAssignments(prev => ({
            ...prev,
            [reqId]: {
                ...prev[reqId],
                [field]: value
            }
        }));
    };

    const saveAssignment = async (req: Request) => {
        const assignment = assignments[req.id];
        if (!assignment?.contractorId || !assignment?.machineryId) {
            setToast({ message: 'Seleccione contratista y maquinaria', type: 'error' });
            return;
        }

        try {
            const { error } = await supabase
                .from('programaciones')
                .update({
                    contratista_id: assignment.contractorId,
                    maquinaria_id: assignment.machineryId,
                    estado: 'ASIGNADO', // Update status
                    updated_at: new Date().toISOString()
                })
                .eq('id', req.id);

            if (error) throw error;

            setToast({ message: 'Asignación guardada', type: 'success' });

            // GENERATE WHATSAPP LINK
            const contractor = contractors.find(c => c.id === assignment.contractorId);
            const machine = machinery.find(m => m.id === assignment.machineryId);

            // Construct message
            const message = `*Nueva Asignación Riopaila* 🚜\n\n` +
                `Hola *${contractor?.nombre}*,\n` +
                `Se le ha asignado la siguiente labor:\n\n` +
                `📍 *Hacienda:* ${req.suertes.hacienda} (Suerte ${req.suertes.codigo})\n` +
                `🛠 *Labor:* ${req.labores.nombre} - ${req.actividades.nombre}\n` +
                `🚜 *Máquina:* ${machine?.nombre}\n` +
                `⏱ *Horas Est.:* ${req.horas_estimadas}\n` +
                `🚨 *Prioridad:* ${req.prioridades.asunto}\n\n` +
                `Por favor confirmar recibido.`;

            const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;

            // Open in new tab
            window.open(whatsappUrl, '_blank');

            // Refresh list (optional, or update local state)
            fetchData();

        } catch (error) {
            console.error('Error saving assignment:', error);
            setToast({ message: 'Error al guardar', type: 'error' });
        }
    };

    // Filter machinery logic removed as unused for now

    if (loading) return <div className="p-8 text-center text-white">Cargando tablero...</div>;

    return (
        <div className="space-y-6 pb-20">
            <header>
                <h1 className="text-3xl font-bold text-white tracking-tight">Programación Analista</h1>
                <p className="text-white/60">Gestión de recursos y contratistas</p>
            </header>

            {toast && <GlassToast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            <div className="grid gap-6">
                {requests.map(req => {
                    const assign = assignments[req.id] || {};
                    const relevantMachinery = assign.contractorId
                        ? machinery.filter(m => m.contratista_id === assign.contractorId)
                        : machinery; // Or empty if strictly enforcing hierarchy

                    return (
                        <GlassCard key={req.id} className="p-6">
                            <div className="flex flex-col lg:flex-row gap-6">
                                {/* Request Info */}
                                <div className="flex-1 space-y-4">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <div className="flex items-center gap-2 text-emerald-400 mb-1">
                                                <MapPin size={18} />
                                                <span className="font-bold text-lg">{req.suertes.codigo}</span>
                                                <span className="text-white/60">({req.suertes.hacienda})</span>
                                            </div>
                                            <h3 className="text-xl font-medium text-white">{req.labores.nombre}</h3>
                                            <p className="text-white/70">{req.actividades.nombre}</p>
                                        </div>
                                        <div className={`px-3 py-1 rounded-full text-xs font-bold border ${req.estado === 'ASIGNADO' ? 'text-blue-400 border-blue-400/30 bg-blue-400/10' : 'text-yellow-400 border-yellow-400/30 bg-yellow-400/10'}`}>
                                            {req.estado}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 text-sm text-white/60">
                                        <div className="flex items-center gap-2">
                                            <User size={14} />
                                            <span>Solicita: {req.usuarios?.nombre}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Calendar size={14} />
                                            <span>{new Date(req.created_at).toLocaleDateString()}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <AlertCircle size={14} />
                                            <span>{req.prioridades.asunto}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-mono bg-white/10 px-2 rounded">Est: {req.horas_estimadas}h</span>
                                        </div>
                                    </div>

                                    {/* Costos Dinámicos */}
                                    {assign.machineryId && (() => {
                                        const selectedMachine = machinery.find(m => m.id === assign.machineryId);
                                        const rate = selectedMachine?.tarifa_hora || 0;
                                        if (rate === 0) return null;

                                        const total = req.horas_estimadas * rate;
                                        const perHa = total / (req.suertes.area_neta || 1);

                                        return (
                                            <div className="flex items-center gap-3 pt-4 border-t border-white/10">
                                                <div className="bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded text-xs text-emerald-400 font-mono">
                                                    <span className="text-white/40 mr-1">Total:</span>
                                                    {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(total)}
                                                </div>
                                                <div className="bg-blue-500/10 border border-blue-500/20 px-2 py-1 rounded text-xs text-blue-400 font-mono">
                                                    <span className="text-white/40 mr-1">$/Ha:</span>
                                                    {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(perHa)}
                                                </div>
                                            </div>
                                        );
                                    })()}
                                </div>

                                {/* Assignment Section */}
                                <div className="w-full lg:w-1/3 space-y-4 bg-white/5 p-4 rounded-xl border border-white/5">
                                    <h4 className="text-sm font-semibold text-white/80 mb-2 flex items-center gap-2">
                                        <Tractor size={16} /> Asignación de Recursos
                                    </h4>

                                    <GlassSelect
                                        label="Contratista"
                                        placeholder="Seleccione..."
                                        options={contractors.map(c => ({ value: c.id, label: c.nombre }))}
                                        value={assign.contractorId || ''}
                                        onChange={(e) => handleAssignmentChange(req.id, 'contractorId', e.target.value)}
                                        className="text-sm"
                                    />

                                    <GlassSelect
                                        label="Maquinaria"
                                        placeholder={assign.contractorId ? "Seleccione máquina..." : "Seleccione contratista primero"}
                                        options={relevantMachinery.map(m => ({ value: m.id, label: m.nombre }))}
                                        value={assign.machineryId || ''}
                                        onChange={(e) => handleAssignmentChange(req.id, 'machineryId', e.target.value)}
                                        disabled={!assign.contractorId}
                                        className="text-sm"
                                    />

                                    <button
                                        onClick={() => saveAssignment(req)}
                                        className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium transition-colors shadow-lg shadow-emerald-900/20 active:scale-95"
                                    >
                                        <MessageCircle size={18} />
                                        <span>Guardar y Notificar</span>
                                    </button>
                                </div>
                            </div>
                        </GlassCard>
                    );
                })}

                {requests.length === 0 && (
                    <div className="text-center py-20 bg-white/5 rounded-2xl border border-white/10">
                        <p className="text-white/60">No hay solicitudes aprobadas pendientes de asignación.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
