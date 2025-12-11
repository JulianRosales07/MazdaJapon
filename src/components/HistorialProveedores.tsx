import { useEffect, useState } from 'react';
import { X, TrendingUp, TrendingDown, Calendar, DollarSign, History, Edit2, Trash2 } from 'lucide-react';
import { apiClient } from '../lib/apiClient';
import type { HistorialPrecio } from '../lib/types';
import TableSkeleton from './TableSkeleton';
import Toast from './Toast';

interface HistorialProveedoresProps {
  productoCB: string;
  productoNombre: string;
  onClose: () => void;
}

export default function HistorialProveedores({ productoCB, productoNombre, onClose }: HistorialProveedoresProps) {
  const [historial, setHistorial] = useState<HistorialPrecio[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<number | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingItem, setEditingItem] = useState<HistorialPrecio | null>(null);
  const [editMotivo, setEditMotivo] = useState('');
  const [editPrecioNuevo, setEditPrecioNuevo] = useState<number>(0);
  const [editPrecioAnterior, setEditPrecioAnterior] = useState<number | null>(null);

  useEffect(() => {
    fetchHistorial();
  }, [productoCB]);

  const fetchHistorial = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.getHistorialPreciosByProducto(productoCB, 100);
      
      // Manejar estructura de respuesta: {success, data: [...]} o array directo
      let data = response;
      if (response && typeof response === 'object' && 'data' in response) {
        data = (response as any).data;
      }
      
      // Verificar que data sea un array
      if (!Array.isArray(data)) {
        console.error('La respuesta de historial no es un array:', data);
        setHistorial([]);
        return;
      }
      
      setHistorial(data);
    } catch (error: any) {
      console.error('Error fetching historial:', error);
      
      // Detectar diferentes tipos de errores
      if (error.message?.includes('404') || error.message?.includes('Not Found')) {
        setError('endpoint_not_found');
      } else if (error.message?.includes('401') || error.message?.includes('Token expirado') || error.message?.includes('Unauthorized')) {
        setError('auth_expired');
      } else {
        setError(error.message || 'Error al cargar el historial');
      }
      setHistorial([]);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatPrice = (price: number | null) => {
    if (price === null) return '-';
    return `$${price.toFixed(2)}`;
  };

  const formatPercentage = (percentage: number | null | undefined) => {
    if (!percentage) return '-';
    const sign = percentage > 0 ? '+' : '';
    return `${sign}${percentage.toFixed(2)}%`;
  };

  const handleEdit = (item: HistorialPrecio) => {
    setEditingItem(item);
    setEditMotivo(item.motivo_cambio || '');
    setEditPrecioNuevo(item.precio_nuevo);
    setEditPrecioAnterior(item.precio_anterior);
    setShowEditModal(true);
  };

  const handleDelete = (id: number) => {
    setItemToDelete(id);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;

    try {
      // Llamar al endpoint de eliminación (soft delete)
      await apiClient.deleteHistorialPrecio(itemToDelete);
      
      setToastMessage('Registro eliminado correctamente');
      setShowToast(true);
      setShowDeleteDialog(false);
      setItemToDelete(null);
      
      // Recargar el historial
      await fetchHistorial();
    } catch (error: any) {
      console.error('Error deleting historial:', error);
      setToastMessage('Error al eliminar el registro');
      setShowToast(true);
    }
  };

  const saveEdit = async () => {
    if (!editingItem) return;

    try {
      // Llamar al endpoint de actualización
      await apiClient.updateHistorialPrecio(editingItem.id_historial, {
        precio_anterior: editPrecioAnterior,
        precio_nuevo: editPrecioNuevo,
        motivo_cambio: editMotivo,
      });
      
      setToastMessage('Registro actualizado correctamente');
      setShowToast(true);
      setShowEditModal(false);
      setEditingItem(null);
      setEditMotivo('');
      setEditPrecioNuevo(0);
      setEditPrecioAnterior(null);
      
      // Recargar el historial
      await fetchHistorial();
    } catch (error: any) {
      console.error('Error updating historial:', error);
      setToastMessage('Error al actualizar el registro');
      setShowToast(true);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[120]"
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-gray-900 to-gray-700 px-6 py-5 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center">
                <History className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Historial de Proveedores</h2>
                <p className="text-gray-300 text-sm">{productoNombre}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white transition"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-100px)]">
          {loading ? (
            <TableSkeleton rows={5} columns={7} />
          ) : error === 'auth_expired' ? (
            <div className="text-center py-12 px-6">
              <div className="max-w-md mx-auto">
                <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-10 h-10 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  Sesión Expirada
                </h3>
                <p className="text-gray-600 mb-4">
                  Tu sesión ha expirado. Por favor, recarga la página e inicia sesión nuevamente para ver el historial.
                </p>
                <button
                  onClick={() => window.location.reload()}
                  className="px-6 py-2.5 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition font-medium"
                >
                  Recargar Página
                </button>
              </div>
            </div>
          ) : error === 'endpoint_not_found' ? (
            <div className="text-center py-12 px-6">
              <div className="max-w-2xl mx-auto">
                <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-10 h-10 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  Endpoint no implementado en el backend
                </h3>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4 text-left">
                  <p className="text-sm text-gray-700 mb-3">
                    El sistema de historial de precios requiere que el backend tenga implementado el siguiente endpoint:
                  </p>
                  <div className="bg-white rounded border border-yellow-300 p-3 mb-3">
                    <code className="text-xs text-blue-600 font-mono">
                      GET /api/historial-precios/producto/:producto_cb
                    </code>
                  </div>
                  <p className="text-sm text-gray-700 mb-2">
                    <strong>Pasos para implementar:</strong>
                  </p>
                  <ol className="text-sm text-gray-700 space-y-1 list-decimal list-inside">
                    <li>Ejecutar la migración SQL: <code className="text-xs bg-gray-100 px-1 py-0.5 rounded">migration_historial_precios.sql</code></li>
                    <li>Agregar las rutas en el backend: <code className="text-xs bg-gray-100 px-1 py-0.5 rounded">historialPrecios.routes.js</code></li>
                    <li>Implementar el controlador: <code className="text-xs bg-gray-100 px-1 py-0.5 rounded">historialPrecios.controller.js</code></li>
                    <li>Implementar el modelo: <code className="text-xs bg-gray-100 px-1 py-0.5 rounded">historialPrecios.model.js</code></li>
                  </ol>
                </div>
                <p className="text-sm text-gray-600">
                  Consulta la documentación completa en el archivo que te proporcioné sobre el sistema de historial de precios.
                </p>
              </div>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <div className="text-red-600 mb-2">Error al cargar el historial</div>
              <div className="text-gray-600 text-sm">{error}</div>
            </div>
          ) : historial.length === 0 ? (
            <div className="text-center py-12">
              <History className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 text-lg font-medium mb-2">No hay historial disponible</p>
              <p className="text-gray-500 text-sm">
                Los cambios de precio se registrarán automáticamente cuando actualices los proveedores
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Resumen */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-5 h-5 text-blue-600" />
                    <span className="text-sm font-medium text-blue-900">Total de Cambios</span>
                  </div>
                  <p className="text-2xl font-bold text-blue-900">{historial.length}</p>
                </div>

                <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="w-5 h-5 text-green-600" />
                    <span className="text-sm font-medium text-green-900">Precio Actual</span>
                  </div>
                  <p className="text-2xl font-bold text-green-900">
                    {historial.length > 0 ? formatPrice(historial[0].precio_nuevo) : '-'}
                  </p>
                </div>

                <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-5 h-5 text-purple-600" />
                    <span className="text-sm font-medium text-purple-900">Proveedores</span>
                  </div>
                  <p className="text-2xl font-bold text-purple-900">
                    {new Set(historial.map(h => h.proveedor_id)).size}
                  </p>
                </div>
              </div>

              {/* Tabla de historial */}
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="text-left py-3 px-4 text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Fecha
                        </th>
                        <th className="text-left py-3 px-4 text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Proveedor
                        </th>
                        <th className="text-right py-3 px-4 text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Precio Anterior
                        </th>
                        <th className="text-right py-3 px-4 text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Precio Nuevo
                        </th>
                        <th className="text-right py-3 px-4 text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Diferencia
                        </th>
                        <th className="text-right py-3 px-4 text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Cambio %
                        </th>
                        <th className="text-left py-3 px-4 text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Motivo
                        </th>
                        <th className="text-center py-3 px-4 text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Acciones
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {historial.map((item) => (
                        <tr key={item.id_historial} className="hover:bg-gray-50 transition">
                          <td className="py-3 px-4 text-sm text-gray-900">
                            {formatDate(item.fecha_cambio)}
                          </td>
                          <td className="py-3 px-4">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {item.proveedor_nombre || `Proveedor #${item.proveedor_id}`}
                              </div>
                              {item.proveedor_cp && (
                                <div className="text-xs text-gray-500">{item.proveedor_cp}</div>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-sm text-right text-gray-700">
                            {formatPrice(item.precio_anterior)}
                          </td>
                          <td className="py-3 px-4 text-sm text-right font-medium text-gray-900">
                            {formatPrice(item.precio_nuevo)}
                          </td>
                          <td className="py-3 px-4 text-sm text-right">
                            {item.diferencia !== undefined && item.diferencia !== null ? (
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                                  item.diferencia > 0
                                    ? 'bg-red-100 text-red-700'
                                    : item.diferencia < 0
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-gray-100 text-gray-700'
                                }`}
                              >
                                {item.diferencia > 0 ? (
                                  <TrendingUp className="w-3 h-3" />
                                ) : item.diferencia < 0 ? (
                                  <TrendingDown className="w-3 h-3" />
                                ) : null}
                                {formatPrice(Math.abs(item.diferencia))}
                              </span>
                            ) : (
                              '-'
                            )}
                          </td>
                          <td className="py-3 px-4 text-sm text-right">
                            {item.porcentaje_cambio !== undefined && item.porcentaje_cambio !== null ? (
                              <span
                                className={`font-medium ${
                                  item.porcentaje_cambio > 0
                                    ? 'text-red-600'
                                    : item.porcentaje_cambio < 0
                                    ? 'text-green-600'
                                    : 'text-gray-600'
                                }`}
                              >
                                {formatPercentage(item.porcentaje_cambio)}
                              </span>
                            ) : (
                              '-'
                            )}
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-600">
                            {item.motivo_cambio || '-'}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex justify-center gap-2">
                              <button
                                onClick={() => handleEdit(item)}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                title="Editar motivo"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(item.id_historial)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                                title="Eliminar registro"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition font-medium"
          >
            Cerrar
          </button>
        </div>
      </div>

      {/* Modal de Edición */}
      {showEditModal && editingItem && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[130]"
        >
          <div
            className="bg-white rounded-xl shadow-2xl w-full max-w-md"
          >
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-900">Editar Registro de Historial</h3>
            </div>
            <div className="p-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Proveedor
                </label>
                <div className="text-sm text-gray-900 font-medium bg-gray-50 px-3 py-2 rounded-lg border border-gray-200">
                  {editingItem.proveedor_nombre || `Proveedor #${editingItem.proveedor_id}`}
                  {editingItem.proveedor_cp && (
                    <span className="text-gray-500 ml-2">({editingItem.proveedor_cp})</span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Precio Anterior
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={editPrecioAnterior || ''}
                      onChange={(e) => setEditPrecioAnterior(e.target.value ? parseFloat(e.target.value) : null)}
                      className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Precio Nuevo *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      required
                      value={editPrecioNuevo}
                      onChange={(e) => setEditPrecioNuevo(parseFloat(e.target.value) || 0)}
                      className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>

              {editPrecioAnterior !== null && editPrecioNuevo > 0 && (
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="text-sm text-blue-900">
                    <div className="font-medium mb-1">Resumen del cambio:</div>
                    <div className="flex items-center justify-between">
                      <span>Diferencia:</span>
                      <span className={`font-bold ${editPrecioNuevo - editPrecioAnterior > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        ${Math.abs(editPrecioNuevo - editPrecioAnterior).toFixed(2)}
                        {editPrecioNuevo - editPrecioAnterior > 0 ? ' ↑' : ' ↓'}
                      </span>
                    </div>
                    {editPrecioAnterior !== 0 && (
                      <div className="flex items-center justify-between">
                        <span>Cambio:</span>
                        <span className={`font-bold ${editPrecioNuevo - editPrecioAnterior > 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {((editPrecioNuevo - editPrecioAnterior) / editPrecioAnterior * 100).toFixed(2)}%
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Motivo del Cambio
                </label>
                <textarea
                  value={editMotivo}
                  onChange={(e) => setEditMotivo(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                  placeholder="Describe el motivo del cambio de precio..."
                />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex gap-3 justify-end">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={saveEdit}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Diálogo de Confirmación de Eliminación */}
      {showDeleteDialog && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[130]"
        >
          <div
            className="bg-white rounded-xl shadow-2xl w-full max-w-md"
          >
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-900">Confirmar Eliminación</h3>
            </div>
            <div className="p-6">
              <p className="text-gray-700">
                ¿Estás seguro de que deseas eliminar este registro del historial? Esta acción no se puede deshacer.
              </p>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteDialog(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast de notificación */}
      {showToast && (
        <Toast
          message={toastMessage}
          onClose={() => setShowToast(false)}
        />
      )}
    </div>
  );
}
