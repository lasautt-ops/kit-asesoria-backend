const express = require("express");
const cors = require("cors");
const { PrismaClient } = require("@prisma/client");

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
module.exports = app;
