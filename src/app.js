import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";

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

//routes import

//routes declaration

export default app;
