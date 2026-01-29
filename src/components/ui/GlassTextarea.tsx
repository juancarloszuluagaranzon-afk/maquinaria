import React from 'react';

interface GlassTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    label?: string;
    error?: string;
}

export function GlassTextarea({ label, error, className = '', ...props }: GlassTextareaProps) {
    return (
        <div className="space-y-2">
            {label && (
                <label className="block text-sm font-medium text-white/80 ml-1">
                    {label}
                </label>
            )}
            <textarea
                className={`
                    w-full bg-glass-100 backdrop-blur-md border border-white/10 rounded-xl 
                    p-4
                    text-white placeholder:text-white/30
                    focus:outline-none focus:ring-2 focus:ring-brand-liquid/50 focus:border-brand-liquid/50
                    transition-all duration-300 min-h-[100px] resize-y
                    ${error ? 'border-red-400/50 focus:ring-red-400/50' : ''}
                    ${className}
                `}
                {...props}
            />
            {error && <p className="text-xs text-red-400 ml-1">{error}</p>}
        </div>
    );
}
