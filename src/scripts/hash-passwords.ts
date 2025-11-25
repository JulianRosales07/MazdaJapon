/**
 * Script para generar hashes de contraseñas
 * Ejecutar: npx tsx src/scripts/hash-passwords.ts
 */

import bcrypt from 'bcryptjs';

const passwords = [
    { usuario: 'Administrador', password: 'admin123' },
    { usuario: 'Usuario Demo', password: 'demo123' },
    { usuario: 'Prueba Egresos', password: '123' },
    { usuario: 'Julian Rosales', password: '1193051330' },
];

async function hashPasswords() {
    console.log('🔐 Generando hashes de contraseñas...\n');
    console.log('Copia y pega estos comandos SQL en Supabase:\n');
    console.log('-- ============================================');
    console.log('-- ACTUALIZAR CONTRASEÑAS CON BCRYPT HASH');
    console.log('-- ============================================\n');

    for (const { usuario, password } of passwords) {
        const hash = await bcrypt.hash(password, 10);
        console.log(`-- ${usuario} (contraseña: ${password})`);
        console.log(`UPDATE usuarios SET password = '${hash}' WHERE nombre = '${usuario}';`);
        console.log('');
    }

    console.log('-- Verificar cambios');
    console.log(`SELECT nombre, LEFT(password, 20) || '...' as password_hash, rol FROM usuarios;`);
    console.log('\n✅ Hashes generados correctamente!');
}

hashPasswords().catch(console.error);
