-- ============================================
-- ESQUEMA POSTGRESQL - SISTEMA DE INVENTARIO
-- ============================================

-- Eliminar tablas existentes (en orden inverso por dependencias)
DROP TABLE IF EXISTS devoluciones CASCADE;
DROP TABLE IF EXISTS salidas CASCADE;
DROP TABLE IF EXISTS entradas CASCADE;
DROP TABLE IF EXISTS repuestos CASCADE;
DROP TABLE IF EXISTS proveedores CASCADE;
DROP TABLE IF EXISTS marcas CASCADE;
DROP TABLE IF EXISTS usuarios CASCADE;

-- ============================================
-- TABLA: usuarios
-- ============================================
CREATE TABLE usuarios (
    id_usuario SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    rol VARCHAR(20) NOT NULL DEFAULT 'usuario' CHECK (rol IN ('administrador', 'usuario')),
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    activo BOOLEAN DEFAULT TRUE
);

-- Índices para usuarios
CREATE INDEX idx_usuarios_email ON usuarios(email);
CREATE INDEX idx_usuarios_rol ON usuarios(rol);

-- ============================================
-- TABLA: marcas
-- ============================================
CREATE TABLE marcas (
    id_marca SERIAL PRIMARY KEY,
    nombre VARCHAR(100) UNIQUE NOT NULL,
    descripcion TEXT,
    pais_origen VARCHAR(100),
    sitio_web VARCHAR(255),
    contacto VARCHAR(150),
    telefono VARCHAR(50),
    email VARCHAR(150),
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    usuario_creacion INTEGER REFERENCES usuarios(id_usuario) ON DELETE SET NULL,
    activo BOOLEAN DEFAULT TRUE
);

-- Índices para marcas
CREATE INDEX idx_marcas_nombre ON marcas(nombre);
CREATE INDEX idx_marcas_activo ON marcas(activo);

-- ============================================
-- TABLA: proveedores
-- ============================================
CREATE TABLE proveedores (
    id_proveedor SERIAL PRIMARY KEY,
    nombre VARCHAR(150) UNIQUE NOT NULL,
    razon_social VARCHAR(255),
    nit VARCHAR(50),
    direccion TEXT,
    ciudad VARCHAR(100),
    pais VARCHAR(100),
    telefono VARCHAR(50),
    email VARCHAR(150),
    contacto_principal VARCHAR(150),
    telefono_contacto VARCHAR(50),
    email_contacto VARCHAR(150),
    terminos_pago VARCHAR(100),
    dias_credito INTEGER DEFAULT 0,
    observaciones TEXT,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    usuario_creacion INTEGER REFERENCES usuarios(id_usuario) ON DELETE SET NULL,
    activo BOOLEAN DEFAULT TRUE
);

-- Índices para proveedores
CREATE INDEX idx_proveedores_nombre ON proveedores(nombre);
CREATE INDEX idx_proveedores_nit ON proveedores(nit);
CREATE INDEX idx_proveedores_ciudad ON proveedores(ciudad);
CREATE INDEX idx_proveedores_activo ON proveedores(activo);

-- ============================================
-- TABLA: repuestos
-- ============================================
CREATE TABLE repuestos (
    CB VARCHAR(50) PRIMARY KEY,
    CI VARCHAR(50),
    PRODUCTO VARCHAR(255) NOT NULL,
    TIPO VARCHAR(100),
    MODELO_ESPECIFICACION VARCHAR(255),
    REFERENCIA VARCHAR(100),
    id_marca INTEGER REFERENCES marcas(id_marca) ON DELETE SET NULL,
    EXISTENCIAS_INICIALES NUMERIC(10, 2) DEFAULT 0,
    STOCK NUMERIC(10, 2) DEFAULT 0,
    PRECIO NUMERIC(12, 2) DEFAULT 0,
    DESCRIPCION_LARGA TEXT,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    usuario_creacion INTEGER REFERENCES usuarios(id_usuario) ON DELETE SET NULL,
    activo BOOLEAN DEFAULT TRUE
);

