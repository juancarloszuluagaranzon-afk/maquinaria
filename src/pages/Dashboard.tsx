import { useAuth } from '../context/AuthContext';
import TechnicianDashboard from './TechnicianDashboard';
import ZoneManagerDashboard from './ZoneManagerDashboard';

export default function Dashboard() {
    const { profile, loading } = useAuth();

    if (loading) {
        return <div className="p-8 text-center text-white">Cargando perfil...</div>;
    }

    // 1. Vista para TÉCNICOS (Luis Millan)
    if (profile?.rol === 'tecnico') {
        return <TechnicianDashboard />;
    }

    // 2. Vista para JEFES DE ZONA (Leonardo/Walter)
    if (profile?.rol === 'jefe_zona') {
        return <ZoneManagerDashboard />;
    }

    // 3. Vista para ANALISTAS (Futuro)
    if (profile?.rol === 'analista') {
        return <div className="p-8 text-white">🚧 Dashboard de Analista en Construcción 🚧</div>;
    }

    // Fallback por seguridad
    return <div className="p-8 text-white">Rol no reconocido: {profile?.rol}</div>;
}
