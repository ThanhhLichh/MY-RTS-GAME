// backend/server.js
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

// Khi client connect
io.on("connection", (socket) => {
  console.log("⚡ User connected:", socket.id);

  // Lắng nghe event 'chat'
  socket.on("chat", (msg) => {
    console.log("💬", msg);
    io.emit("chat", msg); // gửi lại cho tất cả client
  });

  // Khi client disconnect
  socket.on("disconnect", () => {
    console.log("❌ User disconnected:", socket.id);
  });
});

// Start server
server.listen(3000, () => {
  console.log("✅ Server running on http://localhost:3000");
});