-- Índices para repuestos
CREATE INDEX idx_repuestos_ci ON repuestos(CI);
CREATE INDEX idx_repuestos_producto ON repuestos(PRODUCTO);
CREATE INDEX idx_repuestos_tipo ON repuestos(TIPO);
CREATE INDEX idx_repuestos_id_marca ON repuestos(id_marca);
CREATE INDEX idx_repuestos_stock ON repuestos(STOCK);
CREATE INDEX idx_repuestos_referencia ON repuestos(REFERENCIA);

-- ============================================
-- TABLA: entradas
-- ============================================
CREATE TABLE entradas (
    ID SERIAL PRIMARY KEY,
    N_FACTURA VARCHAR(50) NOT NULL,
    id_proveedor INTEGER NOT NULL REFERENCES proveedores(id_proveedor) ON DELETE RESTRICT,
    FECHA DATE NOT NULL,
    CB VARCHAR(50) NOT NULL,
    CI VARCHAR(50),
    DESCRIPCION VARCHAR(255) NOT NULL,
    CANTIDAD NUMERIC(10, 2) NOT NULL,
    COSTO NUMERIC(12, 2) NOT NULL,
    VALOR_VENTA NUMERIC(12, 2),
    SIIGO VARCHAR(10) DEFAULT 'NO' CHECK (SIIGO IN ('SI', 'NO')),
    Columna1 TEXT,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    usuario_registro INTEGER REFERENCES usuarios(id_usuario) ON DELETE SET NULL,
    CONSTRAINT fk_entradas_repuesto FOREIGN KEY (CB) REFERENCES repuestos(CB) ON DELETE RESTRICT
);

-- Índices para entradas
CREATE INDEX idx_entradas_factura ON entradas(N_FACTURA);
CREATE INDEX idx_entradas_id_proveedor ON entradas(id_proveedor);
CREATE INDEX idx_entradas_fecha ON entradas(FECHA);
CREATE INDEX idx_entradas_cb ON entradas(CB);
CREATE INDEX idx_entradas_ci ON entradas(CI);
CREATE INDEX idx_entradas_siigo ON entradas(SIIGO);

-- ============================================
-- TABLA: salidas
-- ============================================
CREATE TABLE salidas (
    n_factura INTEGER PRIMARY KEY,
    fecha DATE NOT NULL,
    cb VARCHAR(50) NOT NULL,
    ci VARCHAR(50),
    descripcion VARCHAR(255) NOT NULL,
    valor NUMERIC(12, 2) NOT NULL,
    cantidad NUMERIC(10, 2) NOT NULL,
    columna1 TEXT,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    usuario_registro INTEGER REFERENCES usuarios(id_usuario) ON DELETE SET NULL,
    CONSTRAINT fk_salidas_repuesto FOREIGN KEY (cb) REFERENCES repuestos(CB) ON DELETE RESTRICT
);

-- Índices para salidas
CREATE INDEX idx_salidas_fecha ON salidas(fecha);
CREATE INDEX idx_salidas_cb ON salidas(cb);
CREATE INDEX idx_salidas_ci ON salidas(ci);
CREATE INDEX idx_salidas_descripcion ON salidas(descripcion);

-- ============================================
-- TABLA: devoluciones
-- ============================================
CREATE TABLE devoluciones (
    id_devolucion SERIAL PRIMARY KEY,
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('cliente', 'proveedor')),
    producto_cb VARCHAR(50) NOT NULL,
    producto_nombre VARCHAR(255),
    cantidad NUMERIC(10, 2) NOT NULL,
    motivo VARCHAR(255) NOT NULL,
    observaciones TEXT,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    usuario_id INTEGER REFERENCES usuarios(id_usuario) ON DELETE SET NULL,
    factura_referencia VARCHAR(50),
    CONSTRAINT fk_devoluciones_repuesto FOREIGN KEY (producto_cb) REFERENCES repuestos(CB) ON DELETE RESTRICT
);

