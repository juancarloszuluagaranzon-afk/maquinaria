import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import RoturacionRow, { RoturacionData } from '../components/roturacion/RoturacionRow';
import EditStatusModal from '../components/roturacion/EditStatusModal';
import RoturacionImporter from '../components/roturacion/RoturacionImporter';
import { Filter, RefreshCw, Search, Calculator, Upload } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

export default function RoturacionDashboard() {
    const { profile } = useAuth();
    const [data, setData] = useState<RoturacionData[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedZone, setSelectedZone] = useState<number | 'ALL'>('ALL');
    const [searchTerm, setSearchTerm] = useState('');
    const [editingItem, setEditingItem] = useState<RoturacionData | null>(null);
    const [showImporter, setShowImporter] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch from the view we created
            const { data: rows, error } = await supabase
                .from('v_roturacion_dashboard')
                .select('*')
                .order('zona', { ascending: true })
                .order('suerte_codigo', { ascending: true });

            if (error) throw error;
            setData(rows || []);
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

    const basicFilteredData = data.filter(item => {
        const matchesZone = selectedZone === 'ALL' || item.zona === selectedZone;
        const matchesSearch = item.suerte_codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.hacienda?.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesZone && matchesSearch;
    });

    const filteredData = basicFilteredData.filter(item => {
        const isFinished = item.estado_1ra_labor === 'TERMINADO' &&
            item.estado_2da_labor === 'TERMINADO' &&
            item.estado_fertilizacion === 'TERMINADO';

        return viewMode === 'FINISHED' ? isFinished : !isFinished;
    });

    // Calculate totals for summary cards based on ALL data, not just filtered view
    const totalArea = basicFilteredData.reduce((sum, item) => sum + (Number(item.area_neta) || 0), 0);
    const pendingCount = basicFilteredData.filter(i =>
        i.estado_1ra_labor === 'PENDIENTE' || i.estado_2da_labor === 'PENDIENTE' || i.estado_fertilizacion === 'PENDIENTE'
    ).length;

    return (
        <div className="p-6 max-w-[1600px] mx-auto space-y-6">

            {/* Header & Stats */}
            <div className="flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
                        <Calculator className="text-emerald-400" />
                        Seguimiento de Roturación
                    </h1>
                    <p className="text-white/50 mt-1">Gestión de labores en primeros 3 meses (Soca/Plantilla)</p>
                </div>

                <div className="flex gap-4">
                    {profile?.rol === 'analista' && (
                        <button
                            onClick={() => setShowImporter(true)}
                            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl flex items-center gap-2 transition-colors font-medium shadow-lg shadow-emerald-500/20"
                        >
                            <Upload size={18} />
                            Importar Excel
                        </button>
                    )}
                    <div className="px-4 py-2 bg-white/5 rounded-xl border border-white/10 text-right">
                        <div className="text-xs text-white/50 uppercase font-bold">Área Visible</div>
                        <div className="text-xl font-mono text-emerald-400">{totalArea.toFixed(2)} ha</div>
                    </div>
                    <div className="px-4 py-2 bg-white/5 rounded-xl border border-white/10 text-right">
                        <div className="text-xs text-white/50 uppercase font-bold">Pendientes</div>
                        <div className="text-xl font-mono text-yellow-400">{pendingCount}</div>
                    </div>
                </div>
            </div>

            {/* Filters & Tabs */}
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white/5 p-4 rounded-2xl border border-white/10">

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
                                <th className="p-4 text-center">Zona</th>
                                <th className="p-4">Suerte</th>
                                <th className="p-4 text-right">Área Total</th>
                                <th className="p-4 hidden md:table-cell">Fecha Inicio</th>
                                <th className="p-4 text-center">Días</th>
                                <th className="p-4 hidden md:table-cell">Tipo Rot.</th>
                                <th className="p-4 text-center w-32">1ra Labor</th>
                                <th className="p-4 text-center w-32">2da Labor</th>
                                <th className="p-4 text-center w-32">Fertilización</th>
                                <th className="p-4 hidden lg:table-cell text-right">Tipo Caña</th>
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
        </div>
    );
}
