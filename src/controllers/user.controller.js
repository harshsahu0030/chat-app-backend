import { Friend } from "../models/friend.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import ApiFeatures from "../utils/features.js";

export const getUsers = asyncHandler(async (req, res, next) => {
  const resultPerPage = 20;

  let apiFeatures = new ApiFeatures(
    User.find(
      { _id: { $ne: req.user._id } },
      { name: 1, username: 1, avatar: 1 }
    ).lean(),
    req.query
  ).search();

  const filteredUsers = await apiFeatures.query.clone().countDocuments();
  const totalPages = Math.ceil(filteredUsers / resultPerPage);

  apiFeatures.pagination(resultPerPage);

  let users = await apiFeatures.query;

  return res
    .status(200)
    .json(
      new ApiResponse(200, { totalPages, filteredUsers, users }, "User fetched")
    );
});

export const getUserById = asyncHandler(async (req, res, next) => {
  const userId = req.params.id;

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

  if (!user) {
    return next(new ApiError(404, "User not found"));
  }

  return res
    .status(200)
    .json(new ApiResponse(200, { user }, "User fetched successfully"));
});

export const getRelation = asyncHandler(async (req, res, next) => {
  const userId = req.params.id;

  const relation = await Friend.findOne({ user: req.user._id }).lean();

  let status = "none";

  if (relation) {
    const userIdStr = userId.toString();

    if (userIdStr === req.user._id.toString()) {
      status = "me";
    } else if (relation.friends?.some((id) => id.toString() === userIdStr)) {
      status = "friend";
    } else if (relation.requests?.some((id) => id.toString() === userIdStr)) {
      status = "request";
    } else if (
      relation.sendRequests?.some((id) => id.toString() === userIdStr)
    ) {
      status = "sendRequest";
    }
  }

  return res
    .status(200)
    .json(new ApiResponse(200, { status }, "Relation fetched successfully"));
});

export const getFriendsList = asyncHandler(async (req, res, next) => {
  const resultPerPage = 20;

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

  const filteredUsers = await apiFeatures.query.clone().countDocuments();
  const totalPages = Math.ceil(filteredUsers / resultPerPage);

  apiFeatures.pagination(resultPerPage);

  const friends = await apiFeatures.query;

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { totalPages, filteredUsers, friends },
        "Friends fetched successfully"
      )
    );
});

export const getFriendRequests = asyncHandler(async (req, res, next) => {
  const resultPerPage = 20;

  let apiFeatures = new ApiFeatures(
    Friend.find({ user: req.user._id }, { requests: 1 })
      .lean()
      .populate("requests", "name username avatar"),
    req.query
  );

  const filteredUsers = await apiFeatures.query.clone().countDocuments();
  const totalPages = Math.ceil(filteredUsers / resultPerPage);

  apiFeatures.pagination(resultPerPage);

  let friendRequests = await apiFeatures.query;

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { totalPages, filteredUsers, friendRequests },
        "Friend requests fetched successfully"
      )
    );
});

export const sendFriendRequest = asyncHandler(async (req, res, next) => {
  const { userId } = req.body;

  if (userId === req.user._id.toString()) {
    return next(
      new ApiError(400, "You cannot send a friend request to yourself")
    );
  }

  const userDoc = await Friend.findOneAndUpdate(
    {
      user: req.user._id,
      friends: { $ne: userId },
    },
    { $addToSet: { sendRequests: userId } },
    { new: true, upsert: true }
  );

  const friendDoc = await Friend.findOneAndUpdate(
    {
      user: userId,
      friends: { $ne: req.user._id },
    },
    { $addToSet: { requests: req.user._id } },
    { new: true, upsert: true }
  );

  if (!friendDoc || !userDoc) {
    return next(new ApiError(500, "Failed to send"));
  }

  return res.status(200).json(new ApiResponse(200, null, "Request sent"));
});

export const cancelRequest = asyncHandler(async (req, res, next) => {
  const { userId } = req.body;

  if (userId === req.user._id.toString()) {
    return next(
      new ApiError(400, "You cannot cancel a friend request to yourself")
    );
  }

  const userDoc = await Friend.findOneAndUpdate(
    {
      user: req.user._id,
      friends: { $ne: userId },
    },
    { $pull: { sendRequests: userId } },
    { new: true, upsert: true }
  );

  const friendDoc = await Friend.findOneAndUpdate(
    {
      user: userId,
      friends: { $ne: req.user._id },
    },
    { $pull: { requests: req.user._id } },
    { new: true, upsert: true }
  );

  if (!friendDoc || !userDoc) {
    return next(new ApiError(500, "Failed to cancel"));
  }

  return res.status(200).json(new ApiResponse(200, null, "Request cancelled"));
});

export const acceptFriendRequest = asyncHandler(async (req, res, next) => {
  const { userId } = req.body;

  if (userId === req.user._id.toString()) {
    return next(
      new ApiError(400, "You cannot accept a friend request from yourself")
    );
  }

  const userDoc = await Friend.findOneAndUpdate(
    {
      user: req.user._id,
      friends: { $ne: userId },
      requests: { $in: [userId] },
    },
    {
      $pull: { requests: userId, sendRequests: userId },
      $addToSet: { friends: userId },
    },
    { new: true }
  );

  const friendDoc = await Friend.findOneAndUpdate(
    {
      user: userId,
      friends: { $ne: req.user._id },
      sendRequests: { $in: [req.user._id] },
    },
    {
      $pull: { sendRequests: req.user._id, requests: req.user._id },
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

  if (userId === req.user._id.toString()) {
    return next(
      new ApiError(400, "You cannot reject a friend request from yourself")
    );
  }

  const userDoc = await Friend.findOneAndUpdate(
    {
      user: req.user._id,
      friends: { $ne: userId },
      requests: { $in: [userId] },
    },
    {
      $pull: { requests: userId },
    },
    { new: true }
  );

  const friendDoc = await Friend.findOneAndUpdate(
    { user: userId, friends: { $ne: userId }, sendRequests: { $in: [userId] } },
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

  if (userId === req.user._id.toString()) {
    return next(new ApiError(400, "You cannot remove yourself as a friend"));
  }

  await Friend.findOneAndUpdate(
    { user: req.user._id },
    {
      $pull: { friends: userId },
    },
    { new: true }
  );

  await Friend.findOneAndUpdate(
    { user: userId },
    {
      $pull: { friends: req.user._id },
    },
    { new: true }
  );

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Friend removed successfully"));
});