-- Índices para devoluciones
CREATE INDEX idx_devoluciones_tipo ON devoluciones(tipo);
CREATE INDEX idx_devoluciones_producto_cb ON devoluciones(producto_cb);
CREATE INDEX idx_devoluciones_fecha ON devoluciones(fecha);
CREATE INDEX idx_devoluciones_usuario ON devoluciones(usuario_id);
CREATE INDEX idx_devoluciones_factura ON devoluciones(factura_referencia);

-- ============================================
-- FUNCIONES Y TRIGGERS
-- ============================================

-- Función para actualizar fecha_actualizacion automáticamente
CREATE OR REPLACE FUNCTION actualizar_fecha_modificacion()
RETURNS TRIGGER AS $$
BEGIN
    NEW.fecha_actualizacion = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para usuarios
CREATE TRIGGER trigger_usuarios_actualizacion
    BEFORE UPDATE ON usuarios
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_fecha_modificacion();

-- Trigger para repuestos
CREATE TRIGGER trigger_repuestos_actualizacion
    BEFORE UPDATE ON repuestos
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_fecha_modificacion();

-- Trigger para marcas
CREATE TRIGGER trigger_marcas_actualizacion
    BEFORE UPDATE ON marcas
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_fecha_modificacion();

-- Trigger para proveedores
CREATE TRIGGER trigger_proveedores_actualizacion
    BEFORE UPDATE ON proveedores
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_fecha_modificacion();

-- ============================================
-- FUNCIÓN: Actualizar stock automáticamente en entradas
-- ============================================
CREATE OR REPLACE FUNCTION actualizar_stock_entrada()
RETURNS TRIGGER AS $$
BEGIN
    -- Actualizar el stock del repuesto sumando la cantidad de entrada
    UPDATE repuestos
    SET STOCK = STOCK + NEW.CANTIDAD
    WHERE CB = NEW.CB;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_actualizar_stock_entrada
    AFTER INSERT ON entradas
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_stock_entrada();

-- ============================================
-- FUNCIÓN: Actualizar stock automáticamente en salidas
-- ============================================
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

CREATE TRIGGER trigger_actualizar_stock_salida
    AFTER INSERT ON salidas
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_stock_salida();

-- ============================================
-- FUNCIÓN: Actualizar stock automáticamente en devoluciones
-- ============================================
CREATE OR REPLACE FUNCTION actualizar_stock_devolucion()
RETURNS TRIGGER AS $$
BEGIN
    -- Si es devolución de cliente, aumentar stock
    IF NEW.tipo = 'cliente' THEN
        UPDATE repuestos
        SET STOCK = STOCK + NEW.cantidad
        WHERE CB = NEW.producto_cb;
    
    -- Si es devolución a proveedor, disminuir stock
    ELSIF NEW.tipo = 'proveedor' THEN
        -- Verificar que hay suficiente stock
        IF (SELECT STOCK FROM repuestos WHERE CB = NEW.producto_cb) < NEW.cantidad THEN
            RAISE EXCEPTION 'Stock insuficiente para devolver el producto %', NEW.producto_cb;
        END IF;
        
        UPDATE repuestos
        SET STOCK = STOCK - NEW.cantidad
        WHERE CB = NEW.producto_cb;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_actualizar_stock_devolucion
    AFTER INSERT ON devoluciones
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_stock_devolucion();

-- ============================================
-- VISTAS ÚTILES
-- ============================================

-- Vista: Resumen de inventario
CREATE OR REPLACE VIEW vista_resumen_inventario AS
SELECT 
    r.CB,
    r.CI,
    r.PRODUCTO,
    r.TIPO,
    m.nombre AS MARCA,
    r.STOCK,
    r.PRECIO,
    r.STOCK * r.PRECIO AS valor_total_stock,
    COALESCE(SUM(e.CANTIDAD), 0) AS total_entradas,
    COALESCE(SUM(s.cantidad), 0) AS total_salidas,
    r.fecha_creacion,
    r.fecha_actualizacion
