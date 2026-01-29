import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Map, Clock, Hash } from 'lucide-react';
import { GlassCard } from '../ui/GlassCard';
import { supabase } from '../../lib/supabase';

interface KPIData {
    totalHectares: number;
    avgAge: number;
    totalSuertes: number;
}

export function ZoneSummary() {
    const [data, setData] = useState<KPIData>({ totalHectares: 0, avgAge: 0, totalSuertes: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchKPIs() {
            try {
                const { data: suertes, error } = await supabase
                    .from('suertes')
                    .select('area_neta, edad');

                if (error) throw error;

                if (suertes) {
                    const totalSuertes = suertes.length;
                    const totalHectares = suertes.reduce((acc, curr) => acc + (curr.area_neta || 0), 0);
                    const avgAge = totalSuertes > 0
                        ? suertes.reduce((acc, curr) => acc + (curr.edad || 0), 0) / totalSuertes
                        : 0;

                    setData({
                        totalHectares: parseFloat(totalHectares.toFixed(2)),
                        avgAge: parseFloat(avgAge.toFixed(1)),
                        totalSuertes
                    });
                }
            } catch (err) {
                console.error('Error fetching KPIs:', err);
            } finally {
                setLoading(false);
            }
        }

        fetchKPIs();
    }, []);

    const kpis = [
        {
            label: 'Total Hectáreas',
            value: data.totalHectares,
            unit: 'Has',
            icon: Map,
            color: 'text-emerald-400'
        },
        {
            label: 'Edad Promedio',
            value: data.avgAge,
            unit: 'Meses',
            icon: Clock,
            color: 'text-amber-400'
        },
        {
            label: 'Total Suertes',
            value: data.totalSuertes,
            unit: '',
            icon: Hash,
            color: 'text-blue-400'
        },
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {kpis.map((kpi, idx) => (
                <GlassCard key={idx} className="relative overflow-hidden p-6 flex items-center justify-between group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <kpi.icon size={64} className={kpi.color} />
                    </div>

                    <div className="z-10">
                        <p className="text-sm font-medium text-white/50 mb-1">{kpi.label}</p>
                        <div className="flex items-baseline gap-2">
                            {loading ? (
                                <div className="h-8 w-24 bg-white/10 rounded animate-pulse" />
                            ) : (
                                <motion.span
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.5, delay: idx * 0.1 }}
                                    className={`text-3xl font-bold ${kpi.color} drop-shadow-[0_0_10px_rgba(255,255,255,0.1)]`}
                                >
                                    {kpi.value}
                                </motion.span>
                            )}
                            <span className="text-xs text-white/40 font-medium">{kpi.unit}</span>
                        </div>
                    </div>

                    <div className={`p-3 rounded-xl bg-white/5 border border-white/10 ${kpi.color}`}>
                        <kpi.icon size={24} />
                    </div>
                </GlassCard>
            ))}
        </div>
    );
}
