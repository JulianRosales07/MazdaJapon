import { useEffect, useState } from 'react';
import { Package, TrendingUp, AlertCircle, Zap, Activity, ArrowUpRight, ShoppingCart } from 'lucide-react';
import { repuestosAPI, Repuesto } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';

import { DotPattern } from './ui/dot-pattern';
import { cn } from '@/lib/utils';
import logo from '../assets/image.png';

interface DashboardProps {
  onNavigate?: (page: 'dashboard' | 'inventory' | 'entradas' | 'salidas' | 'configuracion' | 'exportar') => void;
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

  ];

  return (
    <div className="h-full bg-gray-50 overflow-auto">
      {/* Hero Section with Image */}
      <div className="relative overflow-hidden bg-[#3a4556] text-white min-h-[400px]">
        {/* Background Image */}
        <div className="absolute inset-0">
          <img
            src="https://www.mazdausa.com/siteassets/vehicles/2026/mazda3-sedan/01_vlp/001_hero/desktop/2026-m3-sedan-hero-desktop.jpg?w=1800"
            alt="Mazda Showroom"
            className="w-full h-full object-cover opacity-40"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#2a3042]/95 via-[#2a3042]/80 to-[#2a3042]/60"></div>
        </div>
        <div className="relative z-10 px-8 py-12 max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="space-y-6">
              <div className="inline-block px-5 py-2 bg-white/10 backdrop-blur-sm rounded-full text-sm font-medium border border-white/30">
                Sistema de Gestión de Inventario
              </div>
              
              <h1 className="text-5xl md:text-6xl font-bold leading-tight">
                Bienvenido,
                <span className="block border-b-4 border-white/50 pb-2 inline-block mt-2">
                  {usuario?.nombre}
                </span>
              </h1>
              
              <p className="text-gray-300 text-lg leading-relaxed max-w-lg">
                Gestiona tu inventario de repuestos automotrices de manera eficiente y profesional
              </p>
              
              <div className="flex flex-wrap gap-4 pt-4">
                <button
                  onClick={() => onNavigate?.('inventory')}
                  className="group px-8 py-3.5 bg-transparent text-white rounded-xl font-semibold hover:bg-white/10 transition-all duration-300 flex items-center gap-3 border-2 border-white/50 hover:border-white"
                >
                  <ShoppingCart className="w-5 h-5" />
                  Ver Inventario
                </button>
              </div>
            </div>
            
            {/* Right Content - Logo */}
            <div className="flex justify-center md:justify-end">
              <div className="relative group">
                {/* Logo container with golden border */}
                <div className="relative bg-white/5 backdrop-blur-md rounded-3xl p-16 border-2 border-amber-200/40 shadow-2xl hover:border-amber-200/60 transition-all duration-300">
                  <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent rounded-3xl"></div>
                  <img
                    src={logo}
                    alt="Mazda Logo"
                    className="relative w-48 h-24 object-contain filter brightness-110 drop-shadow-2xl group-hover:scale-105 transition-transform duration-300"
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

      <div className="px-8 pb-8">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="flex flex-col items-center gap-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
              <div className="text-gray-600 font-medium">Cargando estadísticas...</div>
            </div>
          </div>
        ) : (
          <>
            {/* Mazda Gallery Section */}
            <div className="mb-6 mt-6">
              <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
                  <div className="relative h-40 md:h-52 overflow-hidden group">
                    <img
                      src="https://www.mazda.com.co/globalassets/new-image-page/tecnologia-skyactiv.png"
                      alt="Mazda Detail"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      onError={(e) => {
                        e.currentTarget.src = 'https://via.placeholder.com/800x400/2a3042/ffffff?text=Mazda+Parts';
                      }}
                    />

                  </div>
                  <div className="relative h-40 md:h-52 overflow-hidden group">
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

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
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

            {/* Recent Activity & User Info */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
              <div className="bg-[#2a3042] rounded-xl shadow-lg p-6 text-white flex flex-col justify-center h-full">
                <h2 className="text-xl font-bold mb-8 flex items-center gap-2">
                  <Zap className="w-6 h-6 text-white" />
                  Tu Perfil
                </h2>
                <div className="flex flex-col items-center text-center space-y-6">
                  <div className="w-20 h-20 bg-gray-600 rounded-full flex items-center justify-center text-3xl font-bold">
                    {usuario?.nombre?.charAt(0) || 'U'}
                  </div>
                  <div>
                    <h3 className="font-bold text-xl mb-1">{usuario?.nombre}</h3>
                    <p className="text-gray-300 text-sm">{usuario?.email}</p>
                  </div>

                  <div className="w-full pt-6 border-t border-gray-700">
                    <div className="flex justify-center items-center gap-3">
                      <span className="text-gray-300">Rol:</span>
                      <span className={`font-semibold px-4 py-2 rounded-lg ${isAdmin
                        ? 'bg-white text-[#2a3042]'
                        : 'bg-gray-700 text-gray-200'
                        }`}>
                        {isAdmin ? '👑 Administrador' : 'Usuario'}
                      </span>
                    </div>
                  </div>
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
