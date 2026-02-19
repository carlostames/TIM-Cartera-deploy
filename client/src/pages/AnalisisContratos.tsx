import { useState } from 'react';
import { trpc } from '../lib/trpc';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Search, FileText, TrendingUp } from 'lucide-react';
import { formatearMoneda, FormatoMoneda } from '../../../shared/formatoMoneda';

export default function AnalisisContratos() {
  const { data: me } = trpc.auth.me.useQuery();
  const formatoUsuario: FormatoMoneda = (me?.formatoMoneda as FormatoMoneda) || 'completo';

  // Estado para búsqueda por contrato
  const [numeroContrato, setNumeroContrato] = useState('');
  const [contratoConsultado, setContratoConsultado] = useState('');

  // Estado para búsqueda por cliente
  const [clienteId, setClienteId] = useState<number | null>(null);

  // Queries
  const { data: clientes } = trpc.clientes.list.useQuery();
  const { data: facturasContrato, isLoading: loadingFacturas } = trpc.analisis.facturasPorContrato.useQuery(
    { numeroContrato: contratoConsultado },
    { enabled: contratoConsultado.length > 0 }
  );
  const { data: contratosCliente, isLoading: loadingContratos } = trpc.analisis.contratosPorCliente.useQuery(
    { clienteId: clienteId! },
    { enabled: clienteId !== null }
  );

  const handleBuscarContrato = () => {
    if (numeroContrato.trim()) {
      setContratoConsultado(numeroContrato.trim().toUpperCase());
    }
  };

  const totalAdeudadoContrato = facturasContrato?.reduce(
    (sum, f) => sum + parseFloat(f.saldoPendiente || '0'),
    0
  ) || 0;

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Análisis de Contratos</h1>
        <p className="text-muted-foreground">
          Consulta el estado de deuda por número de contrato o por cliente
        </p>
      </div>

      <Tabs defaultValue="contrato" className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="contrato">Por Número de Contrato</TabsTrigger>
          <TabsTrigger value="cliente">Por Cliente</TabsTrigger>
        </TabsList>

        {/* Tab: Búsqueda por Número de Contrato */}
        <TabsContent value="contrato" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Buscar por Número de Contrato
              </CardTitle>
              <CardDescription>
                Ingresa el número de contrato para ver todas las facturas pendientes asociadas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <Input
                  placeholder="Ej: 0047"
                  value={numeroContrato}
                  onChange={(e) => setNumeroContrato(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleBuscarContrato()}
                  className="max-w-xs"
                />
                <Button onClick={handleBuscarContrato} disabled={!numeroContrato.trim()}>
                  <Search className="h-4 w-4 mr-2" />
                  Buscar
                </Button>
              </div>
            </CardContent>
          </Card>

          {contratoConsultado && (
            <>
              {loadingFacturas ? (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    Cargando...
                  </CardContent>
                </Card>
              ) : facturasContrato && facturasContrato.length > 0 ? (
                <>
                  <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                      <CardHeader className="pb-3">
                        <CardDescription>Contrato</CardDescription>
                        <CardTitle className="text-2xl">{contratoConsultado}</CardTitle>
                      </CardHeader>
                    </Card>
                    <Card>
                      <CardHeader className="pb-3">
                        <CardDescription>Facturas Pendientes</CardDescription>
                        <CardTitle className="text-2xl">{facturasContrato.length}</CardTitle>
                      </CardHeader>
                    </Card>
                    <Card>
                      <CardHeader className="pb-3">
                        <CardDescription>Total Adeudado</CardDescription>
                        <CardTitle className="text-2xl text-destructive">
                          {formatearMoneda(totalAdeudadoContrato, formatoUsuario)}
                        </CardTitle>
                      </CardHeader>
                    </Card>
                  </div>

                  <Card>
                    <CardHeader>
                      <CardTitle>Facturas Pendientes</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Folio</TableHead>
                            <TableHead>Cliente</TableHead>
                            <TableHead>Fecha</TableHead>
                            <TableHead>Vencimiento</TableHead>
                            <TableHead>Sistema</TableHead>
                            <TableHead className="text-right">Importe</TableHead>
                            <TableHead className="text-right">Saldo Pendiente</TableHead>
                            <TableHead className="text-right">Días Atraso</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {facturasContrato.map((factura) => (
                            <TableRow key={factura.folio}>
                              <TableCell className="font-medium">{factura.folio}</TableCell>
                              <TableCell>{factura.nombreCliente}</TableCell>
                              <TableCell>
                                {factura.fecha ? new Date(factura.fecha).toLocaleDateString('es-MX') : '-'}
                              </TableCell>
                              <TableCell>
                                {factura.fechaVencimiento
                                  ? new Date(factura.fechaVencimiento).toLocaleDateString('es-MX')
                                  : '-'}
                              </TableCell>
                              <TableCell>
                                <span
                                  className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                                    factura.sistema === 'tim_value'
                                      ? 'bg-blue-100 text-blue-700'
                                      : 'bg-green-100 text-green-700'
                                  }`}
                                >
                                  {factura.sistema === 'tim_value' ? 'TV' : 'TT'}
                                </span>
                              </TableCell>
                              <TableCell className="text-right">
                                {formatearMoneda(parseFloat(factura.importeTotal || '0'), formatoUsuario)}
                              </TableCell>
                              <TableCell className="text-right font-medium">
                                {formatearMoneda(parseFloat(factura.saldoPendiente || '0'), formatoUsuario)}
                              </TableCell>
                              <TableCell className="text-right">
                                <span
                                  className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                                    factura.diasAtraso > 30
                                      ? 'bg-red-100 text-red-700'
                                      : factura.diasAtraso > 0
                                      ? 'bg-yellow-100 text-yellow-700'
                                      : 'bg-gray-100 text-gray-700'
                                  }`}
                                >
                                  {factura.diasAtraso} días
                                </span>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </>
              ) : (
                <Card>
                  <CardContent className="py-8 text-center">
                    <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">
                      No se encontraron facturas pendientes para el contrato <strong>{contratoConsultado}</strong>
                    </p>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>

        {/* Tab: Búsqueda por Cliente */}
        <TabsContent value="cliente" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Buscar por Cliente
              </CardTitle>
              <CardDescription>
                Selecciona un cliente para ver todos sus contratos y saldos pendientes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Select
                value={clienteId?.toString() || ''}
                onValueChange={(value) => setClienteId(parseInt(value))}
              >
                <SelectTrigger className="max-w-md">
                  <SelectValue placeholder="Selecciona un cliente..." />
                </SelectTrigger>
                <SelectContent>
                  {clientes?.map((cliente) => (
                    <SelectItem key={cliente.id} value={cliente.id.toString()}>
                      {cliente.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {clienteId && (
            <>
              {loadingContratos ? (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    Cargando...
                  </CardContent>
                </Card>
              ) : contratosCliente && contratosCliente.length > 0 ? (
                <Card>
                  <CardHeader>
                    <CardTitle>Contratos del Cliente</CardTitle>
                    <CardDescription>
                      Facturas sin contrato se agrupan como "Otros"
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Número de Contrato</TableHead>
                          <TableHead className="text-right">Facturas Pendientes</TableHead>
                          <TableHead className="text-right">Total Adeudado</TableHead>
                          <TableHead>Última Factura</TableHead>
                          <TableHead>Última Fecha</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {contratosCliente.map((contrato, idx) => (
                          <TableRow key={idx}>
                            <TableCell className="font-medium">
                              {contrato.numeroContrato || (
                                <span className="text-muted-foreground italic">Otros</span>
                              )}
                            </TableCell>
                            <TableCell className="text-right">{contrato.totalFacturas}</TableCell>
                            <TableCell className="text-right font-medium text-destructive">
                              {formatearMoneda(parseFloat(contrato.totalAdeudado || '0'), formatoUsuario)}
                            </TableCell>
                            <TableCell>{contrato.ultimaFactura}</TableCell>
                            <TableCell>
                              {contrato.ultimaFecha
                                ? new Date(contrato.ultimaFecha).toLocaleDateString('es-MX')
                                : '-'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="py-8 text-center">
                    <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">
                      Este cliente no tiene facturas pendientes
                    </p>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
