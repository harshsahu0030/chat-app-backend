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
import {
  acceptRequestValidator,
  getUserValidator,
  rejectRequestValidator,
  removeFriendValidator,
  sendRequestValidator,
  validateHandler,
} from "../lib/validators.js";

const router = express.Router();

router.route("/users").get(verifyJWT, getUsers);

router
  .route("/user/:id")
  .get(verifyJWT, getUserValidator(), validateHandler, getUserById);

router.route("/friends").get(verifyJWT, getFriendsList);

router.route("/friend/requests").get(verifyJWT, getFriendRequests);

router
  .route("/friend/request/send")
  .post(verifyJWT, sendRequestValidator(), validateHandler, sendFriendRequest);

router
  .route("/friend/request/accept")
  .post(
    verifyJWT,
    acceptRequestValidator(),
    validateHandler,
    acceptFriendRequest
  );

router
  .route("/friend/request/reject")
  .post(
    verifyJWT,
    rejectRequestValidator(),
    validateHandler,
    rejectFriendRequest
  );

router
  .route("/friend/remove")
  .post(verifyJWT, removeFriendValidator(), validateHandler, removeFriend);

export default router;
