import { useEffect, useState } from 'react';
import { X, Printer, Download } from 'lucide-react';
import type { Repuesto, ProductoProveedor } from '../lib/types';
import { apiClient } from '../lib/apiClient';
import JsBarcode from 'jsbarcode';

interface PrintMultipleLabelsProps {
  products: Repuesto[];
  onClose: () => void;
}

interface ProductWithProvider extends Repuesto {
  proveedorPrincipal?: string;
}

export default function PrintMultipleLabels({ products, onClose }: PrintMultipleLabelsProps) {
  const [productsWithProviders, setProductsWithProviders] = useState<ProductWithProvider[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAllProviders();
  }, [products]);

  const fetchAllProviders = async () => {
    try {
      const productsData = await Promise.all(
        products.map(async (product) => {
          try {
            const response = await apiClient.getProveedoresByProducto(product.CB);
            let comparativas = response;
            if (response && typeof response === 'object' && 'data' in response) {
              comparativas = (response as any).data;
            }
            
            let proveedorPrincipal = '';
            if (Array.isArray(comparativas)) {
              const principal = comparativas.find((c: ProductoProveedor) => c.es_proveedor_principal);
              if (principal && principal.proveedores) {
                proveedorPrincipal = principal.proveedores.nombre_proveedor;
              }
            }
            
            return { ...product, proveedorPrincipal };
          } catch (error) {
            console.error(`Error fetching proveedor for ${product.CB}:`, error);
            return { ...product, proveedorPrincipal: '' };
          }
        })
      );
      
      setProductsWithProviders(productsData);
    } catch (error) {
      console.error('Error fetching providers:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!loading && productsWithProviders.length > 0) {
      // Generar códigos de barras para todos los productos
      productsWithProviders.forEach((product, index) => {
        try {
          const canvas = document.getElementById(`barcode-canvas-${index}`) as HTMLCanvasElement;
          if (canvas && product.CB) {
            JsBarcode(canvas, String(product.CB), {
              format: 'CODE128',
              width: 2,
              height: 60,
              displayValue: false,
            });
          }
        } catch (error) {
          console.error(`Error generating barcode for ${product.CB}:`, error);
        }
      });
    }
  }, [loading, productsWithProviders]);

  const handlePrint = () => {
    window.print();
  };

  const formatDate = (product: Repuesto) => {
    const date = product.fecha_actualizacion || product.fecha_creacion || new Date().toISOString();
    return new Date(date).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6">
          <p>Cargando información de {products.length} productos...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Botones de acción - No se imprimen */}
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 print:hidden">
        <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white z-10">
            <h2 className="text-xl font-semibold">Vista Previa - {productsWithProviders.length} Etiquetas</h2>
            <div className="flex gap-2">
              <button
                onClick={handlePrint}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Printer className="w-4 h-4" />
                Imprimir Todas
              </button>
              <button
                onClick={handlePrint}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                <Download className="w-4 h-4" />
                PDF
              </button>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Vista previa en grid */}
          <div className="p-8 bg-gray-50">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {productsWithProviders.map((product, index) => (
                <div key={`${product.CB}-${index}`} className="bg-white p-4 rounded-lg shadow">
                  <LabelContent
                    product={product}
                    proveedorPrincipal={product.proveedorPrincipal || ''}
                    formatDate={() => formatDate(product)}
                    canvasId={`barcode-canvas-${index}`}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Contenido para imprimir - Una etiqueta por página */}
      <div className="hidden print:block">
        {productsWithProviders.map((product, index) => (
          <div key={`print-${product.CB}-${index}`} className="page-break">
            <LabelContent
              product={product}
              proveedorPrincipal={product.proveedorPrincipal || ''}
              formatDate={() => formatDate(product)}
              canvasId={`barcode-canvas-${index}`}
            />
          </div>
        ))}
      </div>
    </>
  );
}

interface LabelContentProps {
  product: Repuesto;
  proveedorPrincipal: string;
  formatDate: () => string;
  canvasId: string;
}

function LabelContent({ product, proveedorPrincipal, formatDate, canvasId }: LabelContentProps) {
  return (
    <div className="w-[10cm] border-2 border-gray-800 p-4 font-sans">
      {/* Código de Barras */}
      <div className="flex flex-col items-center mb-3 border-b-2 border-gray-300 pb-3">
        <canvas id={canvasId} className="mb-1"></canvas>
        <div className="text-center">
          <div className="text-xs font-semibold">CB: {product.CB}</div>
          {product.CI && <div className="text-xs">CI: {product.CI}</div>}
        </div>
      </div>

      {/* Información del Producto */}
      <div className="space-y-2 text-sm">
        <div className="border-b border-gray-200 pb-1">
          <div className="text-xs text-gray-600 uppercase">Producto</div>
          <div className="font-semibold text-base">{product.PRODUCTO || '-'}</div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <div className="text-xs text-gray-600 uppercase">Tipo</div>
            <div className="font-medium">{product.TIPO || '-'}</div>
          </div>
          <div>
            <div className="text-xs text-gray-600 uppercase">Marca</div>
            <div className="font-medium">{product.MARCA || '-'}</div>
          </div>
        </div>

        <div>
          <div className="text-xs text-gray-600 uppercase">Modelo/Especificación</div>
          <div className="font-medium">{product.MODELO_ESPECIFICACION || '-'}</div>
        </div>

        <div>
          <div className="text-xs text-gray-600 uppercase">Referencia</div>
          <div className="font-medium">{product.REFERENCIA || '-'}</div>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-200">
          <div>
            <div className="text-xs text-gray-600 uppercase">Proveedor</div>
            <div className="font-medium text-xs">{proveedorPrincipal || '-'}</div>
          </div>
          <div>
            <div className="text-xs text-gray-600 uppercase">Fecha</div>
            <div className="font-medium">{formatDate()}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
