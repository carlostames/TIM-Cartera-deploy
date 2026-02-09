# Documentación: Módulo de Clientes y Grupos

## Descripción General

El módulo de gestión de clientes permite administrar el master data de clientes y agruparlos en grupos de razones sociales relacionadas. Este sistema facilita la consolidación de información de facturación y cobranza para empresas que operan bajo múltiples razones sociales.

## Estructura de Datos

### Grupos de Clientes

Los grupos permiten agrupar múltiples clientes (razones sociales) que pertenecen a la misma organización o conglomerado empresarial.

**Campos:**
- `id`: Identificador único del grupo (auto-incremental)
- `nombre`: Nombre del grupo (único, requerido)
- `descripcion`: Descripción opcional del grupo
- `responsable`: Persona responsable del grupo
- `activo`: Estado del grupo (activo/inactivo)
- `createdAt`: Fecha de creación
- `updatedAt`: Fecha de última actualización

**Ejemplo de uso:**
Un grupo llamado "Corporativo ABC" puede incluir las razones sociales:
- ABC Transportes S.A. de C.V.
- ABC Logística S.A. de C.V.
- ABC Servicios S.A. de C.V.

### Clientes

Los clientes representan razones sociales individuales que pueden estar asociadas o no a un grupo.

**Campos:**
- `id`: Identificador único del cliente (auto-incremental)
- `nombre`: Nombre o razón social completa (requerido)
- `rfc`: RFC del cliente
- `alias`: Nombre corto o alias para identificación rápida
- `grupoId`: ID del grupo al que pertenece (opcional, relación muchos-a-uno)
- `responsableCobranza`: Nombre del responsable de cobranza
- `correoCobranza`: Correo electrónico para envío de estados de cuenta
- `telefono`: Teléfono de contacto
- `direccion`: Dirección fiscal completa
- `notas`: Notas adicionales sobre el cliente
- `activo`: Estado del cliente (activo/inactivo)
- `createdAt`: Fecha de creación
- `updatedAt`: Fecha de última actualización

## Relaciones

### Cliente → Grupo (Muchos a Uno)

- Un cliente puede pertenecer a un solo grupo o no pertenecer a ninguno
- Un grupo puede tener múltiples clientes asociados
- La relación se establece mediante el campo `grupoId` en la tabla de clientes
- Si se elimina un grupo, los clientes asociados quedan sin grupo (grupoId = null)

## Funcionalidades

### Gestión de Grupos

1. **Crear Grupo**: Permite crear un nuevo grupo de clientes
2. **Editar Grupo**: Actualizar información del grupo
3. **Eliminar Grupo**: Eliminar un grupo (los clientes quedan sin grupo)
4. **Listar Grupos**: Ver todos los grupos registrados

### Gestión de Clientes

1. **Crear Cliente**: Registrar un nuevo cliente con o sin grupo
2. **Editar Cliente**: Actualizar información del cliente
3. **Eliminar Cliente**: Eliminar un cliente del sistema
4. **Listar Clientes**: Ver todos los clientes con información de su grupo
5. **Asignar a Grupo**: Asociar un cliente a un grupo existente
6. **Desasignar de Grupo**: Remover la asociación de un cliente con su grupo
7. **Filtrar por Grupo**: Ver solo los clientes de un grupo específico
8. **Buscar**: Buscar clientes por nombre, RFC o alias

## Interfaz de Usuario

### Página Principal

La página de gestión de clientes (`/gestion-clientes`) incluye:

- **Tarjetas de Resumen**:
  - Total de clientes registrados
  - Grupos activos
  - Clientes sin grupo asignado

- **Filtros**:
  - Búsqueda por texto (nombre, RFC, alias)
  - Filtro por grupo (todos, sin grupo, o grupo específico)

- **Tabla de Clientes**:
  - Listado completo con información clave
  - Badge visual para identificar el grupo
  - Acciones rápidas (editar, eliminar)

### Formulario de Cliente

Modal con campos organizados para:
- Información básica (nombre, RFC, alias)
- Asignación de grupo
- Datos de contacto (responsable, correo, teléfono)
- Información adicional (dirección, notas)

### Gestión de Grupos

Modal que permite:
- Ver lista de grupos existentes
- Crear nuevos grupos
- Editar grupos existentes
- Eliminar grupos

## API (tRPC Endpoints)

### Clientes

