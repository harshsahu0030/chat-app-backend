import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import jwt from "jsonwebtoken";

import {
  destroyOnCloudinary,
  uploadOnCloudinary,
} from "../utils/cloudinary.js";
import {
  forgotPasswordUser,
  resentVerifyUser,
  verfifyUser,
} from "../utils/helpers.js";
import { Friend } from "../models/friend.model.js";

export const registerUser = asyncHandler(async (req, res, next) => {
  const { name, username, email, password } = req.body;

  // Validate input
  if (!name || !username || !email || !password) {
    return next(new ApiError(400, "Please provide all required fields"));
  }

  // Check if user already exists
  let user = await User.findOne({
    $or: [{ email: email.toLowerCase() }, { username: username.toLowerCase() }],
  });

  // If user exists and is not verified, resend verification email
  if (user && !user.isVerified) {
    await resentVerifyUser(res, user);
  }

  // If user exists and is verified, throw an error
  if (user) {
    return next(
      new ApiError(400, "User with this email or username already exists")
    );
  }

  user = await User.create(req.body);

  if (!user) {
    return next(new ApiError(500, "Internal Server Error: Please try again"));
  }

  // verification email
  await verfifyUser(res, user);
});

export const verifyUser = asyncHandler(async (req, res, next) => {
  const { token } = req.params;

  const decodedToken = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);

  // Find user by ID and verify
  const user = await User.findById(decodedToken?._id).select("+refreshToken");

  // Check if refresh token is valid
  if (!user || user.refreshToken !== token) {
    return next(new ApiError(401, "Invalid or expired token"));
  }

  user.isVerified = true;
  user.refreshToken = null; // Clear refresh token after verification

  await Friend.create({ user: user?._id }); // Create a friend list for the user
  await user.save();

  return res
    .status(200)
    .json(new ApiResponse(200, null, "User verified successfully"));
});

export const loginUser = asyncHandler(async (req, res, next) => {
  const { input, password } = req.body;

  // Validate input
  if (!input || !password) {
    return next(new ApiError(400, "Please provide all required fields"));
  }

  // Check if user already exists
  const user = await User.findOne({
    $or: [{ email: input.toLowerCase() }, { username: input.toLowerCase() }],
  }).select("+password");

  if (!user) {
    return next(
      new ApiError(404, "User not with this email or username found")
    );
  }

  // Check if user is verified
  if (!user.isVerified) {
    return await resentVerifyUser(res, user);
  }

  // Check if password is correct
  const isPasswordCorrect = await user.isPasswordCorrect(password);

  if (!isPasswordCorrect) {
    return next(new ApiError(401, "Invalid email or password"));
  }

  // Generate access token
  const accessToken = user.generateAccessToken();

  return res
    .status(200)
    .cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: "None",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    })
    .json(new ApiResponse(200, { user }, `Welcome Back! ${user.name}`));
});

export const logoutUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .cookie("accessToken", null, {
      expires: new Date(Date.now()),
      httpOnly: true,
    })
    .json(new ApiResponse(200, null, "Logout successful"));
});

export const getMyProfile = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user);

  if (!user) return next(new ApiError(404, "User not found"));

  return res
    .status(200)
    .json(new ApiResponse(200, { user }, "User profile fetched successfully"));
});

export const updateMyProfile = asyncHandler(async (req, res, next) => {
  if (req.body.avatar) {
    if (req.user.avatar?.public_id) {
      await destroyOnCloudinary(req.user.avatar?.public_id);
    }
    let result = await uploadOnCloudinary(req.body.avatar);

    req.body.avatar = {
      public_id: result?.public_id,
      url: result?.secure_url,
    };
  }

  const user = await User.findByIdAndUpdate(req.user, req.body, {
    new: true,
  });

  if (!user) return next(new ApiError(404, "User not found"));

  res.status(200).json(new ApiResponse(200, { user }, "User profile updated"));
});

export const forgotPassword = asyncHandler(async (req, res, next) => {
  const { email } = req.body;

  // Validate input
  if (!email) {
    return next(new ApiError(400, "Please provide an email address"));
  }

  // Check if user exists
  const user = await User.findOne({ email: email.toLowerCase() });

  if (!user) {
    return next(new ApiError(404, "User with this email not found"));
  }

  await forgotPasswordUser(res, user);
});

export const resetPassword = asyncHandler(async (req, res, next) => {
  const { token } = req.params;
  const { password, confirmPassword } = req.body;

  // Check if passwords match
  if (password !== confirmPassword) {
    return next(new ApiError(400, "Passwords do not match"));
  }

  const decodedToken = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);

  // Find user by ID and verify
  const user = await User.findById(decodedToken?._id).select("+refreshToken");

  // Check if refresh token is valid
  if (!user || user.refreshToken !== token) {
    return next(new ApiError(401, "Invalid or expired token"));
  }

  // Allow user to reset password
  user.password = password;
  user.refreshToken = null; // Clear refresh token after use

  await user.save();

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Password reset successfully"));
});
