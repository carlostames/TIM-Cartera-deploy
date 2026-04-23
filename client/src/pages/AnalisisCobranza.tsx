import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, ScatterChart, Scatter, ZAxis } from 'recharts';
import { TrendingUp, Users, Clock, DollarSign } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { formatearMoneda } from "@/../../shared/formatoMoneda";

type MetricType = 'monto' | 'porcentaje' | 'diasAtraso' | 'facturas';

export default function AnalisisCobranza() {
  const { data: user } = trpc.auth.me.useQuery();
  const { data: dashboardData } = trpc.dashboard.stats.useQuery();
  const { data: topDeudores, isLoading: loadingTop } = trpc.analisis.topDeudores.useQuery({ limit: 15 });
  const [selectedMetric, setSelectedMetric] = useState<MetricType>('monto');

  const formatCurrency = (value: number) => {
    return formatearMoneda(value, user?.formatoMoneda || "completo");
  };

  // Usar datos del dashboard para totales
  const totalPendiente = dashboardData?.totalCarteraPendiente || 0;
  const totalFacturas = dashboardData?.facturasPendientes || 0;

  // Preparar datos según la métrica seleccionada
  const chartData = topDeudores?.map(d => {
    let value = 0;
    let label = '';
    
    switch (selectedMetric) {
      case 'monto':
        value = Number(d.totalDeuda);
        label = 'Monto';
        break;
      case 'porcentaje':
        value = Number(d.porcentaje);
        label = 'Porcentaje';
        break;
      case 'diasAtraso':
        value = Math.round(Number(d.diasPromedioAtraso || 0));
        label = 'Días Promedio';
        break;
      case 'facturas':
        value = Number(d.cantidadFacturas);
        label = 'Facturas';
        break;
    }
    
    return {
      cliente: d.cliente,
      value,
      label,
      // Datos adicionales para tooltip
      totalDeuda: Number(d.totalDeuda),
      porcentaje: Number(d.porcentaje),
      diasAtraso: Math.round(Number(d.diasPromedioAtraso || 0)),
      diasMaximoAtraso: Math.round(Number(d.diasMaximoAtraso || 0)),
      facturas: Number(d.cantidadFacturas),
    };
  }) || [];

  // Colores para las barras según la métrica
  const getBarColor = (index: number) => {
    const colors = [
      '#ef4444', '#dc2626', '#b91c1c', '#991b1b', '#7f1d1d',
      '#f97316', '#ea580c', '#c2410c', '#9a3412', '#7c2d12',
      '#f59e0b', '#d97706', '#b45309', '#92400e', '#78350f',
    ];
    return colors[index % colors.length];
  };

  // Formatear valor según métrica
  const formatValue = (value: number) => {
    switch (selectedMetric) {
      case 'monto':
        return formatCurrency(value);
      case 'porcentaje':
        return `${value.toFixed(1)}%`;
      case 'diasAtraso':
        return `${value} días`;
      case 'facturas':
        return `${value} facturas`;
      default:
        return value.toString();
    }
  };

  // Tooltip personalizado
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border rounded-lg p-3 shadow-lg">
          <p className="font-semibold mb-2">{data.cliente}</p>
          <div className="space-y-1 text-sm">
            <p><span className="text-muted-foreground">Monto:</span> {formatCurrency(data.totalDeuda)}</p>
            <p><span className="text-muted-foreground">Porcentaje:</span> {data.porcentaje.toFixed(1)}%</p>
            <p><span className="text-muted-foreground">Días promedio:</span> {data.diasAtraso} días</p>
            <p><span className="text-muted-foreground">Factura más vieja:</span> {data.diasMaximoAtraso} días</p>
            <p><span className="text-muted-foreground">Facturas:</span> {data.facturas}</p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Análisis de Cobranza</h1>
        <p className="text-muted-foreground">
          Visualización de tendencias y distribución de cartera vencida
        </p>
      </div>

      {/* Cards de resumen */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card key="total-pendiente">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pendiente</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalPendiente)}</div>
            <p className="text-xs text-muted-foreground">
              Saldo total por cobrar
            </p>
          </CardContent>
        </Card>

        <Card key="facturas-pendientes">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Facturas Pendientes</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalFacturas}</div>
            <p className="text-xs text-muted-foreground">
              Total de facturas sin pagar
            </p>
          </CardContent>
        </Card>

        <Card key="clientes-morosos">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clientes Morosos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{topDeudores?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              Con saldo pendiente
            </p>
          </CardContent>
        </Card>

        <Card key="promedio-atraso">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Promedio Atraso</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {topDeudores && topDeudores.length > 0
                ? Math.round(
                    topDeudores.reduce((sum, d) => sum + Number(d.diasPromedioAtraso || 0), 0) /
                      topDeudores.length
                  )
                : 0}{' '}
              días
            </div>
            <p className="text-xs text-muted-foreground">
              Días promedio de atraso
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico de top deudores con filtros */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Top 15 Clientes con Mayor Deuda</CardTitle>
              <CardDescription>
                Ranking de clientes por diferentes métricas
              </CardDescription>
            </div>
            <Select value={selectedMetric} onValueChange={(value) => setSelectedMetric(value as MetricType)}>
              <SelectTrigger className="w-[220px]">
                <SelectValue placeholder="Seleccionar métrica" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="monto">Monto de Deuda</SelectItem>
                <SelectItem value="porcentaje">% del Total</SelectItem>
                <SelectItem value="diasAtraso">Días Promedio Atraso</SelectItem>
                <SelectItem value="facturas">Número de Facturas</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {loadingTop ? (
            <div className="h-[600px] flex items-center justify-center">
              <p className="text-muted-foreground">Cargando datos...</p>
            </div>
          ) : chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={600}>
              <BarChart data={chartData} layout="vertical" margin={{ left: 20, right: 30 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  type="number" 
                  tickFormatter={(value) => {
                    if (selectedMetric === 'monto') return `$${(value / 1000).toFixed(0)}k`;
                    if (selectedMetric === 'porcentaje') return `${value.toFixed(0)}%`;
                    return value.toString();
                  }}
                />
                <YAxis 
                  type="category" 
                  dataKey="cliente" 
                  width={180}
                  tick={{ fontSize: 11 }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" name={chartData[0]?.label || 'Valor'} radius={[0, 4, 4, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getBarColor(index)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[600px] flex items-center justify-center">
              <p className="text-muted-foreground">No hay datos disponibles</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Matriz de Riesgo */}
      <Card>
        <CardHeader>
          <CardTitle>Matriz de Riesgo: Deuda vs Días de Atraso</CardTitle>
          <CardDescription>
            Clientes en la esquina superior derecha representan el mayor riesgo (Monto alto y Atraso prolongado).
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingTop ? (
            <div className="h-[400px] flex items-center justify-center">
              <p className="text-muted-foreground">Cargando datos...</p>
            </div>
          ) : chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={400}>
              <ScatterChart margin={{ top: 20, right: 30, bottom: 20, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  type="number" 
                  dataKey="diasAtraso" 
                  name="Días Atraso" 
                  unit=" días" 
                  label={{ value: 'Días Promedio de Atraso', position: 'insideBottom', offset: -10 }} 
                />
                <YAxis 
                  type="number" 
                  dataKey="totalDeuda" 
                  name="Monto" 
                  tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`} 
                  label={{ value: 'Deuda Total', angle: -90, position: 'insideLeft' }} 
                />
                <ZAxis type="category" dataKey="cliente" name="Cliente" />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} content={<CustomTooltip />} />
                <Scatter data={chartData} fill="#ef4444" shape="circle">
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getBarColor(index)} />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[400px] flex items-center justify-center">
              <p className="text-muted-foreground">No hay datos disponibles</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
