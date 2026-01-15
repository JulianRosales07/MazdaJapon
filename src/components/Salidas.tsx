import { useState, useEffect, useMemo } from 'react';
import { Search, Plus, Eye, Trash2, X, RotateCcw, ArrowUpDown } from 'lucide-react';
import { apiClient } from '../lib/apiClient';
import type { Repuesto, Salida } from '../lib/types';
import { useAuth } from '../contexts/AuthContext';
import { salidasAPI } from '@/lib/api';
import TableSkeleton from './TableSkeleton';

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
  const [sortBy, setSortBy] = useState<'fecha' | 'factura'>('fecha'); // Campo por el cual ordenar
  const [selectedMonth, setSelectedMonth] = useState<string>(''); // Filtro por mes (formato: YYYYMM)
  const [showDevolucionModal, setShowDevolucionModal] = useState(false);
  const [devolucionData, setDevolucionData] = useState({
    cb: '',
    ci: '',
    producto_nombre: '',
    cantidad: 0,
    motivo: '',
    observaciones: '',
    n_factura: '',
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
  
  // Estado para el carrito de productos
  const [productosCarrito, setProductosCarrito] = useState<Array<{
    cb: number;
    ci: number;
    descripcion: string;
    valor: number;
    cantidad: number;
    esExterno: boolean;
  }>>([]);

  // Estado para el input de valor formateado
  const [valorFormateado, setValorFormateado] = useState('');
  
  // Estado para el modal de advertencia de stock
  const [showStockWarning, setShowStockWarning] = useState(false);
  const [stockWarningData, setStockWarningData] = useState({
    stockActual: 0,
    enCarrito: 0,
    solicitado: 0,
    faltante: 0,
    stockFinal: 0,
  });
  
  // Estado para el modal de éxito
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successFactura, setSuccessFactura] = useState(0);
  
  // Estado para indicador de carga
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchProductos();
    fetchSalidas();
  }, []);

  // Normalizar productos
  const normalizeProduct = (product: any): Repuesto => {
    return {
      CB: product.cb || product.CB || '',
      CI: product.ci || product.CI || '',
      PRODUCTO: product.producto || product.PRODUCTO || '',
      TIPO: product.tipo || product.TIPO || null,
      MODELO_ESPECIFICACION: product.modelo_especificacion || product.MODELO_ESPECIFICACION || null,
      REFERENCIA: product.referencia || product.REFERENCIA || null,
      MARCA: product.marca || product.MARCA || null,
      STOCK: product.stock || product.STOCK || 0,
      PRECIO: product.precio || product.PRECIO || 0,
      DESCRIPCION_LARGA: product.descripcion_larga || product.DESCRIPCION_LARGA || null,
      ESTANTE: product.estante || product.ESTANTE || null,
      NIVEL: product.nivel || product.NIVEL || null,
    };
  };

  // Normalizar salidas
  const normalizeSalida = (salida: any): Salida => {
    // Convertir fecha de formato ISO (YYYY-MM-DD) a número (YYYYMMDD)
    let fechaNum = 0;
    const fechaValue = salida.fecha || salida.FECHA;
    if (fechaValue) {
      if (typeof fechaValue === 'string' && fechaValue.includes('-')) {
        // Formato ISO: "2025-12-01" -> 20251201
        fechaNum = parseInt(fechaValue.replace(/-/g, ''));
      } else {
        fechaNum = Number(fechaValue);
      }
    }

    return {
      n_factura: Number(salida.n_factura || salida.N_FACTURA || 0),
      fecha: fechaNum,
      cb: Number(salida.cb || salida.CB || 0),
      ci: Number(salida.ci || salida.CI || 0),
      descripcion: String(salida.descripcion || salida.DESCRIPCION || ''),
      valor: Number(salida.valor || salida.VALOR || 0),
      cantidad: Number(salida.cantidad || salida.CANTIDAD || 0),
      columna1: salida.columna1 || salida.Columna1 || null,
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
        setProductos([]);
        return;
      }

      setProductos(data.map(normalizeProduct));
    } catch (error) {
      console.error('Error al cargar productos:', error);
      setProductos([]);
    }
  };

  const fetchSalidas = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getSalidas();
      let data = response;
      if (response && typeof response === 'object' && 'data' in response) {
        data = (response as any).data;
      }
      
      if (!Array.isArray(data)) {
        setSalidas([]);
        setLoading(false);
        return;
      }

      const normalized = data.map(normalizeSalida);
      setSalidas(normalized);
    } catch (error) {
      console.error('Error al cargar salidas:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setModalMode('create');

    setFormData({
      n_factura: 0,
      fecha: parseInt(new Date().toISOString().slice(0, 10).replace(/-/g, '')),
      cb: 0,
      ci: 0,
      descripcion: '',
      valor: 0,
      cantidad: 0,
      columna1: '',
    });
    setIsVentaExterna(false);
    setProductosCarrito([]);
    setValorFormateado('');
    setShowModal(true);
  };

  // Función para formatear valor en pesos colombianos
  const formatearValorCOP = (valor: string) => {
    // Remover todo excepto números
    const soloNumeros = valor.replace(/\D/g, '');
    
    if (!soloNumeros) return '';
    
    // Convertir a número y formatear con separadores de miles
    const numero = parseInt(soloNumeros);
    return numero.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  // Manejar cambio en el campo de valor
  const handleValorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    const formateado = formatearValorCOP(inputValue);
    setValorFormateado(formateado);
    
    // Guardar el valor numérico sin formato
    const valorNumerico = parseInt(inputValue.replace(/\D/g, '')) || 0;
    setFormData({ ...formData, valor: valorNumerico });
  };

  // Agregar producto al carrito
  const agregarProductoAlCarrito = () => {
    // Validaciones
    if (isVentaExterna) {
      if (!formData.descripcion || formData.valor <= 0 || formData.cantidad <= 0) {
        alert('Complete todos los campos para la venta externa');
        return;
      }
    } else {
      if (!formData.cb || formData.cb === 0) {
        alert('Debe seleccionar un producto válido ingresando el CI');
        return;
      }

      const producto = productos.find(p => String(p.CB) === String(formData.cb));
      if (!producto) {
        alert('El producto seleccionado no existe en el inventario');
        return;
      }

      // Verificar stock disponible considerando lo que ya está en el carrito
      const cantidadEnCarrito = productosCarrito
        .filter(item => item.cb === formData.cb)
        .reduce((sum, item) => sum + item.cantidad, 0);
      
      const stockActual = parseFloat(String(producto.STOCK)) || 0;
      const cantidadTotal = cantidadEnCarrito + Math.abs(formData.cantidad);

      // Advertencia de stock insuficiente pero permitir continuar
      if (stockActual < cantidadTotal) {
        setStockWarningData({
          stockActual: stockActual,
          enCarrito: cantidadEnCarrito,
          solicitado: cantidadTotal,
          faltante: cantidadTotal - stockActual,
          stockFinal: stockActual - cantidadTotal,
        });
        setShowStockWarning(true);
        return;
      }
    }

    confirmarAgregarAlCarrito();
  };

  // Confirmar agregar al carrito (después de la advertencia o directamente)
  const confirmarAgregarAlCarrito = () => {
    // Agregar al carrito
    setProductosCarrito([...productosCarrito, {
      cb: formData.cb,
      ci: formData.ci,
      descripcion: formData.descripcion,
      valor: formData.valor,
      cantidad: formData.cantidad,
      esExterno: isVentaExterna,
    }]);

    // Limpiar formulario para agregar otro producto
    setFormData({
      ...formData,
      cb: 0,
      ci: 0,
      descripcion: '',
      valor: 0,
      cantidad: 0,
    });
    setValorFormateado('');
    setIsVentaExterna(false);
    setShowStockWarning(false);
  };

  // Eliminar producto del carrito
  const eliminarProductoDelCarrito = (index: number) => {
    setProductosCarrito(productosCarrito.filter((_, i) => i !== index));
  };

  const handleEdit = (salida: Salida) => {
    setModalMode('edit');
    setSelectedSalida(salida);
    setFormData({
      n_factura: salida.n_factura,
      fecha: Number(salida.fecha),
      cb: Number(salida.cb) || 0,
      ci: Number(salida.ci) || 0,
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
      await apiClient.deleteSalida(salidaToDelete);
      await fetchSalidas();
      setShowDeleteModal(false);
      setSalidaToDelete(null);
    } catch (error) {
      console.error('Error al eliminar salida:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validar que haya productos en el carrito
    if (productosCarrito.length === 0) {
      alert('Debe agregar al menos un producto al carrito');
      return;
    }

    setIsSubmitting(true);

    try {
      // Auto-generar número de factura si es 0
      let nFactura = formData.n_factura;
      if (!nFactura) {
        const facturasValidas = salidas
          .map(s => s.n_factura || 0)
          .filter(num => num > 0 && num < 100000);
        const maxFactura = facturasValidas.length > 0 ? Math.max(...facturasValidas) : 0;
        nFactura = maxFactura + 1;
      }

      // Crear todas las salidas en paralelo para mayor velocidad
      const promesas = productosCarrito.map(producto => {
        const salidaData = {
          n_factura: nFactura,
          fecha: formData.fecha,
          cb: producto.esExterno ? null : producto.cb,
          ci: producto.esExterno ? null : producto.ci,
          descripcion: producto.descripcion,
          valor: producto.valor,
          cantidad: producto.cantidad,
          columna1: formData.columna1,
        };

        return apiClient.createSalida(salidaData);
      });

      // Esperar a que todas las salidas se creen
      await Promise.all(promesas);

      // Recargar datos
      await Promise.all([fetchSalidas(), fetchProductos()]);

      setShowModal(false);
      setProductosCarrito([]);
      
      // Mostrar modal de éxito personalizado
      setShowSuccessModal(true);
      setSuccessFactura(nFactura);
    } catch (error) {
      console.error('Error al guardar salida:', error);
      alert('Error al guardar la salida. Verifique los datos e intente nuevamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Obtener meses disponibles de las salidas
  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    salidas.forEach(salida => {
      if (!salida.fecha) return;

      try {
        let date: Date;
        const str = String(salida.fecha);
        
        // Si es formato ISO (YYYY-MM-DD)
        if (str.includes('-')) {
          date = new Date(str);
        }
        // Si es un número de 8 dígitos (YYYYMMDD)
        else if (/^\d{8}$/.test(str)) {
          const year = parseInt(str.slice(0, 4));
          const month = parseInt(str.slice(4, 6)) - 1;
          const day = parseInt(str.slice(6, 8));
          date = new Date(year, month, day);
        } else {
          date = new Date(salida.fecha);
        }

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
          let date: Date;
          const str = String(salida.fecha);
          
          // Si es formato ISO (YYYY-MM-DD)
          if (str.includes('-')) {
            date = new Date(str);
          }
          // Si es un número de 8 dígitos (YYYYMMDD)
          else if (/^\d{8}$/.test(str)) {
            const year = parseInt(str.slice(0, 4));
            const month = parseInt(str.slice(4, 6)) - 1;
            const day = parseInt(str.slice(6, 8));
            date = new Date(year, month, day);
          } else {
            date = new Date(salida.fecha);
          }

          if (!isNaN(date.getTime())) {
            const year = date.getFullYear();
            const month = date.getMonth() + 1;
            const yearMonth = `${year}-${String(month).padStart(2, '0')}`;
            return yearMonth === selectedMonth;
          }
          return false;
        } catch {
          return false;
        }
      });
    }

    // Luego ordenar según el campo seleccionado
    const sorted = [...filtered].sort((a, b) => {
      if (sortBy === 'fecha') {
        // Ordenar por fecha
        const getFechaTime = (fecha: number | string | null | undefined) => {
          if (!fecha) return 0;
          
          try {
            let date: Date;
            const str = String(fecha);
            
            // Si es formato ISO (YYYY-MM-DD)
            if (str.includes('-')) {
              date = new Date(str);
            }
            // Si es un número de 8 dígitos (YYYYMMDD)
            else if (/^\d{8}$/.test(str)) {
              const year = parseInt(str.slice(0, 4));
              const month = parseInt(str.slice(4, 6)) - 1;
              const day = parseInt(str.slice(6, 8));
              date = new Date(year, month, day);
            } else {
              date = new Date(fecha);
            }
            
            return isNaN(date.getTime()) ? 0 : date.getTime();
          } catch {
            return 0;
          }
        };

        const fechaA = getFechaTime(a.fecha);
        const fechaB = getFechaTime(b.fecha);

        const comparison = fechaB - fechaA;
        return sortOrder === 'desc' ? comparison : -comparison;
      } else {
        // Ordenar por número de factura
        const facturaA = Number(a.n_factura) || 0;
        const facturaB = Number(b.n_factura) || 0;
        
        const comparison = facturaB - facturaA;
        return sortOrder === 'desc' ? comparison : -comparison;
      }
    });

    return sorted;
  }, [salidas, searchTerm, selectedMonth, sortOrder, sortBy]);

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

    try {
      let date: Date;
      const str = String(fecha);
      
      // Si es formato ISO (YYYY-MM-DD)
      if (str.includes('-')) {
        date = new Date(str);
      }
      // Si es un número de 8 dígitos (YYYYMMDD)
      else if (/^\d{8}$/.test(str)) {
        const year = parseInt(str.slice(0, 4));
        const month = parseInt(str.slice(4, 6)) - 1; // Los meses en JS van de 0-11
        const day = parseInt(str.slice(6, 8));
        date = new Date(year, month, day);
      }
      // Intentar parsear directamente
      else {
        date = new Date(fecha);
      }

      // Verificar si la fecha es válida
      if (isNaN(date.getTime())) {
        return String(fecha);
      }

      // Formatear como DD/MM/YYYY
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    } catch (error) {
      console.error('Error formateando fecha:', fecha, error);
      return String(fecha);
    }
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
          <TableSkeleton rows={itemsPerPage} columns={isAdmin ? 7 : 6} />
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
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                      <button
                        onClick={() => {
                          if (sortBy === 'factura') {
                            setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
                          } else {
                            setSortBy('factura');
                            setSortOrder('desc');
                          }
                        }}
                        className="flex items-center gap-1 hover:text-gray-900 transition-colors"
                      >
                        N° Factura
                        <ArrowUpDown className="w-4 h-4" />
                        {sortBy === 'factura' && (
                          <span className="text-xs ml-1">({sortOrder === 'desc' ? '↓' : '↑'})</span>
                        )}
                      </button>
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                      <button
                        onClick={() => {
                          if (sortBy === 'fecha') {
                            setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
                          } else {
                            setSortBy('fecha');
                            setSortOrder('desc');
                          }
                        }}
                        className="flex items-center gap-1 hover:text-gray-900 transition-colors"
                      >
                        Fecha
                        <ArrowUpDown className="w-4 h-4" />
                        {sortBy === 'fecha' && (
                          <span className="text-xs ml-1">({sortOrder === 'desc' ? '↓' : '↑'})</span>
                        )}
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
                    const isDevolucion = cantidadNum < 0; // Las devoluciones tienen cantidad negativa

                    return (
                      <tr key={`${salida.n_factura}-${index}`} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4 text-sm text-gray-900 font-medium">{salida.n_factura}</td>
                        <td className="py-3 px-4 text-sm text-gray-700">{formatFecha(salida.fecha)}</td>
                        <td className="py-3 px-4 text-sm text-gray-900 font-medium">{salida.ci || '-'}</td>
                        <td className="py-3 px-4 text-sm text-gray-700">{salida.descripcion}</td>
                        <td className="py-3 px-4 text-sm">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            isDevolucion 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-red-100 text-red-700'
                          }`}>
                            {isDevolucion ? '+' : '-'}{Math.abs(cantidadNum)}
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
                if (!devolucionData.cb) {
                  alert('Por favor selecciona un producto');
                  return;
                }

                const producto = productos.find(p => String(p.CB) === String(devolucionData.cb));

                if (!producto) {
                  alert('Producto no encontrado');
                  return;
                }

                const ciValue = parseInt(String(devolucionData.ci));
                const cbValue = parseInt(String(devolucionData.cb));

                // Auto-generar número de factura si no se proporciona
                const nFacturaValue = devolucionData.n_factura
                  ? parseInt(String(devolucionData.n_factura))
                  : Math.max(...salidas.map(s => s.n_factura || 0)) + 1;

                const nuevaSalida = {
                  n_factura: nFacturaValue,
                  fecha: parseInt(new Date().toISOString().slice(0, 10).replace(/-/g, '')),
                  cb: !isNaN(cbValue) ? cbValue : null,
                  ci: !isNaN(ciValue) && ciValue > 0 ? ciValue : undefined,
                  descripcion: `DEVOLUCIÓN - ${devolucionData.producto_nombre}`,
                  valor: parseFloat(String(producto.PRECIO)) || 0,
                  cantidad: -Math.abs(devolucionData.cantidad),
                  columna1: `Motivo: ${devolucionData.motivo}. ${devolucionData.observaciones}`,
                };

                await salidasAPI.create(nuevaSalida);
                await fetchSalidas();
                await fetchProductos();

                setShowDevolucionModal(false);
                setDevolucionData({ cb: '', ci: '', producto_nombre: '', cantidad: 0, motivo: '', observaciones: '', n_factura: '' });
                alert('Devolución registrada exitosamente');
              } catch (error) {
                console.error('Error al registrar devolución:', error);
                alert('Error al registrar la devolución');
              }
            }} className="p-6">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      N° Factura
                    </label>
                    <input
                      type="number"
                      value={devolucionData.n_factura}
                      onChange={(e) => setDevolucionData({ ...devolucionData, n_factura: e.target.value })}
                      placeholder="Auto (opcional)"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      CI *
                    </label>
                    <input
                      type="text"
                      required
                      value={devolucionData.ci}
                      onChange={(e) => {
                        const ci = e.target.value;
                        const producto = productos.find(p => String(p.CI) === ci);
                        setDevolucionData({
                          ...devolucionData,
                          ci: ci,
                          cb: producto ? String(producto.CB) : '',
                          producto_nombre: producto ? producto.PRODUCTO : ''
                        });
                      }}
                      placeholder="Buscar por CI"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Producto *
                    </label>
                    <input
                      type="text"
                      required
                      value={devolucionData.producto_nombre}
                      onChange={(e) => {
                        setDevolucionData({
                          ...devolucionData,
                          producto_nombre: e.target.value
                        });
                      }}
                      onBlur={() => {
                        if (!devolucionData.cb && devolucionData.producto_nombre) {
                          const producto = productos.find(p => p.PRODUCTO.toLowerCase() === devolucionData.producto_nombre.toLowerCase());
                          if (producto) {
                            setDevolucionData(prev => ({
                              ...prev,
                              cb: String(producto.CB),
                              ci: String(producto.CI || ''),
                              producto_nombre: producto.PRODUCTO
                            }));
                          }
                        }
                      }}
                      list="productos-devolucion-list"
                      placeholder="Buscar por nombre"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                    />
                    <datalist id="productos-devolucion-list">
                      {productos.map(p => (
                        <option key={p.CB} value={p.PRODUCTO} />
                      ))}
                    </datalist>
                  </div>
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
              {modalMode === 'edit' ? (
                // Modo Ver: Solo lectura con diseño mejorado
                <div className="space-y-6">
                  {/* Información Principal de la Salida */}
                  <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                    <h3 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                        <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                      </svg>
                      Información de la Salida
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                          N° Factura
                        </label>
                        <p className="text-xl font-bold text-gray-900">{formData.n_factura}</p>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                          Fecha
                        </label>
                        <p className="text-xl font-bold text-gray-900">{formatFecha(formData.fecha)}</p>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                          Cantidad
                        </label>
                        <p className={`text-xl font-bold ${formData.cantidad < 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formData.cantidad < 0 ? '+' : '-'}{Math.abs(formData.cantidad)} unidades
                        </p>
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                          Descripción
                        </label>
                        <p className="text-lg font-semibold text-gray-900">{formData.descripcion}</p>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                          Valor Total
                        </label>
                        <p className="text-xl font-bold text-gray-900">${formatPrecio(formData.valor)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Información del Producto */}
                  {formData.cb > 0 && (() => {
                    const productoEncontrado = productos.find(p => String(p.CB) === String(formData.cb));
                    return productoEncontrado ? (
                      <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
                        <h3 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 2a4 4 0 00-4 4v1H5a1 1 0 00-.994.89l-1 9A1 1 0 004 18h12a1 1 0 00.994-1.11l-1-9A1 1 0 0015 7h-1V6a4 4 0 00-4-4zm2 5V6a2 2 0 10-4 0v1h4zm-6 3a1 1 0 112 0 1 1 0 01-2 0zm7-1a1 1 0 100 2 1 1 0 000-2z" clipRule="evenodd" />
                          </svg>
                          Información del Producto
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Producto</label>
                            <p className="text-base font-semibold text-gray-900">{productoEncontrado.PRODUCTO}</p>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Marca</label>
                            <p className="text-base font-semibold text-gray-900">{productoEncontrado.MARCA || '-'}</p>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Stock Disponible</label>
                            <p className={`text-base font-bold ${Number(productoEncontrado.STOCK) < 10 ? 'text-red-600' : 'text-green-600'}`}>
                              {productoEncontrado.STOCK} unidades
                            </p>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">CB</label>
                            <p className="text-base font-mono font-semibold text-gray-900">{formData.cb}</p>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">CI</label>
                            <p className="text-base font-mono font-semibold text-gray-900">{formData.ci || '-'}</p>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Precio Unitario</label>
                            <p className="text-base font-bold text-gray-900">${Number(productoEncontrado.PRECIO).toFixed(2)}</p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                        <h3 className="text-sm font-bold text-gray-700 mb-4">Códigos del Producto</h3>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">CB</label>
                            <p className="text-lg font-mono font-semibold text-gray-900">{formData.cb || '-'}</p>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">CI</label>
                            <p className="text-lg font-mono font-semibold text-gray-900">{formData.ci || '-'}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              ) : (
                // Modo Crear: Formulario editable con carrito
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        N° Factura
                      </label>
                      <input
                        type="number"
                        value={formData.n_factura || ''}
                        onChange={(e) => setFormData({ ...formData, n_factura: parseInt(e.target.value) || 0 })}
                        placeholder="Se genera automáticamente"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none"
                      />
                      <p className="text-xs text-gray-500 mt-1">Dejar vacío para auto-generar</p>
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
                  </div>

                  {/* Separador */}
                  <div className="border-t border-gray-200 my-6"></div>

                  {/* Sección de agregar productos */}
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <h3 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
                      <Plus className="w-4 h-4" />
                      Agregar Producto
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          CI {!isVentaExterna && '*'}
                        </label>
                        <input
                          type="number"
                          value={formData.ci || ''}
                          onChange={(e) => {
                            const ciValue = parseInt(e.target.value) || 0;

                            // Buscar producto por CI
                            const productoEncontrado = productos.find(p => {
                              const productCI = parseInt(String(p.CI));
                              return !isNaN(productCI) && productCI === ciValue;
                            });

                            if (productoEncontrado) {
                              // Construir descripción completa con todos los campos disponibles
                              const partes = [];
                              
                              // Agregar cada campo si existe y no está vacío
                              if (productoEncontrado.PRODUCTO && productoEncontrado.PRODUCTO.trim()) {
                                partes.push(productoEncontrado.PRODUCTO.trim());
                              }
                              if (productoEncontrado.TIPO && productoEncontrado.TIPO.trim()) {
                                partes.push(productoEncontrado.TIPO.trim());
                              }
                              if (productoEncontrado.MODELO_ESPECIFICACION && productoEncontrado.MODELO_ESPECIFICACION.trim()) {
                                partes.push(productoEncontrado.MODELO_ESPECIFICACION.trim());
                              }
                              if (productoEncontrado.MARCA && productoEncontrado.MARCA.trim()) {
                                partes.push(productoEncontrado.MARCA.trim());
                              }
                              
                              const descripcionCompleta = partes.length > 0 ? partes.join(' - ') : productoEncontrado.PRODUCTO || '';
                              
                              console.log('Producto encontrado:', productoEncontrado);
                              console.log('Descripción generada:', descripcionCompleta);
                              
                              // Autocompletar todos los campos
                              const precioProducto = parseFloat(String(productoEncontrado.PRECIO)) || 0;
                              setFormData({
                                ...formData,
                                ci: ciValue,
                                cb: parseInt(String(productoEncontrado.CB)) || 0,
                                descripcion: descripcionCompleta,
                                valor: precioProducto,
                              });
                              // Formatear el valor para mostrarlo
                              setValorFormateado(formatearValorCOP(precioProducto.toString()));
                            } else {
                              setFormData({ ...formData, ci: ciValue });
                            }
                          }}
                          disabled={isVentaExterna}
                          placeholder="Buscar CI"
                          list="ci-list"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none disabled:bg-gray-100"
                        />
                        <datalist id="ci-list">
                          {Array.from(new Set(productos.map(p => p.CI))).filter(Boolean).map((ci, idx) => (
                            <option key={idx} value={String(ci)} />
                          ))}
                        </datalist>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          CB {!isVentaExterna && '*'}
                        </label>
                        <input
                          type="number"
                          value={formData.cb || ''}
                          disabled={true}
                          readOnly
                          placeholder="Auto"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none disabled:bg-gray-100 bg-gray-50"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Descripción *
                        </label>
                        <input
                          type="text"
                          value={formData.descripcion}
                          onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                          disabled={!isVentaExterna && formData.cb > 0}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none disabled:bg-gray-100"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Valor * (COP)
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">$</span>
                          <input
                            type="text"
                            value={valorFormateado}
                            onChange={handleValorChange}
                            placeholder="0"
                            className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Cantidad *
                        </label>
                        <input
                          type="number"
                          value={formData.cantidad || ''}
                          onChange={(e) => setFormData({ ...formData, cantidad: parseInt(e.target.value) || 0 })}
                          onWheel={(e) => e.currentTarget.blur()}
                          placeholder="0"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none"
                        />
                      </div>

                      {/* Información del Producto Encontrado */}
                      {!isVentaExterna && (formData.cb > 0 || formData.ci > 0) && (() => {
                        const productoEncontrado = productos.find(p =>
                          String(p.CB) === String(formData.cb) ||
                          (formData.ci > 0 && parseInt(String(p.CI)) === formData.ci)
                        );
                        return productoEncontrado ? (
                          <div className="md:col-span-2 bg-blue-50 border border-blue-200 rounded-lg p-3">
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                              <div>
                                <p className="text-xs text-gray-600 font-medium">Producto</p>
                                <p className="text-gray-900 font-medium">{productoEncontrado.PRODUCTO}</p>
                              </div>
                              {productoEncontrado.MARCA && (
                                <div>
                                  <p className="text-xs text-gray-600 font-medium">Marca</p>
                                  <p className="text-gray-900">{productoEncontrado.MARCA}</p>
                                </div>
                              )}
                              <div>
                                <p className="text-xs text-gray-600 font-medium">Stock Disponible</p>
                                <p className={`font-semibold ${Number(productoEncontrado.STOCK) < 10 ? 'text-red-600' : 'text-green-600'}`}>
                                  {productoEncontrado.STOCK} unidades
                                </p>
                              </div>
                            </div>
                          </div>
                        ) : null;
                      })()}

                      {/* Checkbox de Venta Externa */}
                      <div className="md:col-span-2">
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
                                setValorFormateado('');
                              }
                            }}
                            className="w-4 h-4 text-gray-900 border-gray-300 rounded focus:ring-2 focus:ring-gray-900"
                          />
                          <span className="text-sm font-medium text-gray-700">Venta externa (producto no registrado)</span>
                        </label>
                      </div>

                      {/* Botón para agregar al carrito */}
                      <div className="md:col-span-2">
                        <button
                          type="button"
                          onClick={agregarProductoAlCarrito}
                          className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition font-medium flex items-center justify-center gap-2"
                        >
                          <Plus className="w-5 h-5" />
                          Agregar al Carrito
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Carrito de productos */}
                  {productosCarrito.length > 0 && (
                    <div className="mt-6">
                      <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
                        </svg>
                        Productos en el Carrito ({productosCarrito.length})
                      </h3>
                      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                        <table className="w-full text-sm">
                          <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                              <th className="text-left py-2 px-3 font-semibold text-gray-700">Descripción</th>
                              <th className="text-center py-2 px-3 font-semibold text-gray-700">Cantidad</th>
                              <th className="text-right py-2 px-3 font-semibold text-gray-700">Valor Unit.</th>
                              <th className="text-right py-2 px-3 font-semibold text-gray-700">Subtotal</th>
                              <th className="text-center py-2 px-3 font-semibold text-gray-700 w-16"></th>
                            </tr>
                          </thead>
                          <tbody>
                            {productosCarrito.map((item, index) => (
                              <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                                <td className="py-2 px-3">
                                  <div>
                                    <p className="font-medium text-gray-900">{item.descripcion}</p>
                                    {item.esExterno ? (
                                      <p className="text-xs text-blue-600">Venta externa</p>
                                    ) : (
                                      <p className="text-xs text-gray-500">CI: {item.ci} | CB: {item.cb}</p>
                                    )}
                                  </div>
                                </td>
                                <td className="py-2 px-3 text-center font-medium">{item.cantidad}</td>
                                <td className="py-2 px-3 text-right">${formatPrecio(item.valor)}</td>
                                <td className="py-2 px-3 text-right font-semibold">${formatPrecio(item.valor * item.cantidad)}</td>
                                <td className="py-2 px-3 text-center">
                                  <button
                                    type="button"
                                    onClick={() => eliminarProductoDelCarrito(index)}
                                    className="p-1 text-red-600 hover:bg-red-50 rounded transition"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot className="bg-gray-50 border-t-2 border-gray-300">
                            <tr>
                              <td colSpan={3} className="py-3 px-3 text-right font-bold text-gray-900">Total:</td>
                              <td className="py-3 px-3 text-right font-bold text-gray-900 text-lg">
                                ${formatPrecio(productosCarrito.reduce((sum, item) => sum + (item.valor * item.cantidad), 0))}
                              </td>
                              <td></td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    </div>
                  )}
                </>
              )}

              <div className="flex gap-3 mt-6">
                {modalMode === 'create' ? (
                  <>
                    <button
                      type="submit"
                      disabled={productosCarrito.length === 0 || isSubmitting}
                      className="flex-1 bg-gray-900 text-white py-2 px-4 rounded-lg hover:bg-gray-800 transition font-medium disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isSubmitting ? (
                        <>
                          <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Registrando...
                        </>
                      ) : (
                        <>
                          Registrar Salida ({productosCarrito.length} {productosCarrito.length === 1 ? 'producto' : 'productos'})
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowModal(false);
                        setProductosCarrito([]);
                      }}
                      disabled={isSubmitting}
                      className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Cancelar
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 bg-gray-900 text-white py-2 px-4 rounded-lg hover:bg-gray-800 transition font-medium"
                  >
                    Cerrar
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Modal de Advertencia de Stock */}
      {showStockWarning && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[100]"
          onClick={() => setShowStockWarning(false)}
        >
          <div
            className="bg-white rounded-lg shadow-xl w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              {/* Icono y título */}
              <div className="flex items-center gap-3 mb-4">
                <div className="flex-shrink-0 w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Advertencia de Stock</h3>
                  <p className="text-sm text-gray-600">Stock insuficiente para esta operación</p>
                </div>
              </div>

              {/* Información del stock */}
              <div className="bg-gray-50 rounded-lg p-4 mb-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Stock disponible:</span>
                  <span className="text-base font-semibold text-gray-900">{stockWarningData.stockActual} unidades</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Ya en carrito:</span>
                  <span className="text-base font-semibold text-gray-900">{stockWarningData.enCarrito} unidades</span>
                </div>
                <div className="border-t border-gray-200 pt-3 flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">Total solicitado:</span>
                  <span className="text-base font-bold text-gray-900">{stockWarningData.solicitado} unidades</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Faltante:</span>
                  <span className="text-base font-semibold text-red-600">{stockWarningData.faltante} unidades</span>
                </div>
              </div>

              {/* Advertencia de stock negativo */}
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-red-800">El stock quedará en negativo</p>
                    <p className="text-sm text-red-700 mt-1">
                      Stock resultante: <span className="font-bold">{stockWarningData.stockFinal} unidades</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Pregunta */}
              <p className="text-sm text-gray-700 mb-6 text-center">
                ¿Desea continuar con esta operación de todas formas?
              </p>

              {/* Botones */}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowStockWarning(false)}
                  className="flex-1 bg-gray-100 text-gray-700 py-2.5 px-4 rounded-lg hover:bg-gray-200 transition font-medium"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmarAgregarAlCarrito}
                  className="flex-1 bg-yellow-600 text-white py-2.5 px-4 rounded-lg hover:bg-yellow-700 transition font-medium"
                >
                  Continuar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Éxito */}
      {showSuccessModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[100]"
          onClick={() => setShowSuccessModal(false)}
        >
          <div
            className="bg-white rounded-lg shadow-xl w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              {/* Icono de éxito animado */}
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center animate-bounce">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>

              {/* Título */}
              <h3 className="text-xl font-bold text-gray-900 text-center mb-2">
                ¡Salida Registrada!
              </h3>

              {/* Mensaje */}
              <p className="text-gray-600 text-center mb-6">
                La salida se ha registrado exitosamente
              </p>

              {/* Información de la factura */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-1">Número de Factura</p>
                  <p className="text-3xl font-bold text-blue-600">N° {successFactura}</p>
                </div>
              </div>

              {/* Botón */}
              <button
                onClick={() => setShowSuccessModal(false)}
                className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition font-medium flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
