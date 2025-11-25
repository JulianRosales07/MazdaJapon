import bcrypt from 'bcryptjs';

/**
 * Utilidades para manejo de contraseñas con bcrypt
 */

/**
 * Hashear una contraseña
 * @param password - Contraseña en texto plano
 * @returns Hash de la contraseña
 */
export async function hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    return await bcrypt.hash(password, saltRounds);
}

/**
 * Verificar una contraseña contra un hash
 * @param password - Contraseña en texto plano
 * @param hash - Hash almacenado
 * @returns true si la contraseña coincide
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
    return await bcrypt.compare(password, hash);
}

/**
 * Verificar si una cadena es un hash de bcrypt
 * @param str - Cadena a verificar
 * @returns true si es un hash de bcrypt
 */
export function isBcryptHash(str: string): boolean {
    return str.startsWith('$2a$') || str.startsWith('$2b$');
}

/**
 * Generar hashes para contraseñas comunes (para testing)
 */
export async function generateTestHashes() {
    const passwords = {
        'admin123': await hashPassword('admin123'),
        'demo123': await hashPassword('demo123'),
        '123': await hashPassword('123'),
        '1193051330': await hashPassword('1193051330'),
    };
    
    console.log('Hashes generados:');
    console.log(JSON.stringify(passwords, null, 2));
    
    return passwords;
}
