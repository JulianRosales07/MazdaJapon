import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { apiClient } from '../lib/apiClient';
import type { Usuario, Rol } from '../lib/types';
import { tienePermiso, Permiso, usePermisos } from '../lib/permissions';

type AuthContextType = {
  usuario: Usuario | null;
  loading: boolean;
  signIn: (username: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, nombre: string, rol?: Rol) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  isAdmin: boolean;
  tienePermiso: (permiso: Permiso) => boolean;
  permisos: ReturnType<typeof usePermisos>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verificar si hay una sesión guardada en localStorage
    const savedUser = localStorage.getItem('usuario');
    if (savedUser) {
      try {
        setUsuario(JSON.parse(savedUser));
      } catch (error) {
        console.error('Error parsing saved user:', error);
        localStorage.removeItem('usuario');
      }
    }
    setLoading(false);
  }, []);

  const signIn = async (username: string, password: string) => {
    try {
      const response = await apiClient.login(username, password);
      setUsuario(response.user);
      localStorage.setItem('usuario', JSON.stringify(response.user));
      return { error: null };
    } catch (error) {
      console.error('Error en login:', error);
      return { error: error as Error };
    }
  };

  const signUp = async (
    email: string,
    password: string,
    nombre: string,
    rol: Rol = 'gestion_inventario'
  ) => {
    try {
      const user = await apiClient.createUsuario({
        nombre,
        email,
        password,
        rol,
      });
      setUsuario(user);
      localStorage.setItem('usuario', JSON.stringify(user));
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    await apiClient.logout();
    setUsuario(null);
    localStorage.removeItem('usuario');
  };

  const isAdmin = usuario?.rol === 'administrador';
  
  const permisos = usuario ? usePermisos(usuario.rol) : {
    puedeverDashboard: false,
    puedeVerInventario: false,
    puedeCrearInventario: false,
    puedeEditarInventario: false,
    puedeEliminarInventario: false,
    puedeVerSalidas: false,
    puedeCrearSalidas: false,
    puedeEditarSalidas: false,
    puedeEliminarSalidas: false,
    puedeExportar: false,
    puedeVerConfiguracion: false,
    tienePermiso: () => false,
    tieneAccesoRuta: () => false,
  };

  const verificarPermiso = (permiso: Permiso): boolean => {
    if (!usuario) return false;
    return tienePermiso(usuario.rol, permiso);
  };

  return (
    <AuthContext.Provider value={{ 
      usuario, 
      loading, 
      signIn, 
      signUp, 
      signOut, 
      isAdmin,
      tienePermiso: verificarPermiso,
      permisos,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
