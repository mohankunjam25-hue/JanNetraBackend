const { ApiError } = require("../utils/ApiError");
const { asyncHandler } = require("../utils/asyncHandler");
const jwt = require("jsonwebtoken");
const User = require("../models/user.model");

/**
 * @description Middleware to verify JWT from cookies or Authorization header
 */
const verifyJWT = asyncHandler(async (req, _, next) => {
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");

        if (!token) {
            throw new ApiError(401, "Unauthorized request: No token provided");
        }

        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

        const user = await User.findById(decodedToken?._id).select("-password -refreshToken");

        if (!user) {
            throw new ApiError(401, "Invalid Access Token: User not found");
        }

        req.user = user;
        next();
    } catch (error) {
        if (error instanceof ApiError) {
            throw error;
        }
        
        // Handle JWT specific errors as 401
        if (error.name === "JsonWebTokenError") {
            throw new ApiError(401, "Invalid access token");
        }
        if (error.name === "TokenExpiredError") {
            throw new ApiError(401, "Access token expired");
        }

        // Pass other errors (like DB issues) to the default error handler
        throw new ApiError(error.statusCode || 500, error?.message || "Internal server error during authentication");
    }
});

module.exports = { verifyJWT };
