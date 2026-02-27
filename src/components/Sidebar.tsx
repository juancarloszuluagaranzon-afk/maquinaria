import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, PlusCircle, FileText, Kanban, CheckCircle, LogOut, X, Tractor, Clock, Layers, Database, Settings } from 'lucide-react';

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
    const { profile, signOut } = useAuth();
    const location = useLocation();
    const role = profile?.rol;

    const linkClass = (targetTo: string) => ({ isActive }: { isActive: boolean }) => {
        // Precise matching for links with query parameters
        const isQueryLink = targetTo.includes('?');
        const isTrulyActive = isQueryLink
            ? (location.pathname + location.search).includes(targetTo)
            : isActive;

        return `flex items-center gap-3 p-3 rounded-xl transition-all duration-300 font-medium ${isTrulyActive
            ? 'bg-cyan-500/10 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.2)] border border-cyan-500/20'
            : 'text-white/60 hover:bg-white/5 hover:text-white'
            }`;
    };

    return (
        <>
            {/* Mobile Overlay Backdrop */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 md:hidden"
                    onClick={onClose}
                />
            )}

            {/* Sidebar Container */}
            <aside className={`
                fixed md:static inset-y-0 left-0 z-50
                w-72 md:w-64 h-full 
                bg-black/95 md:bg-black/40 backdrop-blur-xl border-r border-white/10 
                flex flex-col p-6
                transition-transform duration-300 ease-in-out
                ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
            `}>
                {/* Mobile Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 text-white/50 hover:text-white md:hidden"
                >
                    <X size={24} />
                </button>

                {/* Profile Header */}
                <div className="mb-8 mt-4 md:mt-0 px-2">
                    <div className="flex items-center gap-3 mb-6">
                        <img src="/logo.png" alt="Labores Campo" className="h-10 w-10 object-cover rounded-full border border-white/10" />
                        <div>
                            <h2 className="text-xl font-bold text-white tracking-tight leading-none">Labores</h2>
                            <span className="text-xs font-bold text-cyan-400 uppercase tracking-widest">Campo</span>
                        </div>
                    </div>
                    <div className="mt-2 flex items-center gap-3 bg-white/5 p-3 rounded-xl border border-white/5">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                            {profile?.nombre?.charAt(0) || 'U'}
                        </div>
                        <div className="overflow-hidden">
                            <p className="text-sm font-bold text-white truncate">{profile?.nombre}</p>
                            <p className="text-xs text-white/50 truncate capitalize">
                                {profile?.rol?.replace('_', ' ')}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 space-y-2">
                    {/* Enlacen Común: Maestro */}
                    <div className="text-xs font-bold text-white/30 uppercase tracking-widest mb-2 px-3 mt-4">
                        General
                    </div>
                    <a
                        href="https://juancarloszuluagaranzon-afk.github.io/maestro-riopaila/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-3 rounded-xl transition-all duration-300 font-medium text-white/60 hover:bg-white/5 hover:text-white"
                        onClick={() => onClose()}
                    >
                        <Database size={20} />
                        <span>Maestro</span>
                    </a>
                    <NavLink to="/settings" className={linkClass('/settings')} onClick={() => onClose()}>
                        <Settings size={20} />
                        <span>Configuración</span>
                    </NavLink>

                    {/* Vista Unificada para ANALISTAS */}
                    {role === 'analista' && (
                        <>
                            {/* GRUPO 1: Asignación de Maquinaria */}
                            <div className="text-xs font-bold text-white/30 uppercase tracking-widest mb-2 px-3 mt-4">
                                Asignación de Maquinaria
                            </div>
                            <NavLink to="/analista" className={linkClass('/analista')} onClick={() => onClose()}>
                                <Kanban size={20} />
                                <span>Programación</span>
                            </NavLink>
                            <NavLink to="/solicitudes/nueva" className={linkClass('/solicitudes/nueva')} onClick={() => onClose()}>
                                <PlusCircle size={20} />
                                <span>Nueva Solicitud</span>
                            </NavLink>
                            <NavLink to="/solicitudes?tab=firmadas" className={linkClass('/solicitudes?tab=firmadas')} onClick={() => onClose()}>
                                <FileText size={20} />
                                <span>Recibos Firmados</span>
                            </NavLink>

                            {/* GRUPO 2: Roturación */}
                            <div className="text-xs font-bold text-white/30 uppercase tracking-widest mb-2 px-3 mt-6">
                                Roturación
                            </div>
                            <NavLink to="/roturacion" className={linkClass('/roturacion')} onClick={() => onClose()}>
                                <Layers size={20} />
                                <span>Asignación</span>
                            </NavLink>

                            {/* Temporarily hidden or removed as per request: Resumen Global, Control de Costos, Vista Operador */}
                        </>
                    )}

                    {/* Enlaces Exclusivos TÉCNICOS */}
                    {role === 'tecnico' && (
                        <>
                            <div className="text-xs font-bold text-white/30 uppercase tracking-widest mb-2 px-3">Menú Técnico</div>
                            <NavLink to="/dashboard" className={linkClass('/dashboard')} onClick={() => onClose()}>
                                <LayoutDashboard size={20} />
                                <span>Resumen</span>
                            </NavLink>
                            <NavLink to="/solicitudes/nueva" className={linkClass('/solicitudes/nueva')} onClick={() => onClose()}>
                                <PlusCircle size={20} />
                                <span>Nueva Solicitud</span>
                            </NavLink>
                            <NavLink to="/solicitudes" className={linkClass('/solicitudes')} onClick={() => onClose()}>
                                <FileText size={20} />
                                <span>Historial</span>
                            </NavLink>
                            <NavLink to="/roturacion" className={linkClass('/roturacion')} onClick={() => onClose()}>
                                <Layers size={20} />
                                <span>Roturación</span>
                            </NavLink>
                        </>
                    )}

                    {/* Enlaces Exclusivos JEFES DE ZONA */}
                    {role === 'jefe_zona' && (
                        <>
                            <div className="text-xs font-bold text-white/30 uppercase tracking-widest mb-2 px-3">Gestión Zona</div>
                            <NavLink to="/dashboard" className={linkClass('/dashboard')} onClick={() => onClose()}>
                                <LayoutDashboard size={20} />
                                <span>Resumen</span>
                            </NavLink>
                            <NavLink end to="/aprobaciones" className={linkClass('/aprobaciones')} onClick={() => onClose()}>
                                <Clock size={20} />
                                <span>Por Aprobar</span>
                            </NavLink>
                            <NavLink to="/aprobaciones?status=APROBADO_ZONA" className={linkClass('/aprobaciones?status=APROBADO_ZONA')} onClick={() => onClose()}>
                                <CheckCircle size={20} />
                                <span>Aprobadas</span>
                            </NavLink>
                            <NavLink to="/aprobaciones?status=RECHAZADO" className={linkClass('/aprobaciones?status=RECHAZADO')} onClick={() => onClose()}>
                                <X size={20} />
                                <span>Rechazadas</span>
                            </NavLink>
                            <NavLink to="/roturacion" className={linkClass('/roturacion')} onClick={() => onClose()}>
                                <Layers size={20} />
                                <span>Roturación</span>
                            </NavLink>
                        </>
                    )}

                    {/* Enlaces Exclusivos AUXILIAR */}
                    {role === 'auxiliar' && (
                        <>
                            <div className="text-xs font-bold text-white/30 uppercase tracking-widest mb-2 px-3">Auxiliar Campo</div>
                            <NavLink to="/roturacion" className={linkClass('/roturacion')} onClick={() => onClose()}>
                                <Layers size={20} />
                                <span>Roturación</span>
                            </NavLink>
                        </>
                    )}

                    {/* Enlaces Exclusivos ANALISTAS - REMOVED (Merged above) */}

                    {/* Enlaces Exclusivos OPERADORES / CONTRATISTAS */}
                    {(role === 'operador' || role === 'contratista') && (
                        <>
                            <div className="text-xs font-bold text-white/30 uppercase tracking-widest mb-2 px-3">Mi Turno</div>
                            <NavLink to="/operador" className={linkClass('/operador')} onClick={() => onClose()}>
                                <Tractor size={20} />
                                <span>Ejecución</span>
                            </NavLink>
                        </>
                    )}
                </nav>

                {/* Logout Button */}
                <div className="mt-auto pt-6 border-t border-white/10">
                    <button
                        onClick={signOut}
                        className="w-full flex items-center gap-3 p-3 rounded-xl text-white/60 hover:bg-red-500/10 hover:text-red-400 transition-all duration-300 group"
                    >
                        <LogOut size={20} className="group-hover:rotate-180 transition-transform duration-500" />
                        <span className="font-medium">Cerrar Sesión</span>
                    </button>
                </div>
            </aside>
        </>
    );
}
