/**
 * Integración entre el parser de partidas y el sistema de contratos
 * Procesa facturas y actualiza automáticamente contratos y proyecciones
 */

import * as db from './db';
import { 
  parsearPartida, 
  esDescripcionValida, 
  generarProyeccionMensual,
  normalizarNumeroContrato,
  esContratoNuevo,
  haTerminado 
} from './partidaParser';
import { InsertContrato, InsertPartidaFactura, InsertProyeccionMensual } from '../drizzle/schema';

export interface ContratoDetectado {
  numeroContrato: string;
  esNuevo: boolean;
  esUltimaRenta: boolean;
  rentaActual: number;
  totalRentas: number;
  montoMensual: number;
}

/**
 * Procesa una factura y extrae/actualiza contratos de sus partidas
 * @param facturaId ID de la factura procesada
 * @param descripcion Descripción completa de la factura (puede contener múltiples partidas)
 * @param monto Monto de la factura
 * @param nombreCliente Nombre del cliente
 * @param empresa Tim Transp o Tim Value
 * @param fecha Fecha de la factura
 * @returns Array de contratos detectados/actualizados
 */
export async function procesarFacturaParaContratos(
  facturaId: number,
  descripcion: string,
  monto: number,
  nombreCliente: string,
  empresa: 'tim_transp' | 'tim_value',
  fecha: Date
): Promise<ContratoDetectado[]> {
  const contratosDetectados: ContratoDetectado[] = [];
  
  // Dividir descripción en líneas (puede haber múltiples partidas)
  const lineas = descripcion.split('\n').filter(l => l.trim());
  
  for (const linea of lineas) {
    const partida = parsearPartida(linea);
    
    // Solo procesar si es una descripción válida de arrendamiento
    if (!esDescripcionValida(partida)) {
      continue;
    }
    
    try {
      // Guardar partida en la base de datos
      await db.createPartidaFactura({
        facturaId,
        descripcion: linea,
        monto: monto.toString(),
        tipoServicio: partida.tipoServicio || undefined,
        numeroContrato: partida.numeroContrato || undefined,
        numeroSerie: partida.numeroSerie || undefined,
        descripcionActivo: partida.descripcionActivo || undefined,
        rentaActual: partida.rentaActual || undefined,
        totalRentas: partida.totalRentas || undefined,
        periodoInicio: partida.periodoInicio || undefined,
        periodoFin: partida.periodoFin || undefined,
      });
      
      // Buscar o crear contrato
      const numeroContratoNorm = normalizarNumeroContrato(partida.numeroContrato!);
      let contrato = await db.getContratoByNumero(numeroContratoNorm);
      
      const esNuevo = !contrato;
      const esUltima = haTerminado(partida.rentaActual!, partida.totalRentas!);
      
      // Buscar cliente en la base de datos
      const cliente = await db.getClienteByNombre(nombreCliente);
      
      if (!contrato) {
        // Crear nuevo contrato
        const nuevoContrato: InsertContrato = {
          numeroContrato: numeroContratoNorm,
          clienteId: cliente?.id || null,
          nombreCliente,
          empresa,
          tipoServicio: partida.tipoServicio || 'ARRENDAMIENTO',
          descripcionActivo: partida.descripcionActivo || null,
          numeroSerie: partida.numeroSerie || null,
          totalRentas: partida.totalRentas!,
          rentaActual: partida.rentaActual!,
          montoMensual: monto.toString(),
          fechaInicio: partida.periodoInicio || null,
          fechaProximaRenta: calcularProximaRenta(partida.periodoFin),
          fechaTermino: calcularFechaTermino(partida.periodoFin, partida.rentaActual!, partida.totalRentas!),
          activo: !esUltima,
        };
        
        const contratoId = await db.upsertContrato(nuevoContrato);
        
        // Generar proyección mensual para el nuevo contrato
        if (!esUltima && contratoId) {
          await generarYGuardarProyeccion(
            contratoId,
            partida.rentaActual!,
            partida.totalRentas!,
            monto,
            calcularProximaRenta(partida.periodoFin)!
          );
        }
        
        contratosDetectados.push({
          numeroContrato: numeroContratoNorm,
          esNuevo: true,
          esUltimaRenta: esUltima,
          rentaActual: partida.rentaActual!,
          totalRentas: partida.totalRentas!,
          montoMensual: monto,
        });
      } else {
        // Actualizar contrato existente
        const cambios: Partial<InsertContrato> = {
          rentaActual: partida.rentaActual!,
          fechaProximaRenta: calcularProximaRenta(partida.periodoFin),
          activo: !esUltima,
        };
        
        // Si el monto cambió, actualizar
        if (Math.abs(Number(contrato.montoMensual) - monto) > 0.01) {
          cambios.montoMensual = monto.toString();
        }
        
        await db.updateContrato(numeroContratoNorm, cambios);
        
        // Regenerar proyección si el contrato sigue activo
        if (!esUltima) {
          await db.deleteProyeccionesByContrato(contrato.id);
          await generarYGuardarProyeccion(
            contrato.id,
            partida.rentaActual!,
            partida.totalRentas!,
            monto,
            calcularProximaRenta(partida.periodoFin)!
          );
        }
        
        contratosDetectados.push({
          numeroContrato: numeroContratoNorm,
          esNuevo: false,
          esUltimaRenta: esUltima,
          rentaActual: partida.rentaActual!,
          totalRentas: partida.totalRentas!,
          montoMensual: monto,
        });
      }
      
      // Vincular partida con contrato
      const contratoActualizado = await db.getContratoByNumero(numeroContratoNorm);
      if (contratoActualizado) {
        // Actualizar el contratoId en la partida
        // (esto requeriría una función adicional en db.ts)
      }
      
    } catch (error) {
      console.error(`Error procesando partida de contrato ${partida.numeroContrato}:`, error);
    }
  }
  
  return contratosDetectados;
}

