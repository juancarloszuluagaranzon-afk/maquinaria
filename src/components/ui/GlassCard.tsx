import { twMerge } from 'tailwind-merge';
import { clsx, type ClassValue } from 'clsx';
import { ReactNode } from 'react';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface GlassCardProps {
    children: ReactNode;
    className?: string;
    hoverEffect?: boolean;
}

export function GlassCard({ children, className, hoverEffect = false }: GlassCardProps) {
    return (
        <div
            className={cn(
                "backdrop-blur-xl bg-white/5 border border-white/10 shadow-xl rounded-2xl p-6",
                hoverEffect && "transition-transform duration-300 hover:scale-[1.01] hover:bg-white/10",
                className
            )}
        >
            {children}
        </div>
    );
}
