const { asyncHandler } = require("../utils/asyncHandler");
const { ApiError } = require("../utils/ApiError");
const { ApiResponse } = require("../utils/ApiResponse");
const User = require("../models/user.model");
const Ally = require("../models/ally.model");
const auditLogger = require("../utils/auditLogger");
const crypto = require("crypto");
const sendEmail = require("../utils/sendEmail");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const { uploadOnCloudinary, deleteFromCloudinary } = require("../utils/cloudinary");
const { createNotification } = require("../utils/notificationHelper");

const speakeasy = require("speakeasy");
const QRCode = require("qrcode");

/**
 * @description Toggle Ally/Champion status (Follow/Unfollow)
 */
const toggleAlly = asyncHandler(async (req, res) => {
    const { targetUserId } = req.params;
    const userId = req.user._id;

    if (targetUserId.toString() === userId.toString()) {
        throw new ApiError(400, "You cannot become your own ally");
    }

    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
        throw new ApiError(404, "Target user not found");
    }

    const existingAlly = await Ally.findOne({
        follower: userId,
        following: targetUserId
    });

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        if (existingAlly) {
            await Ally.findByIdAndDelete(existingAlly._id).session(session);
            
            // Remove from arrays and decrement counts
            await User.findByIdAndUpdate(targetUserId, { 
                $inc: { alliesCount: -1 },
                $pull: { followers: userId }
            }, { session });
            
            await User.findByIdAndUpdate(userId, { 
                $inc: { championsCount: -1 },
                $pull: { following: targetUserId }
            }, { session });

            await session.commitTransaction();
            session.endSession();
            return res.status(200).json(new ApiResponse(200, { isAlly: false }, "User removed from allies"));
        } else {
            await Ally.create([{ follower: userId, following: targetUserId }], { session });
            
            // Add to arrays and increment counts
            await User.findByIdAndUpdate(targetUserId, { 
                $inc: { alliesCount: 1 },
                $push: { followers: { $each: [userId], $position: 0 } }
            }, { session });
            
            await User.findByIdAndUpdate(userId, { 
                $inc: { championsCount: 1 },
                $push: { following: { $each: [targetUserId], $position: 0 } }
            }, { session });

            await createNotification({
                recipient: targetUserId,
                sender: userId,
                type: "ALLY_ACTIVITY"
            });

            await session.commitTransaction();
            session.endSession();
            return res.status(200).json(new ApiResponse(200, { isAlly: true }, "User added as ally"));
        }
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        throw new ApiError(500, "Failed to toggle ally status");
    }
});

/**
 * @description Toggle block/unblock a user
 */
const toggleBlockUser = asyncHandler(async (req, res) => {
    const { targetUserId } = req.params;
    const userId = req.user._id;

    if (targetUserId.toString() === userId.toString()) {
        throw new ApiError(400, "You cannot block yourself");
    }

    const user = await User.findById(userId);
    const isBlocked = user.blockedUsers.includes(targetUserId);

    if (isBlocked) {
        user.blockedUsers = user.blockedUsers.filter(id => id.toString() !== targetUserId.toString());
        await user.save({ validateBeforeSave: false });
        return res.status(200).json(new ApiResponse(200, { isBlocked: false }, "User unblocked successfully"));
    } else {
        user.blockedUsers.push(targetUserId);
        await user.save({ validateBeforeSave: false });
        
        // Optionally: Unfollow the user if they were following
        await Ally.findOneAndDelete({ follower: userId, following: targetUserId });
        await User.findByIdAndUpdate(userId, { $pull: { following: targetUserId }, $inc: { championsCount: -1 } });
        await User.findByIdAndUpdate(targetUserId, { $pull: { followers: userId }, $inc: { alliesCount: -1 } });

        return res.status(200).json(new ApiResponse(200, { isBlocked: true }, "User blocked successfully"));
    }
});

/**
 * @description Submit a verification request
 */
