import { BadgeCheck } from 'lucide-react';


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
    estado_1ra_labor: 'PENDIENTE' | 'PROGRAMADO' | 'PARCIAL' | 'TERMINADO';
    estado_2da_labor: 'PENDIENTE' | 'PROGRAMADO' | 'PARCIAL' | 'TERMINADO';
    estado_fertilizacion: 'PENDIENTE' | 'PROGRAMADO' | 'PARCIAL' | 'TERMINADO';
    observacion?: string;
};

interface RoturacionRowProps {
    row: RoturacionData;
    onEdit: (data: RoturacionData) => void;
}

const getStatusColor = (status: string) => {
    switch (status) {
        case 'TERMINADO': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
        case 'PROGRAMADO': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
        case 'PARCIAL': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
        case 'PENDIENTE': return 'bg-red-500/20 text-red-400 border-red-500/30';
        default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
};

const getStatusValue = (status: string, area: number) => {
    // Mimic the image logic: 0 if done, Area if pending
    if (status === 'TERMINADO') return 0;
    if (status === 'PENDIENTE') return area;
    if (status === 'PARCIAL') return (area / 2).toFixed(2); // Mock partial value
    // For Programado, maybe full area?
    return area;
};

const StatusCell = ({ status, area, onClick }: { status: string, area: number, onClick: () => void }) => (
    <div
        onClick={onClick}
        className={`
            cursor-pointer px-3 py-2 rounded-lg border text-center font-medium transition-all hover:scale-105 active:scale-95
            ${getStatusColor(status)}
        `}
    >
        {status === 'TERMINADO' ? (
            <span className="flex items-center justify-center gap-1">
                <BadgeCheck size={16} /> 0
            </span>
        ) : (
            <span>{getStatusValue(status, area)}</span>
        )}
    </div>
);

export default function RoturacionRow({ row, onEdit }: RoturacionRowProps) {
    return (
        <tr className="border-b border-white/5 hover:bg-white/5 transition-colors text-sm">
            <td className="p-3 text-white/70 text-center">{row.zona}</td>
            <td className="p-3 font-medium text-white">{row.suerte_codigo}</td>
            <td className="p-3 text-right text-white/70">{row.area_neta}</td>
            <td className="p-3 text-white/70 hidden md:table-cell">{row.fecha_inicio}</td>
            <td className="p-3 text-center text-white/70">{row.dias_edad}</td>
            <td className="p-3 text-white/70 hidden md:table-cell">{row.tipo_roturacion}</td>

            <td className="p-2">
                <StatusCell status={row.estado_1ra_labor} area={row.area_neta} onClick={() => onEdit(row)} />
            </td>
            <td className="p-2">
                <StatusCell status={row.estado_2da_labor} area={row.area_neta} onClick={() => onEdit(row)} />
            </td>
            <td className="p-2">
                <StatusCell status={row.estado_fertilizacion} area={row.area_neta} onClick={() => onEdit(row)} />
            </td>

            <td className="p-3 text-white/70 hidden lg:table-cell text-right">{row.tipo_cana}</td>
        </tr>
    );
}
