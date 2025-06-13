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

const router = express.Router();

router.route("/register").post(registerUser);

router.route("/verify/:token").get(verifyUser);

router.route("/login").post(loginUser);

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

router.route("/password/forgot").post(forgotPassword);

router.route("/password/reset/:token").put(resetPassword);

router.route("/me").get(verifyJWT, getMyProfile);

router.route("/logout").get(verifyJWT, logoutUser);

export default router;
