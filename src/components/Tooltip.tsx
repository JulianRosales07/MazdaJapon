import { ReactNode, useState } from 'react';
import { HelpCircle } from 'lucide-react';

type TooltipProps = {
  content: string;
  children?: ReactNode;
};

export default function Tooltip({ content, children }: TooltipProps) {
  const [show, setShow] = useState(false);

  return (
    <div className="relative inline-flex items-center group">
      <div
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        className="cursor-help inline-flex"
      >
        {children || <HelpCircle className="w-4 h-4 text-gray-400 hover:text-gray-600 transition-colors" />}
      </div>
      {show && (
        <div className="absolute left-full ml-2 top-1/2 transform -translate-y-1/2 z-[9999] pointer-events-none">
          <div className="px-3 py-2 text-xs leading-tight text-white bg-gray-900 rounded-lg shadow-xl whitespace-nowrap">
            {content}
            <div className="absolute right-full top-1/2 transform translate-x-1 -translate-y-1/2">
              <div className="border-[6px] border-transparent border-r-gray-900"></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
