import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';

export type RoturacionData = {
    id: string;
    suerte_id: string;
    suerte_codigo: string;
    zona: number;
    area_neta: number;
    fecha_inicio: string;
    dias_edad: number;
    tipo_roturacion: string;
    tipo_cana: string; // SOCA, PLANTILLA
    estado_1ra_labor: 'PENDIENTE' | 'PROGRAMADO' | 'PARCIAL' | 'TERMINADO';
    estado_2da_labor: 'PENDIENTE' | 'PROGRAMADO' | 'PARCIAL' | 'TERMINADO';
    estado_fertilizacion: 'PENDIENTE' | 'PROGRAMADO' | 'PARCIAL' | 'TERMINADO';
    area_avance_1ra?: number;
    area_avance_2da?: number;
    area_avance_fertilizacion?: number;
    observacion?: string;
};

interface EditStatusModalProps {
    isOpen: boolean;
    onClose: () => void;
    data: RoturacionData | null;
    onSave: (id: string, updates: Partial<RoturacionData>) => Promise<void>;
}

const statusOptions = [
    { value: 'PENDIENTE', label: 'Pendiente', color: 'text-red-400' },
    { value: 'PROGRAMADO', label: 'Programado', color: 'text-blue-400' },
    { value: 'PARCIAL', label: 'Parcial', color: 'text-yellow-400' },
    { value: 'TERMINADO', label: 'Terminado', color: 'text-emerald-400' },
];

