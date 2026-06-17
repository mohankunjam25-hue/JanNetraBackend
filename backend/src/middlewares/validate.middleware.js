const { ApiError } = require("../utils/ApiError");

const validate = (schema) => async (req, res, next) => {
    try {
        await schema.parseAsync({
            body: req.body,
            query: req.query,
            params: req.params,
        });
        next();
    } catch (error) {
        const errorMessage = error.errors?.map(err => err.message).join(", ") || "Validation failed";
        next(new ApiError(400, errorMessage, error.errors));
    }
};

module.exports = { validate };