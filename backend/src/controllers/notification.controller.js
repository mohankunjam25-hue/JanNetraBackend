const { asyncHandler } = require("../utils/asyncHandler");
const { ApiError } = require("../utils/ApiError");
const { ApiResponse } = require("../utils/ApiResponse");
const Notification = require("../models/notification.model");

/**
 * @description Get all notifications for the current user
 * @route GET /api/v1/notifications
 */
const getNotifications = asyncHandler(async (req, res) => {
    const notifications = await Notification.find({ recipient: req.user._id })
        .populate("sender", "fullName username avatar")
        .populate("post", "content media")
        .populate("comment", "content")
        .sort({ createdAt: -1 })
        .limit(50);

    return res
        .status(200)
        .json(new ApiResponse(200, notifications, "Notifications fetched successfully"));
});

/**
 * @description Mark a notification as read
 * @route PATCH /api/v1/notifications/read/:notificationId
 */
const markAsRead = asyncHandler(async (req, res) => {
    const { notificationId } = req.params;

    const notification = await Notification.findOneAndUpdate(
        { _id: notificationId, recipient: req.user._id },
        { $set: { isRead: true } },
        { new: true }
    );

    if (!notification) {
        throw new ApiError(404, "Notification not found");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, notification, "Notification marked as read"));
});

/**
 * @description Mark all notifications as read
 * @route PATCH /api/v1/notifications/read-all
 */
const markAllAsRead = asyncHandler(async (req, res) => {
    await Notification.updateMany(
        { recipient: req.user._id, isRead: false },
        { $set: { isRead: true } }
    );

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "All notifications marked as read"));
});

/**
 * @description Get unread notifications count
 * @route GET /api/v1/notifications/unread-count
 */
const getUnreadCount = asyncHandler(async (req, res) => {
    const count = await Notification.countDocuments({
        recipient: req.user._id,
        isRead: false
    });

    return res
        .status(200)
        .json(new ApiResponse(200, { unreadCount: count }, "Unread count fetched successfully"));
});

/**
 * @description Delete a notification
 * @route DELETE /api/v1/notifications/:notificationId
 */
const deleteNotification = asyncHandler(async (req, res) => {
    const { notificationId } = req.params;

    const notification = await Notification.findOneAndDelete({
        _id: notificationId,
        recipient: req.user._id
    });

    if (!notification) {
        throw new ApiError(404, "Notification not found");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Notification deleted successfully"));
});

module.exports = {
    getNotifications,
    markAsRead,
    markAllAsRead,
    getUnreadCount,
    deleteNotification
};
