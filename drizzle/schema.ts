import { boolean, date, integer, jsonb, pgEnum, pgTable, serial, text, timestamp, varchar, numeric } from "drizzle-orm/pg-core";

// ============ Enums ============
export const roleEnum = pgEnum("role", ["admin", "operador", "consulta"]);
export const formatoMonedaEnum = pgEnum("formato_moneda", ["completo", "miles", "millones"]);
export const sistemaEnum = pgEnum("sistema", ["tim_transp", "tim_value"]);
export const estatusEnum = pgEnum("estatus", ["normal", "cancelada"]);
export const estadoPagoEnum = pgEnum("estado_pago", ["pendiente", "pagado"]);
export const tipoArchivoEnum = pgEnum("tipo_archivo", ["tim_transp", "tim_value", "pendientes", "contratos"]);
export const estatusCargaEnum = pgEnum("estatus_carga", ["procesando", "completado", "error"]);
export const tipoConfigEnum = pgEnum("tipo_config", ["string", "number", "boolean", "json"]);
export const estatusSincEnum = pgEnum("estatus_sinc", ["activo", "error", "deshabilitado"]);
export const tipoContratoEnum = pgEnum("tipo_contrato", ["arrendamiento_puro", "arrendamiento_financiero", "credito_simple"]);
export const estatusContratoEnum = pgEnum("estatus_contrato", ["activo", "cancelado"]);
export const estatusProyeccionEnum = pgEnum("estatus_proyeccion", ["pendiente", "vencido", "pagado"]);

/**
 * Core user table backing auth flow.
 */
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  name: text("name"),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: roleEnum("role").default("consulta").notNull(),
  permisos: jsonb("permisos").$type<string[]>(),
  formatoMoneda: formatoMonedaEnum("formatoMoneda").default("completo").notNull(),
  activo: boolean("activo").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Magic Links - For passwordless email authentication
 */
