import { supabase } from './supabase';
import { Usuario } from './api';

export const authService = {
    /**
     * Iniciar sesión con email/nombre y contraseña
     */
    async signIn(emailOrUsername: string, password: string): Promise<{ usuario: Usuario; error: Error | null }> {
        try {
            // Determinar si es email o nombre de usuario
            const isEmail = emailOrUsername.includes('@');
            let email = emailOrUsername;

            // Si es nombre de usuario, buscar el email
            if (!isEmail) {
                const { data: userData, error: userError } = await supabase
                    .from('usuarios')
                    .select('email')
                    .eq('nombre', emailOrUsername)
                    .single();

                if (userError || !userData) {
                    return { usuario: null as any, error: new Error('Usuario no encontrado') };
                }
                email = userData.email;
            }

            // Iniciar sesión con Supabase Auth
            const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (authError) {
                return { usuario: null as any, error: new Error('Credenciales incorrectas') };
            }

            // Obtener datos del usuario de la tabla usuarios
            const { data: usuario, error: usuarioError } = await supabase
                .from('usuarios')
                .select('*')
                .eq('auth_user_id', authData.user.id)
                .single();

            if (usuarioError || !usuario) {
                return { usuario: null as any, error: new Error('Error al obtener datos del usuario') };
            }

            return { usuario, error: null };
        } catch (error) {
            return { usuario: null as any, error: error as Error };
        }
    },

    /**
     * Registrar nuevo usuario
     */
    async signUp(data: {
        nombre: string;
        email: string;
        password: string;
        rol?: 'administrador' | 'usuario';
    }): Promise<{ usuario: Usuario | null; error: Error | null }> {
        try {
            // Crear usuario en Supabase Auth
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: data.email,
                password: data.password,
                options: {
                    data: {
                        nombre: data.nombre,
                        rol: data.rol || 'usuario',
                    },
                },
            });

            if (authError) {
                return { usuario: null, error: authError };
            }

            // El trigger handle_new_user creará automáticamente el registro en usuarios
            // Esperar un momento para que se ejecute el trigger
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Obtener el usuario creado
            const { data: usuario, error: usuarioError } = await supabase
                .from('usuarios')
                .select('*')
                .eq('auth_user_id', authData.user?.id)
                .single();

            if (usuarioError) {
                return { usuario: null, error: usuarioError };
            }

            return { usuario, error: null };
        } catch (error) {
            return { usuario: null, error: error as Error };
        }
    },

    /**
     * Cerrar sesión
     */
    async signOut(): Promise<void> {
        await supabase.auth.signOut();
    },

    /**
     * Obtener sesión actual
     */
    async getSession() {
        const { data: { session } } = await supabase.auth.getSession();
        return session;
    },

    /**
     * Obtener usuario actual
     */
    async getCurrentUser(): Promise<Usuario | null> {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) return null;

        const { data: usuario } = await supabase
            .from('usuarios')
            .select('*')
            .eq('auth_user_id', user.id)
            .single();

        return usuario;
    },

    /**
     * Cambiar contraseña
     */
    async updatePassword(newPassword: string): Promise<{ error: Error | null }> {
        const { error } = await supabase.auth.updateUser({
            password: newPassword,
        });

        return { error };
    },

    /**
     * Recuperar contraseña (envía email)
     */
    async resetPassword(email: string): Promise<{ error: Error | null }> {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/reset-password`,
        });

        return { error };
    },
};
