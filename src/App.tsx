import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import TechnicianDashboard from './pages/TechnicianDashboard';
import ZoneManagerDashboard from './pages/ZoneManagerDashboard';
import AnalystDashboard from './pages/AnalystDashboard';
import NewRequest from './pages/NewRequest';
import ProtectedRoute from './components/layout/ProtectedRoute';
import MainLayout from './layouts/MainLayout';
import { Toaster } from 'react-hot-toast';

function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Routes>
                    <Route path="/login" element={<Login />} />

                    {/* Rutas Protegidas con Menú Lateral */}
                    <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
                        <Route path="/" element={<Navigate to="/dashboard" replace />} />
                        <Route path="/dashboard" element={<Dashboard />} />
                        <Route path="/solicitudes/nueva" element={<NewRequest />} />
                        <Route path="/solicitudes" element={<TechnicianDashboard />} />
                        <Route path="/aprobaciones" element={<ZoneManagerDashboard />} />
                        <Route path="/analista" element={<AnalystDashboard />} />
                    </Route>
                </Routes>
                <Toaster position="bottom-right" toastOptions={{
                    style: {
                        background: '#1a1a1a',
                        color: '#fff',
                        border: '1px solid #333'
                    }
                }} />
            </BrowserRouter>
        </AuthProvider>
    );
}

export default App;
