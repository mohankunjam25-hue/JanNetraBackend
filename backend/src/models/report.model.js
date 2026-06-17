const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema(
    {
        reporter: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true
        },
        reportedItem: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            index: true
        },
        itemType: {
            type: String,
            enum: ["Post", "Comment", "User", "Message"],
            required: true
        },
        reason: {
            type: String,
            required: true,
            trim: true
        },
        description: {
            type: String,
            trim: true
        },
        status: {
            type: String,
            enum: ["pending", "reviewed", "resolved", "dismissed"],
            default: "pending"
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Report", reportSchema);
