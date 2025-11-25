import { supabase } from './supabase';

// Tipos
export type Rol = 'administrador' | 'usuario' | 'gestion_ingresos' | 'gestion_egresos' | 'gestion_inventario';

export type Usuario = {
    id_usuario: number;
    nombre: string;
    email: string;
    rol: Rol;
    fecha_creacion?: string;
};

export type Repuesto = {
    CB: string | number;
    CI: string | null;
    PRODUCTO: string;
    TIPO: string | null;
    MODELO_ESPECIFICACION: string | null;
    REFERENCIA: string | null;
    MARCA: string | null;
    EXISTENCIAS_INICIALES: number | string;
    STOCK: number | string;
    PRECIO: number | string;
    DESCRIPCION_LARGA: string | null;
    ESTANTE: string | null;
    NIVEL: string | null;
};

export type Entrada = {
    ID?: number;
    N_FACTURA: string;
    PROVEEDOR: string;
    FECHA: string;
    CB: string;
    CI: string | null;
    DESCRIPCION: string;
    CANTIDAD: string | number;
    COSTO: string | number;
    VALOR_VENTA: string | number | null;
    SIIGO: string | null;
    Columna1: string | null;
};

export type Salida = {
    n_factura: number;
    fecha: number;
    cb: number;
    ci?: number;
    descripcion: string;
    valor: number;
    cantidad: number;
    columna1?: string;
};

// API de Usuarios
export const usuariosAPI = {
    async getAll(): Promise<Usuario[]> {
        const { data, error } = await supabase
            .from('usuarios')
            .select('*')
            .order('id_usuario', { ascending: true })
            .limit(10000); // Límite alto para obtener todos los usuarios

        if (error) throw new Error(error.message);
        return data || [];
    },

    async getById(id_usuario: number): Promise<Usuario> {
        const { data, error } = await supabase
            .from('usuarios')
            .select('*')
            .eq('id_usuario', id_usuario)
            .single();

        if (error) throw new Error(error.message);
        return data;
    },

    async create(userData: {
        nombre: string;
        email: string;
        password: string;
        rol?: Rol;
    }): Promise<Usuario> {
        // Hashear la contraseña antes de guardar
        const bcrypt = await import('bcryptjs');
        const hashedPassword = await bcrypt.hash(userData.password, 10);
        
        const { data, error } = await supabase
            .from('usuarios')
            .insert([{
                nombre: userData.nombre,
                email: userData.email,
                password: hashedPassword,
                rol: userData.rol || 'usuario',
            }])
            .select()
            .single();

        if (error) throw new Error(error.message);
        return data;
    },

    async update(id_usuario: number, userData: Partial<Usuario>): Promise<Usuario> {
        const { data, error } = await supabase
            .from('usuarios')
            .update(userData)
            .eq('id_usuario', id_usuario)
            .select()
            .single();

        if (error) throw new Error(error.message);
        return data;
    },

    async updatePassword(id_usuario: number, password: string): Promise<void> {
        // Hashear la nueva contraseña con bcrypt
        const bcrypt = await import('bcryptjs');
        const hashedPassword = await bcrypt.hash(password, 10);
        
        const { error } = await supabase
            .from('usuarios')
            .update({ password: hashedPassword })
            .eq('id_usuario', id_usuario);

        if (error) throw new Error(error.message);
    },

    async delete(id_usuario: number): Promise<void> {
        const { error } = await supabase
            .from('usuarios')
            .delete()
            .eq('id_usuario', id_usuario);

        if (error) throw new Error(error.message);
    },

    async login(username: string, password: string): Promise<{ usuario: Usuario; token?: string }> {
        const bcrypt = await import('bcryptjs');
        
        const { data, error } = await supabase
            .from('usuarios')
            .select('*, password')
            .eq('nombre', username)
            .single();

        if (error || !data) {
            throw new Error('Usuario no encontrado');
        }

        // Validar contraseña (soporta bcrypt y texto plano)
        let isValidPassword = false;
        
        if (data.password.startsWith('$2a$') || data.password.startsWith('$2b$')) {
            // Contraseña hasheada con bcrypt
            isValidPassword = await bcrypt.compare(password, data.password);
        } else {
            // Contraseña en texto plano (para compatibilidad)
            isValidPassword = data.password === password;
        }

        if (!isValidPassword) {
            throw new Error('Contraseña incorrecta');
        }

        // Remover password del objeto antes de devolverlo
        const { password: _, ...usuario } = data;
        return { usuario: usuario as Usuario };
    },
};

