// const dotenv = require("dotenv");
// dotenv.config();

const dotenv = require("dotenv");
if (process.env.NODE_ENV !== "production") {
  dotenv.config();
}

const express = require("express");
const { chats } = require("./data/data");
const connectDB = require("./config/db");
const userRoutes = require("./routes/userRoutes");
const chatRoutes = require("./routes/chatRoutes");
const messageRoutes = require("./routes/messageRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const path = require("path");

const { notFound, errorHandler } = require("./middleware/errorMiddleware");

const app = express();

app.use(express.json());

connectDB();

app.use("/api/user", userRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/message", messageRoutes);
app.use("/api/notification", notificationRoutes);

//----------------Deployment Logic (Local Testing Direct Setup)------------
const __dirname1 = path.resolve();

// Static frontend build files serve karne ke liye
app.use(express.static(path.join(__dirname1, "frontend", "build")));

// Naye Express matching ke mutabik catch-all route ka sahi aur safe syntax:
app.get(/^(?!\/api).*$/, (req, res) => {
  res.sendFile(path.resolve(__dirname1, "frontend", "build", "index.html"));
});
//----------------Deployment Logic------------

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, console.log(`server run on ${PORT} port`));

const allowedOrigins = [
  "http://localhost:3000",
  process.env.CLIENT_URL,
  process.env.RENDER_EXTERNAL_URL,
].filter(Boolean);

const io = require("socket.io")(server, {
  pingTimeout: 60000,
  cors: {
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);

      try {
        const hostname = new URL(origin).hostname;
        if (
          allowedOrigins.includes(origin) ||
          hostname === "localhost" ||
          hostname.endsWith(".onrender.com")
        ) {
          return callback(null, true);
        }
      } catch (error) {
        return callback(error);
      }

      return callback(new Error("Not allowed by CORS"));
    },
  },
});

const onlineUsers = new Map();
const socketUserIds = new Map();

const addOnlineUser = (userId, socketId) => {
  if (!onlineUsers.has(userId)) {
    onlineUsers.set(userId, new Set());
  }

  onlineUsers.get(userId).add(socketId);
  socketUserIds.set(socketId, userId);
};

const removeOnlineUser = (socketId) => {
  const userId = socketUserIds.get(socketId);
  if (!userId) return;

  const userSockets = onlineUsers.get(userId);
  if (userSockets) {
    userSockets.delete(socketId);

    if (userSockets.size === 0) {
      onlineUsers.delete(userId);
    }
  }

  socketUserIds.delete(socketId);
};

const emitOnlineUsers = () => {
  io.emit("online users", Array.from(onlineUsers.keys()));
};

io.on("connection", (socket) => {
  console.log("connected to socket.io");

  socket.on("setup", (userData) => {
    if (!userData?._id) return;

    socket.join(userData._id);
    addOnlineUser(userData._id, socket.id);
    emitOnlineUsers();
    console.log(userData._id);
    socket.emit("connected");
  });

  socket.on("join chat", (room) => {
    socket.join(room);
    console.log("User joined Room: " + room);
  });

  socket.on("typing", (room) => socket.in(room).emit("typing"));
  socket.on("stop typing", (room) => socket.in(room).emit("stop typing"));

  socket.on("new message", (newMessageReceived) => {
    var chat = newMessageReceived.chat;
    if (!chat.users) return console.log("chat.users not defined");

    chat.users.forEach((user) => {
      if (user._id == newMessageReceived.sender._id) return;
      socket.in(user._id).emit("message received", newMessageReceived);
    });
  });

  socket.on("disconnect", () => {
    removeOnlineUser(socket.id);
    emitOnlineUsers();
    console.log("USER DISCONNECTED");
  });
});

app.use("/api/notification", notificationRoutes);
