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
}

export const apiClient = new ApiClient();
export default apiClient;
