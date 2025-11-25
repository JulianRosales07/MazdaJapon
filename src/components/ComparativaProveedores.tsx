import { useEffect, useState } from 'react';
import { Search, TrendingDown, TrendingUp, DollarSign, Package, Building2 } from 'lucide-react';
import { repuestosAPI, Repuesto, productoProveedorAPI } from '../lib/api';

type ProductoConProveedores = {
  producto: Repuesto;
  proveedores: Array<{
    id: number;
    nombre: string;
    precio: number;
    esPrincipal: boolean;
  }>;
  precioMasBajo: number;
  precioMasAlto: number;
  diferencia: number;
};

export default function ComparativaProveedores() {
  const [productos, setProductos] = useState<ProductoConProveedores[]>([]);
  const [filteredProductos, setFilteredProductos] = useState<ProductoConProveedores[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  useEffect(() => {
    cargarComparativas();
  }, []);

  useEffect(() => {
    const filtered = productos.filter((item) => {
      const searchLower = searchTerm.toLowerCase();
      return (
        item.producto.PRODUCTO.toLowerCase().includes(searchLower) ||
        String(item.producto.CB).toLowerCase().includes(searchLower) ||
        String(item.producto.CI || '').toLowerCase().includes(searchLower)
      );
    });
    setFilteredProductos(filtered);
    setCurrentPage(1);
  }, [searchTerm, productos]);

  const cargarComparativas = async () => {
    try {
      const todosProductos = await repuestosAPI.getAll();
      const productosConProveedores: ProductoConProveedores[] = [];

      for (const producto of todosProductos) {
        try {
          const comparativas = await productoProveedorAPI.getByProducto(String(producto.CB));
          
          if (comparativas.length > 0) {
            const proveedoresData = comparativas.map(comp => ({
              id: comp.proveedor_id,
              // @ts-ignore - proveedores viene del join
              nombre: comp.proveedores?.nombre_proveedor || 'Desconocido',
              precio: Number(comp.precio_proveedor),
              esPrincipal: comp.es_proveedor_principal || false,
            }));

            const precios = proveedoresData.map(p => p.precio).filter(p => p > 0);
            
            if (precios.length > 0) {
              const precioMasBajo = Math.min(...precios);
              const precioMasAlto = Math.max(...precios);
              const diferencia = precioMasAlto - precioMasBajo;

              productosConProveedores.push({
                producto,
                proveedores: proveedoresData,
                precioMasBajo,
                precioMasAlto,
                diferencia,
              });
            }
          }
        } catch (error) {
          console.error(`Error cargando proveedores para ${producto.CB}:`, error);
        }
      }

      setProductos(productosConProveedores);
      setFilteredProductos(productosConProveedores);
    } catch (error) {
      console.error('Error al cargar comparativas:', error);
    } finally {
      setLoading(false);
    }
  };

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentProductos = filteredProductos.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredProductos.length / itemsPerPage);

  const getPorcentajeDiferencia = (item: ProductoConProveedores) => {
    if (item.precioMasBajo === 0) return 0;
    return ((item.diferencia / item.precioMasBajo) * 100).toFixed(1);
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Comparativa de Proveedores</h1>
        <p className="text-gray-600">Compara precios de productos entre diferentes proveedores</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        {/* Búsqueda */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar por producto, CB o CI..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none"
            />
          </div>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                <Package className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-blue-600 font-medium">Productos con Proveedores</p>
                <p className="text-2xl font-bold text-blue-900">{productos.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-green-50 rounded-lg p-4 border border-green-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                <TrendingDown className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-green-600 font-medium">Ahorro Promedio</p>
                <p className="text-2xl font-bold text-green-900">
                  {productos.length > 0
                    ? ((productos.reduce((sum, p) => sum + Number(getPorcentajeDiferencia(p)), 0) / productos.length).toFixed(1))
                    : '0'}%
                </p>
              </div>
            </div>
          </div>

          <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-purple-600 font-medium">Total Proveedores</p>
                <p className="text-2xl font-bold text-purple-900">
                  {productos.reduce((sum, p) => sum + p.proveedores.length, 0)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-600">Cargando comparativas...</div>
        ) : filteredProductos.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600">No se encontraron productos con proveedores configurados</p>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {currentProductos.map((item) => (
                <div
                  key={item.producto.CB}
                  className="border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow"
                >
                  {/* Header del Producto */}
                  <div className="flex items-start justify-between mb-4 pb-4 border-b border-gray-200">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {item.producto.PRODUCTO}
                      </h3>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span>CB: {item.producto.CB}</span>
                        {item.producto.CI && <span>CI: {item.producto.CI}</span>}
                        {item.producto.MARCA && <span>Marca: {item.producto.MARCA}</span>}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500 mb-1">Diferencia de precio</p>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold text-red-600">
                          ${item.diferencia.toFixed(2)}
                        </span>
                        <span className="text-sm text-red-600 bg-red-50 px-2 py-1 rounded-full font-medium">
                          {getPorcentajeDiferencia(item)}%
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Lista de Proveedores */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {item.proveedores.map((proveedor, idx) => {
                      const esMasBarato = proveedor.precio === item.precioMasBajo;
                      const esMasCaro = proveedor.precio === item.precioMasAlto;

                      return (
                        <div
                          key={idx}
                          className={`relative p-4 rounded-lg border-2 transition-all ${
                            esMasBarato
                              ? 'border-green-500 bg-green-50'
                              : esMasCaro
                              ? 'border-red-500 bg-red-50'
                              : 'border-gray-200 bg-gray-50'
                          }`}
                        >
                          {esMasBarato && (
                            <div className="absolute -top-2 -right-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg">
                              ✓ MÁS BARATO
                            </div>
                          )}
                          {proveedor.esPrincipal && (
                            <div className="absolute -top-2 -left-2 bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg">
                              ★ PRINCIPAL
                            </div>
                          )}
                          
                          <div className="flex items-start gap-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                              esMasBarato ? 'bg-green-500' : esMasCaro ? 'bg-red-500' : 'bg-gray-400'
                            }`}>
                              <Building2 className="w-5 h-5 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-gray-900 text-sm truncate mb-1">
                                {proveedor.nombre}
                              </p>
                              <div className="flex items-center gap-2">
                                <DollarSign className="w-4 h-4 text-gray-500" />
                                <span className="text-xl font-bold text-gray-900">
                                  ${proveedor.precio.toFixed(2)}
                                </span>
                              </div>
                              {item.proveedores.length > 1 && (
                                <div className="mt-2 text-xs">
                                  {esMasBarato ? (
                                    <span className="text-green-700 font-medium">
                                      Ahorro: ${item.diferencia.toFixed(2)}
                                    </span>
                                  ) : (
                                    <span className="text-red-700 font-medium">
                                      +${(proveedor.precio - item.precioMasBajo).toFixed(2)} más caro
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Resumen */}
                  <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-between text-sm">
                    <div className="flex items-center gap-4">
                      <span className="text-gray-600">
                        <TrendingDown className="w-4 h-4 inline mr-1" />
                        Precio más bajo: <span className="font-bold text-green-600">${item.precioMasBajo.toFixed(2)}</span>
                      </span>
                      <span className="text-gray-600">
                        <TrendingUp className="w-4 h-4 inline mr-1" />
                        Precio más alto: <span className="font-bold text-red-600">${item.precioMasAlto.toFixed(2)}</span>
                      </span>
                    </div>
                    <span className="text-gray-500">
                      {item.proveedores.length} proveedor{item.proveedores.length > 1 ? 'es' : ''}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Paginación */}
            {totalPages > 1 && (
              <div className="mt-6 flex items-center justify-between text-sm text-gray-600">
                <span>
                  Mostrando {indexOfFirstItem + 1} a {Math.min(indexOfLastItem, filteredProductos.length)} de {filteredProductos.length} productos
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
    </div>
  );
}
