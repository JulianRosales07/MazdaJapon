import { useEffect, useState } from 'react';
import { Search, TrendingDown, Package, Building2 } from 'lucide-react';
import { repuestosAPI, Repuesto } from '../lib/api';
import { supabase } from '../lib/supabase';

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
  const [itemsPerPage, setItemsPerPage] = useState(25);

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
      console.log('Iniciando carga de comparativas...');

      const { data: todasComparativas, error } = await supabase
        .from('producto_proveedor')
        .select(`
          *,
          proveedores (
            id_proveedor,
            nombre_proveedor
          )
        `)
        .eq('activo', true);

      if (error) {
        console.error('Error cargando comparativas:', error);
        throw error;
      }

      const productosPorCB = new Map<string, any[]>();
      todasComparativas?.forEach(comp => {
        if (!productosPorCB.has(comp.producto_cb)) {
          productosPorCB.set(comp.producto_cb, []);
        }
        productosPorCB.get(comp.producto_cb)!.push(comp);
      });

      const todosProductos = await repuestosAPI.getAll();
      const productosMap = new Map(todosProductos.map(p => [String(p.CB), p]));

      const productosConProveedores: ProductoConProveedores[] = [];

      productosPorCB.forEach((comparativas, productoCB) => {
        const producto = productosMap.get(productoCB);

        if (producto) {
          const proveedoresData = comparativas.map(comp => ({
            id: comp.proveedor_id,
            // @ts-ignore
            nombre: comp.proveedores?.nombre_proveedor || 'Desconocido',
            precio: Number(comp.precio_proveedor) || 0,
            esPrincipal: comp.es_proveedor_principal || false,
          }));

          const precios = proveedoresData.map(p => p.precio);
          const preciosValidos = precios.filter(p => p > 0);

          const precioMasBajo = preciosValidos.length > 0 ? Math.min(...preciosValidos) : 0;
          const precioMasAlto = preciosValidos.length > 0 ? Math.max(...preciosValidos) : 0;
          const diferencia = precioMasAlto - precioMasBajo;

          productosConProveedores.push({
            producto,
            proveedores: proveedoresData,
            precioMasBajo,
            precioMasAlto,
            diferencia,
          });
        }
      });

      setProductos(productosConProveedores);
      setFilteredProductos(productosConProveedores);
    } catch (error) {
      console.error('Error al cargar comparativas:', error);
      alert('Error al cargar las comparativas. Por favor revisa la consola.');
    } finally {
      setLoading(false);
    }
  };

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentProductos = filteredProductos.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredProductos.length / itemsPerPage);

  const maxProveedores = Math.max(...currentProductos.map(p => p.proveedores.length), 0);

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
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar por producto, CB o CI..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none bg-gray-50"
            />
          </div>
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-gray-600">Mostrar:</label>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="px-4 py-3 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none bg-gray-50"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
            <p className="text-gray-500">Cargando comparativas...</p>
          </div>
        ) : filteredProductos.length === 0 ? (
          <div className="text-center py-20">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-900 font-semibold mb-2">No se encontraron productos</p>
            <button
              onClick={cargarComparativas}
              className="mt-4 px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition"
            >
              Recargar
            </button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr>
                    <th className="py-4 px-6 text-sm font-semibold text-gray-900 border-b border-gray-200 min-w-[100px]">CI</th>
                    <th className="py-4 px-6 text-sm font-semibold text-gray-900 border-b border-gray-200 min-w-[250px]">Producto</th>
                    {Array.from({ length: maxProveedores }).map((_, i) => (
                      <th key={i} className="py-4 px-6 text-sm font-semibold text-gray-900 border-b border-gray-200 min-w-[200px]">
                        Proveedor {i + 1}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {currentProductos.map((item) => {
                    const proveedoresOrdenados = [...item.proveedores].sort((a, b) => {
                      if (a.precio > 0 && b.precio > 0) return a.precio - b.precio;
                      if (a.precio > 0) return -1;
                      if (b.precio > 0) return 1;
                      return 0;
                    });

                    return (
                      <tr key={item.producto.CB} className="hover:bg-gray-50 transition-colors">
                        <td className="py-6 px-6 border-b border-gray-100 text-sm text-gray-600">
                          {item.producto.CI || '-'}
                        </td>
                        <td className="py-6 px-6 border-b border-gray-100">
                          <div className="font-medium text-gray-900 text-base">{item.producto.PRODUCTO}</div>
                          {item.producto.MARCA && (
                            <div className="text-xs text-gray-500 mt-1">{item.producto.MARCA}</div>
                          )}
                        </td>
                        {Array.from({ length: maxProveedores }).map((_, i) => {
                          const proveedor = proveedoresOrdenados[i];
                          const esMasBarato = proveedor && proveedor.precio > 0 && proveedor.precio === item.precioMasBajo;

                          return (
                            <td key={i} className="py-6 px-6 border-b border-gray-100 align-top">
                              {proveedor ? (
                                <div className="flex flex-col gap-1">
                                  <div className="flex items-center justify-between">
                                    <span className="font-medium text-gray-900">{proveedor.nombre}</span>
                                    {proveedor.esPrincipal && (
                                      <span className="text-[10px] font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                                        Principal
                                      </span>
                                    )}
                                  </div>

                                  <div className="flex items-center gap-2 mt-1">
                                    {proveedor.precio > 0 ? (
                                      <span className={`text-lg ${esMasBarato ? 'font-bold text-green-600' : 'text-gray-600'}`}>
                                        ${proveedor.precio.toFixed(2)}
                                      </span>
                                    ) : (
                                      <span className="text-sm text-gray-400 italic">Sin precio</span>
                                    )}
                                  </div>

                                  {esMasBarato && item.proveedores.length > 1 && (
                                    <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-md w-fit mt-1">
                                      Mejor precio
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <span className="text-gray-300">-</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Paginación */}
            {totalPages > 1 && (
              <div className="mt-8 flex items-center justify-between border-t border-gray-100 pt-6">
                <span className="text-sm text-gray-500">
                  Mostrando {indexOfFirstItem + 1} - {Math.min(indexOfLastItem, filteredProductos.length)} de {filteredProductos.length}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    Anterior
                  </button>
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
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
