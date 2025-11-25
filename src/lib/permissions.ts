import { Rol } from './api';

/**
 * Sistema de permisos basado en roles
 */

export type Permiso = 
  | 'ver_dashboard'
  | 'ver_inventario'
  | 'crear_inventario'
  | 'editar_inventario'
  | 'eliminar_inventario'
  | 'ver_salidas'
  | 'crear_salidas'
  | 'editar_salidas'
  | 'eliminar_salidas'
  | 'ver_marcas'
  | 'gestionar_marcas'
  | 'ver_proveedores'
  | 'gestionar_proveedores'
  | 'exportar'
  | 'ver_configuracion';

/**
 * Definición de permisos por rol
 */
const PERMISOS_POR_ROL: Record<Rol, Permiso[]> = {
  administrador: [
    'ver_dashboard',
    'ver_inventario',
    'crear_inventario',
    'editar_inventario',
    'eliminar_inventario',
    'ver_salidas',
    'crear_salidas',
    'editar_salidas',
    'eliminar_salidas',
    'ver_marcas',
    'gestionar_marcas',
    'ver_proveedores',
    'gestionar_proveedores',
    'exportar',
    'ver_configuracion',
  ],
  
  gestion_ingresos: [
    'ver_dashboard',
    'ver_inventario',
    'crear_inventario',
    'editar_inventario',
    'ver_marcas',
    'gestionar_marcas',
    'ver_proveedores',
    'gestionar_proveedores',
    'exportar',
  ],
  
  gestion_egresos: [
    'ver_dashboard',
    'ver_inventario', // Solo visualizar
    'ver_salidas',
    'crear_salidas',
    'editar_salidas',
    'eliminar_salidas',
  ],
  
  gestion_inventario: [
    'ver_inventario',
    'crear_inventario',
    'editar_inventario',
    'ver_marcas',
    'gestionar_marcas',
    'ver_proveedores',
    'gestionar_proveedores',
    // NO puede eliminar
  ],
  
  usuario: [
    'ver_dashboard',
    'ver_inventario',
  ],
};

/**
 * Verificar si un rol tiene un permiso específico
 */
export function tienePermiso(rol: Rol, permiso: Permiso): boolean {
  return PERMISOS_POR_ROL[rol]?.includes(permiso) || false;
}

/**
 * Verificar si un rol tiene acceso a una ruta
 */
export function tieneAccesoRuta(rol: Rol, ruta: string): boolean {
  const rutasPermisos: Record<string, Permiso> = {
    '/': 'ver_dashboard',
    '/dashboard': 'ver_dashboard',
    '/inventario': 'ver_inventario',
    '/salidas': 'ver_salidas',
    '/exportar': 'exportar',
    '/configuracion': 'ver_configuracion',
  };

  const permisoRequerido = rutasPermisos[ruta];
  if (!permisoRequerido) return false;

  return tienePermiso(rol, permisoRequerido);
}

/**
 * Obtener todas las rutas accesibles para un rol
 */
export function getRutasAccesibles(rol: Rol): string[] {
  const rutas: string[] = [];
  
  if (tienePermiso(rol, 'ver_dashboard')) rutas.push('/dashboard');
  if (tienePermiso(rol, 'ver_inventario')) rutas.push('/inventario');
  if (tienePermiso(rol, 'ver_salidas')) rutas.push('/salidas');
  if (tienePermiso(rol, 'exportar')) rutas.push('/exportar');
  if (tienePermiso(rol, 'ver_configuracion')) rutas.push('/configuracion');
  
  return rutas;
}

/**
 * Obtener la ruta por defecto para un rol
 */
export function getRutaPorDefecto(rol: Rol): string {
  if (tienePermiso(rol, 'ver_dashboard')) return '/dashboard';
  if (tienePermiso(rol, 'ver_inventario')) return '/inventario';
  if (tienePermiso(rol, 'ver_salidas')) return '/salidas';
  return '/';
}

/**
 * Hook personalizado para verificar permisos
 */
export function usePermisos(rol: Rol) {
  return {
    // Dashboard
    puedeverDashboard: tienePermiso(rol, 'ver_dashboard'),
    
    // Inventario
    puedeVerInventario: tienePermiso(rol, 'ver_inventario'),
    puedeCrearInventario: tienePermiso(rol, 'crear_inventario'),
    puedeEditarInventario: tienePermiso(rol, 'editar_inventario'),
    puedeEliminarInventario: tienePermiso(rol, 'eliminar_inventario'),
    
    // Salidas
    puedeVerSalidas: tienePermiso(rol, 'ver_salidas'),
    puedeCrearSalidas: tienePermiso(rol, 'crear_salidas'),
    puedeEditarSalidas: tienePermiso(rol, 'editar_salidas'),
    puedeEliminarSalidas: tienePermiso(rol, 'eliminar_salidas'),
    
    // Marcas
    puedeVerMarcas: tienePermiso(rol, 'ver_marcas'),
    puedeGestionarMarcas: tienePermiso(rol, 'gestionar_marcas'),
    
    // Proveedores
    puedeVerProveedores: tienePermiso(rol, 'ver_proveedores'),
    puedeGestionarProveedores: tienePermiso(rol, 'gestionar_proveedores'),
    
    // Otros
    puedeExportar: tienePermiso(rol, 'exportar'),
    puedeVerConfiguracion: tienePermiso(rol, 'ver_configuracion'),
    
    // Funciones
    tienePermiso: (permiso: Permiso) => tienePermiso(rol, permiso),
    tieneAccesoRuta: (ruta: string) => tieneAccesoRuta(rol, ruta),
  };
}
