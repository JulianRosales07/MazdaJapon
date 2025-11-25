import { useState, useEffect, useRef, useMemo } from 'react';
import { RotateCcw, Search, Plus, TrendingUp, TrendingDown, ChevronDown, Check, ArrowUpDown } from 'lucide-react';
import { repuestosAPI, Repuesto } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';

type TipoDevolucion = 'cliente' | 'proveedor';

// Componente selector de productos con búsqueda
function ProductSelector({ productos, value, onChange }: { productos: Repuesto[]; value: string; onChange: (value: string) => void }) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                setSearchTerm('');
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const filteredProductos = productos.filter(p =>
        String(p.CB).toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.PRODUCTO.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const selectedProduct = productos.find(p => String(p.CB) === value);
    const displayValue = selectedProduct
        ? `${selectedProduct.CB} - ${selectedProduct.PRODUCTO}`
        : 'Seleccionar producto';

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm text-left focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none bg-white hover:border-gray-400 flex items-center justify-between"
            >
                <span className={value ? 'text-gray-900' : 'text-gray-500'}>{displayValue}</span>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-64 overflow-hidden">
                    <div className="p-2 border-b border-gray-200 bg-gray-50">
                        <input
                            type="text"
                            placeholder="Buscar producto..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none"
                            onClick={(e) => e.stopPropagation()}
                        />
                    </div>

                    <div className="overflow-y-auto max-h-48">
                        {filteredProductos.length > 0 ? (
                            filteredProductos.map((producto) => (
                                <button
                                    key={producto.CB}
                                    type="button"
                                    onClick={() => {
                                        onChange(String(producto.CB));
                                        setIsOpen(false);
                                        setSearchTerm('');
                                    }}
                                    className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-100 transition-colors flex items-center justify-between ${String(producto.CB) === value ? 'bg-gray-50 font-medium' : ''
                                        }`}
                                >
                                    <span className="flex-1">
                                        <span className="font-medium">{producto.CB}</span> - {producto.PRODUCTO}
                                        <span className="text-xs text-gray-500 ml-2">(Stock: {producto.STOCK})</span>
                                    </span>
                                    {String(producto.CB) === value && <Check className="w-4 h-4 text-gray-900" />}
                                </button>
                            ))
                        ) : (
                            <div className="px-3 py-4 text-sm text-gray-500 text-center">
                                No se encontraron productos
                            </div>
                        )}
                    </div>

                    {filteredProductos.length > 0 && (
                        <div className="px-3 py-2 border-t border-gray-200 bg-gray-50 text-xs text-gray-600">
                            {filteredProductos.length} {filteredProductos.length === 1 ? 'producto' : 'productos'}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

type Devolucion = {
    id_devolucion?: number;
    tipo: TipoDevolucion;
    producto_cb: string | number;
    producto_nombre?: string;
    cantidad: number;
    motivo: string;
    fecha?: string;
    usuario_id?: number;
    usuario_nombre?: string;
    observaciones?: string;
};

export default function Devoluciones() {
    const { usuario } = useAuth();
    const [devoluciones, setDevoluciones] = useState<Devolucion[]>([]);
    const [productos, setProductos] = useState<Repuesto[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [tipoFilter, setTipoFilter] = useState<TipoDevolucion | ''>('');
    const [showModal, setShowModal] = useState(false);
    const [loading, setLoading] = useState(true);
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
    const [formData, setFormData] = useState<{
        tipo: TipoDevolucion;
        producto_cb: string;
        cantidad: number;
        motivo: string;
        observaciones: string;
    }>({
        tipo: 'cliente',
        producto_cb: '',
        cantidad: 0,
        motivo: '',
        observaciones: '',
    });

    useEffect(() => {
        fetchProductos();
        fetchDevoluciones();
    }, []);

    const fetchProductos = async () => {
        try {
            const data = await repuestosAPI.getAll();
            setProductos(data);
        } catch (error) {
            console.error('Error al cargar productos:', error);
        }
    };

    const fetchDevoluciones = async () => {
        try {
            setLoading(true);
            // Simulación - conectar con API cuando esté disponible
            const mockDevoluciones: Devolucion[] = [
                {
                    id_devolucion: 1,
                    tipo: 'cliente',
                    producto_cb: '1000001',
                    producto_nombre: 'ABRAZADERA',
                    cantidad: 5,
                    motivo: 'Producto defectuoso',
                    fecha: new Date().toISOString(),
                    usuario_nombre: usuario?.nombre,
                    observaciones: 'Cliente reportó defecto de fábrica',
                },
                {
                    id_devolucion: 2,
                    tipo: 'proveedor',
                    producto_cb: '1000002',
                    producto_nombre: 'FILTRO',
                    cantidad: 20,
                    motivo: 'Exceso de inventario',
                    fecha: new Date(Date.now() - 86400000).toISOString(),
                    usuario_nombre: usuario?.nombre,
                    observaciones: 'Devolución por sobrepedido',
                },
            ];
            setDevoluciones(mockDevoluciones);
        } catch (error) {
            console.error('Error al cargar devoluciones:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const producto = productos.find(p => String(p.CB) === formData.producto_cb);
        if (!producto) return;

        try {
            const nuevaDevolucion: Devolucion = {
                id_devolucion: Date.now(),
                tipo: formData.tipo,
                producto_cb: formData.producto_cb,
                producto_nombre: producto.PRODUCTO,
                cantidad: formData.cantidad,
                motivo: formData.motivo,
                fecha: new Date().toISOString(),
                usuario_nombre: usuario?.nombre,
                observaciones: formData.observaciones,
            };

            setDevoluciones([nuevaDevolucion, ...devoluciones]);
            setShowModal(false);
            setFormData({
                tipo: 'cliente',
                producto_cb: '',
                cantidad: 0,
                motivo: '',
                observaciones: '',
            });
        } catch (error) {
            console.error('Error al crear devolución:', error);
            alert('Error al registrar la devolución');
        }
    };

    const filteredDevoluciones = useMemo(() => {
        const filtered = devoluciones.filter(dev => {
            const matchesSearch =
                dev.producto_nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                String(dev.producto_cb).includes(searchTerm);
            const matchesTipo = tipoFilter === '' || dev.tipo === tipoFilter;
            return matchesSearch && matchesTipo;
        });

        return [...filtered].sort((a, b) => {
            const fechaA = a.fecha ? new Date(a.fecha).getTime() : 0;
            const fechaB = b.fecha ? new Date(b.fecha).getTime() : 0;
            // desc = más reciente primero
            return sortOrder === 'desc' ? fechaB - fechaA : fechaA - fechaB;
        });
    }, [devoluciones, searchTerm, tipoFilter, sortOrder]);

    const stats = {
        totalCliente: devoluciones.filter(d => d.tipo === 'cliente').length,
        totalProveedor: devoluciones.filter(d => d.tipo === 'proveedor').length,
        cantidadCliente: devoluciones
            .filter(d => d.tipo === 'cliente')
            .reduce((sum, d) => sum + d.cantidad, 0),
        cantidadProveedor: devoluciones
            .filter(d => d.tipo === 'proveedor')
            .reduce((sum, d) => sum + d.cantidad, 0),
    };

    return (
        <div className="p-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Devoluciones</h1>
                <p className="text-gray-600">Gestiona las devoluciones de clientes y a proveedores</p>
            </div>

            {/* Estadísticas */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-600">Devoluciones de Clientes</span>
                        <TrendingDown className="w-5 h-5 text-blue-500" />
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalCliente}</p>
                    <p className="text-xs text-gray-500 mt-1">{stats.cantidadCliente} unidades</p>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-600">Devoluciones a Proveedores</span>
                        <TrendingUp className="w-5 h-5 text-orange-500" />
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalProveedor}</p>
                    <p className="text-xs text-gray-500 mt-1">{stats.cantidadProveedor} unidades</p>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-600">Total Devoluciones</span>
                        <RotateCcw className="w-5 h-5 text-gray-500" />
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{devoluciones.length}</p>
                    <p className="text-xs text-gray-500 mt-1">
                        {stats.cantidadCliente + stats.cantidadProveedor} unidades
                    </p>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 flex items-center justify-center">
                    <button
                        onClick={() => setShowModal(true)}
                        className="w-full bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition flex items-center justify-center gap-2 font-medium"
                    >
                        <Plus className="w-5 h-5" />
                        Nueva Devolución
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                {/* Filtros */}
                <div className="flex flex-col md:flex-row gap-4 mb-6">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Buscar por producto o código..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none"
                        />
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setTipoFilter('')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${tipoFilter === ''
                                ? 'bg-gray-900 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            Todas
                        </button>
                        <button
                            onClick={() => setTipoFilter('cliente')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${tipoFilter === 'cliente'
                                ? 'bg-blue-500 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            De Clientes
                        </button>
                        <button
                            onClick={() => setTipoFilter('proveedor')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${tipoFilter === 'proveedor'
                                ? 'bg-orange-500 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            A Proveedores
                        </button>
                    </div>
                </div>

                {/* Tabla */}
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-gray-200">
                                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Tipo</th>
                                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                                    <button
                                        onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
                                        className="flex items-center gap-1 hover:text-gray-900 transition-colors"
                                    >
                                        Fecha
                                        <ArrowUpDown className="w-4 h-4" />
                                    </button>
                                </th>
                                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Código</th>
                                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Producto</th>
                                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Cantidad</th>
                                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Motivo</th>
                                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Usuario</th>
                                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Observaciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={8} className="py-8 text-center text-gray-500">
                                        Cargando devoluciones...
                                    </td>
                                </tr>
                            ) : filteredDevoluciones.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="py-8 text-center text-gray-500">
                                        No se encontraron devoluciones
                                    </td>
                                </tr>
                            ) : (
                                filteredDevoluciones.map((dev) => (
                                    <tr key={dev.id_devolucion} className="border-b border-gray-100 hover:bg-gray-50">
                                        <td className="py-3 px-4 text-sm">
                                            <span
                                                className={`px-2 py-1 rounded text-xs font-medium ${dev.tipo === 'cliente'
                                                    ? 'bg-blue-100 text-blue-700'
                                                    : 'bg-orange-100 text-orange-700'
                                                    }`}
                                            >
                                                {dev.tipo === 'cliente' ? (
                                                    <span className="flex items-center gap-1">
                                                        <TrendingDown className="w-3 h-3" />
                                                        Cliente
                                                    </span>
                                                ) : (
                                                    <span className="flex items-center gap-1">
                                                        <TrendingUp className="w-3 h-3" />
                                                        Proveedor
                                                    </span>
                                                )}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 text-sm text-gray-700">
                                            {dev.fecha ? new Date(dev.fecha).toLocaleDateString() : '-'}
                                        </td>
                                        <td className="py-3 px-4 text-sm text-gray-900 font-medium">
                                            {dev.producto_cb}
                                        </td>
                                        <td className="py-3 px-4 text-sm text-gray-700">{dev.producto_nombre}</td>
                                        <td className="py-3 px-4 text-sm">
                                            <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-medium">
                                                {dev.cantidad}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 text-sm text-gray-700">{dev.motivo}</td>
                                        <td className="py-3 px-4 text-sm text-gray-700">{dev.usuario_nombre || '-'}</td>
                                        <td className="py-3 px-4 text-sm text-gray-600">{dev.observaciones || '-'}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[100]"
                >
                    <div
                        className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto"
                    >
                        <div className="p-6 border-b border-gray-200">
                            <h2 className="text-xl font-bold text-gray-900">Nueva Devolución</h2>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Tipo de Devolución *
                                    </label>
                                    <select
                                        required
                                        value={formData.tipo}
                                        onChange={(e) =>
                                            setFormData({ ...formData, tipo: e.target.value as TipoDevolucion })
                                        }
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none"
                                    >
                                        <option value="cliente">Devolución de Cliente</option>
                                        <option value="proveedor">Devolución a Proveedor</option>
                                    </select>
                                    <p className="text-xs text-gray-500 mt-1">
                                        {formData.tipo === 'cliente'
                                            ? 'El cliente devuelve el producto (aumenta inventario)'
                                            : 'Devolvemos el producto al proveedor (disminuye inventario)'}
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Producto *
                                    </label>
                                    <ProductSelector
                                        productos={productos}
                                        value={formData.producto_cb}
                                        onChange={(value) => setFormData({ ...formData, producto_cb: value })}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Cantidad *
                                    </label>
                                    <input
                                        type="number"
                                        required
                                        min="1"
                                        value={formData.cantidad}
                                        onChange={(e) =>
                                            setFormData({ ...formData, cantidad: parseInt(e.target.value) || 0 })
                                        }
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Motivo *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.motivo}
                                        onChange={(e) => setFormData({ ...formData, motivo: e.target.value })}
                                        placeholder="Ej: Producto defectuoso, Exceso de inventario"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Observaciones
                                    </label>
                                    <textarea
                                        rows={3}
                                        value={formData.observaciones}
                                        onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                                        placeholder="Detalles adicionales..."
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none resize-none"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3 mt-6">
                                <button
                                    type="submit"
                                    className="flex-1 bg-gray-900 text-white py-2 px-4 rounded-lg hover:bg-gray-800 transition font-medium"
                                >
                                    Registrar Devolución
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
