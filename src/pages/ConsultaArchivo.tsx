import { useState, useMemo } from 'react';
import * as xlsx from 'xlsx';
import { useAuth } from '../context/AuthContext';
import { UploadCloud, FileSpreadsheet, Search, ChevronDown, ChevronUp } from 'lucide-react';
import { GlassCard } from '../components/ui/GlassCard';

export default function ConsultaArchivo() {
    const { profile } = useAuth();
    const [data, setData] = useState<any[]>([]);
    const [columns, setColumns] = useState<string[]>([]);
    const [fileName, setFileName] = useState<string>('');
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'ascending' | 'descending' } | null>(null);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setFileName(file.name);

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const bstr = event.target?.result;
                const wb = xlsx.read(bstr, { type: 'binary' });
                const wsname = wb.SheetNames[0];
                const ws = wb.Sheets[wsname];
                const fileData = xlsx.utils.sheet_to_json(ws);
                
                if (fileData.length > 0) {
                    setData(fileData);
                    setColumns(Object.keys(fileData[0] as object));
                    setSortConfig(null);
                } else {
                    setData([]);
                    setColumns([]);
                }
            } catch (error) {
                console.error("Error parsing file:", error);
                alert("Error al parsear el archivo. Asegúrate de que sea un archivo Excel o CSV válido.");
            }
        };
        reader.readAsBinaryString(file);
    };

    const handleSort = (key: string) => {
        let direction: 'ascending' | 'descending' = 'ascending';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const sortedData = useMemo(() => {
        let sortableItems = [...data];
        if (sortConfig !== null) {
            sortableItems.sort((a, b) => {
                if (a[sortConfig.key] < b[sortConfig.key]) {
                    return sortConfig.direction === 'ascending' ? -1 : 1;
                }
                if (a[sortConfig.key] > b[sortConfig.key]) {
                    return sortConfig.direction === 'ascending' ? 1 : -1;
                }
                return 0;
            });
        }
        return sortableItems;
    }, [data, sortConfig]);

    const filteredData = useMemo(() => {
        if (!searchTerm) return sortedData;
        const lowercasedSearch = searchTerm.toLowerCase();
        return sortedData.filter((row) =>
            columns.some((col) =>
                String(row[col]).toLowerCase().includes(lowercasedSearch)
            )
        );
    }, [sortedData, searchTerm, columns]);

    return (
        <div className="relative min-h-screen bg-gradient-to-br from-slate-900 via-blue-900/40 to-slate-900 pb-20 overflow-x-hidden">
            {/* Ambient Light Blobs */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-cyan-500/20 blur-3xl"></div>
                <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-blue-500/20 blur-3xl"></div>
            </div>

            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <header className="mb-8">
                    <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
                        <FileSpreadsheet className="text-cyan-400" />
                        Consulta de Archivo
                    </h1>
                    <p className="text-white/60 mt-1">Sube un archivo Excel o CSV para visualizar y filtrar sus datos • {profile?.nombre}</p>
                </header>

                <div className="grid gap-6">
                    {/* Controles: Subida de archivo y búsqueda */}
                    <GlassCard className="p-6">
                        <div className="flex flex-col md:flex-row gap-6 items-center justify-between">
                            {/* Upload Area */}
                            <div className="w-full md:w-auto flex-1">
                                <label className="flex items-center gap-4 p-4 border border-dashed border-white/20 rounded-xl hover:border-cyan-400/50 hover:bg-white/5 transition-all cursor-pointer group">
                                    <div className="bg-cyan-500/20 p-3 rounded-lg text-cyan-400 group-hover:scale-110 transition-transform">
                                        <UploadCloud size={24} />
                                    </div>
                                    <div>
                                        <span className="block text-white font-medium">Seleccionar archivo</span>
                                        <span className="block text-sm text-white/50">{fileName || 'Ningún archivo seleccionado (.xlsx, .csv)'}</span>
                                    </div>
                                    <input 
                                        type="file" 
                                        accept=".xlsx, .xls, .csv" 
                                        onChange={handleFileUpload} 
                                        className="hidden" 
                                    />
                                </label>
                            </div>

                            {/* Search Area */}
                            {data.length > 0 && (
                                <div className="w-full md:w-80 relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Search className="h-5 w-5 text-white/40" />
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="Buscar en todas las columnas..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="block w-full pl-10 pr-3 py-3 bg-black/40 border border-white/10 rounded-xl leading-5 bg-transparent text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 sm:text-sm transition-all"
                                    />
                                </div>
                            )}
                        </div>
                    </GlassCard>

                    {/* Data Table */}
                    {data.length > 0 ? (
                        <GlassCard className="p-0 overflow-hidden flex flex-col max-h-[calc(100vh-280px)]">
                            <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/5">
                                <span className="text-white/70 text-sm font-medium">
                                    Mostrando <span className="text-white font-bold">{filteredData.length}</span> registros de {data.length}
                                </span>
                            </div>
                            <div className="overflow-x-auto overflow-y-auto flex-1 custom-scrollbar">
                                <table className="w-full text-left border-collapse text-sm">
                                    <thead>
                                        <tr>
                                            {columns.map((col) => (
                                                <th 
                                                    key={col}
                                                    onClick={() => handleSort(col)}
                                                    className="sticky top-0 bg-slate-900/95 backdrop-blur-xl p-4 font-semibold text-white/80 border-b border-white/10 whitespace-nowrap cursor-pointer hover:bg-white/5 transition-colors z-10"
                                                >
                                                    <div className="flex items-center gap-2">
                                                        {col}
                                                        {sortConfig?.key === col ? (
                                                            sortConfig.direction === 'ascending' ? <ChevronUp size={14} className="text-cyan-400" /> : <ChevronDown size={14} className="text-cyan-400" />
                                                        ) : (
                                                            <div className="w-3" /> // placeholder to keep alignment
                                                        )}
                                                    </div>
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {filteredData.map((row, rowIndex) => (
                                            <tr key={rowIndex} className="hover:bg-white/5 transition-colors group">
                                                {columns.map((col) => (
                                                    <td key={col} className="p-4 text-white/70 whitespace-nowrap group-hover:text-white/90">
                                                        {row[col] !== undefined && row[col] !== null ? String(row[col]) : '-'}
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                        {filteredData.length === 0 && (
                                            <tr>
                                                <td colSpan={columns.length} className="p-8 text-center text-white/40">
                                                    No se encontraron coincidencias para "{searchTerm}"
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </GlassCard>
                    ) : (
                        <div className="text-center py-20 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-xl">
                            <FileSpreadsheet className="h-16 w-16 text-white/10 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-white/80 mb-2">Ningún Archivo Cargado</h3>
                            <p className="text-white/50">Por favor seleccione un archivo Excel (.xlsx) o CSV para comenzar la consulta.</p>
                        </div>
                    )}
                </div>
            </div>
            
            <style>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 8px;
                    height: 8px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: rgba(255, 255, 255, 0.02);
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(255, 255, 255, 0.2);
                }
            `}</style>
        </div>
    );
}
