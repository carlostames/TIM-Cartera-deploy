/**
 * Parser de descripciones de partidas de factura
 * Extrae información estructurada de descripciones de arrendamiento
 */

export interface PartidaParseada {
  tipoServicio: string | null;
  descripcionActivo: string | null;
  numeroSerie: string | null; // NS
  numeroContrato: string | null; // EXP
  rentaActual: number | null;
  totalRentas: number | null;
  periodoInicio: Date | null;
  periodoFin: Date | null;
  esArrendamiento: boolean;
}

/**
 * Parsea una descripción de partida de factura
 * 
 * Ejemplo de entrada:
 * "ARRENDAMIENTO - CHEVROLET - AVEO - 2022 - NS:045603 - EXP:166: RENTA 36 DE 36 DEL 01 de enero de 2025 AL 31 de enero de 2025"
 * 
 * @param descripcion Descripción completa de la partida
 * @returns Objeto con información estructurada
 */
export function parsearPartida(descripcion: string): PartidaParseada {
  const resultado: PartidaParseada = {
    tipoServicio: null,
    descripcionActivo: null,
    numeroSerie: null,
    numeroContrato: null,
    rentaActual: null,
    totalRentas: null,
    periodoInicio: null,
    periodoFin: null,
    esArrendamiento: false,
  };

  if (!descripcion) {
    return resultado;
  }

  const descripcionUpper = descripcion.toUpperCase();

  // Verificar si es arrendamiento
  if (descripcionUpper.includes('ARRENDAMIENTO')) {
    resultado.esArrendamiento = true;
    resultado.tipoServicio = 'ARRENDAMIENTO';
  }

  // Extraer número de serie (NS)
  const nsMatch = descripcion.match(/NS:?\s*([A-Z0-9]+)/i);
  if (nsMatch) {
    resultado.numeroSerie = nsMatch[1];
  }

  // Extraer número de contrato/expediente (EXP)
  const expMatch = descripcion.match(/EXP:?\s*(\d+)/i);
  if (expMatch) {
    resultado.numeroContrato = expMatch[1];
  }

  // Extraer información de renta (RENTA X DE Y)
  const rentaMatch = descripcion.match(/RENTA\s+(\d+)\s+DE\s+(\d+)/i);
  if (rentaMatch) {
    resultado.rentaActual = parseInt(rentaMatch[1], 10);
    resultado.totalRentas = parseInt(rentaMatch[2], 10);
  }

  // Extraer descripción del activo
  // Buscar entre el tipo de servicio y NS o EXP
  let activoMatch = descripcion.match(/ARRENDAMIENTO\s*-\s*(.+?)\s*-\s*NS:/i);
  if (!activoMatch) {
    activoMatch = descripcion.match(/ARRENDAMIENTO\s*-\s*(.+?)\s*-\s*EXP:/i);
  }
  if (activoMatch) {
    resultado.descripcionActivo = activoMatch[1].trim();
  }

  // Extraer período (DEL ... AL ...)
  const periodoMatch = descripcion.match(/DEL\s+(\d{1,2})\s+de\s+(\w+)\s+de\s+(\d{4})\s+AL\s+(\d{1,2})\s+de\s+(\w+)\s+de\s+(\d{4})/i);
  if (periodoMatch) {
    const [, diaInicio, mesInicio, anioInicio, diaFin, mesFin, anioFin] = periodoMatch;
    
    resultado.periodoInicio = parsearFechaEspanol(diaInicio, mesInicio, anioInicio);
    resultado.periodoFin = parsearFechaEspanol(diaFin, mesFin, anioFin);
  }

  return resultado;
}

/**
 * Convierte un mes en español a número
 */
function mesEspanolANumero(mes: string): number {
  const meses: Record<string, number> = {
    'enero': 0,
    'febrero': 1,
    'marzo': 2,
    'abril': 3,
    'mayo': 4,
    'junio': 5,
    'julio': 6,
    'agosto': 7,
    'septiembre': 8,
    'octubre': 9,
    'noviembre': 10,
    'diciembre': 11,
  };

  return meses[mes.toLowerCase()] ?? 0;
}

