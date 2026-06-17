const { asyncHandler } = require("../utils/asyncHandler");
const { ApiError } = require("../utils/ApiError");
const { ApiResponse } = require("../utils/ApiResponse");
const Post = require("../models/post.model");
const User = require("../models/user.model");
const mongoose = require("mongoose");
const { uploadOnCloudinary, deleteFromCloudinary } = require("../utils/cloudinary");
const { createNotification } = require("../utils/notificationHelper");
const { validateRequiredFields, findAndVerifyDocument } = require("../utils/validationHelper");
const { generateBlockFilter } = require("../utils/privacyHelper");

/**
 * @description Create a new post
 */
const createPost = asyncHandler(async (req, res) => {
    const { content, type, category, state, district, block, village } = req.body;
    if (!content && (!req.files || req.files.length === 0)) {
        throw new ApiError(400, "Content or media required");
    }

    const uploadedMedia = [];
    const mediaUrls = [];
    if (req.files && req.files.length > 0) {
        for (const file of req.files) {
            const cloudinaryResponse = await uploadOnCloudinary(file.path);
            if (cloudinaryResponse) {
                uploadedMedia.push({
                    url: cloudinaryResponse.secure_url,
                    publicId: cloudinaryResponse.public_id,
                    resourceType: cloudinaryResponse.resource_type === "video" ? "video" : "image"
                });
                mediaUrls.push(cloudinaryResponse.secure_url);
            }
        }
    }

    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const postType = type || (uploadedMedia.length > 0 ? (uploadedMedia[0].resourceType === 'video' ? 'video' : 'image') : 'text');
        const post = await Post.create([{
            author: req.user._id,
            content: content || "",
            type: postType,
            category: category || "Other",
            media: uploadedMedia,
            mediaUrls: mediaUrls,
            locationTag: {
                state: state || req.user.state,
                district: district || req.user.district,
                block: block || req.user.block,
                village: village || req.user.village,
            }
        }], { session });

        await User.findByIdAndUpdate(req.user._id, { $inc: { voiceCount: 1 } }, { session });
        await session.commitTransaction();
        session.endSession();
        const populatedPost = await Post.findById(post[0]._id).populate("author", "fullName username avatar");
        return res.status(201).json(new ApiResponse(201, populatedPost, "Created"));
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        for (const m of uploadedMedia) await deleteFromCloudinary(m.publicId, m.resourceType);
        throw new ApiError(500, "Creation failed");
    }
});

const getAllPosts = asyncHandler(async (req, res) => {
    const { state, district, block, village } = req.query;

    let query = {};
    if (village) query["locationTag.village"] = village;
    else if (block) query["locationTag.block"] = block;
    else if (district) query["locationTag.district"] = district;
    else if (state) query["locationTag.state"] = state;

    // Use Reusable Privacy Filter
    const blockFilter = await generateBlockFilter(req.user);
    if (blockFilter) {
        query["author"] = blockFilter;
    }

    const posts = await Post.find(query).populate("author", "fullName username avatar").sort({ createdAt: -1 });
    return res.status(200).json(new ApiResponse(200, posts, "Fetched"));
});

/**
 * @description Toggle Appreciation (Atomic & Race-Condition Safe)
 * @route PATCH /api/v1/posts/appreciate/:postId
 */
const toggleAppreciation = asyncHandler(async (req, res) => {
    const { postId } = req.params;
    const userId = req.user._id;

    // Use Reusable Validation
    const post = await findAndVerifyDocument(Post, postId);
    const hasAppreciated = post.appreciations.includes(userId);
    
    let updatedPost;

    if (hasAppreciated) {
        updatedPost = await Post.findOneAndUpdate(
            { _id: postId, appreciations: userId },
            { $pull: { appreciations: userId }, $inc: { appreciationsCount: -1 } },
            { new: true }
        );
    } else {
        updatedPost = await Post.findOneAndUpdate(
            { _id: postId, appreciations: { $ne: userId } },
            { $addToSet: { appreciations: userId }, $inc: { appreciationsCount: 1 } },
            { new: true }
        );
    }

    const finalPost = updatedPost || await Post.findById(postId);

    if (!hasAppreciated && updatedPost) {
        await createNotification({
            recipient: post.author,
            sender: userId,
            type: "APPRECIATION",
            post: postId
        });
    }

    return res.status(200).json(new ApiResponse(200, { 
        isAppreciated: finalPost.appreciations.includes(userId), 
        appreciationsCount: finalPost.appreciationsCount 
    }, hasAppreciated ? "Appreciation removed" : "Post appreciated"));
});

