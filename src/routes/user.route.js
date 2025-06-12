import express from "express";
import {
  getMyProfile,
  loginUser,
  logoutUser,
  registerUser,
  updateMyProfile,
  verifyUser,
} from "../controllers/user.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = express.Router();

router.route("/register").post(registerUser);

router.route("/verify/:id").get(verifyUser);

router.route("/login").post(loginUser);

router.route("/me").get(verifyJWT, getMyProfile);

router.route("/logout").get(verifyJWT, logoutUser);

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

export default router;
