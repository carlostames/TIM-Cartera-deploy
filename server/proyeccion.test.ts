import { describe, expect, it } from "vitest";
import {
  parsearPartida,
  esDescripcionValida,
  generarProyeccionMensual,
  normalizarNumeroContrato,
  esContratoNuevo,
  haTerminado,
} from "./partidaParser";

describe("Parser de Partidas", () => {
  describe("parsearPartida", () => {
    it("debe parsear correctamente una descripción completa", () => {
      const descripcion =
        "ARRENDAMIENTO - CHEVROLET - AVEO - 2022 - NS:045603 - EXP:166: RENTA 36 DE 36 DEL 01 de enero de 2025 AL 31 de enero de 2025";

      const resultado = parsearPartida(descripcion);

      expect(resultado.tipoServicio).toBe("ARRENDAMIENTO");
      expect(resultado.descripcionActivo).toBe("CHEVROLET - AVEO - 2022");
      expect(resultado.numeroSerie).toBe("045603");
      expect(resultado.numeroContrato).toBe("166");
      expect(resultado.rentaActual).toBe(36);
      expect(resultado.totalRentas).toBe(36);
      expect(resultado.periodoInicio).toBeInstanceOf(Date);
      expect(resultado.periodoFin).toBeInstanceOf(Date);
    });

    it("debe parsear descripción con diferentes formatos de fecha", () => {
      const descripcion =
        "ARRENDAMIENTO - FORD - FOCUS - 2021 - NS:123456 - EXP:200: RENTA 12 DE 48 DEL 15/02/2025 AL 15/03/2025";

      const resultado = parsearPartida(descripcion);

      expect(resultado.rentaActual).toBe(12);
      expect(resultado.totalRentas).toBe(48);
      expect(resultado.numeroContrato).toBe("200");
    });

    it("debe manejar descripciones sin número de serie", () => {
      const descripcion =
        "ARRENDAMIENTO - NISSAN - VERSA - 2023 - EXP:300: RENTA 1 DE 24 DEL 01/01/2025 AL 31/01/2025";

      const resultado = parsearPartida(descripcion);

      expect(resultado.numeroSerie).toBeNull();
      expect(resultado.numeroContrato).toBe("300");
      expect(resultado.rentaActual).toBe(1);
    });

    it("debe manejar descripciones con formato de activo complejo", () => {
      const descripcion =
        "ARRENDAMIENTO - VOLKSWAGEN - JETTA COMFORTLINE 2.0L - 2024 - NS:789012 - EXP:450: RENTA 6 DE 60 DEL 01/06/2025 AL 30/06/2025";

      const resultado = parsearPartida(descripcion);

      expect(resultado.descripcionActivo).toBe(
        "VOLKSWAGEN - JETTA COMFORTLINE 2.0L - 2024"
      );
      expect(resultado.rentaActual).toBe(6);
      expect(resultado.totalRentas).toBe(60);
    });
  });

  describe("esDescripcionValida", () => {
    it("debe validar descripción completa", () => {
      const partida = {
        tipoServicio: "ARRENDAMIENTO",
        descripcionActivo: "CHEVROLET - AVEO - 2022",
        numeroSerie: "045603",
        numeroContrato: "166",
        rentaActual: 36,
        totalRentas: 36,
        periodoInicio: new Date("2025-01-01"),
        periodoFin: new Date("2025-01-31"),
        esArrendamiento: true,
      };

      expect(esDescripcionValida(partida)).toBe(true);
    });

    it("debe rechazar descripción sin número de contrato", () => {
      const partida = {
        tipoServicio: "ARRENDAMIENTO",
        descripcionActivo: "CHEVROLET - AVEO - 2022",
        numeroSerie: null,
        numeroContrato: null,
        rentaActual: 36,
        totalRentas: 36,
        periodoInicio: new Date("2025-01-01"),
        periodoFin: new Date("2025-01-31"),
        esArrendamiento: true,
      };

      expect(esDescripcionValida(partida)).toBe(false);
    });

    it("debe rechazar descripción sin rentas", () => {
      const partida = {
        tipoServicio: "ARRENDAMIENTO",
        descripcionActivo: "CHEVROLET - AVEO - 2022",
        numeroSerie: "045603",
        numeroContrato: "166",
        rentaActual: null,
        totalRentas: null,
        periodoInicio: new Date("2025-01-01"),
        periodoFin: new Date("2025-01-31"),
        esArrendamiento: true,
      };

      expect(esDescripcionValida(partida)).toBe(false);
    });
  });

  describe("generarProyeccionMensual", () => {
    it("debe generar proyección para contrato con rentas pendientes", () => {
      const rentaActual = 10;
      const totalRentas = 36;
      const montoMensual = 5000;
      const fechaProximaRenta = new Date("2025-02-01");

      const proyeccion = generarProyeccionMensual(
        rentaActual,
        totalRentas,
        montoMensual,
        fechaProximaRenta
      );

      expect(proyeccion).toHaveLength(26); // 36 - 10 = 26 rentas pendientes
      expect(proyeccion[0].rentaNumero).toBe(11);
      expect(proyeccion[0].montoProyectado).toBe(5000);
      expect(proyeccion[0].esUltimaRenta).toBe(false);
      expect(proyeccion[25].rentaNumero).toBe(36);
      expect(proyeccion[25].esUltimaRenta).toBe(true);
    });

    it("debe generar proyección para contrato nuevo", () => {
      const rentaActual = 0;
      const totalRentas = 12;
      const montoMensual = 3000;
      const fechaProximaRenta = new Date("2025-01-01");

      const proyeccion = generarProyeccionMensual(
        rentaActual,
        totalRentas,
        montoMensual,
        fechaProximaRenta
      );

      expect(proyeccion).toHaveLength(12);
      expect(proyeccion[0].rentaNumero).toBe(1);
      expect(proyeccion[11].rentaNumero).toBe(12);
      expect(proyeccion[11].esUltimaRenta).toBe(true);
    });

    it("debe generar proyección con fechas correctas", () => {
      const rentaActual = 5;
      const totalRentas = 10;
      const montoMensual = 4000;
      const fechaProximaRenta = new Date("2025-03-01");

      const proyeccion = generarProyeccionMensual(
        rentaActual,
        totalRentas,
        montoMensual,
        fechaProximaRenta
      );

      expect(proyeccion).toHaveLength(5);
      
      // Verificar que cada mes es el siguiente
      const primerMes = proyeccion[0].mes;
      const segundoMes = proyeccion[1].mes;
      
      expect(segundoMes.getMonth()).toBe((primerMes.getMonth() + 1) % 12);
    });

    it("no debe generar proyección para contrato terminado", () => {
      const rentaActual = 36;
      const totalRentas = 36;
      const montoMensual = 5000;
      const fechaProximaRenta = new Date("2025-02-01");

      const proyeccion = generarProyeccionMensual(
        rentaActual,
        totalRentas,
        montoMensual,
        fechaProximaRenta
      );

      expect(proyeccion).toHaveLength(0);
    });
  });

  describe("normalizarNumeroContrato", () => {
    it("debe normalizar número de contrato con ceros a la izquierda", () => {
      expect(normalizarNumeroContrato("0166")).toBe("166");
      expect(normalizarNumeroContrato("00050")).toBe("50");
    });

    it("debe mantener número de contrato sin ceros", () => {
      expect(normalizarNumeroContrato("166")).toBe("166");
      expect(normalizarNumeroContrato("1234")).toBe("1234");
    });

    it("debe manejar números de contrato con letras", () => {
      expect(normalizarNumeroContrato("EXP166")).toBe("EXP166");
      // La función actual no normaliza dentro de strings complejos
      expect(normalizarNumeroContrato("C-0050")).toBe("C-0050");
    });
  });

  describe("esContratoNuevo", () => {
    it("debe detectar contrato nuevo (renta 1)", () => {
      expect(esContratoNuevo(1)).toBe(true);
    });

    it("debe detectar contrato existente", () => {
      expect(esContratoNuevo(5)).toBe(false);
      expect(esContratoNuevo(36)).toBe(false);
    });

    it("debe manejar renta 0 como no nuevo", () => {
      // Renta 0 significa que aún no se ha facturado la primera renta
      expect(esContratoNuevo(0)).toBe(false);
    });
  });

  describe("haTerminado", () => {
    it("debe detectar contrato terminado", () => {
      expect(haTerminado(36, 36)).toBe(true);
      expect(haTerminado(12, 12)).toBe(true);
    });

    it("debe detectar contrato activo", () => {
      expect(haTerminado(35, 36)).toBe(false);
      expect(haTerminado(1, 36)).toBe(false);
      expect(haTerminado(20, 48)).toBe(false);
    });

    it("debe manejar casos edge", () => {
      expect(haTerminado(0, 36)).toBe(false);
      expect(haTerminado(37, 36)).toBe(true); // Caso anómalo pero debe manejarse
    });
  });

  describe("Casos de integración", () => {
    it("debe procesar flujo completo de una partida", () => {
      const descripcion =
        "ARRENDAMIENTO - TOYOTA - COROLLA - 2023 - NS:555666 - EXP:777: RENTA 18 DE 48 DEL 01/02/2025 AL 28/02/2025";

      // 1. Parsear
      const partida = parsearPartida(descripcion);
      
      // 2. Validar
      expect(esDescripcionValida(partida)).toBe(true);
      
      // 3. Verificar estado
      expect(esContratoNuevo(partida.rentaActual!)).toBe(false);
      expect(haTerminado(partida.rentaActual!, partida.totalRentas!)).toBe(false);
      
      // 4. Generar proyección
      const proyeccion = generarProyeccionMensual(
        partida.rentaActual!,
        partida.totalRentas!,
        4500,
        new Date("2025-03-01")
      );
      
      expect(proyeccion).toHaveLength(30); // 48 - 18 = 30 rentas pendientes
      expect(proyeccion[0].rentaNumero).toBe(19);
      expect(proyeccion[29].rentaNumero).toBe(48);
      expect(proyeccion[29].esUltimaRenta).toBe(true);
    });

    it("debe manejar última renta correctamente", () => {
      const descripcion =
        "ARRENDAMIENTO - HONDA - CIVIC - 2022 - NS:999888 - EXP:888: RENTA 24 DE 24 DEL 01/12/2025 AL 31/12/2025";

      const partida = parsearPartida(descripcion);
      
      expect(esDescripcionValida(partida)).toBe(true);
      expect(haTerminado(partida.rentaActual!, partida.totalRentas!)).toBe(true);
      
      const proyeccion = generarProyeccionMensual(
        partida.rentaActual!,
        partida.totalRentas!,
        6000,
        new Date("2026-01-01")
      );
      
      expect(proyeccion).toHaveLength(0); // No hay rentas pendientes
    });
  });
});
