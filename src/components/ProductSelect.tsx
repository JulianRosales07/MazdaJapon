import { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown } from 'lucide-react';
import { Repuesto } from '../lib/api';

interface ProductSelectProps {
  productos: Repuesto[];
  value: string;
  onChange: (cb: string, producto?: Repuesto) => void;
  placeholder?: string;
  label?: string;
}

export default function ProductSelect({ productos, value, onChange, placeholder = 'Seleccionar producto', label = 'Producto' }: ProductSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedProduct = productos.find(p => String(p.CB) === value);

  const filteredProducts = productos.filter(producto =>
    producto.PRODUCTO.toLowerCase().includes(searchTerm.toLowerCase()) ||
    String(producto.CB).includes(searchTerm) ||
    producto.CI?.toString().includes(searchTerm) ||
    producto.MARCA?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  const handleSelect = (producto: Repuesto) => {
    onChange(String(producto.CB), producto);
    setIsOpen(false);
    setSearchTerm('');
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-2 text-left border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none bg-white hover:bg-gray-50 transition flex items-center justify-between"
      >
        <span className={selectedProduct ? 'text-gray-900' : 'text-gray-400'}>
          {selectedProduct ? `${selectedProduct.CB} - ${selectedProduct.PRODUCTO}` : placeholder}
        </span>
        <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'transform rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-white border border-gray-300 rounded-lg shadow-lg max-h-80 overflow-hidden">
          <div className="p-3 border-b border-gray-200 bg-gray-50">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar producto..."
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none"
              />
            </div>
          </div>

          <div className="overflow-y-auto max-h-64">
            {filteredProducts.length === 0 ? (
              <div className="px-4 py-8 text-center text-gray-500 text-sm">
                No se encontraron productos
              </div>
            ) : (
              filteredProducts.map((producto) => (
                <button
                  key={producto.CB}
                  type="button"
                  onClick={() => handleSelect(producto)}
                  className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition border-b border-gray-100 last:border-b-0 ${
                    String(producto.CB) === value ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 text-sm truncate">
                        {producto.PRODUCTO}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-gray-500 font-mono">
                          CB: {producto.CB}
                        </span>
                        {producto.CI && (
                          <>
                            <span className="text-gray-300">•</span>
                            <span className="text-xs text-gray-500 font-mono">
                              CI: {producto.CI}
                            </span>
                          </>
                        )}
                        {producto.MARCA && (
                          <>
                            <span className="text-gray-300">•</span>
                            <span className="text-xs text-gray-500">
                              {producto.MARCA}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    {String(producto.CB) === value && (
                      <svg className="w-5 h-5 text-blue-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
