const cloudinary = require('cloudinary').v2;
const fs = require('fs');

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

/**
 * @description Upload a local file to Cloudinary
 * @param {string} localFilePath 
 * @returns {object|null} Cloudinary response or null
 */
const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null;

        // Upload the file on cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto",
        });

        // File has been uploaded successfully
        // console.log("File is uploaded on cloudinary ", response.url);
        
        // Remove the locally saved temporary file
        fs.unlinkSync(localFilePath);
        
        return response;

    } catch (error) {
        // Remove the locally saved temporary file as the upload operation failed
        if (fs.existsSync(localFilePath)) {
            fs.unlinkSync(localFilePath);
        }
        console.error("Cloudinary Upload Error:", error);
        return null;
    }
};

/**
 * @description Delete a file from Cloudinary using its public ID
 * @param {string} publicId 
 * @param {string} resourceType 
 */
const deleteFromCloudinary = async (publicId, resourceType = "image") => {
    try {
        if (!publicId) return null;

        const response = await cloudinary.uploader.destroy(publicId, {
            resource_type: resourceType
        });

        return response;
    } catch (error) {
        console.error("Cloudinary Delete Error:", error);
        return null;
    }
};

module.exports = { uploadOnCloudinary, deleteFromCloudinary };
