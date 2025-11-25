import { useState, useEffect } from 'react';
import { Bell, Check, Trash2, AlertCircle, Package, TrendingDown, Calendar } from 'lucide-react';
import { repuestosAPI } from '../lib/api';

type Notificacion = {
  id: string;
  tipo: 'stock_bajo' | 'sin_stock' | 'info';
  titulo: string;
  mensaje: string;
  fecha: Date;
  leida: boolean;
  producto?: {
    cb: string;
    nombre: string;
    stock: number;
  };
};

export default function Notificaciones() {
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [filtro, setFiltro] = useState<'todas' | 'no_leidas'>('todas');
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  useEffect(() => {
    cargarNotificaciones();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [filtro]);

  const cargarNotificaciones = async () => {
    try {
      const productos = await repuestosAPI.getAll();
      const notifs: Notificacion[] = [];

      // Generar notificaciones de stock bajo (limitar a 100 notificaciones)
      let count = 0;
      const maxNotificaciones = 100;

      for (const producto of productos) {
        if (count >= maxNotificaciones) break;
        
        const stock = Number(producto.STOCK) || 0;
        
        if (stock === 0) {
          notifs.push({
            id: `sin-stock-${producto.CB}`,
            tipo: 'sin_stock',
            titulo: 'Producto sin stock',
            mensaje: `${producto.PRODUCTO} (${producto.CB}) no tiene existencias`,
            fecha: new Date(),
            leida: false,
            producto: {
              cb: String(producto.CB),
              nombre: producto.PRODUCTO,
              stock: stock,
            },
          });
          count++;
        } else if (stock < 5 && stock > 0) {
          notifs.push({
            id: `stock-bajo-${producto.CB}`,
            tipo: 'stock_bajo',
            titulo: 'Stock bajo',
            mensaje: `${producto.PRODUCTO} (${producto.CB}) tiene solo ${stock} unidad${stock > 1 ? 'es' : ''}`,
            fecha: new Date(),
            leida: false,
            producto: {
              cb: String(producto.CB),
              nombre: producto.PRODUCTO,
              stock: stock,
            },
          });
          count++;
        }
      }

      // Ordenar: sin stock primero, luego stock bajo
      notifs.sort((a, b) => {
        if (a.tipo === 'sin_stock' && b.tipo !== 'sin_stock') return -1;
        if (a.tipo !== 'sin_stock' && b.tipo === 'sin_stock') return 1;
        return (a.producto?.stock || 0) - (b.producto?.stock || 0);
      });
      
      setNotificaciones(notifs);
    } catch (error) {
      console.error('Error al cargar notificaciones:', error);
    } finally {
      setLoading(false);
    }
  };

  const marcarComoLeida = (id: string) => {
    setNotificaciones(notifs =>
      notifs.map(n => n.id === id ? { ...n, leida: true } : n)
    );
  };

  const marcarTodasComoLeidas = () => {
    setNotificaciones(notifs =>
      notifs.map(n => ({ ...n, leida: true }))
    );
  };

  const eliminarNotificacion = (id: string) => {
    setNotificaciones(notifs => notifs.filter(n => n.id !== id));
  };

  const notificacionesFiltradas = notificaciones.filter(n =>
    filtro === 'todas' ? true : !n.leida
  );

  const noLeidas = notificaciones.filter(n => !n.leida).length;

  // Paginación
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const notificacionesPaginadas = notificacionesFiltradas.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(notificacionesFiltradas.length / itemsPerPage);

  const getIcono = (tipo: Notificacion['tipo']) => {
    switch (tipo) {
      case 'sin_stock':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'stock_bajo':
        return <TrendingDown className="w-5 h-5 text-yellow-500" />;
      default:
        return <Bell className="w-5 h-5 text-blue-500" />;
    }
  };

  const getColorFondo = (tipo: Notificacion['tipo'], leida: boolean) => {
    if (leida) return 'bg-gray-50';
    switch (tipo) {
      case 'sin_stock':
        return 'bg-red-50 border-l-4 border-red-500';
      case 'stock_bajo':
        return 'bg-yellow-50 border-l-4 border-yellow-500';
      default:
        return 'bg-blue-50 border-l-4 border-blue-500';
    }
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Notificaciones</h1>
            <p className="text-gray-600">
              {noLeidas > 0 ? `Tienes ${noLeidas} notificación${noLeidas > 1 ? 'es' : ''} sin leer` : 'No tienes notificaciones sin leer'}
            </p>
          </div>
          {noLeidas > 0 && (
            <button
              onClick={marcarTodasComoLeidas}
              className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition"
            >
              <Check className="w-4 h-4" />
              Marcar todas como leídas
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <div className="flex gap-2">
            <button
              onClick={() => setFiltro('todas')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                filtro === 'todas'
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Todas ({notificaciones.length})
            </button>
            <button
              onClick={() => setFiltro('no_leidas')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                filtro === 'no_leidas'
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              No leídas ({noLeidas})
            </button>
          </div>
        </div>

        <div className="divide-y divide-gray-200">
          {loading ? (
            <div className="p-8 text-center text-gray-600">
              Cargando notificaciones...
            </div>
          ) : notificacionesFiltradas.length === 0 ? (
            <div className="p-8 text-center">
              <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-600">
                {filtro === 'no_leidas' ? 'No tienes notificaciones sin leer' : 'No hay notificaciones'}
              </p>
            </div>
          ) : (
            notificacionesPaginadas.map((notif) => (
              <div
                key={notif.id}
                className={`p-4 transition ${getColorFondo(notif.tipo, notif.leida)}`}
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 mt-1">
                    {getIcono(notif.tipo)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h3 className={`text-sm font-semibold ${notif.leida ? 'text-gray-700' : 'text-gray-900'}`}>
                          {notif.titulo}
                        </h3>
                        <p className={`text-sm mt-1 ${notif.leida ? 'text-gray-500' : 'text-gray-700'}`}>
                          {notif.mensaje}
                        </p>
                        {notif.producto && (
                          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <Package className="w-3 h-3" />
                              CB: {notif.producto.cb}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {notif.fecha.toLocaleDateString('es-CO')}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {!notif.leida && (
                          <button
                            onClick={() => marcarComoLeida(notif.id)}
                            className="p-2 text-gray-600 hover:bg-white rounded-lg transition"
                            title="Marcar como leída"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => eliminarNotificacion(notif.id)}
                          className="p-2 text-red-600 hover:bg-white rounded-lg transition"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Paginación */}
        {!loading && notificacionesFiltradas.length > itemsPerPage && (
          <div className="p-4 border-t border-gray-200 flex items-center justify-between text-sm">
            <span className="text-gray-600">
              Mostrando {indexOfFirstItem + 1} a {Math.min(indexOfLastItem, notificacionesFiltradas.length)} de {notificacionesFiltradas.length} notificaciones
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 text-gray-700 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Anterior
              </button>
              <span className="px-3 py-1">{currentPage} de {totalPages}</span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 text-gray-700 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
