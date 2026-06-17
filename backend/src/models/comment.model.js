const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema(
    {
        content: {
            type: String,
            required: true,
            trim: true,
        },
        author: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        post: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Post",
            required: true,
        },
        parentComment: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Comment",
            default: null,
        },
        isEdited: {
            type: Boolean,
            default: false,
        },
        appreciations: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
            }
        ],
    },
    {
        timestamps: true,
    }
);

commentSchema.index({ post: 1, createdAt: -1 });
commentSchema.index({ author: 1 });

// Auto-increment commentsCount on Post after saving a comment
commentSchema.post("save", async function (doc) {
    try {
        await mongoose.model("Post").findByIdAndUpdate(doc.post, {
            $inc: { commentsCount: 1 }
        });
    } catch (error) {
        console.error("Error incrementing commentsCount:", error);
    }
});

// Auto-decrement commentsCount on Post after deleting a comment
// Note: This hook triggers on findByIdAndDelete and findOneAndDelete
commentSchema.post("findOneAndDelete", async function (doc) {
    if (doc) {
        try {
            await mongoose.model("Post").findByIdAndUpdate(doc.post, {
                $inc: { commentsCount: -1 }
            });
        } catch (error) {
            console.error("Error decrementing commentsCount:", error);
        }
    }
});

module.exports = mongoose.model("Comment", commentSchema);
