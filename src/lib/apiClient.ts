// Cliente API para el sistema de gestión de repuestos Mazda
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || 'https://apimazda.onrender.com/api';

class ApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
    this.token = localStorage.getItem('auth_token');
    console.log('API Client initialized with baseUrl:', this.baseUrl);
  }

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('auth_token', token);
    } else {
      localStorage.removeItem('auth_token');
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options.headers as Record<string, string>,
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const url = `${this.baseUrl}${endpoint}`;
    console.log('API Request:', options.method || 'GET', url);

    const response = await fetch(url, {
      ...options,
      headers,
    });

    console.log('API Response:', response.status, response.statusText);

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Error desconocido' }));
      console.error('API Error:', error);
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    const data = await response.json();
    console.log('API Data:', data);
    return data;
  }

  // ============================================
  // AUTENTICACIÓN
  // ============================================
  async login(username: string, password: string) {
    try {
      // Try to login with username (could be email or nombre)
      const response: any = await this.request<any>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ 
          email: username,  // Backend might expect 'email' field
          nombre: username, // Or 'nombre' field
          username: username, // Or 'username' field
          password 
        }),
      });

      // Handle the response structure: {ok: true, data: {user: {...}, message: "..."}}
      if (!response.ok) {
        throw new Error(response.message || 'Error en la autenticación');
      }

      const userData = response.data?.user || response.user;
      
      if (!userData) {
        throw new Error('Respuesta de autenticación inválida');
      }

      // Generate a token (or use one from backend if provided)
      const token = response.data?.token || response.token || btoa(`${username}:${Date.now()}`);
      this.setToken(token);

      return { 
        token, 
        user: {
          id_usuario: userData.id_usuario,
          nombre: userData.nombre,
          email: userData.email,
          rol: userData.rol,
          fecha_creacion: userData.fecha_creacion
        }
      };
    } catch (error: any) {
      console.error('Login error:', error);
      // Provide user-friendly error messages
      if (error.message.includes('Credenciales')) {
        throw new Error('Email o contraseña incorrectos');
      }
      throw error;
    }
  }

  async logout() {
    this.setToken(null);
  }

  async getCurrentUser() {
    // Since we don't have a real auth endpoint, return null
    return null;
  }

  // ============================================
  // REPUESTOS
  // ============================================
  async getRepuestos(params?: { search?: string; limit?: number; offset?: number }) {
    const query = new URLSearchParams(params as any).toString();
    return this.request<any[]>(`/repuestos${query ? `?${query}` : ''}`);
  }

  async getRepuesto(cb: string) {
    return this.request<any>(`/repuestos/${cb}`);
  }

  async getMaxCI() {
    // Intentar obtener el máximo CI desde un endpoint optimizado
    try {
      return this.request<any>('/repuestos/max-ci');
    } catch (error) {
      // Fallback: obtener todos y calcular en el cliente
      console.warn('Endpoint /repuestos/max-ci no disponible, usando fallback');
      const response = await this.request<any>('/repuestos?limit=50000');
      let data = response;
      if (response && typeof response === 'object' && 'data' in response) {
        data = (response as any).data;
      }
      if (!Array.isArray(data)) return { maxCI: 100000 };
      
      const ciValues = data
        .map((p: any) => parseInt(String(p.ci || p.CI)))
        .filter((ci: number) => !isNaN(ci) && ci > 0);
      
      const maxCI = ciValues.length > 0 ? Math.max(...ciValues) : 100000;
      return { maxCI };
    }
  }

  async getMaxCB() {
    // Intentar obtener el máximo CB desde un endpoint optimizado
    try {
      return this.request<any>('/repuestos/max-cb');
    } catch (error) {
      // Fallback: obtener todos y calcular en el cliente
      console.warn('Endpoint /repuestos/max-cb no disponible, usando fallback');
      const response = await this.request<any>('/repuestos?limit=50000');
      let data = response;
      if (response && typeof response === 'object' && 'data' in response) {
        data = (response as any).data;
      }
      if (!Array.isArray(data)) return { maxCB: 1000000 };
      
      const cbValues = data
        .map((p: any) => parseInt(String(p.cb || p.CB)))
        .filter((cb: number) => !isNaN(cb) && cb > 0);
      
      const maxCB = cbValues.length > 0 ? Math.max(...cbValues) : 1000000;
      return { maxCB };
    }
  }

  async getMaxCodes() {
    // Obtener ambos máximos en una sola llamada (más eficiente)
    try {
      const result = await this.request<any>('/repuestos/max-codes');
      return result;
    } catch (error) {
      // Fallback: obtener todos y calcular en el cliente
      console.warn('⚠️ Endpoint /repuestos/max-codes no disponible, usando fallback (cargando todos los productos)');
      console.warn('   Error:', error instanceof Error ? error.message : String(error));
      
      try {
        const response = await this.request<any>('/repuestos?limit=50000');
        let data = response;
        if (response && typeof response === 'object' && 'data' in response) {
          data = (response as any).data;
        }
        if (!Array.isArray(data)) {
          console.warn('⚠️ Respuesta no es un array, usando valores por defecto');
          return { maxCI: 100000, maxCB: 1000000 };
        }
        
        console.log(`✅ Fallback: Cargados ${data.length} productos para calcular máximos`);
        
        const ciValues = data
          .map((p: any) => parseInt(String(p.ci || p.CI)))
          .filter((ci: number) => !isNaN(ci) && ci > 0);
        
        const cbValues = data
          .map((p: any) => parseInt(String(p.cb || p.CB)))
          .filter((cb: number) => !isNaN(cb) && cb > 0);
        
        const maxCI = ciValues.length > 0 ? Math.max(...ciValues) : 100000;
        const maxCB = cbValues.length > 0 ? Math.max(...cbValues) : 1000000;
        
        console.log(`✅ Fallback: Calculados maxCI=${maxCI}, maxCB=${maxCB}`);
        
        return { maxCI, maxCB };
      } catch (fallbackError) {
        console.error('❌ Error en fallback:', fallbackError);
        // Si todo falla, devolver valores por defecto
        return { maxCI: 100000, maxCB: 1000000 };
      }
    }
  }

  async createRepuesto(data: any) {
    return this.request<any>('/repuestos', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateRepuesto(cb: string, data: any) {
    return this.request<any>(`/repuestos/${cb}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteRepuesto(cb: string) {
    return this.request<any>(`/repuestos/${cb}`, {
      method: 'DELETE',
    });
  }

  // ============================================
  // USUARIOS
  // ============================================
  async getUsuarios() {
    return this.request<any[]>('/usuarios');
  }

  async getUsuario(id: number) {
    return this.request<any>(`/usuarios/${id}`);
  }

  async createUsuario(data: any) {
    return this.request<any>('/usuarios', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateUsuario(id: number, data: any) {
    return this.request<any>(`/usuarios/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteUsuario(id: number) {
    return this.request<any>(`/usuarios/${id}`, {
      method: 'DELETE',
    });
  }

  async updatePassword(id: number, password: string) {
    return this.request<any>(`/usuarios/${id}/password`, {
      method: 'PUT',
      body: JSON.stringify({ password }),
    });
  }

  // ============================================
  // ENTRADAS
  // ============================================
  async getEntradas(params?: { fecha_inicio?: string; fecha_fin?: string }) {
    const query = new URLSearchParams(params as any).toString();
    return this.request<any[]>(`/entradas${query ? `?${query}` : ''}`);
  }

  async getEntrada(id: number) {
    return this.request<any>(`/entradas/${id}`);
  }

  async createEntrada(data: any) {
    console.log('createEntrada - Datos a enviar:', data);
    console.log('createEntrada - JSON stringified:', JSON.stringify(data));
    return this.request<any>('/entradas', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateEntrada(id: number, data: any) {
    return this.request<any>(`/entradas/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteEntrada(id: number) {
    return this.request<any>(`/entradas/${id}`, {
      method: 'DELETE',
    });
  }

  // ============================================
  // SALIDAS
  // ============================================
  async getSalidas(params?: { fecha_inicio?: string; fecha_fin?: string }) {
    const query = new URLSearchParams(params as any).toString();
    return this.request<any[]>(`/salidas${query ? `?${query}` : ''}`);
  }

  async getSalida(n_factura: number) {
    return this.request<any>(`/salidas/${n_factura}`);
  }

  async createSalida(data: any) {
    return this.request<any>('/salidas', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateSalida(n_factura: number, data: any) {
    return this.request<any>(`/salidas/${n_factura}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteSalida(n_factura: number) {
    return this.request<any>(`/salidas/${n_factura}`, {
      method: 'DELETE',
    });
  }

  // ============================================
  // PROVEEDORES
  // ============================================
  async getProveedores() {
    return this.request<any[]>('/proveedores');
  }

  async getProveedor(id: number) {
    return this.request<any>(`/proveedores/${id}`);
  }

  async createProveedor(data: any) {
    return this.request<any>('/proveedores', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateProveedor(id: number, data: any) {
    return this.request<any>(`/proveedores/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteProveedor(id: number) {
    return this.request<any>(`/proveedores/${id}`, {
      method: 'DELETE',
    });
  }

  async activarProveedor(id: number) {
    return this.request<any>(`/proveedores/${id}/activar`, {
      method: 'PATCH',
    });
  }

  // ============================================
  // PRODUCTO-PROVEEDOR
  // ============================================
  async getProductoProveedores() {
    return this.request<any[]>('/producto-proveedor');
  }

  async getProveedoresByProducto(producto_cb: string) {
    return this.request<any[]>(`/producto-proveedor/producto/${producto_cb}`);
  }

  async getProductosByProveedor(proveedor_id: number) {
    return this.request<any[]>(`/producto-proveedor/proveedor/${proveedor_id}`);
  }

  async getProveedorMasBarato(producto_cb: string) {
    return this.request<any>(`/producto-proveedor/producto/${producto_cb}/mas-barato`);
  }

  async getComparativaProveedores(producto_cb: string) {
    return this.request<any[]>(`/producto-proveedor/producto/${producto_cb}/comparativa`);
  }

  async createProductoProveedor(data: any) {
    console.log('createProductoProveedor - Datos a enviar:', data);
    console.log('createProductoProveedor - JSON stringified:', JSON.stringify(data));
    return this.request<any>('/producto-proveedor', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async setProveedorPrincipal(data: { producto_cb: string; proveedor_id: number }) {
    return this.request<any>('/producto-proveedor/principal', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateProductoProveedor(id: number, data: any) {
    return this.request<any>(`/producto-proveedor/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteProductoProveedor(id: number) {
    return this.request<any>(`/producto-proveedor/${id}`, {
      method: 'DELETE',
    });
  }

  // ============================================
  // HISTORIAL DE PRECIOS
  // ============================================
  async getHistorialPrecios(params?: { 
    producto_cb?: string; 
    proveedor_id?: number;
    fecha_desde?: string;
    fecha_hasta?: string;
    limit?: number;
  }) {
    const query = new URLSearchParams(params as any).toString();
    return this.request<any[]>(`/historial-precios${query ? `?${query}` : ''}`);
  }

  async getHistorialPreciosByProducto(producto_cb: string, limit?: number) {
    const query = limit ? `?limit=${limit}` : '';
    return this.request<any[]>(`/historial-precios/producto/${producto_cb}${query}`);
  }

  async getHistorialPreciosByProveedor(proveedor_id: number, limit?: number) {
    const query = limit ? `?limit=${limit}` : '';
    return this.request<any[]>(`/historial-precios/proveedor/${proveedor_id}${query}`);
  }

  async getHistorialPreciosProductoProveedor(producto_cb: string, proveedor_id: number) {
    return this.request<any[]>(`/historial-precios/producto/${producto_cb}/proveedor/${proveedor_id}`);
  }

  async getEstadisticasPrecios(producto_cb: string, proveedor_id: number) {
    return this.request<any>(`/historial-precios/estadisticas/${producto_cb}/${proveedor_id}`);
  }

  async compararProveedores(producto_cb: string, params?: {
    fecha_desde?: string;
    fecha_hasta?: string;
  }) {
    const query = new URLSearchParams(params as any).toString();
    return this.request<any[]>(`/historial-precios/comparar/${producto_cb}${query ? `?${query}` : ''}`);
  }

  async updateHistorialPrecio(id: number, data: any) {
    return this.request<any>(`/historial-precios/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteHistorialPrecio(id: number) {
    return this.request<any>(`/historial-precios/${id}`, {
      method: 'DELETE',
    });
  }

  // =====================================================
  // MÉTODOS DE CAJA
  // =====================================================

  // Cajas - Gestión de aperturas y cierres
  async getCajas() {
    return this.request<any>(`/caja/cajas`);
  }

  async abrirCaja(data: any) {
    return this.request<any>(`/caja/cajas`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getCajaById(id: number) {
    return this.request<any>(`/caja/cajas/${id}`);
  }

  async updateCaja(id: number, data: any) {
    return this.request<any>(`/caja/cajas/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async verificarCajaAbierta(usuario_id: number) {
    return this.request<any>(`/caja/cajas/usuario/${usuario_id}/abierta`);
  }

  async getTotalesCaja(id: number) {
    return this.request<any>(`/caja/cajas/${id}/totales`);
  }

  async cerrarCaja(id: number, data: any) {
    return this.request<any>(`/caja/cajas/${id}/cerrar`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // =====================================================
  // VENTAS - Registro de ventas en caja
  // =====================================================
  
  // Endpoints /api/caja/ventas
  async getVentas(caja_id?: number) {
    const query = caja_id ? `?caja_id=${caja_id}` : '';
    return this.request<any>(`/caja/ventas${query}`);
  }

  async crearVenta(data: any) {
    return this.request<any>(`/caja/ventas`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getVentaById(id: number) {
    return this.request<any>(`/caja/ventas/${id}`);
  }

  async updateVenta(id: number, data: any) {
    return this.request<any>(`/caja/ventas/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteVenta(id: number) {
    return this.request<any>(`/caja/ventas/${id}`, {
      method: 'DELETE',
    });
  }

  // Endpoints /api/ventas (alternativos)
  async getAllVentas() {
    return this.request<any>(`/ventas`);
  }

  async crearVentaGeneral(data: any) {
    return this.request<any>(`/ventas`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getVentaGeneralById(id: number) {
    return this.request<any>(`/ventas/${id}`);
  }

  async updateVentaGeneral(id: number, data: any) {
    return this.request<any>(`/ventas/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteVentaGeneral(id: number) {
    return this.request<any>(`/ventas/${id}`, {
      method: 'DELETE',
    });
  }

  // Reportes de Ventas
  async getReporteVentasPorPeriodo(params?: { fecha_inicio?: string; fecha_fin?: string }) {
    const query = new URLSearchParams(params as any).toString();
    return this.request<any>(`/ventas/reportes/periodo${query ? `?${query}` : ''}`);
  }

  async getReporteVentasPorMetodoPago(params?: { fecha_inicio?: string; fecha_fin?: string }) {
    const query = new URLSearchParams(params as any).toString();
    return this.request<any>(`/ventas/reportes/metodo-pago${query ? `?${query}` : ''}`);
  }

  // =====================================================
  // GASTOS - Registro de gastos en caja
  // =====================================================
  
  // Endpoints /api/caja/gastos
  async getGastos(caja_id?: number) {
    const query = caja_id ? `?caja_id=${caja_id}` : '';
    return this.request<any>(`/caja/gastos${query}`);
  }

  async crearGasto(data: any) {
    return this.request<any>(`/caja/gastos`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getGastoById(id: number) {
    return this.request<any>(`/caja/gastos/${id}`);
  }

  async updateGasto(id: number, data: any) {
    return this.request<any>(`/caja/gastos/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteGasto(id: number) {
    return this.request<any>(`/caja/gastos/${id}`, {
      method: 'DELETE',
    });
  }

  // Endpoints /api/gastos (alternativos)
  async getAllGastos() {
    return this.request<any>(`/gastos`);
  }

  async crearGastoGeneral(data: any) {
    return this.request<any>(`/gastos`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getGastoGeneralById(id: number) {
    return this.request<any>(`/gastos/${id}`);
  }

  async updateGastoGeneral(id: number, data: any) {
    return this.request<any>(`/gastos/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteGastoGeneral(id: number) {
    return this.request<any>(`/gastos/${id}`, {
      method: 'DELETE',
    });
  }

  // Reportes de Gastos
  async getReporteGastosPorCategoria(params?: { fecha_inicio?: string; fecha_fin?: string }) {
    const query = new URLSearchParams(params as any).toString();
    return this.request<any>(`/gastos/reportes/categoria${query ? `?${query}` : ''}`);
  }

  async getReporteGastosPorMetodoPago(params?: { fecha_inicio?: string; fecha_fin?: string }) {
    const query = new URLSearchParams(params as any).toString();
    return this.request<any>(`/gastos/reportes/metodo-pago${query ? `?${query}` : ''}`);
  }

  // =====================================================
  // CATEGORÍAS - Categorías y subcategorías de gastos
  // =====================================================
  
  // Endpoints /api/caja/categorias
  async getCategoriasGastos() {
    return this.request<any>(`/caja/categorias`);
  }

  async getSubcategoriasPorCategoria(categoria_id: number) {
    return this.request<any>(`/caja/categorias/${categoria_id}/subcategorias`);
  }

  // Endpoints /api/categorias (alternativos)
  async getAllCategorias() {
    return this.request<any>(`/categorias`);
  }

  async crearCategoria(data: any) {
    return this.request<any>(`/categorias`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getCategoriaById(id: number) {
    return this.request<any>(`/categorias/${id}`);
  }

  async updateCategoria(id: number, data: any) {
    return this.request<any>(`/categorias/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteCategoria(id: number) {
    return this.request<any>(`/categorias/${id}`, {
      method: 'DELETE',
    });
  }

  async getSubcategoriasByCategoriaId(categoria_id: number) {
    return this.request<any>(`/categorias/${categoria_id}/subcategorias`);
  }

  async getSubcategoriaById(id: number) {
    return this.request<any>(`/categorias/subcategorias/${id}`);
  }

  async updateSubcategoria(id: number, data: any) {
    return this.request<any>(`/categorias/subcategorias/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteSubcategoria(id: number) {
    return this.request<any>(`/categorias/subcategorias/${id}`, {
      method: 'DELETE',
    });
  }

  async crearSubcategoria(data: any) {
    return this.request<any>(`/categorias/subcategorias`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // =====================================================
  // REPORTES CAJA - Reportes y estadísticas de caja
  // =====================================================
  
  async getReporteDiarioCaja(params?: { fecha?: string }) {
    const query = new URLSearchParams(params as any).toString();
    return this.request<any>(`/caja/reportes/diario${query ? `?${query}` : ''}`);
  }

  async getReporteMensualCaja(params?: { mes?: number; anio?: number }) {
    const query = new URLSearchParams(params as any).toString();
    return this.request<any>(`/caja/reportes/mensual${query ? `?${query}` : ''}`);
  }

  async getResumenVentasPorMetodo(caja_id: number) {
    return this.request<any>(`/caja/reportes/cajas/${caja_id}/ventas-metodo`);
  }

  async getResumenGastosPorCategoria(caja_id: number) {
    return this.request<any>(`/caja/reportes/cajas/${caja_id}/gastos-categoria`);
  }

  // =====================================================
  // CAJA FUERTE - Gestión de caja fuerte
  // =====================================================
  
  // Endpoints /api/caja/caja-fuerte
  async getSaldoCajaFuerte() {
    return this.request<any>(`/caja/caja-fuerte/saldo`);
  }

  async getMovimientosCajaFuerte() {
    return this.request<any>(`/caja/caja-fuerte/movimientos`);
  }

  async registrarMovimientoCajaFuerte(data: {
    tipo_movimiento: 'DEPOSITO' | 'RETIRO';
    monto: number;
    descripcion: string;
    usuario_registro: number;
    caja_id?: number;
    observaciones?: string;
  }) {
    return this.request<any>(`/caja/caja-fuerte/movimientos`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getMovimientoCajaFuerteById(id: number) {
    return this.request<any>(`/caja/caja-fuerte/movimientos/${id}`);
  }

  async actualizarMovimientoCajaFuerte(id: number, data: any) {
    return this.request<any>(`/caja/caja-fuerte/movimientos/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async eliminarMovimientoCajaFuerte(id: number) {
    return this.request<any>(`/caja/caja-fuerte/movimientos/${id}`, {
      method: 'DELETE',
    });
  }

  async getHistorialCajaFuerte() {
    return this.request<any>(`/caja/caja-fuerte/historial`);
  }

  // Endpoints /api/caja-fuerte (alternativos)
  async getSaldoCajaFuerteGeneral() {
    return this.request<any>(`/caja-fuerte/saldo`);
  }

  async getMovimientosCajaFuerteGeneral() {
    return this.request<any>(`/caja-fuerte/movimientos`);
  }

  async registrarMovimientoCajaFuerteGeneral(data: {
    tipo_movimiento: 'DEPOSITO' | 'RETIRO';
    monto: number;
    descripcion: string;
    usuario_registro: number;
    caja_id?: number;
    observaciones?: string;
  }) {
    return this.request<any>(`/caja-fuerte/movimientos`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getMovimientoCajaFuerteGeneralById(id: number) {
    return this.request<any>(`/caja-fuerte/movimientos/${id}`);
  }

  async actualizarMovimientoCajaFuerteGeneral(id: number, data: any) {
    return this.request<any>(`/caja-fuerte/movimientos/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async eliminarMovimientoCajaFuerteGeneral(id: number) {
    return this.request<any>(`/caja-fuerte/movimientos/${id}`, {
      method: 'DELETE',
    });
  }

  async getHistorialCajaFuerteGeneral() {
    return this.request<any>(`/caja-fuerte/historial`);
  }

  async getFlujoDiarioCajaFuerte(params?: { fecha?: string }) {
    const query = new URLSearchParams(params as any).toString();
    return this.request<any>(`/caja-fuerte/flujo-diario${query ? `?${query}` : ''}`);
  }

  // =====================================================
  // REPORTES GENERALES
  // =====================================================
  
  async getReporteDiario(params?: { fecha?: string }) {
    const query = new URLSearchParams(params as any).toString();
    return this.request<any>(`/reportes/diario${query ? `?${query}` : ''}`);
  }

  async getVistaReporteDiario(params?: { fecha?: string }) {
    const query = new URLSearchParams(params as any).toString();
    return this.request<any>(`/reportes/vista-diario${query ? `?${query}` : ''}`);
  }

  async getAllReportes() {
    return this.request<any>(`/reportes`);
  }

  async getReporteById(id: number) {
    return this.request<any>(`/reportes/${id}`);
  }

  async deleteReporte(id: number) {
    return this.request<any>(`/reportes/${id}`, {
      method: 'DELETE',
    });
  }

  async getReportePorFecha(fecha: string) {
    return this.request<any>(`/reportes/fecha/${fecha}`);
  }

  async actualizarReporte(data?: { fecha?: string }) {
    return this.request<any>(`/reportes/actualizar`, {
      method: 'POST',
      body: JSON.stringify(data || {}),
    });
  }
}

export const apiClient = new ApiClient();
export default apiClient;