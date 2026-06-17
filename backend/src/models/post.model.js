const mongoose = require("mongoose");

const postSchema = new mongoose.Schema(
    {
        author: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        content: {
            type: String,
            required: true,
            trim: true,
        },
        media: [
            {
                url: { type: String, required: true },
                publicId: { type: String, required: true },
                resourceType: { type: String, enum: ["image", "video"], default: "image" }
            }
        ],
        mediaUrls: [String], // Array of URLs for fast frontend access
        type: {
            type: String,
            enum: ["text", "image", "video"],
            default: "text",
        },
        category: {
            type: String,
            enum: [
                "Local News",
                "Development",
                "Public Awareness",
                "Government Schemes",
                "Education",
                "Employment",
                "Events",
                "Other"
            ],
            default: "Other",
        },
        locationTag: {
            state: { type: String, required: true },
            district: { type: String, required: true },
            block: { type: String, required: true },
            village: { type: String },
        },
        appreciations: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
            }
        ],
        appreciationsCount: {
            type: Number,
            default: 0,
        },
        commentsCount: {
            type: Number,
            default: 0,
        },
        sharesCount: {
            type: Number,
            default: 0,
        },
    },
    {
        timestamps: true,
    }
);

// Indexing for faster hierarchical feed fetching
postSchema.index({ "locationTag.state": 1, "locationTag.district": 1 });
postSchema.index({ type: 1 });
postSchema.index({ author: 1, createdAt: -1 });

module.exports = mongoose.model("Post", postSchema);
