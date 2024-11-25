const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(__dirname));

// Store rooms and their passwords
const rooms = {};

io.on("connection", (socket) => {
  console.log("A user connected");

  // Handle room creation
  socket.on("create-room", ({ roomId, password }) => {
    rooms[roomId] = { password, users: [] };
    console.log(`Room created: ${roomId}`);
  });

  // Handle room joining
  socket.on("join-room", ({ roomId, password, username }, callback) => {
    const room = rooms[roomId];
    if (!room) {
      return callback({ success: false, message: "Room not found" });
    }

    if (room.password !== password) {
      return callback({ success: false, message: "Incorrect password" });
    }

    room.users.push(username);
    socket.join(roomId);
    socket.roomId = roomId;
    socket.username = username;

    // Notify room members
    socket.broadcast.to(roomId).emit("system-message", `${username} joined the room`);
    callback({ success: true });
  });

  // Handle leaving room
  socket.on("leave-room", ({ roomId, username }) => {
    const room = rooms[roomId];
    if (room) {
      room.users = room.users.filter((user) => user !== username);
      socket.leave(roomId);
      io.to(roomId).emit("system-message", `${username} left the room`);
    }
  });

  // Handle sending messages
  socket.on("send-message", ({ roomId, username, message }) => {
    io.to(roomId).emit("receive-message", { username, message });
  });

  // Handle disconnect
  socket.on("disconnect", () => {
    if (socket.roomId && socket.username) {
      const room = rooms[socket.roomId];
      if (room) {
        room.users = room.users.filter((user) => user !== socket.username);
        io.to(socket.roomId).emit("system-message", `${socket.username} disconnected`);
      }
    }
  });
});

server.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});
