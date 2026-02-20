import { BadgeCheck, Truck } from 'lucide-react';


export type RoturacionData = {
    id: string;
    suerte_id: string;
    suerte_codigo: string;
    hacienda?: string;
    zona: number;
    area_neta: number;
    fecha_inicio: string;
    dias_edad: number;
    tipo_roturacion: string;
    tipo_cana: string; // SOCA, PLANTILLA
    estado_1ra_labor: 'PENDIENTE' | 'PROGRAMADO' | 'EN_EJECUCION' | 'PARCIAL' | 'TERMINADO';
    estado_2da_labor: 'PENDIENTE' | 'PROGRAMADO' | 'EN_EJECUCION' | 'PARCIAL' | 'TERMINADO';
    estado_fertilizacion: 'PENDIENTE' | 'PROGRAMADO' | 'EN_EJECUCION' | 'PARCIAL' | 'TERMINADO';
    observacion?: string;
    fecha_programada_1ra?: string;
    condicion_terreno_1ra?: string;
    fecha_programada_2da?: string;
    condicion_terreno_2da?: string;
    fecha_programada_fer?: string;
    condicion_terreno_fer?: string;
    area_programada_1ra?: number;
    area_programada_2da?: number;
    area_programada_fer?: number;
    area_avance_1ra?: number;
    area_avance_2da?: number;
    area_avance_fertilizacion?: number;
};

interface RoturacionRowProps {
    row: RoturacionData;
    onEdit: (data: RoturacionData) => void;
    onAssign: (data: RoturacionData) => void;
    canAssign?: boolean;
    showZone?: boolean;
}

const getStatusColor = (status: string) => {
    switch (status) {
        case 'TERMINADO': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
        case 'EN_EJECUCION': return 'bg-purple-500/20 text-purple-400 border-purple-500/30 animate-pulse';
        case 'PROGRAMADO': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
        case 'PARCIAL': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
        case 'PENDIENTE': return 'bg-red-500/20 text-red-400 border-red-500/30';
        default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
};

const getStatusValue = (status: string, area: number, advance?: number) => {
    if (status === 'TERMINADO') return 0;
    if (status === 'PARCIAL' && advance !== undefined) return (area - advance).toFixed(2);
    if (status === 'PENDIENTE' || status === 'PROGRAMADO' || status === 'EN_EJECUCION') return area;
    return area;
};

const StatusCell = ({ status, area, advance, date, condition, programmedArea, onClick }: { status: string, area: number, advance?: number, date?: string, condition?: string, programmedArea?: number, onClick: () => void }) => (
    <div
        onClick={onClick}
        className={`
            cursor-pointer px-3 py-2 rounded-lg border text-center font-medium transition-all hover:scale-105 active:scale-95 flex items-center justify-center min-h-[42px]
            ${getStatusColor(status)}
        `}
    >
        {status === 'TERMINADO' ? (
            <span className="flex items-center justify-center gap-1">
                <BadgeCheck size={16} /> 0
            </span>
        ) : status === 'PROGRAMADO' && date ? (
            <div className="flex flex-col items-center leading-tight">
                <span className="text-xs font-bold">{date.split('-').reverse().slice(0, 2).join('/')}</span>
                <div className="flex gap-1 items-center">
                    {programmedArea && <span className="text-[10px] bg-white/10 px-1 rounded">{programmedArea} ha</span>}
                    {condition && <span className="text-[10px] opacity-70 uppercase">{condition.substring(0, 3)}</span>}
                </div>
            </div>
        ) : (
            <span>{getStatusValue(status, area, advance)} ha</span>
        )}
    </div >
);

export default function RoturacionRow({ row, onEdit, onAssign, canAssign = false, showZone = true }: RoturacionRowProps) {
    return (
        <tr className="border-b border-white/5 hover:bg-white/5 transition-colors text-sm">
            <td className="p-3 text-white/70 text-center">{showZone ? row.zona : ''}</td>
            <td className="p-3 font-medium text-white">{row.suerte_codigo}</td>
            <td className="p-3 text-right text-white/70">{row.area_neta}</td>
            <td className="p-3 text-white/70 hidden md:table-cell">{row.fecha_inicio}</td>
            <td className="p-3 text-center text-white/70">{row.dias_edad}</td>
            <td className="p-3 text-white/70 hidden md:table-cell">{row.tipo_roturacion}</td>

            <td className="p-2">
                <StatusCell
                    status={row.estado_1ra_labor}
                    area={row.area_neta}
                    advance={row.area_avance_1ra}
                    date={row.fecha_programada_1ra}
                    condition={row.condicion_terreno_1ra}
                    programmedArea={row.area_programada_1ra}
                    onClick={() => onEdit(row)}
                />
            </td>
            <td className="p-2">
                <StatusCell
                    status={row.estado_2da_labor}
                    area={row.area_neta}
                    advance={row.area_avance_2da}
                    date={row.fecha_programada_2da}
                    condition={row.condicion_terreno_2da}
                    programmedArea={row.area_programada_2da}
                    onClick={() => onEdit(row)}
                />
            </td>
            <td className="p-2">
                <StatusCell
                    status={row.estado_fertilizacion}
                    area={row.area_neta}
                    advance={row.area_avance_fertilizacion}
                    date={row.fecha_programada_fer}
                    condition={row.condicion_terreno_fer}
                    programmedArea={row.area_programada_fer}
                    onClick={() => onEdit(row)}
                />
            </td>

            <td className="p-3">
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => onEdit(row)}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white/50 hover:text-white"
                        title="Ver detalles"
                    >
                        <Truck size={18} />
                    </button>
                    {canAssign && (
                        <button
                            onClick={() => onAssign(row)}
                            className={`p-2 rounded-lg transition-colors ${row.estado_1ra_labor === 'PROGRAMADO' || row.estado_1ra_labor === 'EN_EJECUCION' ? 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30' : 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'}`}
                            title="Asignar Contratista"
                        >
                            Asignar
                        </button>
                    )}
                </div>
            </td>
        </tr>
    );
}
