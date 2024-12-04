const http = require("node:http");
const socketIO = require("socket.io");

// Importar modelos
const ChatMessage = require("./models/chatmessage.model");

const app = require("./app");

//configuracion .ENV
require("dotenv").config();

//configuracion de la BD
const { dbConnection } = require("./config/db");
dbConnection();

const server = http.createServer(app);

const PORT = process.env.PORT || 3000;
server.listen(PORT);

// Config Socket.io
const io = socketIO(server, {
  cors: { origin: "*" },
});

//Cada vez que un cliente se conecte escucha
io.on("connection", async (socket) => {
  //console.log("Nueva conexión");
  //Escuchar cuando un cliente se conecta
  socket.broadcast.emit("chat_message_server", {
    name: "INFO",
    message: "Un nuevo usuario se ha conectado",
  });

  //Cuando se conecte un nuevo cliente, recupera los 5 ultimos mensajes de la BD

  //como se recuperan los ultimos 5 mensajes de la BD
  const messages = await ChatMessage.find().sort("-createdAt").limit(5);
  // Emito el evento chat_init
  socket.emit("chat_init", {
    socket_id: socket.id,
    arrMessages: messages,
  });

  //Emitimos el numero de clientes conectados
  io.emit("clients_count", io.engine.clientsCount);

  //Me suscribo para recibir los mensajes del chat
  socket.on("chat_message", (data) => {
    ChatMessage.create(data);
    //Enviar algo a todos los clientes que estan conectados
    io.emit("chat_message_server", data);
  });

  //Me suscribo para detectar las desconexiones
  socket.on("disconnect", () => {
    console.log("Un usuario se ha desconectado");
    io.emit("chat_message_server", {
      name: "INFO",
      message: "Un usuario se ha desconectado",
    });
    io.emit("clientes_count", io.engine.clientsCount);
  });
});
