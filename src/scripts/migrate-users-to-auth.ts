/**
 * Script para migrar usuarios existentes a Supabase Auth
 * 
 * IMPORTANTE: Este script debe ejecutarse UNA SOLA VEZ
 * 
 * Uso:
 * 1. Actualiza las contraseñas en el array USERS
 * 2. Ejecuta: npx tsx src/scripts/migrate-users-to-auth.ts
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://cqimwqcngyuowvtindcq.supabase.co';
// IMPORTANTE: Reemplaza esto con tu service_role key real
// La encuentras en: Settings → API → service_role key
const supabaseServiceKey = 'TU_SERVICE_ROLE_KEY_AQUI';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

// Lista de usuarios a migrar
const USERS = [
    {
        nombre: 'admin',
        email: 'admin@mazdajapon.com',
        password: 'admin123', // Cambiar por contraseña real
        rol: 'administrador'
    },
    {
        nombre: 'Julian Rosales',
        email: 'julian@mazdajapon.com',
        password: 'julian123', // Cambiar por contraseña real
        rol: 'administrador'
    },
    // Agregar más usuarios aquí
];

async function migrateUsers() {
    console.log('🚀 Iniciando migración de usuarios...\n');

    for (const user of USERS) {
        try {
            console.log(`📝 Migrando usuario: ${user.nombre} (${user.email})`);

            // Crear usuario en Supabase Auth
            const { data: authData, error: authError } = await supabase.auth.admin.createUser({
                email: user.email,
                password: user.password,
                email_confirm: true, // Auto-confirmar email
                user_metadata: {
                    nombre: user.nombre,
                    rol: user.rol
                }
            });

            if (authError) {
                console.error(`   ❌ Error: ${authError.message}`);
                continue;
            }

            console.log(`   ✅ Usuario creado en Auth`);

            // Actualizar tabla usuarios con auth_user_id
            const { error: updateError } = await supabase
                .from('usuarios')
                .update({ auth_user_id: authData.user.id })
                .eq('email', user.email);

            if (updateError) {
                console.error(`   ⚠️  Error al vincular: ${updateError.message}`);
            } else {
                console.log(`   ✅ Usuario vinculado correctamente\n`);
            }

        } catch (error) {
            console.error(`   ❌ Error inesperado:`, error);
        }
    }

    console.log('✨ Migración completada!');
}

// Ejecutar migración
migrateUsers().catch(console.error);
