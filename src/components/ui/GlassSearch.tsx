import { Search } from 'lucide-react';

interface GlassSearchProps extends React.InputHTMLAttributes<HTMLInputElement> { }

export function GlassSearch({ className = '', ...props }: GlassSearchProps) {
    return (
        <div className={`relative group ${className}`}>
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-white/40 group-focus-within:text-brand-liquid transition-colors" />
            </div>
            <input
                type="text"
                className="block w-full pl-10 pr-3 py-2.5 border border-white/10 rounded-lg leading-5 bg-white/5 text-white placeholder-white/40 focus:outline-none focus:bg-white/10 focus:border-brand-liquid/50 focus:ring-1 focus:ring-brand-liquid/50 sm:text-sm transition-all duration-300 backdrop-blur-md shadow-inner-glass"
                placeholder="Buscar..."
                {...props}
            />
        </div>
    );
}
