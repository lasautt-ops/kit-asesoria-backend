const express = require("express");
const cors = require("cors");
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const autenticarToken = require("./middleware/auth");
const permitirRoles = require("./middleware/roles");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const app = express();
const prisma = new PrismaClient();

const uploadsDir = path.join(process.cwd(), "uploads");

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },

  filename: (req, file, cb) => {
    const extension = path.extname(file.originalname);
    const nombreUnico = `${Date.now()}-${Math.round(Math.random() * 1e9)}${extension}`;

    cb(null, nombreUnico);
  }
});

const upload = multer({
  storage
});

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

// Modificar trabajador
app.patch(
  "/api/trabajadores/:id",
  autenticarToken,
  permitirRoles("SUPERADMIN", "ADMIN", "DIRECTOR"),
  async (req, res) => {
    try {
      const { id } = req.params;

      const {
        nombre,
        email,
        password,
        empresaId,
        oficinaId,
        activo
      } = req.body;

      const trabajador = await prisma.trabajador.findUnique({
        where: {
          id
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

      // Comprobar ámbito del usuario
      if (req.usuario.rol === "ADMIN") {
        if (trabajador.empresaId !== req.usuario.empresaId) {
          return res.status(403).json({
            ok: false,
            message: "El administrador no puede modificar trabajadores de otra empresa"
          });
        }
      }

      if (req.usuario.rol === "DIRECTOR") {
        if (
          trabajador.empresaId !== req.usuario.empresaId ||
          trabajador.oficinaId !== req.usuario.oficinaId
        ) {
          return res.status(403).json({
            ok: false,
            message: "El director no puede modificar trabajadores de otra oficina"
          });
        }
      }

      const nuevaEmpresaId =
        empresaId !== undefined ? empresaId : trabajador.empresaId;

      const nuevaOficinaId =
        oficinaId !== undefined ? oficinaId : trabajador.oficinaId;

      // ADMIN no puede cambiar de empresa
      if (
        req.usuario.rol === "ADMIN" &&
        nuevaEmpresaId !== req.usuario.empresaId
      ) {
        return res.status(403).json({
          ok: false,
          message: "El administrador no puede mover trabajadores a otra empresa"
        });
      }

      // DIRECTOR no puede cambiar de empresa ni de oficina
      if (req.usuario.rol === "DIRECTOR") {
        if (nuevaEmpresaId !== req.usuario.empresaId) {
          return res.status(403).json({
            ok: false,
            message: "El director no puede mover trabajadores a otra empresa"
          });
        }

        if (nuevaOficinaId !== req.usuario.oficinaId) {
          return res.status(403).json({
            ok: false,
            message: "El director no puede mover trabajadores a otra oficina"
          });
        }
      }

      // Comprobar empresa
      const empresa = await prisma.empresa.findUnique({
        where: {
          id: nuevaEmpresaId
        }
      });

      if (!empresa) {
        return res.status(404).json({
          ok: false,
          message: "Empresa no encontrada"
        });
      }

      // Comprobar oficina
      const oficina = await prisma.oficina.findFirst({
        where: {
          id: nuevaOficinaId,
          empresaId: nuevaEmpresaId
        }
      });

      if (!oficina) {
        return res.status(404).json({
          ok: false,
          message: "Oficina no encontrada o no pertenece a la empresa"
        });
      }

      // Comprobar email si se modifica
      if (
        email !== undefined &&
        email !== trabajador.usuario.email
      ) {
        const usuarioExistente = await prisma.usuario.findUnique({
          where: {
            email
          }
        });

        if (usuarioExistente && usuarioExistente.id !== trabajador.usuarioId) {
          return res.status(409).json({
            ok: false,
            message: "El email ya está registrado"
          });
        }
      }

      const resultado = await prisma.$transaction(async (tx) => {
        const datosUsuario = {
          ...(nombre !== undefined && { nombre }),
          ...(email !== undefined && { email }),
          ...(activo !== undefined && { activo }),
          empresaId: nuevaEmpresaId,
          oficinaId: nuevaOficinaId,
          ...(password !== undefined &&
            password !== "" && {
              password: await bcrypt.hash(password, 12)
            })
        };

        const usuarioActualizado = await tx.usuario.update({
          where: {
            id: trabajador.usuarioId
          },
          data: datosUsuario
        });

        const trabajadorActualizado = await tx.trabajador.update({
          where: {
            id
          },
          data: {
            empresaId: nuevaEmpresaId,
            oficinaId: nuevaOficinaId
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

        return trabajadorActualizado;
      });

      res.json({
        ok: true,
        message: "Trabajador actualizado correctamente",
        trabajador: resultado
      });
    } catch (error) {
      console.error("Error modificando trabajador:", error);

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
// Crear acceso de usuario para un cliente
app.post(
  "/api/clientes/:id/crear-acceso",
  autenticarToken,
  permitirRoles("SUPERADMIN", "ADMIN", "DIRECTOR"),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { password } = req.body;

      if (!password) {
        return res.status(400).json({
          ok: false,
          message: "La contraseña es obligatoria"
        });
      }

      if (password.length < 8) {
        return res.status(400).json({
          ok: false,
          message: "La contraseña debe tener al menos 8 caracteres"
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

      // Comprobar permisos según el rol
      if (req.usuario.rol === "ADMIN") {
        if (cliente.empresaId !== req.usuario.empresaId) {
          return res.status(403).json({
            ok: false,
            message: "El administrador no puede crear accesos de clientes de otra empresa"
          });
        }
      }

      if (req.usuario.rol === "DIRECTOR") {
        if (
          cliente.empresaId !== req.usuario.empresaId ||
          cliente.oficinaId !== req.usuario.oficinaId
        ) {
          return res.status(403).json({
            ok: false,
            message: "El director no puede crear accesos de clientes de otra oficina"
          });
        }
      }

      // Comprobar si el cliente ya tiene usuario
      if (cliente.usuarioId) {
        return res.status(400).json({
          ok: false,
          message: "Este cliente ya tiene un acceso creado"
        });
      }

      // Comprobar si el email ya pertenece a otro usuario
      const usuarioExistente = await prisma.usuario.findUnique({
        where: {
          email: cliente.email
        }
      });

      if (usuarioExistente) {
        return res.status(400).json({
          ok: false,
          message: "El email del cliente ya está asociado a otro usuario"
        });
      }

      // Encriptar contraseña
      const passwordHash = await bcrypt.hash(password, 10);

      // Crear usuario y asociarlo al cliente
      const resultado = await prisma.$transaction(async (tx) => {
        const usuario = await tx.usuario.create({
          data: {
            nombre: cliente.nombre,
            email: cliente.email,
            password: passwordHash,
            rol: "CLIENTE",
            empresaId: cliente.empresaId,
            oficinaId: cliente.oficinaId
          }
        });

        const clienteActualizado = await tx.cliente.update({
          where: {
            id: cliente.id
          },
          data: {
            usuarioId: usuario.id
          }
        });

        return {
          usuario,
          cliente: clienteActualizado
        };
      });

      res.status(201).json({
        ok: true,
        message: "Acceso del cliente creado correctamente",
        cliente: {
          id: resultado.cliente.id,
          nombre: resultado.cliente.nombre,
          email: resultado.cliente.email,
          usuarioId: resultado.cliente.usuarioId
        }
      });
    } catch (error) {
      console.error("Error creando acceso del cliente:", error);

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
// Modificar datos de un cliente
app.patch(
  "/api/clientes/:id",
  autenticarToken,
  permitirRoles("SUPERADMIN", "ADMIN", "DIRECTOR", "TRABAJADOR"),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { nombre, email, telefono } = req.body;

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

      // TRABAJADOR solo puede modificar sus clientes asignados
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

        if (cliente.trabajadorId !== trabajador.id) {
          return res.status(403).json({
            ok: false,
            message: "El trabajador no puede modificar este cliente"
          });
        }
      }

      // ADMIN solo puede modificar clientes de su empresa
      if (req.usuario.rol === "ADMIN") {
        if (cliente.empresaId !== req.usuario.empresaId) {
          return res.status(403).json({
            ok: false,
            message: "El administrador no puede modificar clientes de otra empresa"
          });
        }
      }

      // DIRECTOR solo puede modificar clientes de su oficina
      if (req.usuario.rol === "DIRECTOR") {
        if (
          cliente.empresaId !== req.usuario.empresaId ||
          cliente.oficinaId !== req.usuario.oficinaId
        ) {
          return res.status(403).json({
            ok: false,
            message: "El director no puede modificar clientes de otra oficina"
          });
        }
      }

      // Comprobar que al menos un dato se quiere modificar
      if (
        nombre === undefined &&
        email === undefined &&
        telefono === undefined
      ) {
        return res.status(400).json({
          ok: false,
          message: "Debes indicar al menos un dato para modificar"
        });
      }

      const clienteActualizado = await prisma.cliente.update({
        where: {
          id
        },
        data: {
          ...(nombre !== undefined && { nombre }),
          ...(email !== undefined && { email }),
          ...(telefono !== undefined && { telefono })
        }
      });

      res.json({
        ok: true,
        message: "Cliente actualizado correctamente",
        cliente: clienteActualizado
      });
    } catch (error) {
      console.error("Error modificando cliente:", error);

      res.status(500).json({
        ok: false,
        message: "Error interno del servidor"
      });
    }
  }
);

// Obtener los datos del cliente autenticado
app.get(
  "/api/mi-cliente",
  autenticarToken,
  permitirRoles("CLIENTE"),
  async (req, res) => {
    try {
      const cliente = await prisma.cliente.findUnique({
        where: {
          usuarioId: req.usuario.id
        },
        include: {
          empresa: true,
          oficina: true,
          trabajador: {
            include: {
              usuario: true
            }
          }
        }
      });

      if (!cliente) {
        return res.status(404).json({
          ok: false,
          message: "Cliente no encontrado"
        });
      }

      res.json({
        ok: true,
        cliente: {
          id: cliente.id,
          nombre: cliente.nombre,
          email: cliente.email,
          telefono: cliente.telefono,
          empresa: {
            id: cliente.empresa.id,
            nombre: cliente.empresa.nombre
          },
          oficina: {
            id: cliente.oficina.id,
            nombre: cliente.oficina.nombre
          },
          trabajador: cliente.trabajador
            ? {
                id: cliente.trabajador.id,
                nombre: cliente.trabajador.usuario.nombre,
                email: cliente.trabajador.usuario.email
              }
            : null
        }
      });
    } catch (error) {
      console.error("Error obteniendo datos del cliente:", error);

      res.status(500).json({
        ok: false,
        message: "Error interno del servidor"
      });
    }
  }
);

// Modificar los datos del cliente autenticado
app.patch(
  "/api/mi-cliente",
  autenticarToken,
  permitirRoles("CLIENTE"),
  async (req, res) => {
    try {
      const { nombre, email, telefono } = req.body;

      // Buscar cliente asociado al usuario autenticado
      const cliente = await prisma.cliente.findUnique({
        where: {
          usuarioId: req.usuario.id
        }
      });

      if (!cliente) {
        return res.status(404).json({
          ok: false,
          message: "Cliente no encontrado"
        });
      }

      // Comprobar que se quiere modificar al menos un dato
      if (
        nombre === undefined &&
        email === undefined &&
        telefono === undefined
      ) {
        return res.status(400).json({
          ok: false,
          message: "Debes indicar al menos un dato para modificar"
        });
      }

      // Si cambia el email, comprobar que no esté utilizado
      if (email !== undefined && email !== cliente.email) {
        const usuarioExistente = await prisma.usuario.findUnique({
          where: {
            email
          }
        });

        if (usuarioExistente && usuarioExistente.id !== req.usuario.id) {
          return res.status(400).json({
            ok: false,
            message: "El email ya está asociado a otro usuario"
          });
        }
      }

      const resultado = await prisma.$transaction(async (tx) => {
        const clienteActualizado = await tx.cliente.update({
          where: {
            id: cliente.id
          },
          data: {
            ...(nombre !== undefined && { nombre }),
            ...(email !== undefined && { email }),
            ...(telefono !== undefined && { telefono })
          }
        });

        // Mantener sincronizado el Usuario
        const usuarioActualizado = await tx.usuario.update({
          where: {
            id: req.usuario.id
          },
          data: {
            ...(nombre !== undefined && { nombre }),
            ...(email !== undefined && { email })
          }
        });

        return {
          cliente: clienteActualizado,
          usuario: usuarioActualizado
        };
      });

      res.json({
        ok: true,
        message: "Datos del cliente actualizados correctamente",
        cliente: {
          id: resultado.cliente.id,
          nombre: resultado.cliente.nombre,
          email: resultado.cliente.email,
          telefono: resultado.cliente.telefono
        }
      });
    } catch (error) {
      console.error("Error modificando datos del cliente:", error);

      res.status(500).json({
        ok: false,
        message: "Error interno del servidor"
      });
    }
  }
);

// Subir documento de un cliente
app.post(
  "/api/documentos",
  autenticarToken,
  permitirRoles("SUPERADMIN", "ADMIN", "DIRECTOR", "TRABAJADOR", "CLIENTE"),
  upload.single("archivo"),
  async (req, res) => {
    try {
      const {
        clienteId,
        nombre,
        tipo
      } = req.body;

      if (!clienteId || !nombre || !tipo) {
        return res.status(400).json({
          ok: false,
          message: "clienteId, nombre y tipo son obligatorios"
        });
      }

      if (!req.file) {
        return res.status(400).json({
          ok: false,
          message: "El archivo es obligatorio"
        });
      }

      // Buscar cliente
      const cliente = await prisma.cliente.findUnique({
        where: {
          id: clienteId
        }
      });

      if (!cliente) {
        return res.status(404).json({
          ok: false,
          message: "Cliente no encontrado"
        });
      }

      // CLIENTE solo puede subir documentos para sí mismo
      if (req.usuario.rol === "CLIENTE") {
        const clienteUsuario = await prisma.cliente.findUnique({
          where: {
            usuarioId: req.usuario.id
          }
        });

        if (!clienteUsuario || clienteUsuario.id !== clienteId) {
          return res.status(403).json({
            ok: false,
            message: "El cliente no puede subir documentos para otro cliente"
          });
        }
      }

      // TRABAJADOR solo puede subir documentos de sus clientes
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

        if (cliente.trabajadorId !== trabajador.id) {
          return res.status(403).json({
            ok: false,
            message: "El trabajador no puede subir documentos para este cliente"
          });
        }
      }

      // ADMIN solo puede trabajar con clientes de su empresa
      if (req.usuario.rol === "ADMIN") {
        if (cliente.empresaId !== req.usuario.empresaId) {
          return res.status(403).json({
            ok: false,
            message: "El administrador no puede subir documentos para clientes de otra empresa"
          });
        }
      }

      // DIRECTOR solo puede trabajar con clientes de su oficina
      if (req.usuario.rol === "DIRECTOR") {
        if (
          cliente.empresaId !== req.usuario.empresaId ||
          cliente.oficinaId !== req.usuario.oficinaId
        ) {
          return res.status(403).json({
            ok: false,
            message: "El director no puede subir documentos para clientes de otra oficina"
          });
        }
      }

      // Crear registro del documento
      const documento = await prisma.documento.create({
        data: {
          nombre,
          nombreArchivo: req.file.originalname,
          tipo,
          estado: "PENDIENTE",
          rutaArchivo: req.file.path,
          clienteId,
          subidoPorUsuarioId: req.usuario.id
        }
      });

      res.status(201).json({
        ok: true,
        message: "Documento subido correctamente",
        documento
      });
    } catch (error) {
      console.error("Error subiendo documento:", error);

      res.status(500).json({
        ok: false,
        message: "Error interno del servidor"
      });
    }
  }
);

// Obtener documentos según el rol
app.get(
  "/api/documentos",
  autenticarToken,
  permitirRoles("SUPERADMIN", "ADMIN", "DIRECTOR", "TRABAJADOR", "CLIENTE"),
  async (req, res) => {
    try {
      const { clienteId } = req.query;

      let where = {};

      // SUPERADMIN puede ver todos los documentos
      if (req.usuario.rol === "SUPERADMIN") {
        where = {};
      }

      // ADMIN puede ver documentos de clientes de su empresa
      if (req.usuario.rol === "ADMIN") {
        where = {
          cliente: {
            empresaId: req.usuario.empresaId
          }
        };
      }

      // DIRECTOR puede ver documentos de clientes de su oficina
      if (req.usuario.rol === "DIRECTOR") {
        where = {
          cliente: {
            empresaId: req.usuario.empresaId,
            oficinaId: req.usuario.oficinaId
          }
        };
      }

      // TRABAJADOR puede ver documentos de sus clientes asignados
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
          cliente: {
            trabajadorId: trabajador.id
          }
        };
      }

      // CLIENTE solo puede ver sus propios documentos
      if (req.usuario.rol === "CLIENTE") {
        const cliente = await prisma.cliente.findUnique({
          where: {
            usuarioId: req.usuario.id
          }
        });

        if (!cliente) {
          return res.status(404).json({
            ok: false,
            message: "Cliente no encontrado"
          });
        }

        where = {
          clienteId: cliente.id
        };
      }

      // Si se indica clienteId, se mantiene siempre la restricción del rol
if (clienteId) {
  where = {
    AND: [
      where,
      {
        clienteId
      }
    ]
  };
}
      // CLIENTE solo puede ver sus propios documentos
      if (req.usuario.rol === "CLIENTE") {
        const cliente = await prisma.cliente.findUnique({
          where: {
            usuarioId: req.usuario.id
          }
        });

        if (!cliente) {
          return res.status(404).json({
            ok: false,
            message: "Cliente no encontrado"
          });
        }

        where = {
          clienteId: cliente.id
        };
      }
      const documentos = await prisma.documento.findMany({
        where,
        orderBy: {
          createdAt: "desc"
        },
        select: {
          id: true,
          nombre: true,
          nombreArchivo: true,
          tipo: true,
          estado: true,
          createdAt: true,
          updatedAt: true,
          clienteId: true,
          subidoPorUsuarioId: true,
          cliente: {
            select: {
              id: true,
              nombre: true,
              email: true
            }
          }
        }
      });

      res.json({
        ok: true,
        documentos
      });
    } catch (error) {
      console.error("Error obteniendo documentos:", error);

      res.status(500).json({
        ok: false,
        message: "Error interno del servidor"
      });
    }
  }
);

// Descargar documento según permisos
app.get(
  "/api/documentos/:id/descargar",
  autenticarToken,
  permitirRoles("SUPERADMIN", "ADMIN", "DIRECTOR", "TRABAJADOR", "CLIENTE"),
  async (req, res) => {
    try {
      const { id } = req.params;

      const documento = await prisma.documento.findUnique({
        where: {
          id
        },
        include: {
          cliente: true
        }
      });

      if (!documento) {
        return res.status(404).json({
          ok: false,
          message: "Documento no encontrado"
        });
      }

      // ADMIN solo puede descargar documentos de clientes de su empresa
      if (req.usuario.rol === "ADMIN") {
        if (documento.cliente.empresaId !== req.usuario.empresaId) {
          return res.status(403).json({
            ok: false,
            message: "El administrador no puede descargar documentos de otra empresa"
          });
        }
      }

      // DIRECTOR solo puede descargar documentos de clientes de su oficina
      if (req.usuario.rol === "DIRECTOR") {
        if (
          documento.cliente.empresaId !== req.usuario.empresaId ||
          documento.cliente.oficinaId !== req.usuario.oficinaId
        ) {
          return res.status(403).json({
            ok: false,
            message: "El director no puede descargar documentos de otra oficina"
          });
        }
      }

      // TRABAJADOR solo puede descargar documentos de sus clientes
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

        if (documento.cliente.trabajadorId !== trabajador.id) {
          return res.status(403).json({
            ok: false,
            message: "El trabajador no puede descargar este documento"
          });
        }
      }

      // CLIENTE solo puede descargar sus propios documentos
      if (req.usuario.rol === "CLIENTE") {
        const cliente = await prisma.cliente.findUnique({
          where: {
            usuarioId: req.usuario.id
          }
        });

        if (!cliente || documento.clienteId !== cliente.id) {
          return res.status(403).json({
            ok: false,
            message: "El cliente no puede descargar este documento"
          });
        }
      }

      // Comprobar que el archivo existe
      if (!fs.existsSync(documento.rutaArchivo)) {
        return res.status(404).json({
          ok: false,
          message: "Archivo no encontrado en el servidor"
        });
      }

      // Descargar archivo
      res.download(
        documento.rutaArchivo,
        documento.nombreArchivo,
        (error) => {
          if (error) {
            console.error("Error descargando documento:", error);
          }
        }
      );
    } catch (error) {
      console.error("Error descargando documento:", error);

      res.status(500).json({
        ok: false,
        message: "Error interno del servidor"
      });
    }
  }
);

// Eliminar documento según permisos
app.delete(
  "/api/documentos/:id",
  autenticarToken,
  permitirRoles("SUPERADMIN", "ADMIN", "DIRECTOR"),
  async (req, res) => {
    try {
      const { id } = req.params;

      // Buscar documento
      const documento = await prisma.documento.findUnique({
        where: {
          id
        },
        include: {
          cliente: true
        }
      });

      if (!documento) {
        return res.status(404).json({
          ok: false,
          message: "Documento no encontrado"
        });
      }

      // SUPERADMIN puede eliminar cualquier documento
      if (req.usuario.rol === "SUPERADMIN") {
        // Sin restricciones adicionales
      }

      // ADMIN solo puede eliminar documentos de clientes de su empresa
      if (req.usuario.rol === "ADMIN") {
        if (documento.cliente.empresaId !== req.usuario.empresaId) {
          return res.status(403).json({
            ok: false,
            message: "El administrador no puede eliminar documentos de otra empresa"
          });
        }
      }

      // DIRECTOR solo puede eliminar documentos de clientes de su oficina
      if (req.usuario.rol === "DIRECTOR") {
        if (
          documento.cliente.empresaId !== req.usuario.empresaId ||
          documento.cliente.oficinaId !== req.usuario.oficinaId
        ) {
          return res.status(403).json({
            ok: false,
            message: "El director no puede eliminar documentos de otra oficina"
          });
        }
      }

      // Comprobar si el archivo físico existe
      if (documento.rutaArchivo && fs.existsSync(documento.rutaArchivo)) {
        fs.unlinkSync(documento.rutaArchivo);
      }

      // Eliminar registro de PostgreSQL
      await prisma.documento.delete({
        where: {
          id
        }
      });

      res.json({
        ok: true,
        message: "Documento eliminado correctamente"
      });
    } catch (error) {
      console.error("Error eliminando documento:", error);

      res.status(500).json({
        ok: false,
        message: "Error interno del servidor"
      });
    }
  }
);

// =====================================================
// TAREAS
// =====================================================


// Obtener tareas según el rol
app.get(
  "/api/tareas",
  autenticarToken,
  permitirRoles("SUPERADMIN", "ADMIN", "DIRECTOR", "TRABAJADOR", "CLIENTE"),
  async (req, res) => {
    try {
      let where = {};

      // SUPERADMIN puede ver todas las tareas
      if (req.usuario.rol === "SUPERADMIN") {
        where = {};
      }

      // ADMIN puede ver tareas de su empresa
      if (req.usuario.rol === "ADMIN") {
        where = {
          empresaId: req.usuario.empresaId
        };
      }

      // DIRECTOR puede ver tareas de su oficina
      if (req.usuario.rol === "DIRECTOR") {
        where = {
          empresaId: req.usuario.empresaId,
          oficinaId: req.usuario.oficinaId
        };
      }

      // TRABAJADOR solo puede ver tareas asignadas a él
      if (req.usuario.rol === "TRABAJADOR") {
        where = {
          asignadoAUsuarioId: req.usuario.id
        };
      }

      // CLIENTE solo puede ver sus propias tareas
      if (req.usuario.rol === "CLIENTE") {
        where = {
          cliente: {
            usuarioId: req.usuario.id
          }
        };
      }

      const tareas = await prisma.tarea.findMany({
        where,
        orderBy: {
          createdAt: "desc"
        },
        include: {
          empresa: {
            select: {
              id: true,
              nombre: true
            }
          },
          oficina: {
            select: {
              id: true,
              nombre: true
            }
          },
          cliente: {
            select: {
              id: true,
              nombre: true,
              email: true
            }
          },
          asignadoAUsuario: {
            select: {
              id: true,
              nombre: true,
              email: true,
              rol: true
            }
          },
          creadoPorUsuario: {
            select: {
              id: true,
              nombre: true,
              email: true,
              rol: true
            }
          }
        }
      });

      res.json({
        ok: true,
        tareas
      });
    } catch (error) {
      console.error("Error obteniendo tareas:", error);

      res.status(500).json({
        ok: false,
        message: "Error interno del servidor"
      });
    }
  }
);
// Obtener una tarea por ID según permisos
app.get(
  "/api/tareas/:id",
  autenticarToken,
  permitirRoles("SUPERADMIN", "ADMIN", "DIRECTOR", "TRABAJADOR", "CLIENTE"),
  async (req, res) => {
    try {
      const { id } = req.params;

      const tarea = await prisma.tarea.findUnique({
        where: {
          id
        },
        include: {
          empresa: {
            select: {
              id: true,
              nombre: true
            }
          },
          oficina: {
            select: {
              id: true,
              nombre: true
            }
          },
          cliente: {
            select: {
              id: true,
              nombre: true,
              email: true,
              usuarioId: true
            }
          },
          asignadoAUsuario: {
            select: {
              id: true,
              nombre: true,
              email: true,
              rol: true
            }
          },
          creadoPorUsuario: {
            select: {
              id: true,
              nombre: true,
              email: true,
              rol: true
            }
          }
        }
      });

      if (!tarea) {
        return res.status(404).json({
          ok: false,
          message: "Tarea no encontrada"
        });
      }

      // ADMIN solo puede ver tareas de su empresa
      if (req.usuario.rol === "ADMIN") {
        if (tarea.empresaId !== req.usuario.empresaId) {
          return res.status(403).json({
            ok: false,
            message: "El administrador no puede ver tareas de otra empresa"
          });
        }
      }

      // DIRECTOR solo puede ver tareas de su oficina
      if (req.usuario.rol === "DIRECTOR") {
        if (
          tarea.empresaId !== req.usuario.empresaId ||
          tarea.oficinaId !== req.usuario.oficinaId
        ) {
          return res.status(403).json({
            ok: false,
            message: "El director no puede ver tareas de otra oficina"
          });
        }
      }

      // TRABAJADOR solo puede ver tareas asignadas a él
      if (req.usuario.rol === "TRABAJADOR") {
        if (tarea.asignadoAUsuarioId !== req.usuario.id) {
          return res.status(403).json({
            ok: false,
            message: "El trabajador no puede ver tareas no asignadas a él"
          });
        }
      }

      // CLIENTE solo puede ver sus propias tareas
      if (req.usuario.rol === "CLIENTE") {
        if (
          !tarea.cliente ||
          tarea.cliente.usuarioId !== req.usuario.id
        ) {
          return res.status(403).json({
            ok: false,
            message: "El cliente no puede ver tareas de otro cliente"
          });
        }
      }

      // SUPERADMIN no tiene restricciones adicionales

      res.json({
        ok: true,
        tarea
      });
    } catch (error) {
      console.error("Error obteniendo tarea:", error);

      res.status(500).json({
        ok: false,
        message: "Error interno del servidor"
      });
    }
  }
);

// Modificar tarea
app.patch(
  "/api/tareas/:id",
  autenticarToken,
  permitirRoles("SUPERADMIN", "ADMIN", "DIRECTOR", "TRABAJADOR", "CLIENTE"),
  async (req, res) => {
    try {
      const { id } = req.params;

      const {
        titulo,
        descripcion,
        estado,
        prioridad,
        fechaLimite,
        oficinaId,
        clienteId,
        asignadoAUsuarioId
      } = req.body;

      const tarea = await prisma.tarea.findUnique({
        where: {
          id
        },
        include: {
          cliente: true
        }
      });

      if (!tarea) {
        return res.status(404).json({
          ok: false,
          message: "Tarea no encontrada"
        });
      }

      // =====================================================
      // CLIENTE
      // El cliente solo puede cambiar el estado de sus tareas
      // =====================================================
      if (req.usuario.rol === "CLIENTE") {
        // Comprobar que la tarea pertenece al cliente
        if (
          !tarea.cliente ||
          tarea.cliente.usuarioId !== req.usuario.id
        ) {
          return res.status(403).json({
            ok: false,
            message: "El cliente no puede modificar tareas de otro cliente"
          });
        }

        // El estado es obligatorio
        if (estado === undefined) {
          return res.status(400).json({
            ok: false,
            message: "El cliente solo puede modificar el estado de la tarea"
          });
        }

        // El cliente no puede modificar ningún otro campo
        const camposNoPermitidos = [
          "titulo",
          "descripcion",
          "prioridad",
          "fechaLimite",
          "oficinaId",
          "clienteId",
          "asignadoAUsuarioId"
        ];

        const camposEnviados = Object.keys(req.body);

        const campoNoPermitido = camposEnviados.find((campo) =>
          camposNoPermitidos.includes(campo)
        );

        if (campoNoPermitido) {
          return res.status(403).json({
            ok: false,
            message: "El cliente solo puede modificar el estado de la tarea"
          });
        }

        // Comprobar estado válido
        const estadosPermitidos = [
          "PENDIENTE",
          "EN_PROCESO",
          "COMPLETADA",
          "CANCELADA"
        ];

        if (!estadosPermitidos.includes(estado)) {
          return res.status(400).json({
            ok: false,
            message: "Estado de tarea no válido"
          });
        }

        const tareaActualizada = await prisma.tarea.update({
          where: {
            id
          },
          data: {
            estado
          },
          include: {
            empresa: {
              select: {
                id: true,
                nombre: true
              }
            },
            oficina: {
              select: {
                id: true,
                nombre: true
              }
            },
            cliente: {
              select: {
                id: true,
                nombre: true,
                email: true
              }
            },
            asignadoAUsuario: {
              select: {
                id: true,
                nombre: true,
                email: true,
                rol: true
              }
            },
            creadoPorUsuario: {
              select: {
                id: true,
                nombre: true,
                email: true,
                rol: true
              }
            }
          }
        });

        return res.json({
          ok: true,
          message: "Estado de la tarea actualizado correctamente",
          tarea: tareaActualizada
        });
      }

      // =====================================================
      // COMPROBAR ÁMBITO DE ADMIN
      // =====================================================
      if (req.usuario.rol === "ADMIN") {
        if (tarea.empresaId !== req.usuario.empresaId) {
          return res.status(403).json({
            ok: false,
            message: "El administrador no puede modificar tareas de otra empresa"
          });
        }
      }

      // =====================================================
      // COMPROBAR ÁMBITO DE DIRECTOR
      // =====================================================
      if (req.usuario.rol === "DIRECTOR") {
        if (
          tarea.empresaId !== req.usuario.empresaId ||
          tarea.oficinaId !== req.usuario.oficinaId
        ) {
          return res.status(403).json({
            ok: false,
            message: "El director no puede modificar tareas de otra oficina"
          });
        }
      }

      // =====================================================
      // COMPROBAR ÁMBITO DE TRABAJADOR
      // =====================================================
      if (req.usuario.rol === "TRABAJADOR") {
        if (tarea.asignadoAUsuarioId !== req.usuario.id) {
          return res.status(403).json({
            ok: false,
            message: "El trabajador no puede modificar tareas no asignadas a él"
          });
        }
      }

      // =====================================================
      // ACTUALIZACIÓN PARA SUPERADMIN / ADMIN / DIRECTOR / TRABAJADOR
      // =====================================================
      const datosActualizacion = {};

      if (titulo !== undefined) {
        datosActualizacion.titulo = titulo;
      }

      if (descripcion !== undefined) {
        datosActualizacion.descripcion = descripcion;
      }

      if (estado !== undefined) {
        datosActualizacion.estado = estado;
      }

      if (prioridad !== undefined) {
        datosActualizacion.prioridad = prioridad;
      }

      if (fechaLimite !== undefined) {
        datosActualizacion.fechaLimite = fechaLimite;
      }

      if (oficinaId !== undefined) {
        datosActualizacion.oficinaId = oficinaId;
      }

      if (clienteId !== undefined) {
        datosActualizacion.clienteId = clienteId;
      }

      if (asignadoAUsuarioId !== undefined) {
        datosActualizacion.asignadoAUsuarioId = asignadoAUsuarioId;
      }

      const tareaActualizada = await prisma.tarea.update({
        where: {
          id
        },
        data: datosActualizacion,
        include: {
          empresa: {
            select: {
              id: true,
              nombre: true
            }
          },
          oficina: {
            select: {
              id: true,
              nombre: true
            }
          },
          cliente: {
            select: {
              id: true,
              nombre: true,
              email: true
            }
          },
          asignadoAUsuario: {
            select: {
              id: true,
              nombre: true,
              email: true,
              rol: true
            }
          },
          creadoPorUsuario: {
            select: {
              id: true,
              nombre: true,
              email: true,
              rol: true
            }
          }
        }
      });

      res.json({
        ok: true,
        message: "Tarea actualizada correctamente",
        tarea: tareaActualizada
      });
    } catch (error) {
      console.error("Error modificando tarea:", error);

      res.status(500).json({
        ok: false,
        message: "Error interno del servidor"
      });
    }
  }
);

// Eliminar tarea
app.delete(
  "/api/tareas/:id",
  autenticarToken,
  permitirRoles("SUPERADMIN", "ADMIN", "DIRECTOR"),
  async (req, res) => {
    try {
      const { id } = req.params;

      const tarea = await prisma.tarea.findUnique({
        where: {
          id
        }
      });

      if (!tarea) {
        return res.status(404).json({
          ok: false,
          message: "Tarea no encontrada"
        });
      }

      // ADMIN solo puede eliminar tareas de su empresa
      if (req.usuario.rol === "ADMIN") {
        if (tarea.empresaId !== req.usuario.empresaId) {
          return res.status(403).json({
            ok: false,
            message: "El administrador no puede eliminar tareas de otra empresa"
          });
        }
      }

      // DIRECTOR solo puede eliminar tareas de su oficina
      if (req.usuario.rol === "DIRECTOR") {
        if (
          tarea.empresaId !== req.usuario.empresaId ||
          tarea.oficinaId !== req.usuario.oficinaId
        ) {
          return res.status(403).json({
            ok: false,
            message: "El director no puede eliminar tareas de otra oficina"
          });
        }
      }

      await prisma.tarea.delete({
        where: {
          id
        }
      });

      res.json({
        ok: true,
        message: "Tarea eliminada correctamente"
      });
    } catch (error) {
      console.error("Error eliminando tarea:", error);

      res.status(500).json({
        ok: false,
        message: "Error interno del servidor"
      });
    }
  }
);

// Crear tarea
app.post(
  "/api/tareas",
  autenticarToken,
  permitirRoles("SUPERADMIN", "ADMIN", "DIRECTOR", "TRABAJADOR"),
  async (req, res) => {
    try {
      const {
        titulo,
        descripcion,
        prioridad,
        fechaLimite,
        empresaId,
        oficinaId,
        clienteId,
        asignadoAUsuarioId
      } = req.body;

      // Comprobar datos obligatorios
      if (!titulo || !empresaId) {
        return res.status(400).json({
          ok: false,
          message: "El título y la empresa son obligatorios"
        });
      }

      // Buscar empresa
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

      // ADMIN solo puede crear tareas dentro de su empresa
      if (req.usuario.rol === "ADMIN") {
        if (empresaId !== req.usuario.empresaId) {
          return res.status(403).json({
            ok: false,
            message: "El administrador no puede crear tareas en otra empresa"
          });
        }
      }

      // DIRECTOR solo puede crear tareas dentro de su empresa y oficina
      if (req.usuario.rol === "DIRECTOR") {
        if (empresaId !== req.usuario.empresaId) {
          return res.status(403).json({
            ok: false,
            message: "El director no puede crear tareas en otra empresa"
          });
        }

        if (oficinaId !== req.usuario.oficinaId) {
          return res.status(403).json({
            ok: false,
            message: "El director no puede crear tareas en otra oficina"
          });
        }
      }

      // TRABAJADOR solo puede crear tareas dentro de su empresa y oficina
      if (req.usuario.rol === "TRABAJADOR") {
        if (empresaId !== req.usuario.empresaId) {
          return res.status(403).json({
            ok: false,
            message: "El trabajador no puede crear tareas en otra empresa"
          });
        }

        if (oficinaId !== req.usuario.oficinaId) {
          return res.status(403).json({
            ok: false,
            message: "El trabajador no puede crear tareas en otra oficina"
          });
        }

        // Si se vincula un cliente, debe ser uno de sus clientes asignados
        if (clienteId) {
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

          const cliente = await prisma.cliente.findUnique({
            where: {
              id: clienteId
            }
          });

          if (!cliente) {
            return res.status(404).json({
              ok: false,
              message: "Cliente no encontrado"
            });
          }

          if (cliente.trabajadorId !== trabajador.id) {
            return res.status(403).json({
              ok: false,
              message: "El trabajador no puede crear tareas para este cliente"
            });
          }
        }
      }

      // Si se indica oficina, comprobar que pertenece a la empresa
      if (oficinaId) {
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
      }

      // Si se indica cliente, comprobar que pertenece a la empresa
      if (clienteId) {
        const cliente = await prisma.cliente.findUnique({
          where: {
            id: clienteId
          }
        });

        if (!cliente) {
          return res.status(404).json({
            ok: false,
            message: "Cliente no encontrado"
          });
        }

        if (cliente.empresaId !== empresaId) {
          return res.status(403).json({
            ok: false,
            message: "El cliente no pertenece a la empresa indicada"
          });
        }

        // Si hay oficina, el cliente debe pertenecer a esa oficina
        if (oficinaId && cliente.oficinaId !== oficinaId) {
          return res.status(403).json({
            ok: false,
            message: "El cliente no pertenece a la oficina indicada"
          });
        }
      }

      // Si se indica usuario asignado, comprobar que existe
      if (asignadoAUsuarioId) {
        const usuarioAsignado = await prisma.usuario.findUnique({
          where: {
            id: asignadoAUsuarioId
          }
        });

        if (!usuarioAsignado) {
          return res.status(404).json({
            ok: false,
            message: "Usuario asignado no encontrado"
          });
        }

        // El usuario asignado debe pertenecer a la misma empresa
        if (usuarioAsignado.empresaId !== empresaId) {
          return res.status(403).json({
            ok: false,
            message: "El usuario asignado no pertenece a la empresa indicada"
          });
        }

        // DIRECTOR y TRABAJADOR solo pueden asignar tareas dentro de su oficina
        if (
          (req.usuario.rol === "DIRECTOR" ||
            req.usuario.rol === "TRABAJADOR") &&
          usuarioAsignado.oficinaId !== req.usuario.oficinaId
        ) {
          return res.status(403).json({
            ok: false,
            message: "No puedes asignar la tarea a un usuario de otra oficina"
          });
        }
      }

      // Crear tarea
      const tarea = await prisma.tarea.create({
        data: {
          titulo,
          descripcion: descripcion || null,
          prioridad: prioridad || "MEDIA",
          fechaLimite: fechaLimite ? new Date(fechaLimite) : null,
          empresaId,
          oficinaId: oficinaId || null,
          clienteId: clienteId || null,
          asignadoAUsuarioId: asignadoAUsuarioId || null,
          creadoPorUsuarioId: req.usuario.id
        },
        include: {
          empresa: true,
          oficina: true,
          cliente: true,
          asignadoAUsuario: {
            select: {
              id: true,
              nombre: true,
              email: true,
              rol: true
            }
          },
          creadoPorUsuario: {
            select: {
              id: true,
              nombre: true,
              email: true,
              rol: true
            }
          }
        }
      });

      res.status(201).json({
        ok: true,
        message: "Tarea creada correctamente",
        tarea
      });
    } catch (error) {
      console.error("Error creando tarea:", error);

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
