// Tipos compartidos para la aplicación

export type Page = 'dashboard' | 'inventory' | 'entradas' | 'salidas' | 'configuracion' | 'exportar' | 'marcas' | 'proveedores' | 'notificaciones' | 'perfil' | 'comparativa' | 'caja' | 'reportes' | 'categorias' | 'caja-fuerte';

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

export type Rol = 'administrador' | 'gestion_ingresos' | 'gestion_egresos' | 'gestion_inventario';

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
  saldo_a_favor?: number; // Mazda Japón le debe al proveedor
  saldo_en_contra?: number; // El proveedor le debe a Mazda Japón
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

export interface HistorialPrecio {
  id_historial: number;
  producto_cb: string;
  producto_nombre?: string;
  proveedor_id: number;
  proveedor_nombre?: string;
  proveedor_cp?: string;
  precio_anterior: number | null;
  precio_nuevo: number;
  diferencia?: number;
  porcentaje_cambio?: number;
  fecha_cambio: string;
  usuario_modificacion?: string | null;
  motivo_cambio?: string | null;
  activo?: boolean;
}

// Tipos para el sistema de Caja
export interface Caja {
  id_caja: number;
  usuario_id: number;
  usuario_nombre?: string; // Nombre del usuario (viene del JOIN en algunas consultas)
  fecha_apertura: string;
  fecha_cierre?: string | null;
  jornada: 'mañana' | 'tarde';
  monto_inicial: number;
  monto_final?: number | null;
  total_ventas?: number;
  total_gastos?: number;
  diferencia?: number | null;
  notas_apertura?: string | null;
  notas_cierre?: string | null;
  estado: 'abierta' | 'cerrada';
  activo?: boolean;
  fecha_creacion?: string;
  fecha_actualizacion?: string;
}

export interface Venta {
  id_venta: number;
  caja_id: number;
  factura: string;
  factura_descripcion?: string;
  descripcion: string;
  venta_por: 'REDES' | 'ALMACEN';
  valor: number;
  metodo_pago: 'EFECTIVO' | 'TARJETA' | 'BANCOLOMBIA' | 'NEQUI' | 'DAVIPLATA' | 'A LA MANO';
  fecha: string;
  observaciones?: string | null;
  usuario_registro: number;
  activo?: boolean;
  fecha_creacion?: string;
  fecha_actualizacion?: string;
}

export interface Gasto {
  id_gasto: number;
  caja_id: number;
  fecha: string;
  descripcion: string;
  subcategoria_id?: number | null;
  categoria_id: number;
  metodo_pago: 'EFECTIVO' | 'TARJETA' | 'BANCOLOMBIA' | 'NEQUI' | 'DAVIPLATA' | 'A LA MANO';
  valor: number;
  usuario_registro: number;
  activo?: boolean;
  fecha_creacion?: string;
  fecha_actualizacion?: string;
}

export interface CategoriaGasto {
  id_categoria: number;
  nombre: string;
  descripcion?: string | null;
  activo?: boolean;
  fecha_creacion?: string;
}

export interface SubcategoriaGasto {
  id_subcategoria: number;
  categoria_id: number;
  nombre: string;
  descripcion?: string | null;
  activo?: boolean;
  fecha_creacion?: string;
}

export interface TotalesCaja {
  total_ventas: number;
  total_gastos: number;
  diferencia: number;
}

export interface AbrirCajaData {
  usuario_id: number;
  jornada: 'mañana' | 'tarde';
  monto_inicial: number;
  notas_apertura?: string;
}

export interface CerrarCajaData {
  monto_final: number;
  notas_cierre?: string;
}

export interface CrearVentaData {
  caja_id: number;
  factura: string;
  descripcion: string;
  venta_por: 'REDES' | 'ALMACEN';
  valor: number;
  metodo_pago: 'EFECTIVO' | 'TARJETA' | 'BANCOLOMBIA' | 'NEQUI' | 'DAVIPLATA' | 'A LA MANO';
  fecha?: string;
  observaciones?: string;
  usuario_registro: number;
}

export interface CrearGastoData {
  caja_id: number;
  fecha?: string;
  descripcion: string;
  subcategoria_id?: number;
  categoria_id: number;
  metodo_pago: 'EFECTIVO' | 'TARJETA' | 'BANCOLOMBIA' | 'NEQUI' | 'DAVIPLATA' | 'A LA MANO';
  valor: number;
  usuario_registro: number;
}

// Tipos para Caja Fuerte
export interface MovimientoCajaFuerte {
  id_movimiento: number;
  tipo_movimiento: 'DEPOSITO' | 'RETIRO';
  monto: number;
  descripcion: string;
  observaciones?: string | null;
  fecha: string;
  usuario_registro: number;
  usuario_nombre?: string;
  caja_id?: number | null;
  saldo_anterior?: number;
  saldo_nuevo?: number;
  activo?: boolean;
  fecha_creacion?: string;
}

export interface SaldoCajaFuerte {
  saldo: number;
  fecha_actualizacion?: string;
}

export interface HistorialSaldoCajaFuerte {
  fecha: string;
  saldo: number;
}

// Tipos para Reportes
export interface ReporteDiario {
  id_reporte?: number;
  fecha: string;
  total_ventas: number;
  total_gastos: number;
  balance: number;
  cantidad_ventas: number;
  cantidad_gastos: number;
  fecha_creacion?: string;
}

export interface ReporteVentasPorPeriodo {
  fecha_inicio: string;
  fecha_fin: string;
  total_ventas: number;
  cantidad_ventas: number;
  promedio_venta: number;
}

export interface ReporteVentasPorMetodoPago {
  metodo_pago: string;
  total: number;
  cantidad: number;
  porcentaje: number;
}

export interface ReporteGastosPorCategoria {
  categoria: string;
  total: number;
  cantidad: number;
  porcentaje: number;
}

export interface ReporteGastosPorMetodoPago {
  metodo_pago: string;
  total: number;
  cantidad: number;
  porcentaje: number;
}

// Tipos para Categorías
export interface Categoria {
  id_categoria: number;
  nombre: string;
  descripcion?: string | null;
  activo?: boolean;
  fecha_creacion?: string;
  subcategorias?: Subcategoria[];
}

export interface Subcategoria {
  id_subcategoria: number;
  categoria_id: number;
  nombre: string;
  descripcion?: string | null;
  activo?: boolean;
  fecha_creacion?: string;
}
