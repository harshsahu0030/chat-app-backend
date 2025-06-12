import mongoose, { Schema, model } from "mongoose";
import { hash, compare } from "bcrypt";
import validator from "validator";
import jwt from "jsonwebtoken";

const schema = new Schema(
  {
    name: {
      index: true,
      type: String,
      required: true,
    },
    bio: {
      type: String,
    },
    username: {
      type: String,
      required: [true, "Username is required"],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
      validate: {
        validator: function (v) {
          return (
            /^[a-zA-Z0-9_]+$/.test(v) && !/__/.test(v) && /^[a-zA-Z]/.test(v)
          );
        },
        message: (props) => `${props.value} is not a valid username!`,
      },
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowecase: true,
      trim: true,
      validate: {
        validator: validator.isEmail,
        message: "Please provide a valid email",
      },
    },
    password: {
      type: String,
      select: false,
      required: [true, "Password is required"],
      minlength: [8, "Password must be at least 8 characters long"],
      validate: {
        validator: function (v) {
          return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/.test(v);
        },
        message: (props) =>
          "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character",
      },
    },

    avatar: {
      public_id: {
        type: String,
      },
      url: {
        type: String,
      },
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    isAdmin: {
      type: Boolean,
      default: false,
      select: false,
    },
    accessToken: {
      type: String,
      select: false,
    },
    resetToken: {
      type: String,
      select: false,
    },
  },
  {
    timestamps: true,
  }
);

schema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  this.password = await hash(this.password, 10);
});

schema.methods.isPasswordCorrect = async function (password) {
  return await compare(password, this.password);
};

schema.methods.generateAccessToken = function () {
  return jwt.sign(
    {
      _id: this._id,
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
    }
  );
};

export const User = mongoose.models.User || model("User", schema);
