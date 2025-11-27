// Tipos compartidos para la aplicación

export interface Repuesto {
  CB: string;
  CI?: string | null;
  PRODUCTO: string;
  TIPO?: string | null;
  MODELO_ESPECIFICACION?: string | null;
  REFERENCIA?: string | null;
  MARCA?: string | null;
  EXISTENCIAS_INICIALES?: number;
  STOCK: number;
  PRECIO: number;
  DESCRIPCION_LARGA?: string | null;
  ESTANTE?: string | null;
  NIVEL?: string | null;
  fecha_creacion?: string;
  fecha_actualizacion?: string;
  usuario_creacion?: number;
  activo?: boolean;
}

export interface Usuario {
  id_usuario: number;
  nombre: string;
  email: string;
  password?: string;
  rol: Rol;
  fecha_creacion?: string;
  fecha_actualizacion?: string;
  activo?: boolean;
}

export type Rol = 'administrador' | 'usuario' | 'gestion_inventario' | 'gestion_ingresos' | 'gestion_egresos' | 'vendedor';

export interface Entrada {
  ID?: number;
  N_FACTURA: string;
  PROVEEDOR: string;
  FECHA: string;
  CB: string;
  CI?: string | null;
  DESCRIPCION: string;
  CANTIDAD: number;
  COSTO: number;
  VALOR_VENTA?: number | null;
  SIIGO?: string;
  Columna1?: string | null;
  fecha_creacion?: string;
  usuario_registro?: number;
}

export interface Salida {
  n_factura: number;
  fecha: string | number;
  cb: string | number;
  ci?: string | number | null;
  descripcion: string;
  valor: number;
  cantidad: number;
  columna1?: string | null;
  fecha_creacion?: string;
  usuario_registro?: number;
}

export interface Proveedor {
  id_proveedor: number;
  ci?: string | null;
  cp: string;
  nombre_proveedor: string;
  costo?: number;
  fecha_creacion?: string;
  fecha_actualizacion?: string;
  usuario_creacion?: number;
  activo?: boolean;
}

export interface ProductoProveedor {
  id_producto_proveedor: number;
  producto_cb: string;
  proveedor_id: number;
  precio_proveedor: number;
  es_proveedor_principal?: boolean;
  fecha_ultima_compra?: string | null;
  fecha_creacion?: string;
  fecha_actualizacion?: string;
  activo?: boolean;
  proveedores?: Proveedor;
}
