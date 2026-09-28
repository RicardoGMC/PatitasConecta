-- SistemaMascotas - PatitasConecta Database Schema

-- Extensión para IDs únicos
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabla de Refugios
CREATE TABLE refugios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR(255) NOT NULL,
    ciudad VARCHAR(100) NOT NULL CHECK (ciudad IN ('La Paz', 'El Alto')),
    direccion TEXT,
    capacidad_maxima INTEGER NOT NULL,
    contacto_telefono VARCHAR(50),
    fecha_registro TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Usuarios (Adoptantes, Administradores de Refugio)
CREATE TABLE usuarios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rol VARCHAR(50) NOT NULL CHECK (rol IN ('administrador', 'admin_refugio', 'encargado_animales', 'gestor_adopciones', 'adoptante')),
    nombre VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    telefono VARCHAR(50),
    refugio_id UUID REFERENCES refugios(id) ON DELETE SET NULL, -- Solo para admin_refugio
    fecha_registro TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Animales
CREATE TABLE animales (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    refugio_id UUID REFERENCES refugios(id) ON DELETE CASCADE,
    nombre VARCHAR(255) NOT NULL,
    especie VARCHAR(50) NOT NULL CHECK (especie IN ('Perro', 'Gato', 'Otro')),
    raza VARCHAR(100),
    edad_estimada_meses INTEGER,
    tamano VARCHAR(50) CHECK (tamano IN ('Pequeño', 'Mediano', 'Grande')),
    estado VARCHAR(50) NOT NULL CHECK (estado IN ('Disponible', 'En Proceso', 'Adoptado', 'Atención Médica')),
    descripcion TEXT,
    fecha_ingreso TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    foto_url TEXT
);

-- Tabla de Adopciones
CREATE TABLE adopciones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    animal_id UUID REFERENCES animales(id) ON DELETE RESTRICT,
    adoptante_id UUID REFERENCES usuarios(id) ON DELETE RESTRICT,
    estado VARCHAR(50) NOT NULL CHECK (estado IN ('Pendiente', 'Aprobada', 'Rechazada', 'Cancelada')),
    fecha_solicitud TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    fecha_resolucion TIMESTAMP WITH TIME ZONE,
    notas_seguimiento TEXT
);

-- Tabla de Escenarios (Módulo de Simulación)
CREATE TABLE escenarios_simulacion (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre_escenario VARCHAR(255) NOT NULL,
    tipo_intervencion VARCHAR(100) NOT NULL, -- ej. 'Campaña Redes', 'Feria Adopción'
    impacto_estimado_porcentaje NUMERIC(5,2),
    reduccion_tiempo_espera_dias INTEGER,
    fecha_simulacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
