import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Usuario = {
  id: number;
  nombre: string;
  email: string;
  rol: 'administrador' | 'usuario';
  auth_user_id: string | null;
  created_at: string;
  updated_at: string;
};

export type Repuesto = {
  cb: string;
  ci: string | null;
  producto: string;
  tipo: string | null;
  modelo_especificacion: string | null;
  referencia: string | null;
  marca: string | null;
  existencias_iniciales: number;
  stock: number;
  precio: number;
  descripcion_larga: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};
