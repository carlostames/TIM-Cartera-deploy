import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, FileText, Calendar, Building2, Users } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";
import { NuevoContratoDialog } from "@/components/NuevoContratoDialog";
import { useLocation } from "wouter";

export default function ProyeccionContratos() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [, setLocation] = useLocation();
  const [vistaActual, setVistaActual] = useState<"individual" | "grupo">("individual");

  const { data: contratos, isLoading: loadingContratos } = trpc.proyeccionContratos.list.useQuery({
    estatus: "activo",
    empresa: "todas",
  });

  const { data: grupos, isLoading: loadingGrupos } = trpc.proyeccionContratos.listByGrupo.useQuery({
    estatus: "activo",
    empresa: "todas",
  });

  const isLoading = vistaActual === "individual" ? loadingContratos : loadingGrupos;

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

  const totalContratos = contratos?.length || 0;
  const totalGrupos = grupos?.length || 0;

  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Proyección de Contratos</h1>
          <p className="text-muted-foreground mt-2">
            Gestión manual de contratos de arrendamiento con proyección financiera
          </p>
        </div>
        {isAdmin && (
          <NuevoContratoDialog>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Contrato
            </Button>
          </NuevoContratoDialog>
        )}
      </div>

      {/* Estadísticas rápidas */}
      <div className="grid gap-4 md:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Contratos Activos</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalContratos}</div>
            <p className="text-xs text-muted-foreground">Total de contratos vigentes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Grupos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalGrupos}</div>
            <p className="text-xs text-muted-foreground">Grupos con contratos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tim Transp</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {contratos?.filter((c) => c.empresa === "tim_transp").length || 0}
            </div>
            <p className="text-xs text-muted-foreground">Contratos TT</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tim Value</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {contratos?.filter((c) => c.empresa === "tim_value").length || 0}
            </div>
            <p className="text-xs text-muted-foreground">Contratos TV</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs para vista individual vs por grupo */}
      <Tabs value={vistaActual} onValueChange={(v) => setVistaActual(v as "individual" | "grupo")}>
        <TabsList className="mb-4">
          <TabsTrigger value="individual">
            <FileText className="mr-2 h-4 w-4" />
            Por Cliente Individual
          </TabsTrigger>
          <TabsTrigger value="grupo">
            <Users className="mr-2 h-4 w-4" />
            Por Grupo de Clientes
          </TabsTrigger>
        </TabsList>

        {/* Vista Individual */}
        <TabsContent value="individual">
          <Card>
            <CardHeader>
              <CardTitle>Contratos Registrados</CardTitle>
            </CardHeader>
            <CardContent>
              {!contratos || contratos.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">No hay contratos registrados</p>
                  <p className="text-sm mt-2">
                    Crea tu primer contrato de proyección haciendo clic en el botón "Nuevo Contrato"
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {contratos.map((contrato) => (
                    <Card
                      key={contrato.id}
                      className="cursor-pointer hover:bg-accent transition-colors"
                      onClick={() => setLocation(`/proyeccion-contratos/${contrato.id}`)}
                    >
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-lg">{contrato.numeroContrato}</h3>
                              <Badge variant={contrato.empresa === "tim_transp" ? "default" : "secondary"}>
                                {contrato.empresa === "tim_transp" ? "TT" : "TV"}
                              </Badge>
                              <Badge variant="outline">
                                {contrato.tipoContrato === "arrendamiento_puro"
                                  ? "Puro"
                                  : contrato.tipoContrato === "arrendamiento_financiero"
                                  ? "Financiero"
                                  : "Crédito Simple"}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">{contrato.clienteNombre}</p>
                            {contrato.vendedorNombre && (
                              <p className="text-xs text-muted-foreground">
                                Vendedor: {contrato.vendedorNombre}
                              </p>
                            )}
                          </div>
                          <div className="text-right space-y-1">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Calendar className="h-4 w-4" />
                              {new Date(contrato.fechaInicio).toLocaleDateString("es-MX")}
                            </div>
                            <p className="text-sm font-medium">{contrato.plazo} meses</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Vista Por Grupo */}
        <TabsContent value="grupo">
          <Card>
            <CardHeader>
              <CardTitle>Contratos Agrupados por Grupo de Clientes</CardTitle>
            </CardHeader>
            <CardContent>
              {!grupos || grupos.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">No hay contratos registrados</p>
                  <p className="text-sm mt-2">
                    Crea tu primer contrato de proyección haciendo clic en el botón "Nuevo Contrato"
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {grupos.map((grupo, idx) => (
                    <Card key={idx}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Users className="h-5 w-5 text-primary" />
                            <div>
                              <CardTitle className="text-lg">{grupo.grupoNombre}</CardTitle>
                              <p className="text-sm text-muted-foreground mt-1">
                                {grupo.totalContratos} contrato{grupo.totalContratos !== 1 ? "s" : ""}
                              </p>
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {grupo.contratos.map((contrato: any) => (
                            <div
                              key={contrato.contratoId}
                              className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent cursor-pointer transition-colors"
                              onClick={() => setLocation(`/proyeccion-contratos/${contrato.contratoId}`)}
                            >
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">{contrato.numeroContrato}</span>
                                  <Badge variant={contrato.empresa === "tim_transp" ? "default" : "secondary"} className="text-xs">
                                    {contrato.empresa === "tim_transp" ? "TT" : "TV"}
                                  </Badge>
                                  <Badge variant="outline" className="text-xs">
                                    {contrato.tipoContrato === "arrendamiento_puro"
                                      ? "Puro"
                                      : contrato.tipoContrato === "arrendamiento_financiero"
                                      ? "Financiero"
                                      : "Crédito"}
                                  </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground">{contrato.clienteNombre}</p>
                              </div>
                              <div className="text-right space-y-1">
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <Calendar className="h-4 w-4" />
                                  {new Date(contrato.fechaInicio).toLocaleDateString("es-MX")}
                                </div>
                                <p className="text-sm font-medium">{contrato.plazo} meses</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
