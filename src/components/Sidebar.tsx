import { useState } from 'react';
import { Home, Package, LogOut, User, Settings, Bell, ArrowDownToLine, ArrowUpFromLine, FileSpreadsheet, Tag, Building2, BarChart3, PanelLeft, Wallet } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Page } from '../lib/types';
import LOGO from '../assets/mazda.png';

type SidebarProps = {
  currentPage: Page;
  onNavigate: (page: Page) => void;
};

export default function Sidebar({ currentPage, onNavigate }: SidebarProps) {
  const { usuario, signOut, isAdmin, permisos } = useAuth();
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="flex h-screen relative">
      <div className="w-16 flex flex-col items-center py-4 gap-2" style={{ backgroundColor: '#2a3042' }}>
        {/* Logo */}
        <div className="mb-4 p-2 bg-white rounded-lg">
          <img
            src={LOGO}
            alt="Mazda Japon"
            className="w-8 h-8 object-contain"
          />
        </div>

        {/* Botón de toggle */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-10 h-10 flex items-center justify-center transition-all mb-2 "
          title={isExpanded ? 'Contraer sidebar' : 'Expandir sidebar'}
        >
          <PanelLeft className="w-5 h-5 text-white" />
        </button>

        {/* Íconos de navegación */}
        {permisos.puedeverDashboard && (
          <button
            onClick={() => onNavigate('dashboard')}
            className={`w-10 h-10 flex items-center justify-center rounded-lg transition-all ${currentPage === 'dashboard'
              ? 'bg-white text-gray-900'
              : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            title="Dashboard"
          >
            <Home className="w-5 h-5" />
          </button>
        )}

        {permisos.puedeVerInventario && (
          <button
            onClick={() => onNavigate('inventory')}
            className={`w-10 h-10 flex items-center justify-center rounded-lg transition-all ${currentPage === 'inventory'
              ? 'bg-white text-gray-900'
              : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            title="Inventario"
          >
            <Package className="w-5 h-5" />
          </button>
        )}

        {permisos.puedeCrearInventario && (
          <button
            onClick={() => onNavigate('entradas')}
            className={`w-10 h-10 flex items-center justify-center rounded-lg transition-all ${currentPage === 'entradas'
              ? 'bg-white text-gray-900'
              : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            title="Entradas"
          >
            <ArrowDownToLine className="w-5 h-5" />
          </button>
        )}

        {permisos.puedeVerSalidas && (
          <button
            onClick={() => onNavigate('salidas')}
            className={`w-10 h-10 flex items-center justify-center rounded-lg transition-all ${currentPage === 'salidas'
              ? 'bg-white text-gray-900'
              : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            title="Salidas"
          >
            <ArrowUpFromLine className="w-5 h-5" />
          </button>
        )}


        {permisos.puedeVerMarcas && (
          <button
            onClick={() => onNavigate('marcas')}
            className={`w-10 h-10 flex items-center justify-center rounded-lg transition-all ${currentPage === 'marcas'
              ? 'bg-white text-gray-900'
              : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            title="Marcas"
          >
            <Tag className="w-5 h-5" />
          </button>
        )}

        {permisos.puedeVerProveedores && (
          <button
            onClick={() => onNavigate('proveedores')}
            className={`w-10 h-10 flex items-center justify-center rounded-lg transition-all ${currentPage === 'proveedores'
              ? 'bg-white text-gray-900'
              : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            title="Proveedores"
          >
            <Building2 className="w-5 h-5" />
          </button>
        )}

        {/* Espaciador */}
        <div className="flex-1"></div>

        {/* Íconos inferiores */}
        {isAdmin && (
          <button
            onClick={() => onNavigate('notificaciones')}
            className={`w-10 h-10 flex items-center justify-center rounded-lg transition-all ${currentPage === 'notificaciones'
              ? 'bg-white text-gray-900'
              : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            title="Notificaciones"
          >
            <Bell className="w-5 h-5" />
          </button>
        )}

        {permisos.puedeExportar && (
          <button
            onClick={() => onNavigate('exportar')}
            className={`w-10 h-10 flex items-center justify-center rounded-lg transition-all ${currentPage === 'exportar'
              ? 'bg-white text-gray-900'
              : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            title="Exportar"
          >
            <FileSpreadsheet className="w-5 h-5" />
          </button>
        )}

        {isAdmin && (
          <button
            onClick={() => onNavigate('caja')}
            className={`w-10 h-10 flex items-center justify-center rounded-lg transition-all ${currentPage === 'caja'
              ? 'bg-white text-gray-900'
              : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            title="Caja"
          >
            <Wallet className="w-5 h-5" />
          </button>
        )}

        {permisos.puedeVerConfiguracion && (
          <button
            onClick={() => onNavigate('configuracion')}
            className={`w-10 h-10 flex items-center justify-center rounded-lg transition-all ${currentPage === 'configuracion'
              ? 'bg-white text-gray-900'
              : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            title="Configuración"
          >
            <Settings className="w-5 h-5" />
          </button>
        )}

        <button
          onClick={signOut}
          className="w-10 h-10 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-red-600 transition-all"
          title="Cerrar Sesión"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>

      {/* Panel expandido */}
      <div className={`bg-white border-r border-gray-200 flex flex-col transition-all duration-300 ${isExpanded ? 'w-64 opacity-100' : 'w-0 opacity-0 overflow-hidden'
        }`}>
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-horizondrift text-gray-900">Mazda Japon</h2>
          <p className="text-xs text-gray-500">Sistema de Inventario</p>
        </div>

        {/* Navegación */}
        <nav className="flex-1 p-3 overflow-y-auto">
          <div className="mb-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 mb-2">
              Principal
            </p>
            {permisos.puedeverDashboard && (
              <button
                onClick={() => onNavigate('dashboard')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm ${currentPage === 'dashboard'
                  ? 'bg-gray-100 text-gray-900 font-medium'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
              >
                <Home className="w-4 h-4" />
                <span>Dashboard</span>
              </button>
            )}

            {permisos.puedeVerInventario && (
              <button
                onClick={() => onNavigate('inventory')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm ${currentPage === 'inventory'
                  ? 'bg-gray-100 text-gray-900 font-medium'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
              >
                <Package className="w-4 h-4" />
                <span>Inventario</span>
              </button>
            )}

            {permisos.puedeCrearInventario && (
              <button
                onClick={() => onNavigate('entradas')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm ${currentPage === 'entradas'
                  ? 'bg-gray-100 text-gray-900 font-medium'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
              >
                <ArrowDownToLine className="w-4 h-4" />
                <span>Entradas</span>
              </button>
            )}

            {permisos.puedeVerSalidas && (
              <button
                onClick={() => onNavigate('salidas')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm ${currentPage === 'salidas'
                  ? 'bg-gray-100 text-gray-900 font-medium'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
              >
                <ArrowUpFromLine className="w-4 h-4" />
                <span>Salidas</span>
              </button>
            )}

          </div>

          {/* Sección de Catálogos */}
          {permisos.puedeVerMarcas && (
            <div className="mb-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 mb-2">
                Catálogos
              </p>
              <button
                onClick={() => onNavigate('marcas')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm ${currentPage === 'marcas'
                  ? 'bg-gray-100 text-gray-900 font-medium'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
              >
                <Tag className="w-4 h-4" />
                <span>Marcas</span>
              </button>
              {permisos.puedeVerProveedores && (
                <button
                  onClick={() => onNavigate('proveedores')}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm ${currentPage === 'proveedores'
                    ? 'bg-gray-100 text-gray-900 font-medium'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                >
                  <Building2 className="w-4 h-4" />
                  <span>Proveedores</span>
                </button>
              )}
              {permisos.puedeVerProveedores && (
                <button
                  onClick={() => onNavigate('comparativa')}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm ${currentPage === 'comparativa'
                    ? 'bg-gray-100 text-gray-900 font-medium'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                >
                  <BarChart3 className="w-4 h-4" />
                  <span>Comparativa</span>
                </button>
              )}
            </div>
          )}

          {/* Sección adicional */}
          {(permisos.puedeExportar || isAdmin) && (
            <div className="mb-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 mb-2">
                Herramientas
              </p>
              {permisos.puedeExportar && (
                <button
                  onClick={() => onNavigate('exportar')}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm ${currentPage === 'exportar'
                    ? 'bg-gray-100 text-gray-900 font-medium'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Exportar</span>
                </button>
              )}
              {isAdmin && (
                <button
                  onClick={() => onNavigate('caja')}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm ${currentPage === 'caja'
                    ? 'bg-gray-100 text-gray-900 font-medium'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                >
                  <Wallet className="w-4 h-4" />
                  <span>Caja</span>
                </button>
              )}
            </div>
          )}

          {permisos.puedeVerConfiguracion && (
            <div className="mb-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 mb-2">
                Administración
              </p>
              <button
                onClick={() => onNavigate('configuracion')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm ${currentPage === 'configuracion'
                  ? 'bg-gray-100 text-gray-900 font-medium'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
              >
                <Settings className="w-4 h-4" />
                <span>Configuración</span>
              </button>
            </div>
          )}
        </nav>

        {/* Footer con usuario */}
        <div className="p-3 border-t border-gray-200">
          <div className="bg-gray-50 rounded-lg p-3 mb-2">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-gray-900 rounded-full flex items-center justify-center flex-shrink-0">
                <User className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 text-xs truncate">
                  {usuario?.nombre}
                </p>
                <p className="text-[10px] text-gray-500 truncate">{usuario?.email}</p>
              </div>
            </div>
            <span
              className={`inline-block text-[10px] font-medium px-2 py-0.5 rounded ${isAdmin
                ? 'bg-gray-900 text-white'
                : 'bg-gray-200 text-gray-700'
                }`}
            >
              {usuario?.rol === 'administrador' && 'Administrador'}
              {usuario?.rol === 'gestion_ingresos' && 'Gestión Ingresos'}
              {usuario?.rol === 'gestion_egresos' && 'Gestión Egresos'}
              {usuario?.rol === 'gestion_inventario' && 'Gestión Inventario'}
            </span>
          </div>

          <button
            onClick={() => onNavigate('perfil')}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 mb-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-all text-sm font-medium"
          >
            <User className="w-4 h-4" />
            <span>Ver Perfil</span>
          </button>

          <button
            onClick={signOut}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all text-sm font-medium"
          >
            <LogOut className="w-4 h-4" />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </div>
    </div>
  );
}
