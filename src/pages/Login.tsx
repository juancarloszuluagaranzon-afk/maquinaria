import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { GlassCard } from '../components/ui/GlassCard';
import { Loader2, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        // DEBUG TEMPORAL - borrar después
        console.log('🔑 Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
        console.log('🔑 Anon Key (primeros 20 chars):', import.meta.env.VITE_SUPABASE_ANON_KEY?.substring(0, 20));

        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });
        console.log('🔑 Auth response data:', data?.user?.email, '| error:', error?.message);

        if (error) {
            console.error("Login error:", error);
            // Mostrar el error real para depuración
            setError(error.message || 'Error desconocido');
            setLoading(false);
        } else {
            // AuthContext will pick up the session change and correct routing will happen in App.tsx
            navigate('/');
        }
    };

    return (
        <div className="flex h-screen items-center justify-center bg-[#020c1a] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-900/30 via-[#020c1a] to-[#01060f] p-4 text-white">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-md"
            >
                <GlassCard className={`border-t-4 ${error ? 'border-t-red-500/50 shadow-red-900/20' : 'border-t-cyan-500/50'}`}>
                    <div className="mb-8 text-center">
                        <div className="mx-auto mb-6 flex h-32 w-32 items-center justify-center rounded-full bg-cyan-500/5 ring-1 ring-cyan-500/20 overflow-hidden">
                            <img src="/logo.png" alt="Labores Campo" className="h-full w-full object-cover" />
                        </div>
                        <h1 className="text-3xl font-bold tracking-tight text-white/90">
                            Labores <span className="text-cyan-400">Campo</span>
                        </h1>
                        <p className="mt-2 text-sm text-white/50">
                            Riopaila Agrícola S.A.
                        </p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-5">
                        {error && (
                            <motion.div
                                initial={{ x: -10 }}
                                animate={{ x: 0 }}
                                className="flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-200"
                            >
                                <AlertCircle className="h-4 w-4" />
                                {error}
                            </motion.div>
                        )}

                        <div className="space-y-1">
                            <label className="text-xs font-semibold uppercase tracking-wider text-green-200/50">Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full rounded-lg border border-white/10 bg-white/5 p-3 text-white placeholder-white/20 outline-none transition-all focus:border-green-500/50 focus:bg-white/10"
                                placeholder="operador@riopaila.com"
                                required
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-semibold uppercase tracking-wider text-green-200/50">Contraseña</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full rounded-lg border border-white/10 bg-white/5 p-3 text-white placeholder-white/20 outline-none transition-all focus:border-green-500/50 focus:bg-white/10"
                                placeholder="••••••••"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="group relative flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 p-3.5 font-semibold text-white shadow-lg shadow-green-900/20 transition-all hover:scale-[1.02] hover:shadow-green-900/40 disabled:opacity-70"
                        >
                            {loading ? (
                                <Loader2 className="h-5 w-5 animate-spin" />
                            ) : (
                                <span>Iniciar Turno</span>
                            )}
                        </button>
                    </form>

                    <p className="mt-6 text-center text-xs text-white/30">
                        Sistema seguro - Riopaila Castilla S.A.
                    </p>
                </GlassCard>
            </motion.div>
        </div>
    );
}
