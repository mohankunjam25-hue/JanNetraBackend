const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const userSchema = new mongoose.Schema(
    {
        username: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            minlength: [6, "Username must be at least 6 characters"],
            maxlength: [15, "Username cannot exceed 15 characters"],
            index: true,
        },
        email: {
            type: String,
            required: true,
            lowercase: true,
            trim: true,
        },
        fullName: {
            type: String,
            required: true,
            trim: true,
            index: true,
        },
        mobile: {
            type: String,
            required: function() { return this.authProvider === 'local'; },
            trim: true,
        },
        password: {
            type: String,
            required: function() { return this.authProvider === 'local'; },
        },
        authProvider: {
            type: String,
            enum: ['local', 'google'],
            default: 'local'
        },
        googleId: {
            type: String,
            sparse: true
        },
        isTwoFactorEnabled: {
            type: Boolean,
            default: false,
        },
        twoFactorSecret: {
            type: String,
        },
        forgotPasswordOTPHash: {
            type: String,
        },
        forgotPasswordOTPExpiry: {
            type: Date,
        },
        failedLoginAttempts: {
            type: Number,
            default: 0,
        },
        lockUntil: {
            type: Date,
        },
        state: {
            type: String,
            required: function() { return this.authProvider === 'local'; },
        },
        district: {
            type: String,
            required: function() { return this.authProvider === 'local'; },
        },
        block: {
            type: String,
            required: function() { return this.authProvider === 'local'; },
        },
        village: {
            type: String,
        },
        avatar: {
            type: String,
            default: "",
        },
        coverImage: {
            type: String,
            default: "",
        },
        bio: {
            type: String,
            maxlength: 250,
            default: "",
        },
        voiceCount: {
            type: Number,
            default: 0,
        },
        championsCount: {
            type: Number,
            default: 0,
        },
        alliesCount: {
            type: Number,
            default: 0,
        },
        followers: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User"
            }
        ],
        following: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User"
            }
        ],
        blockedUsers: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User"
            }
        ],
        fcmTokens: [
            {
                type: String
            }
        ],
        contributionScore: {
            type: Number,
            default: 0,
        },
        reputationScore: {
            type: Number,
            default: 0,
        },
        isVerified: {
            type: Boolean,
            default: false,
        },
        isEmailVerified: {
            type: Boolean,
            default: false,
        },
        emailVerificationToken: {
            type: String,
        },
        emailVerificationExpiry: {
            type: Date,
        },
        interests: [
            {
                type: String,
            }
        ],
        category: {
            type: String,
            enum: ["Citizen", "Student", "Professional", "Social Worker", "Politician", "Business Owner", "Other"],
            default: "Citizen"
        },
        career: [
            {
                type: String,
            }
        ],
        socialLinks: {
            x: { type: String, default: "" },
            facebook: { type: String, default: "" },
            instagram: { type: String, default: "" },
            linkedin: { type: String, default: "" },
            website: { type: String, default: "" },
        },
        settings: {
            privacy: {
                isProfilePublic: { type: Boolean, default: true },
                showLocation: { type: Boolean, default: true },
            },
            notifications: {
                emailAlerts: { type: Boolean, default: true },
                pushNotifications: { type: Boolean, default: true },
                appreciations: { type: Boolean, default: true },
                comments: { type: Boolean, default: true },
                replies: { type: Boolean, default: true },
                mentions: { type: Boolean, default: true },
                shares: { type: Boolean, default: true },
                allyActivity: { type: Boolean, default: true },
            },
            preferences: {
                language: { type: String, default: "en" },
                theme: { type: String, enum: ["light", "dark", "system"], default: "system" },
            }
        },
        savedContent: {
            posts: [{ type: mongoose.Schema.Types.ObjectId, ref: "Post" }],
            schemes: [{ type: mongoose.Schema.Types.ObjectId, ref: "Scheme" }],
            villages: [{ type: String }],
            leaders: [{ type: mongoose.Schema.Types.ObjectId, ref: "Leader" }]
        },
        refreshToken: {
            type: String,
        }
    },
    {
        timestamps: true,
    }
);
// Hash password before saving
userSchema.pre("save", async function () {
    if (!this.isModified("password")) return;

    this.password = await bcrypt.hash(this.password, 10);
});

// Method to compare password
userSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password, this.password);
};

// Method to generate Access Token
userSchema.methods.generateAccessToken = function () {
    return jwt.sign(
        {
            _id: this._id,
            username: this.username,
            fullName: this.fullName,
        },
        process.env.ACCESS_TOKEN_SECRET || "access_token_secret",
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY || "1d",
        }
    );
};

// Method to generate Refresh Token
userSchema.methods.generateRefreshToken = function () {
    return jwt.sign(
        {
            _id: this._id,
        },
        process.env.REFRESH_TOKEN_SECRET || "refresh_token_secret",
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY || "10d",
        }
    );
};

// Virtual field for joinedDate (based on createdAt)
userSchema.virtual('joinedDate').get(function() {
    return this.createdAt;
});

// Virtual field for name (mapping fullName)
userSchema.virtual('name').get(function() {
    return this.fullName;
});

// Ensure virtuals are serialized
userSchema.set('toJSON', { virtuals: true });
userSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model("User", userSchema);
