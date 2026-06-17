const { ApiError } = require("./ApiError");

/**
 * Validates that an object ID is valid.
 * @param {string} id - The ID to validate.
 * @param {string} [message] - Optional custom error message.
 * @throws {ApiError} If the ID is invalid.
 */
const validateObjectId = (id, message = "Invalid ID format") => {
    const mongoose = require("mongoose");
    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new ApiError(400, message);
    }
};

/**
 * Validates that all required fields are present in an object.
 * @param {Object} obj - The object to check.
 * @param {string[]} fields - Array of required field keys.
 * @throws {ApiError} If any required field is missing or empty.
 */
const validateRequiredFields = (obj, fields) => {
    const missing = fields.filter(field => !obj[field] || String(obj[field]).trim() === "");
    if (missing.length > 0) {
        throw new ApiError(400, `Missing required fields: ${missing.join(", ")}`);
    }
};

/**
 * Reusable function to check if a document exists and optionally verify authorization.
 * @param {Model} Model - The Mongoose model to query.
 * @param {string} id - The document ID.
 * @param {string} [userId] - Optional user ID to check for authorization (e.g. is author).
 * @param {string} [userField="author"] - The field in the document that stores the user reference.
 * @returns {Promise<Document>} The found document.
 * @throws {ApiError} If not found or unauthorized.
 */
const findAndVerifyDocument = async (Model, id, userId = null, userField = "author") => {
    validateObjectId(id);
    const doc = await Model.findById(id);
    
    if (!doc) {
        throw new ApiError(404, `${Model.modelName} not found`);
    }

    if (userId && doc[userField].toString() !== userId.toString()) {
        throw new ApiError(403, "You are not authorized to perform this action");
    }

    return doc;
};

module.exports = {
    validateObjectId,
    validateRequiredFields,
    findAndVerifyDocument
};
