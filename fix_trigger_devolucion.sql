-- Script para actualizar el trigger de salidas y permitir devoluciones
-- Ejecutar este script en Supabase SQL Editor

-- Eliminar el trigger existente
DROP TRIGGER IF EXISTS trigger_actualizar_stock_salida ON salidas;

-- Eliminar la función existente
DROP FUNCTION IF EXISTS actualizar_stock_salida();

-- Crear la función actualizada que maneja cantidades negativas (devoluciones)
CREATE OR REPLACE FUNCTION actualizar_stock_salida()
RETURNS TRIGGER AS $$
BEGIN
    -- Solo verificar stock si la cantidad es positiva (salida normal)
    -- Si es negativa (devolución), no verificar porque estamos sumando al stock
    IF NEW.cantidad > 0 THEN
        IF (SELECT STOCK FROM repuestos WHERE CB = NEW.cb) < NEW.cantidad THEN
            RAISE EXCEPTION 'Stock insuficiente para el producto %', NEW.cb;
        END IF;
    END IF;
    
    -- Actualizar el stock del repuesto restando la cantidad de salida
    -- Si cantidad es negativa, STOCK - (-cantidad) = STOCK + cantidad
    UPDATE repuestos
    SET STOCK = STOCK - NEW.cantidad
    WHERE CB = NEW.cb;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recrear el trigger
CREATE TRIGGER trigger_actualizar_stock_salida
    AFTER INSERT ON salidas
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_stock_salida();

-- Verificar que el trigger se creó correctamente
SELECT 
    trigger_name, 
    event_manipulation, 
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE trigger_name = 'trigger_actualizar_stock_salida';
