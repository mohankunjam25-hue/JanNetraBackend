const mongoose = require("mongoose");

const allySchema = new mongoose.Schema(
    {
        follower: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        following: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

// Indexes for fast lookups
allySchema.index({ follower: 1, following: 1 }, { unique: true });
allySchema.index({ following: 1 });

module.exports = mongoose.model("Ally", allySchema);
