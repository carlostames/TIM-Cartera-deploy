import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function TablaProyeccion() {
  const currentYear = new Date().getFullYear();
  const [anioSeleccionado, setAnioSeleccionado] = useState(currentYear);
  const [empresaSeleccionada, setEmpresaSeleccionada] = useState<'todas' | 'tim_transp' | 'tim_value'>('todas');

  const { data: proyeccionData, isLoading } = trpc.proyeccion.proyeccionMatricial.useQuery({
    anio: anioSeleccionado,
    empresa: empresaSeleccionada,
  });

  const meses = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const exportarCSV = () => {
    if (!proyeccionData || proyeccionData.contratos.length === 0) {
      toast.error("No hay datos para exportar");
      return;
    }

    const headers = ["Contrato", "Razón Social", "Empresa", ...meses, "Total"];
    const rows = proyeccionData.contratos.map(contrato => {
      const montosM = Array.from({ length: 12 }, (_, i) => 
        (proyeccionData.datos as any)?.[contrato.id]?.[i + 1] || 0
      );
      const total = proyeccionData.totalesPorContrato?.[contrato.id] || 0;
      
      return [
        contrato.numeroContrato,
        contrato.nombreCliente,
        contrato.empresa === 'tim_transp' ? 'Tim Transp' : 'Tim Value',
        ...montosM.map(m => m.toFixed(2)),
        total.toFixed(2)
      ];
    });

    const totalesRow = [
      "",
      "",
      "TOTAL",
      ...Array.from({ length: 12 }, (_, i) => 
        (proyeccionData.totalesPorMes?.[i + 1] || 0).toFixed(2)
      ),
      Object.values(proyeccionData.totalesPorContrato || {}).reduce((sum, val) => sum + val, 0).toFixed(2)
    ];

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.join(",")),
      totalesRow.join(",")
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `proyeccion_${anioSeleccionado}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success("Tabla exportada exitosamente");
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Tabla de Proyección</h1>
          <p className="text-muted-foreground">
            Vista matricial de proyección de ingresos por contrato y mes
          </p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Proyección Anual</CardTitle>
                <CardDescription>
                  Visualiza la proyección de ingresos por contrato en formato de tabla
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={exportarCSV}
                  disabled={isLoading || !proyeccionData || proyeccionData.contratos.length === 0}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Exportar CSV
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium">Año:</label>
                  <Select
                    value={anioSeleccionado.toString()}
                    onValueChange={(value) => setAnioSeleccionado(parseInt(value))}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 5 }, (_, i) => currentYear + i - 2).map(year => (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium">Empresa:</label>
                  <Select
                    value={empresaSeleccionada}
                    onValueChange={(value: any) => setEmpresaSeleccionada(value)}
                  >
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todas">Todas</SelectItem>
                      <SelectItem value="tim_transp">Tim Transp</SelectItem>
                      <SelectItem value="tim_value">Tim Value</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : proyeccionData && proyeccionData.contratos.length > 0 ? (
                <div className="overflow-x-auto border rounded-lg">
                  <table className="w-full text-sm">
                    <thead className="bg-muted">
                      <tr>
                        <th className="px-3 py-2 text-left font-semibold sticky left-0 bg-muted z-10 border-r">
                          Contrato
                        </th>
                        <th className="px-3 py-2 text-left font-semibold sticky left-24 bg-muted z-10 border-r min-w-[200px]">
                          Razón Social
                        </th>
                        <th className="px-3 py-2 text-left font-semibold border-r">
                          Empresa
                        </th>
                        {meses.map((mes, idx) => (
                          <th
                            key={idx}
                            className="px-3 py-2 text-right font-semibold border-r min-w-[100px]"
                          >
                            {mes}
                          </th>
                        ))}
                        <th className="px-3 py-2 text-right font-semibold bg-muted/50">
                          Total
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {proyeccionData.contratos.map((contrato, idx) => {
                        const montosM = Array.from({ length: 12 }, (_, i) => 
                          (proyeccionData.datos as any)?.[contrato.id]?.[i + 1] || 0
                        );
                        const total = proyeccionData.totalesPorContrato?.[contrato.id] || 0;

                        return (
                          <tr
                            key={contrato.id}
                            className={idx % 2 === 0 ? 'bg-background' : 'bg-muted/30'}
                          >
                            <td className="px-3 py-2 sticky left-0 bg-inherit z-10 border-r font-medium">
                              {contrato.numeroContrato}
                            </td>
                            <td className="px-3 py-2 sticky left-24 bg-inherit z-10 border-r">
                              {contrato.nombreCliente}
                            </td>
                            <td className="px-3 py-2 border-r">
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                contrato.empresa === 'tim_transp' 
                                  ? 'bg-blue-100 text-blue-700' 
                                  : 'bg-green-100 text-green-700'
                              }`}>
                                {contrato.empresa === 'tim_transp' ? 'Tim Transp' : 'Tim Value'}
                              </span>
                            </td>
                            {montosM.map((monto, mesIdx) => (
                              <td
                                key={mesIdx}
                                className={`px-3 py-2 text-right border-r ${
                                  monto > 0 ? 'text-foreground' : 'text-muted-foreground'
                                }`}
                              >
                                {monto > 0 ? formatCurrency(monto) : '$0.00'}
                              </td>
                            ))}
                            <td className="px-3 py-2 text-right font-semibold bg-muted/30">
                              {formatCurrency(total)}
                            </td>
                          </tr>
                        );
                      })}
                      <tr className="bg-primary/10 font-bold border-t-2 border-primary">
                        <td className="px-3 py-3 sticky left-0 bg-primary/10 z-10 border-r" colSpan={3}>
                          TOTAL
                        </td>
                        {Array.from({ length: 12 }, (_, i) => {
                          const total = proyeccionData.totalesPorMes?.[i + 1] || 0;
                          return (
                            <td
                              key={i}
                              className="px-3 py-3 text-right border-r"
                            >
                              {formatCurrency(total)}
                            </td>
                          );
                        })}
                        <td className="px-3 py-3 text-right bg-primary/20">
                          {formatCurrency(
                            Object.values(proyeccionData.totalesPorContrato || {}).reduce((sum, val) => sum + val, 0)
                          )}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <p>No hay contratos activos para el año seleccionado</p>
                  <p className="text-sm mt-2">
                    Intenta seleccionar un año diferente o verifica que existan contratos activos
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
