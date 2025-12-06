import { useState } from 'react';
import { Download, FileSpreadsheet, Package, TrendingDown, TrendingUp } from 'lucide-react';
import * as XLSX from 'xlsx';
import { repuestosAPI, salidasAPI, entradasAPI } from '../lib/api';

export default function Exportar() {
  const [loading, setLoading] = useState(false);
  const [exportStatus, setExportStatus] = useState<string>('');

  const formatDate = (fecha: any) => {
    if (!fecha) return '';
    try {
      const date = new Date(fecha);
      return date.toLocaleDateString('es-ES');
    } catch {
      return String(fecha);
    }
  };

  const exportToExcel = async (type: 'inventario' | 'salidas' | 'entradas') => {
    setLoading(true);
    setExportStatus(`Exportando ${type}...`);

    try {
      let data: any[] = [];
      let filename = '';
      let sheetName = '';

      if (type === 'inventario') {
        const inventario = await repuestosAPI.getAll();
        data = inventario.map(item => ({
          'Código (CB)': item.CB,
          'Código Interno (CI)': item.CI || '',
          'Producto': item.PRODUCTO,
          'Tipo': item.TIPO || '',
          'Marca': item.MARCA || '',
          'Modelo/Especificación': item.MODELO_ESPECIFICACION || '',
          'Referencia': item.REFERENCIA || '',
          'Existencias Iniciales': item.EXISTENCIAS_INICIALES,
          'Stock Actual': item.STOCK,
          'Precio': item.PRECIO,
        }));
        filename = `Inventario_${new Date().toISOString().split('T')[0]}.xlsx`;
        sheetName = 'Inventario';
      } else if (type === 'salidas') {
        const salidas = await salidasAPI.getAll();
        data = salidas.map(item => ({
          'N° Factura': item.n_factura,
          'Fecha': formatDate(item.fecha),
          'CI': item.ci || '',
          'CB': item.cb,
          'Descripción': item.descripcion,
          'Cantidad': item.cantidad,
          'Valor Unitario': item.valor,
          'Valor Total': (item.cantidad * item.valor),
          'Observaciones': item.columna1 || '',
        }));
        filename = `Salidas_${new Date().toISOString().split('T')[0]}.xlsx`;
        sheetName = 'Salidas';
      } else if (type === 'entradas') {
        const entradas = await entradasAPI.getAll();
        data = entradas.map(item => ({
          'ID': item.ID || '',
          'N° Factura': item.N_FACTURA,
          'Proveedor': item.PROVEEDOR,
          'Fecha': formatDate(item.FECHA),
          'CB': item.CB,
          'CI': item.CI || '',
          'Descripción': item.DESCRIPCION,
          'Cantidad': item.CANTIDAD,
          'Costo': item.COSTO,
          'Valor Venta': item.VALOR_VENTA || '',
          'SIIGO': item.SIIGO || '',
          'Observaciones': item.Columna1 || '',
        }));
        filename = `Entradas_${new Date().toISOString().split('T')[0]}.xlsx`;
        sheetName = 'Entradas';
      }

      // Verificar que hay datos
      if (data.length === 0) {
        setExportStatus(`✗ No hay datos para exportar en ${type}`);
        setTimeout(() => setExportStatus(''), 3000);
        return;
      }

      // Crear el libro de Excel
      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

      // Ajustar ancho de columnas automáticamente
      const maxWidth = 30;
      const colWidths = Object.keys(data[0]).map(key => {
        const maxLength = Math.max(
          key.length,
          ...data.map(row => String(row[key] || '').length)
        );
        return { wch: Math.min(Math.max(maxLength + 2, 10), maxWidth) };
      });
      worksheet['!cols'] = colWidths;

      // Descargar el archivo Excel
      XLSX.writeFile(workbook, filename, { bookType: 'xlsx', type: 'binary' });

      setExportStatus(`✓ ${type} exportado exitosamente`);
      setTimeout(() => setExportStatus(''), 3000);
    } catch (error) {
      console.error(`Error exportando ${type}:`, error);
      setExportStatus(`✗ Error al exportar ${type}`);
      setTimeout(() => setExportStatus(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Exportar Datos</h1>
        <p className="text-gray-600">Descarga los datos del sistema en formato Excel</p>
      </div>

      {exportStatus && (
        <div className={`mb-6 p-4 rounded-lg ${
          exportStatus.includes('✓') 
            ? 'bg-gray-100 border border-gray-300 text-gray-900' 
            : exportStatus.includes('✗')
            ? 'bg-gray-200 border border-gray-400 text-gray-900'
            : 'bg-gray-100 border border-gray-300 text-gray-800'
        }`}>
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5" />
            <span className="font-medium">{exportStatus}</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Exportar Inventario */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-300 p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-center w-16 h-16 bg-gray-200 rounded-full mb-4 mx-auto">
            <Package className="w-8 h-8 text-gray-700" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 text-center mb-2">Inventario</h3>
          <p className="text-gray-600 text-sm text-center mb-6">
            Exporta todos los productos del inventario con sus detalles completos
          </p>
          <button
            onClick={() => exportToExcel('inventario')}
            disabled={loading}
            className="w-full bg-gray-900 text-white py-3 px-4 rounded-lg hover:bg-gray-800 transition flex items-center justify-center gap-2 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-5 h-5" />
            Exportar Inventario
          </button>
        </div>

        {/* Exportar Salidas */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-300 p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-center w-16 h-16 bg-gray-200 rounded-full mb-4 mx-auto">
            <TrendingDown className="w-8 h-8 text-gray-700" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 text-center mb-2">Salidas</h3>
          <p className="text-gray-600 text-sm text-center mb-6">
            Exporta el registro completo de todas las salidas de productos
          </p>
          <button
            onClick={() => exportToExcel('salidas')}
            disabled={loading}
            className="w-full bg-gray-900 text-white py-3 px-4 rounded-lg hover:bg-gray-800 transition flex items-center justify-center gap-2 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-5 h-5" />
            Exportar Salidas
          </button>
        </div>

        {/* Exportar Entradas */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-300 p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-center w-16 h-16 bg-gray-200 rounded-full mb-4 mx-auto">
            <TrendingUp className="w-8 h-8 text-gray-700" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 text-center mb-2">Entradas</h3>
          <p className="text-gray-600 text-sm text-center mb-6">
            Exporta el registro completo de todas las entradas de productos
          </p>
          <button
            onClick={() => exportToExcel('entradas')}
            disabled={loading}
            className="w-full bg-gray-900 text-white py-3 px-4 rounded-lg hover:bg-gray-800 transition flex items-center justify-center gap-2 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-5 h-5" />
            Exportar Entradas
          </button>
        </div>
      </div>

      {/* Información adicional */}
      <div className="mt-8 bg-white border border-gray-300 rounded-lg p-6 shadow-sm">
        <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <FileSpreadsheet className="w-5 h-5" />
          Información sobre las exportaciones
        </h4>
        <ul className="space-y-2 text-sm text-gray-700">
          <li className="flex items-start gap-2">
            <span className="text-gray-900 mt-0.5">•</span>
            <span>Los archivos se descargan en formato Excel (.xlsx) compatible con Microsoft Excel, Google Sheets y LibreOffice</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-gray-900 mt-0.5">•</span>
            <span>El nombre del archivo incluye la fecha de exportación para facilitar la organización</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-gray-900 mt-0.5">•</span>
            <span>Los datos exportados reflejan el estado actual del sistema al momento de la exportación</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-gray-900 mt-0.5">•</span>
            <span>Las columnas están optimizadas para facilitar el análisis y generación de reportes</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