```typescript
// Listar todos los clientes con información de grupo
trpc.clientes.list.useQuery()

// Obtener cliente por ID
trpc.clientes.getById.useQuery({ id: number })

// Obtener clientes de un grupo
trpc.clientes.getByGrupo.useQuery({ grupoId: number })

// Crear cliente
trpc.clientes.create.useMutation({
  nombre: string,
  rfc?: string,
  alias?: string,
  grupoId?: number,
  responsableCobranza?: string,
  correoCobranza?: string,
  telefono?: string,
  direccion?: string,
  notas?: string,
})

// Actualizar cliente
trpc.clientes.update.useMutation({
  id: number,
  // ... campos opcionales a actualizar
})

// Eliminar cliente
trpc.clientes.delete.useMutation({ id: number })

// Asignar/desasignar grupo
trpc.clientes.asignarGrupo.useMutation({
  clienteId: number,
  grupoId: number | null,
})
```

### Grupos

```typescript
// Listar todos los grupos
trpc.grupos.list.useQuery()

// Obtener grupo por ID
trpc.grupos.getById.useQuery({ id: number })

// Crear grupo
trpc.grupos.create.useMutation({
  nombre: string,
  descripcion?: string,
  responsable?: string,
})

// Actualizar grupo
trpc.grupos.update.useMutation({
  id: number,
  // ... campos opcionales a actualizar
})

// Eliminar grupo
trpc.grupos.delete.useMutation({ id: number })
```

## Auditoría

Todas las operaciones de creación, actualización y eliminación de clientes y grupos son registradas en la tabla de auditoría con:
- Usuario que realizó la acción
- Tipo de acción (create, update, delete)
- Entidad afectada (clientes, gruposClientes)
- ID de la entidad
- Detalles de los cambios realizados
- Fecha y hora de la operación

## Casos de Uso

### Caso 1: Consolidación de Cartera por Grupo

**Escenario**: Una empresa tiene 5 razones sociales diferentes pero quiere ver su cartera vencida consolidada.

**Solución**:
1. Crear un grupo "Empresa XYZ"
2. Asignar las 5 razones sociales a este grupo
3. En reportes, filtrar por grupo para ver cartera consolidada

### Caso 2: Cliente Independiente

**Escenario**: Un cliente opera con una sola razón social.

**Solución**:
1. Crear el cliente sin asignar a ningún grupo
2. El cliente aparecerá en reportes individuales

### Caso 3: Reorganización de Grupos

**Escenario**: Una razón social se separa de un grupo corporativo.

**Solución**:
1. Editar el cliente
2. Cambiar el grupo a "Sin grupo" o asignar a otro grupo
3. El cambio se refleja inmediatamente en todos los reportes

## Validaciones

### Clientes

- El nombre es obligatorio
- El RFC debe tener formato válido (si se proporciona)
- El correo debe tener formato válido (si se proporciona)
- No se permite crear clientes con nombres duplicados exactos

### Grupos

- El nombre es obligatorio y debe ser único
- No se pueden crear grupos con nombres duplicados

## Permisos

Todos los roles (admin, operador, consulta) tienen acceso completo al módulo de clientes y grupos, ya que es información fundamental para las operaciones de cobranza.

## Integración con Otros Módulos

### Facturas

- Las facturas se vinculan a clientes mediante `clienteId`
- Al cargar archivos XLSX, el sistema busca coincidencias por nombre de cliente
- Si no existe el cliente, se puede crear automáticamente o manualmente

### Reportes

- Los reportes de cartera vencida pueden agruparse por cliente o por grupo
- Los dashboards muestran métricas por cliente y por grupo
- La evolución temporal puede filtrarse por grupo

### Configuración

- Se pueden establecer políticas de cobranza específicas por cliente o grupo
- Tasas de interés diferenciadas por cliente
- Días de gracia personalizados

## Mejores Prácticas

1. **Nombres Descriptivos**: Usar nombres completos y oficiales para clientes
2. **Aliases Útiles**: Crear aliases cortos para búsquedas rápidas
3. **Grupos Lógicos**: Agrupar solo razones sociales que realmente pertenecen a la misma organización
4. **Información de Contacto**: Mantener actualizado el correo y teléfono de cobranza
5. **Notas Relevantes**: Usar el campo de notas para información importante (horarios de pago, contactos adicionales, etc.)
6. **Revisión Periódica**: Revisar y actualizar la información de clientes regularmente

## Migración de Datos

Para migrar datos existentes desde Google Sheets:

1. Exportar la hoja "Clientes y Grupos" a XLSX
2. Usar la función de importación masiva (próximamente)
3. O crear manualmente los grupos y clientes desde la interfaz

## Soporte y Mantenimiento

Para reportar problemas o solicitar mejoras relacionadas con el módulo de clientes:
- Contactar al administrador del sistema
- Documentar el problema con capturas de pantalla
- Incluir pasos para reproducir el error
