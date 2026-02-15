import { describe, it, expect } from 'vitest';
import { formatearMoneda, OPCIONES_FORMATO } from '../shared/formatoMoneda';

describe('Sistema de Formateo de Moneda', () => {
  const testValue = 2229680.79;

  describe('formatearMoneda', () => {
    it('debe formatear en modo completo sin decimales', () => {
      const result = formatearMoneda(testValue, 'completo');
      expect(result).toBe('$2,229,681');
    });

    it('debe formatear en modo miles (K)', () => {
      const result = formatearMoneda(testValue, 'miles');
      expect(result).toBe('$2,230K');
    });

    it('debe formatear en modo millones (M)', () => {
      const result = formatearMoneda(testValue, 'millones');
      expect(result).toBe('$2.23M');
    });

    it('debe manejar valores negativos correctamente', () => {
      const negativeValue = -1500.50;
      expect(formatearMoneda(negativeValue, 'completo')).toBe('-$1,501');
      expect(formatearMoneda(negativeValue, 'miles')).toBe('-$2K');
      expect(formatearMoneda(negativeValue, 'millones')).toBe('-$0.00M');
    });

    it('debe manejar cero correctamente', () => {
      expect(formatearMoneda(0, 'completo')).toBe('$0');
      expect(formatearMoneda(0, 'miles')).toBe('$0K');
      expect(formatearMoneda(0, 'millones')).toBe('$0.00M');
    });

    it('debe manejar valores inválidos', () => {
      expect(formatearMoneda(NaN, 'completo')).toBe('$0');
      expect(formatearMoneda(null as any, 'completo')).toBe('$0');
      expect(formatearMoneda(undefined as any, 'completo')).toBe('$0');
    });

    it('debe usar formato completo por defecto', () => {
      const result = formatearMoneda(testValue);
      expect(result).toBe('$2,229,681');
    });
  });

  describe('OPCIONES_FORMATO', () => {
    it('debe tener 3 opciones de formato', () => {
      expect(OPCIONES_FORMATO).toHaveLength(3);
    });

    it('debe incluir todas las opciones requeridas', () => {
      const valores = OPCIONES_FORMATO.map(o => o.value);
      expect(valores).toContain('completo');
      expect(valores).toContain('miles');
      expect(valores).toContain('millones');
    });

    it('cada opción debe tener label y ejemplo', () => {
      OPCIONES_FORMATO.forEach(opcion => {
        expect(opcion.label).toBeTruthy();
        expect(opcion.ejemplo).toBeTruthy();
        expect(opcion.ejemplo).toMatch(/^\$/);
      });
    });
  });

  describe('Casos de uso reales', () => {
    it('debe formatear correctamente montos pequeños', () => {
      const small = 123.45;
      expect(formatearMoneda(small, 'completo')).toBe('$123');
      expect(formatearMoneda(small, 'miles')).toBe('$0K');
      expect(formatearMoneda(small, 'millones')).toBe('$0.00M');
    });

    it('debe formatear correctamente montos medianos', () => {
      const medium = 45678.90;
      expect(formatearMoneda(medium, 'completo')).toBe('$45,679');
      expect(formatearMoneda(medium, 'miles')).toBe('$46K');
      expect(formatearMoneda(medium, 'millones')).toBe('$0.05M');
    });

    it('debe formatear correctamente montos grandes', () => {
      const large = 9876543.21;
      expect(formatearMoneda(large, 'completo')).toBe('$9,876,543');
      expect(formatearMoneda(large, 'miles')).toBe('$9,877K');
      expect(formatearMoneda(large, 'millones')).toBe('$9.88M');
    });
  });
});
