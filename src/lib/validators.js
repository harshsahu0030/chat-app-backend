import { body, param, validationResult } from "express-validator";
import { ApiError } from "../utils/ApiError.js";

export const validateHandler = (req, res, next) => {
  const errors = validationResult(req);

  const errorMessages = errors
    .array()
    .map((error) => error.msg)
    .join(", ");

  if (errors.isEmpty()) return next();
  else next(new ApiError(errorMessages, 400));
};

// auth Routes
export const registerValidator = () => [
  body("name", "Please Enter Name").notEmpty(),
  body("email", "Please Enter Email").notEmpty(),
  body("username", "Please Enter Username").notEmpty(),
  body("password", "Please Enter Password").notEmpty(),
];

export const verifyUserValidator = () => [
  param("token", "Please Enter Token").notEmpty(),
];

export const loginValidator = () => [
  body("input", "Please Enter Username or Email").notEmpty(),
  body("password", "Please Enter Password").notEmpty(),
];

export const forgotPasswordValidator = () => [
  body("email", "Please Enter Email").notEmpty(),
];

export const resetPasswordValidator = () => [
  param("token", "Please Enter Token").notEmpty(),
  body("password", "Please Enter Password").notEmpty(),
  body("confirmPassword", "Please Enter Confirm Password").notEmpty(),
];

// user Routes
export const getUserValidator = () => [
  param("id", "Please Enter User ID").notEmpty(),
];

export const sendRequestValidator = () => [
  body("userId", "Please Enter User ID").notEmpty(),
];
export const acceptRequestValidator = () => [
  body("userId", "Please Enter User ID").notEmpty(),
];
export const rejectRequestValidator = () => [
  body("userId", "Please Enter User ID").notEmpty(),
];
export const removeFriendValidator = () => [
  body("userId", "Please Enter User ID").notEmpty(),
];

export const createGroupValidator = () => [
  body("groupName", "Please Enter Group Name").notEmpty(),
  body("members")
    .notEmpty()
    .withMessage("Please Enter Members")
    .isArray({ min: 2, max: 100 })
    .withMessage("Members must be 2-100"),
];

const addMemberValidator = () => [
  body("chatId", "Please Enter Chat ID").notEmpty(),
  body("members")
    .notEmpty()
    .withMessage("Please Enter Members")
    .isArray({ min: 1, max: 97 })
    .withMessage("Members must be 1-97"),
];

const adminLoginValidator = () => [
  body("secretKey", "Please Enter Secret Key").notEmpty(),
];
