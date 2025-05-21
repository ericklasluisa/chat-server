/**
 * Configuración de Socket.io
 */

const { Server } = require("socket.io");
const { setupSocketHandlers } = require("./handlers");

/**
 * Configura la instancia de Socket.io
 * @param {Object} server - Servidor HTTP
 * @param {string} corsOrigin - Origen permitido para CORS
 * @returns {Object} - Instancia de Socket.io configurada
 */
function setupSocketIO(server, corsOrigin) {
  const io = new Server(server, {
    cors: {
      origin: corsOrigin || "*",
      methods: ["GET", "POST"],
      credentials: true,
    },
    transports: ["websocket", "polling"],
  });

  console.log("Socket.io Conectado");

  io.on("connection", (socket) => {
    setupSocketHandlers(io, socket);
  });

  return io;
}

module.exports = {
  setupSocketIO,
};
