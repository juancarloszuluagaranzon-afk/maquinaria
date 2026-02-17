import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { GlassCard } from '../components/ui/GlassCard';
import { GlassSelect } from '../components/ui/GlassSelect';
import { DollarSign, Calendar, Filter, CheckCircle, AlertTriangle, BarChart2, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

// Interfaces
interface FinancialRecord {
    id: string;
    fecha_programada: string;
    hacienda: string;
    zona: string;
    labor: string;
    contratista: string;
    maquina: string;
    horas_estimadas: number;
    horas_ejecutadas: number; // From ejecuciones
    tarifa: number;
    costo_estimado: number;
    costo_real: number;
    estado: string;
    estado_pago: 'PENDIENTE' | 'PAGADO';
}

export default function CostDashboard() {
    const { user, profile } = useAuth();
    const [loading, setLoading] = useState(true);
    const [records, setRecords] = useState<FinancialRecord[]>([]);

    // Filters
    const [selectedZone, setSelectedZone] = useState('Todas');
    const [selectedHacienda, setSelectedHacienda] = useState('Todas');
    const [dateRange, setDateRange] = useState({ start: '', end: '' });

    // Dynamic Filter Options
    const [zoneOptions, setZoneOptions] = useState<string[]>([]);
    const [haciendaOptions, setHaciendaOptions] = useState<string[]>([]);

    useEffect(() => {
        if (user && profile) {
            fetchFilters();
            fetchFinancialData();
        }
    }, [user, profile, selectedZone, selectedHacienda, dateRange]);

    // Fetch Unique Zones and Haciendas from DB
    const fetchFilters = async () => {
        try {
            // Fetch all unique zones
            const { data: zonesData, error: zonesError } = await supabase
                .from('suertes')
                .select('zona')
                .order('zona');

            if (zonesError) throw zonesError;

            // Deduplicate zones
            const uniqueZones = Array.from(new Set(zonesData?.map(item => item.zona))).map(String);
            setZoneOptions(['Todas', ...uniqueZones]);

            // Fetch haciendas (filtered by zone if selected)
            let haciendaQuery = supabase
                .from('suertes')
                .select('hacienda')
                .order('hacienda');

            if (selectedZone !== 'Todas') {
                haciendaQuery = haciendaQuery.eq('zona', selectedZone);
            }

            const { data: haciendasData, error: haciendasError } = await haciendaQuery;

            if (haciendasError) throw haciendasError;

            // Deduplicate haciendas
            const uniqueHaciendas = Array.from(new Set(haciendasData?.map(item => item.hacienda)));
            setHaciendaOptions(['Todas', ...uniqueHaciendas]);

        } catch (error) {
            console.error('Error fetching filters:', error);
        }
    };

    const fetchFinancialData = async () => {
        setLoading(true);
        try {
            // Base query with joins
            // Base query with explicit joins
            let query = supabase
                .from('programaciones')
                .select(`
                    id,
                    fecha_programada,
                    horas_estimadas,
                    estado,
                    estado_pago,
                    suertes:suerte_id ( hacienda, zona ),
                    labores:labor_id ( nombre ),
                    maquinaria:maquinaria_id ( nombre, tarifa_hora, contratista_id ),
                    contratistas:contratista_id ( id, nombre ),
                    ejecuciones ( horometro_inicio, horometro_fin )
                `)
                .neq('estado', 'CANCELADO');

            const { data, error } = await query;

            if (error) throw error;

            // Transform Data
            const transformed: FinancialRecord[] = data.map((item: any) => {
                const tarifa = item.maquinaria?.tarifa_hora || 0;
                const estHours = item.horas_estimadas || 0;

                // Calculate real hours from executions
                let realHours = 0;
                if (item.ejecuciones && item.ejecuciones.length > 0) {
                    item.ejecuciones.forEach((exec: any) => {
                        if (exec.horometro_fin && exec.horometro_inicio) {
                            realHours += (exec.horometro_fin - exec.horometro_inicio);
                        }
                    });
                }

                return {
                    id: item.id,
                    fecha_programada: item.fecha_programada,
                    hacienda: item.suertes?.hacienda || 'N/A',
                    zona: item.suertes?.zona?.toString() || 'N/A',
                    labor: item.labores?.nombre || 'N/A',
                    contratista: item.contratistas?.nombre || 'N/A',
                    contratista_id: item.contratistas?.id,
                    maquina: item.maquinaria?.nombre || 'N/A',
                    horas_estimadas: estHours,
                    horas_ejecutadas: realHours,
                    tarifa: tarifa,
                    costo_estimado: estHours * tarifa,
                    costo_real: realHours * tarifa,
                    estado: item.estado,
                    estado_pago: item.estado_pago || 'PENDIENTE'
                };
            });

            // Filter by Date Range
            let filtered = transformed;
            if (dateRange.start) {
                filtered = filtered.filter(r => r.fecha_programada >= dateRange.start);
            }
            if (dateRange.end) {
                filtered = filtered.filter(r => r.fecha_programada <= dateRange.end);
            }

            // Filter by selected params
            if (selectedZone !== 'Todas') {
                filtered = filtered.filter(r => r.zona === selectedZone);
            }
            if (selectedHacienda !== 'Todas') {
                filtered = filtered.filter(r => r.hacienda === selectedHacienda);
            }

            // Role-based filtering checks
            if (profile?.rol === 'jefe_zona') {
                // Zone Managers should ideally see only their zone. 
            } else if (profile?.rol === 'tecnico') {
                if (profile.hacienda_asignada && Array.isArray(profile.hacienda_asignada)) {
                    filtered = filtered.filter(r => profile.hacienda_asignada!.includes(r.hacienda));
                }
            } else if (profile?.rol === 'operador') {
                if (profile.contratista_id) {
                    // Filter where record's contractor ID matches user's contractor ID
                    filtered = filtered.filter(r => (r as any).contratista_id === profile.contratista_id);
                }
            }

            setRecords(filtered);

        } catch (error: any) {
            console.error('Error fetching financial data:', error);
            console.error('Error details:', error.message, error.details, error.hint);
            toast.error(`Error al cargar información financiera: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    // Derived Metrics
    const totalEstimado = records.reduce((acc, curr) => acc + curr.costo_estimado, 0);
    const totalEjecutado = records.reduce((acc, curr) => acc + curr.costo_real, 0);
    const totalVariacion = totalEjecutado - totalEstimado;
    const itemsToPay = records.filter(r => r.estado === 'FINALIZADO' && r.estado_pago === 'PENDIENTE');

    // Chart Data
    const maxVal = Math.max(totalEstimado, totalEjecutado) || 1;
    const estPercent = Math.min((totalEstimado / maxVal) * 100, 100);
    const execPercent = Math.min((totalEjecutado / maxVal) * 100, 100);

    const handleMarkAsPaid = async (id: string) => {
        try {
            const { error } = await supabase
                .from('programaciones')
                .update({ estado_pago: 'PAGADO' })
                .eq('id', id);

            if (error) throw error;
            toast.success('Pago registrado correctamente');
            fetchFinancialData();
        } catch (err) {
            console.error(err);
            toast.error('Error al actualizar pago');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="animate-spin text-emerald-400" size={48} />
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                <DollarSign className="text-emerald-400" />
                Control de Costos
            </h1>

            {/* Filters Section */}
            <GlassCard className="p-4">
                <div className="flex flex-wrap gap-4">
                    <div className="flex items-center gap-2">
                        <Filter size={18} className="text-white/50" />
                        <span className="text-white/50 text-sm">Filtros:</span>
                    </div>

                    {/* Dynamic Zones (Only show if not restricted) */}
                    {profile?.rol !== 'tecnico' && (
                        <GlassSelect
                            value={selectedZone}
                            onChange={(e) => {
                                setSelectedZone(e.target.value);
                                setSelectedHacienda('Todas');
                            }}
                            options={zoneOptions.map(z => ({ value: z, label: z === 'Todas' ? 'Todas las Zonas' : `Zona ${z}` }))}
                            className="w-40"
                        />
                    )}

                    {/* Haciendas */}
                    {/* Dynamic Haciendas */}
                    <GlassSelect
                        value={selectedHacienda}
                        onChange={(e) => setSelectedHacienda(e.target.value)}
                        options={haciendaOptions.map(h => ({ value: h, label: h }))}
                        className="w-40"
                    />

                    <div className="flex items-center gap-2 ml-auto">
                        <input
                            type="date"
                            className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500/50"
                            onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                        />
                        <span className="text-white/30">-</span>
                        <input
                            type="date"
                            className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500/50"
                            onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                        />
                    </div>
                </div>
            </GlassCard>

            {/* Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <GlassCard className="p-6 flex flex-col items-center justify-center relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent group-hover:from-blue-500/20 transition-all duration-500" />
                    <span className="text-white/50 text-sm font-medium z-10">Costo Estimado (Programado)</span>
                    <span className="text-3xl font-bold text-white mt-1 z-10">
                        {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(totalEstimado)}
                    </span>
                    <DollarSign className="absolute bottom-4 right-4 text-blue-500/20" size={48} />
                </GlassCard>

                <GlassCard className="p-6 flex flex-col items-center justify-center relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent group-hover:from-emerald-500/20 transition-all duration-500" />
                    <span className="text-white/50 text-sm font-medium z-10">Costo Real (Ejecutado)</span>
                    <span className="text-3xl font-bold text-white mt-1 z-10">
                        {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(totalEjecutado)}
                    </span>
                    <CheckCircle className="absolute bottom-4 right-4 text-emerald-500/20" size={48} />
                </GlassCard>

                <GlassCard className="p-6 flex flex-col items-center justify-center relative overflow-hidden group">
                    <div className={`absolute inset-0 bg-gradient-to-br transition-all duration-500 ${totalVariacion > 0 ? 'from-red-500/10 group-hover:from-red-500/20' : 'from-emerald-500/10 group-hover:from-emerald-500/20'}`} />
                    <span className="text-white/50 text-sm font-medium z-10">Variación</span>
                    <span className={`text-3xl font-bold mt-1 z-10 ${totalVariacion > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                        {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(totalVariacion)}
                    </span>
                    <AlertTriangle className={`absolute bottom-4 right-4 ${totalVariacion > 0 ? 'text-red-500/20' : 'text-emerald-500/20'}`} size={48} />
                </GlassCard>
            </div>

            {/* Main Content: Chart & List */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Chart Placeholder (Custom CSS Bar) */}
                <GlassCard className="p-6 min-h-[400px]">
                    <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                        <BarChart2 size={20} className="text-emerald-400" />
                        Programado vs Ejecutado
                    </h3>
                    <div className="h-64 flex items-end justify-center gap-12 mt-8 px-8">
                        {/* Bar 1: Estimado */}
                        <div className="flex flex-col items-center gap-2 w-24 group">
                            <span className="text-white/60 text-xs font-mono mb-1 group-hover:text-white transition-colors">
                                {new Intl.NumberFormat('es-CO', { notation: "compact", compactDisplay: "short" }).format(totalEstimado)}
                            </span>
                            <div
                                className="w-full bg-blue-500/50 rounded-t-lg hover:bg-blue-400/80 transition-all duration-500 relative group-hover:shadow-[0_0_15px_rgba(59,130,246,0.5)]"
                                style={{ height: `${estPercent}%` }}
                            />
                            <span className="text-white/50 text-sm mt-2">Estimado</span>
                        </div>

                        {/* Bar 2: Ejecutado */}
                        <div className="flex flex-col items-center gap-2 w-24 group">
                            <span className="text-white/60 text-xs font-mono mb-1 group-hover:text-white transition-colors">
                                {new Intl.NumberFormat('es-CO', { notation: "compact", compactDisplay: "short" }).format(totalEjecutado)}
                            </span>
                            <div
                                className="w-full bg-emerald-500/50 rounded-t-lg hover:bg-emerald-400/80 transition-all duration-500 relative group-hover:shadow-[0_0_15px_rgba(16,185,129,0.5)]"
                                style={{ height: `${execPercent}%` }}
                            />
                            <span className="text-white/50 text-sm mt-2">Ejecutado</span>
                        </div>
                    </div>
                </GlassCard>

                {/* Payment Actions (Analyst Only) or Recent List */}
                <GlassCard className="p-6 relative overflow-hidden">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center justify-between">
                        <span className="flex items-center gap-2">
                            <Calendar size={20} className="text-emerald-400" />
                            {profile?.rol === 'analista' || profile?.rol === 'admin' ? 'Gestión de Pagos' : 'Detalle Reciente'}
                        </span>
                        {(profile?.rol === 'analista' || profile?.rol === 'admin') && (
                            <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded border border-emerald-500/30">
                                {itemsToPay.length} Pendientes
                            </span>
                        )}
                    </h3>

                    <div className="overflow-y-auto max-h-[320px] pr-2 space-y-3 custom-scrollbar">
                        {/* If Analyst, show pending payments first */}
                        {(profile?.rol === 'analista' || profile?.rol === 'admin') ? (
                            itemsToPay.length > 0 ? (
                                itemsToPay.map(record => (
                                    <div key={record.id} className="bg-white/5 p-3 rounded-lg border border-white/5 hover:border-white/20 transition-all group">
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <div className="text-white font-medium text-sm">{record.labor}</div>
                                                <div className="text-white/40 text-xs">{record.hacienda} • {record.contratista}</div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-emerald-400 font-mono text-sm">
                                                    {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(record.costo_real)}
                                                </div>
                                                <div className="text-white/30 text-xs">{new Date(record.fecha_programada).toLocaleDateString()}</div>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleMarkAsPaid(record.id)}
                                            className="w-full mt-2 bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white text-xs py-1.5 rounded transition-colors border border-emerald-600/30"
                                        >
                                            Marcar como Pagado
                                        </button>
                                    </div>
                                ))
                            ) : (
                                <div className="text-white/40 text-center py-8 italic">No hay pagos pendientes por procesar</div>
                            )
                        ) : (
                            // Read Only View for Others
                            records.slice(0, 5).map(record => (
                                <div key={record.id} className="bg-white/5 p-3 rounded-lg border border-white/5 flex justify-between items-center">
                                    <div>
                                        <div className="text-white font-medium text-sm">{record.labor}</div>
                                        <div className="text-white/40 text-xs">{record.hacienda} • {record.maquina}</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-white/80 font-mono text-sm">
                                            {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(record.costo_real > 0 ? record.costo_real : record.costo_estimado)}
                                        </div>
                                        <div className={`text-xs ${record.estado === 'FINALIZADO' ? 'text-emerald-400' : 'text-blue-400'}`}>
                                            {record.estado}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </GlassCard>
            </div>
        </div>
    );
}
