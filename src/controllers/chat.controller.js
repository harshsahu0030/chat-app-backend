import { Chat } from "../models/chat.model.js";
import { Friend } from "../models/friend.model.js";
import { Message } from "../models/messages.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import ApiFeatures from "../utils/features.js";
import { v4 as uuid } from "uuid";
import { emitEvent } from "../lib/helper.js";
import { NEW_MESSAGE, NEW_MESSAGE_ALERT } from "../constants.js";

export const getChats = asyncHandler(async (req, res) => {
  const { group, keyword } = req.query;
  const searchRegex = keyword ? new RegExp(keyword, "i") : null;
  const resultPerPage = 20;
  const userId = req.user._id;

  // Step 1: If keyword is provided and group = false
  if (keyword && !group) {
    let matchingUsers = new ApiFeatures(User.find().lean(), req.query).search();
    let users = await matchingUsers.query;
    const matchingUserIds = users.map((u) => u._id);

    // User-to-user chats
    let apiFeatures = new ApiFeatures(
      Chat.find({
        isGroupChat: false,
        members: userId,
        members: { $in: matchingUserIds },
      })
        .populate("members", "username name avatar")
        .populate("lastMessage")
        .sort({ updatedAt: -1 })
        .lean(),
      req.query
    );

    const filteredUsers = await apiFeatures.query.clone().countDocuments();
    const totalPages = Math.ceil(filteredUsers / resultPerPage);

    apiFeatures.pagination(resultPerPage);

    let chats = await apiFeatures.query;

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { filteredUsers, totalPages, chats },
          "Filtered chats fetched successfully"
        )
      );
  }

  // Step 2: If only group chats are requested
  if (group === "true") {
    let apiFeatures = new ApiFeatures(
      Chat.find({
        isGroupChat: true,
        members: userId,
        ...(keyword && { groupName: { $regex: searchRegex } }),
      })
        .populate("members", "username name avatar")
        .populate("lastMessage")
        .sort({ updatedAt: -1 })
        .lean(),
      req.query
    );

    const filteredUsers = await apiFeatures.query.clone().countDocuments();
    const totalPages = Math.ceil(filteredUsers / resultPerPage);

    apiFeatures.pagination(resultPerPage);

    let chats = await apiFeatures.query;

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { filteredUsers, totalPages, chats },
          "Group chats fetched successfully"
        )
      );
  }

  // Step 3: Default — fetch all chats for user
  let apiFeatures = new ApiFeatures(
    Chat.find({
      members: userId,
    })
      .populate("members", "username name avatar")
      .populate("lastMessage")
      .sort({ updatedAt: -1 })
      .lean(),
    req.query
  );

  const filteredUsers = await apiFeatures.query.clone().countDocuments();
  const totalPages = Math.ceil(filteredUsers / resultPerPage);

  apiFeatures.pagination(resultPerPage);

  let chats = await apiFeatures.query;

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { filteredUsers, totalPages, chats },
        "All chats fetched successfully"
      )
    );
});

export const getChatById = asyncHandler(async (req, res, next) => {
  const chatId = req.params.id;

  let chat;
  let user;

  chat = await Chat.findById(chatId)
    .populate("members", "username name avatar")
    .populate("lastMessage")
    .lean();

  if (chat) {
    if (chat.isGroupChat) {
      return res
        .status(200)
        .json(new ApiResponse(200, chat, "Chat fetched successfully"));
    }

    user = await User.findById(
      chat.members.find((m) => m._id.toString() !== req.user._id.toString())
    )
      .lean()
      .select("username name avatar");

    return res
      .status(200)
      .json(new ApiResponse(200, { chat, user }, "Chat not found"));
  }

  if (!chat) {
    user = await User.findById(chatId).lean();

    if (!user) {
      return next(new ApiError(404, "User not found"));
    }

    chat = await Chat.findOne({
      isGroupChat: false,
      members: { $in: [{ _id: req.user._id }, { _id: chatId }] },
    })
      .populate("members", "username name avatar")
      .populate("lastMessage")
      .lean();
  }

  if (!chat) {
    return res
      .status(200)
      .json(new ApiResponse(200, { chat, user }, "Chat not found"));
  }

  return res
    .status(200)
    .json(new ApiResponse(200, { chat, user }, "Chat fetched successfully"));
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

export const getMessages = asyncHandler(async (req, res, next) => {
  const chatId = req.params.id;

  const resultPerPage = 10;

  let chat = await Chat.findById(chatId);

  if (!chat) {
    chat = await Chat.findOne({
      members: { $in: [req.user._id, chat] },
    });
  }

  if (!chat) {
    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { totalPages: 0, filteredUsers: 0, messages: 0 },
          "Messages fetched successfully"
        )
      );
  }

  let apiFeatures = new ApiFeatures(
    Message.find({ chat: chat._id })
      .populate("sender", "username name avatar")
      .sort({ createdAt: -1 })
      .lean(),
    req.query
  );

  const filteredUsers = await apiFeatures.query.clone().countDocuments();
  const totalPages = Math.ceil(filteredUsers / resultPerPage);

  apiFeatures.pagination(resultPerPage);

  let messages = await apiFeatures.query;

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { totalPages, filteredUsers, messages },
        "Messages fetched successfully"
      )
    );
});

export const sendMessage = asyncHandler(async (req, res, next) => {
  let { id, message } = req.body;
  let user = req.user;
  let otherUser;

  let chat = await Chat.findById(id);

  if (!chat) {
    otherUser = await User.findById(id);

    if (!otherUser) {
      return next(new ApiError(404, "User not found"));
    }

    chat = await Chat.findOne({
      isGroupChat: false,
      members: { $all: [user._id, otherUser._id] },
    });
  }

  if (!chat) {
    chat = await Chat.create({
      isGroupChat: false,
      createdBy: user._id,
      admin: user,
      members: [user._id, otherUser._id],
    });
  }

  const messageForRealTime = {
    content: message,
    _id: uuid(),
    sender: {
      _id: user._id,
      name: user.name,
    },
    chat: chat._id,
    createdAt: new Date().toISOString(),
  };

  const messageForDB = {
    content: message,
    sender: user._id,
    chat: chat._id,
  };

  const finalMessage = await Message.create(messageForDB);
  chat.lastMessage = finalMessage._id;
  await chat.save();

  if (!chat || !finalMessage) {
    return next(new ApiError(500, "Unable to send message"));
  }

  let realTimeChat = await Chat.findById(chat._id)
    .populate("members", "username name avatar")
    .populate("lastMessage")
    .lean();

  emitEvent(req, NEW_MESSAGE_ALERT, chat.members, { chat: realTimeChat });

  emitEvent(req, NEW_MESSAGE, chat.members, {
    message: messageForRealTime,
    chatId: id,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, { message: finalMessage }, "Message Send"));
});
