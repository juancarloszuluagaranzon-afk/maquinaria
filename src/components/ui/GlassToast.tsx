import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, Info } from 'lucide-react';

interface GlassToastProps {
    message: string;
    type?: 'success' | 'error' | 'info';
    onClose: () => void;
    duration?: number;
}

export function GlassToast({ message, type = 'success', onClose, duration = 3000 }: GlassToastProps) {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        setIsVisible(true);
        const timer = setTimeout(() => {
            setIsVisible(false);
            setTimeout(onClose, 300); // Wait for exit animation
        }, duration);

        return () => clearTimeout(timer);
    }, [duration, onClose]);

    const getStyles = () => {
        switch (type) {
            case 'success': return 'bg-emerald-500/20 border-emerald-500/30 text-emerald-200';
            case 'error': return 'bg-red-500/20 border-red-500/30 text-red-200';
            case 'info': return 'bg-blue-500/20 border-blue-500/30 text-blue-200';
            default: return 'bg-white/10 border-white/20 text-white';
        }
    };

    const getIcon = () => {
        switch (type) {
            case 'success': return <CheckCircle size={24} />;
            case 'error': return <XCircle size={24} />;
            case 'info': return <Info size={24} />;
            default: return <Info size={24} />;
        }
    };

    return (
        <div
            className={`
                fixed top-6 right-6 z-50 flex items-center gap-3 px-6 py-4 rounded-xl shadow-2xl backdrop-blur-xl border
                transition-all duration-500 transform
                ${isVisible ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0'}
                ${getStyles()}
            `}
        >
            {getIcon()}
            <p className="font-medium">{message}</p>
        </div>
    );
}