// Helper para convertir nombres de columnas
const mapRepuestoToDb = (repuesto: Partial<Repuesto>) => {
    const mapped: any = {};
    
    if (repuesto.CB !== undefined) mapped.cb = repuesto.CB;
    if (repuesto.CI !== undefined) mapped.ci = repuesto.CI;
    if (repuesto.PRODUCTO !== undefined) mapped.producto = repuesto.PRODUCTO;
    if (repuesto.TIPO !== undefined) mapped.tipo = repuesto.TIPO;
    if (repuesto.MODELO_ESPECIFICACION !== undefined) mapped.modelo_especificacion = repuesto.MODELO_ESPECIFICACION;
    if (repuesto.REFERENCIA !== undefined) mapped.referencia = repuesto.REFERENCIA;
    if (repuesto.MARCA !== undefined) mapped.marca = repuesto.MARCA;
    if (repuesto.EXISTENCIAS_INICIALES !== undefined) mapped.existencias_iniciales = repuesto.EXISTENCIAS_INICIALES;
    if (repuesto.STOCK !== undefined) mapped.stock = repuesto.STOCK;
    if (repuesto.PRECIO !== undefined) mapped.precio = repuesto.PRECIO;
    if (repuesto.DESCRIPCION_LARGA !== undefined) mapped.descripcion_larga = repuesto.DESCRIPCION_LARGA;
    if (repuesto.ESTANTE !== undefined) mapped.estante = repuesto.ESTANTE;
    if (repuesto.NIVEL !== undefined) mapped.nivel = repuesto.NIVEL;
    
    return mapped;
};

const mapDbToRepuesto = (data: any): Repuesto => ({
    CB: data.cb,
    CI: data.ci,
    PRODUCTO: data.producto,
    TIPO: data.tipo,
    MODELO_ESPECIFICACION: data.modelo_especificacion,
    REFERENCIA: data.referencia,
    MARCA: data.marca,
    EXISTENCIAS_INICIALES: data.existencias_iniciales,
    STOCK: data.stock,
    PRECIO: data.precio,
    DESCRIPCION_LARGA: data.descripcion_larga,
    ESTANTE: data.estante,
    NIVEL: data.nivel,
});

// API de Repuestos
export const repuestosAPI = {
    async getAll(): Promise<Repuesto[]> {
        // Obtener todos los registros usando paginación automática
        const pageSize = 1000;
        let allData: any[] = [];
        let page = 0;
        let hasMore = true;

        while (hasMore) {
            const from = page * pageSize;
            const to = from + pageSize - 1;

            const { data, error } = await supabase
                .from('repuestos')
                .select('*')
                .order('cb', { ascending: true })
                .range(from, to);

            if (error) throw new Error(error.message);
            
            if (data && data.length > 0) {
                allData = [...allData, ...data];
                hasMore = data.length === pageSize; // Si recibimos menos de pageSize, ya no hay más
                page++;
            } else {
                hasMore = false;
            }
        }

        return allData.map(mapDbToRepuesto);
    },

    async getByCB(cb: string): Promise<Repuesto> {
        const { data, error } = await supabase
            .from('repuestos')
            .select('*')
            .eq('cb', cb)
            .single();

        if (error) throw new Error(error.message);
        return mapDbToRepuesto(data);
    },

    async create(repuesto: Repuesto): Promise<Repuesto> {
        const dbData = mapRepuestoToDb(repuesto);
        const { data, error } = await supabase
            .from('repuestos')
            .insert([dbData])
            .select()
            .single();

        if (error) throw new Error(error.message);
        return mapDbToRepuesto(data);
    },

    async update(cb: string, repuesto: Partial<Repuesto>): Promise<Repuesto> {
        const dbData = mapRepuestoToDb(repuesto);
        const { data, error } = await supabase
            .from('repuestos')
            .update(dbData)
            .eq('cb', cb)
            .select()
            .single();

        if (error) throw new Error(error.message);
        return mapDbToRepuesto(data);
    },

    async delete(cb: string): Promise<void> {
        const { error } = await supabase
            .from('repuestos')
            .delete()
            .eq('cb', cb);

        if (error) throw new Error(error.message);
    },
};

