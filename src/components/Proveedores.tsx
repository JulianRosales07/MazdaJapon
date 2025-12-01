import { useEffect, useState } from 'react';
import { Search, Plus, Edit2, Trash2, X, Building2, DollarSign, Hash } from 'lucide-react';
import { apiClient } from '../lib/apiClient';
import type { Proveedor, Repuesto } from '../lib/types';
import { useAuth } from '../contexts/AuthContext';
import TableSkeleton from './TableSkeleton';

export default function Proveedores() {
  const { permisos } = useAuth();
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [filteredProveedores, setFilteredProveedores] = useState<Proveedor[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedProveedor, setSelectedProveedor] = useState<Proveedor | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [proveedorToDelete, setProveedorToDelete] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [codigosInternos, setCodigosInternos] = useState<string[]>([]);
  const [ciSearchTerm, setCiSearchTerm] = useState('');
  const [showCiDropdown, setShowCiDropdown] = useState(false);
  const [formData, setFormData] = useState<Omit<Proveedor, 'id_proveedor' | 'fecha_creacion' | 'fecha_actualizacion'>>({
    ci: '',
    cp: '',
    nombre_proveedor: '',
    costo: 0,
  });

  useEffect(() => {
    fetchProveedores();
    fetchCodigosInternos();
  }, []);

  useEffect(() => {
    const filtered = proveedores.filter((proveedor) => {
      const searchLower = searchTerm.toLowerCase();
      return (
        proveedor.nombre_proveedor.toLowerCase().includes(searchLower) ||
        (proveedor.cp || '').toLowerCase().includes(searchLower) ||
        (proveedor.ci || '').toLowerCase().includes(searchLower)
      );
    });
    setFilteredProveedores(filtered);
    setCurrentPage(1);
  }, [searchTerm, proveedores]);

  // Normalizar proveedores
  const normalizeProveedor = (prov: any): Proveedor => {
    return {
      id_proveedor: prov.id_proveedor || prov.ID_PROVEEDOR || 0,
      ci: prov.ci || prov.CI || null,
      cp: prov.cp || prov.CP || '',
      nombre_proveedor: prov.nombre_proveedor || prov.NOMBRE_PROVEEDOR || '',
      costo: prov.costo || prov.COSTO || 0,
      fecha_creacion: prov.fecha_creacion,
      fecha_actualizacion: prov.fecha_actualizacion,
      usuario_creacion: prov.usuario_creacion,
      activo: prov.activo,
    };
  };

  const fetchProveedores = async () => {
    try {
      const response = await apiClient.getProveedores();
      let data = response;
      if (response && typeof response === 'object' && 'data' in response) {
        data = (response as any).data;
      }
      
      if (!Array.isArray(data)) {
        setProveedores([]);
        setFilteredProveedores([]);
        setLoading(false);
        return;
      }

      const normalized = data.map(normalizeProveedor);
      setProveedores(normalized);
      setFilteredProveedores(normalized);
    } catch (error) {
      console.error('Error al cargar proveedores:', error);
      setProveedores([]);
      setFilteredProveedores([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCodigosInternos = async () => {
    try {
      const response = await apiClient.getRepuestos();
      let data = response;
      if (response && typeof response === 'object' && 'data' in response) {
        data = (response as any).data;
      }
      
      if (!Array.isArray(data)) {
        setCodigosInternos([]);
        return;
      }

      const productos = data;
      const codigos = productos
        .map(p => p.ci || p.CI)
        .filter((ci): ci is string => ci !== null && ci !== undefined && ci !== '')
        .filter((ci, index, self) => self.indexOf(ci) === index)
        .sort();
      setCodigosInternos(codigos);
    } catch (error) {
      console.error('Error al cargar códigos internos:', error);
    }
  };

  const handleCreate = () => {
    setModalMode('create');
    setFormData({ ci: '', cp: '', nombre_proveedor: '', costo: 0 });
    setCiSearchTerm('');
    setShowModal(true);
  };

  const handleEdit = (proveedor: Proveedor) => {
    setModalMode('edit');
    setSelectedProveedor(proveedor);
    setFormData({
      ci: proveedor.ci || '',
      cp: proveedor.cp,
      nombre_proveedor: proveedor.nombre_proveedor,
      costo: proveedor.costo || 0,
    });
    setCiSearchTerm(proveedor.ci || '');
    setShowModal(true);
  };

  const handleDelete = (id: number) => {
    setProveedorToDelete(id);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!proveedorToDelete) return;

    try {
      await apiClient.deleteProveedor(proveedorToDelete);
      await fetchProveedores();
      setShowDeleteDialog(false);
      setProveedorToDelete(null);
    } catch (error) {
      console.error('Error al eliminar proveedor:', error);
      alert('Error al eliminar el proveedor');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (modalMode === 'create') {
        await apiClient.createProveedor(formData);
      } else if (selectedProveedor) {
        await apiClient.updateProveedor(selectedProveedor.id_proveedor!, formData);
      }

      setShowModal(false);
      await fetchProveedores();
    } catch (error) {
      console.error('Error al guardar proveedor:', error);
      alert('Error al guardar el proveedor');
    }
  };

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentProveedores = filteredProveedores.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredProveedores.length / itemsPerPage);

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Proveedores</h1>
        <p className="text-gray-600">Gestiona los proveedores de productos</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar proveedor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">Mostrar:</label>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
          {permisos.puedeGestionarProveedores && (
            <button
              onClick={handleCreate}
              className="bg-gray-900 text-white px-6 py-2 rounded-lg hover:bg-gray-800 transition flex items-center gap-2 font-medium"
            >
              <Plus className="w-5 h-5" />
              Nuevo Proveedor
            </button>
          )}
        </div>

        {loading ? (
          <TableSkeleton rows={itemsPerPage} columns={permisos.puedeGestionarProveedores ? 5 : 4} />
        ) : filteredProveedores.length === 0 ? (
          <div className="text-center py-12 text-gray-600">No se encontraron proveedores</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">CP</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Nombre Proveedor</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">CI</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Costo</th>
                    {permisos.puedeGestionarProveedores && (
                      <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Acciones</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {currentProveedores.map((proveedor) => (
                    <tr key={proveedor.id_proveedor} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Hash className="w-4 h-4 text-gray-400" />
                          <span className="font-medium text-gray-900">{proveedor.cp}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-gray-400" />
                          <span className="font-medium text-gray-900">{proveedor.nombre_proveedor}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-700">{proveedor.ci || '-'}</td>
                      <td className="py-3 px-4 text-sm text-gray-700">
                        {proveedor.costo ? (
                          <div className="flex items-center gap-1">
                            <DollarSign className="w-3 h-3 text-gray-400" />
                            {Number(proveedor.costo).toLocaleString('es-CO')}
                          </div>
                        ) : '-'}
                      </td>
                      {permisos.puedeGestionarProveedores && (
                        <td className="py-3 px-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => handleEdit(proveedor)}
                              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(proveedor.id_proveedor!)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="mt-6 flex items-center justify-between text-sm text-gray-600">
                <span>
                  Mostrando {indexOfFirstItem + 1} a {Math.min(indexOfLastItem, filteredProveedores.length)} de {filteredProveedores.length} proveedores
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-3 py-1 text-gray-700 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Anterior
                  </button>
                  <span className="px-3 py-1">{currentPage} de {totalPages}</span>
                  <button
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 text-gray-700 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Siguiente
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal Crear/Editar */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">
                {modalMode === 'create' ? 'Nuevo Proveedor' : 'Editar Proveedor'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    CP (Código Proveedor) *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.cp}
                    onChange={(e) => setFormData({ ...formData, cp: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none"
                    placeholder="CP-0001"
                  />
                </div>

                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    CI (Código Interno)
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={ciSearchTerm}
                      onChange={(e) => {
                        setCiSearchTerm(e.target.value);
                        setShowCiDropdown(true);
                      }}
                      onFocus={() => setShowCiDropdown(true)}
                      onBlur={() => setTimeout(() => setShowCiDropdown(false), 200)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none"
                      placeholder="Buscar código interno..."
                    />
                    <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  </div>
                  {showCiDropdown && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      <button
                        type="button"
                        onClick={() => {
                          setFormData({ ...formData, ci: '' });
                          setCiSearchTerm('');
                          setShowCiDropdown(false);
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-gray-50 text-gray-500 text-sm border-b"
                      >
                        Sin código interno
                      </button>
                      {codigosInternos
                        .filter(ci => ci.toLowerCase().includes(ciSearchTerm.toLowerCase()))
                        .map((ci) => (
                          <button
                            key={ci}
                            type="button"
                            onClick={() => {
                              setFormData({ ...formData, ci });
                              setCiSearchTerm(ci);
                              setShowCiDropdown(false);
                            }}
                            className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm"
                          >
                            {ci}
                          </button>
                        ))}
                      {codigosInternos.filter(ci => ci.toLowerCase().includes(ciSearchTerm.toLowerCase())).length === 0 && (
                        <div className="px-4 py-2 text-gray-500 text-sm">
                          No se encontraron códigos
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre Proveedor *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.nombre_proveedor}
                    onChange={(e) => setFormData({ ...formData, nombre_proveedor: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none"
                    placeholder="Nombre del proveedor"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Costo (Precio de Compra)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.costo}
                    onChange={(e) => setFormData({ ...formData, costo: Number(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition font-medium"
                >
                  {modalMode === 'create' ? 'Crear' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Eliminar */}
      {showDeleteDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Confirmar Eliminación</h3>
            <p className="text-gray-600 mb-6">¿Estás seguro de que deseas eliminar este proveedor?</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteDialog(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
