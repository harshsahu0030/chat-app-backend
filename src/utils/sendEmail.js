import nodemailer from "nodemailer";
import { ApiError } from "./ApiError.js";

export const sendEmail = async ({ email, subject, text }) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.ACC_EMAIL,
      pass: process.env.ACC_PASSWORD,
    },
  });

  const mailOptions = {
    from: process.env.ACC_EMAIL,
    to: email,
    subject: `${subject}`,
    text: `${text}`,
  };

  try {
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    throw new ApiError(500, `Email send failed with error: ${error}`);
  }
};
