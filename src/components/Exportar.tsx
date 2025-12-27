import { useState } from 'react';
import { Download, FileSpreadsheet, Package, TrendingDown, TrendingUp, Calendar, Tag, Upload, ExternalLink } from 'lucide-react';
import * as XLSX from 'xlsx';
import { repuestosAPI, salidasAPI, entradasAPI } from '../lib/api';
import { apiClient } from '../lib/apiClient';

export default function Exportar() {
  const [loading, setLoading] = useState(false);
  const [exportStatus, setExportStatus] = useState<string>('');
  const [fechaInicio, setFechaInicio] = useState<string>('');
  const [fechaFin, setFechaFin] = useState<string>('');
  const [codigosCIImpresion, setCodigosCIImpresion] = useState<string>('');

  const formatDate = (fecha: any) => {
    if (!fecha) return '';
    try {
      const date = new Date(fecha);
      return date.toLocaleDateString('es-ES');
    } catch {
      return String(fecha);
    }
  };

  // Función para formatear fecha sin problemas de zona horaria
  const formatDateLocal = (fecha: any) => {
    if (!fecha) return '';
    try {
      // Crear fecha en zona horaria local para evitar el problema de UTC
      const date = new Date(fecha);
      const year = date.getUTCFullYear();
      const month = String(date.getUTCMonth() + 1).padStart(2, '0');
      const day = String(date.getUTCDate()).padStart(2, '0');
      return `${day}/${month}/${year}`;
    } catch {
      return String(fecha);
    }
  };

  const exportProductosNuevosToSheets = async () => {
    if (!fechaInicio || !fechaFin) {
      setExportStatus('✗ Por favor selecciona ambas fechas');
      setTimeout(() => setExportStatus(''), 3000);
      return;
    }

    const googleSheetsUrl = import.meta.env.VITE_GOOGLE_SHEETS_URL;
    if (!googleSheetsUrl || googleSheetsUrl === 'TU_URL_DEL_DEPLOYMENT_AQUI') {
      setExportStatus('✗ URL de Google Sheets no configurada. Revisa tu archivo .env');
      setTimeout(() => setExportStatus(''), 5000);
      return;
    }

    setLoading(true);
    setExportStatus('Exportando productos SIIGO a Google Sheets...');

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

      // Obtener códigos únicos de CI (no CB) de las entradas
      const codigosUnicos = [...new Set(
        entradasFiltradas
          .filter(e => e.CI) // Solo entradas que tienen CI
          .map(e => String(e.CI))
      )];
      
      if (codigosUnicos.length === 0) {
        setExportStatus('✗ No hay productos con código CI en el rango de fechas seleccionado');
        setTimeout(() => setExportStatus(''), 3000);
        return;
      }
      
      // Obtener información completa de los productos
      const inventario = await repuestosAPI.getAll();
      
      // Detectar duplicados de CI
      const ciCounts = new Map<string, number>();
      inventario.forEach(p => {
        if (p.CI) {
          const ci = String(p.CI);
          ciCounts.set(ci, (ciCounts.get(ci) || 0) + 1);
        }
      });
      
      const duplicados = Array.from(ciCounts.entries()).filter(([_, count]) => count > 1);
      if (duplicados.length > 0) {
        console.warn('⚠️ ADVERTENCIA: Se encontraron CIs duplicados en el inventario:', duplicados);
      }
      
      // Crear mapa por CI (no por CB)
      // Si hay duplicados, el Map solo guardará el último
      const productosMap = new Map(
        inventario
          .filter(p => p.CI)
          .map(p => [String(p.CI).trim(), p])
      );
      
      console.log('Total productos en mapa:', productosMap.size);
      console.log('Ejemplo de CIs en mapa:', Array.from(productosMap.keys()).slice(0, 10));

      // Crear datos para el formato SIIGO
      const data = codigosUnicos.map(ci => {
        const ciNormalizado = String(ci).trim();
        const producto = productosMap.get(ciNormalizado);
        const entradasProducto = entradasFiltradas.filter(e => String(e.CI).trim() === ciNormalizado);
        const precioVenta = Number(producto?.PRECIO || 0);
        
        // Debug: verificar mapeo de códigos
        console.log('=== PROCESANDO CI:', ciNormalizado, '===');
        console.log('Producto encontrado:', !!producto);
        if (producto) {
          console.log('  Inventario - PRODUCTO:', producto.PRODUCTO);
          console.log('  Inventario - TIPO:', producto.TIPO);
          console.log('  Inventario - MODELO:', producto.MODELO_ESPECIFICACION);
          console.log('  Inventario - CB:', producto.CB);
        } else {
          console.warn('  ⚠️ NO SE ENCONTRÓ PRODUCTO EN INVENTARIO');
        }
        console.log('Entradas encontradas:', entradasProducto.length);
        if (entradasProducto[0]) {
          console.log('  Entrada - DESCRIPCION:', entradasProducto[0].DESCRIPCION);
          console.log('  Entrada - CB:', entradasProducto[0].CB);
        }
        
        // Combinar Producto, Tipo y Modelo/Especificación
        const nombreProducto = producto?.PRODUCTO || entradasProducto[0]?.DESCRIPCION || '';
        const tipo = producto?.TIPO || '';
        const modelo = producto?.MODELO_ESPECIFICACION || '';
        
        const nombreCompleto = [nombreProducto, tipo, modelo]
          .filter(campo => campo && campo.trim() !== '')
          .join(' - ');
        
        // Usar el CI directamente (ya es string)
        const codigoCI = String(ci);
        const codigoCB = String(producto?.CB || '');
        
        return {
          'Tipo de Producto': 'P-Producto',
          'Categoría de Inventarios / Servicios': '1-Productos',
          'Código del Producto': codigoCI,
          'Nombre del Producto / Servicio': nombreCompleto,
          '¿Inventariable?': 'Si',
          'Visible en facturas de venta': 'Si',
          'Stock mínimo': '',
          'Unidad de medida DIAN': '94',
          'Unidad de Medida Impresión Factura': '',
          'Referencia de Fábrica': producto?.REFERENCIA || '',
          'Código de Barras': codigoCB,
          'Descripción Larga': '',
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
          'Marca': '',
          'Modelo': '',
        };
      });

      // Enviar datos a Google Sheets
      console.log('Enviando datos SIIGO a Google Sheets:', {
        url: googleSheetsUrl,
        cantidadProductos: data.length,
        primerProducto: data[0]
      });

      try {
        await fetch(googleSheetsUrl, {
          method: 'POST',
          mode: 'no-cors',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            tipo: 'SIIGO',
            productos: data
          })
        });

        console.log('Petición SIIGO enviada exitosamente');
        setExportStatus(`✓ ${data.length} productos SIIGO enviados a Google Sheets. Verifica la pestaña SIIGO.`);
      } catch (fetchError) {
        console.error('Error en fetch:', fetchError);
        throw fetchError;
      }
      
      setTimeout(() => setExportStatus(''), 5000);
      
    } catch (error) {
      console.error('Error exportando SIIGO a Google Sheets:', error);
      setExportStatus('✗ Error al exportar SIIGO a Google Sheets.');
      setTimeout(() => setExportStatus(''), 5000);
    } finally {
      setLoading(false);
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

      // Obtener códigos únicos de CI (no CB) de las entradas
      const codigosUnicos = [...new Set(
        entradasFiltradas
          .filter(e => e.CI) // Solo entradas que tienen CI
          .map(e => String(e.CI))
      )];
      
      if (codigosUnicos.length === 0) {
        setExportStatus('✗ No hay productos con código CI en el rango de fechas seleccionado');
        setTimeout(() => setExportStatus(''), 3000);
        return;
      }
      
      // Obtener información completa de los productos
      const inventario = await repuestosAPI.getAll();
      
      // Detectar duplicados de CI
      const ciCounts = new Map<string, number>();
      inventario.forEach(p => {
        if (p.CI) {
          const ci = String(p.CI);
          ciCounts.set(ci, (ciCounts.get(ci) || 0) + 1);
        }
      });
      
      const duplicados = Array.from(ciCounts.entries()).filter(([_, count]) => count > 1);
      if (duplicados.length > 0) {
        console.warn('⚠️ ADVERTENCIA: Se encontraron CIs duplicados en el inventario:', duplicados);
      }
      
      // Crear mapa por CI (no por CB)
      // Si hay duplicados, el Map solo guardará el último
      const productosMap = new Map(
        inventario
          .filter(p => p.CI)
          .map(p => [String(p.CI).trim(), p])
      );
      
      console.log('Total productos en mapa:', productosMap.size);
      console.log('Ejemplo de CIs en mapa:', Array.from(productosMap.keys()).slice(0, 10));

      // Crear datos para el Excel siguiendo el formato SIIGO
      const data = codigosUnicos.map(ci => {
        const ciNormalizado = String(ci).trim();
        const producto = productosMap.get(ciNormalizado);
        const entradasProducto = entradasFiltradas.filter(e => String(e.CI).trim() === ciNormalizado);
        const precioVenta = Number(producto?.PRECIO || 0);
        
        // Debug: verificar mapeo de códigos
        console.log('=== PROCESANDO CI:', ciNormalizado, '===');
        console.log('Producto encontrado:', !!producto);
        if (producto) {
          console.log('  Inventario - PRODUCTO:', producto.PRODUCTO);
          console.log('  Inventario - TIPO:', producto.TIPO);
          console.log('  Inventario - MODELO:', producto.MODELO_ESPECIFICACION);
          console.log('  Inventario - CB:', producto.CB);
        } else {
          console.warn('  ⚠️ NO SE ENCONTRÓ PRODUCTO EN INVENTARIO');
        }
        console.log('Entradas encontradas:', entradasProducto.length);
        if (entradasProducto[0]) {
          console.log('  Entrada - DESCRIPCION:', entradasProducto[0].DESCRIPCION);
          console.log('  Entrada - CB:', entradasProducto[0].CB);
        }
        
        // Combinar Producto, Tipo y Modelo/Especificación
        const nombreProducto = producto?.PRODUCTO || entradasProducto[0]?.DESCRIPCION || '';
        const tipo = producto?.TIPO || '';
        const modelo = producto?.MODELO_ESPECIFICACION || '';
        
        const nombreCompleto = [nombreProducto, tipo, modelo]
          .filter(campo => campo && campo.trim() !== '')
          .join(' - ');
        
        // Usar el CI directamente (ya es string)
        const codigoCI = String(ci);
        const codigoCB = String(producto?.CB || '');
        
        return {
          'Tipo de Producto': 'P-Producto',
          'Categoría de Inventarios / Servicios': '1-Productos',
          'Código del Producto': codigoCI,
          'Nombre del Producto / Servicio': nombreCompleto,
          '¿Inventariable?': 'Si',
          'Visible en facturas de venta': 'Si',
          'Stock mínimo': '',
          'Unidad de medida DIAN': '94',
          'Unidad de Medida Impresión Factura': '',
          'Referencia de Fábrica': producto?.REFERENCIA || '',
          'Código de Barras': codigoCB,
          'Descripción Larga': '',
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
          'Marca': '',
          'Modelo': '',
        };
      });

      // Crear el libro de Excel
      const worksheet = XLSX.utils.json_to_sheet(data);
      
      // Forzar que los códigos se traten como texto en Excel
      const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
      for (let R = range.s.r + 1; R <= range.e.r; ++R) {
        // Columna C = Código del Producto (índice 2)
        const cellAddressCI = XLSX.utils.encode_cell({ r: R, c: 2 });
        if (worksheet[cellAddressCI]) {
          worksheet[cellAddressCI].t = 's'; // Forzar tipo string
          worksheet[cellAddressCI].v = String(worksheet[cellAddressCI].v);
        }
        
        // Columna K = Código de Barras (índice 10)
        const cellAddressCB = XLSX.utils.encode_cell({ r: R, c: 10 });
        if (worksheet[cellAddressCB]) {
          worksheet[cellAddressCB].t = 's'; // Forzar tipo string
          worksheet[cellAddressCB].v = String(worksheet[cellAddressCB].v);
        }
      }
      
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

  const exportToGoogleSheets = async () => {
    if (!codigosCIImpresion || codigosCIImpresion.trim() === '') {
      setExportStatus('✗ Por favor ingresa al menos un código CI');
      setTimeout(() => setExportStatus(''), 3000);
      return;
    }

    const googleSheetsUrl = import.meta.env.VITE_GOOGLE_SHEETS_URL;
    if (!googleSheetsUrl || googleSheetsUrl === 'TU_URL_DEL_DEPLOYMENT_AQUI') {
      setExportStatus('✗ URL de Google Sheets no configurada. Revisa tu archivo .env');
      setTimeout(() => setExportStatus(''), 5000);
      return;
    }

    setLoading(true);
    setExportStatus('Exportando a Google Sheets...');

    try {
      // Procesar los códigos CI ingresados (separados por comas, espacios o saltos de línea)
      const codigosArray = codigosCIImpresion
        .split(/[\n,]+/)
        .map(ci => ci.trim())
        .filter(ci => ci !== '');

      if (codigosArray.length === 0) {
        setExportStatus('✗ No se encontraron códigos CI válidos');
        setTimeout(() => setExportStatus(''), 3000);
        return;
      }

      // Obtener todos los productos
      const inventario = await repuestosAPI.getAll();
      
      // Filtrar productos por los códigos CI ingresados
      const productosFiltrados = inventario.filter(p => 
        codigosArray.includes(String(p.CI))
      );

      if (productosFiltrados.length === 0) {
        setExportStatus('✗ No se encontraron productos con los códigos CI ingresados');
        setTimeout(() => setExportStatus(''), 3000);
        return;
      }

      // Obtener todas las entradas para buscar fechas
      const entradas = await entradasAPI.getAll();

      // Obtener proveedores principales para cada producto
      const productosConProveedor = await Promise.all(
        productosFiltrados.map(async (producto) => {
          try {
            const response = await apiClient.getProveedoresByProducto(String(producto.CB));
            let comparativas = response;
            if (response && typeof response === 'object' && 'data' in response) {
              comparativas = (response as any).data;
            }
            
            let codigoProveedor = '';
            if (Array.isArray(comparativas)) {
              const principal = comparativas.find((c: any) => c.es_proveedor_principal);
              if (principal && principal.proveedores) {
                codigoProveedor = principal.proveedores.cp || '';
              }
            }
            
            // Obtener la fecha de entrada más reciente del producto
            const entradasProducto = entradas.filter(e => String(e.CB) === String(producto.CB));
            const fechaEntrada = entradasProducto.length > 0 
              ? formatDateLocal(entradasProducto[entradasProducto.length - 1].FECHA)
              : formatDateLocal(new Date());
            
            return {
              CB: producto.CB,
              CI: producto.CI || '',
              PRODUCTO: producto.PRODUCTO || '',
              TIPO: producto.TIPO || '',
              MODELO_ESPECIFICACION: producto.MODELO_ESPECIFICACION || '',
              REFERENCIA: producto.REFERENCIA || '',
              MARCA: producto.MARCA || '',
              PROVEEDOR: codigoProveedor,
              FECHA: fechaEntrada
            };
          } catch (error) {
            console.error(`Error obteniendo proveedor para ${producto.CB}:`, error);
            
            // Obtener la fecha de entrada más reciente del producto
            const entradasProducto = entradas.filter(e => String(e.CB) === String(producto.CB));
            const fechaEntrada = entradasProducto.length > 0 
              ? formatDateLocal(entradasProducto[entradasProducto.length - 1].FECHA)
              : formatDateLocal(new Date());
            
            return {
              CB: producto.CB,
              CI: producto.CI || '',
              PRODUCTO: producto.PRODUCTO || '',
              TIPO: producto.TIPO || '',
              MODELO_ESPECIFICACION: producto.MODELO_ESPECIFICACION || '',
              REFERENCIA: producto.REFERENCIA || '',
              MARCA: producto.MARCA || '',
              PROVEEDOR: '',
              FECHA: fechaEntrada
            };
          }
        })
      );

      // Enviar datos a Google Sheets
      console.log('Enviando datos a Google Sheets:', {
        url: googleSheetsUrl,
        cantidadProductos: productosConProveedor.length,
        primerosProductos: productosConProveedor.slice(0, 2)
      });

      // Usar no-cors para evitar problemas de CORS con Google Apps Script
      await fetch(googleSheetsUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tipo: 'IMPRESION',
          productos: productosConProveedor
        })
      });

      // Con no-cors no podemos verificar la respuesta, pero si no hay error de red, asumimos éxito
      console.log('Petición enviada exitosamente');
      setExportStatus(`✓ ${productosConProveedor.length} productos enviados a Google Sheets. Verifica tu hoja.`);
      setTimeout(() => setExportStatus(''), 5000);
      
    } catch (error) {
      console.error('Error exportando a Google Sheets:', error);
      setExportStatus('✗ Error al exportar a Google Sheets. Verifica la configuración.');
      setTimeout(() => setExportStatus(''), 5000);
    } finally {
      setLoading(false);
    }
  };

  const exportParaImpresion = async () => {
    if (!codigosCIImpresion || codigosCIImpresion.trim() === '') {
      setExportStatus('✗ Por favor ingresa al menos un código CI');
      setTimeout(() => setExportStatus(''), 3000);
      return;
    }

    setLoading(true);
    setExportStatus('Exportando datos para impresión...');

    try {
      // Procesar los códigos CI ingresados (separados por comas, espacios o saltos de línea)
      const codigosArray = codigosCIImpresion
        .split(/[\n,]+/)
        .map(ci => ci.trim())
        .filter(ci => ci !== '');

      if (codigosArray.length === 0) {
        setExportStatus('✗ No se encontraron códigos CI válidos');
        setTimeout(() => setExportStatus(''), 3000);
        return;
      }

      // Obtener todos los productos
      const inventario = await repuestosAPI.getAll();
      
      // Filtrar productos por los códigos CI ingresados
      const productosFiltrados = inventario.filter(p => 
        codigosArray.includes(String(p.CI))
      );

      if (productosFiltrados.length === 0) {
        setExportStatus('✗ No se encontraron productos con los códigos CI ingresados');
        setTimeout(() => setExportStatus(''), 3000);
        return;
      }

      // Obtener todas las entradas para buscar fechas
      const entradas = await entradasAPI.getAll();

      // Obtener proveedores principales para cada producto
      const productosConProveedor = await Promise.all(
        productosFiltrados.map(async (producto) => {
          try {
            const response = await apiClient.getProveedoresByProducto(String(producto.CB));
            let comparativas = response;
            if (response && typeof response === 'object' && 'data' in response) {
              comparativas = (response as any).data;
            }
            
            let codigoProveedor = '';
            if (Array.isArray(comparativas)) {
              const principal = comparativas.find((c: any) => c.es_proveedor_principal);
              if (principal && principal.proveedores) {
                // Obtener el código CP del proveedor
                codigoProveedor = principal.proveedores.cp || '';
              }
            }
            
            // Obtener la fecha de entrada más reciente del producto
            const entradasProducto = entradas.filter(e => String(e.CB) === String(producto.CB));
            const fechaEntrada = entradasProducto.length > 0 
              ? formatDateLocal(entradasProducto[entradasProducto.length - 1].FECHA)
              : formatDateLocal(new Date());
            
            return {
              CB: producto.CB,
              CI: producto.CI,
              PRODUCTO: producto.PRODUCTO,
              TIPO: producto.TIPO,
              MODELO_ESPECIFICACION: producto.MODELO_ESPECIFICACION,
              REFERENCIA: producto.REFERENCIA,
              MARCA: producto.MARCA,
              codigoProveedor,
              fechaEntrada
            };
          } catch (error) {
            console.error(`Error obteniendo proveedor para ${producto.CB}:`, error);
            
            // Obtener la fecha de entrada más reciente del producto
            const entradasProducto = entradas.filter(e => String(e.CB) === String(producto.CB));
            const fechaEntrada = entradasProducto.length > 0 
              ? formatDateLocal(entradasProducto[entradasProducto.length - 1].FECHA)
              : formatDateLocal(new Date());
            
            return {
              CB: producto.CB,
              CI: producto.CI,
              PRODUCTO: producto.PRODUCTO,
              TIPO: producto.TIPO,
              MODELO_ESPECIFICACION: producto.MODELO_ESPECIFICACION,
              REFERENCIA: producto.REFERENCIA,
              MARCA: producto.MARCA,
              codigoProveedor: '',
              fechaEntrada
            };
          }
        })
      );

      // Crear datos para el Excel con formato para impresión de etiquetas
      const data = productosConProveedor.map(producto => ({
        'CB': producto.CB,
        'CI': producto.CI || '',
        'PRODUCTO': producto.PRODUCTO || '',
        'TIPO': producto.TIPO || '',
        'MODELO/ESPECIFICACIÓN': producto.MODELO_ESPECIFICACION || '',
        'REFERENCIA': producto.REFERENCIA || '',
        'MARCA': producto.MARCA || '',
        'PROVEEDOR': producto.codigoProveedor || '',
        'FECHA': producto.fechaEntrada,
      }));

      // Crear el libro de Excel
      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Datos Impresión');

      // Ajustar ancho de columnas
      const maxWidth = 40;
      const colWidths = Object.keys(data[0]).map(key => {
        const maxLength = Math.max(
          key.length,
          ...data.map(row => String((row as any)[key] || '').length)
        );
        return { wch: Math.min(Math.max(maxLength + 2, 10), maxWidth) };
      });
      worksheet['!cols'] = colWidths;

      // Descargar el archivo
      const filename = `Impresion_Etiquetas_${Date.now()}.xlsx`;
      XLSX.writeFile(workbook, filename, { bookType: 'xlsx', type: 'binary' });

      setExportStatus(`✓ ${data.length} productos exportados para impresión`);
      setTimeout(() => setExportStatus(''), 3000);
    } catch (error) {
      console.error('Error exportando para impresión:', error);
      setExportStatus('✗ Error al exportar datos para impresión');
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Sección de Productos Nuevos con Filtros de Fecha */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-300 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center justify-center w-12 h-12 bg-gray-200 rounded-full">
              <Calendar className="w-6 h-6 text-gray-700" />
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

          <div className="grid grid-cols-1 gap-3">

            <button
              onClick={exportProductosNuevosToSheets}
              disabled={loading || !fechaInicio || !fechaFin}
              className="w-full bg-gray-900 text-white py-3 px-4 rounded-lg hover:bg-gray-800 transition flex items-center justify-center gap-2 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Upload className="w-5 h-5" />
              Exportar a Google Sheets
            </button>
          </div>
        </div>

        {/* Sección de Exportar para Impresión */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-300 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center justify-center w-12 h-12 bg-gray-200 rounded-full">
              <Tag className="w-6 h-6 text-gray-700" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Datos para Impresión</h3>
              <p className="text-gray-600 text-sm">Exporta productos por código CI para etiquetas</p>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Códigos CI (separados por comas o líneas)
            </label>
            <textarea
              value={codigosCIImpresion}
              onChange={(e) => setCodigosCIImpresion(e.target.value)}
              placeholder="Ejemplo: CI001, CI002, CI003&#10;o uno por línea"
              rows={5}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent resize-none font-mono text-sm"
            />
            <p className="text-xs text-gray-500 mt-1">
              Puedes ingresar múltiples códigos separados por comas o uno por línea
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3">

            <button
              onClick={exportToGoogleSheets}
              disabled={loading || !codigosCIImpresion.trim()}
              className="w-full bg-gray-900 text-white py-3 px-4 rounded-lg hover:bg-gray-800 transition flex items-center justify-center gap-2 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Upload className="w-5 h-5" />
              Exportar a Google Sheets
            </button>
            <a
              href={import.meta.env.VITE_GOOGLE_SHEETS_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full bg-gray-900 text-white py-3 px-4 rounded-lg hover:bg-gray-800 transition flex items-center justify-center gap-2 font-medium"
            >
              <ExternalLink className="w-5 h-5" />
              Ir al Google Sheet
            </a>
          </div>
        </div>
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
          <li className="flex items-start gap-2">
            <span className="text-gray-900 mt-0.5">•</span>
            <span>La exportación para impresión filtra productos por fecha de entrada e incluye todos los datos necesarios para generar etiquetas: códigos, descripción completa y código CP del proveedor principal</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-gray-900 mt-0.5">•</span>
            <span>El archivo de impresión puede ser usado para importar datos masivos o como respaldo de la información de etiquetas</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-gray-900 mt-0.5">•</span>
            <span>Ambas exportaciones con filtro de fecha permiten generar archivos específicos para períodos determinados</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