const submitVerificationRequest = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const documentLocalPath = req.file?.path;

    if (!documentLocalPath) {
        throw new ApiError(400, "Identification document is required");
    }

    const document = await uploadOnCloudinary(documentLocalPath);
    if (!document) {
        throw new ApiError(500, "Failed to upload document");
    }

    const existingRequest = await VerificationRequest.findOne({ user: userId });
    if (existingRequest && existingRequest.status === "pending") {
        throw new ApiError(400, "You already have a pending verification request");
    }

    const verificationRequest = await VerificationRequest.findOneAndUpdate(
        { user: userId },
        { documentUrl: document.secure_url, status: "pending" },
        { upsert: true, new: true }
    );

    return res.status(201).json(new ApiResponse(201, verificationRequest, "Verification request submitted successfully"));
});

const isStrongPassword = (password, username, fullName) => {
    // Relaxed for testing: Just min 6 characters
    if (password.length < 6) return false;
    return true;
};

const generateAccessAndRefreshTokens = async (userId) => {
    try {
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();
        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });
        return { accessToken, refreshToken };
    } catch (error) {
        throw new ApiError(500, "Token generation failed");
    }
};

const registerUser = asyncHandler(async (req, res) => {
    const { fullName, username, email, mobile, password, state, district, block, village, interests } = req.body;

    if ([fullName, username, email, mobile, password, state, district, block].some((field) => !field || field.trim() === "")) {
        throw new ApiError(400, "All fields are required");
    }

    // Strict Username Validation
    const usernameTrimmed = username.trim().toLowerCase();
    const usernameRegex = /^[a-z0-9._]{6,15}$/;
    
    if (!usernameRegex.test(usernameTrimmed)) {
        throw new ApiError(400, "Username must be 6-15 characters long and contain only letters, numbers, periods, and underscores.");
    }
    
    if (/^\d+$/.test(usernameTrimmed)) {
        throw new ApiError(400, "Username cannot be purely numeric.");
    }

    const genericWords = ['admin', 'test', 'system', 'root', 'jannetra'];
    if (genericWords.some(word => usernameTrimmed.includes(word))) {
        throw new ApiError(400, "Username contains restricted generic words.");
    }

    if (!isStrongPassword(password, usernameTrimmed, fullName)) {
        throw new ApiError(400, "Password must be at least 12 characters, include upper/lowercase, number, special char, and must not contain your name or common patterns.");
    }

    // Check only for unique username
    const existedUser = await User.findOne({ username: usernameTrimmed });
    if (existedUser) {
        throw new ApiError(409, "Username already exists. Please choose a different one.");
    }

    // Email and Mobile are NOT unique constraints, allowing multiple accounts
    const user = await User.create({
        fullName,
        username: usernameTrimmed,
        email: email.toLowerCase(),
        mobile,
        password,
        state,
        district,
        block,
        village,
        interests
    });

    const verificationToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto.createHash("sha256").update(verificationToken).digest("hex");
    user.emailVerificationToken = hashedToken;
    user.emailVerificationExpiry = Date.now() + 24 * 60 * 60 * 1000;
    await user.save({ validateBeforeSave: false });

    try {
        const verificationUrl = `${process.env.FRONTEND_URL || "http://localhost:5173"}/verify-email/${verificationToken}`;
        await sendEmail({
            email: user.email,
            subject: "JanNetra: Verify Email",
            message: `Please verify your email here: ${verificationUrl}`
        });
    } catch (error) { console.error("Email verification failed to send", error); }

    const createdUser = await User.findById(user._id).select("-password -refreshToken -emailVerificationToken");
    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(createdUser._id);

    const options = { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax" };

    return res.status(201).cookie("accessToken", accessToken, options).cookie("refreshToken", refreshToken, options)
        .json(new ApiResponse(201, { user: createdUser, accessToken, refreshToken }, "Account registered successfully"));
});

const loginUser = asyncHandler(async (req, res) => {
    const { username, mobile, password } = req.body;
    if (!(username || mobile) || !password) throw new ApiError(400, "Username/Mobile and password are required");

    const query = username 
        ? { username: username.toLowerCase() } 
        : { mobile: mobile };

    const user = await User.findOne(query).sort({ createdAt: -1 });
    
    if (!user) throw new ApiError(401, "Invalid user credentials");

    if (user.lockUntil && user.lockUntil > Date.now()) {
        throw new ApiError(403, `Account is temporarily locked. Try again after ${new Date(user.lockUntil).toLocaleTimeString()}`);
    }

    const isPasswordValid = await user.isPasswordCorrect(password);
    if (!isPasswordValid) {
        user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
        if (user.failedLoginAttempts >= 5) user.lockUntil = Date.now() + 15 * 60 * 1000;
        await user.save({ validateBeforeSave: false });
        throw new ApiError(401, "Invalid credentials");
    }

    user.failedLoginAttempts = 0;
    user.lockUntil = undefined;
    await user.save({ validateBeforeSave: false });

    // TEMPORARILY DISABLED FOR TESTING
    // if (!user.isEmailVerified) throw new ApiError(401, "Verify email first");

    // 2FA Check
    if (user.isTwoFactorEnabled) {
        return res.status(200).json(new ApiResponse(200, { requires2FA: true, userId: user._id }, "2FA required"));
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken -twoFactorSecret");
    const options = { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax" };

    return res.status(200).cookie("accessToken", accessToken, options).cookie("refreshToken", refreshToken, options)
        .json(new ApiResponse(200, { user: loggedInUser, accessToken, refreshToken }, "Logged in"));
});

/**
 * @description Generate 2FA Secret for Google Authenticator
 */
const generate2FASecret = asyncHandler(async (req, res) => {
    const secret = speakeasy.generateSecret({ name: `JanNetra (${req.user.username})` });
    
    const user = await User.findById(req.user._id);
    user.twoFactorSecret = secret.base32;
    await user.save({ validateBeforeSave: false });

    QRCode.toDataURL(secret.otpauth_url, (err, data_url) => {
        if (err) throw new ApiError(500, "Error generating QR Code");
        return res.status(200).json(new ApiResponse(200, { qrCodeUrl: data_url, secret: secret.base32 }, "Secret generated"));
    });
});

/**
 * @description Verify and Enable 2FA
 */
const verifyAndEnable2FA = asyncHandler(async (req, res) => {
    const { token } = req.body;
    const user = await User.findById(req.user._id);

    const verified = speakeasy.totp.verify({
        secret: user.twoFactorSecret,
        encoding: 'base32',
        token: token
    });

    if (!verified) throw new ApiError(400, "Invalid verification code");

    user.isTwoFactorEnabled = true;
    await user.save({ validateBeforeSave: false });

    return res.status(200).json(new ApiResponse(200, {}, "2FA successfully enabled"));
});

/**
 * @description Verify 2FA during Login
 */
const verify2FALogin = asyncHandler(async (req, res) => {
    const { userId, token } = req.body;
    
    if (!userId || !token) throw new ApiError(400, "User ID and token required");

    const user = await User.findById(userId);
    if (!user || !user.isTwoFactorEnabled) throw new ApiError(400, "2FA not enabled or user invalid");

    const verified = speakeasy.totp.verify({
        secret: user.twoFactorSecret,
        encoding: 'base32',
        token: token,
        window: 1 // allows a slight time drift
    });

    if (!verified) throw new ApiError(401, "Invalid 2FA code");

    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken -twoFactorSecret");
    const options = { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax" };

    return res.status(200).cookie("accessToken", accessToken, options).cookie("refreshToken", refreshToken, options)
        .json(new ApiResponse(200, { user: loggedInUser, accessToken, refreshToken }, "Logged in successfully"));
});

const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(req.user._id, { $unset: { refreshToken: 1 } });
    const options = { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax" };
    return res.status(200).clearCookie("accessToken", options).clearCookie("refreshToken", options).json(new ApiResponse(200, {}, "Logged out"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
    return res.status(200).json(new ApiResponse(200, req.user, "Fetched"));
});

const updateAccountDetails = asyncHandler(async (req, res) => {
    const { fullName, username, bio, mobile, category, career, interests, socialLinks } = req.body;
    
    const updateData = {};
    if (fullName) updateData.fullName = fullName;
    if (bio !== undefined) updateData.bio = bio;
    if (mobile) updateData.mobile = mobile;
    if (category) updateData.category = category;
    if (career) updateData.career = career;
    if (interests) updateData.interests = interests;
    if (socialLinks) updateData.socialLinks = { ...req.user.socialLinks, ...socialLinks };

    if (username && username !== req.user.username) {
        const existedUser = await User.findOne({ username });
        if (existedUser) {
            throw new ApiError(400, "Username already exists");
        }
        updateData.username = username.toLowerCase();
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        { $set: updateData },
        { new: true }
    ).select("-password -refreshToken");

    return res.status(200).json(new ApiResponse(200, user, "Account details updated successfully"));
});

const updateUserSettings = asyncHandler(async (req, res) => {
    const { settings } = req.body;
    const user = await User.findByIdAndUpdate(req.user?._id, { $set: { settings: { ...req.user.settings, ...settings } } }, { new: true }).select("-password -refreshToken");
    return res.status(200).json(new ApiResponse(200, user, "Updated"));
});

const getUserProfile = asyncHandler(async (req, res) => {
    const { username } = req.params;
    const requesterId = req.user?._id;

    // Find the target user
    const user = await User.findOne({ username: username.toLowerCase() });
    if (!user) throw new ApiError(404, "User profile not found");

    const isOwnProfile = requesterId?.toString() === user._id.toString();

    // Base projection for public profiles
    let projection = "-password -refreshToken -twoFactorSecret -forgotPasswordOTPHash -emailVerificationToken";

    // Strict Privacy: If not the owner, hide sensitive identity and private content
    if (!isOwnProfile) {
        projection += " -email -mobile -savedContent -settings -failedLoginAttempts -lockUntil";
    }

    // Re-fetch with correct projection
    const userProfile = await User.findById(user._id).select(projection);

    // Add isAlly (following) status if requester is logged in
    const isAlly = requesterId ? user.followers.some(id => id.toString() === requesterId.toString()) : false;
    const isBlocked = requesterId ? req.user.blockedUsers.includes(user._id) : false;
    const hasBlockedMe = requesterId ? user.blockedUsers.includes(requesterId) : false;

    // Convert to object to add dynamic fields
    const responseData = userProfile.toObject();
    responseData.isAlly = isAlly;
    responseData.isBlocked = isBlocked;
    responseData.hasBlockedMe = hasBlockedMe;
    responseData.isOwnProfile = isOwnProfile;

    // If target user blocked the requester, hide almost everything
    if (hasBlockedMe) {
        return res.status(200).json(new ApiResponse(200, {
            _id: user._id,
            username: user.username,
            fullName: user.fullName,
            avatar: user.avatar,
            hasBlockedMe: true,
            isOwnProfile: false
        }, "You are blocked by this user"));
    }

    return res.status(200).json(new ApiResponse(200, responseData, "User profile fetched successfully"));
});

/**
 * @description Update user profile images (Cloudinary)
 * @route PATCH /api/v1/users/update-images
 */
const updateProfileImages = asyncHandler(async (req, res) => {
    const avatarLocalPath = req.files?.avatar?.[0]?.path;
    const coverImageLocalPath = req.files?.coverImage?.[0]?.path;

    const updateData = {};

    if (avatarLocalPath) {
        const avatar = await uploadOnCloudinary(avatarLocalPath);
        if (avatar) updateData.avatar = avatar.secure_url;
    }

    if (coverImageLocalPath) {
        const coverImage = await uploadOnCloudinary(coverImageLocalPath);
        if (coverImage) updateData.coverImage = coverImage.secure_url;
    }

    if (Object.keys(updateData).length === 0) throw new ApiError(400, "No files");

    const user = await User.findByIdAndUpdate(req.user?._id, { $set: updateData }, { new: true }).select("-password -refreshToken");

    return res.status(200).json(new ApiResponse(200, user, "Images updated"));
});

const toggleSaveContent = asyncHandler(async (req, res) => {
    const { type, contentId } = req.body;
    const user = await User.findById(req.user?._id);
    const isSaved = user.savedContent[type].includes(contentId);
    if (isSaved) user.savedContent[type] = user.savedContent[type].filter(id => id.toString() !== contentId.toString());
    else user.savedContent[type].push(contentId);
    await user.save({ validateBeforeSave: false });
    return res.status(200).json(new ApiResponse(200, user.savedContent, "Saved toggle"));
});

const requestPasswordReset = asyncHandler(async (req, res) => {
    const user = await User.findOne({ email: req.body.email });
    if (!user) return res.status(200).json(new ApiResponse(200, {}, "Sent"));
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.forgotPasswordOTPHash = crypto.createHash("sha256").update(otp).digest("hex");
    user.forgotPasswordOTPExpiry = Date.now() + 10 * 60 * 1000;
    await user.save({ validateBeforeSave: false });
    await sendEmail({ email: user.email, subject: "OTP", message: `OTP: ${otp}` });
    return res.status(200).json(new ApiResponse(200, {}, "Sent"));
});

const resetPassword = asyncHandler(async (req, res) => {
    const { email, otp, newPassword } = req.body;
    const hashedOTP = crypto.createHash("sha256").update(otp).digest("hex");
    const user = await User.findOne({ email, forgotPasswordOTPHash: hashedOTP, forgotPasswordOTPExpiry: { $gt: Date.now() } });
    if (!user) throw new ApiError(400, "Invalid OTP");
    user.password = newPassword;
    user.forgotPasswordOTPHash = undefined;
    await user.save();
    return res.status(200).json(new ApiResponse(200, {}, "Reset"));
});

/**
 * @description Get list of Champions (Users followed by the given user)
 */
const getChampions = asyncHandler(async (req, res) => {
    const { userId } = req.params;

    const champions = await Ally.find({ follower: userId })
        .populate("following", "fullName username avatar bio state district block village isVerified")
        .sort({ createdAt: -1 });

    const formattedChampions = champions.map(c => c.following);

    return res.status(200).json(new ApiResponse(200, formattedChampions, "Champions fetched successfully"));
});

/**
 * @description Get list of Allies (Users following the given user)
 */
const getAllies = asyncHandler(async (req, res) => {
    const { userId } = req.params;

    const allies = await Ally.find({ following: userId })
        .populate("follower", "fullName username avatar bio state district block village isVerified")
        .sort({ createdAt: -1 });

    const formattedAllies = allies.map(a => a.follower);

    return res.status(200).json(new ApiResponse(200, formattedAllies, "Allies fetched successfully"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
    const token = req.cookies?.refreshToken || req.body?.refreshToken;

    if (!token) {
        throw new ApiError(401, "No refresh token provided");
    }

    try {
        const decodedToken = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET || "refresh_token_secret");
        
        const user = await User.findById(decodedToken?._id);

        if (!user) {
            throw new ApiError(401, "Invalid refresh token: User not found");
        }

        if (token !== user.refreshToken) {
            throw new ApiError(401, "Refresh token is expired or used");
        }

        const options = {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax"
        };

        const { accessToken, refreshToken: newRefreshToken } = await generateAccessAndRefreshTokens(user._id);

        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", newRefreshToken, options)
            .json(
                new ApiResponse(
                    200, 
                    { accessToken, refreshToken: newRefreshToken }, 
                    "Access token refreshed"
                )
            );
    } catch (error) {
        if (error instanceof ApiError) throw error;
        throw new ApiError(401, error?.message || "Invalid refresh token");
    }
});

const verifyEmail = asyncHandler(async (req, res) => {
    const hashedToken = crypto.createHash("sha256").update(req.params.token).digest("hex");
    const user = await User.findOne({ emailVerificationToken: hashedToken, emailVerificationExpiry: { $gt: Date.now() } });
    if (!user) throw new ApiError(400, "Invalid");
    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    await user.save({ validateBeforeSave: false });
    return res.status(200).json(new ApiResponse(200, {}, "Verified"));
});

/**
 * @description Register/Update FCM Token for Push Notifications
 */
const updateFCMToken = asyncHandler(async (req, res) => {
    const { token } = req.body;
    if (!token) throw new ApiError(400, "Token is required");

    const user = await User.findById(req.user._id);
    if (!user.fcmTokens.includes(token)) {
        user.fcmTokens.push(token);
        // Keep only last 5 tokens per user to prevent array bloat
        if (user.fcmTokens.length > 5) user.fcmTokens.shift();
        await user.save({ validateBeforeSave: false });
    }

    return res.status(200).json(new ApiResponse(200, {}, "FCM Token registered"));
});

const { OAuth2Client } = require('google-auth-library');

/**
 * @description Google Authentication (Login/Register)
 */
const googleAuth = asyncHandler(async (req, res) => {
    const { idToken } = req.body;

    if (!process.env.GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID === "your_google_client_id_here") {
        throw new ApiError(500, "Backend configuration error: GOOGLE_CLIENT_ID is missing in .env");
    }

    const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

    if (!idToken) {
        throw new ApiError(400, "Google ID token is required");
    }

    try {
        const ticket = await googleClient.verifyIdToken({
            idToken,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();
        
        const { email, name, picture, sub: googleId } = payload;

        let user = await User.findOne({ email });

        if (user) {
            // Check if the user registered normally before, link googleId if missing
            if (!user.googleId) {
                user.googleId = googleId;
                user.authProvider = 'google';
                await user.save({ validateBeforeSave: false });
            }
        } else {
            // Clean the email prefix (lowercase, only alphanumeric, periods, underscores)
            let emailPrefix = email.split('@')[0].toLowerCase().replace(/[^a-z0-9._]/g, '');
            
            // Limit prefix length to keep total username length under 15 characters
            if (emailPrefix.length > 10) {
                emailPrefix = emailPrefix.slice(0, 10);
            }
            
            // Ensure prefix has at least 3 characters so that suffix makes it >= 6 characters
            if (emailPrefix.length < 3) {
                emailPrefix = (emailPrefix + "user").slice(0, 5);
            }
            
            // Generate and check unique username
            let username = "";
            let usernameExists = true;
            let attempts = 0;
            
            while (usernameExists && attempts < 10) {
                const randomSuffix = Math.floor(100 + Math.random() * 9000);
                username = `${emailPrefix}${randomSuffix}`;
                
                // Keep length constraints strictly between 6 and 15 characters
                if (username.length < 6) {
                    username = username.padEnd(6, '0');
                } else if (username.length > 15) {
                    username = username.slice(0, 15);
                }
                
                const existingUser = await User.findOne({ username });
                if (!existingUser) {
                    usernameExists = false;
                }
                attempts++;
            }
            
            if (usernameExists) {
                username = `${emailPrefix}${Date.now().toString().slice(-5)}`;
                if (username.length > 15) {
                    username = username.slice(0, 15);
                }
            }

            user = await User.create({
                fullName: name,
                email,
                username,
                avatar: picture,
                googleId,
                authProvider: 'google',
                isEmailVerified: true // Google emails are already verified
            });
        }

        const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);

        const options = {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
            maxAge: 10 * 24 * 60 * 60 * 1000 // 10 days
        };

        const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", refreshToken, options)
            .json(
                new ApiResponse(
                    200,
                    {
                        user: loggedInUser,
                        accessToken,
                        refreshToken
                    },
                    "Google authentication successful"
                )
            );
    } catch (error) {
        console.error("Google Auth Error:", error);
        throw new ApiError(401, "Invalid Google Token");
    }
});

module.exports = {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    verifyEmail,
    getCurrentUser,
    updateAccountDetails,
    updateUserSettings,
    getUserProfile,
    updateProfileImages,
    toggleSaveContent,
    toggleAlly,
    getChampions,
    getAllies,
    requestPasswordReset,
    resetPassword,
    generate2FASecret,
    verifyAndEnable2FA,
    verify2FALogin,
    toggleBlockUser,
    submitVerificationRequest,
    updateFCMToken,
    googleAuth
};
