import { useState, useEffect, useMemo } from 'react';
import { Search, Plus, Eye, Trash2, X, RotateCcw, ArrowUpDown } from 'lucide-react';
import { repuestosAPI, Repuesto, salidasAPI, Salida } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';

export default function Salidas() {
  const { isAdmin } = useAuth();
  const [salidas, setSalidas] = useState<Salida[]>([]);
  const [productos, setProductos] = useState<Repuesto[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedSalida, setSelectedSalida] = useState<Salida | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [salidaToDelete, setSalidaToDelete] = useState<number | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc'); // desc = más reciente primero
  const [selectedMonth, setSelectedMonth] = useState<string>(''); // Filtro por mes (formato: YYYYMM)
  const [showDevolucionModal, setShowDevolucionModal] = useState(false);
  const [devolucionData, setDevolucionData] = useState({
    n_factura: 0,
    cantidad: 0,
    motivo: '',
    observaciones: '',
  });
  const [formData, setFormData] = useState({
    n_factura: 0,
    fecha: parseInt(new Date().toISOString().slice(0, 10).replace(/-/g, '')),
    cb: 0,
    ci: 0,
    descripcion: '',
    valor: 0,
    cantidad: 0,
    columna1: '',
  });
  const [isVentaExterna, setIsVentaExterna] = useState(false);

  useEffect(() => {
    fetchProductos();
    fetchSalidas();
  }, []);

  const fetchProductos = async () => {
    try {
      const data = await repuestosAPI.getAll();
      setProductos(data);
    } catch (error) {
      console.error('Error al cargar productos:', error);
    }
  };

  const fetchSalidas = async () => {
    try {
      setLoading(true);
      const data = await salidasAPI.getAll();
      console.log('Salidas cargadas:', data.length);
      if (data.length > 0) {
        console.log('Ejemplo de fechas:', data.slice(0, 5).map(s => ({
          n_factura: s.n_factura,
          fecha: s.fecha,
          tipo: typeof s.fecha
        })));
      }
      setSalidas(data);
    } catch (error) {
      console.error('Error al cargar salidas:', error);
    } finally {
      setLoading(false);
    }
  };

  const getNextCI = (): number => {
    // Obtener todos los CIs de las salidas
    const cisSalidas = salidas
      .map(s => s.ci || 0)
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
    const todosCIs = [...cisSalidas, ...cisProductos];
    
    if (todosCIs.length === 0) return 100001;
    
    return Math.max(...todosCIs) + 1;
  };

  const getNextCB = (): number => {
    // Obtener todos los CBs de las salidas
    const cbsSalidas = salidas
      .map(s => s.cb || 0)
      .filter(num => num > 0);

    // Obtener todos los CBs de los productos
    const cbsProductos = productos
      .map(p => {
        const numValue = parseInt(String(p.CB));
        return isNaN(numValue) ? 0 : numValue;
      })
      .filter(num => num > 0);

    // Combinar ambos arrays y obtener el máximo
    const todosCBs = [...cbsSalidas, ...cbsProductos];
    
    if (todosCBs.length === 0) return 100001;
    
    return Math.max(...todosCBs) + 1;
  };

  const handleCreate = () => {
    setModalMode('create');

    // Generar número de factura automáticamente (último + 1)
    // Filtrar solo facturas con números razonables (< 100000) para evitar números de fecha u otros
    const facturasValidas = salidas
      .map(s => s.n_factura || 0)
      .filter(num => num > 0 && num < 100000);
    
    const maxFactura = facturasValidas.length > 0
      ? Math.max(...facturasValidas)
      : 0;

    const nextCI = getNextCI();
    const nextCB = getNextCB();

    setFormData({
      n_factura: maxFactura + 1,
      fecha: parseInt(new Date().toISOString().slice(0, 10).replace(/-/g, '')),
      cb: nextCB,
      ci: nextCI,
      descripcion: '',
      valor: 0,
      cantidad: 0,
      columna1: '',
    });
    setIsVentaExterna(false);
    setShowModal(true);
  };

  const handleEdit = (salida: Salida) => {
    setModalMode('edit');
    setSelectedSalida(salida);
    setFormData({
      n_factura: salida.n_factura,
      fecha: salida.fecha,
      cb: salida.cb,
      ci: salida.ci || 0,
      descripcion: salida.descripcion,
      valor: salida.valor,
      cantidad: salida.cantidad,
      columna1: salida.columna1 || '',
    });
    setIsVentaExterna(false);
    setShowModal(true);
  };

  const handleDelete = (n_factura: number) => {
    if (!n_factura) {
      return;
    }
    setSalidaToDelete(n_factura);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!salidaToDelete) return;

    try {
      await salidasAPI.delete(salidaToDelete);
      await fetchSalidas();
      setShowDeleteModal(false);
      setSalidaToDelete(null);
    } catch (error) {
      console.error('Error al eliminar salida:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (modalMode === 'create') {
        // Buscar el producto en el inventario por CB
        const producto = productos.find(p => String(p.CB) === String(formData.cb));
        
        if (producto) {
          // Verificar que hay suficiente stock
          const stockActual = parseFloat(String(producto.STOCK)) || 0;
          const cantidadSalida = Math.abs(formData.cantidad);
          
          if (stockActual < cantidadSalida) {
            alert(`Stock insuficiente. Stock actual: ${stockActual}, Cantidad solicitada: ${cantidadSalida}`);
            return;
          }
          
          // Crear la salida
          await salidasAPI.create(formData);
          
          // Actualizar el stock del producto (restar la cantidad)
          const nuevoStock = stockActual - cantidadSalida;
          await repuestosAPI.update(String(producto.CB), {
            ...producto,
            STOCK: nuevoStock
          });
          
          // Recargar productos para reflejar el cambio
          await fetchProductos();
        } else {
          // Si no existe el producto, crear la salida sin actualizar stock
          await salidasAPI.create(formData);
        }
      } else if (selectedSalida) {
        // En modo edición, solo actualizar la salida sin modificar stock
        await salidasAPI.update(selectedSalida.n_factura, formData);
      }

      setShowModal(false);
      await fetchSalidas();
    } catch (error) {
      console.error('Error al guardar salida:', error);
      alert('Error al guardar la salida');
    }
  };

  // Obtener meses disponibles de las salidas
  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    salidas.forEach(salida => {
      if (!salida.fecha) return;

      try {
        const date = new Date(salida.fecha);
        if (!isNaN(date.getTime())) {
          const year = date.getFullYear();
          const month = date.getMonth() + 1; // 1-12
          const yearMonth = `${year}-${String(month).padStart(2, '0')}`; // YYYY-MM
          months.add(yearMonth);
        }
      } catch (error) {
        console.error('Error procesando fecha:', salida.fecha);
      }
    });

    return Array.from(months).sort().reverse(); // Más reciente primero
  }, [salidas]);

  const filteredSalidas = useMemo(() => {
    // Primero filtrar por búsqueda
    let filtered = salidas.filter(salida =>
      salida.descripcion.toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(salida.cb).includes(searchTerm) ||
      String(salida.n_factura).includes(searchTerm)
    );

    // Filtrar por mes si hay uno seleccionado
    if (selectedMonth) {
      filtered = filtered.filter(salida => {
        if (!salida.fecha) return false;
        try {
          const date = new Date(salida.fecha);
          const year = date.getFullYear();
          const month = date.getMonth() + 1;
          const yearMonth = `${year}-${String(month).padStart(2, '0')}`;
          return yearMonth === selectedMonth;
        } catch {
          return false;
        }
      });
    }

    // Luego ordenar por fecha
    const sorted = [...filtered].sort((a, b) => {
      const fechaA = a.fecha ? new Date(a.fecha).getTime() : 0;
      const fechaB = b.fecha ? new Date(b.fecha).getTime() : 0;

      const comparison = fechaB - fechaA;
      return sortOrder === 'desc' ? comparison : -comparison;
    });

    return sorted;
  }, [salidas, searchTerm, selectedMonth, sortOrder]);

  const totalPages = Math.ceil(filteredSalidas.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentSalidas = filteredSalidas.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const formatFecha = (fecha: number | string | null | undefined) => {
    if (!fecha) return '-';

    const str = fecha.toString();

    // Si es formato ISO (contiene 'T' o '-')
    if (str.includes('T') || str.includes('-')) {
      try {
        const date = new Date(str);
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
      } catch {
        return str;
      }
    }

    // Si es formato numérico AAAAMMDD
    if (str.length === 8) {
      return `${str.slice(6, 8)}/${str.slice(4, 6)}/${str.slice(0, 4)}`;
    }

    return str;
  };

  const formatPrecio = (valor: number) => {
    const rounded = Math.round(valor);
    return rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Salidas de Inventario</h1>
        <p className="text-gray-600">Registra las salidas de productos del inventario</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col gap-4 mb-6">
          {/* Primera fila: Búsqueda y filtro de mes */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar por factura, código o descripción..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 whitespace-nowrap">Filtrar por mes:</span>
              <select
                value={selectedMonth}
                onChange={(e) => {
                  setSelectedMonth(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none text-sm min-w-[150px]"
              >
                <option value="">Todos los meses</option>
                {availableMonths.map(month => {
                  const [year, monthNum] = month.split('-');
                  const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
                  const monthIndex = parseInt(monthNum, 10) - 1;
                  const monthName = monthNames[monthIndex] || `Mes ${monthNum}`;

                  return (
                    <option key={month} value={month}>
                      {monthName} {year}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          {/* Segunda fila: Controles */}
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Mostrar:</span>
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
            <div className="flex-1"></div>
            {isAdmin && (
              <>
                <button
                  onClick={() => setShowDevolucionModal(true)}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition flex items-center gap-2 font-medium"
                >
                  <RotateCcw className="w-5 h-5" />
                  Devolución
                </button>
                <button
                  onClick={handleCreate}
                  className="bg-gray-900 text-white px-6 py-2 rounded-lg hover:bg-gray-800 transition flex items-center gap-2 font-medium"
                >
                  <Plus className="w-5 h-5" />
                  Nueva Salida
                </button>
              </>
            )}
          </div>
        </div>

        {/* Indicador de filtros activos */}
        {(selectedMonth || searchTerm) && !loading && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-blue-800">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clipRule="evenodd" />
                </svg>
                <span className="font-medium">
                  Mostrando {filteredSalidas.length} de {salidas.length} salidas
                  {selectedMonth && (() => {
                    const [year, monthNum] = selectedMonth.split('-');
                    const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
                    const monthName = monthNames[parseInt(monthNum, 10) - 1];
                    return ` - ${monthName} ${year}`;
                  })()}
                </span>
              </div>
              <button
                onClick={() => {
                  setSelectedMonth('');
                  setSearchTerm('');
                  setCurrentPage(1);
                }}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
              >
                <X className="w-3 h-3" />
                Limpiar filtros
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="text-center py-12 text-gray-600">Cargando salidas...</div>
        ) : filteredSalidas.length === 0 ? (
          <div className="text-center py-12 text-gray-600">
            {selectedMonth || searchTerm ? 'No se encontraron salidas con los filtros aplicados' : 'No se encontraron salidas'}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">N° Factura</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                      <button
                        onClick={() => {
                          const newOrder = sortOrder === 'desc' ? 'asc' : 'desc';
                          setSortOrder(newOrder);
                          console.log('Orden cambiado a:', newOrder);
                        }}
                        className="flex items-center gap-1 hover:text-gray-900 transition-colors"
                      >
                        Fecha
                        <ArrowUpDown className="w-4 h-4" />
                        <span className="text-xs ml-1">({sortOrder === 'desc' ? '↓' : '↑'})</span>
                      </button>
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">CI</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Descripción</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Cantidad</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 whitespace-nowrap">Valor</th>
                    {isAdmin && (
                      <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700 whitespace-nowrap min-w-[120px]">Acciones</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {currentSalidas.map((salida, index) => {
                    const valorNum = Number(salida.valor || 0);
                    const cantidadNum = Number(salida.cantidad || 0);

                    return (
                      <tr key={`${salida.n_factura}-${index}`} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4 text-sm text-gray-900 font-medium">{salida.n_factura}</td>
                        <td className="py-3 px-4 text-sm text-gray-700">{formatFecha(salida.fecha)}</td>
                        <td className="py-3 px-4 text-sm text-gray-900 font-medium">{salida.ci || '-'}</td>
                        <td className="py-3 px-4 text-sm text-gray-700">{salida.descripcion}</td>
                        <td className="py-3 px-4 text-sm">
                          <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-medium">
                            {Math.abs(cantidadNum)}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-900 whitespace-nowrap">
                          ${formatPrecio(valorNum)}
                        </td>
                        {isAdmin && (
                          <td className="py-3 px-4 text-right whitespace-nowrap">
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => handleEdit(salida)}
                                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                              >
                              <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(salida.n_factura)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Paginación */}
            {totalPages > 1 && (
              <div className="mt-6 flex items-center justify-between text-sm text-gray-600">
                <span>
                  Mostrando {startIndex + 1} a {Math.min(endIndex, filteredSalidas.length)} de {filteredSalidas.length} productos
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-3 py-1 text-gray-700 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Anterior
                  </button>

                  <div className="flex gap-1">
                    {currentPage > 2 && (
                      <>
                        <button
                          onClick={() => handlePageChange(1)}
                          className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-100"
                        >
                          1
                        </button>
                        {currentPage > 3 && <span className="w-8 h-8 flex items-center justify-center">...</span>}
                      </>
                    )}

                    {Array.from({ length: Math.min(3, totalPages) }, (_, i) => {
                      let pageNum;
                      if (currentPage === 1) {
                        pageNum = i + 1;
                      } else if (currentPage === totalPages) {
                        pageNum = totalPages - 2 + i;
                      } else {
                        pageNum = currentPage - 1 + i;
                      }

                      if (pageNum < 1 || pageNum > totalPages) return null;

                      return (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          className={`w-8 h-8 flex items-center justify-center rounded ${currentPage === pageNum
                            ? 'bg-gray-900 text-white'
                            : 'hover:bg-gray-100'
                            }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}

                    {currentPage < totalPages - 1 && (
                      <>
                        {currentPage < totalPages - 2 && <span className="w-8 h-8 flex items-center justify-center">...</span>}
                        <button
                          onClick={() => handlePageChange(totalPages)}
                          className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-100"
                        >
                          {totalPages}
                        </button>
                      </>
                    )}
                  </div>

                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
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

      {/* Modal de Devolución */}
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
              <h2 className="text-xl font-bold text-gray-900">Devolución de Cliente</h2>
              <button onClick={() => setShowDevolucionModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={async (e) => {
              e.preventDefault();
              try {
                // Buscar la salida original
                const salidaOriginal = salidas.find(s => s.n_factura === devolucionData.n_factura);
                if (!salidaOriginal) {
                  alert('No se encontró la factura especificada');
                  return;
                }

                // Buscar el producto en el inventario por CB
                const producto = productos.find(p => String(p.CB) === String(salidaOriginal.cb));

                // Crear una nueva entrada (devolución) con cantidad negativa para restar
                const nuevaSalida = {
                  n_factura: Math.max(...salidas.map(s => s.n_factura || 0)) + 1,
                  fecha: parseInt(new Date().toISOString().slice(0, 10).replace(/-/g, '')),
                  cb: salidaOriginal.cb,
                  ci: salidaOriginal.ci,
                  descripcion: `DEVOLUCIÓN - ${salidaOriginal.descripcion}`,
                  valor: salidaOriginal.valor,
                  cantidad: -Math.abs(devolucionData.cantidad), // Negativo para indicar devolución
                  columna1: `Motivo: ${devolucionData.motivo}. ${devolucionData.observaciones}`,
                };

                await salidasAPI.create(nuevaSalida);

                // Si existe el producto, actualizar el stock (sumar la cantidad devuelta)
                if (producto) {
                  const stockActual = parseFloat(String(producto.STOCK)) || 0;
                  const cantidadDevuelta = Math.abs(devolucionData.cantidad);
                  const nuevoStock = stockActual + cantidadDevuelta;
                  
                  await repuestosAPI.update(String(producto.CB), {
                    ...producto,
                    STOCK: nuevoStock
                  });
                  
                  // Recargar productos para reflejar el cambio
                  await fetchProductos();
                }

                await fetchSalidas();
                setShowDevolucionModal(false);
                setDevolucionData({ n_factura: 0, cantidad: 0, motivo: '', observaciones: '' });
                alert('Devolución registrada exitosamente');
              } catch (error) {
                console.error('Error al registrar devolución:', error);
                alert('Error al registrar la devolución');
              }
            }} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    N° Factura Original *
                  </label>
                  <input
                    type="number"
                    required
                    value={devolucionData.n_factura || ''}
                    onChange={(e) => setDevolucionData({ ...devolucionData, n_factura: parseInt(e.target.value) || 0 })}
                    placeholder="Ingresa el número de factura"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cantidad a Devolver *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={devolucionData.cantidad || ''}
                    onChange={(e) => setDevolucionData({ ...devolucionData, cantidad: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Motivo de Devolución *
                  </label>
                  <select
                    required
                    value={devolucionData.motivo}
                    onChange={(e) => setDevolucionData({ ...devolucionData, motivo: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                  >
                    <option value="">Selecciona un motivo</option>
                    <option value="Producto defectuoso">Producto defectuoso</option>
                    <option value="No cumple expectativas">No cumple expectativas</option>
                    <option value="Producto incorrecto">Producto incorrecto</option>
                    <option value="Cambio de repuesto">Cambio de repuesto</option>
                    <option value="Otro">Otro</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Observaciones
                  </label>
                  <textarea
                    rows={3}
                    value={devolucionData.observaciones}
                    onChange={(e) => setDevolucionData({ ...devolucionData, observaciones: e.target.value })}
                    placeholder="Detalles adicionales..."
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

      {/* Modal de Confirmación de Eliminación */}
      {showDeleteModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[100]"
          onClick={() => setShowDeleteModal(false)}
        >
          <div
            className="bg-white rounded-lg shadow-xl w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-2">Confirmar Eliminación</h3>
              <p className="text-gray-600 mb-6">
                ¿Estás seguro de que deseas eliminar la salida con factura N° {salidaToDelete}? Esta acción no se puede deshacer.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={confirmDelete}
                  className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition font-medium"
                >
                  Eliminar
                </button>
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition font-medium"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[100]"
        >
          <div
            className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">
                {modalMode === 'create' ? 'Nueva Salida' : 'Ver salida'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    N° Factura *
                  </label>
                  <input
                    type="number"
                    required
                    value={formData.n_factura || ''}
                    onChange={(e) => setFormData({ ...formData, n_factura: parseInt(e.target.value) || 0 })}
                    disabled={modalMode === 'edit'}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none disabled:bg-gray-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.fecha ? new Date(formData.fecha.toString().slice(0, 4) + '-' + formData.fecha.toString().slice(4, 6) + '-' + formData.fecha.toString().slice(6, 8)).toISOString().split('T')[0] : ''}
                    onChange={(e) => {
                      const dateStr = e.target.value.replace(/-/g, ''); 
                      setFormData({ ...formData, fecha: parseInt(dateStr) });
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    CI {!isVentaExterna && '*'}
                  </label>
                  <input
                    type="number"
                    required={!isVentaExterna}
                    value={formData.ci || ''}
                    onChange={(e) => {
                      const ciValue = parseInt(e.target.value) || 0;
                      
                      // Buscar producto por CI
                      const productoEncontrado = productos.find(p => {
                        const productCI = parseInt(String(p.CI));
                        return !isNaN(productCI) && productCI === ciValue;
                      });

                      if (productoEncontrado) {
                        // Autocompletar todos los campos
                        setFormData({
                          ...formData,
                          ci: ciValue,
                          cb: parseInt(String(productoEncontrado.CB)) || 0,
                          descripcion: productoEncontrado.PRODUCTO || '',
                          valor: parseFloat(String(productoEncontrado.PRECIO)) || 0,
                        });
                      } else {
                        setFormData({ ...formData, ci: ciValue });
                      }
                    }}
                    disabled={isVentaExterna}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none disabled:bg-gray-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    CB {!isVentaExterna && '*'}
                  </label>
                  <input
                    type="number"
                    required={!isVentaExterna}
                    value={formData.cb || ''}
                    onChange={(e) => {
                      const cbValue = parseInt(e.target.value) || 0;
                      
                      // Buscar producto por CB
                      const productoEncontrado = productos.find(p => String(p.CB) === String(cbValue));

                      if (productoEncontrado) {
                        // Autocompletar todos los campos
                        setFormData({
                          ...formData,
                          cb: cbValue,
                          ci: parseInt(String(productoEncontrado.CI)) || 0,
                          descripcion: productoEncontrado.PRODUCTO || '',
                          valor: parseFloat(String(productoEncontrado.PRECIO)) || 0,
                        });
                      } else {
                        setFormData({ ...formData, cb: cbValue });
                      }
                    }}
                    disabled={isVentaExterna}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none disabled:bg-gray-100"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Descripción {!isVentaExterna && '*'}
                  </label>
                  <input
                    type="text"
                    required={!isVentaExterna}
                    value={formData.descripcion}
                    onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                    disabled={isVentaExterna}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none disabled:bg-gray-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Valor {!isVentaExterna && '*'}
                  </label>
                  <input
                    type="number"
                    required={!isVentaExterna}
                    step="0.01"
                    value={formData.valor || ''}
                    onChange={(e) => setFormData({ ...formData, valor: parseFloat(e.target.value) || 0 })}
                    disabled={isVentaExterna}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none disabled:bg-gray-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cantidad {!isVentaExterna && '*'}
                  </label>
                  <input
                    type="number"
                    required={!isVentaExterna}
                    value={formData.cantidad || ''}
                    onChange={(e) => setFormData({ ...formData, cantidad: parseInt(e.target.value) || 0 })}
                    disabled={isVentaExterna}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none disabled:bg-gray-100"
                  />
                </div>

                {/* Información del Producto Encontrado */}
                {!isVentaExterna && (formData.cb > 0 || formData.ci > 0) && (() => {
                  const productoEncontrado = productos.find(p => 
                    String(p.CB) === String(formData.cb) || 
                    (formData.ci > 0 && parseInt(String(p.CI)) === formData.ci)
                  );
                  return productoEncontrado ? (
                    <div className="md:col-span-2 bg-gray-50 border border-gray-200 rounded-lg p-4 mb-2">
                      <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/>
                          <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd"/>
                        </svg>
                        Información del Producto
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                        <div>
                          <p className="text-xs text-gray-500 font-medium">Producto</p>
                          <p className="text-gray-900 font-medium">{productoEncontrado.PRODUCTO}</p>
                        </div>
                        {productoEncontrado.TIPO && (
                          <div>
                            <p className="text-xs text-gray-500 font-medium">Tipo</p>
                            <p className="text-gray-900">{productoEncontrado.TIPO}</p>
                          </div>
                        )}
                        {productoEncontrado.MARCA && (
                          <div>
                            <p className="text-xs text-gray-500 font-medium">Marca</p>
                            <p className="text-gray-900">{productoEncontrado.MARCA}</p>
                          </div>
                        )}
                        {productoEncontrado.REFERENCIA && (
                          <div>
                            <p className="text-xs text-gray-500 font-medium">Referencia</p>
                            <p className="text-gray-900 font-mono text-xs">{productoEncontrado.REFERENCIA}</p>
                          </div>
                        )}
                        {productoEncontrado.MODELO_ESPECIFICACION && (
                          <div>
                            <p className="text-xs text-gray-500 font-medium">Modelo</p>
                            <p className="text-gray-900">{productoEncontrado.MODELO_ESPECIFICACION}</p>
                          </div>
                        )}
                        <div>
                          <p className="text-xs text-gray-500 font-medium">Stock Disponible</p>
                          <p className={`font-semibold ${Number(productoEncontrado.STOCK) < 10 ? 'text-red-600' : 'text-green-600'}`}>
                            {productoEncontrado.STOCK} unidades
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : null;
                })()}

                {/* Checkbox de Venta Externa */}
                <div className="md:col-span-2 border-t border-gray-200 pt-4 mt-2">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isVentaExterna}
                      onChange={(e) => {
                        setIsVentaExterna(e.target.checked);
                        if (e.target.checked) {
                          // Limpiar campos cuando se activa venta externa
                          setFormData({
                            ...formData,
                            ci: 0,
                            cb: 0,
                            descripcion: '',
                            valor: 0,
                            cantidad: 0,
                          });
                        }
                      }}
                      className="w-5 h-5 text-gray-900 border-gray-300 rounded focus:ring-2 focus:ring-gray-900"
                    />
                    <span className="text-sm font-medium text-gray-700">Venta externa</span>
                  </label>
                </div>

                {/* Campos de Venta Externa */}
                {isVentaExterna && (
                  <>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Descripción *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.descripcion}
                        onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                        placeholder="Descripción del producto vendido"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Valor *
                      </label>
                      <input
                        type="number"
                        required
                        step="0.01"
                        value={formData.valor || ''}
                        onChange={(e) => setFormData({ ...formData, valor: parseFloat(e.target.value) || 0 })}
                        placeholder="0.00"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Cantidad *
                      </label>
                      <input
                        type="number"
                        required
                        value={formData.cantidad || ''}
                        onChange={(e) => setFormData({ ...formData, cantidad: parseInt(e.target.value) || 0 })}
                        placeholder="0"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none"
                      />
                    </div>
                  </>
                )}
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="submit"
                  className="flex-1 bg-gray-900 text-white py-2 px-4 rounded-lg hover:bg-gray-800 transition font-medium"
                >
                  {modalMode === 'create' ? 'Crear Salida' : 'Guardar Cambios'}
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
    </div>
  );
}
