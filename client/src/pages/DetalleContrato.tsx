import { useRoute } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeft, Calendar, Building2, User, FileText, Package } from "lucide-react";
import { useLocation } from "wouter";

export default function DetalleContrato() {
  const [, params] = useRoute("/proyeccion-contratos/:id");
  const [, setLocation] = useLocation();
  const contratoId = params?.id ? Number(params.id) : 0;

  const { data, isLoading } = trpc.proyeccionContratos.getDetalle.useQuery(
    { contratoId },
    { enabled: contratoId > 0 }
  );

  if (isLoading) {
    return (
      <div className="container py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3" />
          <div className="h-64 bg-muted rounded" />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="container py-8">
        <div className="text-center py-12">
          <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium">Contrato no encontrado</p>
          <Button className="mt-4" onClick={() => setLocation("/proyeccion-contratos")}>
            Volver a la lista
          </Button>
        </div>
      </div>
    );
  }

  const { contrato, lineItems, proyeccion } = data;

  // Calcular totales
  const totalPagoInicial = proyeccion
    .reduce((sum, p) => sum + Number(p.montoPagoInicial || 0), 0);
  const totalComisiones = proyeccion
    .reduce((sum, p) => sum + Number(p.montoComisiones || 0), 0);
  const totalRentas = proyeccion
    .reduce((sum, p) => sum + Number(p.montoRentaMensual || 0), 0);
  const totalValorResidual = proyeccion
    .reduce((sum, p) => sum + Number(p.montoValorResidual || 0), 0);
  const totalContrato = proyeccion
    .reduce((sum, p) => sum + Number(p.montoTotal || 0), 0);

  const rentasVencidas = proyeccion.filter((p) => p.estado === "vencido").length;
  const rentasPendientes = proyeccion.filter((p) => p.estado === "pendiente").length;

  return (
    <div className="container py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation("/proyeccion-contratos")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Contrato {contrato.numeroContrato}
            </h1>
            <p className="text-muted-foreground mt-1">
              Detalle completo del contrato de proyección
            </p>
          </div>
        </div>
        <Badge variant={contrato.estatus === "activo" ? "default" : "destructive"}>
          {contrato.estatus === "activo" ? "Activo" : "Cancelado"}
        </Badge>
      </div>

      {/* Información del Contrato */}
      <div className="grid gap-6 md:grid-cols-2 mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Información General</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Cliente</p>
                <p className="font-medium">{contrato.clienteNombre}</p>
              </div>
            </div>
            {contrato.vendedorNombre && (
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Vendedor</p>
                  <p className="font-medium">{contrato.vendedorNombre}</p>
                </div>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Empresa</p>
                <p className="font-medium">
                  {contrato.empresa === "tim_transp" ? "Tim Transp" : "Tim Value"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Tipo de Contrato</p>
                <p className="font-medium">
                  {contrato.tipoContrato === "arrendamiento_puro"
                    ? "Arrendamiento Puro"
                    : contrato.tipoContrato === "arrendamiento_financiero"
                    ? "Arrendamiento Financiero"
                    : "Crédito Simple"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Fecha de Inicio</p>
                <p className="font-medium">
                  {new Date(contrato.fechaInicio).toLocaleDateString()}
                </p>
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Plazo</p>
              <p className="font-medium">{contrato.plazo} meses</p>
            </div>
            {contrato.notas && (
              <div>
                <p className="text-sm text-muted-foreground">Notas</p>
                <p className="text-sm">{contrato.notas}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Resumen Financiero</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Pago Inicial Total</p>
              <p className="text-2xl font-bold">${totalPagoInicial.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Comisiones Totales</p>
              <p className="text-2xl font-bold">${totalComisiones.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Rentas Totales</p>
              <p className="text-2xl font-bold">${totalRentas.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Valor Residual</p>
              <p className="text-2xl font-bold">${totalValorResidual.toLocaleString()}</p>
            </div>
            <div className="pt-3 border-t">
              <p className="text-sm text-muted-foreground">Total del Contrato</p>
              <p className="text-3xl font-bold text-primary">
                ${totalContrato.toLocaleString()}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-3 border-t">
              <div>
                <p className="text-sm text-muted-foreground">Rentas Vencidas</p>
                <p className="text-lg font-semibold text-destructive">{rentasVencidas}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Rentas Pendientes</p>
                <p className="text-lg font-semibold text-blue-600">{rentasPendientes}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Equipos / Line Items */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Equipos / Conceptos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>Nombre del Equipo</TableHead>
                <TableHead className="text-right">Renta Mensual</TableHead>
                <TableHead className="text-right">Pago Inicial</TableHead>
                <TableHead className="text-right">Comisiones</TableHead>
                <TableHead className="text-right">Valor Residual</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lineItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.consecutivo}</TableCell>
                  <TableCell className="font-medium">{item.nombreEquipo}</TableCell>
                  <TableCell className="text-right">
                    ${Number(item.rentaMensualConIva || 0).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    ${Number(item.totalPagoInicialConIva || 0).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    ${Number(item.totalComisionesConIva || 0).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    ${Number(item.totalValorResidualConIva || 0).toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Proyección Mensual */}
      <Card>
        <CardHeader>
          <CardTitle>Proyección Mensual</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Renta #</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead className="text-right">Pago Inicial</TableHead>
                <TableHead className="text-right">Comisiones</TableHead>
                <TableHead className="text-right">Renta Mensual</TableHead>
                <TableHead className="text-right">Valor Residual</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {proyeccion.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>{p.numeroRenta}</TableCell>
                  <TableCell>
                    {new Date(p.mes).toLocaleDateString("es-MX", {
                      month: "short",
                      year: "numeric",
                    })}
                  </TableCell>
                  <TableCell className="text-right">
                    {Number(p.montoPagoInicial) > 0
                      ? `$${Number(p.montoPagoInicial).toLocaleString()}`
                      : "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    {Number(p.montoComisiones) > 0
                      ? `$${Number(p.montoComisiones).toLocaleString()}`
                      : "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    {Number(p.montoRentaMensual) > 0
                      ? `$${Number(p.montoRentaMensual).toLocaleString()}`
                      : "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    {Number(p.montoValorResidual) > 0
                      ? `$${Number(p.montoValorResidual).toLocaleString()}`
                      : "-"}
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    ${Number(p.montoTotal).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        p.estado === "vencido"
                          ? "destructive"
                          : p.estado === "pagado"
                          ? "default"
                          : "secondary"
                      }
                    >
                      {p.estado === "vencido"
                        ? "Vencido"
                        : p.estado === "pagado"
                        ? "Pagado"
                        : "Pendiente"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
