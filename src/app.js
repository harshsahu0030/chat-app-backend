import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import errorMiddleware from "./middlewares/error.middleware.js";
import { v2 as cloudinary } from "cloudinary";

const app = express();

dotenv.config({
  path: "./.env",
});

// middlewares
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true, limit: "mb" }));
app.use(express.static("public"));
app.use(cookieParser());
app.use(
  cors({
    origin: "*",
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

//routes declaration
app.use("/api/v1/auth", authRoute);
app.use("/api/v1", userRoute);

app.use(errorMiddleware);

export default app;
