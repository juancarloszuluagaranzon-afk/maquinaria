import { useState, useRef } from 'react';
import { read, utils } from 'xlsx';
import { supabase } from '../../lib/supabase';
import { Upload, X, Database, Loader, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

interface SuertesImporterProps {
    onImportSuccess: () => void;
    onClose: () => void;
}

export default function SuertesImporter({ onImportSuccess, onClose }: SuertesImporterProps) {
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

            setProgress('Procesando datos...');

            const updates = [];

            for (const row of jsonData) {
                // Map columns
                const codigo = row['Suerte']?.toString().trim();
                const hacienda = row['Finca']?.toString().trim();
                const zona = row['Zona']?.toString().trim();
                const area = parseFloat(row['Area']);
                const edad = parseFloat(row['Edad']);
                const corte = row['Corte']?.toString().trim();

                if (!codigo || !hacienda || !zona) {
                    // Skip invalid rows but maybe log them?
                    continue;
                }

                updates.push({
                    codigo: codigo,
                    hacienda: hacienda,
                    zona: zona,
                    area_neta: isNaN(area) ? 0 : area,
                    edad: isNaN(edad) ? 0 : edad,
                    corte: corte || ''
                });
            }

            if (updates.length === 0) {
                throw new Error('No se encontraron registros válidos (Zona, Finca, Suerte requeridos).');
            }

            setProgress(`Actualizando ${updates.length} suertes...`);

            // Upsert to suertes using 'codigo' as the conflict key
            const { error: upsertError } = await supabase
                .from('suertes')
                .upsert(updates, { onConflict: 'codigo' });

            if (upsertError) throw upsertError;

            toast.success(`Maestro actualizado: ${updates.length} suertes procesadas.`);
            onImportSuccess();
            onClose();

        } catch (error: any) {
            console.error('Import error:', error);
            toast.error(error.message || 'Error al importar maestro');
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
                        <Database className="text-blue-400" size={20} />
                        Actualizar Maestro de Suertes
                    </h3>
                    <button onClick={onClose} className="text-white/50 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-8">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-8 space-y-4">
                            <Loader size={48} className="text-blue-400 animate-spin" />
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
                                    ? 'border-blue-500 bg-blue-500/10 scale-105'
                                    : 'border-white/20 hover:border-blue-400/50 hover:bg-white/5'
                                }
                            `}
                        >
                            <Upload size={48} className={`mb-4 ${isDragging ? 'text-blue-400' : 'text-white/30'}`} />
                            <p className="text-white font-medium text-center mb-2">
                                Arrastra el Maestro de Suertes (Excel)
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

                    <div className="mt-6 bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 flex gap-3">
                        <AlertCircle className="text-yellow-400 shrink-0" size={20} />
                        <div className="text-xs text-yellow-200">
                            <p className="font-bold mb-1">Advertencia:</p>
                            <p>Esta acción actualizará la base de datos de suertes. </p>
                            <p className="mt-1">Columnas requeridas: <strong>Zona, Finca, Suerte, Area, Edad, Corte</strong></p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
