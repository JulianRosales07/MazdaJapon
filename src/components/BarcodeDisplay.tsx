import { useEffect, useRef, useState } from 'react';
import JsBarcode from 'jsbarcode';

interface BarcodeDisplayProps {
  value: string;
  width?: number;
  height?: number;
  fontSize?: number;
}

export default function BarcodeDisplay({ 
  value, 
  width = 2, 
  height = 60, 
  fontSize = 14 
}: BarcodeDisplayProps) {
  const barcodeRef = useRef<SVGSVGElement>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (barcodeRef.current && value) {
      try {
        setError(false);
        JsBarcode(barcodeRef.current, value, {
          format: 'CODE128',
          width,
          height,
          fontSize,
          background: '#f9fafb',
          lineColor: '#000',
          displayValue: true,
        });
      } catch (err) {
        console.error('Error generating barcode:', err);
        setError(true);
      }
    }
  }, [value, width, height, fontSize]);

  if (error) {
    return (
      <div className="text-center py-4">
        <div className="text-2xl font-bold text-gray-900 mb-1">{value}</div>
        <div className="text-xs text-gray-500">Código no compatible con formato de barras</div>
      </div>
    );
  }

  return <svg ref={barcodeRef}></svg>;
}
