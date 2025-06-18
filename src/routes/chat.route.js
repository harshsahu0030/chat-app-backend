import express from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  addMemberInGroup,
  createGroupChat,
  getChats,
  kickUserFromGroup,
  leaveGroup,
  updateGroup,
} from "../controllers/chat.controller.js";
import { createGroupValidator, validateHandler } from "../lib/validators.js";

const router = express.Router();

router.route("/chats").get(verifyJWT, getChats);

router.route("/chats").get(verifyJWT, getChats);

router
  .route("/group/create")
  .post(verifyJWT, createGroupValidator(), validateHandler, createGroupChat);

router.route("/group/update").put(verifyJWT, updateGroup);

router.route("/group/member/add").put(verifyJWT, addMemberInGroup);

router.route("/group/member/kick").put(verifyJWT, kickUserFromGroup);

router.route("/group/member/leave").put(verifyJWT, leaveGroup);

export default router;
