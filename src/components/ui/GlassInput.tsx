import React from 'react';

interface GlassInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    icon?: React.ReactNode;
}

export function GlassInput({ label, error, icon, className = '', ...props }: GlassInputProps) {
    return (
        <div className="space-y-2">
            {label && (
                <label className="block text-sm font-medium text-white/80 ml-1">
                    {label}
                </label>
            )}
            <div className="relative group">
                {icon && (
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 group-focus-within:text-brand-liquid transition-colors">
                        {icon}
                    </div>
                )}
                <input
                    className={`
                        w-full bg-glass-100 backdrop-blur-md border border-white/10 rounded-xl 
                        py-3 ${icon ? 'pl-11' : 'pl-4'} pr-4
                        text-white placeholder:text-white/30
                        focus:outline-none focus:ring-2 focus:ring-brand-liquid/50 focus:border-brand-liquid/50
                        transition-all duration-300
                        ${error ? 'border-red-400/50 focus:ring-red-400/50' : ''}
                        ${className}
                    `}
                    {...props}
                />
            </div>
            {error && <p className="text-xs text-red-400 ml-1">{error}</p>}
        </div>
    );
}
