import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { GlassCard } from '../components/ui/GlassCard';
import { TechnicalRequestForm } from '../components/solicitudes/TechnicalRequestForm';

export default function NewRequest() {
    const navigate = useNavigate();

    return (
        <div className="relative min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white font-sans selection:bg-blue-500/30">
            {/* Ambient Light Blobs */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-purple-500/20 blur-3xl"></div>
                <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-blue-500/20 blur-3xl"></div>
            </div>

            <div className="relative z-10 p-4 md:p-8">
                <div className="max-w-4xl mx-auto space-y-6">

                    {/* Header */}
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/')}
                            className="p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white transition-colors"
                        >
                            <ArrowLeft size={20} />
                        </button>
                        <div>
                            <h1 className="text-2xl font-bold text-white">Solicitud Técnica</h1>
                            <p className="text-white/60 text-sm">Programación de labores según zona asignada.</p>
                        </div>
                    </div>

                    {/* Form Container */}
                    <GlassCard className="p-6 md:p-8">
                        <TechnicalRequestForm />
                    </GlassCard>

                </div>
            </div>
        </div>
    );
}
