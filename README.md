# Servidor de Chat en Tiempo Real

Este es un servidor de chat en tiempo real desarrollado con Node.js, Express y Socket.IO. Permite la creación de salas de chat dinámicas con acceso mediante PIN.

## Características

- **Creación dinámica de salas**: Los usuarios pueden crear nuevas salas con PIN único de 6 dígitos.
- **Acceso mediante PIN**: Unirse a salas existentes usando su PIN.
- **Límite de participantes**: Cada sala tiene un límite configurable de participantes.
- **Una sala por dispositivo**: Un dispositivo solo puede estar en una sala a la vez.
- **Comunicación en tiempo real**: Todos los mensajes y actualizaciones se gestionan mediante WebSockets.
- **Historial de mensajes**: Los nuevos usuarios que entran a una sala pueden ver el historial completo de mensajes.
- **Salas no persistentes**: Si todos los usuarios abandonan una sala, esta se elimina automáticamente.

## Estructura del Proyecto

El proyecto está organizado de la siguiente manera:

- `index.js`: Punto de entrada de la aplicación.
- `src/controllers/`: Controladores para las rutas de la API.
- `src/services/`: Servicios para la lógica de negocio.
- `src/socket/`: Configuración y manejadores de eventos WebSocket.
- `src/utils/`: Utilidades y funciones auxiliares.

## Instalación

Para instalar las dependencias del proyecto, ejecuta el siguiente comando:

```bash
npm install
```

## Configuración

1. Crea un archivo `.env` en la raíz del proyecto con las siguientes variables:

```bash
PORT=5000
CORS_ORIGIN=http://localhost:5173  # Ajusta al origen de tu frontend
```

## Ejecución

Para iniciar el servidor:

```bash
npm start
```

## API REST

El servidor expone los siguientes endpoints:

- `GET /api/info`: Obtiene información general del servidor.
- `GET /api/checkRoom/:pin`: Verifica si una sala existe y si tiene espacio disponible.

## Eventos de Socket.io

### Eventos del cliente al servidor:

- `create_room`: Crea una nueva sala de chat.
- `join_room`: Une al usuario a una sala existente usando su PIN.
- `send_message`: Envía un mensaje a la sala actual.
- `leave_room`: Sale voluntariamente de una sala.

### Eventos del servidor al cliente:

- `host_info`: Información del dispositivo conectado.
- `message_history`: Historial de mensajes al unirse a una sala.
- `receive_message`: Recepción de un nuevo mensaje.
- `room_update`: Actualizaciones sobre la sala (usuarios, etc).
- `user_joined`: Notificación cuando un nuevo usuario se une.
- `user_left`: Notificación cuando un usuario abandona la sala.
- `error`: Mensajes de error.
