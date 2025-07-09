import { ApiResponse } from "./ApiResponse.js";
import { sendEmail } from "./sendEmail.js";

export const verfifyUser = async (res, user) => {
  let token = await user.generateRefreshToken();

  const subject =
    "Please verify your email address by clicking the link below:";

  const verificationLink = `${process.env.CLIENT_URL}/verify/${token}`;

  const text = `Hello ${user.name},\n\nPlease verify your email address by clicking the link below:\n${verificationLink}\n\nThank you!`;

  // Resend verification email
  const send = await sendEmail({
    email: user.email,
    subject,
    text,
  });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        null,
        "Email sent! Please verify your email address."
      )
    );
};

export const resentVerifyUser = async (res, user) => {
  let token = await user.generateRefreshToken();

  const subject =
    "Please verify your email address by clicking the link below:";

  const verificationLink = `${process.env.CLIENT_URL}/auth/verify/${token}`;

  const text = `Hello ${user.name},\n\nPlease verify your email address by clicking the link below:\n${verificationLink}\n\nThank you!`;

  // Resend verification email
  const send = await sendEmail({
    email: user.email,
    subject,
    text,
  });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { user: null },
        "Email resent! Please verify your email address."
      )
    );
};

export const forgotPasswordUser = async (res, user) => {
  let token = await user.generateRefreshToken();

  const subject = "Please reset your password by clicking the link below:";

  const resetLink = `${process.env.CLIENT_URL}/auth/reset-password/${token}`;

  const text = `Hello ${user.name},\n\nPlease reset your password by clicking the link below:\n${resetLink}\n\nThank you!`;

  // Send password reset email
  const send = await sendEmail({
    email: user.email,
    subject,
    text,
  });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        null,
        "Email sent! Please reset your password using the link sent to your email."
      )
    );
};
