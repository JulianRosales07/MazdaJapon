import { useEffect, useState } from 'react';
import { Search, Plus, Edit2, Trash2, X, ArrowUpDown, Eye, ArrowLeft, Copy, History } from 'lucide-react';
import { apiClient } from '../lib/apiClient';
import type { Repuesto, Proveedor } from '../lib/types';
import { useAuth } from '../contexts/AuthContext';
import Tooltip from './Tooltip';
import CustomSelect from './CustomSelect';
import TableSkeleton from './TableSkeleton';
import Toast from './Toast';
import AlertDialog from './AlertDialog';
import HistorialProveedores from './HistorialProveedores';

export default function Inventory() {
  const { isAdmin, permisos, usuario } = useAuth();
  const isGestionInventario = usuario?.rol === 'gestion_inventario';
  const [products, setProducts] = useState<Repuesto[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Repuesto[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [productoFilter, setProductoFilter] = useState('');
  const [tipoFilter, setTipoFilter] = useState('');
  const [marcaFilter, setMarcaFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showProductTypeDialog, setShowProductTypeDialog] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('create');
  const [viewMode, setViewMode] = useState<'list' | 'details'>('list');
  const [selectedProduct, setSelectedProduct] = useState<Repuesto | null>(null);
  const [showHistorialModal, setShowHistorialModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [productToDelete, setProductToDelete] = useState<string | number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [showAlert, setShowAlert] = useState(false);
  const [alertConfig, setAlertConfig] = useState<{
    title: string;
    message: string;
    type: 'warning' | 'error' | 'success' | 'info';
  }>({
    title: '',
    message: '',
    type: 'info',
  });
  const [entradaStock, setEntradaStock] = useState(0);
  const [salidaStock, setSalidaStock] = useState(0);
  const [searchCI, setSearchCI] = useState('');
  const [isExistingProduct, setIsExistingProduct] = useState(false);
  const [formData, setFormData] = useState<Repuesto>({
    CB: '',
    CI: null,
    PRODUCTO: '',
    TIPO: null,
    MODELO_ESPECIFICACION: null,
    REFERENCIA: null,
    MARCA: null,
    EXISTENCIAS_INICIALES: 0,
    STOCK: 0,
    PRECIO: 0,
    DESCRIPCION_LARGA: null,
    ESTANTE: null,
    NIVEL: null,
  });

  // Estados para información de proveedores
  const [proveedorData, setProveedorData] = useState({
    nFactura: '',
    proveedor: '',
    fecha: '',
    cantidad: 0,
    costo: 0,
  });

  // Estados para el nuevo flujo de proveedores
  const [showProveedorSelector, setShowProveedorSelector] = useState(false);
  const [availableProveedores, setAvailableProveedores] = useState<Proveedor[]>([]);
  const [selectedProveedor, setSelectedProveedor] = useState<number | null>(null);

  // Estados para los 3 slots de proveedores
  const [proveedor1, setProveedor1] = useState<{ id: number | null; nombre: string; precio: number }>({
    id: null,
    nombre: '',
    precio: 0,
  });
  const [proveedor2, setProveedor2] = useState<{ id: number | null; nombre: string; precio: number }>({
    id: null,
    nombre: '',
    precio: 0,
  });
  const [proveedor3, setProveedor3] = useState<{ id: number | null; nombre: string; precio: number }>({
    id: null,
    nombre: '',
    precio: 0,
  });

  // Función helper para mostrar alertas
  const showAlertDialog = (title: string, message: string, type: 'warning' | 'error' | 'success' | 'info' = 'info') => {
    setAlertConfig({ title, message, type });
    setShowAlert(true);
  };

  useEffect(() => {
    fetchProducts();
    fetchProveedores();
  }, []);

  const fetchProveedores = async () => {
    try {
      const response = await apiClient.getProveedores();
      
      // Handle response structure: {ok, message, data: [...]} or direct array
      let data = response;
      if (response && typeof response === 'object' && 'data' in response) {
        data = (response as any).data;
      }
      
      // Ensure data is an array
      if (!Array.isArray(data)) {
        console.error('La respuesta de proveedores no es un array:', data);
        setAvailableProveedores([]);
        return;
      }
      
      setAvailableProveedores(data);
    } catch (error) {
      console.error('Error fetching proveedores:', error);
      setAvailableProveedores([]);
    }
  };

  const cargarComparativaProveedores = async (productoCB: string) => {
    try {
      console.log('Cargando comparativas para producto:', productoCB);
      const response = await apiClient.getProveedoresByProducto(productoCB);
      console.log('Respuesta de comparativas:', response);
      
      // Manejar estructura de respuesta: {ok, message, data: [...]} o array directo
      let comparativas = response;
      if (response && typeof response === 'object' && 'data' in response) {
        comparativas = (response as any).data;
      }
      
      // Verificar que comparativas sea un array
      if (!Array.isArray(comparativas)) {
        console.error('La respuesta de comparativas no es un array:', comparativas);
        comparativas = [];
      }
      
      console.log('Comparativas procesadas:', comparativas);

      // Resetear los proveedores
      resetProveedoresSelector();

      // Cargar hasta 3 proveedores guardados
      if (comparativas.length > 0) {
        if (comparativas[0]) {
          // @ts-ignore - proveedores viene del join en la consulta
          const provData = comparativas[0].proveedores;
          setProveedor1({
            id: comparativas[0].proveedor_id,
            nombre: provData?.nombre_proveedor || '',
            precio: Number(comparativas[0].precio_proveedor),
          });
          if (comparativas[0].es_proveedor_principal) {
            setSelectedProveedor(comparativas[0].proveedor_id);
          }
        }

        if (comparativas[1]) {
          // @ts-ignore - proveedores viene del join en la consulta
          const provData = comparativas[1].proveedores;
          setProveedor2({
            id: comparativas[1].proveedor_id,
            nombre: provData?.nombre_proveedor || '',
            precio: Number(comparativas[1].precio_proveedor),
          });
          if (comparativas[1].es_proveedor_principal) {
            setSelectedProveedor(comparativas[1].proveedor_id);
          }
        }

        if (comparativas[2]) {
          // @ts-ignore - proveedores viene del join en la consulta
          const provData = comparativas[2].proveedores;
          setProveedor3({
            id: comparativas[2].proveedor_id,
            nombre: provData?.nombre_proveedor || '',
            precio: Number(comparativas[2].precio_proveedor),
          });
          if (comparativas[2].es_proveedor_principal) {
            setSelectedProveedor(comparativas[2].proveedor_id);
          }
        }
      }
    } catch (error) {
      console.error('Error cargando comparativas:', error);
    }
  };

  const guardarComparativaProveedores = async (productoCB: string) => {
    try {
      // Validar que productoCB no esté vacío
      if (!productoCB || productoCB.trim() === '') {
        throw new Error('El código del producto es requerido');
      }

      const proveedoresAGuardar = [
        { ...proveedor1, key: 'proveedor1' },
        { ...proveedor2, key: 'proveedor2' },
        { ...proveedor3, key: 'proveedor3' },
      ].filter(p => p.id !== null && p.id !== undefined);

      if (proveedoresAGuardar.length === 0) {
        throw new Error('No hay proveedores para guardar');
      }

      // Obtener las relaciones existentes
      const relacionesExistentes = await apiClient.getProveedoresByProducto(productoCB);
      let existentes = relacionesExistentes;
      if (relacionesExistentes && typeof relacionesExistentes === 'object' && 'data' in relacionesExistentes) {
        existentes = (relacionesExistentes as any).data;
      }
      if (!Array.isArray(existentes)) {
        existentes = [];
      }

      // Guardar cada proveedor
      for (const prov of proveedoresAGuardar) {
        // Validar que los datos requeridos estén presentes
        if (!prov.id) {
          console.warn('Proveedor sin ID, saltando:', prov);
          continue;
        }

        const precioProveedor = Number(prov.precio) || 0;
        
        // Validar que el precio sea mayor a 0 (el backend rechaza precio = 0)
        if (precioProveedor <= 0) {
          console.warn(`Proveedor ${prov.nombre} tiene precio 0 o inválido, saltando`);
          continue;
        }
        
        // Verificar si ya existe esta relación
        const relacionExistente = existentes.find((r: any) => r.proveedor_id === prov.id);
        
        if (relacionExistente) {
          // Actualizar la relación existente
          console.log('Actualizando proveedor existente:', {
            id: relacionExistente.id_producto_proveedor,
            proveedor_id: prov.id,
            precio_proveedor: precioProveedor,
          });
          
          await apiClient.updateProductoProveedor(relacionExistente.id_producto_proveedor, {
            precio_proveedor: precioProveedor,
            es_proveedor_principal: selectedProveedor === prov.id,
            fecha_ultima_compra: null,
          });
        } else {
          // Crear nueva relación
          console.log('Creando nuevo proveedor:', {
            producto_cb: productoCB,
            proveedor_id: prov.id,
            precio_proveedor: precioProveedor,
          });

          await apiClient.createProductoProveedor({
            producto_cb: productoCB,
            proveedor_id: prov.id,
            precio_proveedor: precioProveedor,
            es_proveedor_principal: selectedProveedor === prov.id,
            fecha_ultima_compra: null,
          });
        }
      }

      console.log(`✓ Guardadas ${proveedoresAGuardar.length} comparativas para el producto ${productoCB}`);
    } catch (error) {
      console.error('Error guardando comparativas:', error);
      throw error;
    }
  };

  const resetProveedoresSelector = () => {
    setProveedor1({ id: null, nombre: '', precio: 0 });
    setProveedor2({ id: null, nombre: '', precio: 0 });
    setProveedor3({ id: null, nombre: '', precio: 0 });
    setSelectedProveedor(null);
  };

  const handleCopyProduct = (product: Repuesto) => {
    // Formato: Producto / Tipo / Marca / Modelo / Referencia
    const parts = [
      product.PRODUCTO || '',
      product.TIPO || '',
      product.MARCA || '',
      product.MODELO_ESPECIFICACION || '',
      product.REFERENCIA || ''
    ];
    
    const formattedText = parts.join(' / ');
    
    navigator.clipboard.writeText(formattedText).then(() => {
      setToastMessage('Producto copiado al portapapeles');
      setShowToast(true);
    }).catch((err) => {
      console.error('Error al copiar:', err);
      setToastMessage('Error al copiar el producto');
      setShowToast(true);
    });
  };

  const getCheapestProvider = () => {
    const providers = [
      { key: 'proveedor1', ...proveedor1 },
      { key: 'proveedor2', ...proveedor2 },
      { key: 'proveedor3', ...proveedor3 },
    ].filter(p => p.id !== null && p.precio > 0);

    if (providers.length === 0) return null;

    return providers.reduce((min, p) => p.precio < min.precio ? p : min);
  };

  const handleSelectProveedorWithPrice = async (proveedorKey: 'proveedor1' | 'proveedor2' | 'proveedor3') => {
    const proveedorMap = {
      proveedor1,
      proveedor2,
      proveedor3,
    };
    const proveedor = proveedorMap[proveedorKey];

    if (proveedor.id) {
      setSelectedProveedor(proveedor.id);
      setProveedorData({
        ...proveedorData,
        proveedor: proveedor.nombre,
        costo: proveedor.precio,
      });
      // Actualizar el precio del producto con el precio del proveedor seleccionado
      setFormData({
        ...formData,
        PRECIO: proveedor.precio,
      });

      // Guardar la comparativa en la base de datos solo si el producto ya existe
      if (formData.CB && (modalMode === 'edit' || isExistingProduct)) {
        try {
          await guardarComparativaProveedores(String(formData.CB));
          // Marcar este proveedor como principal
          await apiClient.setProveedorPrincipal({ 
            producto_cb: String(formData.CB), 
            proveedor_id: proveedor.id 
          });
        } catch (error) {
          console.error('Error al guardar comparativa:', error);
        }
      }
    }
  };

  // Obtener valores únicos para los filtros
  const uniqueTipos = Array.from(new Set(products.map(p => p.TIPO).filter(Boolean))) as string[];
  uniqueTipos.sort();
  const uniqueMarcas = Array.from(new Set(products.map(p => p.MARCA).filter(Boolean))) as string[];
  uniqueMarcas.sort();

  useEffect(() => {
    const filtered = products.filter((product) => {
      const searchLower = searchTerm.toLowerCase();
      const productoLower = productoFilter.toLowerCase();

      // Filtro de búsqueda general
      const matchesSearch = searchTerm === '' || (
        String(product.CB).toLowerCase().includes(searchLower) ||
        String(product.CI || '').toLowerCase().includes(searchLower) ||
        (product.PRODUCTO || '').toLowerCase().includes(searchLower) ||
        (product.TIPO || '').toLowerCase().includes(searchLower) ||
        (product.MARCA || '').toLowerCase().includes(searchLower) ||
        (product.MODELO_ESPECIFICACION || '').toLowerCase().includes(searchLower) ||
        (product.REFERENCIA || '').toLowerCase().includes(searchLower)
      );

      // Filtro específico de producto
      const matchesProducto = productoFilter === '' ||
        (product.PRODUCTO || '').toLowerCase().includes(productoLower);

      // Filtro de tipo
      const matchesTipo = tipoFilter === '' || product.TIPO === tipoFilter;

      // Filtro de marca
      const matchesMarca = marcaFilter === '' || product.MARCA === marcaFilter;

      return matchesSearch && matchesProducto && matchesTipo && matchesMarca;
    });

    // Ordenar por CI
    const sorted = [...filtered].sort((a, b) => {
      const ciA = a.CI ? parseInt(String(a.CI)) : 0;
      const ciB = b.CI ? parseInt(String(b.CI)) : 0;
      return sortOrder === 'asc' ? ciA - ciB : ciB - ciA;
    });

    setFilteredProducts(sorted);
    setCurrentPage(1); // Reset to first page when filters change
  }, [searchTerm, productoFilter, tipoFilter, marcaFilter, products, sortOrder]);

  // Calcular productos para la página actual
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentProducts = filteredProducts.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  // Función para normalizar las propiedades de minúsculas a mayúsculas
  const normalizeProduct = (product: any): Repuesto => {
    return {
      CB: product.cb || product.CB || '',
      CI: product.ci || product.CI || null,
      PRODUCTO: product.producto || product.PRODUCTO || '',
      TIPO: product.tipo || product.TIPO || null,
      MODELO_ESPECIFICACION: product.modelo_especificacion || product.MODELO_ESPECIFICACION || null,
      REFERENCIA: product.referencia || product.REFERENCIA || null,
      MARCA: product.marca || product.MARCA || null,
      EXISTENCIAS_INICIALES: product.existencias_iniciales || product.EXISTENCIAS_INICIALES || 0,
      STOCK: product.stock || product.STOCK || 0,
      PRECIO: product.precio || product.PRECIO || 0,
      DESCRIPCION_LARGA: product.descripcion_larga || product.DESCRIPCION_LARGA || null,
      ESTANTE: product.estante || product.ESTANTE || null,
      NIVEL: product.nivel || product.NIVEL || null,
      fecha_creacion: product.fecha_creacion,
      fecha_actualizacion: product.fecha_actualizacion,
      usuario_creacion: product.usuario_creacion,
      activo: product.activo,
    };
  };

  const fetchProducts = async () => {
    try {
      // Solicitar TODOS los productos sin límite (o con un límite muy alto)
      // Si el backend tiene un límite máximo, usar ese valor
      const response = await apiClient.getRepuestos({ limit: 999999 });
      
      // La API devuelve { ok, message, data: [...] }
      let data = response;
      if (response && typeof response === 'object' && 'data' in response) {
        data = (response as any).data;
      }
      
      // Verificar que data sea un array
      if (!Array.isArray(data)) {
        console.error('La respuesta no es un array:', data);
        setProducts([]);
        setFilteredProducts([]);
        return;
      }

      console.log('✓ Inventory - Cargados', data.length, 'productos desde la BD');
      
      // Normalizar los productos (convertir propiedades a mayúsculas)
      const normalizedProducts = data.map(normalizeProduct);
      
      // Mostrar el máximo CI para debug
      const maxCI = Math.max(...normalizedProducts
        .map(p => parseInt(String(p.CI)))
        .filter(ci => !isNaN(ci)));
      console.log('✓ Máximo CI en productos cargados:', maxCI);
      
      setProducts(normalizedProducts);
      setFilteredProducts(normalizedProducts);
    } catch (error) {
      console.error('Error fetching products:', error);
      setProducts([]);
      setFilteredProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const getNextCode = (field: 'CB' | 'CI'): string => {
    console.log(`\n=== Generando siguiente ${field} ===`);
    console.log('Total productos en memoria:', products.length);
    
    // Filtrar productos que tienen valores numéricos en el campo
    const numericCodes = products
      .map(p => {
        const value = field === 'CB' ? p.CB : p.CI;
        const numValue = parseInt(String(value));
        return isNaN(numValue) ? 0 : numValue;
      })
      .filter(num => num > 0);

    console.log(`Códigos ${field} numéricos encontrados:`, numericCodes.length);

    if (numericCodes.length === 0) {
      console.warn(`⚠️ No se encontraron códigos ${field} en memoria. Usando valor por defecto 100001`);
      console.warn('⚠️ RECARGA LA PÁGINA (F5) para cargar todos los productos antes de crear uno nuevo');
      return '100001';
    }

    // Obtener el máximo y sumar 1
    const maxCode = Math.max(...numericCodes);
    console.log(`Máximo ${field} encontrado:`, maxCode);
    
    let nextCode = maxCode + 1;
    
    // Verificar que el código no exista (por si acaso)
    while (products.some(p => {
      const value = field === 'CB' ? p.CB : p.CI;
      return String(value) === String(nextCode);
    })) {
      console.log(`${field} ${nextCode} ya existe, probando siguiente...`);
      nextCode++;
    }
    
    console.log(`✓ Siguiente ${field} generado:`, nextCode);
    return String(nextCode);
  };

  const generateUniqueCB = (ci: string): string => {
    // CB es igual al CI pero con un cero insertado después del primer dígito
    // Ejemplo: CI = 109393 → CB = 1009393
    // Tomar el primer dígito, agregar 0, y luego el resto
    const baseCB = ci.charAt(0) + '0' + ci.slice(1);
    
    // Verificar que no exista en los productos cargados en memoria
    const exists = products.some(p => String(p.CB) === baseCB);
    
    if (exists) {
      // Si existe en memoria, buscar el siguiente CB disponible
      const numericCB = parseInt(baseCB);
      let nextCB = numericCB + 1;
      
      // Buscar el siguiente CB que no exista en memoria
      while (products.some(p => String(p.CB) === String(nextCB))) {
        nextCB++;
      }
      
      console.log(`CB ${baseCB} ya existe, usando ${nextCB}`);
      return String(nextCB);
    }
    
    return baseCB;
  };

  const handleCreate = () => {
    setShowProductTypeDialog(true);
  };

  const handleNewProduct = async () => {
    console.log('\n\n🆕🆕🆕 === CLICK EN AGREGAR PRODUCTO NUEVO === 🆕🆕🆕\n');
    setModalMode('create');
    setShowProductTypeDialog(false);
    
    // Abrir el modal INMEDIATAMENTE con valores vacíos
    setFormData({
      CB: '',
      CI: null,
      PRODUCTO: '',
      TIPO: null,
      MODELO_ESPECIFICACION: null,
      REFERENCIA: null,
      MARCA: null,
      EXISTENCIAS_INICIALES: 0,
      STOCK: 0,
      PRECIO: 0,
      DESCRIPCION_LARGA: null,
      ESTANTE: null,
      NIVEL: null,
    });
    setEntradaStock(0);
    setSalidaStock(0);
    setProveedorData({
      nFactura: '',
      proveedor: '',
      fecha: '',
      cantidad: 0,
      costo: 0,
    });
    resetProveedoresSelector();
    setShowModal(true); // ✅ Modal se abre INSTANTÁNEAMENTE
    
    // Cargar los códigos en segundo plano
    try {
      console.log('🔄 Consultando máximos CI/CB...');
      
      let maxCI = 100000;
      let maxCB = 1000000;
      let usedBackend = false;
      
      try {
        const result = await apiClient.getMaxCodes();
        
        // Manejar diferentes formatos de respuesta
        if (result && typeof result === 'object') {
          // Caso 1: Respuesta del backend optimizado con estructura {ok, message, data: {maxCI, maxCB}}
          if ('data' in result && result.data && typeof result.data === 'object') {
            const data = result.data;
            
            // Verificar si data tiene las propiedades esperadas
            const hasMaxCI = 'maxCI' in data || 'max_ci' in data;
            const hasMaxCB = 'maxCB' in data || 'max_cb' in data;
            
            if (hasMaxCI && hasMaxCB) {
              maxCI = data.maxCI || data.max_ci || 100000;
              maxCB = data.maxCB || data.max_cb || 1000000;
              usedBackend = true;
              console.log('✅ Usando endpoint optimizado del backend');
            }
          } 
          // Caso 2: Respuesta directa del fallback {maxCI, maxCB}
          else if ('maxCI' in result || 'max_ci' in result) {
            maxCI = result.maxCI || result.max_ci || 100000;
            maxCB = result.maxCB || result.max_cb || 1000000;
            usedBackend = true;
            console.log('✅ Usando fallback del apiClient');
          }
        }
      } catch (backendError) {
        console.warn('⚠️ Error consultando backend, usando productos en memoria');
      }
      
      // Si el backend no funcionó, calcular desde los productos en memoria
      if (!usedBackend && products.length > 0) {
        console.log('🔄 Calculando desde productos en memoria...');
        
        const ciValues = products
          .map(p => parseInt(String(p.CI)))
          .filter(ci => !isNaN(ci) && ci > 0);
        
        const cbValues = products
          .map(p => parseInt(String(p.CB)))
          .filter(cb => !isNaN(cb) && cb > 0);
        
        if (ciValues.length > 0) {
          maxCI = Math.max(...ciValues);
        }
        if (cbValues.length > 0) {
          maxCB = Math.max(...cbValues);
        }
        
        console.log('✅ Calculado desde memoria local');
      }
      
      console.log('✅ Máximo CI:', maxCI);
      console.log('✅ Máximo CB:', maxCB);
      
      // Generar el siguiente CI y CB
      const nextCI = String(maxCI + 1);
      const nextCB = String(maxCB + 1);
      
      console.log('✅ Siguiente CI:', nextCI);
      console.log('✅ Siguiente CB:', nextCB);

      // Actualizar el formulario con los códigos reales
      setFormData(prev => ({
        ...prev,
        CB: nextCB,
        CI: nextCI,
      }));
    } catch (error) {
      console.error('❌ Error crítico obteniendo códigos:', error);
      showAlertDialog(
        'Error',
        'No se pudo obtener el siguiente código. Por favor recarga la página e intenta de nuevo.',
        'error'
      );
      // Cerrar el modal si falla
      setShowModal(false);
    }
  };

  const handleExistingProduct = () => {
    setModalMode('create');
    setIsExistingProduct(true);
    setShowProductTypeDialog(false);
    setSearchCI('');

    // Limpiar el formulario
    setFormData({
      CB: '',
      CI: null,
      PRODUCTO: '',
      TIPO: null,
      MODELO_ESPECIFICACION: null,
      REFERENCIA: null,
      MARCA: null,
      EXISTENCIAS_INICIALES: 0,
      STOCK: 0,
      PRECIO: 0,
      DESCRIPCION_LARGA: null,
      ESTANTE: null,
      NIVEL: null,
    });
    setEntradaStock(0);
    setSalidaStock(0);
    setProveedorData({
      nFactura: '',
      proveedor: '',
      fecha: '',
      cantidad: 0,
      costo: 0,
    });
    setShowModal(true);
  };

  const handleCISearch = async (ci: string) => {
    setSearchCI(ci);

    if (!ci) {
      // Si se borra el CI, limpiar el formulario
      setFormData({
        CB: '',
        CI: null,
        PRODUCTO: '',
        TIPO: null,
        MODELO_ESPECIFICACION: null,
        REFERENCIA: null,
        MARCA: null,
        EXISTENCIAS_INICIALES: 0,
        STOCK: 0,
        PRECIO: 0,
        DESCRIPCION_LARGA: null,
        ESTANTE: null,
        NIVEL: null,
      });
      resetProveedoresSelector();
      setShowProveedorSelector(false);
      return;
    }

    // Buscar el producto por CI
    const foundProduct = products.find(p => String(p.CI) === ci);

    if (foundProduct) {
      // Autocompletar los campos de información del producto con el stock real
      setFormData({
        ...foundProduct,
      });

      // Cargar automáticamente los proveedores de este producto
      await cargarComparativaProveedores(String(foundProduct.CB));

      // NO abrir automáticamente el selector de proveedores
      // El usuario puede abrirlo manualmente si lo necesita
    } else {
      // Si no se encuentra, generar un nuevo CB basado en el CI ingresado
      const nextCB = generateUniqueCB(ci);
      setFormData({
        CB: nextCB,
        CI: ci,
        PRODUCTO: '',
        TIPO: null,
        MODELO_ESPECIFICACION: null,
        REFERENCIA: null,
        MARCA: null,
        EXISTENCIAS_INICIALES: 0,
        STOCK: 0,
        PRECIO: 0,
        DESCRIPCION_LARGA: null,
        ESTANTE: null,
        NIVEL: null,
      });
      resetProveedoresSelector();
      setShowProveedorSelector(false);
    }
  };



  const handleViewDetails = (product: Repuesto) => {
    setSelectedProduct(product);
    setViewMode('details');
  };

  const handleBackToList = () => {
    setViewMode('list');
    setSelectedProduct(null);
  };

  const handleEdit = (product: Repuesto) => {
    setModalMode('edit');
    setSelectedProduct(product);
    setFormData({ ...product });
    setEntradaStock(0);
    setSalidaStock(0);
    setProveedorData({
      nFactura: '',
      proveedor: '',
      fecha: '',
      cantidad: 0,
      costo: 0,
    });
    setShowModal(true);
  };

  const handleDelete = (cb: string | number) => {
    setProductToDelete(cb);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!productToDelete) return;

    try {
      await apiClient.deleteRepuesto(String(productToDelete));
      await fetchProducts();
      setShowDeleteDialog(false);
      setProductToDelete(null);
    } catch (error) {
      console.error('Error deleting product:', error);
      showAlertDialog('Error', 'No se pudo eliminar el producto. Por favor intenta de nuevo.', 'error');
    }
  };

  const cancelDelete = () => {
    setShowDeleteDialog(false);
    setProductToDelete(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      console.log('=== GUARDANDO PRODUCTO ===');
      console.log('CB a guardar:', formData.CB);
      console.log('CI a guardar:', formData.CI);
      console.log('Modo:', modalMode);
      console.log('Es producto existente:', isExistingProduct);
      
      // Calcular el nuevo stock
      const stockActual = typeof formData.STOCK === 'string' ? parseInt(formData.STOCK) : formData.STOCK;

      // FIX: Para productos existentes, mantenemos el stock actual y dejamos que el trigger 'trigger_actualizar_stock_entrada'
      // sume la cantidad automáticamente al crear la entrada.
      const nuevoStock = isExistingProduct
        ? stockActual
        : (modalMode === 'edit' ? stockActual + entradaStock - salidaStock : stockActual);

      // Convertir campos a minúsculas para el backend
      const dataToSave = {
        cb: formData.CB,
        ci: formData.CI,
        producto: formData.PRODUCTO,
        tipo: formData.TIPO,
        modelo_especificacion: formData.MODELO_ESPECIFICACION,
        referencia: formData.REFERENCIA,
        marca: formData.MARCA,
        existencias_iniciales: formData.EXISTENCIAS_INICIALES,
        stock: nuevoStock,
        precio: formData.PRECIO,
        descripcion_larga: formData.DESCRIPCION_LARGA,
        estante: formData.ESTANTE,
        nivel: formData.NIVEL,
      };

      if (modalMode === 'create') {
        if (isExistingProduct) {
          // Actualizar producto existente con nuevo stock
          await apiClient.updateRepuesto(String(formData.CB), dataToSave);

          // Guardar comparativas para producto existente
          const hayProveedores = proveedor1.id || proveedor2.id || proveedor3.id;
          if (hayProveedores && formData.CB) {
            try {
              await guardarComparativaProveedores(String(formData.CB));
            } catch (error) {
              console.error('Error al guardar comparativas:', error);
            }
          }

          // Crear entrada si hay datos de proveedor
          if (proveedorData.cantidad > 0) {
            // Generar número de factura si no existe
            const nFactura = proveedorData.nFactura && proveedorData.nFactura.trim() !== '' 
              ? proveedorData.nFactura 
              : `FAC-${Date.now()}`;
            
            const entradaData = {
              n_factura: nFactura,
              proveedor: proveedorData.proveedor || 'N/A',
              fecha: proveedorData.fecha || new Date().toISOString().split('T')[0],
              cb: String(formData.CB),
              ci: formData.CI ? String(formData.CI) : null,
              descripcion: formData.PRODUCTO,
              cantidad: proveedorData.cantidad,
              costo: proveedorData.costo,
              valor_venta: formData.PRECIO,
              siigo: null,
              columna1: null,
            };
            
            console.log('Creando entrada con datos:', entradaData);
            await apiClient.createEntrada(entradaData);
          }
        } else {
          // Crear producto nuevo
          await apiClient.createRepuesto(dataToSave);

          // Guardar comparativas DESPUÉS de crear el producto
          const hayProveedores = proveedor1.id || proveedor2.id || proveedor3.id;
          if (hayProveedores && formData.CB) {
            try {
              await guardarComparativaProveedores(String(formData.CB));
            } catch (error) {
              console.error('Error al guardar comparativas:', error);
            }
          }
        }
      } else {
        // Editar producto existente
        await apiClient.updateRepuesto(String(selectedProduct!.CB), dataToSave);

        // Guardar comparativas para producto editado
        const hayProveedores = proveedor1.id || proveedor2.id || proveedor3.id;
        if (hayProveedores && formData.CB) {
          try {
            await guardarComparativaProveedores(String(formData.CB));
          } catch (error) {
            console.error('Error al guardar comparativas:', error);
          }
        }

        // Crear entrada si hay entradas de stock
        if (entradaStock > 0 && proveedorData.cantidad > 0) {
          // Generar número de factura si no existe
          const nFactura = proveedorData.nFactura && proveedorData.nFactura.trim() !== '' 
            ? proveedorData.nFactura 
            : `FAC-${Date.now()}`;
          
          await apiClient.createEntrada({
            n_factura: nFactura,
            proveedor: proveedorData.proveedor || 'N/A',
            fecha: proveedorData.fecha || new Date().toISOString().split('T')[0],
            cb: String(formData.CB),
            ci: formData.CI ? String(formData.CI) : null,
            descripcion: formData.PRODUCTO,
            cantidad: proveedorData.cantidad,
            costo: proveedorData.costo,
            valor_venta: formData.PRECIO,
            siigo: null,
            columna1: null,
          });
        }
      }

      setShowModal(false);
      setIsExistingProduct(false);
      setSearchCI('');
      setEntradaStock(0);
      setSalidaStock(0);
      setProveedorData({
        nFactura: '',
        proveedor: '',
        fecha: '',
        cantidad: 0,
        costo: 0,
      });
      await fetchProducts();
    } catch (error: any) {
      console.error('Error saving product:', error);
      
      // Detectar error de duplicate key
      if (error?.message?.includes('duplicate key') || 
          error?.message?.includes('already exists') ||
          error?.message?.includes('unique constraint')) {
        showAlertDialog(
          'Código duplicado',
          `El código CB ${formData.CB} ya existe en la base de datos.\n\nPor favor recarga la página (F5) para actualizar la lista de productos e intenta de nuevo.`,
          'error'
        );
      } else {
        showAlertDialog(
          'Error al guardar',
          `No se pudo guardar el producto:\n${error?.message || 'Error desconocido'}`,
          'error'
        );
      }
    }
  };

  return (
    <div className="p-8">
      {/* Vista de Detalles del Producto */}
      {viewMode === 'details' && selectedProduct && (
        <div>
          {/* Header con botón de volver */}
          <div className="mb-6">
            <button
              onClick={handleBackToList}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">Volver al inventario</span>
            </button>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Detalles del Producto</h1>
            <p className="text-gray-600">Información completa del producto seleccionado</p>
          </div>

          {/* Contenido de Detalles - Diseño Minimalista */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            {/* Header Minimalista */}
            <div className="border-b border-gray-200 p-8">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-3xl font-semibold text-gray-900 mb-2">{selectedProduct.PRODUCTO}</h2>
                  <p className="text-gray-500">Código: {selectedProduct.CB}</p>
                </div>
                <Eye className="w-8 h-8 text-gray-400" />
              </div>
            </div>

            {/* Contenido */}
            <div className="p-8">


              {/* Información Principal */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
                <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Código de Barras</p>
                  <p className="text-3xl font-semibold text-gray-900">{selectedProduct.CB}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Código Interno</p>
                  <p className="text-3xl font-semibold text-gray-900">{selectedProduct.CI || '-'}</p>
                </div>
              </div>

              {/* Descripción */}
              {selectedProduct.DESCRIPCION_LARGA && (
                <div className="mb-10 pb-10 border-b border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Descripción</h3>
                  <p className="text-gray-700 leading-relaxed">{selectedProduct.DESCRIPCION_LARGA}</p>
                </div>
              )}

              {/* Detalles del Producto */}
              <div className="mb-10 pb-10 border-b border-gray-200">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-6">Información del Producto</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="border-l-2 border-gray-300 pl-4">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Tipo</p>
                    <p className="text-lg font-medium text-gray-900">{selectedProduct.TIPO || '-'}</p>
                  </div>
                  <div className="border-l-2 border-gray-300 pl-4">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Marca</p>
                    <p className="text-lg font-medium text-gray-900">{selectedProduct.MARCA || '-'}</p>
                  </div>
                  <div className="border-l-2 border-gray-300 pl-4">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Referencia</p>
                    <p className="text-lg font-medium text-gray-900 font-mono">{selectedProduct.REFERENCIA || '-'}</p>
                  </div>
                  <div className="border-l-2 border-gray-300 pl-4">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Modelo / Especificación</p>
                    <p className="text-lg font-medium text-gray-900">{selectedProduct.MODELO_ESPECIFICACION || '-'}</p>
                  </div>
                  <div className="border-l-2 border-gray-300 pl-4">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Estante</p>
                    <p className="text-lg font-medium text-gray-900">{selectedProduct.ESTANTE || '-'}</p>
                  </div>
                  <div className="border-l-2 border-gray-300 pl-4">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Nivel</p>
                    <p className="text-lg font-medium text-gray-900">{selectedProduct.NIVEL || '-'}</p>
                  </div>
                </div>
              </div>

              {/* Stock y Precio */}
              <div className="mb-8">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-6">Información Financiera</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gray-50 rounded-lg p-6 border border-gray-200 text-center">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Stock Actual</p>
                    <p className="text-4xl font-semibold text-gray-900 mb-2">{selectedProduct.STOCK}</p>
                    <p className="text-xs text-gray-500">unidades disponibles</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-6 border border-gray-200 text-center">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Precio Unitario</p>
                    <p className="text-4xl font-semibold text-gray-900 mb-2">${Number(selectedProduct.PRECIO).toFixed(2)}</p>
                    <p className="text-xs text-gray-500">por unidad</p>
                  </div>
                  
                </div>
              </div>

              {/* Botones de Acción */}
              <div className="flex gap-3 justify-between pt-6 border-t border-gray-200">
                <button
                  onClick={() => setShowHistorialModal(true)}
                  className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium flex items-center gap-2"
                >
                  <History className="w-4 h-4" />
                  Historial Proveedores
                </button>
                <div className="flex gap-3">
                  <button
                    onClick={handleBackToList}
                    className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
                  >
                    Volver
                  </button>
                  {isAdmin && (
                    <button
                      onClick={() => {
                        handleEdit(selectedProduct);
                        setViewMode('list');
                      }}
                      className="px-6 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition font-medium flex items-center gap-2"
                    >
                      <Edit2 className="w-4 h-4" />
                      Editar Producto
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Vista de Lista de Inventario */}
      {viewMode === 'list' && (
        <>
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Inventario</h1>
            <p className="text-gray-600">Gestiona todos los productos del inventario</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            {/* Búsqueda general */}
            <div className="flex flex-col md:flex-row gap-4 mb-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Buscar por código (CB/CI), nombre, tipo, marca, referencia o modelo..."
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
              {permisos.puedeCrearInventario && (
                <button
                  onClick={handleCreate}
                  className="bg-gray-900 text-white px-6 py-2 rounded-lg hover:bg-gray-800 transition flex items-center gap-2 font-medium"
                >
                  <Plus className="w-5 h-5" />
                  Agregar Producto
                </button>
              )}
            </div>

            {/* Filtros específicos */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                  </svg>
                  Filtros Avanzados
                </h3>
                {(productoFilter || tipoFilter || marcaFilter) && (
                  <button
                    onClick={() => {
                      setProductoFilter('');
                      setTipoFilter('');
                      setMarcaFilter('');
                    }}
                    className="text-xs text-gray-600 hover:text-gray-900 font-medium flex items-center gap-1 transition-colors"
                  >
                    <X className="w-3 h-3" />
                    Limpiar filtros
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-lg p-3 border border-gray-200">
                  <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                    Producto
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Buscar producto..."
                      value={productoFilter}
                      onChange={(e) => setProductoFilter(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none transition-all"
                    />
                  </div>
                  {productoFilter && (
                    <div className="mt-2 text-xs text-gray-500">
                      Filtrando por: <span className="font-medium text-gray-700">{productoFilter}</span>
                    </div>
                  )}
                </div>

                <div className="bg-white rounded-lg p-3 border border-gray-200">
                  <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                    Tipo
                  </label>
                  <CustomSelect
                    value={tipoFilter}
                    onChange={setTipoFilter}
                    options={uniqueTipos}
                    placeholder="Todos los tipos"
                    label="Tipo"
                  />
                  {tipoFilter && (
                    <div className="mt-2 text-xs text-gray-500">
                      Seleccionado: <span className="font-medium text-gray-700">{tipoFilter}</span>
                    </div>
                  )}
                </div>

                <div className="bg-white rounded-lg p-3 border border-gray-200">
                  <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                    Marca
                  </label>
                  <CustomSelect
                    value={marcaFilter}
                    onChange={setMarcaFilter}
                    options={uniqueMarcas}
                    placeholder="Todas las marcas"
                    label="Marca"
                  />
                  {marcaFilter && (
                    <div className="mt-2 text-xs text-gray-500">
                      Seleccionada: <span className="font-medium text-gray-700">{marcaFilter}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Contador de resultados */}
              <div className="mt-4 pt-3 border-t border-gray-200">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-600">
                    {filteredProducts.length === products.length ? (
                      <>Mostrando todos los productos ({products.length})</>
                    ) : (
                      <>
                        <span className="font-semibold text-gray-900">{filteredProducts.length}</span> de {products.length} productos
                      </>
                    )}
                  </span>
                  {(productoFilter || tipoFilter || marcaFilter) && (
                    <span className="text-gray-500 flex items-center gap-1">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Filtros activos
                    </span>
                  )}
                </div>
              </div>
            </div>

            {loading ? (
              <TableSkeleton rows={itemsPerPage} columns={permisos.puedeEditarInventario || permisos.puedeEliminarInventario ? 8 : 7} />
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-12 text-gray-600">
                No se encontraron productos
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                        <button
                          onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                          className="flex items-center gap-1 hover:text-gray-900 transition-colors"
                        >
                          Código CI
                          <ArrowUpDown className="w-4 h-4" />
                        </button>
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                        Producto
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                        Tipo
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                        Marca
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                        Modelo/Especificación
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                        Referencia
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                        Stock
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                        Precio
                      </th>
                      {(permisos.puedeEditarInventario || permisos.puedeEliminarInventario) && (
                        <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">
                          Acciones
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {currentProducts.map((product) => (
                      <tr
                        key={product.CB}
                        className="border-b border-gray-100 hover:bg-gray-50"
                      >
                        <td className="py-3 px-4 text-sm text-gray-900 font-medium">
                          {product.CI || '-'}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-700">
                          {product.PRODUCTO}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-700">
                          {product.TIPO || '-'}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-700">
                          {product.MARCA || '-'}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-700">
                          {product.MODELO_ESPECIFICACION || '-'}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-700 font-mono">
                          {product.REFERENCIA || '-'}
                        </td>
                        <td className="py-3 px-4 text-sm">
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${Number(product.STOCK) < 10
                              ? 'bg-red-100 text-red-700'
                              : 'bg-green-100 text-green-700'
                              }`}
                          >
                            {product.STOCK}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-900 font-medium">
                          ${Number(product.PRECIO).toFixed(2)}
                        </td>
                        {(permisos.puedeEditarInventario || permisos.puedeEliminarInventario) && (
                          <td className="py-3 px-4">
                            <div className="flex justify-center gap-2">
                              <button
                                onClick={() => handleCopyProduct(product)}
                                className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition"
                                title="Copiar producto"
                              >
                                <Copy className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleViewDetails(product)}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                title="Ver detalles"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              {permisos.puedeEditarInventario && (
                                <button
                                  onClick={() => handleEdit(product)}
                                  className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                                  title="Editar"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                              )}
                              {permisos.puedeEliminarInventario && (
                                <button
                                  onClick={() => handleDelete(product.CB)}
                                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                                  title="Eliminar"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Paginación */}
            {filteredProducts.length > 0 && (
              <div className="mt-6 flex items-center justify-between border-t border-gray-200 pt-4">
                <div className="text-sm text-gray-600">
                  Mostrando {indexOfFirstItem + 1} a {Math.min(indexOfLastItem, filteredProducts.length)} de {filteredProducts.length} productos
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-3 py-1 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    Anterior
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                    // Mostrar solo algunas páginas alrededor de la actual
                    if (
                      page === 1 ||
                      page === totalPages ||
                      (page >= currentPage - 1 && page <= currentPage + 1)
                    ) {
                      return (
                        <button
                          key={page}
                          onClick={() => handlePageChange(page)}
                          className={`px-3 py-1 border rounded-lg text-sm font-medium transition ${currentPage === page
                            ? 'bg-gray-900 text-white border-gray-900'
                            : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                            }`}
                        >
                          {page}
                        </button>
                      );
                    } else if (
                      page === currentPage - 2 ||
                      page === currentPage + 2
                    ) {
                      return <span key={page} className="px-2 text-gray-400">...</span>;
                    }
                    return null;
                  })}

                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    Siguiente
                  </button>
                </div>
              </div>
            )}
          </div>

          {showModal && (
            <div
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[100]"
            >
              <div
                className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto relative"
              >
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                  <h2 className="text-xl font-bold text-gray-900">
                    {modalMode === 'create'
                      ? (isExistingProduct ? 'Agregar Stock a Producto Existente' : 'Agregar Producto Nuevo')
                      : 'Editar Producto'}
                  </h2>
                  <button
                    onClick={() => {
                      setShowModal(false);
                      setIsExistingProduct(false);
                      setSearchCI('');
                      setShowProveedorSelector(false);
                      setSelectedProveedor(null);
                      setProveedorData({
                        nFactura: '',
                        proveedor: '',
                        fecha: '',
                        cantidad: 0,
                        costo: 0,
                      });
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6">
                  {/* Sección: Información del Producto */}
                  <div className="mb-8">
                    <div className="flex items-center gap-2 mb-4 pb-2 border-b-2 border-gray-900">
                      <div className="w-1 h-6 bg-gray-900 rounded"></div>
                      <h3 className="text-lg font-bold text-gray-900 uppercase tracking-wide">
                        Información del Producto
                      </h3>
                    </div>

                    {/* Campo CI para buscar producto existente - Siempre visible */}
                    {isExistingProduct && (
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                          Código Interno (CI) *
                          <Tooltip content="Ingresa el CI para buscar el producto" />
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            value={searchCI || ''}
                            onChange={(e) => handleCISearch(e.target.value)}
                            placeholder="Ingresa el CI del producto"
                            required
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                            list="ci-list"
                          />
                          <datalist id="ci-list">
                            {products.map((prod, idx) => (
                              <option key={idx} value={String(prod.CI)} />
                            ))}
                          </datalist>
                          {searchCI && formData.PRODUCTO && (
                            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                              <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded font-medium">
                                ✓ Encontrado
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Mostrar información del producto en formato de texto cuando se encuentra */}
                    {isExistingProduct && formData.PRODUCTO ? (
                      <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div>
                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Producto</p>
                            <p className="text-base font-semibold text-gray-900">{formData.PRODUCTO}</p>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Tipo</p>
                            <p className="text-base font-semibold text-gray-900">{formData.TIPO || 'NN'}</p>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Marca</p>
                            <p className="text-base font-semibold text-gray-900">{formData.MARCA || 'NN'}</p>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Referencia</p>
                            <p className="text-base font-semibold text-gray-900">{formData.REFERENCIA || 'NN'}</p>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Modelo</p>
                            <p className="text-base font-semibold text-gray-900">{formData.MODELO_ESPECIFICACION || 'NN'}</p>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Stock Disponible</p>
                            <p className="text-base font-bold text-green-600">{formData.STOCK} unidades</p>
                          </div>
                        </div>
                      </div>
                    ) : !isExistingProduct && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                            Código Barras (CB)
                            <Tooltip content="Código De Barras (generado automáticamente)" />
                          </label>
                          {modalMode === 'edit' ? (
                            <div className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 font-medium">
                              {formData.CB || '-'}
                            </div>
                          ) : (
                            <div className="relative">
                              <input
                                type="text"
                                value={formData.CB || ''}
                                readOnly
                                className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 font-medium cursor-not-allowed"
                              />
                              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded font-medium">
                                  Auto
                                </span>
                              </div>
                            </div>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                            Código Interno (CI) {isExistingProduct && '*'}
                            <Tooltip content={isExistingProduct ? "Ingresa el CI para buscar el producto" : "Código interno (generado automáticamente)"} />
                          </label>
                          {modalMode === 'edit' ? (
                            <div className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 font-medium">
                              {formData.CI || '-'}
                            </div>
                          ) : isExistingProduct ? (
                            <div className="relative">
                              <input
                                type="text"
                                value={searchCI || ''}
                                onChange={(e) => handleCISearch(e.target.value)}
                                placeholder="Ingresa el CI del producto"
                                required
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                                list="ci-list"
                              />
                              <datalist id="ci-list">
                                {products.map((prod, idx) => (
                                  <option key={idx} value={String(prod.CI)} />
                                ))}
                              </datalist>
                              {searchCI && formData.PRODUCTO && (
                                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                  <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded font-medium">
                                    ✓ Encontrado
                                  </span>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="relative">
                              <input
                                type="text"
                                value={formData.CI || ''}
                                readOnly
                                className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 font-medium cursor-not-allowed"
                              />
                              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded font-medium">
                                  Auto
                                </span>
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                            Producto *
                            <Tooltip content="Usa / para separar: Producto/Tipo/Marca/Modelo/Referencia" />
                          </label>
                          <input
                            type="text"
                            required
                            value={formData.PRODUCTO || ''}
                            onChange={(e) => {
                              const value = e.target.value;
                              
                              // Detectar si hay separadores "/"
                              if (value.includes('/')) {
                                const parts = value.split('/').map(p => p.trim());
                                
                                // Formato: Producto / Tipo / Marca / Modelo / Referencia
                                // Si una parte está vacía (/ /), dejar el campo vacío
                                setFormData({
                                  ...formData,
                                  PRODUCTO: parts[0] || '',
                                  TIPO: parts[1] !== undefined ? parts[1] : formData.TIPO,
                                  MARCA: parts[2] !== undefined ? parts[2] : formData.MARCA,
                                  MODELO_ESPECIFICACION: parts[3] !== undefined ? parts[3] : formData.MODELO_ESPECIFICACION,
                                  REFERENCIA: parts[4] !== undefined ? parts[4] : formData.REFERENCIA,
                                });
                              } else {
                                setFormData({ ...formData, PRODUCTO: value });
                              }
                            }}
                            readOnly={(isGestionInventario && modalMode === 'edit') || (isExistingProduct && !!formData.PRODUCTO)}
                            placeholder="Ej: Filtro de aceite, Abrazadera, etc."
                            className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none ${isExistingProduct && formData.PRODUCTO ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                            list="productos-list"
                          />
                          <datalist id="productos-list">
                            {Array.from(new Set(products.map(p => p.PRODUCTO))).map((prod, idx) => (
                              <option key={idx} value={prod} />
                            ))}
                          </datalist>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                            Tipo
                            <Tooltip content="Categoría del repuesto" />
                          </label>
                          <input
                            type="text"
                            value={formData.TIPO || ''}
                            onChange={(e) => setFormData({ ...formData, TIPO: e.target.value || null })}
                            readOnly={isGestionInventario && modalMode === 'edit'}
                            placeholder="Selecciona o escribe un tipo"
                            className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none ${isGestionInventario && modalMode === 'edit' ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                            list="tipos-list"
                          />
                          <datalist id="tipos-list">
                            {uniqueTipos.map((tipo, idx) => (
                              <option key={idx} value={tipo} />
                            ))}
                          </datalist>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                            Marca
                            <Tooltip content="Marca del fabricante" />
                          </label>
                          <input
                            type="text"
                            value={formData.MARCA || ''}
                            onChange={(e) => setFormData({ ...formData, MARCA: e.target.value || null })}
                            readOnly={isGestionInventario && modalMode === 'edit'}
                            placeholder="Selecciona o escribe una marca"
                            className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none ${isGestionInventario && modalMode === 'edit' ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                            list="marcas-list"
                          />
                          <datalist id="marcas-list">
                            {uniqueMarcas.map((marca, idx) => (
                              <option key={idx} value={marca} />
                            ))}
                          </datalist>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                            Modelo / Especificación
                            <Tooltip content="Modelo compatible" />
                          </label>
                          <input
                            type="text"
                            value={formData.MODELO_ESPECIFICACION || ''}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                MODELO_ESPECIFICACION: e.target.value || null,
                              })
                            }
                            readOnly={isGestionInventario && modalMode === 'edit'}
                            placeholder="Ej: Mazda 3, Toyota Corolla 2015"
                            className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none ${isGestionInventario && modalMode === 'edit' ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                            Referencia
                            <Tooltip content="Referencia del fabricante" />
                          </label>
                          <input
                            type="text"
                            value={formData.REFERENCIA || ''}
                            onChange={(e) =>
                              setFormData({ ...formData, REFERENCIA: e.target.value || null })
                            }
                            readOnly={(isGestionInventario && modalMode === 'edit') || (isExistingProduct && !!formData.PRODUCTO)}
                            placeholder="Ej: B097-34-160"
                            className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none ${isExistingProduct && formData.PRODUCTO ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                            Estante
                            <Tooltip content="Ubicación del estante" />
                          </label>
                          <input
                            type="text"
                            value={formData.ESTANTE || ''}
                            onChange={(e) =>
                              setFormData({ ...formData, ESTANTE: e.target.value || null })
                            }
                            placeholder="Ej: A1, B2, C3"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                            Nivel
                            <Tooltip content="Nivel en el estante" />
                          </label>
                          <input
                            type="text"
                            value={formData.NIVEL || ''}
                            onChange={(e) =>
                              setFormData({ ...formData, NIVEL: e.target.value || null })
                            }
                            placeholder="Ej: 1, 2, 3"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none"
                          />
                        </div>

                        {modalMode === 'create' && !isExistingProduct && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                              Stock Inicial *
                              <Tooltip content="Cantidad inicial en inventario" />
                            </label>
                            <input
                              type="number"
                              min="0"
                              required
                              value={formData.STOCK || ''}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  STOCK: parseInt(e.target.value) || 0,
                                })
                              }
                              placeholder="Ej: 50"
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none"
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Sección: Información de Proveedores */}
                  {modalMode === 'create' && (
                    <div className="mb-6">
                      <div className="flex items-center gap-2 mb-4 pb-2 border-b-2 border-red-600">
                        <div className="w-1 h-6 bg-red-600 rounded"></div>
                        <h3 className="text-lg font-bold text-gray-900 uppercase tracking-wide">
                          Información de Proveedores
                        </h3>
                      </div>

                      {/* Botón para abrir selector de proveedores */}
                      <div className="flex justify-center mb-4">
                        <button
                          type="button"
                          onClick={() => {
                            setShowProveedorSelector(true);
                            // Cargar comparativas guardadas si el producto ya existe
                            if (formData.CB) {
                              cargarComparativaProveedores(String(formData.CB));
                            }
                          }}
                          className="px-8 py-3 bg-black text-white rounded-full hover:bg-gray-800 transition font-medium text-sm"
                        >
                          Seleccionar proveedor del producto
                        </button>
                      </div>

                      {/* Mostrar proveedor seleccionado */}
                      {selectedProveedor && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-gray-700">Proveedor seleccionado:</p>
                              <p className="text-lg font-semibold text-gray-900">
                                {availableProveedores.find(p => p.id_proveedor === selectedProveedor)?.nombre_proveedor}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => setSelectedProveedor(null)}
                              className="text-red-600 hover:text-red-700 text-sm font-medium"
                            >
                              Cambiar
                            </button>
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            N° Factura
                          </label>
                          <input
                            type="text"
                            value={proveedorData.nFactura || ''}
                            onChange={(e) => setProveedorData({ ...proveedorData, nFactura: e.target.value })}
                            placeholder="Ej: FAC-2024-001"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Fecha
                          </label>
                          <input
                            type="date"
                            value={proveedorData.fecha || ''}
                            onChange={(e) => setProveedorData({ ...proveedorData, fecha: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent outline-none"
                          />
                        </div>

                        {isExistingProduct && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Cantidad *
                            </label>
                            <input
                              type="number"
                              min="0"
                              value={proveedorData.cantidad || ''}
                              onChange={(e) => setProveedorData({ ...proveedorData, cantidad: parseInt(e.target.value) || 0 })}
                              required
                              placeholder="Ej: 10"
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent outline-none"
                            />
                          </div>
                        )}

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                            Costo
                            <Tooltip content="Costo de compra al proveedor" />
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={proveedorData.costo || ''}
                            onChange={(e) => setProveedorData({ ...proveedorData, costo: parseFloat(e.target.value) || 0 })}
                            placeholder="Ej: 15.00"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                            Valor Venta *
                            <Tooltip content="Precio de venta al cliente" />
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            required
                            value={formData.PRECIO || ''}
                            readOnly={false}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                PRECIO: parseFloat(e.target.value) || 0,
                              })
                            }
                            placeholder="Ej: 25.50"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Sección de edición: Entradas y Salidas */}
                  {modalMode === 'edit' && (
                    <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <h4 className="text-sm font-semibold text-gray-900 mb-3">Ajuste de Stock y Precio</h4>
                      
                      {/* Campo de Precio */}
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                          Precio de Venta *
                          <Tooltip content="Precio de venta al cliente" />
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          required
                          value={formData.PRECIO || ''}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              PRECIO: parseFloat(e.target.value) || 0,
                            })
                          }
                          placeholder="Ej: 25.50"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                            Cantidad Actual
                            <Tooltip content="Stock actual en inventario (solo lectura)" />
                          </label>
                          <input
                            type="number"
                            value={formData.STOCK || 0}
                            readOnly
                            className="w-full px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-900 font-medium cursor-not-allowed"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                            Entradas (+)
                            <Tooltip content="Cantidad a agregar al stock" />
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={entradaStock || ''}
                            onChange={(e) => setEntradaStock(parseInt(e.target.value) || 0)}
                            placeholder="Ej: 10"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-600 focus:border-transparent outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                            Salidas (-)
                            <Tooltip content="Cantidad a quitar del stock" />
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={salidaStock || ''}
                            onChange={(e) => setSalidaStock(parseInt(e.target.value) || 0)}
                            placeholder="Ej: 5"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent outline-none"
                          />
                        </div>
                      </div>

                      {(entradaStock > 0 || salidaStock > 0) && (
                        <div className="mt-4 p-3 bg-white border border-blue-300 rounded-lg">
                          <div className="text-sm text-blue-900">
                            <div className="font-medium mb-2">Resumen del ajuste:</div>
                            <div className="space-y-1">
                              <div>Stock actual: <span className="font-bold">{typeof formData.STOCK === 'string' ? parseInt(formData.STOCK) : formData.STOCK}</span></div>
                              {entradaStock > 0 && <div className="text-green-700">+ Entradas: {entradaStock}</div>}
                              {salidaStock > 0 && <div className="text-red-700">- Salidas: {salidaStock}</div>}
                              <div className="pt-2 border-t border-blue-300">
                                Nuevo stock: <span className="font-bold text-lg">{(typeof formData.STOCK === 'string' ? parseInt(formData.STOCK) : formData.STOCK) + entradaStock - salidaStock}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex gap-3 mt-6">
                    <button
                      type="submit"
                      className="flex-1 bg-gray-900 text-white py-2 px-4 rounded-lg hover:bg-gray-800 transition font-medium"
                    >
                      {modalMode === 'create'
                        ? (isExistingProduct ? 'Agregar Stock' : 'Crear Producto')
                        : 'Guardar Cambios'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowModal(false);
                        setIsExistingProduct(false);
                        setSearchCI('');
                        setShowProveedorSelector(false);
                        setSelectedProveedor(null);
                        setProveedorData({
                          nFactura: '',
                          proveedor: '',
                          fecha: '',
                          cantidad: 0,
                          costo: 0,
                        });
                      }}
                      className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition font-medium"
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              </div>
            </div >
          )
          }

          {/* Modal de Selector de Proveedores */}
          {showProveedorSelector && (
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[120]"
              onClick={() => setShowProveedorSelector(false)}
            >
              <div
                className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header */}
                <div className="bg-white px-6 py-5 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-gray-900">Seleccionar proveedor del producto</h2>
                    <button
                      onClick={() => {
                        setShowProveedorSelector(false);
                        resetProveedoresSelector();
                      }}
                      className="text-gray-400 hover:text-gray-600 transition"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>
                </div>

                <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Columna Izquierda: Información del Producto + Información del Proveedor */}
                    <div className="space-y-6">
                      {/* Información del Producto */}
                      <div className="bg-gray-100 rounded-xl p-5">
                        <h3 className="text-sm font-bold text-gray-700 mb-4">
                          Información del producto
                        </h3>

                        <div className="space-y-3">
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">
                                CB
                              </label>
                              <div className="bg-white px-3 py-2 rounded-lg text-sm text-gray-900">
                                {formData.CB || '-'}
                              </div>
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">
                                CI
                              </label>
                              <div className="bg-white px-3 py-2 rounded-lg text-sm text-gray-900">
                                {formData.CI || '-'}
                              </div>
                            </div>
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Producto
                            </label>
                            <div className="bg-white px-3 py-2 rounded-lg text-sm text-gray-900">
                              {formData.PRODUCTO || '-'}
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">
                                Marca
                              </label>
                              <div className="bg-white px-3 py-2 rounded-lg text-sm text-gray-900">
                                {formData.MARCA || '-'}
                              </div>
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">
                                Tipo / Modelo
                              </label>
                              <div className="bg-white px-3 py-2 rounded-lg text-sm text-gray-900">
                                {formData.TIPO || '-'}
                              </div>
                            </div>
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Referencia
                            </label>
                            <div className="bg-white px-3 py-2 rounded-lg text-sm text-gray-900">
                              {formData.REFERENCIA || '-'}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Información del Proveedor */}
                      <div className="bg-gray-100 rounded-xl p-5">
                        <h3 className="text-sm font-bold text-gray-700 mb-4">
                          Información del proveedor
                        </h3>

                        <div className="space-y-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Nombre
                            </label>
                            <input
                              type="text"
                              value={proveedorData.proveedor || ''}
                              onChange={(e) => setProveedorData({ ...proveedorData, proveedor: e.target.value })}
                              placeholder="Nombre del proveedor"
                              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Precio
                            </label>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={proveedorData.costo || ''}
                              onChange={(e) => setProveedorData({ ...proveedorData, costo: parseFloat(e.target.value) || 0 })}
                              placeholder="0.00"
                              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Columna Derecha: Lista de Proveedores */}
                    <div className="bg-gray-50 rounded-xl p-5">
                      <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                        {/* Proveedor 1 */}
                        <div className={`bg-white rounded-xl p-4 border-2 transition-all ${getCheapestProvider()?.key === 'proveedor1' && proveedor1.id
                          ? 'border-green-500 shadow-lg'
                          : 'border-red-500'
                          }`}>
                          <div className="mb-3 flex items-center justify-between">
                            <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                              PROVEEDOR 1
                            </span>
                            {getCheapestProvider()?.key === 'proveedor1' && proveedor1.id && (
                              <span className="text-xs font-bold text-green-600 bg-green-100 px-2 py-1 rounded-full">
                                ✓ MÁS BARATO
                              </span>
                            )}
                          </div>

                          <div className="space-y-2 mb-3">
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">
                                Nombre
                              </label>
                              <select
                                value={proveedor1.id || ''}
                                onChange={(e) => {
                                  const selectedId = e.target.value ? parseInt(e.target.value) : null;
                                  const selected = availableProveedores.find(p => p.id_proveedor === selectedId);
                                  setProveedor1({
                                    id: selectedId,
                                    nombre: selected?.nombre_proveedor || '',
                                    precio: proveedor1.precio,
                                  });
                                }}
                                className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none"
                              >
                                <option value="">Seleccionar proveedor</option>
                                {availableProveedores.map((prov) => (
                                  <option key={prov.id_proveedor} value={prov.id_proveedor}>
                                    {prov.nombre_proveedor}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">
                                Precio <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="number"
                                min="0.01"
                                step="0.01"
                                value={proveedor1.precio || ''}
                                onChange={(e) => setProveedor1({ ...proveedor1, precio: parseFloat(e.target.value) || 0 })}
                                placeholder="Ingrese precio mayor a 0"
                                className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none"
                                required
                              />
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleSelectProveedorWithPrice('proveedor1')}
                            disabled={!proveedor1.id}
                            className={`w-full py-2 px-4 rounded-full font-medium text-sm transition-all ${selectedProveedor === proveedor1.id
                              ? 'bg-green-500 text-white'
                              : proveedor1.id
                                ? 'bg-black text-white hover:bg-gray-800'
                                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                              }`}
                          >
                            {selectedProveedor === proveedor1.id ? '✓ Seleccionado' : 'Seleccionar'}
                          </button>
                        </div>

                        {/* Proveedor 2 */}
                        <div className={`bg-white rounded-xl p-4 border-2 transition-all ${getCheapestProvider()?.key === 'proveedor2' && proveedor2.id
                          ? 'border-green-500 shadow-lg'
                          : 'border-red-500'
                          }`}>
                          <div className="mb-3 flex items-center justify-between">
                            <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                              PROVEEDOR 2
                            </span>
                            {getCheapestProvider()?.key === 'proveedor2' && proveedor2.id && (
                              <span className="text-xs font-bold text-green-600 bg-green-100 px-2 py-1 rounded-full">
                                ✓ MÁS BARATO
                              </span>
                            )}
                          </div>

                          <div className="space-y-2 mb-3">
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">
                                Nombre
                              </label>
                              <select
                                value={proveedor2.id || ''}
                                onChange={(e) => {
                                  const selectedId = e.target.value ? parseInt(e.target.value) : null;
                                  const selected = availableProveedores.find(p => p.id_proveedor === selectedId);
                                  setProveedor2({
                                    id: selectedId,
                                    nombre: selected?.nombre_proveedor || '',
                                    precio: proveedor2.precio,
                                  });
                                }}
                                className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none"
                              >
                                <option value="">Seleccionar proveedor</option>
                                {availableProveedores.map((prov) => (
                                  <option key={prov.id_proveedor} value={prov.id_proveedor}>
                                    {prov.nombre_proveedor}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">
                                Precio <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="number"
                                min="0.01"
                                step="0.01"
                                value={proveedor2.precio || ''}
                                onChange={(e) => setProveedor2({ ...proveedor2, precio: parseFloat(e.target.value) || 0 })}
                                placeholder="Ingrese precio mayor a 0"
                                className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none"
                                required
                              />
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleSelectProveedorWithPrice('proveedor2')}
                            disabled={!proveedor2.id}
                            className={`w-full py-2 px-4 rounded-full font-medium text-sm transition-all ${selectedProveedor === proveedor2.id
                              ? 'bg-green-500 text-white'
                              : proveedor2.id
                                ? 'bg-black text-white hover:bg-gray-800'
                                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                              }`}
                          >
                            {selectedProveedor === proveedor2.id ? '✓ Seleccionado' : 'Seleccionar'}
                          </button>
                        </div>

                        {/* Proveedor 3 */}
                        <div className={`bg-white rounded-xl p-4 border-2 transition-all ${getCheapestProvider()?.key === 'proveedor3' && proveedor3.id
                          ? 'border-green-500 shadow-lg'
                          : 'border-red-500'
                          }`}>
                          <div className="mb-3 flex items-center justify-between">
                            <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                              PROVEEDOR 3
                            </span>
                            {getCheapestProvider()?.key === 'proveedor3' && proveedor3.id && (
                              <span className="text-xs font-bold text-green-600 bg-green-100 px-2 py-1 rounded-full">
                                ✓ MÁS BARATO
                              </span>
                            )}
                          </div>

                          <div className="space-y-2 mb-3">
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">
                                Nombre
                              </label>
                              <select
                                value={proveedor3.id || ''}
                                onChange={(e) => {
                                  const selectedId = e.target.value ? parseInt(e.target.value) : null;
                                  const selected = availableProveedores.find(p => p.id_proveedor === selectedId);
                                  setProveedor3({
                                    id: selectedId,
                                    nombre: selected?.nombre_proveedor || '',
                                    precio: proveedor3.precio,
                                  });
                                }}
                                className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none"
                              >
                                <option value="">Seleccionar proveedor</option>
                                {availableProveedores.map((prov) => (
                                  <option key={prov.id_proveedor} value={prov.id_proveedor}>
                                    {prov.nombre_proveedor}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">
                                Precio <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="number"
                                min="0.01"
                                step="0.01"
                                value={proveedor3.precio || ''}
                                onChange={(e) => setProveedor3({ ...proveedor3, precio: parseFloat(e.target.value) || 0 })}
                                placeholder="Ingrese precio mayor a 0"
                                className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none"
                                required
                              />
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleSelectProveedorWithPrice('proveedor3')}
                            disabled={!proveedor3.id}
                            className={`w-full py-2 px-4 rounded-full font-medium text-sm transition-all ${selectedProveedor === proveedor3.id
                              ? 'bg-green-500 text-white'
                              : proveedor3.id
                                ? 'bg-black text-white hover:bg-gray-800'
                                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                              }`}
                          >
                            {selectedProveedor === proveedor3.id ? '✓ Seleccionado' : 'Seleccionar'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer con botones */}
                <div className="border-t border-gray-200 px-6 py-4 bg-white flex items-center justify-between">
                  <button
                    type="button"
                    onClick={async () => {
                      // Verificar si hay al menos un proveedor configurado
                      const hayProveedores = proveedor1.id || proveedor2.id || proveedor3.id;

                      if (!hayProveedores) {
                        showAlertDialog(
                          'Proveedor requerido',
                          'Por favor configura al menos un proveedor antes de guardar.',
                          'warning'
                        );
                        return;
                      }

                      // Guardar en BD si el producto ya existe (modo edición o producto existente)
                      if (formData.CB && (modalMode === 'edit' || isExistingProduct)) {
                        try {
                          await guardarComparativaProveedores(String(formData.CB));
                          setToastMessage('Comparativas guardadas correctamente');
                          setShowToast(true);
                          setShowProveedorSelector(false);
                        } catch (error: any) {
                          console.error('Error al guardar comparativas:', error);
                          const errorMsg = error.message || 'Error desconocido';
                          if (errorMsg.includes('requeridos')) {
                            showAlertDialog(
                              'Error del Backend',
                              'El servidor no está procesando correctamente las peticiones POST.\n\nProblema técnico: El middleware express.json() no está configurado en el endpoint /api/producto-proveedor\n\nLos proveedores se han configurado localmente pero NO se guardaron en la base de datos.\n\nContacta al desarrollador del backend para resolver este problema.',
                              'error'
                            );
                          } else {
                            showAlertDialog(
                              'Error al guardar',
                              `No se pudieron guardar las comparativas:\n${errorMsg}`,
                              'error'
                            );
                          }
                        }
                      } else {
                        // Para productos nuevos, solo cerrar el modal
                        // Las comparativas se guardarán cuando se cree el producto
                        setShowProveedorSelector(false);
                      }
                    }}
                    className="px-8 py-2.5 bg-black text-white rounded-full hover:bg-gray-800 transition font-medium text-sm"
                  >
                    {(modalMode === 'edit' || isExistingProduct) ? 'Guardar y Cerrar' : 'Cerrar'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowProveedorSelector(false);
                    }}
                    className="px-8 py-2.5 bg-gray-200 text-gray-700 rounded-full hover:bg-gray-300 transition font-medium text-sm"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          )}


          {/* Diálogo de selección de tipo de producto */}
          {showProductTypeDialog && (
            <div
              className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-[110] animate-in fade-in duration-200"
              onClick={() => setShowProductTypeDialog(false)}
            >
              <div
                className="bg-white rounded-2xl shadow-2xl w-full max-w-lg transform transition-all animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header */}
                <div className="px-8 pt-8 pb-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h3 className="text-2xl font-bold text-gray-900">
                      Agregar Producto
                    </h3>
                    <button
                      onClick={() => setShowProductTypeDialog(false)}
                      className="text-gray-400 hover:text-gray-600 transition"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>
                  <p className="text-gray-600 text-sm mt-2">
                    Selecciona el tipo de producto que deseas agregar
                  </p>
                </div>

                {/* Opciones */}
                <div className="p-8 space-y-4">
                  {/* Producto Nuevo */}
                  <button
                    onClick={handleNewProduct}
                    className="w-full p-6 border-2 border-gray-200 rounded-xl hover:border-gray-900 hover:bg-gray-50 transition-all duration-200 text-left group"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center group-hover:bg-green-200 transition-colors">
                        <Plus className="w-6 h-6 text-green-700" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-lg font-semibold text-gray-900 mb-1">
                          Producto Nuevo
                        </h4>
                        <p className="text-sm text-gray-600">
                          Crear un producto completamente nuevo con códigos automáticos
                        </p>
                      </div>
                    </div>
                  </button>

                  {/* Producto Existente */}
                  <button
                    onClick={handleExistingProduct}
                    className="w-full p-6 border-2 border-gray-200 rounded-xl hover:border-gray-900 hover:bg-gray-50 transition-all duration-200 text-left group"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                        <Search className="w-6 h-6 text-blue-700" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-lg font-semibold text-gray-900 mb-1">
                          Producto Existente
                        </h4>
                        <p className="text-sm text-gray-600">
                          Agregar stock a un producto que ya existe en el inventario
                        </p>
                      </div>
                    </div>
                  </button>
                </div>

                {/* Footer */}
                <div className="px-8 pb-8">
                  <button
                    onClick={() => setShowProductTypeDialog(false)}
                    className="w-full px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors duration-200"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Diálogo de confirmación de eliminación */}
          {
            showDeleteDialog && (
              <div
                className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-[110] animate-in fade-in duration-200"
                onClick={cancelDelete}
              >
                <div
                  className="bg-white rounded-2xl shadow-2xl w-full max-w-md transform transition-all animate-in zoom-in-95 duration-200"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Icono de advertencia */}
                  <div className="flex justify-center pt-8 pb-4">
                    <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center">
                      <Trash2 className="w-8 h-8 text-red-600" />
                    </div>
                  </div>

                  {/* Contenido */}
                  <div className="px-8 pb-6 text-center">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      Eliminar producto
                    </h3>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      ¿Estás seguro de que deseas eliminar este producto? Esta acción no se puede deshacer.
                    </p>
                  </div>

                  {/* Botones */}
                  <div className="flex gap-3 px-6 pb-6">
                    <button
                      onClick={cancelDelete}
                      className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors duration-200"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={confirmDelete}
                      className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors duration-200"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              </div>
            )
          }
        </>
      )}

      {/* Toast de notificación */}
      {showToast && (
        <Toast
          message={toastMessage}
          onClose={() => setShowToast(false)}
        />
      )}

      {/* Alert Dialog */}
      <AlertDialog
        isOpen={showAlert}
        onClose={() => setShowAlert(false)}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
      />

      {/* Modal de Historial de Proveedores */}
      {showHistorialModal && selectedProduct && (
        <HistorialProveedores
          productoCB={String(selectedProduct.CB)}
          productoNombre={selectedProduct.PRODUCTO}
          onClose={() => setShowHistorialModal(false)}
        />
      )}
    </div>
  );
}
