import { ReactNode } from 'react';

interface IPhoneMockupProps {
  children: ReactNode;
  className?: string;
}

export function IPhoneMockup({ children, className = '' }: IPhoneMockupProps) {
  return (
    <div className={`relative mx-auto ${className}`} style={{ width: '300px', height: '600px' }}>
      {/* iPhone Frame */}
      <div className="absolute inset-0 bg-gray-900 rounded-[3rem] shadow-2xl border-4 border-gray-800">
        {/* Screen - goes almost to the edges */}
        <div className="absolute inset-1 bg-white rounded-[2.75rem] overflow-hidden">
          {/* Dynamic Island */}
          <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-28 h-7 bg-gray-900 rounded-full z-20 shadow-lg"></div>
          
          {/* Status Bar */}
          <div className="absolute top-0 left-0 right-0 h-12 bg-gradient-to-b from-gray-50 to-transparent z-10 flex items-center justify-between px-6 pt-2">
            <span className="text-xs font-semibold text-gray-900">9:41</span>
            <div className="flex items-center gap-1">
              <svg className="w-4 h-3" viewBox="0 0 16 12" fill="none">
                <rect x="0" y="0" width="4" height="12" fill="currentColor" opacity="0.4"/>
                <rect x="6" y="3" width="4" height="9" fill="currentColor" opacity="0.6"/>
                <rect x="12" y="1" width="4" height="11" fill="currentColor"/>
              </svg>
              <div className="w-5 h-3 border-2 border-gray-900 rounded-sm relative">
                <div className="absolute inset-0.5 bg-gray-900 rounded-sm"></div>
                <div className="absolute -right-1 top-1/2 transform -translate-y-1/2 w-0.5 h-1.5 bg-gray-900 rounded-r"></div>
              </div>
            </div>
          </div>
          
          {/* Content */}
          <div className="h-full w-full pt-12 pb-6 overflow-auto">
            {children}
          </div>
        </div>
        
        {/* Home Indicator */}
        <div className="absolute bottom-1.5 left-1/2 transform -translate-x-1/2 w-28 h-1 bg-gray-700 rounded-full"></div>
      </div>
    </div>
  );
}