// Helper para convertir entradas
const mapEntradaToDb = (entrada: Partial<Entrada>) => {
    const mapped: any = {};
    
    if (entrada.ID !== undefined) mapped.id = entrada.ID;
    if (entrada.N_FACTURA !== undefined) mapped.n_factura = entrada.N_FACTURA;
    if (entrada.PROVEEDOR !== undefined) mapped.proveedor = entrada.PROVEEDOR;
    if (entrada.FECHA !== undefined) mapped.fecha = entrada.FECHA;
    if (entrada.CB !== undefined) mapped.cb = entrada.CB;
    if (entrada.CI !== undefined) mapped.ci = entrada.CI;
    if (entrada.DESCRIPCION !== undefined) mapped.descripcion = entrada.DESCRIPCION;
    if (entrada.CANTIDAD !== undefined) mapped.cantidad = entrada.CANTIDAD;
    if (entrada.COSTO !== undefined) mapped.costo = entrada.COSTO;
    if (entrada.VALOR_VENTA !== undefined) mapped.valor_venta = entrada.VALOR_VENTA;
    if (entrada.SIIGO !== undefined) mapped.siigo = entrada.SIIGO;
    if (entrada.Columna1 !== undefined) mapped.columna1 = entrada.Columna1;
    
    return mapped;
};

const mapDbToEntrada = (data: any): Entrada => ({
    ID: data.id,
    N_FACTURA: data.n_factura,
    PROVEEDOR: data.proveedor,
    FECHA: data.fecha,
    CB: data.cb,
    CI: data.ci,
    DESCRIPCION: data.descripcion,
    CANTIDAD: data.cantidad,
    COSTO: data.costo,
    VALOR_VENTA: data.valor_venta,
    SIIGO: data.siigo,
    Columna1: data.columna1,
});

// API de Entradas
export const entradasAPI = {
    async getAll(params?: { proveedor?: string; cb?: string; fecha?: string }): Promise<Entrada[]> {
        // Si hay filtros, usar consulta simple (probablemente menos de 1000 resultados)
        if (params?.proveedor || params?.cb || params?.fecha) {
            let query = supabase
                .from('entradas')
                .select('*')
                .order('id', { ascending: false })
                .limit(10000);

            if (params.proveedor) {
                query = query.ilike('proveedor', `%${params.proveedor}%`);
            }
            if (params.cb) {
                query = query.eq('cb', params.cb);
            }
            if (params.fecha) {
                query = query.eq('fecha', params.fecha);
            }

            const { data, error } = await query;
            if (error) throw new Error(error.message);
            return (data || []).map(mapDbToEntrada);
        }

        // Sin filtros, obtener todos con paginación
        const pageSize = 1000;
        let allData: any[] = [];
        let page = 0;
        let hasMore = true;

        while (hasMore) {
            const from = page * pageSize;
            const to = from + pageSize - 1;

            const { data, error } = await supabase
                .from('entradas')
                .select('*')
                .order('id', { ascending: false })
                .range(from, to);

            if (error) throw new Error(error.message);
            
            if (data && data.length > 0) {
                allData = [...allData, ...data];
                hasMore = data.length === pageSize;
                page++;
            } else {
                hasMore = false;
            }
        }

        return allData.map(mapDbToEntrada);
    },

    async getById(id: number): Promise<Entrada> {
        const { data, error } = await supabase
            .from('entradas')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw new Error(error.message);
        return mapDbToEntrada(data);
    },

    async create(entrada: Omit<Entrada, 'ID'>): Promise<Entrada> {
        const dbData = mapEntradaToDb(entrada);
        delete dbData.id; // No enviar ID en create
        
        const { data, error } = await supabase
            .from('entradas')
            .insert([dbData])
            .select()
            .single();

        if (error) throw new Error(error.message);
        return mapDbToEntrada(data);
    },

    async update(id: number, entrada: Partial<Entrada>): Promise<Entrada> {
        const dbData = mapEntradaToDb(entrada);
        delete dbData.id; // No actualizar ID
        
        const { data, error } = await supabase
            .from('entradas')
            .update(dbData)
            .eq('id', id)
            .select()
            .single();

        if (error) throw new Error(error.message);
        return mapDbToEntrada(data);
    },

    async delete(id: number): Promise<void> {
        const { error } = await supabase
            .from('entradas')
            .delete()
            .eq('id', id);

        if (error) throw new Error(error.message);
    },
};

// Tipos para Marcas y Proveedores
export type Marca = {
    id_marca?: number;
    nombre: string;
    fecha_creacion?: string;
    fecha_actualizacion?: string;
    usuario_creacion?: number;
    activo?: boolean;
};

