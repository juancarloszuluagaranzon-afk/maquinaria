import { useState, useRef } from 'react';
import { read, utils } from 'xlsx';
import { supabase } from '../../lib/supabase';
import { Upload, X, FileSpreadsheet, Loader, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

interface RoturacionImporterProps {
    onImportSuccess: () => void;
    onClose: () => void;
}

export default function RoturacionImporter({ onImportSuccess, onClose }: RoturacionImporterProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [loading, setLoading] = useState(false);
    const [progress, setProgress] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const files = e.dataTransfer.files;
        if (files.length > 0) processFile(files[0]);
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            processFile(e.target.files[0]);
        }
    };

    const processFile = async (file: File) => {
        setLoading(true);
        setProgress('Leyendo archivo...');

        try {
            const data = await file.arrayBuffer();
            const workbook = read(data, { cellDates: true });
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];
            const jsonData = utils.sheet_to_json<any>(sheet);

            if (jsonData.length === 0) {
                throw new Error('El archivo está vacío');
            }

            setProgress('Mapeando suertes...');

            // 1. Fetch all suertes to map Codigo -> ID
            const { data: suertes, error: suertesError } = await supabase
                .from('suertes')
                .select('id, codigo');

            if (suertesError) throw suertesError;

            const suerteMap = new Map(suertes?.map(s => [s.codigo, s.id]));
            const updates = [];
            const errors = [];

            // 2. Process rows
            for (const row of jsonData) {
                const codigo = row['Suerte']?.toString().trim();
                if (!codigo) continue;

                const suerteId = suerteMap.get(codigo);
                if (!suerteId) {
                    errors.push(`Suerte ${codigo} no encontrada.`);
                    continue;
                }

                // Parse Statuses
                const getStatus = (val: any) => {
                    const num = parseFloat(val);
                    if (isNaN(num)) return 'PENDIENTE'; // Default safe
                    if (num === 0) return 'TERMINADO';
                    return 'PENDIENTE';
                };

                // Parse Date (Handle Excel serial or string)
                let fechaInicio = null;
                if (row['Fecha Inicio']) {
                    if (row['Fecha Inicio'] instanceof Date) {
                        fechaInicio = row['Fecha Inicio'].toISOString().split('T')[0];
                    } else {
                        // Try to parse string DD/MM/YYYY
                        const parts = row['Fecha Inicio'].toString().split('/');
                        if (parts.length === 3) {
                            fechaInicio = `${parts[2]}-${parts[1]}-${parts[0]}`;
                        }
                    }
                }

                updates.push({
                    suerte_id: suerteId,
                    fecha_inicio: fechaInicio,
                    tipo_roturacion: row['Tipo_Roturacion'] || 'SIMPLE',
                    tipo_cana: row['Tipo_Caña'] || row['Tipo_Cana'] || 'SOCA',
                    estado_1ra_labor: getStatus(row['1ra Labor']),
                    estado_2da_labor: getStatus(row['2da Labor']),
                    estado_fertilizacion: getStatus(row['Fertilización'] || row['Fertilizacion']),
                    last_updated: new Date().toISOString()
                });
            }

            if (updates.length === 0) {
                throw new Error('No se encontraron registros válidos para importar.');
            }

            setProgress(`Guardando ${updates.length} registros...`);

            // 3. Upsert to database
            const { error: upsertError } = await supabase
                .from('roturacion_seguimiento')
                .upsert(updates, { onConflict: 'suerte_id' });

            if (upsertError) throw upsertError;

            toast.success(`Importación exitosa: ${updates.length} registros actualizados.`);
            if (errors.length > 0) {
                console.warn('Errores de importación:', errors);
                toast.error(`${errors.length} filas no se pudieron importar (ver consola).`);
            }

            onImportSuccess();
            onClose();

        } catch (error: any) {
            console.error('Import error:', error);
            toast.error(error.message || 'Error al importar el archivo');
        } finally {
            setLoading(false);
            setProgress('');
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-zinc-900 border border-white/10 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
                <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/5">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <FileSpreadsheet className="text-emerald-400" size={20} />
                        Importar Excel de Roturación
                    </h3>
                    <button onClick={onClose} className="text-white/50 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-8">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-8 space-y-4">
                            <Loader size={48} className="text-emerald-400 animate-spin" />
                            <p className="text-white/70 animate-pulse">{progress}</p>
                        </div>
                    ) : (
                        <div
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            onClick={() => fileInputRef.current?.click()}
                            className={`
                                border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all
                                ${isDragging
                                    ? 'border-emerald-500 bg-emerald-500/10 scale-105'
                                    : 'border-white/20 hover:border-emerald-400/50 hover:bg-white/5'
                                }
                            `}
                        >
                            <Upload size={48} className={`mb-4 ${isDragging ? 'text-emerald-400' : 'text-white/30'}`} />
                            <p className="text-white font-medium text-center mb-2">
                                Arrastra tu archivo Excel aquí
                            </p>
                            <p className="text-white/40 text-sm text-center">
                                o haz clic para seleccionar
                            </p>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".xlsx, .xls"
                                className="hidden"
                                onChange={handleFileSelect}
                            />
                        </div>
                    )}

                    <div className="mt-6 bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 flex gap-3">
                        <AlertCircle className="text-blue-400 shrink-0" size={20} />
                        <div className="text-xs text-blue-200">
                            <p className="font-bold mb-1">Estructura requerida:</p>
                            <p>Columnas: Zona, Suerte, Area_Total, Fecha Inicio, Dias, Tipo_Roturacion, 1ra Labor, 2da Labor, Fertilización, Tipo_Caña.</p>
                            <p className="mt-1 opacity-70">Asegúrate de que los códigos de suerte existan en el sistema.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
