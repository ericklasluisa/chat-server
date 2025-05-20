/**
 * Servicio para la gestión de salas
 */

// Almacenamiento de salas en memoria
const rooms = new Map();

// Registro de qué dispositivo está en qué sala
const clientRooms = new Map();

/**
 * Crea una nueva sala
 * @param {string} pin - PIN de la sala
 * @param {string} socketId - ID del socket del creador
 * @param {string} username - Nombre del usuario creador
 * @param {string} clientIp - IP del cliente
 * @param {number} maxUsers - Máximo de usuarios permitidos
 * @returns {Object} - Objeto con datos de la sala creada
 */
function createRoom(pin, socketId, username, clientIp, maxUsers) {
  const roomData = {
    pin,
    users: new Map([[socketId, { username, clientIp }]]),
    messages: [],
    maxUsers,
    createdAt: new Date(),
  };
  rooms.set(pin, roomData);
  clientRooms.set(clientIp, pin);
  return roomData;
}

/**
 * Añade un usuario a una sala existente
 * @param {string} pin - PIN de la sala
 * @param {string} socketId - ID del socket del usuario
 * @param {string} username - Nombre del usuario
 * @param {string} clientIp - IP del cliente
 * @returns {Object|null} - Objeto de la sala o null si no existe
 */
function joinRoom(pin, socketId, username, clientIp) {
  const room = rooms.get(pin);
  if (!room) return null;

  room.users.set(socketId, { username, clientIp });
  clientRooms.set(clientIp, pin);
  return room;
}

/**
 * Elimina un usuario de una sala
 * @param {string} socketId - ID del socket del usuario
 * @param {string} clientIp - IP del cliente
 * @returns {Object} - Información sobre la operación
 */
function removeUserFromRoom(socketId, clientIp) {
  const pin = clientRooms.get(clientIp);
  if (!pin) return { success: false };

  const room = rooms.get(pin);
  if (!room) return { success: false };

  const user = room.users.get(socketId);
  if (!user) return { success: false };

  // Eliminar usuario de la sala
  room.users.delete(socketId);

  // Eliminar registro del cliente
  clientRooms.delete(clientIp);

  // Verificar si la sala quedó vacía
  const isEmpty = room.users.size === 0;
  if (isEmpty) {
    rooms.delete(pin);
    console.log(`Room ${pin} deleted (no users left)`);
  }

  return {
    success: true,
    isEmpty,
    room,
    user,
    pin,
  };
}

/**
 * Añade un mensaje al historial de una sala
 * @param {string} pin - PIN de la sala
 * @param {Object} messageObj - Objeto del mensaje a añadir
 * @returns {boolean} - true si el mensaje se añadió correctamente
 */
function addMessageToRoom(pin, messageObj) {
  const room = rooms.get(pin);
  if (!room) return false;

  room.messages.push(messageObj);
  return true;
}

/**
 * Obtiene una sala por su PIN
 * @param {string} pin - PIN de la sala a buscar
 * @returns {Object|null} - Objeto de la sala o null si no existe
 */
function getRoomByPin(pin) {
  return rooms.get(pin) || null;
}

/**
 * Obtiene la sala en la que está un cliente
 * @param {string} clientIp - IP del cliente
 * @returns {Object|null} - Objeto con el PIN y la sala, o null si no existe
 */
function getClientRoom(clientIp) {
  const pin = clientRooms.get(clientIp);
  if (!pin) return null;

  const room = rooms.get(pin);
  if (!room) return null;

  return { pin, room };
}

module.exports = {
  rooms,
  clientRooms,
  createRoom,
  joinRoom,
  removeUserFromRoom,
  addMessageToRoom,
  getRoomByPin,
  getClientRoom,
};
