const jwt = require("jsonwebtoken");

function autenticarToken(req, res, next) {
  const authHeader = req.headers["authorization"];

  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      ok: false,
      message: "Token no proporcionado"
    });
  }

  jwt.verify(token, process.env.JWT_SECRET, (error, usuario) => {
    if (error) {
      return res.status(403).json({
        ok: false,
        message: "Token inválido o caducado"
      });
    }

    req.usuario = usuario;
    next();
  });
}

module.exports = autenticarToken;
