import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(role: "admin" | "operador" | "consulta" = "admin"): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@leasingtim.mx",
    name: "Test User",
    loginMethod: "manus",
    role,
    activo: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

describe("Grupos de Clientes", () => {
  it("debe crear un grupo correctamente", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.grupos.create({
      nombre: `Grupo Test ${Date.now()}`,
      descripcion: "Grupo de prueba",
      responsable: "Test User",
    });

    expect(result).toHaveProperty("id");
    expect(typeof result.id).toBe("number");
  });

  it("debe listar todos los grupos", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const grupos = await caller.grupos.list();

    expect(Array.isArray(grupos)).toBe(true);
  });

  it("debe actualizar un grupo existente", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Crear grupo
    const created = await caller.grupos.create({
      nombre: `Grupo Update Test ${Date.now()}`,
      descripcion: "Descripción original",
    });

    // Actualizar grupo
    const result = await caller.grupos.update({
      id: created.id,
      descripcion: "Descripción actualizada",
    });

    expect(result.success).toBe(true);
  });
});

describe("Clientes", () => {
  it("debe crear un cliente sin grupo", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.clientes.create({
      nombre: `Cliente Test ${Date.now()}`,
      rfc: "TEST123456789",
      alias: "Test",
      correoCobranza: "test@ejemplo.com",
    });

    expect(result).toHaveProperty("id");
    expect(typeof result.id).toBe("number");
  });

  it("debe crear un cliente con grupo", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Crear grupo primero
    const grupo = await caller.grupos.create({
      nombre: `Grupo para Cliente ${Date.now()}`,
    });

    // Crear cliente con grupo
    const result = await caller.clientes.create({
      nombre: `Cliente con Grupo ${Date.now()}`,
      grupoId: grupo.id,
    });

    expect(result).toHaveProperty("id");
    expect(typeof result.id).toBe("number");
  });

  it("debe listar todos los clientes con información de grupo", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const clientes = await caller.clientes.list();

    expect(Array.isArray(clientes)).toBe(true);
    
    // Verificar que los clientes con grupo tienen información del grupo
    const clienteConGrupo = clientes.find(c => c.grupoId !== null);
    if (clienteConGrupo) {
      expect(clienteConGrupo).toHaveProperty("grupoNombre");
    }
  });

  it("debe actualizar un cliente", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Crear cliente
    const created = await caller.clientes.create({
      nombre: `Cliente Update Test ${Date.now()}`,
      rfc: "UPDATE123456",
    });

    // Actualizar cliente
    const result = await caller.clientes.update({
      id: created.id,
      rfc: "UPDATED654321",
      telefono: "5551234567",
    });

    expect(result.success).toBe(true);
  });

  it("debe asignar un cliente a un grupo", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Crear grupo
    const grupo = await caller.grupos.create({
      nombre: `Grupo Asignación ${Date.now()}`,
    });

    // Crear cliente sin grupo
    const cliente = await caller.clientes.create({
      nombre: `Cliente Asignación ${Date.now()}`,
    });

    // Asignar cliente a grupo
    const result = await caller.clientes.asignarGrupo({
      clienteId: cliente.id,
      grupoId: grupo.id,
    });

    expect(result.success).toBe(true);
  });

  it("debe desasignar un cliente de un grupo", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Crear grupo
    const grupo = await caller.grupos.create({
      nombre: `Grupo Desasignación ${Date.now()}`,
    });

    // Crear cliente con grupo
    const cliente = await caller.clientes.create({
      nombre: `Cliente Desasignación ${Date.now()}`,
      grupoId: grupo.id,
    });

    // Desasignar cliente del grupo
    const result = await caller.clientes.asignarGrupo({
      clienteId: cliente.id,
      grupoId: null,
    });

    expect(result.success).toBe(true);
  });

  it("debe obtener clientes por grupo", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Crear grupo
    const grupo = await caller.grupos.create({
      nombre: `Grupo Filtro ${Date.now()}`,
    });

    // Crear varios clientes en el grupo
    await caller.clientes.create({
      nombre: `Cliente Grupo 1 ${Date.now()}`,
      grupoId: grupo.id,
    });

    await caller.clientes.create({
      nombre: `Cliente Grupo 2 ${Date.now()}`,
      grupoId: grupo.id,
    });

    // Obtener clientes del grupo
    const clientesGrupo = await caller.clientes.getByGrupo({
      grupoId: grupo.id,
    });

    expect(Array.isArray(clientesGrupo)).toBe(true);
    expect(clientesGrupo.length).toBeGreaterThanOrEqual(2);
  });
});

describe("Validaciones de Clientes", () => {
  it("debe rechazar cliente sin nombre", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.clientes.create({
        nombre: "",
      })
    ).rejects.toThrow();
  });

  it("debe rechazar correo inválido", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.clientes.create({
        nombre: "Cliente Test",
        correoCobranza: "correo-invalido",
      })
    ).rejects.toThrow();
  });
});

describe("Validaciones de Grupos", () => {
  it("debe rechazar grupo sin nombre", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.grupos.create({
        nombre: "",
      })
    ).rejects.toThrow();
  });
});

describe("Permisos de Clientes", () => {
  it("debe permitir a operadores crear clientes", async () => {
    const ctx = createAuthContext("operador");
    const caller = appRouter.createCaller(ctx);

    const result = await caller.clientes.create({
      nombre: `Cliente Operador ${Date.now()}`,
    });

    expect(result).toHaveProperty("id");
  });

  it("debe permitir a usuarios de consulta ver clientes", async () => {
    const ctx = createAuthContext("consulta");
    const caller = appRouter.createCaller(ctx);

    const clientes = await caller.clientes.list();

    expect(Array.isArray(clientes)).toBe(true);
  });
});
