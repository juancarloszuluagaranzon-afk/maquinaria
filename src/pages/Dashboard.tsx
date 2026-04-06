import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ZoneManagerDashboard from './ZoneManagerDashboard';
import OperatorDashboard from './OperatorDashboard';
import AnalystDashboard from './AnalystDashboard';

export default function Dashboard() {
    const { profile, loading } = useAuth();

    if (loading) {
        return <div className="p-8 text-center text-white">Cargando perfil...</div>;
    }

    // 1. Vista para TÉCNICOS (Luis Millan)
    if (profile?.rol === 'tecnico') {
        return <Navigate to="/solicitudes" replace />;
    }

    // 2. Vista para JEFES DE ZONA (Leonardo/Walter)
    if (profile?.rol === 'jefe_zona') {
        return <ZoneManagerDashboard />;
    }

    // 3. Vista para ANALISTAS
    if (profile?.rol === 'analista') {
        return <AnalystDashboard />;
    }

    // 4. Vista para OPERADORES / CONTRATISTAS
    if (profile?.rol === 'operador' || profile?.rol === 'contratista') {
        return <OperatorDashboard />;
    }

    // Fallback por seguridad
    return <div className="p-8 text-white">Rol no reconocido: {profile?.rol}</div>;
}