FROM repuestos r
LEFT JOIN marcas m ON r.id_marca = m.id_marca
LEFT JOIN entradas e ON r.CB = e.CB
LEFT JOIN salidas s ON r.CB = s.cb
WHERE r.activo = TRUE
GROUP BY r.CB, r.CI, r.PRODUCTO, r.TIPO, m.nombre, r.STOCK, r.PRECIO, r.fecha_creacion, r.fecha_actualizacion;

-- Vista: Productos con stock bajo (menos de 10 unidades)
CREATE OR REPLACE VIEW vista_stock_bajo AS
SELECT 
    r.CB,
    r.CI,
    r.PRODUCTO,
    r.TIPO,
    m.nombre AS MARCA,
    r.STOCK,
    r.PRECIO
FROM repuestos r
LEFT JOIN marcas m ON r.id_marca = m.id_marca
WHERE r.STOCK < 10 AND r.activo = TRUE
ORDER BY r.STOCK ASC;

-- Vista: Movimientos recientes (últimos 30 días)
CREATE OR REPLACE VIEW vista_movimientos_recientes AS
SELECT 
    'ENTRADA' AS tipo_movimiento,
    e.ID AS id_movimiento,
    e.FECHA AS fecha,
    e.CB,
    e.DESCRIPCION,
    e.CANTIDAD,
    e.COSTO AS valor,
    p.nombre AS origen_destino,
    e.N_FACTURA AS factura
FROM entradas e
LEFT JOIN proveedores p ON e.id_proveedor = p.id_proveedor
WHERE e.FECHA >= CURRENT_DATE - INTERVAL '30 days'

UNION ALL

SELECT 
    'SALIDA' AS tipo_movimiento,
    s.n_factura AS id_movimiento,
    s.fecha AS fecha,
    s.cb AS CB,
    s.descripcion AS DESCRIPCION,
    -s.cantidad AS CANTIDAD,
    s.valor AS valor,
    NULL AS origen_destino,
    s.n_factura::TEXT AS factura
FROM salidas s
WHERE s.fecha >= CURRENT_DATE - INTERVAL '30 days'

ORDER BY fecha DESC;

-- Vista: Estadísticas por producto
CREATE OR REPLACE VIEW vista_estadisticas_producto AS
SELECT 
    r.CB,
    r.PRODUCTO,
    r.STOCK,
    COUNT(DISTINCT e.ID) AS num_entradas,
    COALESCE(SUM(e.CANTIDAD), 0) AS total_cantidad_entradas,
    COUNT(DISTINCT s.n_factura) AS num_salidas,
    COALESCE(SUM(s.cantidad), 0) AS total_cantidad_salidas,
    COALESCE(AVG(e.COSTO), 0) AS costo_promedio,
    r.PRECIO AS precio_venta
FROM repuestos r
LEFT JOIN entradas e ON r.CB = e.CB
LEFT JOIN salidas s ON r.CB = s.cb
WHERE r.activo = TRUE
GROUP BY r.CB, r.PRODUCTO, r.STOCK, r.PRECIO;

-- ============================================
-- DATOS DE EJEMPLO (OPCIONAL)
-- ============================================

-- Insertar usuario administrador por defecto
INSERT INTO usuarios (nombre, email, password, rol) VALUES
('Administrador', 'admin@inventario.com', '$2a$10$XQKvvXQKvvXQKvvXQKvvXO', 'administrador'),
('Usuario Demo', 'usuario@inventario.com', '$2a$10$XQKvvXQKvvXQKvvXQKvvXO', 'usuario');

-- Insertar marcas de ejemplo
INSERT INTO marcas (nombre, descripcion, pais_origen, usuario_creacion) VALUES
('GENERICA', 'Marca genérica para productos sin marca específica', 'Colombia', 1),
('MANN', 'Fabricante alemán de filtros de alta calidad', 'Alemania', 1),
('BREMBO', 'Líder mundial en sistemas de frenado', 'Italia', 1),
('NGK', 'Especialista en bujías y sensores automotrices', 'Japón', 1),
('GATES', 'Fabricante de correas y sistemas de transmisión', 'Estados Unidos', 1),
('BOSCH', 'Tecnología automotriz alemana', 'Alemania', 1),
('DENSO', 'Proveedor de tecnología automotriz avanzada', 'Japón', 1);

