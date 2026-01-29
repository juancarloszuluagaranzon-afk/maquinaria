import { useState, useEffect, useRef } from 'react';
import { Search, Loader2, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface GlassComboboxProps {
    label?: string;
    onSelect: (item: any) => void;
    error?: string;
    filters?: Record<string, any>; // New prop for filtering
}

export function GlassCombobox({ label, onSelect, error, filters }: GlassComboboxProps) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<any>(null);
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        const searchSuertes = async () => {
            if (query.length < 2) {
                setResults([]);
                return;
            }

            setLoading(true);
            try {
                let queryBuilder = supabase
                    .from('suertes')
                    .select('*')
                    .or(`codigo.ilike.%${query}%,hacienda.ilike.%${query}%`);

                // Apply dynamic filters
                if (filters) {
                    Object.entries(filters).forEach(([key, value]) => {
                        if (value !== undefined && value !== null) {
                            queryBuilder = queryBuilder.eq(key, value);
                        }
                    });
                }

                const { data, error } = await queryBuilder.limit(5);

                if (error) throw error;
                setResults(data || []);
                setIsOpen(true);
            } catch (err) {
                console.error('Error searching suertes:', err);
            } finally {
                setLoading(false);
            }
        };

        const timeoutId = setTimeout(searchSuertes, 300);
        return () => clearTimeout(timeoutId);
    }, [query, filters]);

    const handleSelect = (item: any) => {
        setSelectedItem(item);
        setQuery('');
        setIsOpen(false);
        onSelect(item);
    };

    const clearSelection = () => {
        setSelectedItem(null);
        onSelect(null);
    };

    return (
        <div className="space-y-2 relative" ref={wrapperRef}>
            {label && (
                <label className="block text-sm font-medium text-white/80 ml-1">
                    {label}
                </label>
            )}

            {selectedItem ? (
                // Selected Item Card
                <div className="relative p-4 rounded-xl bg-gradient-to-br from-brand-liquid/20 to-brand-liquid/5 border border-brand-liquid/30 animate-in fade-in zoom-in-95 duration-300">
                    <button
                        onClick={clearSelection}
                        className="absolute top-2 right-2 p-1 rounded-full hover:bg-white/10 text-white/60 hover:text-white transition-colors"
                    >
                        <X size={16} />
                    </button>
                    <div className="flex justify-between items-start">
                        <div>
                            <h4 className="text-lg font-bold text-white mb-1">{selectedItem.codigo}</h4>
                            <p className="text-brand-liquid-light text-sm">{selectedItem.hacienda}</p>
                        </div>
                        <div className="text-right text-xs text-white/60 space-y-1">
                            <p>Zona: <span className="text-white">{selectedItem.zona}</span></p>
                            <p>Edad: <span className="text-white">{selectedItem.edad} m</span></p>
                            <p>Área: <span className="text-white">{selectedItem.area_neta} ha</span></p>
                        </div>
                    </div>
                </div>
            ) : (
                // Search Input
                <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 group-focus-within:text-brand-liquid transition-colors">
                        {loading ? <Loader2 className="animate-spin" size={18} /> : <Search size={18} />}
                    </div>
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onFocus={() => query.length >= 2 && setIsOpen(true)}
                        placeholder="Buscar suerte (ej: 101, Luisa)..."
                        className={`
                            w-full bg-glass-100 backdrop-blur-md border border-white/10 rounded-xl 
                            py-3 pl-11 pr-4
                            text-white placeholder:text-white/30
                            focus:outline-none focus:ring-2 focus:ring-brand-liquid/50 focus:border-brand-liquid/50
                            transition-all duration-300
                            ${error ? 'border-red-400/50 focus:ring-red-400/50' : ''}
                        `}
                    />
                </div>
            )}
            {error && <p className="text-xs text-red-400 ml-1">{error}</p>}

            {/* Drone Results */}
            {isOpen && results.length > 0 && !selectedItem && (
                <div className="absolute z-50 w-full mt-2 py-2 bg-[#0f172a]/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl max-h-60 overflow-y-auto custom-scrollbar">
                    {results.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => handleSelect(item)}
                            className="w-full text-left px-4 py-3 hover:bg-white/5 transition-colors border-b border-white/5 last:border-0 group"
                        >
                            <div className="flex justify-between items-center">
                                <div>
                                    <span className="font-bold text-white group-hover:text-brand-liquid transition-colors block">
                                        {item.codigo}
                                    </span>
                                    <span className="text-xs text-white/50">{item.hacienda}</span>
                                </div>
                                <div className="text-right">
                                    <span className="text-xs font-mono text-white/40 bg-white/5 px-2 py-1 rounded">
                                        {item.zona}
                                    </span>
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