export type Proveedor = {
    id_proveedor?: number;
    ci?: string | null;
    cp: string;
    nombre_proveedor: string;
    costo?: string | number;
    fecha_creacion?: string;
    fecha_actualizacion?: string;
    usuario_creacion?: number | null;
    activo?: boolean;
};

// API de Marcas
export const marcasAPI = {
    async getAll(): Promise<Marca[]> {
        console.log('Consultando tabla marcas...');
        const { data, error } = await supabase
            .from('marcas')
            .select('*')
            .order('nombre', { ascending: true });

        if (error) {
            console.error('Error en consulta de marcas:', error);
            throw new Error(error.message);
        }
        console.log('Datos recibidos de marcas:', data);
        return data || [];
    },

    async getById(id: number): Promise<Marca> {
        const { data, error } = await supabase
            .from('marcas')
            .select('*')
            .eq('id_marca', id)
            .single();

        if (error) throw new Error(error.message);
        return data;
    },

    async create(marca: { nombre: string }): Promise<Marca> {
        const { data, error } = await supabase
            .from('marcas')
            .insert([{ 
                nombre: marca.nombre,
                activo: true 
            }])
            .select()
            .single();

        if (error) throw new Error(error.message);
        return data;
    },

    async update(id: number, marca: { nombre: string }): Promise<Marca> {
        const { data, error } = await supabase
            .from('marcas')
            .update({ 
                nombre: marca.nombre,
                fecha_actualizacion: new Date().toISOString()
            })
            .eq('id_marca', id)
            .select()
            .single();

        if (error) throw new Error(error.message);
        return data;
    },

    async delete(id: number): Promise<void> {
        // Soft delete - marcar como inactivo
        const { error } = await supabase
            .from('marcas')
            .update({ activo: false })
            .eq('id_marca', id);

        if (error) throw new Error(error.message);
    },
};

// API de Proveedores
export const proveedoresAPI = {
    async getAll(): Promise<Proveedor[]> {
        const { data, error } = await supabase
            .from('proveedores')
            .select('*')
            .order('nombre_proveedor', { ascending: true });

        if (error) throw new Error(error.message);
        return data || [];
    },

    async getById(id: number): Promise<Proveedor> {
        const { data, error } = await supabase
            .from('proveedores')
            .select('*')
            .eq('id_proveedor', id)
            .single();

        if (error) throw new Error(error.message);
        return data;
    },

    async create(proveedor: Omit<Proveedor, 'id_proveedor' | 'fecha_creacion' | 'fecha_actualizacion'>): Promise<Proveedor> {
        const { data, error } = await supabase
            .from('proveedores')
            .insert([proveedor])
            .select()
            .single();

        if (error) throw new Error(error.message);
        return data;
    },

    async update(id: number, proveedor: Partial<Proveedor>): Promise<Proveedor> {
        const { data, error } = await supabase
            .from('proveedores')
            .update(proveedor)
            .eq('id_proveedor', id)
            .select()
            .single();

        if (error) throw new Error(error.message);
        return data;
    },

    async delete(id: number): Promise<void> {
        const { error } = await supabase
            .from('proveedores')
            .delete()
            .eq('id_proveedor', id);

        if (error) throw new Error(error.message);
    },
};

// Tipos para ProductoProveedor
export type ProductoProveedor = {
    id_producto_proveedor?: number;
    producto_cb: string;
    proveedor_id: number;
    precio_proveedor: number;
    es_proveedor_principal?: boolean;
    fecha_ultima_compra?: string | null;
    fecha_creacion?: string;
    fecha_actualizacion?: string;
    activo?: boolean;
};

