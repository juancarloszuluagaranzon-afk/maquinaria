import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import RoturacionRow, { RoturacionData } from '../components/roturacion/RoturacionRow';
import EditStatusModal from '../components/roturacion/EditStatusModal';
import RoturacionImporter from '../components/roturacion/RoturacionImporter';
import ProgrammingModal from '../components/roturacion/ProgrammingModal';
import AssignmentModal from '../components/roturacion/AssignmentModal';
import { Filter, RefreshCw, Search, Calculator, Upload, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

export default function RoturacionDashboard() {
    const { profile } = useAuth();
    const canAssign = profile?.rol === 'analista' || profile?.rol === 'auxiliar';
    // Roles que ven múltiples zonas y necesitan el filtro de zona
    const canSeeAllZones = ['analista', 'auxiliar', 'admin'].includes(profile?.rol || '');
    const [data, setData] = useState<RoturacionData[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedZone, setSelectedZone] = useState<number | 'ALL'>('ALL');
    const [searchTerm, setSearchTerm] = useState('');
    const [editingItem, setEditingItem] = useState<RoturacionData | null>(null);
    const [showImporter, setShowImporter] = useState(false);
    const [showProgramming, setShowProgramming] = useState(false);
    const [assignmentItem, setAssignmentItem] = useState<RoturacionData | null>(null);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch directly from table + join to ensure we get new manual columns
            // The view 'v_roturacion_dashboard' might be outdated since columns were added manually
            const { data: rows, error } = await supabase
                .from('roturacion_seguimiento')
                .select(`
                    *,
                    suertes (
                        codigo,
                        hacienda,
                        area_neta,
                        zona
                    )
                `);

            if (error) throw error;

            // Transform data to flat structure expected by UI
            const formattedData: RoturacionData[] = (rows || []).map((r: any) => ({
                ...r,
                suerte_codigo: r.suertes?.codigo,
                hacienda: r.suertes?.hacienda,
                area_neta: r.suertes?.area_neta,
                zona: r.suertes?.zona
            })).sort((a: any, b: any) => {
                // Sort by Zona then Suerte
                if (a.zona !== b.zona) return a.zona - b.zona;
                return a.suerte_codigo?.localeCompare(b.suerte_codigo || '');
            });

            setData(formattedData);
        } catch (error) {
            console.error('Error fetching data:', error);
            toast.error('Error al cargar datos de roturación');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleSave = async (id: string, updates: Partial<RoturacionData>) => {
        try {
            const { error } = await supabase
                .from('roturacion_seguimiento')
                .update(updates)
                .eq('id', id);

            if (error) throw error;

            toast.success('Estado actualizado correctamente');
            fetchData(); // Refresh data
        } catch (error) {
            console.error('Error updating:', error);
            toast.error('Error al actualizar');
            throw error;
        }
    };

    const [viewMode, setViewMode] = useState<'PENDING' | 'FINISHED'>('PENDING');
    const [laborFilter, setLaborFilter] = useState<'ALL' | '1RA' | '2DA' | 'FER'>('ALL');

    const basicFilteredData = data.filter(item => {
        const matchesZone = selectedZone === 'ALL' || item.zona === selectedZone;
        const matchesSearch = item.suerte_codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.hacienda?.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesZone && matchesSearch;
    });

    const filteredData = basicFilteredData.filter(item => {
        if (laborFilter === 'ALL') {
            const isFinished = item.estado_1ra_labor === 'TERMINADO' &&
                item.estado_2da_labor === 'TERMINADO' &&
                item.estado_fertilizacion === 'TERMINADO';
            return viewMode === 'FINISHED' ? isFinished : !isFinished;
        }

        let isFinished = false;
        if (laborFilter === '1RA') {
            isFinished = item.estado_1ra_labor === 'TERMINADO';
        } else if (laborFilter === '2DA') {
            isFinished = item.estado_2da_labor === 'TERMINADO';
        } else if (laborFilter === 'FER') {
            isFinished = item.estado_fertilizacion === 'TERMINADO';
        }

        return viewMode === 'FINISHED' ? isFinished : !isFinished;
    });

    // Calculate totals for summary cards based on ALL data, not just filtered view
    const totalArea = basicFilteredData.reduce((sum, item) => sum + (Number(item.area_neta) || 0), 0);
    const pendingCount = basicFilteredData.filter(i =>
        i.estado_1ra_labor === 'PENDIENTE' || i.estado_2da_labor === 'PENDIENTE' || i.estado_fertilizacion === 'PENDIENTE'
    ).length;


    // Stats Calculation Logic
    const calculateStats = () => {
        const totalArea = filteredData.reduce((sum, row) => sum + (row.area_neta || 0), 0);

        const finished1ra = filteredData.filter(r => r.estado_1ra_labor === 'TERMINADO').reduce((sum, r) => sum + (r.area_neta || 0), 0);
        const finished2da = filteredData.filter(r => r.estado_2da_labor === 'TERMINADO').reduce((sum, r) => sum + (r.area_neta || 0), 0);
        const finishedFer = filteredData.filter(r => r.estado_fertilizacion === 'TERMINADO').reduce((sum, r) => sum + (r.area_neta || 0), 0);

        return {
            total: totalArea,
            finished: {
                labor1: finished1ra,
                labor2: finished2da,
                laborFer: finishedFer
            },
            pending: {
                labor1: totalArea - finished1ra,
                labor2: totalArea - finished2da,
                laborFer: totalArea - finishedFer
            }
        };
    };

    return (
        <div className="p-6 md:p-10 space-y-8 min-h-screen bg-[#0a0a0a] text-white font-sans selection:bg-blue-500/30">
            {/* Header */}
            <div className="flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight flex items-center gap-3">
                        <Calculator className="text-emerald-400" />
                        Seguimiento de Roturación
                    </h1>
                    <p className="text-white/50 mt-1 text-sm md:text-base">Gestión de labores en primeros 3 meses (Soca/Plantilla)</p>
                </div>

                <div className="flex flex-wrap gap-4 w-full md:w-auto">
                    <button
                        onClick={() => setShowProgramming(true)}
                        className="flex-1 md:flex-none px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl flex items-center justify-center gap-2 transition-colors font-medium shadow-lg shadow-blue-500/20"
                    >
                        <Calendar size={18} />
                        Programar
                    </button>

                    {profile?.rol === 'analista' && (
                        <button
                            onClick={() => setShowImporter(true)}
                            className="flex-1 md:flex-none px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl flex items-center justify-center gap-2 transition-colors font-medium shadow-lg shadow-emerald-500/20"
                        >
                            <Upload size={18} />
                            Importar
                        </button>
                    )}
                    <div className="flex-1 md:flex-none px-4 py-2 bg-white/5 rounded-xl border border-white/10 text-center md:text-right">
                        <div className="text-[10px] text-white/50 uppercase font-bold whitespace-nowrap">Área Visible</div>
                        <div className="text-lg font-mono text-emerald-400">{totalArea.toFixed(2)}</div>
                    </div>
                    <div className="flex-1 md:flex-none px-4 py-2 bg-white/5 rounded-xl border border-white/10 text-center md:text-right">
                        <div className="text-[10px] text-white/50 uppercase font-bold whitespace-nowrap">Pendientes</div>
                        <div className="text-lg font-mono text-yellow-400">{pendingCount}</div>
                    </div>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {/* Card 1: Área Total */}
                <div className="bg-black/40 backdrop-blur-xl border border-white/10 p-6 rounded-2xl relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <h3 className="text-white/50 text-sm font-bold uppercase tracking-wider mb-1">Área Total</h3>
                    <div className="text-3xl font-bold text-white font-mono">
                        {calculateStats().total.toFixed(2)} <span className="text-lg text-white/50">ha</span>
                    </div>
                    <div className="mt-2 text-xs text-white/40">
                        Total de suertes filtradas
                    </div>
                </div>

                {/* Card 2: Área Terminada por Labor */}
                <div className="bg-black/40 backdrop-blur-xl border border-white/10 p-6 rounded-2xl relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <h3 className="text-white/50 text-sm font-bold uppercase tracking-wider mb-2">Terminado por Labor</h3>
                    <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                            <span className="text-white/70">1a Roturacion</span>
                            <span className="font-mono text-emerald-400">{calculateStats().finished.labor1.toFixed(1)} ha</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-white/70">2a Roturacion</span>
                            <span className="font-mono text-emerald-400">{calculateStats().finished.labor2.toFixed(1)} ha</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-white/70">Fertilizacion</span>
                            <span className="font-mono text-emerald-400">{calculateStats().finished.laborFer.toFixed(1)} ha</span>
                        </div>
                    </div>
                </div>

                {/* Card 3: Área Pendiente (Total - Terminada) */}
                <div className="bg-black/40 backdrop-blur-xl border border-white/10 p-6 rounded-2xl relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <h3 className="text-white/50 text-sm font-bold uppercase tracking-wider mb-2">Pendiente por Labor</h3>
                    <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                            <span className="text-white/70">1a Roturacion</span>
                            <span className="font-mono text-yellow-400">{calculateStats().pending.labor1.toFixed(1)} ha</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-white/70">2a Roturacion</span>
                            <span className="font-mono text-yellow-400">{calculateStats().pending.labor2.toFixed(1)} ha</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-white/70">Fertilizacion</span>
                            <span className="font-mono text-yellow-400">{calculateStats().pending.laborFer.toFixed(1)} ha</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Actions Bar */}
            <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center bg-black/40 backdrop-blur-xl p-4 rounded-2xl border border-white/10 mb-6">

                {/* View Tabs */}
                <div className="flex bg-black/40 p-1 rounded-xl border border-white/10">
                    <button
                        onClick={() => setViewMode('PENDING')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${viewMode === 'PENDING'
                            ? 'bg-emerald-500 text-white shadow-lg'
                            : 'text-white/50 hover:text-white hover:bg-white/5'
                            }`}
                    >
                        Pendientes
                    </button>
                    <button
                        onClick={() => setViewMode('FINISHED')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${viewMode === 'FINISHED'
                            ? 'bg-blue-500 text-white shadow-lg'
                            : 'text-white/50 hover:text-white hover:bg-white/5'
                            }`}
                    >
                        Terminadas
                    </button>
                </div>

                <div className="flex flex-wrap gap-4 items-center">
                    <div className="flex items-center gap-2 bg-black/20 px-3 py-2 rounded-lg border border-white/5 w-full md:w-64">
                        <Search size={18} className="text-white/30" />
                        <input
                            type="text"
                            placeholder="Buscar suerte..."
                            className="bg-transparent border-none focus:outline-none text-white w-full"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>

                    {canSeeAllZones && (
                        <div className="flex items-center gap-2">
                            <Filter size={18} className="text-white/30" />
                            <select
                                value={selectedZone}
                                onChange={e => setSelectedZone(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
                                className="bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-emerald-500/50"
                            >
                                <option value="ALL">Todas las Zonas</option>
                                <option value={1}>Zona 1</option>
                                <option value={2}>Zona 2</option>
                                <option value={3}>Zona 3</option>
                            </select>
                        </div>
                    )}

                    <div className="flex items-center gap-2">
                        <Filter size={18} className="text-white/30" />
                        <select
                            value={laborFilter}
                            onChange={e => setLaborFilter(e.target.value as any)}
                            className="bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-emerald-500/50"
                        >
                            <option value="ALL">Todas las Labores</option>
                            <option value="1RA">1a Roturación</option>
                            <option value="2DA">2a Roturación</option>
                            <option value="FER">Fertilización</option>
                        </select>
                    </div>

                    <button
                        onClick={fetchData}
                        className="p-2 hover:bg-white/10 rounded-lg text-white/50 hover:text-white transition-colors"
                    >
                        <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-white/5 border-b border-white/10 text-xs font-bold text-white/50 uppercase tracking-wider">
                                <th className="p-4 text-center">{canSeeAllZones ? 'Zona' : ''}</th>
                                <th className="p-4">Suerte</th>
                                <th className="p-4 text-right">Área Total</th>
                                <th className="p-4 hidden md:table-cell">Fecha Inicio</th>
                                <th className="p-4 text-center">Días</th>
                                <th className="p-4 hidden md:table-cell">Tipo Rot.</th>
                                <th className="p-4 text-center w-32">1a Labor</th>
                                <th className="p-4 text-center w-32">2a Labor</th>
                                <th className="p-4 text-center w-32">Fertilización</th>
                                <th className="p-4 hidden lg:table-cell text-right">Tipo Caña</th>
                                {canAssign && <th className="p-4 text-center">Asignar</th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {loading ? (
                                <tr>
                                    <td colSpan={10} className="p-8 text-center text-white/30 animate-pulse">
                                        Cargando datos...
                                    </td>
                                </tr>
                            ) : filteredData.length === 0 ? (
                                <tr>
                                    <td colSpan={10} className="p-8 text-center text-white/30">
                                        No se encontraron registros en esta sección.
                                    </td>
                                </tr>
                            ) : (
                                filteredData.map(row => (
                                    <RoturacionRow
                                        key={row.id}
                                        row={row}
                                        onEdit={setEditingItem}
                                        onAssign={setAssignmentItem}
                                        canAssign={canAssign}
                                        showZone={canSeeAllZones}
                                    />
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            <EditStatusModal
                isOpen={!!editingItem}
                onClose={() => setEditingItem(null)}
                data={editingItem}
                onSave={handleSave}
            />

            {/* Importer Modal */}
            {showImporter && (
                <RoturacionImporter
                    onClose={() => setShowImporter(false)}
                    onImportSuccess={() => {
                        fetchData();
                        setShowImporter(false);
                    }}
                />
            )}

            <ProgrammingModal
                isOpen={showProgramming}
                onClose={() => setShowProgramming(false)}
                onSuccess={() => {
                    fetchData();
                    setShowProgramming(false);
                }}
            />

            <AssignmentModal
                isOpen={!!assignmentItem}
                onClose={() => setAssignmentItem(null)}
                data={assignmentItem}
                onSuccess={() => {
                    fetchData();
                    setAssignmentItem(null);
                }}
            />
        </div>
    );
}
