import { useEffect, useState } from 'react';
import { Search, Plus, Edit2, Trash2, X, Tag } from 'lucide-react';
import { marcasAPI, Marca } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import TableSkeleton from './TableSkeleton';

export default function Marcas() {
  const { permisos } = useAuth();
  const [marcas, setMarcas] = useState<Marca[]>([]);
  const [filteredMarcas, setFilteredMarcas] = useState<Marca[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedMarca, setSelectedMarca] = useState<Marca | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [marcaToDelete, setMarcaToDelete] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [formData, setFormData] = useState({
    nombre: '',
  });

  useEffect(() => {
    fetchMarcas();
  }, []);

  useEffect(() => {
    const filtered = marcas.filter((marca) => {
      const searchLower = searchTerm.toLowerCase();
      return marca.nombre.toLowerCase().includes(searchLower);
    });
    setFilteredMarcas(filtered);
    setCurrentPage(1);
  }, [searchTerm, marcas]);

  const fetchMarcas = async () => {
    try {
      console.log('Cargando marcas...');
      const data = await marcasAPI.getAll();
      console.log('Marcas cargadas:', data);
      setMarcas(data);
      setFilteredMarcas(data);
    } catch (error) {
      console.error('Error al cargar marcas:', error);
      alert('Error al cargar marcas: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setModalMode('create');
    setFormData({ nombre: '' });
    setShowModal(true);
  };

  const handleEdit = (marca: Marca) => {
    setModalMode('edit');
    setSelectedMarca(marca);
    setFormData({
      nombre: marca.nombre,
    });
    setShowModal(true);
  };

  const handleDelete = (id: number) => {
    setMarcaToDelete(id);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!marcaToDelete) return;

    try {
      await marcasAPI.delete(marcaToDelete);
      await fetchMarcas();
      setShowDeleteDialog(false);
      setMarcaToDelete(null);
    } catch (error) {
      console.error('Error al eliminar marca:', error);
      alert('Error al eliminar la marca');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (modalMode === 'create') {
        await marcasAPI.create(formData);
      } else if (selectedMarca) {
        await marcasAPI.update(selectedMarca.id_marca!, formData);
      }

      setShowModal(false);
      await fetchMarcas();
    } catch (error) {
      console.error('Error al guardar marca:', error);
      alert('Error al guardar la marca');
    }
  };

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentMarcas = filteredMarcas.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredMarcas.length / itemsPerPage);

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Marcas</h1>
        <p className="text-gray-600">Gestiona las marcas de productos</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar marca..."
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
          {permisos.puedeGestionarMarcas && (
            <button
              onClick={handleCreate}
              className="bg-gray-900 text-white px-6 py-2 rounded-lg hover:bg-gray-800 transition flex items-center gap-2 font-medium"
            >
              <Plus className="w-5 h-5" />
              Nueva Marca
            </button>
          )}
        </div>

        {loading ? (
          <TableSkeleton rows={itemsPerPage} columns={permisos.puedeGestionarMarcas ? 4 : 3} />
        ) : filteredMarcas.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 mb-4">No se encontraron marcas</p>
            <p className="text-sm text-gray-500 mb-4">
              Total de marcas en la base: {marcas.length}
            </p>
            {permisos.puedeGestionarMarcas && (
              <button
                onClick={handleCreate}
                className="bg-gray-900 text-white px-6 py-2 rounded-lg hover:bg-gray-800 transition inline-flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Crear Primera Marca
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">ID</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Nombre</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Fecha Creación</th>
                    {permisos.puedeGestionarMarcas && (
                      <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Acciones</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {currentMarcas.map((marca) => (
                    <tr key={marca.id_marca} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 text-sm text-gray-500">{marca.id_marca}</td>
                      <td className="py-3 px-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Tag className="w-4 h-4 text-gray-400" />
                          <span className="font-medium text-gray-900">{marca.nombre}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-700">
                        {marca.fecha_creacion ? new Date(marca.fecha_creacion).toLocaleDateString() : '-'}
                      </td>
                      {permisos.puedeGestionarMarcas && (
                        <td className="py-3 px-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => handleEdit(marca)}
                              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(marca.id_marca!)}
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
                  Mostrando {indexOfFirstItem + 1} a {Math.min(indexOfLastItem, filteredMarcas.length)} de {filteredMarcas.length} marcas
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
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">
                {modalMode === 'create' ? 'Nueva Marca' : 'Editar Marca'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre de la Marca *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    placeholder="Ej: Mazda, Toyota, Honda..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none"
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
            <p className="text-gray-600 mb-6">¿Estás seguro de que deseas eliminar esta marca?</p>
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