/**
 * Calcula la próxima fecha de renta (mes siguiente)
 */
function calcularProximaRenta(periodoFin: Date | null): Date | null {
  if (!periodoFin) return null;
  
  const proxima = new Date(periodoFin);
  proxima.setMonth(proxima.getMonth() + 1);
  proxima.setDate(1); // Primer día del mes
  return proxima;
}

/**
 * Calcula la fecha de término del contrato
 */
function calcularFechaTermino(periodoFin: Date | null, rentaActual: number, totalRentas: number): Date | null {
  if (!periodoFin) return null;
  
  const rentasPendientes = totalRentas - rentaActual;
  const termino = new Date(periodoFin);
  termino.setMonth(termino.getMonth() + rentasPendientes);
  return termino;
}

/**
 * Genera y guarda la proyección mensual de un contrato
 */
async function generarYGuardarProyeccion(
  contratoId: number,
  rentaActual: number,
  totalRentas: number,
  montoMensual: number,
  fechaProximaRenta: Date
): Promise<void> {
  const proyeccion = generarProyeccionMensual(
    rentaActual,
    totalRentas,
    montoMensual,
    fechaProximaRenta
  );
  
  for (const p of proyeccion) {
    const proyeccionData: InsertProyeccionMensual = {
      contratoId,
      mes: p.mes,
      montoProyectado: p.montoProyectado.toString(),
      rentaNumero: p.rentaNumero,
      esUltimaRenta: p.esUltimaRenta,
    };
    
    await db.createProyeccion(proyeccionData);
  }
}

/**
 * Procesa un lote de facturas y actualiza contratos
 * Útil para procesamiento masivo de archivos XLSX
 */
export async function procesarLoteFacturas(
  facturas: Array<{
    id: number;
    descripcion: string;
    monto: number;
    nombreCliente: string;
    empresa: 'tim_transp' | 'tim_value';
    fecha: Date;
  }>
): Promise<{
  totalProcesadas: number;
  contratosNuevos: number;
  contratosActualizados: number;
  contratosFinalizados: number;
}> {
  let contratosNuevos = 0;
  let contratosActualizados = 0;
  let contratosFinalizados = 0;
  
  for (const factura of facturas) {
    const contratos = await procesarFacturaParaContratos(
      factura.id,
      factura.descripcion,
      factura.monto,
      factura.nombreCliente,
      factura.empresa,
      factura.fecha
    );
    
    for (const contrato of contratos) {
      if (contrato.esNuevo) {
        contratosNuevos++;
      } else {
        contratosActualizados++;
      }
      
      if (contrato.esUltimaRenta) {
        contratosFinalizados++;
      }
    }
  }
  
  return {
    totalProcesadas: facturas.length,
    contratosNuevos,
    contratosActualizados,
    contratosFinalizados,
  };
}

/**
 * Actualiza el monto real en la proyección cuando se factura una renta
 */
export async function marcarRentaFacturada(
  contratoId: number,
  rentaNumero: number,
  montoReal: number,
  facturaId: number
): Promise<void> {
  // Esta función requeriría una query específica en db.ts para actualizar
  // la proyección mensual con el monto real y el ID de la factura
  // Por ahora, dejamos el esqueleto de la función
}
