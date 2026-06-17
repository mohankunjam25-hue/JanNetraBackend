const { asyncHandler } = require("../utils/asyncHandler");
const { ApiError } = require("../utils/ApiError");
const { ApiResponse } = require("../utils/ApiResponse");
const Report = require("../models/report.model");
const Post = require("../models/post.model");
const User = require("../models/user.model");
const Comment = require("../models/comment.model");

/**
 * @description Create a report for a post, comment, or user
 */
const createReport = asyncHandler(async (req, res) => {
    const { reportedItemId, itemType, reason, description } = req.body;
    const reporterId = req.user._id;

    if (!reportedItemId || !itemType || !reason) {
        throw new ApiError(400, "Item ID, type, and reason are required");
    }

    // Validate reported item existence
    let exists = false;
    if (itemType === "Post") exists = await Post.exists({ _id: reportedItemId });
    else if (itemType === "Comment") exists = await Comment.exists({ _id: reportedItemId });
    else if (itemType === "User") exists = await User.exists({ _id: reportedItemId });

    if (!exists) {
        throw new ApiError(404, `Reported ${itemType} not found`);
    }

    const report = await Report.create({
        reporter: reporterId,
        reportedItem: reportedItemId,
        itemType,
        reason,
        description
    });

    return res.status(201).json(new ApiResponse(201, report, "Report submitted successfully. Our safety team will review it."));
});

module.exports = {
    createReport
};
