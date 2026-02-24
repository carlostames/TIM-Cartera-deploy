import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, Calculator } from "lucide-react";
import { toast } from "sonner";

interface LineItem {
  nombreEquipo: string;
  precioEquipoSinIva: number;
  pagoInicialSinIva: number;
  comisionesSinIva: number;
  valorResidualSinIva: number;
  mensualidadBaseSinIva?: number;
  serviciosAdicionalesSinIva?: number;
  tasaInteresAnual?: number;
}

const IVA_RATE = 0.16;

function calcularIVA(monto: number): number {
  return Number((monto * IVA_RATE).toFixed(2));
}

function calcularTotalConIVA(monto: number): number {
  return Number((monto * (1 + IVA_RATE)).toFixed(2));
}

export function NuevoContratoDialog({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [numeroContrato, setNumeroContrato] = useState("");
  const [clienteId, setClienteId] = useState<string>("");
  const [vendedorId, setVendedorId] = useState<string>("");
  const [empresa, setEmpresa] = useState<"tim_transp" | "tim_value">("tim_transp");
  const [tipoContrato, setTipoContrato] = useState<
    "arrendamiento_puro" | "arrendamiento_financiero" | "credito_simple"
  >("arrendamiento_puro");
  const [fechaInicio, setFechaInicio] = useState("");
  const [plazo, setPlazo] = useState<string>("24");
  const [notas, setNotas] = useState("");
  const [lineItems, setLineItems] = useState<LineItem[]>([
    {
      nombreEquipo: "",
      precioEquipoSinIva: 0,
      pagoInicialSinIva: 0,
      comisionesSinIva: 0,
      valorResidualSinIva: 0,
      mensualidadBaseSinIva: 0,
      serviciosAdicionalesSinIva: 0,
    },
  ]);

  const { data: clientes } = trpc.clientes.list.useQuery();
  const { data: vendedores } = trpc.proyeccionContratos.listVendedores.useQuery();
  const utils = trpc.useUtils();

  const createContrato = trpc.proyeccionContratos.create.useMutation({
    onSuccess: () => {
      toast.success("Contrato creado exitosamente");
      utils.proyeccionContratos.list.invalidate();
      setOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error(error.message || "Error al crear el contrato");
    },
  });

  const resetForm = () => {
    setNumeroContrato("");
    setClienteId("");
    setVendedorId("");
    setEmpresa("tim_transp");
    setTipoContrato("arrendamiento_puro");
    setFechaInicio("");
    setPlazo("24");
    setNotas("");
    setLineItems([
      {
        nombreEquipo: "",
        precioEquipoSinIva: 0,
        pagoInicialSinIva: 0,
        comisionesSinIva: 0,
        valorResidualSinIva: 0,
        mensualidadBaseSinIva: 0,
        serviciosAdicionalesSinIva: 0,
      },
    ]);
  };

  const agregarLineItem = () => {
    setLineItems([
      ...lineItems,
      {
        nombreEquipo: "",
        precioEquipoSinIva: 0,
        pagoInicialSinIva: 0,
        comisionesSinIva: 0,
        valorResidualSinIva: 0,
        mensualidadBaseSinIva: tipoContrato === "arrendamiento_puro" ? 0 : undefined,
        serviciosAdicionalesSinIva: tipoContrato === "arrendamiento_puro" ? 0 : undefined,
        tasaInteresAnual: tipoContrato !== "arrendamiento_puro" ? 0 : undefined,
      },
    ]);
  };

  const eliminarLineItem = (index: number) => {
    if (lineItems.length > 1) {
      setLineItems(lineItems.filter((_, i) => i !== index));
    }
  };

  const actualizarLineItem = (index: number, field: keyof LineItem, value: any) => {
    const newLineItems = [...lineItems];
    newLineItems[index] = { ...newLineItems[index], [field]: value };
    setLineItems(newLineItems);
  };

  const handleSubmit = () => {
    // Validaciones
    if (!numeroContrato.trim()) {
      toast.error("El número de contrato es requerido");
      return;
    }
    if (!clienteId) {
      toast.error("Debe seleccionar un cliente");
      return;
    }
    if (!fechaInicio) {
      toast.error("La fecha de inicio es requerida");
      return;
    }
    if (lineItems.some((item) => !item.nombreEquipo.trim())) {
      toast.error("Todos los equipos deben tener un nombre");
      return;
    }

    createContrato.mutate({
      numeroContrato,
      clienteId: Number(clienteId),
      vendedorId: vendedorId ? Number(vendedorId) : undefined,
      empresa,
      tipoContrato,
      fechaInicio,
      plazo: Number(plazo),
      notas: notas || undefined,
      lineItems: lineItems.map((item) => ({
        nombreEquipo: item.nombreEquipo,
        precioEquipoSinIva: item.precioEquipoSinIva || undefined,
        pagoInicialSinIva: item.pagoInicialSinIva,
        comisionesSinIva: item.comisionesSinIva,
        valorResidualSinIva: item.valorResidualSinIva,
        mensualidadBaseSinIva: item.mensualidadBaseSinIva,
        serviciosAdicionalesSinIva: item.serviciosAdicionalesSinIva,
        tasaInteresAnual: item.tasaInteresAnual,
      })),
    });
  };

  // Calcular totales del contrato
  const calcularTotales = () => {
    let totalPagoInicial = 0;
    let totalComisiones = 0;
    let totalRentaMensual = 0;
    let totalValorResidual = 0;

    lineItems.forEach((item) => {
      totalPagoInicial += item.pagoInicialSinIva;
      totalComisiones += item.comisionesSinIva;
      totalValorResidual += item.valorResidualSinIva;

      if (tipoContrato === "arrendamiento_puro") {
        totalRentaMensual +=
          (item.mensualidadBaseSinIva || 0) + (item.serviciosAdicionalesSinIva || 0);
      }
    });

    return {
      totalPagoInicial,
      totalComisiones,
      totalRentaMensual,
      totalValorResidual,
      totalPagoInicialConIva: calcularTotalConIVA(totalPagoInicial),
      totalComisionesConIva: calcularTotalConIVA(totalComisiones),
      totalRentaMensualConIva: calcularTotalConIVA(totalRentaMensual),
      totalValorResidualConIva: calcularTotalConIVA(totalValorResidual),
    };
  };

  const totales = calcularTotales();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nuevo Contrato de Proyección</DialogTitle>
          <DialogDescription>
            Capture la información del contrato y sus equipos. Los cálculos se realizan
            automáticamente.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Información básica del contrato */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="numeroContrato">Número de Contrato *</Label>
              <Input
                id="numeroContrato"
                value={numeroContrato}
                onChange={(e) => setNumeroContrato(e.target.value)}
                placeholder="Ej: CONT-2024-001"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cliente">Cliente *</Label>
              <Select value={clienteId} onValueChange={setClienteId}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar cliente" />
                </SelectTrigger>
                <SelectContent>
                  {clientes?.map((cliente) => (
                    <SelectItem key={cliente.id} value={cliente.id.toString()}>
                      {cliente.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="vendedor">Vendedor</Label>
              <Select value={vendedorId} onValueChange={setVendedorId}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar vendedor (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  {vendedores?.map((vendedor) => (
                    <SelectItem key={vendedor.id} value={vendedor.id.toString()}>
                      {vendedor.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="empresa">Empresa *</Label>
              <Select value={empresa} onValueChange={(v: any) => setEmpresa(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tim_transp">Tim Transp</SelectItem>
                  <SelectItem value="tim_value">Tim Value</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tipoContrato">Tipo de Contrato *</Label>
              <Select value={tipoContrato} onValueChange={(v: any) => setTipoContrato(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="arrendamiento_puro">Arrendamiento Puro</SelectItem>
                  <SelectItem value="arrendamiento_financiero">
                    Arrendamiento Financiero
                  </SelectItem>
                  <SelectItem value="credito_simple">Crédito Simple</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fechaInicio">Fecha de Inicio *</Label>
              <Input
                id="fechaInicio"
                type="date"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="plazo">Plazo (meses) *</Label>
              <Select value={plazo} onValueChange={setPlazo}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="12">12 meses</SelectItem>
                  <SelectItem value="24">24 meses</SelectItem>
                  <SelectItem value="36">36 meses</SelectItem>
                  <SelectItem value="48">48 meses</SelectItem>
                  <SelectItem value="60">60 meses</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notas">Notas</Label>
            <Textarea
              id="notas"
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              placeholder="Notas adicionales sobre el contrato (opcional)"
              rows={2}
            />
          </div>

          {/* Line Items (Equipos) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Equipos / Conceptos</h3>
              <Button type="button" variant="outline" size="sm" onClick={agregarLineItem}>
                <Plus className="mr-2 h-4 w-4" />
                Agregar Equipo
              </Button>
            </div>

            {lineItems.map((item, index) => (
              <Card key={index}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">Equipo {index + 1}</CardTitle>
                    {lineItems.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => eliminarLineItem(index)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Nombre del Equipo *</Label>
                    <Input
                      value={item.nombreEquipo}
                      onChange={(e) =>
                        actualizarLineItem(index, "nombreEquipo", e.target.value)
                      }
                      placeholder="Ej: Chevrolet Aveo 2024"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {tipoContrato !== "credito_simple" && (
                      <div className="space-y-2">
                        <Label>Precio del Equipo (sin IVA)</Label>
                        <Input
                          type="number"
                          value={item.precioEquipoSinIva}
                          onChange={(e) =>
                            actualizarLineItem(
                              index,
                              "precioEquipoSinIva",
                              Number(e.target.value)
                            )
                          }
                          placeholder="0.00"
                        />
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label>Pago Inicial / Enganche (sin IVA)</Label>
                      <Input
                        type="number"
                        value={item.pagoInicialSinIva}
                        onChange={(e) =>
                          actualizarLineItem(
                            index,
                            "pagoInicialSinIva",
                            Number(e.target.value)
                          )
                        }
                        placeholder="0.00"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Comisiones (sin IVA)</Label>
                      <Input
                        type="number"
                        value={item.comisionesSinIva}
                        onChange={(e) =>
                          actualizarLineItem(index, "comisionesSinIva", Number(e.target.value))
                        }
                        placeholder="0.00"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Valor Residual (sin IVA)</Label>
                      <Input
                        type="number"
                        value={item.valorResidualSinIva}
                        onChange={(e) =>
                          actualizarLineItem(
                            index,
                            "valorResidualSinIva",
                            Number(e.target.value)
                          )
                        }
                        placeholder="0.00"
                      />
                    </div>

                    {/* Campos específicos de Arrendamiento Puro */}
                    {tipoContrato === "arrendamiento_puro" && (
                      <>
                        <div className="space-y-2">
                          <Label>Mensualidad Base (sin IVA)</Label>
                          <Input
                            type="number"
                            value={item.mensualidadBaseSinIva || 0}
                            onChange={(e) =>
                              actualizarLineItem(
                                index,
                                "mensualidadBaseSinIva",
                                Number(e.target.value)
                              )
                            }
                            placeholder="0.00"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Servicios Adicionales (sin IVA)</Label>
                          <Input
                            type="number"
                            value={item.serviciosAdicionalesSinIva || 0}
                            onChange={(e) =>
                              actualizarLineItem(
                                index,
                                "serviciosAdicionalesSinIva",
                                Number(e.target.value)
                              )
                            }
                            placeholder="0.00"
                          />
                        </div>
                      </>
                    )}

                    {/* Campos específicos de Financiero y Crédito */}
                    {tipoContrato !== "arrendamiento_puro" && (
                      <div className="space-y-2">
                        <Label>Tasa de Interés Anual (%)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={item.tasaInteresAnual || 0}
                          onChange={(e) =>
                            actualizarLineItem(
                              index,
                              "tasaInteresAnual",
                              Number(e.target.value)
                            )
                          }
                          placeholder="12.00"
                        />
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Resumen de totales */}
          <Card className="bg-muted/50">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Calculator className="h-4 w-4" />
                Resumen de Totales (Primer Mes)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Pago Inicial:</p>
                  <p className="font-semibold">
                    ${totales.totalPagoInicialConIva.toLocaleString()} (con IVA)
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Comisiones:</p>
                  <p className="font-semibold">
                    ${totales.totalComisionesConIva.toLocaleString()} (con IVA)
                  </p>
                </div>
                {tipoContrato === "arrendamiento_puro" && (
                  <div>
                    <p className="text-muted-foreground">Renta Mensual:</p>
                    <p className="font-semibold">
                      ${totales.totalRentaMensualConIva.toLocaleString()} (con IVA)
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-muted-foreground">Valor Residual (último mes):</p>
                  <p className="font-semibold">
                    ${totales.totalValorResidualConIva.toLocaleString()} (con IVA)
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={createContrato.isPending}>
            {createContrato.isPending ? "Creando..." : "Crear Contrato"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
