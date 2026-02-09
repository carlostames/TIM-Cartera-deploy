import ExcelJS from 'exceljs';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function generateTemplates() {
  const outputDir = path.join(__dirname, '../client/public/templates');
  
  // Crear directorio si no existe
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // ========== Plantilla Tim Transp ==========
  const workbookTimTransp = new ExcelJS.Workbook();
  const worksheetTimTransp = workbookTimTransp.addWorksheet('Facturas Tim Transp');
  
  // Encabezados
  worksheetTimTransp.columns = [
    { header: 'Folio', key: 'folio', width: 15 },
    { header: 'Cliente', key: 'cliente', width: 40 },
    { header: 'Fecha', key: 'fecha', width: 12 },
    { header: 'Importe Total', key: 'importeTotal', width: 15 },
    { header: 'Descripción', key: 'descripcion', width: 80 },
  ];
  
  // Estilo de encabezados
  worksheetTimTransp.getRow(1).font = { bold: true };
  worksheetTimTransp.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF4472C4' }
  };
  worksheetTimTransp.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  
  // Datos de ejemplo
  worksheetTimTransp.addRow({
    folio: 'AB6599',
    cliente: 'EMBUTIDOS SAN LUIS',
    fecha: new Date('2025-01-01'),
    importeTotal: 7920.49,
    descripcion: '200342SCT - CLUB TIM: , 14 DE 36'
  });
  
  worksheetTimTransp.addRow({
    folio: 'AB6600',
    cliente: 'AUTOEDICIONES DEL POTOSI',
    fecha: new Date('2025-01-02'),
    importeTotal: 8340.00,
    descripcion: 'ARRENDAMIENTO - CHEVROLET - AVEO - 2022 - NS:045603 - EXP:166: RENTA 36 DE 36 DEL 01 de enero de 2025 AL 31 de enero de 2025'
  });
  
  // Formato de columnas
  worksheetTimTransp.getColumn('fecha').numFmt = 'dd/mm/yyyy';
  worksheetTimTransp.getColumn('importeTotal').numFmt = '$#,##0.00';
  
  await workbookTimTransp.xlsx.writeFile(path.join(outputDir, 'plantilla_tim_transp.xlsx'));
  console.log('✓ Plantilla Tim Transp creada');

  // ========== Plantilla Tim Value ==========
  const workbookTimValue = new ExcelJS.Workbook();
  const worksheetTimValue = workbookTimValue.addWorksheet('Facturas Tim Value');
  
  // Encabezados
  worksheetTimValue.columns = [
    { header: 'Folio', key: 'folio', width: 15 },
    { header: 'Cliente', key: 'cliente', width: 40 },
    { header: 'Fecha', key: 'fecha', width: 12 },
    { header: 'Importe Total', key: 'importeTotal', width: 15 },
    { header: 'Descripción', key: 'descripcion', width: 80 },
  ];
  
  // Estilo de encabezados
  worksheetTimValue.getRow(1).font = { bold: true };
  worksheetTimValue.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF70AD47' }
  };
  worksheetTimValue.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  
  // Datos de ejemplo
  worksheetTimValue.addRow({
    folio: 'AA1234',
    cliente: 'PANADERIA LA SUPERIOR',
    fecha: new Date('2025-01-01'),
    importeTotal: 10090.00,
    descripcion: 'ARRENDAMIENTO - TOYOTA - HILUX - 2023 - NS:123456 - EXP:200: RENTA 12 DE 36 DEL 01 de enero de 2025 AL 31 de enero de 2025'
  });
  
  worksheetTimValue.addRow({
    folio: 'AA1235',
    cliente: 'COEDESSA',
    fecha: new Date('2025-01-02'),
    importeTotal: 13310.00,
    descripcion: '200205SCT - CLUB TIM: , 24 DE 36'
  });
  
  // Formato de columnas
  worksheetTimValue.getColumn('fecha').numFmt = 'dd/mm/yyyy';
  worksheetTimValue.getColumn('importeTotal').numFmt = '$#,##0.00';
  
  await workbookTimValue.xlsx.writeFile(path.join(outputDir, 'plantilla_tim_value.xlsx'));
  console.log('✓ Plantilla Tim Value creada');

  // ========== Plantilla Pendientes de Pago ==========
  const workbookPendientes = new ExcelJS.Workbook();
  const worksheetPendientes = workbookPendientes.addWorksheet('Pendientes de Pago');
  
  // Encabezados
  worksheetPendientes.columns = [
    { header: 'Folio', key: 'folio', width: 15 },
    { header: 'Cliente', key: 'cliente', width: 40 },
    { header: 'Alias', key: 'alias', width: 30 },
    { header: 'Descripción', key: 'descripcion', width: 80 },
    { header: 'Días Vencido', key: 'diasVencido', width: 15 },
    { header: 'Saldo', key: 'saldo', width: 15 },
  ];
  
  // Estilo de encabezados
  worksheetPendientes.getRow(1).font = { bold: true };
  worksheetPendientes.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFED7D31' }
  };
  worksheetPendientes.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  
  // Datos de ejemplo
  worksheetPendientes.addRow({
    folio: 'AB6599',
    cliente: 'EMBUTIDOS SAN LUIS',
    alias: 'EMBUTIDOS',
    descripcion: 'Factura pendiente de pago',
    diasVencido: 15,
    saldo: 7920.49
  });
  
  worksheetPendientes.addRow({
    folio: 'AA1234',
    cliente: 'PANADERIA LA SUPERIOR',
    alias: 'PANADERIA',
    descripcion: 'Factura vencida',
    diasVencido: 30,
    saldo: 10090.00
  });
  
  // Formato de columnas
  worksheetPendientes.getColumn('saldo').numFmt = '$#,##0.00';
  
  await workbookPendientes.xlsx.writeFile(path.join(outputDir, 'plantilla_pendientes.xlsx'));
  console.log('✓ Plantilla Pendientes de Pago creada');

  console.log('\n✅ Todas las plantillas creadas exitosamente en:', outputDir);
}

generateTemplates().catch(console.error);
