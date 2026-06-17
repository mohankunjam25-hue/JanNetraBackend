const mongoose = require("mongoose");
const Post = require("../models/post.model");
const Comment = require("../models/comment.model");

/**
 * @description Audits all posts and repairs their commentsCount to match actual comment documents.
 * Optimized using aggregation to handle large datasets efficiently.
 * @returns {Promise<{fixed: number, total: number}>}
 */
const auditAndRepairAllPosts = async () => {
    // 1. Get actual counts from Comment collection using aggregation
    const counts = await Comment.aggregate([
        {
            $group: {
                _id: "$post",
                actualCount: { $sum: 1 }
            }
        }
    ]);

    const countMap = new Map(counts.map(c => [c._id.toString(), c.actualCount]));

    // 2. Get all posts to check against
    const posts = await Post.find({});
    let fixedCount = 0;

    for (const post of posts) {
        const expectedCount = countMap.get(post._id.toString()) || 0;
        if (post.commentsCount !== expectedCount) {
            console.log(`[REPAIR] Post ${post._id}: Updated commentsCount from ${post.commentsCount} to ${expectedCount}`);
            
            // Using updateOne to bypass any middleware and ensure direct update
            await Post.updateOne(
                { _id: post._id },
                { $set: { commentsCount: expectedCount } }
            );
            fixedCount++;
        }
    }

    return {
        fixed: fixedCount,
        total: posts.length
    };
};

/**
 * @description Finds and removes orphaned comments (comments whose post no longer exists).
 * Optimized using $lookup and $match.
 * @returns {Promise<number>} Number of removed comments
 */
const cleanupOrphanedComments = async () => {
    // Find comments where the referenced post doesn't exist
    const orphanedComments = await Comment.aggregate([
        {
            $lookup: {
                from: "posts",
                localField: "post",
                foreignField: "_id",
                as: "post_info"
            }
        },
        {
            $match: {
                post_info: { $size: 0 }
            }
        },
        {
            $project: {
                _id: 1
            }
        }
    ]);

    if (orphanedComments.length === 0) return 0;

    const idsToRemove = orphanedComments.map(c => c._id);
    const result = await Comment.deleteMany({ _id: { $in: idsToRemove } });
    
    console.log(`[CLEANUP] Removed ${result.deletedCount} orphaned comments.`);
    return result.deletedCount;
};

module.exports = {
    auditAndRepairAllPosts,
    cleanupOrphanedComments
};
