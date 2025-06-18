import { Chat } from "../models/chat.model.js";
import { Friend } from "../models/friend.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const getChats = asyncHandler(async (req, res, next) => {
  const { group, keyword } = req.query;
  const searchRegex = new RegExp(keyword, "i");

  let chats = await Chat.find({
    members: { $in: [{ _id: req.user._id }] },
  })
    .countDocuments()
    .lean();

  if (chats <= 0) {
    return res.status(200).json(new ApiResponse(200, [], "No Chats found"));
  }

  if (keyword && !group) {
    const matchingUsers = await User.find(
      {
        $or: [
          { username: { $regex: searchRegex } },
          { name: { $regex: searchRegex } },
        ],
      },
      { _id: 1 }
    ).lean();
    if (matchingUsers.length <= 0) {
      return res.status(200).json(new ApiResponse(200, [], "No Chats found"));
    }

    const matchingUserIds = matchingUsers.map((u) => u._id);

    chats = await Chat.find({
      $and: [
        { members: { $elemMatch: { $eq: req.user._id } }, isGroupChat: false }, // only chats you belong to
        {
          $or: [{ members: { $in: matchingUserIds } }],
        },
      ],
    })
      .populate("members", "username name avatar")
      .populate("lastMessage")
      .sort({ updatedAt: -1 })
      .lean();

    return res.status(200).json(new ApiResponse(200, chats, "Chats fetched"));
  }

  if (group === "true") {
    chats = await Chat.find({
      members: { $in: [{ _id: req.user._id }] },
      groupName: searchRegex,
    })
      .populate("members", "username name avatar")
      .populate("lastMessage")
      .sort({ updatedAt: -1 })
      .lean();

    return res
      .status(200)
      .json(new ApiResponse(200, chats, "Chats fetched successfully"));
  }

  chats = await Chat.find({
    members: { $in: [{ _id: req.user._id }] },
  })
    .populate("members", "username name avatar")
    .populate("lastMessage")
    .sort({ updatedAt: -1 })
    .lean();

  return res
    .status(200)
    .json(new ApiResponse(200, chats, "Chats fetched successfully"));
});

export const getCHatById = asyncHandler(async (req, res, next) => {
  const chatId = req.params.id;

  const chat = await Chat.findById(chatId)
    .populate("members", "username name avatar")
    .populate("lastMessage")
    .lean();

  if (!chat) {
    return next(new ApiError(404, "Chat not found"));
  }

  return res
    .status(200)
    .json(new ApiResponse(200, chat, "Chat fetched successfully"));
});

export const createGroupChat = asyncHandler(async (req, res, next) => {
  const { groupName, members } = req.body;

  const allMembers = [...members, req.user];

  let friends = await Friend.findOne({
    user: req.user._id,
  }).lean();

  friends = friends.friends.map((i) => i.toString());

  for (let i = 0; i < members.length; i++) {
    if (!friends?.includes(members[i])) {
      return next(new ApiError(400, "All members must be friends"));
    }
  }

  const groupChat = await Chat.create({
    groupName: groupName,
    isGroupChat: true,
    createdBy: req.user,
    admin: req.user,
    members: allMembers,
  });

  if (!groupChat) {
    return next(new ApiError(500, "Unable to create new Group"));
  }

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Group chat created successfully"));
});

export const updateGroup = asyncHandler(async (req, res, next) => {
  const { chatId, groupName, avatar, description } = req.body;

  const friends = await Friend.findOne({
    user: req.user._id,
  }).lean();

  const groupChat = await Chat.findOneAndUpdate(
    {
      _id: chatId,
      admin: { $in: [req.user._id] },
    },
    {
      groupName: groupName,
      avatar: avatar,
      description: description,
    },
    { new: true }
  );

  if (!groupChat) {
    return next(new ApiError(500, "Only Admin can update group"));
  }

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Group updated successfully"));
});

export const removeGroup = asyncHandler(async (req, res, next) => {
  const { chatId } = req.body;

  const chat = await Chat.findOneAndDelete({
    _id: chatId,
    admin: { $in: [req.user._id] },
  });

  if (!chat) {
    return next(new ApiError(500, "Unable to remove group"));
  }

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Group removed successfully"));
});

export const leaveGroup = asyncHandler(async (req, res, next) => {
  const { chatId } = req.body;

  const chat = await Chat.findOneAndUpdate(
    {
      _id: chatId,
      admin: { $nin: [req.user._id] },
    },
    {
      $pull: { members: req.user._id },
    },
    { new: true }
  );

  if (!chat) {
    return next(new ApiError(500, "Unable to leave group"));
  }

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Group left successfully"));
});

export const addMemberInGroup = asyncHandler(async (req, res, next) => {
  const { chatId, userId } = req.body;

  if (userId === req.user._id.toString()) {
    return next(new ApiError(400, "You cannot kick yourself from group"));
  }

  let user = await User.findById(userId).lean();

  if (!user) {
    return next(new ApiError(404, "User not found"));
  }

  let chat = await Chat.findOneAndUpdate(
    {
      _id: chatId,
      admin: { $in: [req.user._id] },
    },
    {
      $addToSet: { members: user._id },
    },
    { new: true }
  );

  if (!chat) {
    return next(new ApiError(500, "Only Admin can add member to group"));
  }

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Add Member successfully"));
});

export const kickUserFromGroup = asyncHandler(async (req, res, next) => {
  const { chatId, userId } = req.body;

  if (userId === req.user._id.toString()) {
    return next(new ApiError(400, "You cannot kick yourself from group"));
  }

  let user = await User.findById(userId).lean();

  if (!user) {
    return next(new ApiError(404, "User not found"));
  }

  let chat = await Chat.findOneAndUpdate(
    {
      _id: chatId,
      admin: { $in: [req.user._id] },
    },
    {
      $pull: { members: user._id },
    },
    { new: true }
  );

  if (!chat) {
    return next(new ApiError(500, "Only Admin can kick user from group"));
  }

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Member kick successfully"));
});