/**
 * @description Increment Shares (Atomic)
 * @route PATCH /api/v1/posts/share/:postId
 */
const incrementShares = asyncHandler(async (req, res) => {
    const post = await Post.findByIdAndUpdate(
        req.params.postId,
        { $inc: { sharesCount: 1 } },
        { new: true }
    );
    if (!post) throw new ApiError(404, "Not found");

    await createNotification({
        recipient: post.author,
        sender: req.user._id,
        type: "SHARE",
        post: post._id
    });

    return res.status(200).json(new ApiResponse(200, { sharesCount: post.sharesCount }, "Shared"));
});

const deletePost = asyncHandler(async (req, res) => {
    // Use Reusable Validation (Verifies existence AND authorship)
    const post = await findAndVerifyDocument(Post, req.params.postId, req.user._id);

    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        if (post.media && post.media.length > 0) {
            for (const m of post.media) await deleteFromCloudinary(m.publicId, m.resourceType);
        }
        await Post.findByIdAndDelete(post._id).session(session);
        const Comment = require("../models/comment.model");
        await Comment.deleteMany({ post: post._id }).session(session);
        await User.findByIdAndUpdate(post.author, { $inc: { voiceCount: -1 } }, { session });
        await session.commitTransaction();
        session.endSession();
        return res.status(200).json(new ApiResponse(200, {}, "Deleted"));
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        throw new ApiError(500, "Delete failed");
    }
});

const getBuzzPosts = asyncHandler(async (req, res) => {
    let query = { type: "video" };

    // Use Reusable Privacy Filter
    const blockFilter = await generateBlockFilter(req.user);
    if (blockFilter) {
        query["author"] = blockFilter;
    }

    const posts = await Post.find(query).populate("author", "fullName username avatar").sort({ createdAt: -1 });
    return res.status(200).json(new ApiResponse(200, posts, "Fetched"));
});

const getPostById = asyncHandler(async (req, res) => {
    const post = await Post.findById(req.params.postId).populate("author", "fullName username avatar");
    if (!post) throw new ApiError(404, "Not found");
    return res.status(200).json(new ApiResponse(200, post, "Fetched"));
});

const getUserPosts = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const currentUser = req.user;

    const targetUser = await User.findById(userId);
    if (!targetUser) throw new ApiError(404, "User not found");

    if (currentUser && targetUser.blockedUsers.includes(currentUser._id)) {
        return res.status(200).json(new ApiResponse(200, [], "Access denied"));
    }

    const posts = await Post.find({ author: userId }).populate("author", "fullName username avatar").sort({ createdAt: -1 });
    return res.status(200).json(new ApiResponse(200, posts, "Fetched"));
});

const updatePost = asyncHandler(async (req, res) => {
    // Use Reusable Validation
    const post = await findAndVerifyDocument(Post, req.params.postId, req.user._id);

    const updatedPost = await Post.findByIdAndUpdate(
        post._id,
        { $set: { content: req.body.content || post.content, category: req.body.category || post.category } },
        { new: true }
    ).populate("author", "fullName username avatar");

    return res.status(200).json(new ApiResponse(200, updatedPost, "Updated"));
});

module.exports = {
    createPost,
    getAllPosts,
    getBuzzPosts,
    getPostById,
    getUserPosts,
    updatePost,
    toggleAppreciation,
    incrementShares,
    deletePost
};
