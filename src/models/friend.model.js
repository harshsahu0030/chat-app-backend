import mongoose, { Schema, model, Types } from "mongoose";

const schema = new Schema(
  {
    user: {
      type: Types.ObjectId,
      ref: "User",
      required: true,
    },

    friends: [
      {
        type: Types.ObjectId,
        ref: "User",
      },
    ],

    requests: [
      {
        type: Types.ObjectId,
        ref: "User",
      },
    ],

    sendRequests: [
      {
        type: Types.ObjectId,
        ref: "User",
      },
    ],
  },

  {
    timestamps: true,
  }
);

export const Friend = mongoose.models.Friend || model("Friend", schema);
