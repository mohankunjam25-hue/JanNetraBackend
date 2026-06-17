const { asyncHandler } = require("../utils/asyncHandler");
const { ApiError } = require("../utils/ApiError");
const { ApiResponse } = require("../utils/ApiResponse");
const Comment = require("../models/comment.model");
const Post = require("../models/post.model");
const mongoose = require("mongoose");
const { auditAndRepairAllPosts, cleanupOrphanedComments } = require("../utils/commentAuditor");
const { createNotification } = require("../utils/notificationHelper");
const { validateRequiredFields, findAndVerifyDocument, validateObjectId } = require("../utils/validationHelper");
const { generateBlockFilter } = require("../utils/privacyHelper");

/**
 * @description Add a comment to a post with Transaction Safety
 */
const addComment = asyncHandler(async (req, res) => {
    const { postId } = req.params;
    const { content, parentCommentId } = req.body;

    validateRequiredFields(req.body, ['content']);
    validateObjectId(postId, "Invalid Post ID");

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const post = await Post.findById(postId).session(session);
        if (!post) throw new ApiError(404, "Post not found");

        let parentComment = null;
        if (parentCommentId) {
            validateObjectId(parentCommentId, "Invalid Parent Comment ID");
            parentComment = await Comment.findById(parentCommentId).session(session);
            if (!parentComment) throw new ApiError(404, "Parent comment not found");
        }

        const commentArray = await Comment.create([{
            content,
            author: req.user._id,
            post: postId,
            parentComment: parentCommentId || null
        }], { session });

        const comment = commentArray[0];

        // 1. Notify Post Author (If it's a new top-level comment)
        if (!parentCommentId) {
            await createNotification({
                recipient: post.author,
                sender: req.user._id,
                type: "COMMENT",
                post: postId,
                comment: comment._id
            });
        } 
        // 2. Notify Parent Comment Author (If it's a reply)
        else {
            await createNotification({
                recipient: parentComment.author,
                sender: req.user._id,
                type: "REPLY",
                post: postId,
                comment: comment._id
            });
        }

        // 3. Handle Mentions (@username)
        const mentions = content.match(/@(\w+)/g);
        if (mentions) {
            const User = require("../models/user.model");
            for (const mention of mentions) {
                const username = mention.substring(1);
                const mentionedUser = await User.findOne({ username }).session(session);
                if (mentionedUser) {
                    await createNotification({
                        recipient: mentionedUser._id,
                        sender: req.user._id,
                        type: "MENTION",
                        post: postId,
                        comment: comment._id
                    });
                }
            }
        }

        await session.commitTransaction();
        session.endSession();

        const populatedComment = await Comment.findById(comment._id).populate("author", "fullName username avatar");
        return res.status(201).json(new ApiResponse(201, populatedComment, "Comment added successfully"));
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        throw new ApiError(error.statusCode || 500, error.message || "Failed to add comment");
    }
});

/**
 * @description Update a comment's content
 * @route PATCH /api/v1/comments/c/:commentId
 */
const updateComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params;
    const { content } = req.body;

    validateRequiredFields(req.body, ['content']);
    
    // Use Reusable Validation
    const comment = await findAndVerifyDocument(Comment, commentId, req.user._id);

    const updatedComment = await Comment.findByIdAndUpdate(
        comment._id,
        { $set: { content, isEdited: true } },
        { new: true }
    ).populate("author", "fullName username avatar");

    return res.status(200).json(new ApiResponse(200, updatedComment, "Comment updated successfully"));
});

/**
 * @description Get all comments for a post
 * @route GET /api/v1/comments/:postId
 */
const getPostComments = asyncHandler(async (req, res) => {
    const { postId } = req.params;

    validateObjectId(postId, "Invalid Post ID");

    let query = { post: postId };

    // Use Reusable Privacy Filter
    const blockFilter = await generateBlockFilter(req.user);
    if (blockFilter) {
        query["author"] = blockFilter;
    }

    const comments = await Comment.find(query)
        .populate("author", "fullName username avatar")
        .sort({ createdAt: -1 });

    return res
        .status(200)
        .json(new ApiResponse(200, comments, "Comments fetched successfully"));
});

/**
 * @description Delete a comment and its nested replies with Transaction Safety
 * @route DELETE /api/v1/comments/c/:commentId
 */
const deleteComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params;

    // Use Reusable Validation (Verifies existence AND authorship)
    const comment = await findAndVerifyDocument(Comment, commentId, req.user._id);

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        // We re-fetch within the session for the transaction
        const sessionComment = await Comment.findById(commentId).session(session);

        // Recursive function to delete nested comments
        // Each findByIdAndDelete will trigger the model's auto-decrement hook
        const deleteNestedComments = async (parentId) => {
            const replies = await Comment.find({ parentComment: parentId }).session(session);
            for (const reply of replies) {
                await deleteNestedComments(reply._id);
                await Comment.findByIdAndDelete(reply._id).session(session);
            }
        };

        // First delete all children recursively
        await deleteNestedComments(commentId);

        // Finally delete the parent comment
        await Comment.findByIdAndDelete(commentId).session(session);

        await session.commitTransaction();
        session.endSession();

        return res
            .status(200)
            .json(new ApiResponse(200, {}, "Comment and its replies deleted successfully"));

    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        throw new ApiError(error.statusCode || 500, error.message || "Failed to delete comment");
    }
});

/**
 * @description Data Consistency Utility: Repair commentsCount for a post
 * @route POST /api/v1/comments/repair/:postId
 */
const repairCommentsCount = asyncHandler(async (req, res) => {
    const { postId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(postId)) {
        throw new ApiError(400, "Invalid Post ID");
    }

    const actualCount = await Comment.countDocuments({ post: postId });

    const updatedPost = await Post.findByIdAndUpdate(
        postId,
        { $set: { commentsCount: actualCount } },
        { new: true }
    );

    if (!updatedPost) {
        throw new ApiError(404, "Post not found");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, { actualCount, post: updatedPost }, "Comments count repaired successfully"));
});

/**
 * @description Global Data Consistency Audit: Repair all posts and cleanup orphaned comments
 * @route POST /api/v1/comments/audit/global
 */
const auditAllComments = asyncHandler(async (req, res) => {
    const repairResult = await auditAndRepairAllPosts();
    const cleanupResult = await cleanupOrphanedComments();

    return res
        .status(200)
        .json(new ApiResponse(200, { 
            postsAudited: repairResult.total, 
            postsRepaired: repairResult.fixed, 
            orphanedCommentsRemoved: cleanupResult 
        }, "Global comment audit and repair completed successfully"));
});

module.exports = {
    addComment,
    updateComment,
    getPostComments,
    deleteComment,
    repairCommentsCount,
    auditAllComments
};
