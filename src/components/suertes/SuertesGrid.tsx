import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { GlassTable } from '../ui/GlassTable';
import { GlassSearch } from '../ui/GlassSearch';
import { Sprout } from 'lucide-react';

interface Suerte {
    id: string;
    codigo: string;
    hacienda: string;
    zona: string;
    edad: number;
    area_neta: number;
    tch_ppto: number; // TCH Estimado
}

export function SuertesGrid() {
    const [suertes, setSuertes] = useState<Suerte[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('');

    useEffect(() => {
        fetchSuertes();
    }, []);

    async function fetchSuertes() {
        try {
            const { data, error } = await supabase
                .from('suertes')
                .select('*')
                .order('codigo', { ascending: true });

            if (error) throw error;
            setSuertes(data || []);
        } catch (err) {
            console.error('Error loading suertes:', err);
        } finally {
            setLoading(false);
        }
    }

    const filteredData = suertes.filter(
        (s) =>
            s.codigo.toLowerCase().includes(filter.toLowerCase()) ||
            s.hacienda.toLowerCase().includes(filter.toLowerCase())
    );

    const getAgeColor = (age: number) => {
        if (age < 10) return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20'; // Crecimiento
        if (age < 12) return 'text-amber-400 bg-amber-400/10 border-amber-400/20';   // Maduración
        return 'text-red-400 bg-red-400/10 border-red-400/20 animate-pulse-slow';     // Cosecha (Alerta)
    };

    const columns = [
        {
            header: 'Código',
            accessor: (s: Suerte) => (
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-white/5 border border-white/10 text-brand-liquid">
                        <Sprout size={16} />
                    </div>
                    <span className="font-bold text-white group-hover:text-brand-liquid transition-colors">
                        {s.codigo}
                    </span>
                </div>
            ),
        },
        {
            header: 'Hacienda',
            accessor: (s: Suerte) => <span className="text-white/80">{s.hacienda}</span>,
        },
        {
            header: 'Zona',
            accessor: (s: Suerte) => <span className="text-white/60">{s.zona}</span>,
        },
        {
            header: 'Edad (Meses)',
            accessor: (s: Suerte) => (
                <span className={`px-2 py-1 rounded-md text-xs font-bold border ${getAgeColor(s.edad)}`}>
                    {s.edad.toFixed(1)}
                </span>
            ),
        },
        {
            header: 'Área (Has)',
            accessor: (s: Suerte) => <span className="font-mono text-white/90">{s.area_neta.toFixed(2)}</span>,
        },
        {
            header: 'TCH Est.',
            accessor: (s: Suerte) => <span className="font-mono text-white/70">{s.tch_ppto?.toFixed(1) || '-'}</span>,
        }
    ];

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Sprout className="text-brand-liquid" />
                    Listado de Suertes
                </h2>
                <GlassSearch
                    placeholder="Buscar por código o hacienda..."
                    className="w-full sm:w-80"
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                />
            </div>

            <GlassTable
                data={filteredData}
                columns={columns}
                isLoading={loading}
                onRowClick={(item) => console.log('Clicked:', item.codigo)}
            />
        </div>
    );
}
