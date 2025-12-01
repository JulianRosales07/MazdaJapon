import { useState, useEffect, useMemo, Fragment } from 'react';
import { Search, ArrowUpDown, Filter, RotateCcw, X } from 'lucide-react';
import { apiClient } from '../lib/apiClient';
import ProductSelect from './ProductSelect';
import { useAuth } from '../contexts/AuthContext';
import TableSkeleton from './TableSkeleton';

// Tipos
interface Repuesto {
  CB: string;
  CI?: string;
  PRODUCTO: string;
  STOCK: number;
  MARCA?: string;
  PRECIO?: number;
  [key: string]: any;
}

interface Entrada {
  ID?: number;
  N_FACTURA: string;
  PROVEEDOR: string;
  FECHA: string;
  CB: string;
  CI?: string;
  DESCRIPCION: string;
  CANTIDAD: number;
  COSTO: number;
  VALOR_VENTA?: number | null;
  SIIGO?: string;
  Columna1?: string | null;
}

export default function Entradas() {
  const { isAdmin } = useAuth();
  const [entradas, setEntradas] = useState<Entrada[]>([]);
  const [productos, setProductos] = useState<Repuesto[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [filterProveedor, setFilterProveedor] = useState('');
  const [filterFecha, setFilterFecha] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [showDevolucionModal, setShowDevolucionModal] = useState(false);
  const [devolucionData, setDevolucionData] = useState({
    n_factura: '',
    proveedor: '',
    observaciones: '',
    saldo_favor: 0,
  });
  const [formData, setFormData] = useState({
    N_FACTURA: '',
    PROVEEDOR: '',
    FECHA: new Date().toISOString().split('T')[0],
    CB: '',
    CI: '',
    DESCRIPCION: '',
    CANTIDAD: 0,
    COSTO: 0,
    VALOR_VENTA: null as number | null,
    SIIGO: 'NO',
    Columna1: null as string | null,
  });

  useEffect(() => {
    fetchProductos();
  }, []);

  useEffect(() => {
    fetchEntradas();
  }, [filterProveedor, filterFecha]);

  // Función para normalizar productos
  const normalizeProduct = (product: any): Repuesto => {
    return {
      CB: product.cb || product.CB || '',
      CI: product.ci || product.CI || '',
      PRODUCTO: product.producto || product.PRODUCTO || '',
      STOCK: product.stock || product.STOCK || 0,
    };
  };

  // Función para normalizar entradas
  const normalizeEntrada = (entrada: any): Entrada => {
    return {
      ID: entrada.id || entrada.ID,
      N_FACTURA: entrada.n_factura || entrada.N_FACTURA || '',
      PROVEEDOR: entrada.proveedor || entrada.PROVEEDOR || '',
      FECHA: entrada.fecha || entrada.FECHA || '',
      CB: entrada.cb || entrada.CB || '',
      CI: entrada.ci || entrada.CI || '',
      DESCRIPCION: entrada.descripcion || entrada.DESCRIPCION || '',
      CANTIDAD: entrada.cantidad || entrada.CANTIDAD || 0,
      COSTO: entrada.costo || entrada.COSTO || 0,
      VALOR_VENTA: entrada.valor_venta || entrada.VALOR_VENTA || null,
      SIIGO: entrada.siigo || entrada.SIIGO || 'NO',
      Columna1: entrada.columna1 || entrada.Columna1 || null,
    };
  };

  const fetchProductos = async () => {
    try {
      const response = await apiClient.getRepuestos();
      let data = response;
      if (response && typeof response === 'object' && 'data' in response) {
        data = (response as any).data;
      }
      
      if (!Array.isArray(data)) {
        console.error('Productos - respuesta no es array:', data);
        setProductos([]);
        return;
      }

      const normalized = data.map(normalizeProduct);
      setProductos(normalized);
    } catch (error) {
      console.error('Error al cargar productos:', error);
      setProductos([]);
    }
  };

  const fetchEntradas = async () => {
    try {
      setLoading(true);
      const params: { fecha_inicio?: string; fecha_fin?: string } = {};
      if (filterFecha) {
        params.fecha_inicio = filterFecha;
        params.fecha_fin = filterFecha;
      }

      const response = await apiClient.getEntradas(params);
      let data = response;
      if (response && typeof response === 'object' && 'data' in response) {
        data = (response as any).data;
      }
      
      if (!Array.isArray(data)) {
        console.error('Entradas - respuesta no es array:', data);
        setEntradas([]);
        return;
      }

      // Normalizar entradas
      const normalized = data.map(normalizeEntrada);
      
      // Filtrar por proveedor en el cliente si es necesario
      const filteredData = filterProveedor 
        ? normalized.filter(e => e.PROVEEDOR === filterProveedor)
        : normalized;
      
      setEntradas(filteredData);
    } catch (error) {
      console.error('Error al cargar entradas:', error);
      setEntradas([]);
    } finally {
      setLoading(false);
    }
  };

  const getNextFacturaNumber = (): string => {
    if (entradas.length === 0) return 'F-00001';

    // Extraer números de las facturas existentes
    const numeros = entradas
      .map(e => {
        if (!e.N_FACTURA) return 0;
        const match = String(e.N_FACTURA).match(/\d+/);
        return match ? parseInt(match[0]) : 0;
      })
      .filter(num => num > 0);

    if (numeros.length === 0) return 'F-00001';

    const maxNum = Math.max(...numeros);
    return `F-${String(maxNum + 1).padStart(5, '0')}`;
  };

  const getNextCI = (): string => {
    // Obtener todos los CIs de las entradas
    const cisEntradas = entradas
      .map(e => {
        if (!e.CI) return 0;
        const numValue = parseInt(String(e.CI));
        return isNaN(numValue) ? 0 : numValue;
      })
      .filter(num => num > 0);

    // Obtener todos los CIs de los productos
    const cisProductos = productos
      .map(p => {
        if (!p.CI) return 0;
        const numValue = parseInt(String(p.CI));
        return isNaN(numValue) ? 0 : numValue;
      })
      .filter(num => num > 0);

    // Combinar ambos arrays y obtener el máximo
    const todosCIs = [...cisEntradas, ...cisProductos];

    if (todosCIs.length === 0) return '100001';

    const maxCI = Math.max(...todosCIs);
    return String(maxCI + 1);
  };

  const handleOpenModal = () => {
    const nextFactura = getNextFacturaNumber();
    const nextCI = getNextCI();

    setFormData({
      N_FACTURA: nextFactura,
      PROVEEDOR: '',
      FECHA: new Date().toISOString().split('T')[0],
      CB: '',
      CI: nextCI,
      DESCRIPCION: '',
      CANTIDAD: 0,
      COSTO: 0,
      VALOR_VENTA: null,
      SIIGO: 'NO',
      Columna1: null,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const producto = productos.find(p => String(p.CB) === formData.CB);

      const nuevaEntrada = {
        N_FACTURA: formData.N_FACTURA,
        PROVEEDOR: formData.PROVEEDOR,
        FECHA: formData.FECHA,
        CB: formData.CB,
        CI: formData.CI || producto?.CI || null,
        DESCRIPCION: formData.DESCRIPCION || producto?.PRODUCTO || '',
        CANTIDAD: formData.CANTIDAD,
        COSTO: formData.COSTO,
        VALOR_VENTA: formData.VALOR_VENTA,
        SIIGO: formData.SIIGO,
        Columna1: formData.Columna1,
      };

      // Crear la entrada (el backend actualiza el stock automáticamente)
      await apiClient.createEntrada(nuevaEntrada);

      // Recargar productos para reflejar el cambio de stock
      await fetchProductos();

      await fetchEntradas();
      setShowModal(false);
      setFormData({
        N_FACTURA: '',
        PROVEEDOR: '',
        FECHA: new Date().toISOString().split('T')[0],
        CB: '',
        CI: '',
        DESCRIPCION: '',
        CANTIDAD: 0,
        COSTO: 0,
        VALOR_VENTA: null,
        SIIGO: 'NO',
        Columna1: null,
      });
    } catch (error) {
      console.error('Error al crear entrada:', error);
      alert('Error al registrar la entrada');
    }
  };

  const filteredEntradas = useMemo(() => {
    const filtered = entradas.filter(entrada =>
      entrada.DESCRIPCION?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(entrada.CB).includes(searchTerm) ||
      entrada.N_FACTURA?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entrada.PROVEEDOR?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return [...filtered].sort((a, b) => {
      const fechaA = a.FECHA ? new Date(a.FECHA).getTime() : 0;
      const fechaB = b.FECHA ? new Date(b.FECHA).getTime() : 0;
      return sortOrder === 'desc' ? fechaB - fechaA : fechaA - fechaB;
    });
  }, [entradas, searchTerm, sortOrder]);

  const paginatedEntradas = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredEntradas.slice(startIndex, endIndex);
  }, [filteredEntradas, currentPage, itemsPerPage]);

  const totalPages = useMemo(() => {
    return Math.ceil(filteredEntradas.length / itemsPerPage);
  }, [filteredEntradas.length, itemsPerPage]);

  const proveedores = useMemo(() => {
    const uniqueProveedores = [...new Set(entradas.map(e => e.PROVEEDOR))];
    return uniqueProveedores.filter(Boolean).sort();
  }, [entradas]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterProveedor, filterFecha]);

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Entradas de Inventario</h1>
        <p className="text-gray-600">Registra las entradas de productos al inventario</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col gap-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar por factura, proveedor, código o descripción..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 whitespace-nowrap">Mostrar:</span>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none text-sm"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
            {isAdmin && (
              <>
                <button
                  onClick={() => setShowDevolucionModal(true)}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition flex items-center gap-2 font-medium whitespace-nowrap"
                >
                  <RotateCcw className="w-5 h-5" />
                  Devolución
                </button>
                {/*    <button
                  onClick={handleOpenModal}
                  className="bg-gray-900 text-white px-6 py-2 rounded-lg hover:bg-gray-800 transition flex items-center gap-2 font-medium whitespace-nowrap"
                >
                  <Plus className="w-5 h-5" />
                  Nueva Entrada
                </button>*/}
              </>
            )}
          </div>

          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <select
                value={filterProveedor}
                onChange={(e) => setFilterProveedor(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none"
              >
                <option value="">Todos los proveedores</option>
                {proveedores.map((proveedor) => (
                  <option key={proveedor} value={proveedor}>
                    {proveedor}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <input
                type="date"
                value={filterFecha}
                onChange={(e) => setFilterFecha(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none"
                placeholder="Filtrar por fecha"
              />
            </div>
            {(filterProveedor || filterFecha) && (
              <button
                onClick={() => {
                  setFilterProveedor('');
                  setFilterFecha('');
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-900 transition"
              >
                Limpiar filtros
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                  <button
                    onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
                    className="flex items-center gap-1 hover:text-gray-900 transition-colors"
                  >
                    Fecha
                    <ArrowUpDown className="w-4 h-4" />
                  </button>
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">N° Factura</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Proveedor</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">CB</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Descripción</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Cantidad</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Costo</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">SIIGO</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="p-0">
                    <TableSkeleton rows={itemsPerPage} columns={8} />
                  </td>
                </tr>
              ) : filteredEntradas.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-gray-500">
                    No se encontraron entradas
                  </td>
                </tr>
              ) : (
                paginatedEntradas.map((entrada, index) => (
                  <tr key={entrada.ID || `entrada-${entrada.N_FACTURA}-${entrada.CB}-${index}`} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-sm text-gray-700">
                      {entrada.FECHA ? new Date(entrada.FECHA).toLocaleDateString() : '-'}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-900 font-medium">{entrada.N_FACTURA}</td>
                    <td className="py-3 px-4 text-sm text-gray-700">{entrada.PROVEEDOR}</td>
                    <td className="py-3 px-4 text-sm text-gray-900 font-mono">{entrada.CB}</td>
                    <td className="py-3 px-4 text-sm text-gray-700">{entrada.DESCRIPCION}</td>
                    <td className="py-3 px-4 text-sm">
                      <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">
                        +{entrada.CANTIDAD}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-700">
                      ${Number(entrada.COSTO).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-sm">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${entrada.SIIGO === 'SI'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-100 text-gray-700'
                        }`}>
                        {entrada.SIIGO || 'NO'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        {filteredEntradas.length > 0 && (
          <div className="mt-6 flex items-center justify-between border-t pt-4">
            <div className="text-sm text-gray-600">
              Mostrando {((currentPage - 1) * itemsPerPage) + 1} a {Math.min(currentPage * itemsPerPage, filteredEntradas.length)} de {filteredEntradas.length} entradas
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 text-sm text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                Anterior
              </button>

              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(page => {
                    if (totalPages <= 7) return true;
                    if (page === 1 || page === totalPages) return true;
                    if (page >= currentPage - 1 && page <= currentPage + 1) return true;
                    return false;
                  })
                  .map((page, index, array) => {
                    const prevPage = array[index - 1];
                    const showEllipsis = prevPage && page - prevPage > 1;

                    return (
                      <Fragment key={`page-${page}`}>
                        {showEllipsis && (
                          <span className="px-2 text-gray-500 text-sm">...</span>
                        )}
                        <button
                          onClick={() => setCurrentPage(page)}
                          className={`min-w-[32px] h-8 text-sm rounded transition ${currentPage === page
                            ? 'bg-gray-900 text-white font-medium'
                            : 'text-gray-700 hover:bg-gray-100'
                            }`}
                        >
                          {page}
                        </button>
                      </Fragment>
                    );
                  })}
              </div>

              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 text-sm text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[100]"
        >
          <div
            className="bg-white rounded-lg shadow-xl w-full max-w-md"
          >
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Nueva Entrada</h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      N° Factura *
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        value={formData.N_FACTURA}
                        readOnly
                        className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 font-medium cursor-not-allowed"
                        placeholder="F-12345"
                      />
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded font-medium">
                          Auto
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Proveedor *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.PROVEEDOR}
                      onChange={(e) => setFormData({ ...formData, PROVEEDOR: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none"
                      placeholder="FLORIDA"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.FECHA}
                    onChange={(e) => setFormData({ ...formData, FECHA: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Producto (CB) *
                  </label>
                  <ProductSelect
                    productos={productos as any}
                    value={formData.CB}
                    onChange={(cb, producto) => {
                      setFormData({
                        ...formData,
                        CB: cb,
                        // Mantener el CI autogenerado, no usar el del producto
                        DESCRIPCION: producto?.PRODUCTO || '',
                      });
                    }}
                    placeholder="Seleccionar producto"
                    label="Producto"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    CI
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={formData.CI}
                      readOnly
                      className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 font-medium cursor-not-allowed"
                      placeholder="Código interno"
                    />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded font-medium">
                        Auto
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Descripción *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.DESCRIPCION}
                    onChange={(e) => setFormData({ ...formData, DESCRIPCION: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none"
                    placeholder="Descripción del producto"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cantidad *
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={formData.CANTIDAD}
                      onChange={(e) => setFormData({ ...formData, CANTIDAD: parseInt(e.target.value) || 0 })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Costo *
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      value={formData.COSTO}
                      onChange={(e) => setFormData({ ...formData, COSTO: parseFloat(e.target.value) || 0 })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Valor Venta
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.VALOR_VENTA || ''}
                      onChange={(e) => setFormData({ ...formData, VALOR_VENTA: e.target.value ? parseFloat(e.target.value) : null })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      SIIGO
                    </label>
                    <select
                      value={formData.SIIGO}
                      onChange={(e) => setFormData({ ...formData, SIIGO: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none"
                    >
                      <option value="SI">SI</option>
                      <option value="NO">NO</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="submit"
                  className="flex-1 bg-gray-900 text-white py-2 px-4 rounded-lg hover:bg-gray-800 transition font-medium"
                >
                  Registrar Entrada
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition font-medium"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Devolución a Proveedor */}
      {showDevolucionModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[100]"
          onClick={() => setShowDevolucionModal(false)}
        >
          <div
            className="bg-white rounded-lg shadow-xl w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Devolución a Proveedor</h2>
              <button onClick={() => setShowDevolucionModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={async (e) => {
              e.preventDefault();
              try {
                // Crear registro de devolución
                const nuevaDevolucion = {
                  N_FACTURA: devolucionData.n_factura,
                  PROVEEDOR: devolucionData.proveedor,
                  FECHA: new Date().toISOString().split('T')[0],
                  CB: '', // No aplica para devoluciones
                  CI: '',
                  DESCRIPCION: `DEVOLUCIÓN A PROVEEDOR - ${devolucionData.proveedor}`,
                  CANTIDAD: 0, // No aplica cantidad de producto
                  COSTO: devolucionData.saldo_favor,
                  VALOR_VENTA: null,
                  SIIGO: 'NO',
                  Columna1: devolucionData.observaciones,
                };

                // Crear la entrada de devolución
                await apiClient.createEntrada(nuevaDevolucion);

                await fetchEntradas();
                setShowDevolucionModal(false);
                setDevolucionData({ n_factura: '', proveedor: '', observaciones: '', saldo_favor: 0 });
                alert('Devolución registrada exitosamente');
              } catch (error) {
                console.error('Error al registrar devolución:', error);
                alert('Error al registrar la devolución');
              }
            }} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    N° Factura *
                  </label>
                  <input
                    type="text"
                    required
                    value={devolucionData.n_factura}
                    onChange={(e) => setDevolucionData({ ...devolucionData, n_factura: e.target.value })}
                    placeholder="Número de factura de devolución"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Proveedor *
                  </label>
                  <input
                    type="text"
                    required
                    value={devolucionData.proveedor}
                    onChange={(e) => setDevolucionData({ ...devolucionData, proveedor: e.target.value })}
                    placeholder="Nombre del proveedor"
                    list="proveedores-devolucion-list"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                  />
                  <datalist id="proveedores-devolucion-list">
                    {proveedores.map((prov, idx) => (
                      <option key={idx} value={prov} />
                    ))}
                  </datalist>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Saldo a Favor *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={devolucionData.saldo_favor || ''}
                    onChange={(e) => setDevolucionData({ ...devolucionData, saldo_favor: parseFloat(e.target.value) || 0 })}
                    placeholder="0.00"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Observaciones *
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={devolucionData.observaciones}
                    onChange={(e) => setDevolucionData({ ...devolucionData, observaciones: e.target.value })}
                    placeholder="Detalles de la devolución..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none resize-none"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition font-medium"
                >
                  Registrar Devolución
                </button>
                <button
                  type="button"
                  onClick={() => setShowDevolucionModal(false)}
                  className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition font-medium"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