export const magicLinks = pgTable("magicLinks", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 320 }).notNull(),
  token: varchar("token", { length: 64 }).notNull().unique(),
  expiresAt: timestamp("expiresAt").notNull(),
  usedAt: timestamp("usedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type MagicLink = typeof magicLinks.$inferSelect;
export type InsertMagicLink = typeof magicLinks.$inferInsert;

/**
 * Grupos de Clientes - Para agrupar múltiples razones sociales
 */
export const gruposClientes = pgTable("gruposClientes", {
  id: serial("id").primaryKey(),
  nombre: varchar("nombre", { length: 255 }).notNull().unique(),
  descripcion: text("descripcion"),
  responsable: varchar("responsable", { length: 100 }),
  activo: boolean("activo").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type GrupoCliente = typeof gruposClientes.$inferSelect;
export type InsertGrupoCliente = typeof gruposClientes.$inferInsert;

/**
 * Clientes - Master data de clientes
 */
export const clientes = pgTable("clientes", {
  id: serial("id").primaryKey(),
  nombre: varchar("nombre", { length: 255 }).notNull().unique(),
  rfc: varchar("rfc", { length: 13 }),
  alias: varchar("alias", { length: 100 }),
  grupoId: integer("grupoId").references(() => gruposClientes.id),
  responsableCobranza: varchar("responsableCobranza", { length: 100 }),
  correoCobranza: varchar("correoCobranza", { length: 320 }),
  telefono: varchar("telefono", { length: 50 }),
  direccion: text("direccion"),
  notas: text("notas"),
  activo: boolean("activo").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Cliente = typeof clientes.$inferSelect;
export type InsertCliente = typeof clientes.$inferInsert;

/**
 * Facturas - Consolidado de ambos sistemas de facturación
 */
export const facturas = pgTable("facturas", {
  id: serial("id").primaryKey(),
  folio: varchar("folio", { length: 50 }).notNull().unique(),
  sistema: sistemaEnum("sistema").notNull(),
  clienteId: integer("clienteId").references(() => clientes.id),
  nombreCliente: varchar("nombreCliente", { length: 255 }).notNull(),
  fecha: timestamp("fecha").notNull(),
  fechaVencimiento: timestamp("fechaVencimiento"),
  importeTotal: numeric("importeTotal", { precision: 15, scale: 2 }).notNull(),
  saldoPendiente: numeric("saldoPendiente", { precision: 15, scale: 2 }).default("0.00").notNull(),
  descripcion: text("descripcion"),
  numeroContrato: varchar("numeroContrato", { length: 50 }),
  estatus: estatusEnum("estatus").default("normal").notNull(),
  estadoPago: estadoPagoEnum("estadoPago").default("pendiente").notNull(),
  diasAtraso: integer("diasAtraso").default(0),
  interesesMoratorios: numeric("interesesMoratorios", { precision: 15, scale: 2 }).default("0.00"),
  totalConIntereses: numeric("totalConIntereses", { precision: 15, scale: 2 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Factura = typeof facturas.$inferSelect;
export type InsertFactura = typeof facturas.$inferInsert;

/**
 * Pendientes de Pago - Registro de folios pendientes
 */
export const pendientesPago = pgTable("pendientesPago", {
  id: serial("id").primaryKey(),
  facturaId: integer("facturaId").references(() => facturas.id),
  folio: varchar("folio", { length: 50 }).notNull(),
  clienteId: integer("clienteId").references(() => clientes.id),
  nombreCliente: varchar("nombreCliente", { length: 255 }).notNull(),
  alias: varchar("alias", { length: 100 }),
  descripcion: text("descripcion"),
  diasVencido: integer("diasVencido").default(0),
  saldo: numeric("saldo", { precision: 15, scale: 2 }).notNull(),
  interesesMoratorios: numeric("interesesMoratorios", { precision: 15, scale: 2 }).default("0.00"),
  totalConMoratorios: numeric("totalConMoratorios", { precision: 15, scale: 2 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type PendientePago = typeof pendientesPago.$inferSelect;
export type InsertPendientePago = typeof pendientesPago.$inferInsert;

/**
 * Historial de Cargas - Registro de archivos procesados
 */
export const historialCargas = pgTable("historialCargas", {
  id: serial("id").primaryKey(),
  tipoArchivo: tipoArchivoEnum("tipoArchivo").notNull(),
  nombreArchivo: varchar("nombreArchivo", { length: 255 }).notNull(),
  registrosProcesados: integer("registrosProcesados").default(0),
  registrosExitosos: integer("registrosExitosos").default(0),
  registrosError: integer("registrosError").default(0),
  estatus: estatusCargaEnum("estatus").default("procesando").notNull(),
  errores: jsonb("errores").$type<string[]>(),
  usuarioId: integer("usuarioId").references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  completedAt: timestamp("completedAt"),
});

export type HistorialCarga = typeof historialCargas.$inferSelect;
export type InsertHistorialCarga = typeof historialCargas.$inferInsert;

/**
 * Configuración del Sistema
 */
export const configuracion = pgTable("configuracion", {
  id: serial("id").primaryKey(),
  clave: varchar("clave", { length: 100 }).notNull().unique(),
  valor: text("valor").notNull(),
  tipo: tipoConfigEnum("tipo").default("string").notNull(),
  descripcion: text("descripcion"),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  updatedBy: integer("updatedBy").references(() => users.id),
});

export type Configuracion = typeof configuracion.$inferSelect;
export type InsertConfiguracion = typeof configuracion.$inferInsert;

/**
 * Logs de Auditoría
 */
export const auditLogs = pgTable("auditLogs", {
  id: serial("id").primaryKey(),
  usuarioId: integer("usuarioId").references(() => users.id),
  accion: varchar("accion", { length: 100 }).notNull(),
  entidad: varchar("entidad", { length: 100 }),
  entidadId: integer("entidadId"),
  detalles: jsonb("detalles").$type<Record<string, unknown>>(),
  ipAddress: varchar("ipAddress", { length: 45 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = typeof auditLogs.$inferInsert;

/**
 * Integración Google Sheets
 */
export const googleSheetsConfig = pgTable("googleSheetsConfig", {
  id: serial("id").primaryKey(),
  spreadsheetId: varchar("spreadsheetId", { length: 255 }).notNull(),
  spreadsheetUrl: text("spreadsheetUrl"),
  credenciales: text("credenciales"), // JSON encriptado
  ultimaSincronizacion: timestamp("ultimaSincronizacion"),
  estatusSincronizacion: estatusSincEnum("estatusSincronizacion").default("activo"),
  mensajeError: text("mensajeError"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type GoogleSheetsConfig = typeof googleSheetsConfig.$inferSelect;
export type InsertGoogleSheetsConfig = typeof googleSheetsConfig.$inferInsert;

/**
 * Contratos de Arrendamiento - Para proyección de facturación
 */
export const contratos = pgTable("contratos", {
  id: serial("id").primaryKey(),
  numeroContrato: varchar("numeroContrato", { length: 50 }).notNull().unique(), // EXP
  clienteId: integer("clienteId").references(() => clientes.id),
  nombreCliente: varchar("nombreCliente", { length: 255 }).notNull(),
  empresa: sistemaEnum("empresa").notNull(),
  tipoServicio: varchar("tipoServicio", { length: 100 }).notNull(), // ARRENDAMIENTO
  descripcionActivo: text("descripcionActivo"), // CHEVROLET - AVEO - 2022
  numeroSerie: varchar("numeroSerie", { length: 50 }), // NS
  totalRentas: integer("totalRentas").notNull(),
  rentaActual: integer("rentaActual").notNull(),
  montoMensual: numeric("montoMensual", { precision: 15, scale: 2 }).notNull(),
  rentaAdministracion: numeric("rentaAdministracion", { precision: 15, scale: 2 }),
  rentaClubTim: numeric("rentaClubTim", { precision: 15, scale: 2 }),
  plazo: integer("plazo"), // Duración total en meses
  fechaInicio: date("fechaInicio"),
  fechaProximaRenta: date("fechaProximaRenta"),
  fechaTermino: date("fechaTermino"),
  activo: boolean("activo").default(true).notNull(),
  motivoBaja: text("motivoBaja"),
  fechaBaja: timestamp("fechaBaja"),
  usuarioBajaId: integer("usuarioBajaId").references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Contrato = typeof contratos.$inferSelect;
export type InsertContrato = typeof contratos.$inferInsert;

/**
 * Proyección Mensual - Ingresos proyectados por contrato
 */
export const proyeccionMensual = pgTable("proyeccionMensual", {
  id: serial("id").primaryKey(),
  contratoId: integer("contratoId").references(() => contratos.id).notNull(),
  mes: date("mes").notNull(), // Primer día del mes proyectado
  montoProyectado: numeric("montoProyectado", { precision: 15, scale: 2 }).notNull(),
  rentaNumero: integer("rentaNumero").notNull(), // Número de renta proyectada
  esUltimaRenta: boolean("esUltimaRenta").default(false).notNull(),
  montoReal: numeric("montoReal", { precision: 15, scale: 2 }), // Se llena cuando se factura
  facturaId: integer("facturaId").references(() => facturas.id),
  generadoEn: timestamp("generadoEn").defaultNow().notNull(),
});

export type ProyeccionMensual = typeof proyeccionMensual.$inferSelect;
export type InsertProyeccionMensual = typeof proyeccionMensual.$inferInsert;

/**
 * Partidas de Factura - Detalle de cada línea de factura
 */
export const partidasFactura = pgTable("partidasFactura", {
  id: serial("id").primaryKey(),
  facturaId: integer("facturaId").references(() => facturas.id).notNull(),
  contratoId: integer("contratoId").references(() => contratos.id),
  descripcion: text("descripcion").notNull(),
  monto: numeric("monto", { precision: 15, scale: 2 }).notNull(),
  // Campos extraídos del parser
  tipoServicio: varchar("tipoServicio", { length: 100 }),
  numeroContrato: varchar("numeroContrato", { length: 50 }), // EXP
  numeroSerie: varchar("numeroSerie", { length: 50 }), // NS
  descripcionActivo: text("descripcionActivo"),
  rentaActual: integer("rentaActual"),
  totalRentas: integer("totalRentas"),
  periodoInicio: date("periodoInicio"),
  periodoFin: date("periodoFin"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PartidaFactura = typeof partidasFactura.$inferSelect;
export type InsertPartidaFactura = typeof partidasFactura.$inferInsert;

/**
 * Facturas Faltantes - Registro de facturas detectadas en archivo de pendientes pero no encontradas en BD
 */
export const facturasFaltantes = pgTable("facturasFaltantes", {
  id: serial("id").primaryKey(),
  folio: varchar("folio", { length: 50 }).notNull(),
  saldo: numeric("saldo", { precision: 15, scale: 2 }).notNull(),
  fecha: date("fecha"),
  fechaVencimiento: date("fechaVencimiento"),
  archivoOrigen: varchar("archivoOrigen", { length: 255 }), // Nombre del archivo donde se detectó
  detectadoEn: timestamp("detectadoEn").defaultNow().notNull(),
  resuelta: boolean("resuelta").default(false).notNull(), // Se marca como true cuando se carga la factura
  resueltaEn: timestamp("resueltaEn"),
});

export type FacturaFaltante = typeof facturasFaltantes.$inferSelect;
export type InsertFacturaFaltante = typeof facturasFaltantes.$inferInsert;

/**
 * Auditoría de Bajas de Contratos - Trazabilidad de contratos dados de baja
 */
export const auditoriaBajasContratos = pgTable("auditoriaBajasContratos", {
  id: serial("id").primaryKey(),
  contratoId: integer("contratoId").references(() => contratos.id).notNull(),
  numeroContrato: varchar("numeroContrato", { length: 50 }).notNull(),
  clienteId: integer("clienteId").references(() => clientes.id),
  nombreCliente: varchar("nombreCliente", { length: 255 }).notNull(),
  empresa: sistemaEnum("empresa_baja").notNull(),
  motivoBaja: text("motivoBaja").notNull(),
  usuarioId: integer("usuarioId").references(() => users.id).notNull(),
  nombreUsuario: varchar("nombreUsuario", { length: 255 }).notNull(),
  emailUsuario: varchar("emailUsuario", { length: 320 }),
  montoProyeccionEliminado: numeric("montoProyeccionEliminado", { precision: 15, scale: 2 }),
  rentasFaltantes: integer("rentasFaltantes"),
  fechaBaja: timestamp("fechaBaja").defaultNow().notNull(),
});

export type AuditoriaBajaContrato = typeof auditoriaBajasContratos.$inferSelect;
export type InsertAuditoriaBajaContrato = typeof auditoriaBajasContratos.$inferInsert;

/**
 * ============================================================================
 * MÓDULO: PROYECCIÓN MANUAL DE CONTRATOS
 * ============================================================================
 */

/**
 * Vendedores - Catálogo de vendedores para cálculo de comisiones
 */
export const vendedores = pgTable("vendedores", {
  id: serial("id").primaryKey(),
  nombre: varchar("nombre", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }),
  telefono: varchar("telefono", { length: 50 }),
  comisionPorcentaje: numeric("comisionPorcentaje", { precision: 5, scale: 2 }), // % de comisión
  activo: boolean("activo").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Vendedor = typeof vendedores.$inferSelect;
export type InsertVendedor = typeof vendedores.$inferInsert;

/**
 * Contratos de Proyección Manual - Cabecera de contratos
 */
export const contratosProyeccion = pgTable("contratosProyeccion", {
  id: serial("id").primaryKey(),
  numeroContrato: varchar("numeroContrato", { length: 50 }).notNull().unique(),
  clienteId: integer("clienteId").references(() => clientes.id).notNull(),
  vendedorId: integer("vendedorId").references(() => vendedores.id),
  empresa: sistemaEnum("empresa_proy").notNull(),
  tipoContrato: tipoContratoEnum("tipoContrato").notNull(),
  fechaInicio: date("fechaInicio").notNull(),
  plazo: integer("plazo").notNull(), // 12, 24, 36, 48, 60 meses
  estatus: estatusContratoEnum("estatus_contrato").default("activo").notNull(),
  fechaCancelacion: timestamp("fechaCancelacion"),
  motivoCancelacion: text("motivoCancelacion"),
  usuarioCancelacionId: integer("usuarioCancelacionId").references(() => users.id),
  notas: text("notas"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  creadoPorId: integer("creadoPorId").references(() => users.id).notNull(),
});

export type ContratoProyeccion = typeof contratosProyeccion.$inferSelect;
export type InsertContratoProyeccion = typeof contratosProyeccion.$inferInsert;

/**
 * Line Items de Contrato - Equipos/conceptos por contrato
 */
export const lineItemsContrato = pgTable("lineItemsContrato", {
  id: serial("id").primaryKey(),
  contratoId: integer("contratoId").references(() => contratosProyeccion.id).notNull(),
  consecutivo: integer("consecutivo").notNull(), // 1, 2, 3...
  nombreEquipo: varchar("nombreEquipo", { length: 255 }).notNull(),
  
  // Campos comunes a todos los tipos
  precioEquipoSinIva: numeric("precioEquipoSinIva", { precision: 15, scale: 2 }),
  pagoInicialSinIva: numeric("pagoInicialSinIva", { precision: 15, scale: 2 }).default("0.00"),
  comisionesSinIva: numeric("comisionesSinIva", { precision: 15, scale: 2 }).default("0.00"),
  valorResidualSinIva: numeric("valorResidualSinIva", { precision: 15, scale: 2 }).default("0.00"),
  
  // Campos específicos de Arrendamiento Puro
  mensualidadBaseSinIva: numeric("mensualidadBaseSinIva", { precision: 15, scale: 2 }),
  serviciosAdicionalesSinIva: numeric("serviciosAdicionalesSinIva", { precision: 15, scale: 2 }).default("0.00"),
  
  // Campos específicos de Arrendamiento Financiero y Crédito Simple
  tasaInteresAnual: numeric("tasaInteresAnual", { precision: 5, scale: 2 }), // Porcentaje
  montoFinanciar: numeric("montoFinanciar", { precision: 15, scale: 2 }), // Calculado
  
  // Campos calculados y guardados
  rentaMensualSinIva: numeric("rentaMensualSinIva", { precision: 15, scale: 2 }).notNull(),
  ivaMensual: numeric("ivaMensual", { precision: 15, scale: 2 }).notNull(),
  rentaMensualConIva: numeric("rentaMensualConIva", { precision: 15, scale: 2 }).notNull(),
  
  totalPagoInicialSinIva: numeric("totalPagoInicialSinIva", { precision: 15, scale: 2 }),
  ivaPagoInicial: numeric("ivaPagoInicial", { precision: 15, scale: 2 }),
  totalPagoInicialConIva: numeric("totalPagoInicialConIva", { precision: 15, scale: 2 }),
  
  totalComisionesSinIva: numeric("totalComisionesSinIva", { precision: 15, scale: 2 }),
  ivaComisiones: numeric("ivaComisiones", { precision: 15, scale: 2 }),
  totalComisionesConIva: numeric("totalComisionesConIva", { precision: 15, scale: 2 }),
  
  totalValorResidualSinIva: numeric("totalValorResidualSinIva", { precision: 15, scale: 2 }),
  ivaValorResidual: numeric("ivaValorResidual", { precision: 15, scale: 2 }),
  totalValorResidualConIva: numeric("totalValorResidualConIva", { precision: 15, scale: 2 }),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type LineItemContrato = typeof lineItemsContrato.$inferSelect;
export type InsertLineItemContrato = typeof lineItemsContrato.$inferInsert;

/**
 * Proyección Mensual Manual - Pagos proyectados por contrato
 */
export const proyeccionMensualManual = pgTable("proyeccionMensualManual", {
  id: serial("id").primaryKey(),
  contratoId: integer("contratoId").references(() => contratosProyeccion.id).notNull(),
  lineItemId: integer("lineItemId").references(() => lineItemsContrato.id).notNull(),
  mes: date("mes").notNull(), // Primer día del mes proyectado
  numeroRenta: integer("numeroRenta").notNull(), // 1, 2, 3... hasta plazo
  
  // Montos proyectados
  montoPagoInicial: numeric("montoPagoInicial", { precision: 15, scale: 2 }).default("0.00"),
  montoComisiones: numeric("montoComisiones", { precision: 15, scale: 2 }).default("0.00"),
  montoRentaMensual: numeric("montoRentaMensual", { precision: 15, scale: 2 }).default("0.00"),
  montoValorResidual: numeric("montoValorResidual", { precision: 15, scale: 2 }).default("0.00"),
  montoTotal: numeric("montoTotal", { precision: 15, scale: 2 }).notNull(),
  
  // Estado del pago
  estatus: estatusProyeccionEnum("estatus_proy").default("pendiente").notNull(),
  fechaPago: date("fechaPago"),
  montoPagado: numeric("montoPagado", { precision: 15, scale: 2 }),
  
  generadoEn: timestamp("generadoEn").defaultNow().notNull(),
});

export type ProyeccionMensualManual = typeof proyeccionMensualManual.$inferSelect;
export type InsertProyeccionMensualManual = typeof proyeccionMensualManual.$inferInsert;
