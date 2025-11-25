-- ============================================
-- MIGRACIÓN: Simplificar tabla proveedores
-- ============================================
-- Este script modifica la tabla proveedores existente
-- para que solo tenga: CI, CP, nombre_proveedor, costo

-- PASO 1: Eliminar columnas innecesarias
ALTER TABLE proveedores
DROP COLUMN IF EXISTS razon_social,
DROP COLUMN IF EXISTS nit,
DROP COLUMN IF EXISTS direccion,
DROP COLUMN IF EXISTS ciudad,
DROP COLUMN IF EXISTS pais,
DROP COLUMN IF EXISTS telefono,
DROP COLUMN IF EXISTS email,
DROP COLUMN IF EXISTS contacto_principal,
DROP COLUMN IF EXISTS telefono_contacto,
DROP COLUMN IF EXISTS email_contacto,
DROP COLUMN IF EXISTS terminos_pago,
DROP COLUMN IF EXISTS dias_credito,
DROP COLUMN IF EXISTS observaciones;

-- PASO 2: Eliminar constraint UNIQUE de la columna nombre
ALTER TABLE proveedores
DROP CONSTRAINT IF EXISTS proveedores_nombre_key;

-- PASO 3: Renombrar columna 'nombre' a 'nombre_proveedor'
ALTER TABLE proveedores
RENAME COLUMN nombre TO nombre_proveedor;

-- PASO 4: Agregar nuevas columnas
ALTER TABLE proveedores
ADD COLUMN IF NOT EXISTS CI VARCHAR(50),
ADD COLUMN IF NOT EXISTS CP VARCHAR(50),
ADD COLUMN IF NOT EXISTS costo NUMERIC(12, 2) DEFAULT 0;

-- PASO 5: Hacer CP único (después de agregar la columna)
ALTER TABLE proveedores
ADD CONSTRAINT proveedores_cp_unique UNIQUE (CP);

-- PASO 6: Hacer CI y CP NOT NULL (después de que tengan datos)
-- NOTA: Comenta estas líneas si necesitas migrar datos primero
-- ALTER TABLE proveedores
-- ALTER COLUMN CI SET NOT NULL,
-- ALTER COLUMN CP SET NOT NULL;

-- PASO 7: Eliminar índices antiguos si existen
DROP INDEX IF EXISTS idx_proveedores_nit;
DROP INDEX IF EXISTS idx_proveedores_ciudad;

-- PASO 8: Crear nuevos índices
CREATE INDEX IF NOT EXISTS idx_proveedores_ci ON proveedores(CI);
CREATE INDEX IF NOT EXISTS idx_proveedores_cp ON proveedores(CP);

-- PASO 9: Actualizar índice de nombre
DROP INDEX IF EXISTS idx_proveedores_nombre;
CREATE INDEX IF NOT EXISTS idx_proveedores_nombre_proveedor ON proveedores(nombre_proveedor);

-- PASO 10: Verificar estructura final
SELECT 
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'proveedores'
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- ============================================
-- RESULTADO ESPERADO:
-- ============================================
-- id_proveedor (SERIAL PRIMARY KEY)
-- CI (VARCHAR(50))
-- CP (VARCHAR(50) UNIQUE)
-- nombre_proveedor (VARCHAR(150))
-- costo (NUMERIC(12, 2))
-- fecha_creacion (TIMESTAMP)
-- fecha_actualizacion (TIMESTAMP)
-- usuario_creacion (INTEGER)
-- activo (BOOLEAN)
