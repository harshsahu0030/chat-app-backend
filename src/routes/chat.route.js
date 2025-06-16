import express from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { createGroupChat, getChats } from "../controllers/chat.controller.js";
import { createGroupValidator, validateHandler } from "../lib/validators.js";

const router = express.Router();

router.route("/chats").get(verifyJWT, getChats);

router
  .route("/group/create")
  .post(verifyJWT, createGroupValidator(), validateHandler, createGroupChat);

export default router;
