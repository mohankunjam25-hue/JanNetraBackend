const { ApiError } = require("../utils/ApiError");
const logger = require("../utils/logger");

/**
 * @description Global error handling middleware
 */
const errorHandler = (err, req, res, next) => {
    logger.error("Backend Error: %o", err);
    let error = err;

    if (!(error instanceof ApiError)) {
        const statusCode = error.statusCode || (error.name === "ValidationError" ? 400 : 500);
        const message = error.message || "Something went wrong";
        error = new ApiError(statusCode, message, error?.errors || [], err.stack);
    }

    const response = {
        ...error,
        message: error.message,
        ...(process.env.NODE_ENV === "development" ? { stack: error.stack } : {}),
    };

    return res.status(error.statusCode).json(response);
};

module.exports = { errorHandler };
