import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { X, Truck, Save, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { RoturacionData } from './RoturacionRow';

interface AssignmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    data: RoturacionData | null;
    onSuccess: () => void;
}

interface Contractor {
    id: string;
    nombre: string;
}

interface Assignment {
    contratista_id: string;
    area: string;
}

export default function AssignmentModal({ isOpen, onClose, data, onSuccess }: AssignmentModalProps) {
    const [loading, setLoading] = useState(false);
    const [selectedLabor, setSelectedLabor] = useState<'1RA' | '2DA' | 'FER'>('1RA');
    const [contractors, setContractors] = useState<Contractor[]>([]);
    const [assignments, setAssignments] = useState<Assignment[]>([{ contratista_id: '', area: '' }]);

    useEffect(() => {
        if (isOpen) {
            loadContractors();
            // Default labor selection logic could go here
            if (data) {
                if (data.estado_1ra_labor === 'PROGRAMADO') setSelectedLabor('1RA');
                else if (data.estado_2da_labor === 'PROGRAMADO') setSelectedLabor('2DA');
                else if (data.estado_fertilizacion === 'PROGRAMADO') setSelectedLabor('FER');
            }
            setAssignments([{ contratista_id: '', area: data?.area_neta?.toString() || '' }]);
        }
    }, [isOpen, data]);

    const loadContractors = async () => {
        const allowedContractors = [
            'AGROPECAM APOYO PARA EL CAMPO S.A.S.',
            'BIENES Y MAQUINARIA SAS',
            'Riopaila Castilla',
            'SERVI AGRICOLAS DIAGO S.A.S.',
            'SERVICIOS AGROMECANICOS DE OCCIDENTES S.A.S.'
        ];

        const { data } = await supabase
            .from('contratistas')
            .select('id, nombre')
            .in('nombre', allowedContractors)
            .order('nombre');

        if (data) setContractors(data);
    };

    const handleAddAssignment = () => {
        setAssignments([...assignments, { contratista_id: '', area: '' }]);
    };

    const handleRemoveAssignment = (index: number) => {
        const newAssignments = [...assignments];
        newAssignments.splice(index, 1);
        setAssignments(newAssignments);
    };

    const handleAssignmentChange = (index: number, field: keyof Assignment, value: string) => {
        const newAssignments = [...assignments];
        newAssignments[index] = { ...newAssignments[index], [field]: value };
        setAssignments(newAssignments);
    };

    const handleSave = async () => {
        if (!data) return;

        // Validation
        const validAssignments = assignments.filter(a => a.contratista_id && parseFloat(a.area) > 0);
        if (validAssignments.length === 0) {
            toast.error('Debe asignar al menos un contratista con área válida');
            return;
        }

        const totalArea = validAssignments.reduce((sum, a) => sum + parseFloat(a.area), 0);
        if (totalArea > (data.area_neta || 0) + 0.1) { // Small buffer for float math
            toast.error(`El área total asignada (${totalArea.toFixed(2)}) excede el área de la suerte (${data.area_neta})`);
            return;
        }

        setLoading(true);
        try {
            const user = (await supabase.auth.getUser()).data.user;

            const records = validAssignments.map(a => ({
                roturacion_id: data.id,
                contratista_id: a.contratista_id,
                labor: selectedLabor,
                area_asignada: parseFloat(a.area),
                created_by: user?.id
            }));

            const { error } = await supabase
                .from('roturacion_asignaciones')
                .insert(records);

            if (error) throw error;

            // Update Labor Status to ASIGNADO
            const statusField =
                selectedLabor === '1RA' ? 'estado_1ra_labor' :
                    selectedLabor === '2DA' ? 'estado_2da_labor' :
                        'estado_fertilizacion';

            const { error: updateError } = await supabase
                .from('roturacion_seguimiento')
                .update({ [statusField]: 'PENDIENTE' })
                .eq('id', data.id);

            if (updateError) throw updateError;

            toast.success('Asignación guardada correctamente');

            // --- WhatsApp Notification Logic ---
            validAssignments.forEach(a => {
                const contractor = contractors.find(c => c.id === a.contratista_id);
                const laborName = getLaborLabel(selectedLabor);

                const message = `*Nueva Asignación de Roturación Riopaila* 🚜\n\n` +
                    `Hola *${contractor?.nombre}*,\n` +
                    `Se le ha asignado la siguiente labor:\n\n` +
                    `📍 *Hacienda:* ${data.hacienda} (Suerte ${data.suerte_codigo})\n` +
                    `🛠 *Labor:* ${laborName}\n` +
                    `📐 *Área:* ${a.area} ha\n\n` +
                    `Por favor confirmar recibido.`;

                const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
                window.open(whatsappUrl, '_blank');
            });
            // ------------------------------------

            onSuccess();
            onClose();

        } catch (error) {
            console.error('Error saving assignments:', error);
            toast.error('Error al guardar asignaciones');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const getLaborLabel = (labor: string) => {
        switch (labor) {
            case '1RA': return '1ra Roturación';
            case '2DA': return '2da Roturación';
            case 'FER': return 'Fertilización';
            default: return labor;
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-[#1a1a1a] rounded-2xl w-full max-w-2xl border border-white/10 shadow-2xl overflow-hidden">

                {/* Header */}
                <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
                    <div>
                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                            <Truck className="text-blue-500" />
                            Asignar Contratistas
                        </h3>
                        {data && (
                            <p className="text-white/50 text-sm mt-1">
                                Suerte: <span className="text-emerald-400 font-mono">{data.suerte_codigo}</span> |
                                Área Total: <span className="text-white">{data.area_neta} ha</span>
                            </p>
                        )}
                    </div>
                    <button onClick={onClose} className="text-white/50 hover:text-white transition-colors">
                        <X size={24} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">

                    {/* Labor Selector */}
                    <div className="flex gap-2 bg-black/40 p-1 rounded-xl border border-white/10">
                        {['1RA', '2DA', 'FER'].map((labor) => {
                            const isActive = selectedLabor === labor;
                            // Check if this labor is actually programmed for this row
                            let isProgrammed = false;
                            if (data) {
                                if (labor === '1RA' && data.estado_1ra_labor === 'PROGRAMADO') isProgrammed = true;
                                if (labor === '2DA' && data.estado_2da_labor === 'PROGRAMADO') isProgrammed = true;
                                if (labor === 'FER' && data.estado_fertilizacion === 'PROGRAMADO') isProgrammed = true;
                            }

                            // Area sugerida según la labor
                            const laborArea =
                                labor === '1RA' ? (data?.area_programada_1ra ?? data?.area_neta) :
                                    labor === '2DA' ? (data?.area_programada_2da ?? data?.area_neta) :
                                        (data?.area_programada_fer ?? data?.area_neta);

                            return (
                                <button
                                    key={labor}
                                    onClick={() => {
                                        setSelectedLabor(labor as '1RA' | '2DA' | 'FER');
                                        // Resetear assignments — cada labor es independiente
                                        setAssignments([{ contratista_id: '', area: laborArea?.toString() || '' }]);
                                    }}
                                    className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${isActive
                                        ? 'bg-blue-500 text-white shadow-lg'
                                        : 'text-white/50 hover:text-white hover:bg-white/5'
                                        } ${!isProgrammed ? 'opacity-50' : ''}`}
                                >
                                    {getLaborLabel(labor)}
                                    {!isProgrammed && <span className="ml-1 text-[10px] opacity-50">(N/A)</span>}
                                </button>
                            );
                        })}
                    </div>

                    {/* Assignments List */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <label className="text-sm font-bold text-white/70 uppercase">Contratistas Asignados</label>
                            <button
                                onClick={handleAddAssignment}
                                className="text-xs flex items-center gap-1 text-emerald-400 hover:text-emerald-300 transition-colors"
                            >
                                <Plus size={14} /> Agregar otro
                            </button>
                        </div>

                        {assignments.map((assignment, index) => (
                            <div key={index} className="flex gap-4 items-start bg-white/5 p-3 rounded-xl border border-white/10 animate-in fade-in slide-in-from-bottom-2">
                                <div className="flex-1">
                                    <label className="text-xs text-white/50 mb-1 block">Contratista</label>
                                    <select
                                        value={assignment.contratista_id}
                                        onChange={(e) => handleAssignmentChange(index, 'contratista_id', e.target.value)}
                                        className="w-full bg-black/20 border border-white/10 rounded-lg p-2.5 text-white focus:border-blue-500/50 outline-none"
                                    >
                                        <option value="">Seleccionar...</option>
                                        {contractors.map(c => (
                                            <option key={c.id} value={c.id}>{c.nombre}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="w-32">
                                    <label className="text-xs text-white/50 mb-1 block">Área (ha)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={assignment.area}
                                        onChange={(e) => handleAssignmentChange(index, 'area', e.target.value)}
                                        className="w-full bg-black/20 border border-white/10 rounded-lg p-2.5 text-white focus:border-blue-500/50 outline-none text-right"
                                    />
                                </div>
                                {assignments.length > 1 && (
                                    <button
                                        onClick={() => handleRemoveAssignment(index)}
                                        className="mt-6 p-2 text-white/30 hover:text-red-400 transition-colors"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Summary */}
                    <div className="bg-blue-500/10 rounded-xl p-4 border border-blue-500/20 flex justify-between items-center">
                        <span className="text-blue-200 text-sm">Total Asignado:</span>
                        <span className={`text-xl font-mono font-bold ${assignments.reduce((sum, a) => sum + (parseFloat(a.area) || 0), 0) > (data?.area_neta || 0)
                            ? 'text-red-400'
                            : 'text-blue-400'
                            }`}>
                            {assignments.reduce((sum, a) => sum + (parseFloat(a.area) || 0), 0).toFixed(2)} / {data?.area_neta} ha
                        </span>
                    </div>

                </div>

                {/* Footer */}
                <div className="p-6 border-t border-white/10 flex justify-end gap-3 bg-black/20">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-white/70 hover:text-white transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={loading}
                        className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl flex items-center gap-2 font-medium shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-105 active:scale-95"
                    >
                        {loading ? <div className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full" /> : <Save size={18} />}
                        Guardar Asignación
                    </button>
                </div>

            </div>
        </div>
    );
}
