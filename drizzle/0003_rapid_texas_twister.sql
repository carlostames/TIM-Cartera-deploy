-- Custom SQL migration file, put your code below! --

-- Crear tabla de grupos de clientes
CREATE TABLE IF NOT EXISTS `gruposClientes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`nombre` varchar(255) NOT NULL,
	`descripcion` text,
	`responsable` varchar(100),
	`activo` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `gruposClientes_id` PRIMARY KEY(`id`),
	CONSTRAINT `gruposClientes_nombre_unique` UNIQUE(`nombre`)
);

-- Agregar nuevas columnas a la tabla clientes
ALTER TABLE `clientes` ADD `rfc` varchar(13);
ALTER TABLE `clientes` ADD `grupoId` int;
ALTER TABLE `clientes` ADD `responsableCobranza` varchar(100);
ALTER TABLE `clientes` ADD `direccion` text;
ALTER TABLE `clientes` ADD `notas` text;
ALTER TABLE `clientes` ADD `activo` boolean NOT NULL DEFAULT true;

-- Crear foreign key para grupoId
ALTER TABLE `clientes` ADD CONSTRAINT `clientes_grupoId_gruposClientes_id_fk` FOREIGN KEY (`grupoId`) REFERENCES `gruposClientes`(`id`) ON DELETE set null ON UPDATE no action;

-- Eliminar columnas antiguas si existen
ALTER TABLE `clientes` DROP COLUMN IF EXISTS `grupo`;
ALTER TABLE `clientes` DROP COLUMN IF EXISTS `asignado`;