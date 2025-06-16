import express from "express";
import {
  forgotPassword,
  getMyProfile,
  loginUser,
  logoutUser,
  registerUser,
  resetPassword,
  updateMyProfile,
  verifyUser,
} from "../controllers/auth.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";
import {
  forgotPasswordValidator,
  loginValidator,
  registerValidator,
  resetPasswordValidator,
  validateHandler,
  verifyUserValidator,
} from "../lib/validators.js";

const router = express.Router();

router
  .route("/register")
  .post(registerValidator(), validateHandler, registerUser);

router
  .route("/verify/:token")
  .get(verifyUserValidator(), validateHandler, verifyUser);

router.route("/login").post(loginValidator(), validateHandler, loginUser);

router.route("/profile/update").put(
  verifyJWT,
  upload.fields([
    {
      name: "avatar",
      maxCount: 1,
    },
  ]),
  updateMyProfile
);

router
  .route("/password/forgot")
  .post(forgotPasswordValidator(), validateHandler, forgotPassword);

router
  .route("/password/reset/:token")
  .put(resetPasswordValidator(), validateHandler, resetPassword);

router.route("/me").get(verifyJWT, getMyProfile);

router.route("/logout").get(verifyJWT, logoutUser);

export default router;
