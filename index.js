require("dotenv").config();

const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");
const dns = require("dns");

const app = express();

app.use(cors({ origin: process.env.CORS_ORIGIN }));

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN,
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  const clientIp = socket.handshake.address.replace("::ffff:", "");
  //limitar el acceso a la ip de cliente ya conectado
  console.log(`Client connected: ${clientIp}`);

  dns.reverse(clientIp, (err, hostnames) => {
    const hostname = err ? clientIp : hostnames[0];
    console.log(`Client hostname: ${hostname}`);
    socket.emit("host_info", { ip: clientIp, host: hostname });
  });

  socket.on("send_message", (msg) => {
    io.emit("receive_message", msg);
    console.log(`Message received: ${msg}`);
  });

  socket.on("disconnect", () => {
    console.log(`Client disconnected: ${clientIp}`);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
