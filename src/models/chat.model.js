import mongoose, { Schema, model, Types } from "mongoose";

const schema = new Schema(
  {
    members: [{ type: Types.ObjectId, ref: "User" }],

    isGroupChat: { type: Boolean, default: false },

    groupName: String,

    avatar: {
      public_id: {
        type: String,
      },
      url: {
        type: String,
      },
    },

    lastMessage: {
      type: Types.ObjectId,
      ref: "Message",
    },

    createdBy: {
      type: Types.ObjectId,
      ref: "User",
      required: true,
    },

    admin: [
      {
        type: Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],
  },
  {
    timestamps: true,
  }
);

schema.index({ participants: 1 });

export const Chat = mongoose.models.Chat || model("Chat", schema);
