import React from 'react';
import { ChevronDown } from 'lucide-react';

interface GlassSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    label?: string;
    error?: string;
    options: { value: string | number; label: string }[];
    placeholder?: string;
}

export function GlassSelect({ label, error, options, placeholder, className = '', ...props }: GlassSelectProps) {
    return (
        <div className="space-y-2">
            {label && (
                <label className="block text-sm font-medium text-white/80 ml-1">
                    {label}
                </label>
            )}
            <div className="relative group">
                <select
                    className={`
                        w-full bg-glass-100 backdrop-blur-md border border-white/10 rounded-xl 
                        py-3 pl-4 pr-10 appearance-none
                        text-white 
                        focus:outline-none focus:ring-2 focus:ring-brand-liquid/50 focus:border-brand-liquid/50
                        transition-all duration-300
                        ${error ? 'border-red-400/50 focus:ring-red-400/50' : ''}
                        ${className}
                    `}
                    {...props}
                >
                    {placeholder && (
                        <option value="" disabled className="bg-slate-800 text-white/50">
                            {placeholder}
                        </option>
                    )}
                    {options.map((opt) => (
                        <option key={opt.value} value={opt.value} className="bg-slate-800 text-white">
                            {opt.label}
                        </option>
                    ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none group-focus-within:text-brand-liquid transition-colors">
                    <ChevronDown size={18} />
                </div>
            </div>
            {error && <p className="text-xs text-red-400 ml-1">{error}</p>}
        </div>
    );
}