-- Insertar proveedores de ejemplo
INSERT INTO proveedores (nombre, razon_social, nit, ciudad, pais, telefono, email, terminos_pago, dias_credito, usuario_creacion) VALUES
('Autopartes del Norte', 'Autopartes del Norte S.A.S.', '900123456-1', 'Bogotá', 'Colombia', '601-2345678', 'ventas@autopartesnorte.com', 'Crédito', 30, 1),
('Distribuidora Central', 'Distribuidora Central Ltda.', '800234567-2', 'Medellín', 'Colombia', '604-3456789', 'info@distcentral.com', 'Crédito', 45, 1),
('Importadora Global', 'Importadora Global S.A.', '700345678-3', 'Cali', 'Colombia', '602-4567890', 'compras@impglobal.com', 'Contado', 0, 1),
('Repuestos Express', 'Repuestos Express E.U.', '600456789-4', 'Barranquilla', 'Colombia', '605-5678901', 'pedidos@repuestosexpress.com', 'Crédito', 15, 1);

-- Insertar algunos productos de ejemplo
INSERT INTO repuestos (CB, CI, PRODUCTO, TIPO, id_marca, EXISTENCIAS_INICIALES, STOCK, PRECIO, usuario_creacion) VALUES
('100001', '100001', 'ABRAZADERA', 'SUJECION', 1, 50, 50, 5000, 1),
('100002', '100002', 'FILTRO DE ACEITE', 'FILTROS', 2, 30, 30, 25000, 1),
('100003', '100003', 'PASTILLAS DE FRENO', 'FRENOS', 3, 20, 20, 85000, 1),
('100004', '100004', 'BUJIA', 'ENCENDIDO', 4, 100, 100, 12000, 1),
('100005', '100005', 'CORREA DE DISTRIBUCION', 'MOTOR', 5, 15, 15, 120000, 1);

-- ============================================
-- COMENTARIOS EN LAS TABLAS
-- ============================================

COMMENT ON TABLE usuarios IS 'Tabla de usuarios del sistema con roles de administrador y usuario';
COMMENT ON TABLE marcas IS 'Catálogo de marcas de productos';
COMMENT ON TABLE proveedores IS 'Catálogo de proveedores y sus datos de contacto';
COMMENT ON TABLE repuestos IS 'Catálogo de repuestos y productos del inventario';
COMMENT ON TABLE entradas IS 'Registro de entradas de productos al inventario';
COMMENT ON TABLE salidas IS 'Registro de salidas de productos del inventario';
COMMENT ON TABLE devoluciones IS 'Registro de devoluciones de clientes y a proveedores';

COMMENT ON COLUMN usuarios.rol IS 'Rol del usuario: administrador o usuario';
COMMENT ON COLUMN repuestos.CB IS 'Código de barras - Identificador principal del producto';
COMMENT ON COLUMN repuestos.CI IS 'Código interno del producto';
COMMENT ON COLUMN repuestos.id_marca IS 'Referencia a la marca del producto';
COMMENT ON COLUMN repuestos.STOCK IS 'Cantidad actual en inventario';
COMMENT ON COLUMN entradas.id_proveedor IS 'Referencia al proveedor de la entrada';
COMMENT ON COLUMN entradas.SIIGO IS 'Indica si la entrada fue registrada en SIIGO (SI/NO)';
COMMENT ON COLUMN devoluciones.tipo IS 'Tipo de devolución: cliente (aumenta stock) o proveedor (disminuye stock)';

-- ============================================
-- PERMISOS (OPCIONAL - ajustar según necesidad)
-- ============================================

-- Crear rol para la aplicación
-- CREATE ROLE app_inventario WITH LOGIN PASSWORD 'tu_password_seguro';
-- GRANT CONNECT ON DATABASE tu_base_datos TO app_inventario;
-- GRANT USAGE ON SCHEMA public TO app_inventario;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_inventario;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO app_inventario;

-- ============================================
-- FIN DEL ESQUEMA
-- ============================================
