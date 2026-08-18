const express = require("express");
const cors = require("cors");
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");

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
app.post("/api/empresas", async (req, res) => {
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
app.get("/api/empresas", async (req, res) => {
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
app.patch("/api/empresas/:id/activar", async (req, res) => {
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
app.post("/api/oficinas", async (req, res) => {
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
app.patch("/api/oficinas/:id/desactivar", async (req, res) => {
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
app.patch("/api/oficinas/:id/activar", async (req, res) => {
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
app.post("/api/trabajadores", async (req, res) => {
  try {
    const {
      nombre,
      email,
      password,
      empresaId,
      oficinaId
    } = req.body;

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
    const resultado = await prisma.$transaction(async (tx) => {
      const usuario = await tx.usuario.create({
        data: {
          nombre,
          email,
          password,
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
          usuario: true
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
module.exports = app;
