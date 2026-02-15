/**
 * Tipos de formato de moneda disponibles
 */
export type FormatoMoneda = "completo" | "miles" | "millones";

/**
 * Formatea un número como moneda según el formato especificado
 * @param valor - Número a formatear
 * @param formato - Tipo de formato (completo, miles, millones)
 * @returns String formateado con símbolo de pesos
 */
export function formatearMoneda(valor: number, formato: FormatoMoneda = "completo"): string {
  if (isNaN(valor) || valor === null || valor === undefined) {
    return "$0";
  }

  const esNegativo = valor < 0;
  const valorAbsoluto = Math.abs(valor);

  let resultado: string;

  switch (formato) {
    case "miles":
      // Formato: $2,230K (sin decimales)
      const enMiles = valorAbsoluto / 1000;
      resultado = `$${enMiles.toLocaleString("es-MX", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      })}K`;
      break;

    case "millones":
      // Formato: $2.23M (2 decimales)
      const enMillones = valorAbsoluto / 1000000;
      resultado = `$${enMillones.toLocaleString("es-MX", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}M`;
      break;

    case "completo":
    default:
      // Formato: $2,229,681 (sin decimales)
      resultado = `$${valorAbsoluto.toLocaleString("es-MX", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      })}`;
      break;
  }

  return esNegativo ? `-${resultado}` : resultado;
}

/**
 * Opciones de formato para mostrar en selector
 */
export const OPCIONES_FORMATO: { value: FormatoMoneda; label: string; ejemplo: string }[] = [
  {
    value: "completo",
    label: "Completo (sin decimales)",
    ejemplo: "$2,229,681",
  },
  {
    value: "miles",
    label: "Miles (K)",
    ejemplo: "$2,230K",
  },
  {
    value: "millones",
    label: "Millones (M)",
    ejemplo: "$2.23M",
  },
];
