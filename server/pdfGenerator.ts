import PDFDocument from 'pdfkit';
import { Readable } from 'stream';

interface FacturaPendiente {
  folio: string;
  fecha: Date | null;
  importeTotal: string;
  diasAtraso: number | null;
  interesesMoratorios: string | null;
  sistema: 'tim_transp' | 'tim_value';
  clienteNombre?: string;
}

interface EstadoCuentaCliente {
  cliente: {
    nombre: string;
    rfc?: string | null;
    correoCobranza?: string | null;
    telefono?: string | null;
  };
  facturas: FacturaPendiente[];
  totalPendiente: number;
  totalIntereses: number;
  totalGeneral: number;
}

interface EstadoCuentaGrupo {
  grupo: {
    nombre: string;
    responsable?: string | null;
  };
  facturas: Array<FacturaPendiente & { clienteNombre: string }>;
  totalPendiente: number;
  totalIntereses: number;
  totalGeneral: number;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
  }).format(value);
}

function formatDate(date: Date | null): string {
  if (!date) return 'N/A';
  return new Intl.DateTimeFormat('es-MX', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(date));
}

export async function generarEstadoCuentaClientePDF(
  data: EstadoCuentaCliente
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'LETTER', margin: 50 });
    const chunks: Buffer[] = [];

    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    // Encabezado
    doc
      .fontSize(20)
      .font('Helvetica-Bold')
      .text('ESTADO DE CUENTA', { align: 'center' });
    
    doc.moveDown(0.5);
    doc
      .fontSize(10)
      .font('Helvetica')
      .text(`Fecha de emisión: ${formatDate(new Date())}`, { align: 'right' });

    doc.moveDown(1);

    // Información del cliente
    doc.fontSize(12).font('Helvetica-Bold').text('Datos del Cliente');
    doc.moveDown(0.3);
    doc.fontSize(10).font('Helvetica');
    doc.text(`Nombre: ${data.cliente.nombre}`);
    if (data.cliente.rfc) doc.text(`RFC: ${data.cliente.rfc}`);
    if (data.cliente.correoCobranza) doc.text(`Correo: ${data.cliente.correoCobranza}`);
    if (data.cliente.telefono) doc.text(`Teléfono: ${data.cliente.telefono}`);

    doc.moveDown(1.5);

    // Tabla de facturas
    doc.fontSize(12).font('Helvetica-Bold').text('Facturas Pendientes');
    doc.moveDown(0.5);

    const tableTop = doc.y;
    const colWidths = {
      folio: 80,
      fecha: 70,
      sistema: 60,
      importe: 80,
      dias: 50,
      intereses: 80,
      total: 80,
    };

    // Encabezados de tabla
    doc.fontSize(9).font('Helvetica-Bold');
    let x = 50;
    doc.text('Folio', x, tableTop, { width: colWidths.folio, align: 'left' });
    x += colWidths.folio;
    doc.text('Fecha', x, tableTop, { width: colWidths.fecha, align: 'left' });
    x += colWidths.fecha;
    doc.text('Sistema', x, tableTop, { width: colWidths.sistema, align: 'left' });
    x += colWidths.sistema;
    doc.text('Importe', x, tableTop, { width: colWidths.importe, align: 'right' });
    x += colWidths.importe;
    doc.text('Días', x, tableTop, { width: colWidths.dias, align: 'right' });
    x += colWidths.dias;
    doc.text('Intereses', x, tableTop, { width: colWidths.intereses, align: 'right' });
    x += colWidths.intereses;
    doc.text('Total', x, tableTop, { width: colWidths.total, align: 'right' });

    doc.moveDown(0.3);
    doc.moveTo(50, doc.y).lineTo(562, doc.y).stroke();
    doc.moveDown(0.3);

    // Filas de facturas
    doc.fontSize(8).font('Helvetica');
    data.facturas.forEach((factura) => {
      const rowY = doc.y;
      
      // Verificar si necesitamos nueva página
      if (rowY > 700) {
        doc.addPage();
        doc.y = 50;
      }

      const importe = Number(factura.importeTotal || 0);
      const intereses = Number(factura.interesesMoratorios || 0);
      const total = importe + intereses;

      x = 50;
      doc.text(factura.folio, x, doc.y, { width: colWidths.folio, align: 'left' });
      x += colWidths.folio;
      doc.text(formatDate(factura.fecha), x, rowY, { width: colWidths.fecha, align: 'left' });
      x += colWidths.fecha;
      doc.text(factura.sistema === 'tim_transp' ? 'TT' : 'TV', x, rowY, {
        width: colWidths.sistema,
        align: 'left',
      });
      x += colWidths.sistema;
      doc.text(formatCurrency(importe), x, rowY, { width: colWidths.importe, align: 'right' });
      x += colWidths.importe;
      doc.text(String(factura.diasAtraso || 0), x, rowY, { width: colWidths.dias, align: 'right' });
      x += colWidths.dias;
      doc.text(formatCurrency(intereses), x, rowY, { width: colWidths.intereses, align: 'right' });
      x += colWidths.intereses;
      doc.text(formatCurrency(total), x, rowY, { width: colWidths.total, align: 'right' });

      doc.moveDown(0.8);
    });

    doc.moveDown(0.5);
    doc.moveTo(50, doc.y).lineTo(562, doc.y).stroke();
    doc.moveDown(0.5);

    // Totales
    doc.fontSize(10).font('Helvetica-Bold');
    const totalsX = 400;
    doc.text('Subtotal:', totalsX, doc.y, { width: 80, align: 'left' });
    doc.text(formatCurrency(data.totalPendiente), totalsX + 80, doc.y, {
      width: 82,
      align: 'right',
    });
    doc.moveDown(0.5);

    doc.text('Intereses Moratorios:', totalsX, doc.y, { width: 80, align: 'left' });
    doc.text(formatCurrency(data.totalIntereses), totalsX + 80, doc.y, {
      width: 82,
      align: 'right',
    });
    doc.moveDown(0.5);

    doc.fontSize(12);
    doc.text('TOTAL:', totalsX, doc.y, { width: 80, align: 'left' });
    doc.text(formatCurrency(data.totalGeneral), totalsX + 80, doc.y, {
      width: 82,
      align: 'right',
    });

    // Pie de página
    doc.moveDown(3);
    doc
      .fontSize(8)
      .font('Helvetica')
      .text(
        'Este documento es un estado de cuenta informativo. Para cualquier aclaración, favor de contactar al área de cobranza.',
        50,
        doc.y,
        { align: 'center', width: 512 }
      );

    doc.end();
  });
}

