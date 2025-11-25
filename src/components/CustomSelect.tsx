import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

type CustomSelectProps = {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder: string;
  label: string;
};

export default function CustomSelect({ value, onChange, options, placeholder, label }: CustomSelectProps) {
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

  const filteredOptions = options.filter(option =>
    option.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const displayValue = value || placeholder;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-left focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none transition-all bg-white hover:border-gray-400 flex items-center justify-between"
      >
        <span className={value ? 'text-gray-900' : 'text-gray-500'}>
          {displayValue}
        </span>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-64 overflow-hidden">
          {/* Buscador */}
          <div className="p-2 border-b border-gray-200 bg-gray-50">
            <input
              type="text"
              placeholder={`Buscar ${label.toLowerCase()}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none"
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          {/* Opciones */}
          <div className="overflow-y-auto max-h-48">
            {/* Opción "Todos" */}
            <button
              type="button"
              onClick={() => {
                onChange('');
                setIsOpen(false);
                setSearchTerm('');
              }}
              className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-100 transition-colors flex items-center justify-between ${
                !value ? 'bg-gray-50 font-medium' : ''
              }`}
            >
              <span>{placeholder}</span>
              {!value && <Check className="w-4 h-4 text-gray-900" />}
            </button>

            {/* Opciones filtradas */}
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => {
                    onChange(option);
                    setIsOpen(false);
                    setSearchTerm('');
                  }}
                  className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-100 transition-colors flex items-center justify-between ${
                    value === option ? 'bg-gray-50 font-medium' : ''
                  }`}
                >
                  <span>{option}</span>
                  {value === option && <Check className="w-4 h-4 text-gray-900" />}
                </button>
              ))
            ) : (
              <div className="px-3 py-4 text-sm text-gray-500 text-center">
                No se encontraron resultados
              </div>
            )}
          </div>

          {/* Footer con contador */}
          {filteredOptions.length > 0 && (
            <div className="px-3 py-2 border-t border-gray-200 bg-gray-50 text-xs text-gray-600">
              {filteredOptions.length} {filteredOptions.length === 1 ? 'opción' : 'opciones'}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
