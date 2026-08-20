const express = require("express");
const cors = require("cors");
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const autenticarToken = require("./middleware/auth");
const permitirRoles = require("./middleware/roles");

const app = express();
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    application: "kit-asesoria-backend",
    message: "Backend funcionando correctamente"
  });
});

// Crear empresa
app.post(
  "/api/empresas",
  autenticarToken,
  permitirRoles("SUPERADMIN", "ADMIN"),
  async (req, res) => {
  try {
    const { nombre } = req.body;

    if (!nombre) {
      return res.status(400).json({
        ok: false,
        message: "El nombre de la empresa es obligatorio"
      });
    }

    const empresa = await prisma.empresa.create({
      data: {
        nombre
      }
    });

    res.status(201).json({
      ok: true,
      empresa
    });
  } catch (error) {
    console.error("Error creando empresa:", error);

    res.status(500).json({
      ok: false,
      message: "Error interno del servidor"
    });
  }
});
// Listar empresas
app.get("/api/empresas", autenticarToken, async (req, res) => {
  try {
    const empresas = await prisma.empresa.findMany({
  where: {
    activo: true
  },
  orderBy: {
    createdAt: "desc"
  }
});

    res.json({
      ok: true,
      empresas
    });
  } catch (error) {
    console.error("Error obteniendo empresas:", error);

    res.status(500).json({
      ok: false,
      message: "Error interno del servidor"
    });
  }
});
// Obtener una empresa por ID
app.get("/api/empresas/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const empresa = await prisma.empresa.findUnique({
      where: {
        id
      }
    });

    if (!empresa) {
      return res.status(404).json({
        ok: false,
        message: "Empresa no encontrada"
      });
    }

    res.json({
      ok: true,
      empresa
    });
  } catch (error) {
    console.error("Error obteniendo empresa:", error);

    res.status(500).json({
      ok: false,
      message: "Error interno del servidor"
    });
  }
});
// Modificar una empresa
app.put("/api/empresas/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre } = req.body;

    if (!nombre) {
      return res.status(400).json({
        ok: false,
        message: "El nombre de la empresa es obligatorio"
      });
    }

    const empresa = await prisma.empresa.update({
      where: {
        id
      },
      data: {
        nombre
      }
    });

    res.json({
      ok: true,
      empresa
    });
  } catch (error) {
    console.error("Error modificando empresa:", error);

    if (error.code === "P2025") {
      return res.status(404).json({
        ok: false,
        message: "Empresa no encontrada"
      });
    }

    res.status(500).json({
      ok: false,
      message: "Error interno del servidor"
    });
  }
});
// Desactivar una empresa
app.patch("/api/empresas/:id/desactivar", async (req, res) => {
  try {
    const { id } = req.params;

    const empresa = await prisma.empresa.update({
      where: {
        id
      },
      data: {
        activo: false
      }
    });

    res.json({
      ok: true,
      empresa
    });
  } catch (error) {
    console.error("Error desactivando empresa:", error);

    if (error.code === "P2025") {
      return res.status(404).json({
        ok: false,
        message: "Empresa no encontrada"
      });
    }

    res.status(500).json({
      ok: false,
      message: "Error interno del servidor"
    });
  }
});
// Activar una empresa
app.patch(
  "/api/oficinas/:id/activar",
  autenticarToken,
  permitirRoles("SUPERADMIN"),
  async (req, res) => {
  try {
    const { id } = req.params;

    const empresa = await prisma.empresa.update({
      where: {
        id
      },
      data: {
        activo: true
      }
    });

    res.json({
      ok: true,
      empresa
    });
  } catch (error) {
    console.error("Error activando empresa:", error);

    if (error.code === "P2025") {
      return res.status(404).json({
        ok: false,
        message: "Empresa no encontrada"
      });
    }

    res.status(500).json({
      ok: false,
      message: "Error interno del servidor"
    });
  }
});
// Crear oficina
app.post(
  "/api/oficinas",
  autenticarToken,
  permitirRoles("SUPERADMIN"),
  async (req, res) => {
  try {
    const { nombre, empresaId } = req.body;

    if (!nombre || !empresaId) {
      return res.status(400).json({
        ok: false,
        message: "El nombre y la empresa son obligatorios"
      });
    }

    const empresa = await prisma.empresa.findUnique({
      where: {
        id: empresaId
      }
    });

    if (!empresa) {
      return res.status(404).json({
        ok: false,
        message: "Empresa no encontrada"
      });
    }

    const oficina = await prisma.oficina.create({
      data: {
        nombre,
        empresaId
      }
    });

    res.status(201).json({
      ok: true,
      oficina
    });
  } catch (error) {
    console.error("Error creando oficina:", error);

    res.status(500).json({
      ok: false,
      message: "Error interno del servidor"
    });
  }
});
// Listar oficinas de una empresa
app.get("/api/empresas/:empresaId/oficinas", async (req, res) => {
  try {
    const { empresaId } = req.params;

    const empresa = await prisma.empresa.findUnique({
      where: {
        id: empresaId
      }
    });

    if (!empresa) {
      return res.status(404).json({
        ok: false,
        message: "Empresa no encontrada"
      });
    }

    const oficinas = await prisma.oficina.findMany({
      where: {
        empresaId
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    res.json({
      ok: true,
      oficinas
    });
  } catch (error) {
    console.error("Error obteniendo oficinas:", error);

    res.status(500).json({
      ok: false,
      message: "Error interno del servidor"
    });
  }
});
// Desactivar una oficina
app.patch(
  "/api/oficinas/:id/desactivar",
  autenticarToken,
  permitirRoles("SUPERADMIN"),
  async (req, res) => {
  try {
    const { id } = req.params;

    const oficina = await prisma.oficina.update({
      where: {
        id
      },
      data: {
        activo: false
      }
    });

    res.json({
      ok: true,
      oficina
    });
  } catch (error) {
    console.error("Error desactivando oficina:", error);

    if (error.code === "P2025") {
      return res.status(404).json({
        ok: false,
        message: "Oficina no encontrada"
      });
    }

    res.status(500).json({
      ok: false,
      message: "Error interno del servidor"
    });
  }
});
// Activar una oficina
app.patch(
  "/api/oficinas/:id/activar",
  autenticarToken,
  permitirRoles("SUPERADMIN"),
  async (req, res) => {
  try {
    const { id } = req.params;

    const oficina = await prisma.oficina.update({
      where: {
        id
      },
      data: {
        activo: true
      }
    });

    res.json({
      ok: true,
      oficina
    });
  } catch (error) {
    console.error("Error activando oficina:", error);

    if (error.code === "P2025") {
      return res.status(404).json({
        ok: false,
        message: "Oficina no encontrada"
      });
    }

    res.status(500).json({
      ok: false,
      message: "Error interno del servidor"
    });
  }
});
// Crear trabajador
app.post(
  "/api/trabajadores",
  autenticarToken,
  permitirRoles("SUPERADMIN", "ADMIN", "DIRECTOR"),
  async (req, res) => {
  try {
    const {
      nombre,
      email,
      password,
      empresaId,
      oficinaId
    } = req.body;

        // Comprobar permisos según el rol
    if (req.usuario.rol === "DIRECTOR") {
      if (req.usuario.empresaId !== empresaId) {
        return res.status(403).json({
          ok: false,
          message: "El director no puede crear trabajadores en otra empresa"
        });
      }

      if (req.usuario.oficinaId !== oficinaId) {
        return res.status(403).json({
          ok: false,
          message: "El director no puede crear trabajadores en otra oficina"
        });
      }
    }

    if (req.usuario.rol === "ADMIN") {
      if (req.usuario.empresaId !== empresaId) {
        return res.status(403).json({
          ok: false,
          message: "El administrador no puede crear trabajadores en otra empresa"
        });
      }
    }

    if (!nombre || !email || !password || !empresaId || !oficinaId) {
      return res.status(400).json({
        ok: false,
        message: "Nombre, email, password, empresa y oficina son obligatorios"
      });
    }

    // Comprobar empresa
    const empresa = await prisma.empresa.findUnique({
      where: {
        id: empresaId
      }
    });

    if (!empresa) {
      return res.status(404).json({
        ok: false,
        message: "Empresa no encontrada"
      });
    }

    // Comprobar oficina y que pertenece a la empresa
    const oficina = await prisma.oficina.findFirst({
      where: {
        id: oficinaId,
        empresaId
      }
    });

    if (!oficina) {
      return res.status(404).json({
        ok: false,
        message: "Oficina no encontrada o no pertenece a la empresa"
      });
    }

    // Comprobar email
    const usuarioExistente = await prisma.usuario.findUnique({
      where: {
        email
      }
    });

    if (usuarioExistente) {
      return res.status(409).json({
        ok: false,
        message: "El email ya está registrado"
      });
    }

    // Crear usuario y trabajador
    const passwordHash = await bcrypt.hash(password, 12);
    const resultado = await prisma.$transaction(async (tx) => {
      const usuario = await tx.usuario.create({
        data: {
          nombre,
          email,
          password: passwordHash,
          rol: "TRABAJADOR",
          activo: true,
          empresaId,
          oficinaId
        }
      });

      const trabajador = await tx.trabajador.create({
        data: {
          usuarioId: usuario.id,
          empresaId,
          oficinaId
        },
        include: {
  usuario: {
    select: {
      id: true,
      nombre: true,
      email: true,
      rol: true,
      activo: true,
      createdAt: true,
      updatedAt: true,
      empresaId: true,
      oficinaId: true
    }
  }
}
      });

      return trabajador;
    });

    res.status(201).json({
      ok: true,
      trabajador: resultado
    });
  } catch (error) {
    console.error("Error creando trabajador:", error);

    res.status(500).json({
      ok: false,
      message: "Error interno del servidor"
    });
  }
});
// Obtener trabajadores
app.get(
  "/api/trabajadores",
  autenticarToken,
  permitirRoles("SUPERADMIN", "ADMIN", "DIRECTOR"),
  async (req, res) => {
    try {
      let where = {};

      // ADMIN: solo trabajadores de su empresa
      if (req.usuario.rol === "ADMIN") {
        where.empresaId = req.usuario.empresaId;
      }

      // DIRECTOR: solo trabajadores de su oficina
      if (req.usuario.rol === "DIRECTOR") {
        where.empresaId = req.usuario.empresaId;
        where.oficinaId = req.usuario.oficinaId;
      }

      const trabajadores = await prisma.trabajador.findMany({
        where,
        include: {
          usuario: {
            select: {
              id: true,
              nombre: true,
              email: true,
              rol: true,
              activo: true,
              createdAt: true,
              updatedAt: true,
              empresaId: true,
              oficinaId: true
            }
          }
        },
        orderBy: {
          createdAt: "desc"
        }
      });

      res.json({
        ok: true,
        trabajadores
      });
    } catch (error) {
      console.error("Error obteniendo trabajadores:", error);

      res.status(500).json({
        ok: false,
        message: "Error interno del servidor"
      });
    }
  }
);
// Crear cliente
app.post(
  "/api/clientes",
  autenticarToken,
  permitirRoles("SUPERADMIN", "ADMIN", "DIRECTOR"),
  async (req, res) => {
    try {
      const {
        nombre,
        email,
        telefono,
        empresaId,
        oficinaId
      } = req.body;

      // Comprobar permisos según el rol
      if (req.usuario.rol === "DIRECTOR") {
        if (req.usuario.empresaId !== empresaId) {
          return res.status(403).json({
            ok: false,
            message: "El director no puede crear clientes en otra empresa"
          });
        }

        if (req.usuario.oficinaId !== oficinaId) {
          return res.status(403).json({
            ok: false,
            message: "El director no puede crear clientes en otra oficina"
          });
        }
      }

      if (req.usuario.rol === "ADMIN") {
        if (req.usuario.empresaId !== empresaId) {
          return res.status(403).json({
            ok: false,
            message: "El administrador no puede crear clientes en otra empresa"
          });
        }
      }

      if (!nombre || !email || !empresaId || !oficinaId) {
        return res.status(400).json({
          ok: false,
          message: "Nombre, email, empresa y oficina son obligatorios"
        });
      }

      // Comprobar empresa
      const empresa = await prisma.empresa.findUnique({
        where: {
          id: empresaId
        }
      });

      if (!empresa) {
        return res.status(404).json({
          ok: false,
          message: "Empresa no encontrada"
        });
      }

      // Comprobar oficina y que pertenece a la empresa
      const oficina = await prisma.oficina.findFirst({
        where: {
          id: oficinaId,
          empresaId
        }
      });

      if (!oficina) {
        return res.status(404).json({
          ok: false,
          message: "Oficina no encontrada o no pertenece a la empresa"
        });
      }

      // Crear cliente
      const cliente = await prisma.cliente.create({
        data: {
          nombre,
          email,
          telefono: telefono || null,
          empresaId,
          oficinaId
        }
      });

      res.status(201).json({
        ok: true,
        cliente
      });
    } catch (error) {
      console.error("Error creando cliente:", error);

      res.status(500).json({
        ok: false,
        message: "Error interno del servidor"
      });
    }
  }
);
// Obtener clientes según el rol
app.get(
  "/api/clientes",
  autenticarToken,
  permitirRoles("SUPERADMIN", "ADMIN", "DIRECTOR", "TRABAJADOR"),
  async (req, res) => {
    try {
      let where = {};

      // SUPERADMIN puede ver todos los clientes
      if (req.usuario.rol === "SUPERADMIN") {
        where = {};
      }

      // ADMIN puede ver todos los clientes de su empresa
      if (req.usuario.rol === "ADMIN") {
        where = {
          empresaId: req.usuario.empresaId
        };
      }

      // DIRECTOR puede ver los clientes de su oficina
      if (req.usuario.rol === "DIRECTOR") {
        where = {
          empresaId: req.usuario.empresaId,
          oficinaId: req.usuario.oficinaId
        };
      }

      // TRABAJADOR puede ver únicamente sus clientes asignados
// TRABAJADOR puede ver únicamente sus clientes asignados
if (req.usuario.rol === "TRABAJADOR") {
  const trabajador = await prisma.trabajador.findUnique({
    where: {
      usuarioId: req.usuario.id
    }
  });

  if (!trabajador) {
    return res.status(404).json({
      ok: false,
      message: "Trabajador no encontrado"
    });
  }

  where = {
    trabajadorId: trabajador.id
  };
}

      const clientes = await prisma.cliente.findMany({
        where,
        orderBy: {
          createdAt: "desc"
        }
      });

      res.json({
        ok: true,
        clientes
      });
    } catch (error) {
      console.error("Error obteniendo clientes:", error);

      res.status(500).json({
        ok: false,
        message: "Error interno del servidor"
      });
    }
  }
);
// Asignar cliente a un trabajador
app.patch(
  "/api/clientes/:id/asignar-trabajador",
  autenticarToken,
  permitirRoles("SUPERADMIN", "ADMIN", "DIRECTOR"),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { trabajadorId } = req.body;

      if (!trabajadorId) {
        return res.status(400).json({
          ok: false,
          message: "El trabajadorId es obligatorio"
        });
      }

      // Buscar cliente
      const cliente = await prisma.cliente.findUnique({
        where: {
          id
        }
      });

      if (!cliente) {
        return res.status(404).json({
          ok: false,
          message: "Cliente no encontrado"
        });
      }

      // Buscar trabajador
      const trabajador = await prisma.trabajador.findUnique({
        where: {
          id: trabajadorId
        },
        include: {
          usuario: true
        }
      });

      if (!trabajador) {
        return res.status(404).json({
          ok: false,
          message: "Trabajador no encontrado"
        });
      }

      // SUPERADMIN puede asignar cualquier cliente
      // a cualquier trabajador
      if (req.usuario.rol === "SUPERADMIN") {
        // Sin restricciones adicionales
      }

      // ADMIN solo puede trabajar dentro de su empresa
      if (req.usuario.rol === "ADMIN") {
        if (cliente.empresaId !== req.usuario.empresaId) {
          return res.status(403).json({
            ok: false,
            message: "El administrador no puede asignar clientes de otra empresa"
          });
        }

        if (trabajador.empresaId !== req.usuario.empresaId) {
          return res.status(403).json({
            ok: false,
            message: "El administrador no puede asignar trabajadores de otra empresa"
          });
        }
      }

      // DIRECTOR solo puede trabajar dentro de su oficina
      if (req.usuario.rol === "DIRECTOR") {
        if (
          cliente.empresaId !== req.usuario.empresaId ||
          cliente.oficinaId !== req.usuario.oficinaId
        ) {
          return res.status(403).json({
            ok: false,
            message: "El director no puede asignar clientes de otra oficina"
          });
        }

        if (
          trabajador.empresaId !== req.usuario.empresaId ||
          trabajador.oficinaId !== req.usuario.oficinaId
        ) {
          return res.status(403).json({
            ok: false,
            message: "El director no puede asignar trabajadores de otra oficina"
          });
        }
      }

      // Asignar cliente al trabajador
      const clienteActualizado = await prisma.cliente.update({
        where: {
          id
        },
        data: {
          trabajadorId
        }
      });

      res.json({
        ok: true,
        message: "Cliente asignado correctamente",
        cliente: clienteActualizado
      });
    } catch (error) {
      console.error("Error asignando cliente:", error);

      res.status(500).json({
        ok: false,
        message: "Error interno del servidor"
      });
    }
  }
);
// Login
app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        ok: false,
        message: "El email y la contraseña son obligatorios"
      });
    }

    const usuario = await prisma.usuario.findUnique({
      where: {
        email
      }
    });

    if (!usuario || !usuario.activo) {
      return res.status(401).json({
        ok: false,
        message: "Email o contraseña incorrectos"
      });
    }

    const passwordCorrecta = await bcrypt.compare(
      password,
      usuario.password
    );

    if (!passwordCorrecta) {
      return res.status(401).json({
        ok: false,
        message: "Email o contraseña incorrectos"
      });
    }

    const token = jwt.sign(
      {
        id: usuario.id,
        email: usuario.email,
        rol: usuario.rol,
        empresaId: usuario.empresaId,
        oficinaId: usuario.oficinaId
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "8h"
      }
    );

    res.json({
      ok: true,
      message: "Login correcto",
      token,
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol,
        empresaId: usuario.empresaId,
        oficinaId: usuario.oficinaId
      }
    });
  } catch (error) {
    console.error("Error en login:", error);

    res.status(500).json({
      ok: false,
      message: "Error interno del servidor"
    });
  }
});
module.exports = app;
