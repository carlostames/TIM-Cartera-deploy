CREATE TYPE "public"."estado_pago" AS ENUM('pendiente', 'pagado');--> statement-breakpoint
CREATE TYPE "public"."estatus_carga" AS ENUM('procesando', 'completado', 'error');--> statement-breakpoint
CREATE TYPE "public"."estatus_contrato" AS ENUM('activo', 'cancelado');--> statement-breakpoint
CREATE TYPE "public"."estatus" AS ENUM('normal', 'cancelada');--> statement-breakpoint
CREATE TYPE "public"."estatus_proyeccion" AS ENUM('pendiente', 'vencido', 'pagado');--> statement-breakpoint
CREATE TYPE "public"."estatus_sinc" AS ENUM('activo', 'error', 'deshabilitado');--> statement-breakpoint
CREATE TYPE "public"."formato_moneda" AS ENUM('completo', 'miles', 'millones');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('admin', 'operador', 'consulta');--> statement-breakpoint
CREATE TYPE "public"."sistema" AS ENUM('tim_transp', 'tim_value');--> statement-breakpoint
CREATE TYPE "public"."tipo_archivo" AS ENUM('tim_transp', 'tim_value', 'pendientes', 'contratos');--> statement-breakpoint
CREATE TYPE "public"."tipo_config" AS ENUM('string', 'number', 'boolean', 'json');--> statement-breakpoint
CREATE TYPE "public"."tipo_contrato" AS ENUM('arrendamiento_puro', 'arrendamiento_financiero', 'credito_simple');--> statement-breakpoint
CREATE TABLE "auditLogs" (
	"id" serial PRIMARY KEY NOT NULL,
	"usuarioId" integer,
	"accion" varchar(100) NOT NULL,
	"entidad" varchar(100),
	"entidadId" integer,
	"detalles" jsonb,
	"ipAddress" varchar(45),
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "auditoriaBajasContratos" (
	"id" serial PRIMARY KEY NOT NULL,
	"contratoId" integer NOT NULL,
	"numeroContrato" varchar(50) NOT NULL,
	"clienteId" integer,
	"nombreCliente" varchar(255) NOT NULL,
	"empresa_baja" "sistema" NOT NULL,
	"motivoBaja" text NOT NULL,
	"usuarioId" integer NOT NULL,
	"nombreUsuario" varchar(255) NOT NULL,
	"emailUsuario" varchar(320),
	"montoProyeccionEliminado" numeric(15, 2),
	"rentasFaltantes" integer,
	"fechaBaja" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clientes" (
	"id" serial PRIMARY KEY NOT NULL,
	"nombre" varchar(255) NOT NULL,
	"rfc" varchar(13),
	"alias" varchar(100),
	"grupoId" integer,
	"responsableCobranza" varchar(100),
	"correoCobranza" varchar(320),
	"telefono" varchar(50),
	"direccion" text,
	"notas" text,
	"activo" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "clientes_nombre_unique" UNIQUE("nombre")
);
--> statement-breakpoint
CREATE TABLE "configuracion" (
	"id" serial PRIMARY KEY NOT NULL,
	"clave" varchar(100) NOT NULL,
	"valor" text NOT NULL,
	"tipo" "tipo_config" DEFAULT 'string' NOT NULL,
	"descripcion" text,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"updatedBy" integer,
	CONSTRAINT "configuracion_clave_unique" UNIQUE("clave")
);
--> statement-breakpoint
CREATE TABLE "contratos" (
	"id" serial PRIMARY KEY NOT NULL,
	"numeroContrato" varchar(50) NOT NULL,
	"clienteId" integer,
	"nombreCliente" varchar(255) NOT NULL,
	"empresa" "sistema" NOT NULL,
	"tipoServicio" varchar(100) NOT NULL,
	"descripcionActivo" text,
	"numeroSerie" varchar(50),
	"totalRentas" integer NOT NULL,
	"rentaActual" integer NOT NULL,
	"montoMensual" numeric(15, 2) NOT NULL,
	"rentaAdministracion" numeric(15, 2),
	"rentaClubTim" numeric(15, 2),
	"plazo" integer,
	"fechaInicio" date,
	"fechaProximaRenta" date,
	"fechaTermino" date,
	"activo" boolean DEFAULT true NOT NULL,
	"motivoBaja" text,
	"fechaBaja" timestamp,
	"usuarioBajaId" integer,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "contratos_numeroContrato_unique" UNIQUE("numeroContrato")
);
--> statement-breakpoint
CREATE TABLE "contratosProyeccion" (
	"id" serial PRIMARY KEY NOT NULL,
	"numeroContrato" varchar(50) NOT NULL,
	"clienteId" integer NOT NULL,
	"vendedorId" integer,
	"empresa_proy" "sistema" NOT NULL,
	"tipoContrato" "tipo_contrato" NOT NULL,
	"fechaInicio" date NOT NULL,
	"plazo" integer NOT NULL,
	"estatus_contrato" "estatus_contrato" DEFAULT 'activo' NOT NULL,
	"fechaCancelacion" timestamp,
	"motivoCancelacion" text,
	"usuarioCancelacionId" integer,
	"notas" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"creadoPorId" integer NOT NULL,
	CONSTRAINT "contratosProyeccion_numeroContrato_unique" UNIQUE("numeroContrato")
);
--> statement-breakpoint
CREATE TABLE "facturas" (
	"id" serial PRIMARY KEY NOT NULL,
	"folio" varchar(50) NOT NULL,
	"sistema" "sistema" NOT NULL,
	"clienteId" integer,
	"nombreCliente" varchar(255) NOT NULL,
	"fecha" timestamp NOT NULL,
	"fechaVencimiento" timestamp,
	"importeTotal" numeric(15, 2) NOT NULL,
	"saldoPendiente" numeric(15, 2) DEFAULT '0.00' NOT NULL,
	"descripcion" text,
	"numeroContrato" varchar(50),
	"estatus" "estatus" DEFAULT 'normal' NOT NULL,
	"estadoPago" "estado_pago" DEFAULT 'pendiente' NOT NULL,
	"diasAtraso" integer DEFAULT 0,
	"interesesMoratorios" numeric(15, 2) DEFAULT '0.00',
	"totalConIntereses" numeric(15, 2),
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "facturas_folio_unique" UNIQUE("folio")
);
--> statement-breakpoint
CREATE TABLE "facturasFaltantes" (
	"id" serial PRIMARY KEY NOT NULL,
	"folio" varchar(50) NOT NULL,
	"saldo" numeric(15, 2) NOT NULL,
	"fecha" date,
	"fechaVencimiento" date,
	"archivoOrigen" varchar(255),
	"detectadoEn" timestamp DEFAULT now() NOT NULL,
	"resuelta" boolean DEFAULT false NOT NULL,
	"resueltaEn" timestamp
);
--> statement-breakpoint
CREATE TABLE "googleSheetsConfig" (
	"id" serial PRIMARY KEY NOT NULL,
	"spreadsheetId" varchar(255) NOT NULL,
	"spreadsheetUrl" text,
	"credenciales" text,
	"ultimaSincronizacion" timestamp,
	"estatusSincronizacion" "estatus_sinc" DEFAULT 'activo',
	"mensajeError" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "gruposClientes" (
	"id" serial PRIMARY KEY NOT NULL,
	"nombre" varchar(255) NOT NULL,
	"descripcion" text,
	"responsable" varchar(100),
	"activo" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "gruposClientes_nombre_unique" UNIQUE("nombre")
);
--> statement-breakpoint
CREATE TABLE "historialCargas" (
	"id" serial PRIMARY KEY NOT NULL,
	"tipoArchivo" "tipo_archivo" NOT NULL,
	"nombreArchivo" varchar(255) NOT NULL,
	"registrosProcesados" integer DEFAULT 0,
	"registrosExitosos" integer DEFAULT 0,
	"registrosError" integer DEFAULT 0,
	"estatus" "estatus_carga" DEFAULT 'procesando' NOT NULL,
	"errores" jsonb,
	"usuarioId" integer,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"completedAt" timestamp
);
--> statement-breakpoint
CREATE TABLE "lineItemsContrato" (
	"id" serial PRIMARY KEY NOT NULL,
	"contratoId" integer NOT NULL,
	"consecutivo" integer NOT NULL,
	"nombreEquipo" varchar(255) NOT NULL,
	"precioEquipoSinIva" numeric(15, 2),
	"pagoInicialSinIva" numeric(15, 2) DEFAULT '0.00',
	"comisionesSinIva" numeric(15, 2) DEFAULT '0.00',
	"valorResidualSinIva" numeric(15, 2) DEFAULT '0.00',
	"mensualidadBaseSinIva" numeric(15, 2),
	"serviciosAdicionalesSinIva" numeric(15, 2) DEFAULT '0.00',
	"tasaInteresAnual" numeric(5, 2),
	"montoFinanciar" numeric(15, 2),
	"rentaMensualSinIva" numeric(15, 2) NOT NULL,
	"ivaMensual" numeric(15, 2) NOT NULL,
	"rentaMensualConIva" numeric(15, 2) NOT NULL,
	"totalPagoInicialSinIva" numeric(15, 2),
	"ivaPagoInicial" numeric(15, 2),
	"totalPagoInicialConIva" numeric(15, 2),
	"totalComisionesSinIva" numeric(15, 2),
	"ivaComisiones" numeric(15, 2),
	"totalComisionesConIva" numeric(15, 2),
	"totalValorResidualSinIva" numeric(15, 2),
	"ivaValorResidual" numeric(15, 2),
	"totalValorResidualConIva" numeric(15, 2),
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "magicLinks" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" varchar(320) NOT NULL,
	"token" varchar(64) NOT NULL,
	"expiresAt" timestamp NOT NULL,
	"usedAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "magicLinks_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "partidasFactura" (
	"id" serial PRIMARY KEY NOT NULL,
	"facturaId" integer NOT NULL,
	"contratoId" integer,
	"descripcion" text NOT NULL,
	"monto" numeric(15, 2) NOT NULL,
	"tipoServicio" varchar(100),
	"numeroContrato" varchar(50),
	"numeroSerie" varchar(50),
	"descripcionActivo" text,
	"rentaActual" integer,
	"totalRentas" integer,
	"periodoInicio" date,
	"periodoFin" date,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pendientesPago" (
	"id" serial PRIMARY KEY NOT NULL,
	"facturaId" integer,
	"folio" varchar(50) NOT NULL,
	"clienteId" integer,
	"nombreCliente" varchar(255) NOT NULL,
	"alias" varchar(100),
	"descripcion" text,
	"diasVencido" integer DEFAULT 0,
	"saldo" numeric(15, 2) NOT NULL,
	"interesesMoratorios" numeric(15, 2) DEFAULT '0.00',
	"totalConMoratorios" numeric(15, 2),
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "proyeccionMensual" (
	"id" serial PRIMARY KEY NOT NULL,
	"contratoId" integer NOT NULL,
	"mes" date NOT NULL,
	"montoProyectado" numeric(15, 2) NOT NULL,
	"rentaNumero" integer NOT NULL,
	"esUltimaRenta" boolean DEFAULT false NOT NULL,
	"montoReal" numeric(15, 2),
	"facturaId" integer,
	"generadoEn" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "proyeccionMensualManual" (
	"id" serial PRIMARY KEY NOT NULL,
	"contratoId" integer NOT NULL,
	"lineItemId" integer NOT NULL,
	"mes" date NOT NULL,
	"numeroRenta" integer NOT NULL,
	"montoPagoInicial" numeric(15, 2) DEFAULT '0.00',
	"montoComisiones" numeric(15, 2) DEFAULT '0.00',
	"montoRentaMensual" numeric(15, 2) DEFAULT '0.00',
	"montoValorResidual" numeric(15, 2) DEFAULT '0.00',
	"montoTotal" numeric(15, 2) NOT NULL,
	"estatus_proy" "estatus_proyeccion" DEFAULT 'pendiente' NOT NULL,
	"fechaPago" date,
	"montoPagado" numeric(15, 2),
	"generadoEn" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" varchar(320) NOT NULL,
	"name" text,
	"loginMethod" varchar(64),
	"role" "role" DEFAULT 'consulta' NOT NULL,
	"permisos" jsonb,
	"formatoMoneda" "formato_moneda" DEFAULT 'completo' NOT NULL,
	"activo" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"lastSignedIn" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "vendedores" (
	"id" serial PRIMARY KEY NOT NULL,
	"nombre" varchar(255) NOT NULL,
	"email" varchar(320),
	"telefono" varchar(50),
	"comisionPorcentaje" numeric(5, 2),
	"activo" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "auditLogs" ADD CONSTRAINT "auditLogs_usuarioId_users_id_fk" FOREIGN KEY ("usuarioId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auditoriaBajasContratos" ADD CONSTRAINT "auditoriaBajasContratos_contratoId_contratos_id_fk" FOREIGN KEY ("contratoId") REFERENCES "public"."contratos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auditoriaBajasContratos" ADD CONSTRAINT "auditoriaBajasContratos_clienteId_clientes_id_fk" FOREIGN KEY ("clienteId") REFERENCES "public"."clientes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auditoriaBajasContratos" ADD CONSTRAINT "auditoriaBajasContratos_usuarioId_users_id_fk" FOREIGN KEY ("usuarioId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clientes" ADD CONSTRAINT "clientes_grupoId_gruposClientes_id_fk" FOREIGN KEY ("grupoId") REFERENCES "public"."gruposClientes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "configuracion" ADD CONSTRAINT "configuracion_updatedBy_users_id_fk" FOREIGN KEY ("updatedBy") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contratos" ADD CONSTRAINT "contratos_clienteId_clientes_id_fk" FOREIGN KEY ("clienteId") REFERENCES "public"."clientes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contratos" ADD CONSTRAINT "contratos_usuarioBajaId_users_id_fk" FOREIGN KEY ("usuarioBajaId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contratosProyeccion" ADD CONSTRAINT "contratosProyeccion_clienteId_clientes_id_fk" FOREIGN KEY ("clienteId") REFERENCES "public"."clientes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contratosProyeccion" ADD CONSTRAINT "contratosProyeccion_vendedorId_vendedores_id_fk" FOREIGN KEY ("vendedorId") REFERENCES "public"."vendedores"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contratosProyeccion" ADD CONSTRAINT "contratosProyeccion_usuarioCancelacionId_users_id_fk" FOREIGN KEY ("usuarioCancelacionId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contratosProyeccion" ADD CONSTRAINT "contratosProyeccion_creadoPorId_users_id_fk" FOREIGN KEY ("creadoPorId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "facturas" ADD CONSTRAINT "facturas_clienteId_clientes_id_fk" FOREIGN KEY ("clienteId") REFERENCES "public"."clientes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "historialCargas" ADD CONSTRAINT "historialCargas_usuarioId_users_id_fk" FOREIGN KEY ("usuarioId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lineItemsContrato" ADD CONSTRAINT "lineItemsContrato_contratoId_contratosProyeccion_id_fk" FOREIGN KEY ("contratoId") REFERENCES "public"."contratosProyeccion"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "partidasFactura" ADD CONSTRAINT "partidasFactura_facturaId_facturas_id_fk" FOREIGN KEY ("facturaId") REFERENCES "public"."facturas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "partidasFactura" ADD CONSTRAINT "partidasFactura_contratoId_contratos_id_fk" FOREIGN KEY ("contratoId") REFERENCES "public"."contratos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pendientesPago" ADD CONSTRAINT "pendientesPago_facturaId_facturas_id_fk" FOREIGN KEY ("facturaId") REFERENCES "public"."facturas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pendientesPago" ADD CONSTRAINT "pendientesPago_clienteId_clientes_id_fk" FOREIGN KEY ("clienteId") REFERENCES "public"."clientes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proyeccionMensual" ADD CONSTRAINT "proyeccionMensual_contratoId_contratos_id_fk" FOREIGN KEY ("contratoId") REFERENCES "public"."contratos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proyeccionMensual" ADD CONSTRAINT "proyeccionMensual_facturaId_facturas_id_fk" FOREIGN KEY ("facturaId") REFERENCES "public"."facturas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proyeccionMensualManual" ADD CONSTRAINT "proyeccionMensualManual_contratoId_contratosProyeccion_id_fk" FOREIGN KEY ("contratoId") REFERENCES "public"."contratosProyeccion"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proyeccionMensualManual" ADD CONSTRAINT "proyeccionMensualManual_lineItemId_lineItemsContrato_id_fk" FOREIGN KEY ("lineItemId") REFERENCES "public"."lineItemsContrato"("id") ON DELETE no action ON UPDATE no action;