export async function generarEstadoCuentaGrupoPDF(
  data: EstadoCuentaGrupo
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'LETTER', margin: 50 });
    const chunks: Buffer[] = [];

    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    // Encabezado
    doc
      .fontSize(20)
      .font('Helvetica-Bold')
      .text('ESTADO DE CUENTA CONSOLIDADO', { align: 'center' });
    
    doc.moveDown(0.5);
    doc
      .fontSize(10)
      .font('Helvetica')
      .text(`Fecha de emisión: ${formatDate(new Date())}`, { align: 'right' });

    doc.moveDown(1);

    // Información del grupo
    doc.fontSize(12).font('Helvetica-Bold').text('Datos del Grupo');
    doc.moveDown(0.3);
    doc.fontSize(10).font('Helvetica');
    doc.text(`Grupo: ${data.grupo.nombre}`);
    if (data.grupo.responsable) doc.text(`Responsable: ${data.grupo.responsable}`);

    doc.moveDown(1.5);

    // Tabla de facturas
    doc.fontSize(12).font('Helvetica-Bold').text('Facturas Pendientes');
    doc.moveDown(0.5);

    const tableTop = doc.y;
    const colWidths = {
      cliente: 100,
      folio: 70,
      fecha: 65,
      importe: 70,
      dias: 40,
      intereses: 70,
      total: 70,
    };

    // Encabezados de tabla
    doc.fontSize(9).font('Helvetica-Bold');
    let x = 50;
    doc.text('Cliente', x, tableTop, { width: colWidths.cliente, align: 'left' });
    x += colWidths.cliente;
    doc.text('Folio', x, tableTop, { width: colWidths.folio, align: 'left' });
    x += colWidths.folio;
    doc.text('Fecha', x, tableTop, { width: colWidths.fecha, align: 'left' });
    x += colWidths.fecha;
    doc.text('Importe', x, tableTop, { width: colWidths.importe, align: 'right' });
    x += colWidths.importe;
    doc.text('Días', x, tableTop, { width: colWidths.dias, align: 'right' });
    x += colWidths.dias;
    doc.text('Intereses', x, tableTop, { width: colWidths.intereses, align: 'right' });
    x += colWidths.intereses;
    doc.text('Total', x, tableTop, { width: colWidths.total, align: 'right' });

    doc.moveDown(0.3);
    doc.moveTo(50, doc.y).lineTo(562, doc.y).stroke();
    doc.moveDown(0.3);

    // Filas de facturas
    doc.fontSize(8).font('Helvetica');
    data.facturas.forEach((factura) => {
      const rowY = doc.y;
      
      // Verificar si necesitamos nueva página
      if (rowY > 700) {
        doc.addPage();
        doc.y = 50;
      }

      const importe = Number(factura.importeTotal || 0);
      const intereses = Number(factura.interesesMoratorios || 0);
      const total = importe + intereses;

      x = 50;
      doc.text(factura.clienteNombre || '', x, doc.y, {
        width: colWidths.cliente,
        align: 'left',
      });
      x += colWidths.cliente;
      doc.text(factura.folio, x, rowY, { width: colWidths.folio, align: 'left' });
      x += colWidths.folio;
      doc.text(formatDate(factura.fecha), x, rowY, { width: colWidths.fecha, align: 'left' });
      x += colWidths.fecha;
      doc.text(formatCurrency(importe), x, rowY, { width: colWidths.importe, align: 'right' });
      x += colWidths.importe;
      doc.text(String(factura.diasAtraso || 0), x, rowY, { width: colWidths.dias, align: 'right' });
      x += colWidths.dias;
      doc.text(formatCurrency(intereses), x, rowY, { width: colWidths.intereses, align: 'right' });
      x += colWidths.intereses;
      doc.text(formatCurrency(total), x, rowY, { width: colWidths.total, align: 'right' });

      doc.moveDown(0.8);
    });

    doc.moveDown(0.5);
    doc.moveTo(50, doc.y).lineTo(562, doc.y).stroke();
    doc.moveDown(0.5);

    // Totales
    doc.fontSize(10).font('Helvetica-Bold');
    const totalsX = 400;
    doc.text('Subtotal:', totalsX, doc.y, { width: 80, align: 'left' });
    doc.text(formatCurrency(data.totalPendiente), totalsX + 80, doc.y, {
      width: 82,
      align: 'right',
    });
    doc.moveDown(0.5);

    doc.text('Intereses Moratorios:', totalsX, doc.y, { width: 80, align: 'left' });
    doc.text(formatCurrency(data.totalIntereses), totalsX + 80, doc.y, {
      width: 82,
      align: 'right',
    });
    doc.moveDown(0.5);

    doc.fontSize(12);
    doc.text('TOTAL:', totalsX, doc.y, { width: 80, align: 'left' });
    doc.text(formatCurrency(data.totalGeneral), totalsX + 80, doc.y, {
      width: 82,
      align: 'right',
    });

    // Pie de página
    doc.moveDown(3);
    doc
      .fontSize(8)
      .font('Helvetica')
      .text(
        'Este documento es un estado de cuenta consolidado informativo. Para cualquier aclaración, favor de contactar al área de cobranza.',
        50,
        doc.y,
        { align: 'center', width: 512 }
      );

    doc.end();
  });
}
