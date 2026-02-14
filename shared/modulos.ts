/**
 * Definición de módulos del sistema
 * Agregar nuevos módulos aquí para que estén disponibles en el sistema de permisos
 */

export interface Modulo {
  id: string;
  nombre: string;
  ruta: string;
  icono: string;
  descripcion: string;
}

export const MODULOS_SISTEMA: Modulo[] = [
  {
    id: 'dashboard',
    nombre: 'Dashboard',
    ruta: '/',
    icono: 'LayoutDashboard',
    descripcion: 'Panel principal con estadísticas generales'
  },
  {
    id: 'cargar-archivos',
    nombre: 'Cargar Archivos',
    ruta: '/cargar-archivos',
    icono: 'Upload',
    descripcion: 'Carga de archivos Excel de facturación'
  },
  {
    id: 'facturas',
    nombre: 'Facturas',
    ruta: '/facturas',
    icono: 'FileText',
    descripcion: 'Gestión y consulta de facturas'
  },
  {
    id: 'proyeccion',
    nombre: 'Proyección',
    ruta: '/proyeccion',
    icono: 'TrendingUp',
    descripcion: 'Proyección de ingresos y vencimientos'
  },
  {
    id: 'tabla-proyeccion',
    nombre: 'Tabla Proyección',
    ruta: '/tabla-proyeccion',
    icono: 'Table',
    descripcion: 'Vista matricial de proyección de ingresos'
  },
  {
    id: 'estados-cuenta',
    nombre: 'Estados de Cuenta',
    ruta: '/estados-cuenta',
    icono: 'FileText',
    descripcion: 'Generación de estados de cuenta en PDF'
  },
  {
    id: 'analisis-cobranza',
    nombre: 'Análisis de Cobranza',
    ruta: '/analisis-cobranza',
    icono: 'TrendingUp',
    descripcion: 'Análisis de cartera vencida por antigüedad'
  },
  {
    id: 'reportes',
    nombre: 'Reportes',
    ruta: '/reportes',
    icono: 'BarChart3',
    descripcion: 'Reportes y análisis de cobranza'
  },
  {
    id: 'clientes',
    nombre: 'Clientes',
    ruta: '/clientes',
    icono: 'Users',
    descripcion: 'Gestión de clientes y grupos'
  },
  {
    id: 'configuracion',
    nombre: 'Configuración',
    ruta: '/configuracion',
    icono: 'Settings',
    descripcion: 'Configuración del sistema'
  },
  {
    id: 'usuarios',
    nombre: 'Usuarios',
    ruta: '/usuarios',
    icono: 'UserCog',
    descripcion: 'Administración de usuarios y permisos'
  }
];

/**
 * Permisos por defecto según rol
 */
export const PERMISOS_POR_ROL: Record<string, string[]> = {
  admin: MODULOS_SISTEMA.map(m => m.id),
  operador: [
    'dashboard',
    'cargar-archivos',
    'facturas',
    'proyeccion',
    'tabla-proyeccion',
    'estados-cuenta',
    'analisis-cobranza',
    'reportes',
    'clientes'
  ],
  consulta: [
    'dashboard',
    'facturas',
    'proyeccion',
    'tabla-proyeccion',
    'estados-cuenta',
    'analisis-cobranza',
    'reportes',
    'clientes'
  ]
};
