const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    application: "kit-asesoria-backend",
    message: "Backend funcionando correctamente"
  });
});

module.exports = app;
