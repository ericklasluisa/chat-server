require("dotenv").config();

const express = require("express");
const http = require("http");
const cors = require("cors");
const path = require("path");

// Importar módulos
const apiRoutes = require("./src/controllers/api");
const { setupSocketIO } = require("./src/socket/socket");

const app = express();

// Middlewares
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "*",
    methods: ["GET", "POST"],
    credentials: true,
  })
);
app.use(express.json()); // Permite que el servidor entienda los datos JSON en las solicitudes

// Rutas API
app.use("/api", apiRoutes);

// Ruta para la página inicial
app.get("/", (req, res) => {
  res.send("Servidor de chat en tiempo real");
});

// Crear servidor HTTP
const server = http.createServer(app);

// Configurar Socket.io
setupSocketIO(server, process.env.CORS_ORIGIN);

// Iniciar servidor
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Servidor ejecutándose en el puerto ${PORT}`);
});
