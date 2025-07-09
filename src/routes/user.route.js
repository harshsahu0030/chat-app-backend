import express from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  acceptFriendRequest,
  cancelRequest,
  getFriendRequests,
  getFriendsList,
  getRelation,
  getUserById,
  getUsers,
  rejectFriendRequest,
  removeFriend,
  sendFriendRequest,
} from "../controllers/user.controller.js";
import {
  getUserValidator,
  userIdVatidator,
  validateHandler,
} from "../lib/validators.js";

const router = express.Router();

router.route("/users").get(verifyJWT, getUsers);

router
  .route("/user/:id")
  .get(verifyJWT, getUserValidator(), validateHandler, getUserById);

router
  .route("/user/status/:id")
  .get(verifyJWT, getUserValidator(), validateHandler, getRelation);

router.route("/friends").get(verifyJWT, getFriendsList);

router.route("/friend/requests").get(verifyJWT, getFriendRequests);

router
  .route("/friend/request/send")
  .post(verifyJWT, userIdVatidator(), validateHandler, sendFriendRequest);
  
router
  .route("/friend/request/cancel")
  .post(verifyJWT, userIdVatidator(), validateHandler, cancelRequest);

router
  .route("/friend/request/accept")
  .post(verifyJWT, userIdVatidator(), validateHandler, acceptFriendRequest);

router
  .route("/friend/request/reject")
  .post(verifyJWT, userIdVatidator(), validateHandler, rejectFriendRequest);

router
  .route("/friend/remove")
  .post(verifyJWT, userIdVatidator(), validateHandler, removeFriend);

export default router;
