import { useState } from 'react';
import { RefreshCw, Users, Package } from 'lucide-react';
import { usuariosAPI, repuestosAPI } from '../lib/api';

export default function DataSync() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const syncData = async (type: 'usuarios' | 'repuestos') => {
    setLoading(true);
    setResult(null);

    try {
      let data;
      if (type === 'usuarios') {
        data = await usuariosAPI.getAll();
      } else {
        data = await repuestosAPI.getAll();
      }

      setResult({
        type,
        success: true,
        count: data.length,
        message: `Se encontraron ${data.length} ${type}`,
      });
    } catch (error) {
      setResult({
        type,
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
        <RefreshCw className="w-5 h-5" />
        Verificar Conexión API
      </h2>

      <p className="text-sm text-gray-600 mb-6">
        Verifica la conexión con la API y consulta los datos disponibles
      </p>

      <div className="space-y-3">
        <button
          onClick={() => syncData('usuarios')}
          disabled={loading}
          className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div className="flex items-center gap-3">
            <Users className="w-5 h-5 text-gray-700" />
            <span className="font-medium text-gray-900">Verificar Usuarios</span>
          </div>
          {loading && <RefreshCw className="w-5 h-5 text-gray-500 animate-spin" />}
        </button>

        <button
          onClick={() => syncData('repuestos')}
          disabled={loading}
          className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div className="flex items-center gap-3">
            <Package className="w-5 h-5 text-gray-700" />
            <span className="font-medium text-gray-900">Verificar Repuestos</span>
          </div>
          {loading && <RefreshCw className="w-5 h-5 text-gray-500 animate-spin" />}
        </button>
      </div>

      {result && (
        <div
          className={`mt-4 p-4 rounded-lg ${result.success
            ? 'bg-green-50 border border-green-200'
            : 'bg-red-50 border border-red-200'
            }`}
        >
          <p
            className={`font-medium mb-2 ${result.success ? 'text-green-900' : 'text-red-900'
              }`}
          >
            {result.success ? '✓ Conexión exitosa' : '✗ Error de conexión'}
          </p>
          {result.success && (
            <p className="text-sm text-green-700">{result.message}</p>
          )}
          {!result.success && (
            <p className="text-sm text-red-700">{result.error}</p>
          )}
        </div>
      )}
    </div>
  );
}
