// server.js
import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import errorMiddleware from "./middlewares/error.middleware.js";
import { v2 as cloudinary } from "cloudinary";
import http from "http";
import { Server } from "socket.io";
import { socketAuthenticator } from "./middlewares/auth.middleware.js";
import { START_TYPING, STOP_TYPING } from "./constants.js";
import { getSockets } from "./lib/helper.js";

dotenv.config({
  path: "./.env",
});

const app = express();

// Create HTTP server for socket.io
export const server = http.createServer(app);

// Setup socket.io
const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:5173",
      "https://chat-app-frontend-nbt4.onrender.com",
    ],
    credentials: true,
  },
});
app.set("io", io);

// Middlewares
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true, limit: "5mb" }));
app.use(cookieParser());
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://chat-app-frontend-nbt4.onrender.com",
    ],
    credentials: true,
  })
);
app.use(express.static("public"));

// Cloudinary config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_SECRET,
});

// Routes import
import authRoute from "./routes/auth.route.js";
import userRoute from "./routes/user.route.js";
import chatRoute from "./routes/chat.route.js";

app.get("/", (req, res) => {
  res.send("Hello World!");
});

// API Routes
app.use("/api/v1/auth", authRoute);
app.use("/api/v1", userRoute);
app.use("/api/v1", chatRoute);

io.use((socket, next) => {
  cookieParser()(socket.request, socket.request.res || {}, async (err) =>
    socketAuthenticator(err, socket, next)
  );
});

// Socket authentication
export const userSocketIDs = new Map();
export const onlineUsers = new Set();

// Socket event handling
io.on("connection", (socket) => {
  const user = socket.user;
  userSocketIDs.set(user._id.toString(), socket.id);

  socket.on(START_TYPING, ({ members, id }) => {
    const membersSockets = getSockets(members);
    socket.to(membersSockets).emit(START_TYPING, { chatId: id });
  });

  socket.on(STOP_TYPING, ({ members, id }) => {
    const membersSockets = getSockets(members);
    socket.to(membersSockets).emit(STOP_TYPING, { chatId: id });
  });

  socket.on("disconnect", () => {
    userSocketIDs.delete(user._id.toString());
    onlineUsers.delete(user._id.toString());
  });
});

// Error handler middleware
app.use(errorMiddleware);
