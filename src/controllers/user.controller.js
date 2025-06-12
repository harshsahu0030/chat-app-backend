import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { sendEmail } from "../utils/sendEmail.js";
import {
  destroyOnCloudinary,
  uploadOnCloudinary,
} from "../utils/cloudinary.js";

export const registerUser = asyncHandler(async (req, res) => {
  const { name, username, email, password } = req.body;

  // Validate input
  if (!name || !username || !email || !password) {
    throw new ApiError(400, "Please provide all required fields");
  }

  // Check if user already exists
  const user = await User.findOne({
    $or: [{ email: email.toLowerCase() }, { username: username.toLowerCase() }],
  });

  // If user exists and is not verified, resend verification email
  if (!user.isVerified) {
    const subject =
      "Please verify your email address by clicking the link below:";

    const verificationLink = `${req.protocol}://${req.get(
      "host"
    )}/api/v1/user/verify/${user._id}`;

    const text = `Hello ${user.name},\n\nPlease verify your email address by clicking the link below:\n${verificationLink}\n\nThank you!`;

    // Resend verification email
    await sendEmail({
      email: user.email,
      subject,
      text,
    });

    return res
      .status(201)
      .json(
        new ApiResponse(
          201,
          user,
          "Email sent again! Please verify your email address."
        )
      );
  }

  // If user exists and is verified, throw an error
  if (user) {
    throw new ApiError(400, "User with this email or username already exists");
  }

  user = await User.create(req.body);

  const subject =
    "Please verify your email address by clicking the link below:";

  const verificationLink = `${req.protocol}://${req.get(
    "host"
  )}/api/v1/user/verify/${user._id}`;

  const text = `Hello ${user.name},\n\nPlease verify your email address by clicking the link below:\n${verificationLink}\n\nThank you!`;

  if (!user) {
    throw new ApiError(500, "Internal Server Error: Please try again");
  }

  // verification email
  await sendEmail({
    email: user.email,
    subject,
    text,
  });

  return res
    .status(201)
    .json(
      new ApiResponse(
        201,
        user,
        "Email sent! Please verify your email address."
      )
    );
});

export const verifyUser = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Find user by ID and verify
  const user = await User.findById(id);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  user.isVerified = true;
  await user.save();

  return res
    .status(200)
    .json(new ApiResponse(200, user, "User verified successfully"));
});

export const loginUser = asyncHandler(async (req, res) => {
  const { input, password } = req.body;

  // Validate input
  if (!input || !password) {
    throw new ApiError(400, "Please provide all required fields");
  }

  // Check if user already exists
  const user = await User.findOne({
    $or: [{ email: input.toLowerCase() }, { username: input.toLowerCase() }],
  }).select("+password");

  if (!user) {
    throw new ApiError(404, "User not with this email or username found");
  }

  // Check if user is verified
  if (!user.isVerified) {
    const subject =
      "Please verify your email address by clicking the link below:";

    const verificationLink = `${req.protocol}://${req.get(
      "host"
    )}/api/v1/user/verify/${user._id}`;

    const text = `Hello ${user.name},\n\nPlease verify your email address by clicking the link below:\n${verificationLink}\n\nThank you!`;

    // Resend verification email
    await sendEmail({
      email: user.email,
      subject,
      text,
    });

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          user,
          "Email sent again! Please verify your email address."
        )
      );
  }

  // Check if password is correct
  const isPasswordCorrect = await user.isPasswordCorrect(password);

  if (!isPasswordCorrect) {
    throw new ApiError(401, "Invalid email or password");
  }

  // Generate access token
  const accessToken = user.generateAccessToken();

  return res
    .status(200)
    .cookie("accessToken", accessToken)
    .json(new ApiResponse(200, { user }, "Login successful"));
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
    .json(new ApiResponse(200, user, "User profile fetched successfully"));
});

export const updateMyProfile = asyncHandler(async (req, res, next) => {
  if (req.files?.avatar?.path) {
    if (req.user.avatar?.public_id) {
      await destroyOnCloudinary(req.user.avatar?.public_id);
    }

    let result = await uploadOnCloudinary(req.files?.avatar[0]?.path);

    req.body.avatar = {
      public_id: result.public_id,
      url: result.secure_url,
    };
  }

  let user = await User.findByIdAndUpdate(req.user._id, req.body, {
    new: true,
    runValidators: true,
    useFindAndModify: false,
  });

  res
    .status(200)
    .json(new ApiResponse(200, user, "User profile updated successfully"));
});