export default function EditStatusModal({ isOpen, onClose, data, onSave }: EditStatusModalProps) {
    const [formData, setFormData] = useState<Partial<RoturacionData>>({});
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (data) {
            setFormData({
                estado_1ra_labor: data.estado_1ra_labor,
                estado_2da_labor: data.estado_2da_labor,
                estado_fertilizacion: data.estado_fertilizacion,
                area_avance_1ra: data.area_avance_1ra || 0,
                area_avance_2da: data.area_avance_2da || 0,
                area_avance_fertilizacion: data.area_avance_fertilizacion || 0,
                observacion: data.observacion || ''
            });
        }
    }, [data]);

    if (!isOpen || !data) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await onSave(data.id, formData);
            onClose();
        } catch (error) {
            console.error('Error updating:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl p-6 relative animate-in fade-in zoom-in duration-200">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 text-white/50 hover:text-white rounded-full hover:bg-white/10 transition-colors"
                >
                    <X size={20} />
                </button>

                <h2 className="text-xl font-bold text-white mb-1">Actualizar Estado</h2>
                <p className="text-white/50 text-sm mb-6">
                    Suerte: <span className="text-emerald-400 font-mono">{data.suerte_codigo}</span> |
                    Zona: {data.zona} | Área: {data.area_neta} ha
                </p>

                <form onSubmit={handleSubmit} className="space-y-6">

                    {/* 1ra Labor */}
                    <div className="space-y-2">
                        <div className="flex justify-between items-center px-1">
                            <label className="text-xs font-bold text-white/70 uppercase tracking-widest">1ra Labor (Roturación)</label>
                            <span className="text-[10px] text-emerald-400 font-mono">
                                Pendiente: {(data.area_neta - (formData.area_avance_1ra || 0)).toFixed(2)} ha
                            </span>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                            {statusOptions.map(opt => (
                                <button
                                    key={opt.value}
                                    type="button"
                                    onClick={() => setFormData(p => ({ ...p, estado_1ra_labor: opt.value as any }))}
                                    className={`
                                        p-2 rounded-lg text-xs font-bold border transition-all
                                        ${formData.estado_1ra_labor === opt.value
                                            ? `bg-white/10 border-white/50 text-white shadow-[0_0_10px_rgba(255,255,255,0.1)]`
                                            : `bg-transparent border-white/5 text-white/40 hover:bg-white/5 hover:text-white/70`
                                        }
                                    `}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                        {formData.estado_1ra_labor === 'PARCIAL' && (
                            <div className="animate-in fade-in slide-in-from-top-2">
                                <label className="text-[10px] text-yellow-400/70 ml-1">Área Realizada (ha)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    max={data.area_neta}
                                    value={formData.area_avance_1ra || ''}
                                    onChange={(e) => setFormData(p => ({ ...p, area_avance_1ra: parseFloat(e.target.value) || 0 }))}
                                    className="w-full mt-1 bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-2 text-yellow-200 text-sm focus:outline-none focus:border-yellow-400"
                                    placeholder={`Máx: ${data.area_neta} ha`}
                                />
                            </div>
                        )}
                    </div>

                    {/* 2da Labor */}
                    <div className="space-y-2">
                        <div className="flex justify-between items-center px-1">
                            <label className="text-xs font-bold text-white/70 uppercase tracking-widest">2da Labor (Roturación)</label>
                            <span className="text-[10px] text-emerald-400 font-mono">
                                Pendiente: {(data.area_neta - (formData.area_avance_2da || 0)).toFixed(2)} ha
                            </span>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                            {statusOptions.map(opt => (
                                <button
                                    key={opt.value}
                                    type="button"
                                    onClick={() => setFormData(p => ({ ...p, estado_2da_labor: opt.value as any }))}
                                    className={`
                                        p-2 rounded-lg text-xs font-bold border transition-all
                                        ${formData.estado_2da_labor === opt.value
                                            ? `bg-white/10 border-white/50 text-white shadow-[0_0_10px_rgba(255,255,255,0.1)]`
                                            : `bg-transparent border-white/5 text-white/40 hover:bg-white/5 hover:text-white/70`
                                        }
                                    `}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                        {formData.estado_2da_labor === 'PARCIAL' && (
                            <div className="animate-in fade-in slide-in-from-top-2">
                                <label className="text-[10px] text-yellow-400/70 ml-1">Área Realizada (ha)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    max={data.area_neta}
                                    value={formData.area_avance_2da || ''}
                                    onChange={(e) => setFormData(p => ({ ...p, area_avance_2da: parseFloat(e.target.value) || 0 }))}
                                    className="w-full mt-1 bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-2 text-yellow-200 text-sm focus:outline-none focus:border-yellow-400"
                                    placeholder={`Máx: ${data.area_neta} ha`}
                                />
                            </div>
                        )}
                    </div>

                    {/* Fertilización */}
                    <div className="space-y-2">
                        <div className="flex justify-between items-center px-1">
                            <label className="text-xs font-bold text-white/70 uppercase tracking-widest">Fertilización</label>
                            <span className="text-[10px] text-emerald-400 font-mono">
                                Pendiente: {(data.area_neta - (formData.area_avance_fertilizacion || 0)).toFixed(2)} ha
                            </span>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                            {statusOptions.map(opt => (
                                <button
                                    key={opt.value}
                                    type="button"
                                    onClick={() => setFormData(p => ({ ...p, estado_fertilizacion: opt.value as any }))}
                                    className={`
                                        p-2 rounded-lg text-xs font-bold border transition-all
                                        ${formData.estado_fertilizacion === opt.value
                                            ? `bg-white/10 border-white/50 text-white shadow-[0_0_10px_rgba(255,255,255,0.1)]`
                                            : `bg-transparent border-white/5 text-white/40 hover:bg-white/5 hover:text-white/70`
                                        }
                                    `}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                        {formData.estado_fertilizacion === 'PARCIAL' && (
                            <div className="animate-in fade-in slide-in-from-top-2">
                                <label className="text-[10px] text-yellow-400/70 ml-1">Área Realizada (ha)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    max={data.area_neta}
                                    value={formData.area_avance_fertilizacion || ''}
                                    onChange={(e) => setFormData(p => ({ ...p, area_avance_fertilizacion: parseFloat(e.target.value) || 0 }))}
                                    className="w-full mt-1 bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-2 text-yellow-200 text-sm focus:outline-none focus:border-yellow-400"
                                    placeholder={`Máx: ${data.area_neta} ha`}
                                />
                            </div>
                        )}
                    </div>

                    {/* Observaciones */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-white/70 uppercase tracking-widest">Observación</label>
                        <textarea
                            value={formData.observacion}
                            onChange={(e) => setFormData(p => ({ ...p, observacion: e.target.value }))}
                            className="w-full bg-black/30 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-emerald-500/50 transition-colors"
                            rows={3}
                            placeholder="Ingrese detalles adicionales..."
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-4 border-t border-white/10">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-3 rounded-xl border border-white/10 text-white/60 font-bold hover:bg-white/5 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-bold shadow-lg shadow-emerald-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Save size={20} /> Guardar</>}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
