/**
 * Controladores para las rutas API
 */

const express = require("express");
const roomService = require("../services/roomService");

const router = express.Router();

/**
 * Ruta GET para obtener información básica del servidor
 */
router.get("/info", (req, res) => {
  res.json({
    status: "online",
    rooms: roomService.rooms.size,
    activeUsers: Array.from(roomService.rooms.values()).reduce(
      (total, room) => total + room.users.size,
      0
    ),
    serverTime: new Date().toISOString(),
  });
});

/**
 * Ruta GET para verificar si un PIN de sala existe
 */
router.get("/checkRoom/:pin", (req, res) => {
  const { pin } = req.params;
  const room = roomService.getRoomByPin(pin);

  if (room) {
    res.json({
      exists: true,
      isFull: room.users.size >= room.maxUsers,
      userCount: room.users.size,
      maxUsers: room.maxUsers,
    });
  } else {
    res.json({
      exists: false,
    });
  }
});

module.exports = router;
