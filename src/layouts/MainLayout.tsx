import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Menu } from 'lucide-react';
import Sidebar from '../components/Sidebar';

export default function MainLayout() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
        <div className="flex h-screen w-full bg-black overflow-hidden flex-col md:flex-row">
            {/* Mobile Header */}
            <header className="md:hidden flex items-center justify-between p-4 bg-black/40 border-b border-white/10 backdrop-blur-md z-30">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setIsSidebarOpen(true)}
                        className="p-2 text-white/70 hover:text-white"
                    >
                        <Menu size={24} />
                    </button>
                    <h1 className="text-lg font-bold text-white tracking-tight">Riopaila</h1>
                </div>
            </header>

            {/* Sidebar con Control de Estado */}
            <Sidebar
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
            />

            {/* Área de Contenido Principal */}
            <main className="flex-1 overflow-auto p-4 md:p-8 relative w-full">
                {/* Background Gradients Ambientales (Opcional, para dar profundidad) */}
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-emerald-900/10 via-black to-black -z-10 pointer-events-none" />

                <Outlet />
            </main>
        </div>
    );
}
