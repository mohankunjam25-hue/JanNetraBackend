const rateLimit = require("express-rate-limit");
const { ApiError } = require("../utils/ApiError");

const authRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Relaxed limit: 100 requests per 15 minutes
    handler: (req, res, next) => {
        next(new ApiError(429, "Too many requests from this IP, please try again later"));
    },
    standardHeaders: true,
    legacyHeaders: false,
});

module.exports = { authRateLimiter };