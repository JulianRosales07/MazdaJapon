import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import LOGO from '../assets/mazda.png'
import { LogIn } from 'lucide-react';
import { DotPattern } from './ui/dot-pattern';
import { cn } from '@/lib/utils';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error } = await signIn(username, password);

    if (error) {
      setError(error.message);
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden bg-gray-950">
      {/* Dot Pattern Background */}
      <DotPattern
        className={cn(
          "absolute inset-0 h-full w-full",
"[mask-image:radial-gradient(12000px_circle_at_center,white,transparent)]"
        )}
      />
      
      {/* Background Image with Blur */}
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-70"
        style={{
          backgroundImage: 'url(https://m.media-amazon.com/images/I/713xFikmrdL.jpg)',
          filter: 'blur(2px)',
          transform: 'scale(1.1)'
        }}
      />
      
      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900/80 via-black/70 to-gray-800/80" />

      {/* Logo in top left with enhanced visibility */}
      <div className="absolute top-8 left-8 z-10 flex items-center gap-4 bg-white/15 backdrop-blur-lg px-6 py-4 rounded-2xl border-2 border-white/30 shadow-2xl hover:bg-white/20 hover:border-white/40 transition-all duration-300 group">
        <div className="relative">
          {/* Glow effect */}
          <div className="absolute inset-0 bg-white/30 rounded-full blur-2xl group-hover:bg-white/40 transition-all duration-300"></div>
          {/* Logo with white background for better visibility */}
          <div className="relative z-10 bg-white rounded-full p-2 shadow-xl">
            <img 
              src={LOGO}
              alt="Mazda Japon" 
              className="w-10 h-10 object-contain"
            />
          </div>
        </div>
        <span className="text-white text-2xl font-bold tracking-wide drop-shadow-2xl">Mazda Japón</span>
      </div>

      

      {/* Login Card */}
      <div className="relative z-10 bg-gray-900/90 backdrop-blur-xl rounded-3xl shadow-2xl w-full max-w-md p-10 border border-white/10">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-3 drop-shadow-lg">
            Bienvenido
          </h1>
          <div className="w-24 h-1.5 bg-gradient-to-r from-transparent via-white to-transparent mx-auto rounded-full shadow-lg" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="username" className="block text-sm font-semibold text-gray-100 mb-2">
              Tu nombre de usuario
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="w-full px-4 py-3 bg-gray-800/70 border border-gray-600/60 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-white/50 focus:border-white/50 focus:bg-gray-800/90 outline-none transition-all duration-200 backdrop-blur-sm shadow-lg"
              placeholder="tu_usuario"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-semibold text-gray-100 mb-2">
              Tu contraseña
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 bg-gray-800/70 border border-gray-600/60 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-white/50 focus:border-white/50 focus:bg-gray-800/90 outline-none transition-all duration-200 backdrop-blur-sm shadow-lg"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="bg-red-500/20 border-2 border-red-400/50 text-red-100 px-4 py-3 rounded-xl text-sm backdrop-blur-md shadow-lg animate-shake">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-red-300" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span className="font-medium">{error}</span>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-white text-black py-3.5 px-4 rounded-xl hover:bg-gray-100 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-bold shadow-2xl flex items-center justify-center gap-2 mt-8"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin"></div>
                Iniciando sesión...
              </span>
            ) : (
              <>
                <LogIn size={20} />
                INICIAR SESIÓN
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
