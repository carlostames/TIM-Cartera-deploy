import { describe, it, expect } from 'vitest';

describe('Cálculo de Días de Atraso e Intereses Moratorios', () => {
  describe('Cálculo de días de atraso', () => {
    it('debe calcular días de atraso correctamente desde fecha de vencimiento', () => {
      const fechaVencimiento = new Date('2024-01-01');
      const hoy = new Date('2024-01-31');
      
      const diffTime = hoy.getTime() - fechaVencimiento.getTime();
      const diasAtraso = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
      
      expect(diasAtraso).toBe(30);
    });

    it('debe retornar 0 días si la fecha de vencimiento es futura', () => {
      const fechaVencimiento = new Date('2025-12-31');
      const hoy = new Date('2024-01-01');
      
      const diffTime = hoy.getTime() - fechaVencimiento.getTime();
      const diasAtraso = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
      
      expect(diasAtraso).toBe(0);
    });

    it('debe manejar fechas del mismo día correctamente', () => {
      const fechaVencimiento = new Date('2024-01-01');
      const hoy = new Date('2024-01-01');
      
      const diffTime = hoy.getTime() - fechaVencimiento.getTime();
      const diasAtraso = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
      
      expect(diasAtraso).toBe(0);
    });
  });

  describe('Cálculo de intereses moratorios', () => {
    it('debe calcular intereses con tasa 1.5% mensual para 30 días', () => {
      const saldoPendiente = 10000;
      const tasaInteresMoratorio = 1.5;
      const diasAtraso = 30;
      
      const intereses = saldoPendiente * (tasaInteresMoratorio / 100) * (diasAtraso / 30);
      
      expect(intereses).toBe(150); // 10000 * 0.015 * 1
    });

    it('debe calcular intereses para 60 días (2 meses)', () => {
      const saldoPendiente = 10000;
      const tasaInteresMoratorio = 1.5;
      const diasAtraso = 60;
      
      const intereses = saldoPendiente * (tasaInteresMoratorio / 100) * (diasAtraso / 30);
      
      expect(intereses).toBe(300); // 10000 * 0.015 * 2
    });

    it('debe calcular intereses para 15 días (medio mes)', () => {
      const saldoPendiente = 10000;
      const tasaInteresMoratorio = 1.5;
      const diasAtraso = 15;
      
      const intereses = saldoPendiente * (tasaInteresMoratorio / 100) * (diasAtraso / 30);
      
      expect(intereses).toBe(75); // 10000 * 0.015 * 0.5
    });

    it('debe retornar 0 intereses si la tasa es 0', () => {
      const saldoPendiente = 10000;
      const tasaInteresMoratorio = 0;
      const diasAtraso = 30;
      
      const intereses = saldoPendiente * (tasaInteresMoratorio / 100) * (diasAtraso / 30);
      
      expect(intereses).toBe(0);
    });

    it('debe retornar 0 intereses si no hay días de atraso', () => {
      const saldoPendiente = 10000;
      const tasaInteresMoratorio = 1.5;
      const diasAtraso = 0;
      
      const intereses = saldoPendiente * (tasaInteresMoratorio / 100) * (diasAtraso / 30);
      
      expect(intereses).toBe(0);
    });

    it('debe calcular intereses correctamente con tasa diferente', () => {
      const saldoPendiente = 5000;
      const tasaInteresMoratorio = 2.0;
      const diasAtraso = 45;
      
      const intereses = saldoPendiente * (tasaInteresMoratorio / 100) * (diasAtraso / 30);
      
      expect(intereses).toBe(150); // 5000 * 0.02 * 1.5
    });
  });

  describe('Casos de uso reales', () => {
    it('debe calcular correctamente para factura con 90 días de atraso y tasa 1.5%', () => {
      const saldoPendiente = 15000;
      const tasaInteresMoratorio = 1.5;
      const fechaVencimiento = new Date();
      fechaVencimiento.setDate(fechaVencimiento.getDate() - 90);
      
      const hoy = new Date();
      const diffTime = hoy.getTime() - fechaVencimiento.getTime();
      const diasAtraso = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
      const intereses = saldoPendiente * (tasaInteresMoratorio / 100) * (diasAtraso / 30);
      
      expect(diasAtraso).toBeGreaterThanOrEqual(89);
      expect(diasAtraso).toBeLessThanOrEqual(91);
      expect(intereses).toBeCloseTo(675, 0); // 15000 * 0.015 * 3
    });

    it('debe calcular correctamente para múltiples facturas', () => {
      const facturas = [
        { saldo: 10000, diasAtraso: 30 },
        { saldo: 5000, diasAtraso: 60 },
        { saldo: 8000, diasAtraso: 15 },
      ];
      const tasaInteresMoratorio = 1.5;
      
      let totalIntereses = 0;
      facturas.forEach(f => {
        const intereses = f.saldo * (tasaInteresMoratorio / 100) * (f.diasAtraso / 30);
        totalIntereses += intereses;
      });
      
      // 10000*0.015*1 + 5000*0.015*2 + 8000*0.015*0.5
      expect(totalIntereses).toBe(360);
    });
  });
});
