import { useState, useMemo } from 'react';
import * as xlsx from 'xlsx';
import { UploadCloud, FileSpreadsheet, Search, ChevronDown, ChevronUp } from 'lucide-react';

export default function App() {
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
                
                // Read as array of arrays first to check if first row is header
                const rawData = xlsx.utils.sheet_to_json(ws, { header: 1 }) as any[][];
                
                if (rawData.length > 0) {
                    const fileData = xlsx.utils.sheet_to_json(ws);
                    if (fileData.length > 0) {
                        setData(fileData);
                        setColumns(Object.keys(fileData[0] as object));
                    } else {
                        // Might be just headers or empty
                        setData([]);
                        setColumns(rawData[0].map(String));
                    }
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
        <div className="relative min-h-screen bg-gradient-to-br from-slate-950 via-cyan-950/20 to-slate-950 pb-20 overflow-x-hidden text-white font-sans">
            {/* Ambient Light Blobs */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-cyan-500/10 blur-[100px]"></div>
                <div className="absolute top-40 -left-20 h-80 w-80 rounded-full bg-blue-500/10 blur-[100px]"></div>
            </div>

            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 h-screen flex flex-col">
                <header className="mb-6 flex-shrink-0">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg shadow-lg shadow-cyan-500/20">
                            <FileSpreadsheet className="text-white bg-transparent" size={28} />
                        </div>
                        <h1 className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
                            Visor de Archivos
                        </h1>
                    </div>
                    <p className="text-cyan-100/60 text-sm">Sube tu planilla Excel o CSV para explorar y filtrar los datos al instante.</p>
                </header>

                <div className="flex flex-col gap-6 flex-1 min-h-0">
                    {/* Controles: Subida de archivo y búsqueda */}
                    <div className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-2xl p-6 shadow-2xl flex-shrink-0">
                        <div className="flex flex-col md:flex-row gap-6 items-center justify-between">
                            {/* Upload Area */}
                            <div className="w-full justify-center md:justify-start md:w-auto flex-1 flex">
                                <label className="flex items-center gap-4 p-4 pr-12 border border-dashed text-left w-full border-white/20 rounded-xl hover:border-cyan-400/50 hover:bg-cyan-500/5 transition-all cursor-pointer group">
                                    <div className="bg-cyan-500/20 p-3 rounded-lg text-cyan-400 group-hover:scale-110 group-hover:bg-cyan-500/30 transition-all">
                                        <UploadCloud size={24} />
                                    </div>
                                    <div>
                                        <span className="block text-white font-medium group-hover:text-cyan-200 transition-colors">Seleccionar archivo</span>
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
                            {columns.length > 0 && (
                                <div className="w-full md:w-96 relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Search className="h-5 w-5 text-cyan-400/50" />
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="Buscar en la tabla..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="block w-full pl-10 pr-3 py-4 bg-slate-950/50 border border-white/10 rounded-xl leading-5 bg-transparent text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 sm:text-sm transition-all shadow-inner"
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Data Table */}
                    {columns.length > 0 ? (
                        <div className="bg-white/[0.03] border border-white/10 backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden flex flex-col flex-1 min-h-0">
                            <div className="px-6 py-4 border-b border-white/10 flex justify-between items-center bg-white/[0.02]">
                                <span className="text-white/70 text-sm font-medium">
                                    Mostrando <span className="text-cyan-400 font-bold px-1">{filteredData.length}</span> registros de {data.length}
                                </span>
                            </div>
                            <div className="overflow-auto flex-1 custom-scrollbar">
                                <table className="w-full text-left border-collapse text-sm">
                                    <thead>
                                        <tr>
                                            {columns.map((col) => (
                                                <th 
                                                    key={col}
                                                    onClick={() => handleSort(col)}
                                                    className="sticky top-0 bg-slate-900/95 backdrop-blur-xl p-4 font-semibold text-white/90 border-b border-white/10 whitespace-nowrap cursor-pointer hover:bg-white/10 transition-colors z-10 shadow-sm"
                                                >
                                                    <div className="flex items-center gap-2">
                                                        {col}
                                                        {sortConfig?.key === col ? (
                                                            sortConfig.direction === 'ascending' ? <ChevronUp size={14} className="text-cyan-400" /> : <ChevronDown size={14} className="text-cyan-400" />
                                                        ) : (
                                                            <div className="w-3 text-transparent group-hover:text-white/20"><ChevronUp size={14} /></div>
                                                        )}
                                                    </div>
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {filteredData.map((row, rowIndex) => (
                                            <tr key={rowIndex} className="hover:bg-cyan-900/20 transition-colors group">
                                                {columns.map((col) => (
                                                    <td key={col} className="p-4 text-white/70 whitespace-nowrap group-hover:text-white/90">
                                                        {row[col] !== undefined && row[col] !== null ? String(row[col]) : '-'}
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                        {filteredData.length === 0 && (
                                            <tr>
                                                <td colSpan={columns.length} className="p-12 text-center text-white/40">
                                                    <div className="flex flex-col items-center justify-center gap-2">
                                                        <Search size={32} className="text-white/20 mb-2" />
                                                        <p>No se encontraron coincidencias para "{searchTerm}"</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center py-20 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-xl shadow-2xl">
                            <div className="bg-white/5 p-6 rounded-full border border-white/10 mb-6">
                                <FileSpreadsheet className="h-16 w-16 text-cyan-400/50" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">Ningún Archivo Cargado</h3>
                            <p className="text-cyan-100/50 max-w-md text-center">Por favor arrastra o selecciona un archivo Excel (.xlsx) o CSV para comenzar la consulta interactiva de tus datos.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
