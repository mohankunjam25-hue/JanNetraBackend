const { asyncHandler } = require("../utils/asyncHandler");
const { ApiError } = require("../utils/ApiError");
const { ApiResponse } = require("../utils/ApiResponse");
const Message = require("../models/message.model");
const User = require("../models/user.model");
const mongoose = require("mongoose");
const { getIO } = require("../socket");

/**
 * @description Send a message to another user
 */
const sendMessage = asyncHandler(async (req, res) => {
    const { receiverId, content, media } = req.body;
    const senderId = req.user._id;

    if (!receiverId || !content) {
        throw new ApiError(400, "Receiver and content are required");
    }

    const receiver = await User.findById(receiverId);
    if (!receiver) {
        throw new ApiError(404, "Receiver not found");
    }

    const message = await Message.create({
        sender: senderId,
        receiver: receiverId,
        content,
        media: media || ""
    });

    const populatedMessage = await Message.findById(message._id)
        .populate("sender", "fullName username avatar")
        .populate("receiver", "fullName username avatar");

    // Emit via Socket.io to the receiver's private room
    const io = getIO();
    io.to(receiverId.toString()).emit("new_message", populatedMessage);

    return res.status(201).json(new ApiResponse(201, populatedMessage, "Message sent"));
});

/**
 * @description Get conversation history with a specific user (with pagination)
 */
const getMessages = asyncHandler(async (req, res) => {
    const { otherUserId } = req.params;
    const userId = req.user._id;
    const { page = 1, limit = 50 } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Fetch newest messages first for efficient pagination
    const messages = await Message.find({
        $or: [
            { sender: userId, receiver: otherUserId },
            { sender: otherUserId, receiver: userId }
        ]
    })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit))
    .populate("sender", "fullName username avatar")
    .populate("receiver", "fullName username avatar");

    // Reverse the array to maintain chronological order for the UI
    const orderedMessages = [...messages].reverse();

    // Mark messages as read (only those in the current fetched batch)
    const messageIds = messages.map(m => m._id);
    await Message.updateMany(
        { _id: { $in: messageIds }, receiver: userId, isRead: false },
        { $set: { isRead: true } }
    );

    return res.status(200).json(new ApiResponse(200, orderedMessages, "Messages fetched"));
});

/**
 * @description Get list of users with whom the current user has conversations
 */
const getChatList = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    // Aggregate to find unique users the current user has chatted with
    const chatList = await Message.aggregate([
        {
            $match: {
                $or: [{ sender: userId }, { receiver: userId }]
            }
        },
        {
            $sort: { createdAt: -1 }
        },
        {
            $group: {
                _id: {
                    $cond: [
                        { $eq: ["$sender", userId] },
                        "$receiver",
                        "$sender"
                    ]
                },
                lastMessage: { $first: "$content" },
                lastMessageTime: { $first: "$createdAt" },
                unreadCount: {
                    $sum: {
                        $cond: [
                            { $and: [{ $eq: ["$receiver", userId] }, { $eq: ["$isRead", false] }] },
                            1,
                            0
                        ]
                    }
                }
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "_id",
                foreignField: "_id",
                as: "userDetails"
            }
        },
        {
            $unwind: "$userDetails"
        },
        {
            $project: {
                _id: 1,
                lastMessage: 1,
                lastMessageTime: 1,
                unreadCount: 1,
                "userDetails.fullName": 1,
                "userDetails.username": 1,
                "userDetails.avatar": 1,
                "userDetails.isVerified": 1
            }
        },
        {
            $sort: { lastMessageTime: -1 }
        }
    ]);

    return res.status(200).json(new ApiResponse(200, chatList, "Chat list fetched"));
});

module.exports = {
    sendMessage,
    getMessages,
    getChatList
};
