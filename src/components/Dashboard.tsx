import { useEffect, useState } from 'react';
import { Package, TrendingUp, AlertCircle, DollarSign, Zap, Activity, ArrowUpRight, ShoppingCart } from 'lucide-react';
import { repuestosAPI, Repuesto } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';

import { DotPattern } from './ui/dot-pattern';
import { cn } from '@/lib/utils';
import logo from '../assets/image.png';

interface DashboardProps {
  onNavigate?: (page: 'dashboard' | 'inventory' | 'entradas' | 'salidas' | 'devoluciones' | 'configuracion' | 'exportar') => void;
}

export default function Dashboard({ onNavigate }: DashboardProps) {
  const { usuario, isAdmin } = useAuth();
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalStock: 0,
    lowStock: 0,
    totalValue: 0,
  });
  const [recentProducts, setRecentProducts] = useState<Repuesto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const data = await repuestosAPI.getAll();

      const totalProducts = data.length;
      const totalStock = data.reduce((sum: number, item: Repuesto) => sum + Number(item.STOCK), 0);
      const lowStock = data.filter((item: Repuesto) => Number(item.STOCK) < 10).length;
      const totalValue = data.reduce((sum: number, item: Repuesto) => sum + (Number(item.STOCK) * Number(item.PRECIO)), 0);

      // Get 5 most recent products (simulated by taking last 5)
      const recent = data.slice(-5).reverse();

      setStats({
        totalProducts,
        totalStock,
        lowStock,
        totalValue,
      });
      setRecentProducts(recent);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Total Productos',
      value: stats.totalProducts,
      icon: Package,
      bgColor: 'bg-[#2a3042]',
      iconColor: 'text-white',
      change: '+12%',
      changePositive: true,
    },
    {
      title: 'Stock Total',
      value: stats.totalStock,
      icon: TrendingUp,
      bgColor: 'bg-gray-600',
      iconColor: 'text-white',
      change: '+8%',
      changePositive: true,
    },
    {
      title: 'Productos con Bajo Stock',
      value: stats.lowStock,
      icon: AlertCircle,
      bgColor: 'bg-gray-500',
      iconColor: 'text-white',
      change: '-3%',
      changePositive: true,
    },
    {
      title: 'Valor Total Inventario',
      value: `$${stats.totalValue.toFixed(2)}`,
      icon: DollarSign,
      bgColor: 'bg-[#2a3042]',
      iconColor: 'text-white',
      change: '+15%',
      changePositive: true,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section with Image */}
      <div className="relative overflow-hidden bg-[#2a3042] text-white">
        <DotPattern
          className={cn(
            "absolute inset-0 h-full w-full opacity-20",
            "[mask-image:radial-gradient(600px_circle_at_center,white,transparent)]"
          )}
        />
        <div className="relative z-10 px-8 py-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex-1">
              <h1 className="text-4xl md:text-5xl font-bold mb-3 text-white">
                Bienvenido, {usuario?.nombre}
              </h1>
              <p className="text-gray-300 text-lg mb-6">
                Gestiona tu inventario de repuestos automotrices de manera eficiente
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => onNavigate?.('inventory')}
                  className="px-6 py-3 bg-white text-gray-900 rounded-lg font-semibold hover:bg-gray-100 transition-all transform hover:scale-105 flex items-center gap-2"
                >
                  <ShoppingCart className="w-5 h-5" />
                  Ver Inventario
                </button>
                {isAdmin && (
                  <button
                    onClick={() => onNavigate?.('inventory')}
                    className="px-6 py-3 bg-gray-700 text-white rounded-lg font-semibold hover:bg-gray-600 transition-all transform hover:scale-105 flex items-center gap-2"
                  >
                    <Package className="w-5 h-5" />
                    Agregar Producto
                  </button>
                )}
              </div>
            </div>
            <div className="flex-1 max-w-md">
              <div className="relative">
                <div className="absolute inset-0 bg-gray-700 rounded-2xl blur-2xl opacity-20"></div>
                <div className="relative bg-transparent rounded-2xl shadow-2xl p-8 flex items-center justify-center">
                  <img
                    src={logo}
                    alt="Mazda Logo"
                    className="w-full h-40 object-contain"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-8">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="flex flex-col items-center gap-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
              <div className="text-gray-600 font-medium">Cargando estadísticas...</div>
            </div>
          </div>
        ) : (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 -mt-16 relative z-20">
              {statCards.map((card, index) => (
                <div
                  key={index}
                  className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all transform hover:-translate-y-1"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className={`${card.bgColor} p-3 rounded-xl shadow-lg`}>
                      <card.icon className={`w-6 h-6 ${card.iconColor}`} />
                    </div>
                    <div className={`flex items-center gap-1 text-sm font-semibold ${card.changePositive ? 'text-gray-700' : 'text-gray-600'
                      }`}>
                      <ArrowUpRight className="w-4 h-4" />
                      {card.change}
                    </div>
                  </div>
                  <h3 className="text-gray-600 text-sm font-medium mb-1">
                    {card.title}
                  </h3>
                  <p className="text-3xl font-bold text-gray-900">{card.value}</p>
                </div>
              ))}
            </div>

            {/* Mazda Gallery Section */}
            <div className="mb-8">
              <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
                  <div className="relative h-48 md:h-64 overflow-hidden group">
                    <img
                      src="https://www.mazda.com.co/globalassets/new-image-page/tecnologia-skyactiv.png"
                      alt="Mazda Detail"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      onError={(e) => {
                        e.currentTarget.src = 'https://via.placeholder.com/800x400/2a3042/ffffff?text=Mazda+Parts';
                      }}
                    />

                  </div>
                  <div className="relative h-48 md:h-64 overflow-hidden group">
                    <img
                      src="https://www.mazda.com.co/globalassets/homepage/promos/seguridad-camapana-takata-2024.jpg"
                      alt="Mazda Interior"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      onError={(e) => {
                        e.currentTarget.src = 'https://via.placeholder.com/800x400/2a3042/ffffff?text=Mazda+Interior';
                      }}
                    />

                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activity & User Info */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
              {/* Recent Products */}
              <div className="lg:col-span-2 bg-white rounded-xl shadow-lg border border-gray-100 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <Activity className="w-6 h-6 text-blue-600" />
                  Productos Recientes
                </h2>
                <div className="space-y-4">
                  {recentProducts.length > 0 ? (
                    recentProducts.map((product, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-all"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-[#2a3042] rounded-lg flex items-center justify-center text-white font-bold text-lg">
                            {product.PRODUCTO?.charAt(0) || 'P'}
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900">{product.PRODUCTO}</h4>
                            <p className="text-sm text-gray-500">Código: {product.CB}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-gray-900">${Number(product.PRECIO).toFixed(2)}</p>
                          <p className={`text-sm font-medium ${Number(product.STOCK) < 10 ? 'text-gray-600' : 'text-gray-700'
                            }`}>
                            Stock: {product.STOCK}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      No hay productos recientes
                    </div>
                  )}
                </div>
              </div>

              {/* User Info Card */}
              <div className="bg-[#2a3042] rounded-xl shadow-lg p-6 text-white">
                <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                  <Zap className="w-6 h-6 text-white" />
                  Tu Perfil
                </h2>
                <div className="space-y-4">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 bg-gray-600 rounded-full flex items-center justify-center text-2xl font-bold">
                      {usuario?.nombre?.charAt(0) || 'U'}
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">{usuario?.nombre}</h3>
                      <p className="text-gray-300 text-sm">{usuario?.email}</p>
                    </div>
                  </div>

                  <div className="space-y-3 pt-4 border-t border-gray-700">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Rol:</span>
                      <span className={`font-semibold px-3 py-1 rounded-lg ${isAdmin
                        ? 'bg-white text-[#2a3042]'
                        : 'bg-gray-700 text-gray-200'
                        }`}>
                        {isAdmin ? '👑 Administrador' : 'Usuario'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Productos:</span>
                      <span className="font-bold">{stats.totalProducts}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Valor Total:</span>
                      <span className="font-bold text-white">${stats.totalValue.toFixed(2)}</span>
                    </div>
                  </div>

                  {isAdmin && (
                    <div className="pt-4 border-t border-gray-700">
                      <h4 className="text-sm font-semibold text-gray-300 mb-3">Acciones Rápidas</h4>
                      <div className="space-y-2">
                        <button className="w-full text-left px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-all flex items-center gap-2 text-sm">
                          <Package className="w-4 h-4" />
                          Gestionar Inventario
                        </button>
                        <button className="w-full text-left px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-all flex items-center gap-2 text-sm">
                          <TrendingUp className="w-4 h-4" />
                          Ver Reportes
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>


          </>
        )
        }
      </div >
    </div >
  );
}
