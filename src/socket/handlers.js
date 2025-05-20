/**
 * Manejadores de eventos de socket
 */

const roomService = require("../services/roomService");
const {
  generateUniquePin,
  isClientInRoom,
  generateMessageId,
} = require("../utils/roomUtils");

/**
 * Configura los manejadores de eventos para un socket
 * @param {Object} io - Instancia de Socket.io
 * @param {Object} socket - Socket conectado
 */
function setupSocketHandlers(io, socket) {
  const clientIp = socket.handshake.address.replace("::ffff:", "");
  let currentRoomPin = null;
  console.log(`Cliente conectado: ${clientIp}`);

  // Enviar información del host al cliente
  const dns = require("dns");
  dns.reverse(clientIp, (err, hostnames) => {
    const hostname =
      err || !hostnames || hostnames.length === 0 ? clientIp : hostnames[0];
    console.log(`Hostname del cliente: ${hostname}`);
    socket.emit("host_info", { ip: clientIp, host: hostname });
  }); // Crear una nueva sala
  socket.on("create_room", (data, callback) => {
    // Extraer username y maxUsers del objeto recibido
    let username, maxUsers;

    // Comprobar si data es un objeto o una cadena JSON
    if (typeof data === "string") {
      try {
        const parsedData = JSON.parse(data);
        username = parsedData.username;
        maxUsers = parsedData.maxUsers;
      } catch (error) {
        username = data; // Si no es JSON válido, tratarlo como nombre de usuario
      }
    } else if (data && typeof data === "object") {
      // Si ya es un objeto, extraer directamente
      username = data.username;
      maxUsers = data.maxUsers;
    } else {
      username = data; // Si es otro tipo, tratarlo como nombre de usuario
    }

    console.log("Datos recibidos:", { username, maxUsers });

    // Verificar si el cliente ya está en una sala
    if (isClientInRoom(roomService.clientRooms, clientIp)) {
      if (typeof callback === "function") {
        callback({
          success: false,
          error: "Ya estás conectado a una sala. Debes salir primero.",
        });
      }
      console.log(
        `El cliente ${clientIp} intentó crear una sala pero ya está en una.`
      );
      return;
    } // Verificar si el nombre de usuario es válido
    if (!username || typeof username !== "string" || username.trim() === "") {
      if (typeof callback === "function") {
        callback({
          success: false,
          error: "Se requiere un nombre de usuario válido para crear una sala.",
        });
      }
      console.log(
        `El cliente ${clientIp} intentó crear una sala con un nombre de usuario inválido.`
      );
      return;
    }

    const pin = generateUniquePin(roomService.rooms);

    // Crear nueva sala con valores predeterminados si no se proporcionan
    const safeUsername = username.trim();
    // Asegurar que maxUsers sea un número entre 1 y 10
    let safeMaxUsers = 5; // Valor predeterminado
    if (maxUsers !== undefined && maxUsers !== null) {
      const parsedMaxUsers = parseInt(maxUsers, 10);
      if (!isNaN(parsedMaxUsers) && parsedMaxUsers > 0) {
        safeMaxUsers = Math.min(parsedMaxUsers, 10); // Establecer un límite máximo de 10 usuarios
      }
    }

    roomService.createRoom(
      pin,
      socket.id,
      safeUsername,
      clientIp,
      safeMaxUsers
    );
    currentRoomPin = pin;

    // Unir socket a la sala
    socket.join(pin);

    console.log(`Sala ${pin} creada por (${clientIp})`);

    // Devolver información de la sala al cliente si se proporcionó un callback
    if (typeof callback === "function") {
      callback({
        success: true,
        pin,
        message: `Sala creada con éxito. PIN: ${pin}`,
      });
    }

    // Notificar a todos en la sala
    const room = roomService.getRoomByPin(pin);
    io.to(pin).emit("room_update", {
      users: Array.from(room.users.values()).map((u) => u.username),
      roomInfo: {
        pin,
        userCount: room.users.size,
        maxUsers: room.maxUsers,
      },
    });
  }); // Unirse a una sala existente
  socket.on("join_room", (data, callback) => {
    // Extraer pin y username del objeto recibido
    let pin, username;

    // Comprobar si data es un objeto o una cadena JSON
    if (typeof data === "string") {
      try {
        const parsedData = JSON.parse(data);
        pin = parsedData.pin;
        username = parsedData.username;
      } catch (error) {
        // No hacer nada si no es JSON válido
      }
    } else if (data && typeof data === "object") {
      // Si ya es un objeto, extraer directamente
      pin = data.pin;
      username = data.username;
    }

    console.log("Datos para unirse a sala:", { pin, username });

    // Verificar si se proporcionaron los parámetros necesarios
    if (!pin || !username) {
      if (typeof callback === "function") {
        callback({
          success: false,
          error: "Se requiere PIN y nombre de usuario para unirse a una sala.",
        });
      }
      return;
    }

    // Verificar si el cliente ya está en una sala
    if (isClientInRoom(roomService.clientRooms, clientIp)) {
      if (typeof callback === "function") {
        callback({
          success: false,
          error: "Ya estás conectado a una sala. Debes salir primero.",
        });
      }
      console.log(
        `El cliente ${clientIp} intentó unirse a una sala pero ya está en una.`
      );
      return;
    }

    // Verificar si la sala existe
    const room = roomService.getRoomByPin(pin);
    if (!room) {
      if (typeof callback === "function") {
        callback({
          success: false,
          error: "La sala no existe. Verifica el PIN e intenta de nuevo.",
        });
      }
      console.log(
        `El cliente ${clientIp} intentó unirse a una sala inexistente.`
      );
      return;
    }

    // Verificar si la sala está llena
    if (room.users.size >= room.maxUsers) {
      if (typeof callback === "function") {
        callback({
          success: false,
          error: "La sala está llena. Intenta con otra sala.",
        });
      }
      console.log(
        `El cliente ${clientIp} intentó unirse a una sala llena (${room.maxUsers} usuarios).`
      );
      return;
    }

    // Añadir usuario a la sala
    roomService.joinRoom(pin, socket.id, username, clientIp);
    currentRoomPin = pin;

    // Unir socket a la sala
    socket.join(pin);

    console.log(`${username} (${clientIp}) se unió a la sala: ${pin}`);

    // Enviar historial de mensajes al nuevo usuario
    socket.emit("message_history", {
      messages: room.messages,
    }); // Devolver información de la sala al cliente
    if (typeof callback === "function") {
      callback({
        success: true,
        message: `Te has unido a la sala ${pin}`,
      });
    }

    // Notificar a todos en la sala
    const updatedRoom = roomService.getRoomByPin(pin);
    io.to(pin).emit("room_update", {
      users: Array.from(updatedRoom.users.values()).map((u) => u.username),
      roomInfo: {
        pin,
        userCount: updatedRoom.users.size,
        maxUsers: updatedRoom.maxUsers,
      },
    });

    // Notificar a todos que un nuevo usuario se unió
    socket.to(pin).emit("user_joined", {
      username,
      timestamp: new Date(),
    });
  });
  // Enviar mensaje en una sala
  socket.on("send_message", (msg, callback) => {
    // Verificar si el usuario está en una sala
    if (!currentRoomPin) {
      socket.emit("error", { message: "No estás en ninguna sala" });
      if (typeof callback === "function") {
        callback({
          success: false,
          error: "No estás en ninguna sala",
        });
      }
      console.log(
        `El cliente ${clientIp} intentó enviar un mensaje pero no está en ninguna sala.`
      );
      return;
    }

    const room = roomService.getRoomByPin(currentRoomPin);
    if (!room) {
      if (typeof callback === "function") {
        callback({
          success: false,
          error: "La sala ya no existe",
        });
      }
      console.log(
        `El cliente ${clientIp} intentó enviar un mensaje pero la sala no existe.`
      );
      return;
    }

    const user = room.users.get(socket.id);
    if (!user) {
      if (typeof callback === "function") {
        callback({
          success: false,
          error: "No estás registrado en esta sala",
        });
      }
      console.log(
        `El cliente ${clientIp} intentó enviar un mensaje pero no está registrado en la sala.`
      );
      return;
    }

    // Crear objeto de mensaje con metadatos
    const messageObj = {
      text: msg,
      username: user.username,
      timestamp: new Date(),
      id: generateMessageId(),
    };

    // Guardar mensaje en el historial de la sala
    roomService.addMessageToRoom(currentRoomPin, messageObj);

    // Enviar mensaje a todos en la sala
    io.to(currentRoomPin).emit("receive_message", messageObj);

    console.log(
      `Message in room ${currentRoomPin}: ${msg} (from ${user.username})`
    );

    // Confirmar al cliente que el mensaje fue enviado
    if (typeof callback === "function") {
      callback({
        success: true,
        messageId: messageObj.id,
      });
    }
  });
  // Salir de una sala
  socket.on("leave_room", (callback) => {
    if (!currentRoomPin || !roomService.clientRooms.has(clientIp)) {
      if (typeof callback === "function") {
        callback({
          success: false,
          error: "No estás en ninguna sala",
        });
      }
      console.log(
        `El cliente ${clientIp} intentó salir de una sala pero no está en ninguna.`
      );
      return;
    }

    handleUserLeaving();

    // Confirmar al usuario que ha salido
    if (typeof callback === "function") {
      callback({
        success: true,
        message: "Has salido de la sala",
      });
      console.log(`El cliente ${clientIp} salió de la sala: ${currentRoomPin}`);
    }
  });

  // Manejar desconexión
  socket.on("disconnect", () => {
    console.log(`Client disconnected: ${clientIp}`);
    handleUserLeaving();
  });

  // Función auxiliar para manejar cuando un usuario sale de una sala
  function handleUserLeaving() {
    if (!currentRoomPin) return;

    const result = roomService.removeUserFromRoom(socket.id, clientIp);
    if (!result.success) return;

    // Notificar a los demás usuarios que este usuario ha salido
    socket.to(result.pin).emit("user_left", {
      username: result.user.username,
      timestamp: new Date(),
    });

    console.log(
      `${result.user.username} (${clientIp}) left room ${result.pin}`
    );

    // Si la sala sigue existiendo, notificar a los usuarios restantes
    if (!result.isEmpty) {
      io.to(result.pin).emit("room_update", {
        users: Array.from(result.room.users.values()).map((u) => u.username),
        roomInfo: {
          pin: result.pin,
          userCount: result.room.users.size,
          maxUsers: result.room.maxUsers,
        },
      });
    }

    // Limpiar el pin de sala actual del usuario
    currentRoomPin = null;

    // Hacer que el socket salga de la sala
    socket.leave(result.pin);
  }
}

module.exports = {
  setupSocketHandlers,
};