/**
 * Parsea una fecha en español a objeto Date
 */
function parsearFechaEspanol(dia: string, mes: string, anio: string): Date {
  const mesNum = mesEspanolANumero(mes);
  return new Date(parseInt(anio, 10), mesNum, parseInt(dia, 10));
}

/**
 * Calcula el número de rentas pendientes de un contrato
 */
export function calcularRentasPendientes(rentaActual: number, totalRentas: number): number {
  return Math.max(0, totalRentas - rentaActual);
}

/**
 * Calcula la fecha de término de un contrato
 */
export function calcularFechaTermino(fechaActual: Date, rentasPendientes: number): Date {
  const fecha = new Date(fechaActual);
  fecha.setMonth(fecha.getMonth() + rentasPendientes);
  return fecha;
}

/**
 * Genera proyección mensual para un contrato
 */
export interface ProyeccionMes {
  mes: Date;
  rentaNumero: number;
  montoProyectado: number;
  esUltimaRenta: boolean;
}

export function generarProyeccionMensual(
  rentaActual: number,
  totalRentas: number,
  montoMensual: number,
  fechaProximaRenta: Date
): ProyeccionMes[] {
  const proyeccion: ProyeccionMes[] = [];
  const rentasPendientes = calcularRentasPendientes(rentaActual, totalRentas);

  for (let i = 0; i < rentasPendientes; i++) {
    const mes = new Date(fechaProximaRenta);
    mes.setMonth(mes.getMonth() + i);
    
    // Normalizar al primer día del mes
    mes.setDate(1);
    mes.setHours(0, 0, 0, 0);

    const rentaNumero = rentaActual + i + 1;

    proyeccion.push({
      mes,
      rentaNumero,
      montoProyectado: montoMensual,
      esUltimaRenta: rentaNumero === totalRentas,
    });
  }

  return proyeccion;
}

/**
 * Valida si una descripción contiene información suficiente para crear un contrato
 */
export function esDescripcionValida(partida: PartidaParseada): boolean {
  return (
    partida.esArrendamiento &&
    partida.numeroContrato !== null &&
    partida.rentaActual !== null &&
    partida.totalRentas !== null
  );
}

/**
 * Extrae el nombre del cliente de la descripción del activo
 * Útil cuando no se puede vincular con la tabla de clientes
 */
export function extraerNombreClienteDeDescripcion(descripcion: string): string | null {
  // Intentar extraer el nombre del cliente si está en el formato
  // "ARRENDAMIENTO - CLIENTE - ACTIVO..."
  const match = descripcion.match(/ARRENDAMIENTO\s*-\s*([^-]+)\s*-/i);
  if (match) {
    return match[1].trim();
  }
  return null;
}

/**
 * Normaliza el número de contrato para comparaciones
 */
export function normalizarNumeroContrato(numeroContrato: string): string {
  const trimmed = numeroContrato.trim().toUpperCase();
  // Si es solo números, eliminar ceros a la izquierda
  if (/^\d+$/.test(trimmed)) {
    return parseInt(trimmed, 10).toString();
  }
  return trimmed;
}

/**
 * Determina si un contrato está por vencer (últimas 3 rentas)
 */
export function estaProximoAVencer(rentaActual: number, totalRentas: number): boolean {
  const rentasPendientes = calcularRentasPendientes(rentaActual, totalRentas);
  return rentasPendientes > 0 && rentasPendientes <= 3;
}

/**
 * Determina si un contrato es nuevo (primera renta)
 */
export function esContratoNuevo(rentaActual: number): boolean {
  return rentaActual === 1;
}

/**
 * Determina si un contrato ha terminado (última renta)
 */
export function haTerminado(rentaActual: number, totalRentas: number): boolean {
  return rentaActual >= totalRentas;
}
