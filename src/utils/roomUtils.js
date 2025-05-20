/**
 * Utilidades para el manejo de salas
 */

/**
 * Genera un PIN único de 6 dígitos
 * @param {Map} rooms - Mapa de salas existentes
 * @returns {string} - PIN único
 */
function generateUniquePin(rooms) {
  let pin;
  do {
    // Generar PIN aleatorio de 6 dígitos
    pin = Math.floor(100000 + Math.random() * 900000).toString();
  } while (rooms.has(pin)); // Asegurar que el PIN no exista
  return pin;
}

/**
 * Verifica si un cliente ya está en una sala
 * @param {Map} clientRooms - Mapa de clientes y sus salas
 * @param {string} clientIp - IP del cliente
 * @returns {boolean} - true si el cliente está en una sala
 */
function isClientInRoom(clientRooms, clientIp) {
  return clientRooms.has(clientIp);
}

/**
 * Genera un ID único para un mensaje
 * @returns {string} - ID único
 */
function generateMessageId() {
  return Date.now() + Math.random().toString(36).substring(2, 9);
}

module.exports = {
  generateUniquePin,
  isClientInRoom,
  generateMessageId,
};
