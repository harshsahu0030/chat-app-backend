import express from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  acceptFriendRequest,
  getFriendRequests,
  getFriendsList,
  getUserById,
  getUsers,
  rejectFriendRequest,
  removeFriend,
  sendFriendRequest,
} from "../controllers/user.controller.js";

const router = express.Router();

router.route("/users").get(verifyJWT, getUsers);

router.route("/user/:id").get(verifyJWT, getUserById);

router.route("/friends").get(verifyJWT, getFriendsList);

router.route("/friend/requests").get(verifyJWT, getFriendRequests);

router.route("/friend/request/send").post(verifyJWT, sendFriendRequest);

router.route("/friend/request/accept").post(verifyJWT, acceptFriendRequest);

router.route("/friend/request/reject").post(verifyJWT, rejectFriendRequest);

router.route("/friend/remove").post(verifyJWT, removeFriend);

export default router;