// API de ProductoProveedor
export const productoProveedorAPI = {
    async getByProducto(producto_cb: string): Promise<ProductoProveedor[]> {
        const { data, error } = await supabase
            .from('producto_proveedor')
            .select(`
                *,
                proveedores (
                    id_proveedor,
                    cp,
                    nombre_proveedor,
                    costo
                )
            `)
            .eq('producto_cb', producto_cb)
            .eq('activo', true)
            .order('precio_proveedor', { ascending: true });

        if (error) throw new Error(error.message);
        return data || [];
    },

    async getByProveedor(proveedor_id: number): Promise<ProductoProveedor[]> {
        const { data, error } = await supabase
            .from('producto_proveedor')
            .select('*')
            .eq('proveedor_id', proveedor_id)
            .eq('activo', true);

        if (error) throw new Error(error.message);
        return data || [];
    },

    async create(productoProveedor: Omit<ProductoProveedor, 'id_producto_proveedor' | 'fecha_creacion' | 'fecha_actualizacion'>): Promise<ProductoProveedor> {
        const { data, error } = await supabase
            .from('producto_proveedor')
            .insert([productoProveedor])
            .select()
            .single();

        if (error) throw new Error(error.message);
        return data;
    },

    async update(id: number, productoProveedor: Partial<ProductoProveedor>): Promise<ProductoProveedor> {
        const { data, error } = await supabase
            .from('producto_proveedor')
            .update(productoProveedor)
            .eq('id_producto_proveedor', id)
            .select()
            .single();

        if (error) throw new Error(error.message);
        return data;
    },

    async upsert(productoProveedor: Omit<ProductoProveedor, 'id_producto_proveedor' | 'fecha_creacion' | 'fecha_actualizacion'>): Promise<ProductoProveedor> {
        const { data, error } = await supabase
            .from('producto_proveedor')
            .upsert(productoProveedor, {
                onConflict: 'producto_cb,proveedor_id'
            })
            .select()
            .single();

        if (error) throw new Error(error.message);
        return data;
    },

    async setProveedorPrincipal(producto_cb: string, proveedor_id: number): Promise<void> {
        // Primero, desmarcar todos los proveedores principales para este producto
        await supabase
            .from('producto_proveedor')
            .update({ es_proveedor_principal: false })
            .eq('producto_cb', producto_cb);

        // Luego, marcar el proveedor seleccionado como principal
        const { error } = await supabase
            .from('producto_proveedor')
            .update({ 
                es_proveedor_principal: true,
                fecha_ultima_compra: new Date().toISOString().split('T')[0]
            })
            .eq('producto_cb', producto_cb)
            .eq('proveedor_id', proveedor_id);

        if (error) throw new Error(error.message);
    },

    async delete(id: number): Promise<void> {
        const { error } = await supabase
            .from('producto_proveedor')
            .update({ activo: false })
            .eq('id_producto_proveedor', id);

        if (error) throw new Error(error.message);
    },

    async deleteHard(id: number): Promise<void> {
        const { error } = await supabase
            .from('producto_proveedor')
            .delete()
            .eq('id_producto_proveedor', id);

        if (error) throw new Error(error.message);
    },
};

// API de Salidas (ya usa nombres en minúsculas, no necesita mapeo)
export const salidasAPI = {
    async getAll(params?: { cb?: number; fecha?: number }): Promise<Salida[]> {
        // Si hay filtros, usar consulta simple
        if (params?.cb || params?.fecha) {
            let query = supabase
                .from('salidas')
                .select('*')
                .order('n_factura', { ascending: false })
                .limit(10000);

            if (params.cb) {
                query = query.eq('cb', params.cb);
            }
            if (params.fecha) {
                query = query.eq('fecha', params.fecha);
            }

            const { data, error } = await query;
            if (error) throw new Error(error.message);
            return data || [];
        }

        // Sin filtros, obtener todos con paginación
        const pageSize = 1000;
        let allData: any[] = [];
        let page = 0;
        let hasMore = true;

        while (hasMore) {
            const from = page * pageSize;
            const to = from + pageSize - 1;

            const { data, error } = await supabase
                .from('salidas')
                .select('*')
                .order('n_factura', { ascending: false })
                .range(from, to);

            if (error) throw new Error(error.message);
            
            if (data && data.length > 0) {
                allData = [...allData, ...data];
                hasMore = data.length === pageSize;
                page++;
            } else {
                hasMore = false;
            }
        }

        return allData;
    },

    async getByFactura(n_factura: number): Promise<Salida> {
        const { data, error } = await supabase
            .from('salidas')
            .select('*')
            .eq('n_factura', n_factura)
            .single();

        if (error) throw new Error(error.message);
        return data;
    },

    async create(salida: Omit<Salida, 'n_factura'> & { n_factura?: number }): Promise<Salida> {
        const { data, error } = await supabase
            .from('salidas')
            .insert([salida])
            .select()
            .single();

        if (error) throw new Error(error.message);
        return data;
    },

    async update(n_factura: number, salida: Partial<Salida>): Promise<Salida> {
        const { data, error } = await supabase
            .from('salidas')
            .update(salida)
            .eq('n_factura', n_factura)
            .select()
            .single();

        if (error) throw new Error(error.message);
        return data;
    },

    async delete(n_factura: number): Promise<void> {
        const { error } = await supabase
            .from('salidas')
            .delete()
            .eq('n_factura', n_factura);

        if (error) throw new Error(error.message);
    },
};
