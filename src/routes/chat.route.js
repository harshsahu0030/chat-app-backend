import express from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  addMemberInGroup,
  createGroupChat,
  getChatById,
  getChats,
  getMessages,
  kickUserFromGroup,
  leaveGroup,
  sendMessage,
  updateGroup,
} from "../controllers/chat.controller.js";
import {
  chatIdValiadator,
  createGroupValidator,
  userIdVatidator,
  validateHandler,
} from "../lib/validators.js";

const router = express.Router();

router.route("/chats").get(verifyJWT, getChats);

router.route("/chat/:id").get(verifyJWT, getChatById);

router.route("/messages/:id").get(verifyJWT, getMessages);

router
  .route("/group/create")
  .post(verifyJWT, createGroupValidator(), validateHandler, createGroupChat);

router
  .route("/group/update")
  .put(verifyJWT, chatIdValiadator(), validateHandler, updateGroup);

router
  .route("/group/member/add")
  .put(
    verifyJWT,
    chatIdValiadator(),
    userIdVatidator(),
    validateHandler,
    addMemberInGroup
  );

router
  .route("/group/member/kick")
  .put(
    verifyJWT,
    chatIdValiadator(),
    userIdVatidator(),
    validateHandler,
    kickUserFromGroup
  );

router
  .route("/group/member/leave")
  .put(verifyJWT, chatIdValiadator(), validateHandler, leaveGroup);

router.route("/message/send").post(verifyJWT, sendMessage);

export default router;
