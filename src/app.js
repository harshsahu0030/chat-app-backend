import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import errorMiddleware from "./middlewares/error.middleware.js";
import { v2 as cloudinary } from "cloudinary";
import http from "http";
import { Server } from "socket.io";
import { socketAuthenticator } from "./middlewares/auth.middleware.js";
import { ONLINE_USERS, START_TYPING, STOP_TYPING } from "./constants.js";
import { getSockets } from "./lib/helper.js";

const app = express();

dotenv.config({
  path: "./.env",
});

//socket io
export const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173", // frontend origin
    credentials: true,
    withCredentials: true,
  },
});
app.set("io", io);

// middlewares
// UTF-8
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true, limit: "mb" }));

// static file to keep image using multur
app.use(express.static("public"));

//using JWT token for authentication
app.use(cookieParser());
app.use(
  cors({
    origin: "http://localhost:5173",
    withCredentials: true,
    credentials: true,
  })
);

//cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_SECRET,
});

//routes import
import authRoute from "./routes/auth.route.js";
import userRoute from "./routes/user.route.js";

//welcome server
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Welcome to Rista Chat App",
  });
});

//routes declaration
app.use("/api/v1/auth", authRoute);
app.use("/api/v1", userRoute);

export const userSocketIDs = new Map();
export const onlineUsers = new Set();

// socket declaration
io.use((socket, next) => {
  cookieParser()(
    socket.request,
    socket.request.res,
    async (err) => await socketAuthenticator(err, socket, next)
  );
});

//routes import (including socket)
import chatRoute from "./routes/chat.route.js";

//route declaration (including socket)
app.use("/api/v1", chatRoute);

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
    socket.broadcast.emit(ONLINE_USERS, Array.from(onlineUsers));
  });
});

//next -- error handling - middleware
app.use(errorMiddleware);
