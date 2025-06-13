import { Friend } from "../models/friend.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import ApiFeatures from "../utils/features.js";

export const getUsers = asyncHandler(async (req, res) => {
  let apiFeatures = new ApiFeatures(
    User.find(
      { _id: { $ne: req.user._id } },
      { name: 1, username: 1, avatar: 1 }
    ).lean(),
    req.query
  ).search();

  let users = await apiFeatures.query;

  return res.status(200).json(new ApiResponse(200, users, "User fetched"));
});

export const getUserById = asyncHandler(async (req, res, next) => {
  const userId = req.params.id;
  if (!userId) {
    return next(new ApiError(400, "User ID is required"));
  }

  const user = await User.findById(
    { _id: userId },
    {
      name: 1,
      username: 1,
      avatar: 1,
      bio: 1,
      email: 1,
      createdAt: 1,
      private: 1,
    }
  );

  const relation = await Friend.findOne({ user: req.user._id }).lean();

  let status = "none";
  if (relation?.friends.includes(userId)) {
    status = "friend";
  } else if (relation?.requests.includes(userId)) {
    status = "request";
  } else if (relation?.sendRequests.includes(userId)) {
    status = "sendRequest";
  }

  if (!user) {
    return next(new ApiError(404, "User not found"));
  }

  return res
    .status(200)
    .json(new ApiResponse(200, { user, status }, "User fetched successfully"));
});

export const getFriendsList = asyncHandler(async (req, res) => {
  const friendDoc = await Friend.findOne({ user: req.user._id }).lean();

  if (!friendDoc || !friendDoc.friends?.length) {
    return res.status(200).json(new ApiResponse(200, [], "No friends found"));
  }

  let apiFeatures = new ApiFeatures(
    User.find(
      { _id: { $in: friendDoc.friends } },
      { name: 1, username: 1, avatar: 1 }
    ).lean(),
    req.query
  ).search();

  const friends = await apiFeatures.query;

  return res
    .status(200)
    .json(new ApiResponse(200, friends, "Friends fetched successfully"));
});

export const getFriendRequests = asyncHandler(async (req, res) => {
  const friendRequests = await Friend.find({
    user: req.user._id,
  })
    .populate("requests", "name username avatar")
    .lean();

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        friendRequests,
        "Friend requests fetched successfully"
      )
    );
});

export const sendFriendRequest = asyncHandler(async (req, res, next) => {
  const { userId } = req.body;

  if (!userId) {
    return next(new ApiError(400, "User ID is required"));
  }

  if (userId === req.user._id.toString()) {
    return next(
      new ApiError(400, "You cannot send a friend request to yourself")
    );
  }

  const userDoc = await Friend.findOneAndUpdate(
    { user: req.user._id },
    { $addToSet: { sendRequests: userId } },
    { new: true, upsert: true }
  );

  const friendDoc = await Friend.findOneAndUpdate(
    { user: userId },
    { $addToSet: { requests: req.user._id } },
    { new: true, upsert: true }
  );

  if (!friendDoc || !userDoc) {
    return next(new ApiError(500, "Failed to send"));
  }

  return res.status(200).json(new ApiResponse(200, null, "Request sent"));
});

export const acceptFriendRequest = asyncHandler(async (req, res, next) => {
  const { userId } = req.body;

  if (!userId) {
    return next(new ApiError(400, "User ID is required"));
  }

  if (userId === req.user._id.toString()) {
    return next(
      new ApiError(400, "You cannot accept a friend request from yourself")
    );
  }

  const userDoc = await Friend.findOneAndUpdate(
    { user: req.user._id },
    {
      $pull: { requests: userId },
      $addToSet: { friends: userId },
    },
    { new: true }
  );

  const friendDoc = await Friend.findOneAndUpdate(
    { user: userId },
    {
      $pull: { sendRequests: req.user._id },
      $addToSet: { friends: req.user._id },
    },
    { new: true }
  );

  if (!friendDoc || !userDoc) {
    return next(new ApiError(500, "Failed to accept friend request"));
  }

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Friend request accepted"));
});

export const rejectFriendRequest = asyncHandler(async (req, res, next) => {
  const { userId } = req.body;

  if (!userId) {
    return next(new ApiError(400, "User ID is required"));
  }

  if (userId === req.user._id.toString()) {
    return next(
      new ApiError(400, "You cannot reject a friend request from yourself")
    );
  }

  const userDoc = await Friend.findOneAndUpdate(
    { user: req.user._id },
    {
      $pull: { requests: userId },
    },
    { new: true }
  );

  const friendDoc = await Friend.findOneAndUpdate(
    { user: userId },
    {
      $pull: { sendRequests: req.user._id },
    },
    { new: true }
  );

  if (!friendDoc || userDoc) {
    return next(new ApiError(500, "Failed to reject friend request"));
  }

  return res
    .status(200)
    .json(new ApiResponse(200, friendDoc, "Friend request rejected"));
});

export const removeFriend = asyncHandler(async (req, res, next) => {
  const { userId } = req.body;

  if (!userId) {
    return next(new ApiError(400, "User ID is required"));
  }

  if (userId === req.user._id.toString()) {
    return next(new ApiError(400, "You cannot remove yourself as a friend"));
  }

  const userDoc = await Friend.findOneAndUpdate(
    { user: req.user._id },
    {
      $pull: { friends: userId },
    },
    { new: true }
  );

  const friendDoc = await Friend.findOneAndUpdate(
    { user: userId },
    {
      $pull: { friends: req.user._id },
    },
    { new: true }
  );

  if (!friendDoc || userDoc) {
    return next(new ApiError(500, "Failed to remove friend"));
  }

  return res
    .status(200)
    .json(new ApiResponse(200, friendDoc, "Friend removed successfully"));
});
