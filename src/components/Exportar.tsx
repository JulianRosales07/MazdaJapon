import { useState } from 'react';
import { Download, FileSpreadsheet, Package, TrendingDown, TrendingUp, Calendar } from 'lucide-react';
import * as XLSX from 'xlsx';
import { repuestosAPI, salidasAPI, entradasAPI } from '../lib/api';

export default function Exportar() {
  const [loading, setLoading] = useState(false);
  const [exportStatus, setExportStatus] = useState<string>('');
  const [fechaInicio, setFechaInicio] = useState<string>('');
  const [fechaFin, setFechaFin] = useState<string>('');

  const formatDate = (fecha: any) => {
    if (!fecha) return '';
    try {
      const date = new Date(fecha);
      return date.toLocaleDateString('es-ES');
    } catch {
      return String(fecha);
    }
  };

  const exportProductosNuevos = async () => {
    if (!fechaInicio || !fechaFin) {
      setExportStatus('✗ Por favor selecciona ambas fechas');
      setTimeout(() => setExportStatus(''), 3000);
      return;
    }

    setLoading(true);
    setExportStatus('Exportando productos nuevos...');

    try {
      // Obtener todas las entradas
      const entradas = await entradasAPI.getAll();
      
      // Filtrar por rango de fechas
      const entradasFiltradas = entradas.filter(item => {
        const fechaEntrada = new Date(item.FECHA);
        const inicio = new Date(fechaInicio);
        const fin = new Date(fechaFin);
        return fechaEntrada >= inicio && fechaEntrada <= fin;
      });

      if (entradasFiltradas.length === 0) {
        setExportStatus('✗ No hay productos nuevos en el rango de fechas seleccionado');
        setTimeout(() => setExportStatus(''), 3000);
        return;
      }

      // Obtener códigos únicos de productos
      const codigosUnicos = [...new Set(entradasFiltradas.map(e => e.CB))];
      
      // Obtener información completa de los productos
      const inventario = await repuestosAPI.getAll();
      const productosMap = new Map(inventario.map(p => [String(p.CB), p]));

      // Crear datos para el Excel siguiendo el formato SIIGO
      const data = codigosUnicos.map(cb => {
        const producto = productosMap.get(String(cb));
        const entradasProducto = entradasFiltradas.filter(e => String(e.CB) === String(cb));
        const precioVenta = Number(producto?.PRECIO || 0);
        
        // Combinar Producto, Tipo y Modelo/Especificación
        const nombreProducto = producto?.PRODUCTO || entradasProducto[0]?.DESCRIPCION || '';
        const tipo = producto?.TIPO || '';
        const modelo = producto?.MODELO_ESPECIFICACION || '';
        
        const nombreCompleto = [nombreProducto, tipo, modelo]
          .filter(campo => campo && campo.trim() !== '')
          .join(' - ');
        
        return {
          'Tipo de Producto': 'P-Producto',
          'Categoría de Inventarios / Servicios': '1-Productos',
          'Código del Producto': producto?.CI || cb,
          'Nombre del Producto / Servicio': nombreCompleto,
          '¿Inventariable?': 'Si',
          'Visible en facturas de venta': 'Si',
          'Stock mínimo': 1,
          'Unidad de medida DIAN': '94',
          'Unidad de Medida Impresión Factura': '',
          'Referencia de Fábrica': producto?.REFERENCIA || '',
          'Código de Barras': cb,
          'Descripción Larga': producto?.DESCRIPCION_LARGA || producto?.PRODUCTO || '',
          'Código Impuesto Retención': '',
          'Código Impuesto Cargo': '1-IVA 19%',
          'Valor Impuesto Cargo Dos': '',
          '¿Incluye IVA en Precio de Venta?': 'Si',
          'Precio de venta 1': precioVenta,
          'Precio de venta 2': '',
          'Precio de venta 3': '',
          'Precio de venta 4': '',
          'Precio de venta 5': '',
          'Precio de venta 6': '',
          'Precio de venta 7': '',
          'Precio de venta 8': '',
          'Precio de venta 9': '',
          'Precio de venta 10': '',
          'Precio de venta 11': '',
          'Precio de venta 12': '',
          'Código Arancelario': '',
          'Marca': producto?.MARCA || '',
          'Modelo': producto?.MODELO_ESPECIFICACION || '',
        };
      });

      // Crear el libro de Excel
      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Productos Nuevos');

      // Ajustar ancho de columnas
      const maxWidth = 30;
      const colWidths = Object.keys(data[0]).map(key => {
        const maxLength = Math.max(
          key.length,
          ...data.map(row => String((row as any)[key] || '').length)
        );
        return { wch: Math.min(Math.max(maxLength + 2, 10), maxWidth) };
      });
      worksheet['!cols'] = colWidths;

      // Descargar el archivo con formato SIIGO
      const filename = `SIIGO_ProductosNuevos_${fechaInicio}_${fechaFin}.xlsx`;
      XLSX.writeFile(workbook, filename, { bookType: 'xlsx', type: 'binary' });

      setExportStatus(`✓ ${codigosUnicos.length} productos exportados en formato SIIGO`);
      setTimeout(() => setExportStatus(''), 3000);
    } catch (error) {
      console.error('Error exportando productos nuevos:', error);
      setExportStatus('✗ Error al exportar productos nuevos');
      setTimeout(() => setExportStatus(''), 3000);
    } finally {
      setLoading(false);
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
          'CODIGO DE BARRAS': item.CB,
          'CODIGO INTERNO': item.CI || '',
          'PRODUCTO': item.PRODUCTO,
          'TIPO': item.TIPO || '',
          'MARCA': item.MARCA || '',
          'MODELO/ESPECIFICACION': item.MODELO_ESPECIFICACION || '',
          'REFERENCIA': item.REFERENCIA || '',
          'EXISTENCIAS INICIALES': item.EXISTENCIAS_INICIALES,
          'STOCK': item.STOCK,
          'PRECIO': item.PRECIO,
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

      {/* Sección de Productos Nuevos con Filtros de Fecha */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-300 p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full">
            <Calendar className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">Productos Nuevos para SIIGO</h3>
            <p className="text-gray-600 text-sm">Exporta productos ingresados en formato compatible con SIIGO</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fecha Inicio
            </label>
            <input
              type="date"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fecha Fin
            </label>
            <input
              type="date"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
            />
          </div>
        </div>

        <button
          onClick={exportProductosNuevos}
          disabled={loading || !fechaInicio || !fechaFin}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Download className="w-5 h-5" />
          Exportar Productos Nuevos
        </button>
      </div>

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
          <li className="flex items-start gap-2">
            <span className="text-gray-900 mt-0.5">•</span>
            <span>La exportación de productos nuevos genera un archivo compatible con SIIGO con todos los campos requeridos</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-gray-900 mt-0.5">•</span>
            <span>Los productos se filtran por fecha de entrada al sistema y se incluyen campos como Tipo, Categoría, Código de Barras, Marca y Modelo</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
