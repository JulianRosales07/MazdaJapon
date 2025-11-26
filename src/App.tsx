import { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './components/Login';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Inventory from './components/Inventory';
import Entradas from './components/Entradas';
import Salidas from './components/Salidas';
import Configuracion from './components/Configuracion';
import Exportar from './components/Exportar';
import Marcas from './components/Marcas';
import Proveedores from './components/Proveedores';
import Notificaciones from './components/Notificaciones';
import Perfil from './components/Perfil';
import ComparativaProveedores from './components/ComparativaProveedores';

type Page = 'dashboard' | 'inventory' | 'entradas' | 'salidas' | 'configuracion' | 'exportar' | 'marcas' | 'proveedores' | 'notificaciones' | 'perfil' | 'comparativa';

function AppContent() {
  const { usuario, loading } = useAuth();
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Cargando...</div>
      </div>
    );
  }

  if (!usuario) {
    return <Login />;
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard onNavigate={setCurrentPage} />;
      case 'inventory':
        return <Inventory />;
      case 'entradas':
        return <Entradas />;
      case 'salidas':
        return <Salidas />;
      case 'configuracion':
        return <Configuracion />;
      case 'exportar':
        return <Exportar />;
      case 'marcas':
        return <Marcas />;
      case 'proveedores':
        return <Proveedores />;
      case 'comparativa':
        return <ComparativaProveedores />;
      case 'notificaciones':
        return <Notificaciones />;
      case 'perfil':
        return <Perfil />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar currentPage={currentPage} onNavigate={setCurrentPage} />
      <div className="flex-1 overflow-y-auto">
        {renderPage()}
      </div>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
