import { Zap } from 'lucide-react';

interface ProfileScreenProps {
  nombre: string;
  email: string;
  isAdmin: boolean;
}

export function ProfileScreen({ nombre, email, isAdmin }: ProfileScreenProps) {
  return (
    <div className="bg-[#2a3042] h-full w-full flex flex-col justify-between p-8 text-white">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Zap className="w-6 h-6 text-white" />
        <h2 className="text-xl font-bold">Tu Perfil</h2>
      </div>
      
      {/* Content - Centered */}
      <div className="flex flex-col items-center text-center space-y-6">
        <div className="w-24 h-24 bg-gray-600 rounded-full flex items-center justify-center text-4xl font-bold shadow-lg">
          {nombre?.charAt(0) || 'U'}
        </div>
        
        <div className="space-y-2">
          <h3 className="font-bold text-2xl">{nombre}</h3>
          <p className="text-gray-300 text-base break-all px-4">{email}</p>
        </div>
      </div>

      {/* Footer - Role */}
      <div className="w-full pt-6 border-t border-gray-700">
        <div className="flex flex-col items-center gap-3">
          <span className="text-gray-300 text-base">Rol:</span>
          <span className={`font-semibold px-6 py-3 rounded-lg text-base ${isAdmin
            ? 'bg-white text-[#2a3042]'
            : 'bg-gray-700 text-gray-200'
            }`}>
            {isAdmin ? '👑 Administrador' : 'Usuario'}
          </span>
        </div>
      </div>
    </div>
  );
}
