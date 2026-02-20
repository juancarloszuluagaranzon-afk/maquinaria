import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { X, Save, Search, Calendar, MapPin, Ruler } from 'lucide-react';
import toast from 'react-hot-toast';

interface ProgrammingModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

interface Suerte {
    id: string;
    codigo: string;
    hacienda: string;
    area_neta: number;
    zona: number;
}

export default function ProgrammingModal({ isOpen, onClose, onSuccess }: ProgrammingModalProps) {
    const [suertes, setSuertes] = useState<Suerte[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedSuerte, setSelectedSuerte] = useState<Suerte | null>(null);
    const [loading, setLoading] = useState(false);

    // Form Data
    const [date1, setDate1] = useState('');
    const [condition1, setCondition1] = useState<'FRIABLE' | 'HUMEDO' | ''>('');
    const [area1, setArea1] = useState<string>('');

    const [date2, setDate2] = useState('');
    const [condition2, setCondition2] = useState<'FRIABLE' | 'HUMEDO' | ''>('');
    const [area2, setArea2] = useState<string>('');

    const [dateFer, setDateFer] = useState('');
    const [conditionFer, setConditionFer] = useState<'FRIABLE' | 'HUMEDO' | ''>('');
    const [areaFer, setAreaFer] = useState<string>('');


    useEffect(() => {
        if (isOpen) {
            // Reset
            setSearchTerm('');
            setSelectedSuerte(null);
            setDate1('');
            setCondition1('');
            setArea1('');
            setDate2('');
            setCondition2('');
            setArea2('');
            setDateFer('');
            setConditionFer('');
            setAreaFer('');
            loadSuertes();
        }
    }, [isOpen]);

    // Auto-fill area when suerte is selected
    useEffect(() => {
        if (selectedSuerte) {
            const areaStr = selectedSuerte.area_neta.toString();
            setArea1(areaStr);
            setArea2(areaStr);
            setAreaFer(areaStr);
        }
    }, [selectedSuerte]);

    const loadSuertes = async () => {
        // Load initial batch or all? Suertes can be many. Let's load top 50 or search.
        // For now, load simple list.

        const { data, error } = await supabase
            .from('suertes')
            .select('id, codigo, hacienda, area_neta, zona')
            .limit(50);

        if (!error && data) {
            setSuertes(data);
        }

    };

    const handleSearch = async (term: string) => {
        setSearchTerm(term);
        if (term.length < 2) return;


        const { data, error } = await supabase
            .from('suertes')
            .select('id, codigo, hacienda, area_neta, zona')
            .ilike('codigo', `%${term}%`)
            .limit(20);

        if (!error && data) {
            setSuertes(data);
        }

    };

    const handleSave = async () => {
        if (!selectedSuerte) {
            toast.error('Debe seleccionar una suerte');
            return;
        }

        // At least one labor must be configured
        if (!date1 && !date2 && !dateFer) {
            toast.error('Debe programar al menos una labor');
            return;
        }

        setLoading(true);
        try {
            // Use RPC function to avoid PostgREST schema cache issues with new columns
            const { data, error } = await supabase.rpc('programar_roturacion', {
                p_suerte_id: selectedSuerte.id,
                p_fecha_1ra: date1 || null,
                p_condicion_1ra: condition1 || null,
                p_fecha_2da: date2 || null,
                p_condicion_2da: condition2 || null,
                p_fecha_fer: dateFer || null,
                p_condicion_fer: conditionFer || null,
            });

            if (error) throw error;

            // The RPC returns { success: bool, error?: string }
            if (data && !data.success) {
                throw new Error(data.error || 'Error desconocido en la función');
            }

            toast.success('Programación guardada exitosamente');
            onSuccess();
            onClose();

        } catch (error: any) {
            console.error('Save error:', error);
            let msg = error.message || 'Error al guardar';
            toast.error(`Error: ${msg}`);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-[#1a1f2e]/90 border border-white/10 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
                    <div>
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <Calendar className="text-emerald-400" />
                            Programar Roturación
                        </h2>
                        <p className="text-white/50 text-sm mt-1">Asigna fecha y condiciones para las labores</p>
                    </div>
                    <button onClick={onClose} className="text-white/50 hover:text-white transition-colors">
                        <X size={24} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto space-y-6 custom-scrollbar">

                    {/* Suerte Selection */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-white/70 block">Buscar Suerte</label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" size={18} />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => handleSearch(e.target.value)}
                                placeholder="Escribe el código de la suerte (ej. 101)..."
                                className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-emerald-500/50 transition-colors"
                            />
                        </div>

                        {/* Results Dropdown (Simplified as a list if searching or just selecting) */}
                        {!selectedSuerte && suertes.length > 0 && (
                            <div className="mt-2 bg-black/60 border border-white/10 rounded-xl max-h-48 overflow-y-auto">
                                {suertes.map(s => (
                                    <div
                                        key={s.id}
                                        onClick={() => {
                                            setSelectedSuerte(s);
                                            setSearchTerm(s.codigo);
                                        }}
                                        className="p-3 hover:bg-white/10 cursor-pointer flex justify-between items-center transition-colors border-b border-white/5 last:border-0"
                                    >
                                        <div className="flex items-center gap-3">
                                            <MapPin size={16} className="text-emerald-500/70" />
                                            <div>
                                                <div className="text-white font-medium">{s.codigo}</div>
                                                <div className="text-xs text-white/50">{s.hacienda} • Zona {s.zona}</div>
                                            </div>
                                        </div>
                                        <div className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded">
                                            {s.area_neta} ha
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Selected Suerte Details */}
                    {selectedSuerte && (
                        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 flex items-center gap-4">
                            <div className="p-3 bg-emerald-500/20 rounded-full text-emerald-400">
                                <Ruler size={24} />
                            </div>
                            <div>
                                <h3 className="text-emerald-400 font-bold text-lg">{selectedSuerte.codigo}</h3>
                                <p className="text-emerald-200/70 text-sm">
                                    Area Neta: <span className="text-white font-mono">{selectedSuerte.area_neta} ha</span>
                                </p>
                            </div>
                            <button
                                onClick={() => { setSelectedSuerte(null); setSearchTerm(''); }}
                                className="ml-auto text-xs text-white/50 hover:text-white underline"
                            >
                                Cambiar
                            </button>
                        </div>
                    )}

                    {/* Programming Form - Only visible if Suerte selected */}
                    {selectedSuerte && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

                            {/* 1ra Labor */}
                            <div className="bg-white/5 rounded-xl p-5 border border-white/10">
                                <h4 className="text-white font-bold mb-4 flex items-center gap-2">
                                    <span className="w-6 h-6 rounded-full bg-emerald-500 text-black flex items-center justify-center text-xs font-bold">1</span>
                                    1ra Roturación
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    <div>
                                        <label className="text-xs text-white/50 mb-1 block">Fecha Programada</label>
                                        <input
                                            type="date"
                                            value={date1}
                                            onChange={e => setDate1(e.target.value)}
                                            className="w-full bg-black/20 border border-white/10 rounded-lg p-2.5 text-white focus:border-emerald-500/50 outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs text-white/50 mb-1 block">Área a Trabajar (ha)</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={area1}
                                            onChange={e => setArea1(e.target.value)}
                                            className="w-full bg-black/20 border border-white/10 rounded-lg p-2.5 text-white focus:border-emerald-500/50 outline-none"
                                        />
                                    </div>
                                    <div className="md:col-span-2 lg:col-span-1">
                                        <label className="text-xs text-white/50 mb-1 block">Estado Terreno</label>
                                        <div className="grid grid-cols-2 gap-2">
                                            <button
                                                onClick={() => setCondition1('FRIABLE')}
                                                className={`p-2.5 rounded-lg text-sm border transition-all ${condition1 === 'FRIABLE' ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-black/20 text-white/50 border-white/10 hover:border-white/30'}`}
                                            >
                                                Friable
                                            </button>
                                            <button
                                                onClick={() => setCondition1('HUMEDO')}
                                                className={`p-2.5 rounded-lg text-sm border transition-all ${condition1 === 'HUMEDO' ? 'bg-blue-500 text-white border-blue-500' : 'bg-black/20 text-white/50 border-white/10 hover:border-white/30'}`}
                                            >
                                                Húmedo
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* 2da Labor (Optional/Standard) */}
                            <div className="bg-white/5 rounded-xl p-5 border border-white/10 opacity-60 hover:opacity-100 transition-opacity">
                                <h4 className="text-white/70 font-bold mb-4 flex items-center gap-2">
                                    <span className="w-6 h-6 rounded-full bg-white/20 text-white flex items-center justify-center text-xs font-bold">2</span>
                                    2da Roturación (Opcional)
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    <div>
                                        <label className="text-xs text-white/50 mb-1 block">Fecha Programada</label>
                                        <input
                                            type="date"
                                            value={date2}
                                            onChange={e => setDate2(e.target.value)}
                                            className="w-full bg-black/20 border border-white/10 rounded-lg p-2.5 text-white focus:border-emerald-500/50 outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs text-white/50 mb-1 block">Área a Trabajar (ha)</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={area2}
                                            onChange={e => setArea2(e.target.value)}
                                            className="w-full bg-black/20 border border-white/10 rounded-lg p-2.5 text-white focus:border-emerald-500/50 outline-none"
                                        />
                                    </div>
                                    <div className="md:col-span-2 lg:col-span-1">
                                        <label className="text-xs text-white/50 mb-1 block">Estado Terreno</label>
                                        <div className="grid grid-cols-2 gap-2">
                                            <button
                                                onClick={() => setCondition2('FRIABLE')}
                                                className={`p-2.5 rounded-lg text-sm border transition-all ${condition2 === 'FRIABLE' ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-black/20 text-white/50 border-white/10 hover:border-white/30'}`}
                                            >
                                                Friable
                                            </button>
                                            <button
                                                onClick={() => setCondition2('HUMEDO')}
                                                className={`p-2.5 rounded-lg text-sm border transition-all ${condition2 === 'HUMEDO' ? 'bg-blue-500 text-white border-blue-500' : 'bg-black/20 text-white/50 border-white/10 hover:border-white/30'}`}
                                            >
                                                Húmedo
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Fertilizacion (New) */}
                            <div className="bg-white/5 rounded-xl p-5 border border-white/10 opacity-80 hover:opacity-100 transition-opacity">
                                <h4 className="text-white/70 font-bold mb-4 flex items-center gap-2">
                                    <span className="w-6 h-6 rounded-full bg-white/20 text-white flex items-center justify-center text-xs font-bold">F</span>
                                    Fertilización
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    <div>
                                        <label className="text-xs text-white/50 mb-1 block">Fecha Programada</label>
                                        <input
                                            type="date"
                                            value={dateFer}
                                            onChange={e => setDateFer(e.target.value)}
                                            className="w-full bg-black/20 border border-white/10 rounded-lg p-2.5 text-white focus:border-emerald-500/50 outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs text-white/50 mb-1 block">Área a Trabajar (ha)</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={areaFer}
                                            onChange={e => setAreaFer(e.target.value)}
                                            className="w-full bg-black/20 border border-white/10 rounded-lg p-2.5 text-white focus:border-emerald-500/50 outline-none"
                                        />
                                    </div>
                                    <div className="md:col-span-2 lg:col-span-1">
                                        <label className="text-xs text-white/50 mb-1 block">Estado Terreno</label>
                                        <div className="grid grid-cols-2 gap-2">
                                            <button
                                                onClick={() => setConditionFer('FRIABLE')}
                                                className={`p-2.5 rounded-lg text-sm border transition-all ${conditionFer === 'FRIABLE' ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-black/20 text-white/50 border-white/10 hover:border-white/30'}`}
                                            >
                                                Friable
                                            </button>
                                            <button
                                                onClick={() => setConditionFer('HUMEDO')}
                                                className={`p-2.5 rounded-lg text-sm border transition-all ${conditionFer === 'HUMEDO' ? 'bg-blue-500 text-white border-blue-500' : 'bg-black/20 text-white/50 border-white/10 hover:border-white/30'}`}
                                            >
                                                Húmedo
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-white/10 bg-white/5 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-white/70 hover:text-white transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={loading || !selectedSuerte}
                        className="px-6 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-bold shadow-lg shadow-emerald-500/20 flex items-center gap-2 transition-all"
                    >
                        {loading ? 'Guardando...' : (
                            <>
                                <Save size={18} />
                                Guardar Programación
                            </>
                        )}
                    </button>
                </div>

            </div>
        </div>
    );
}
