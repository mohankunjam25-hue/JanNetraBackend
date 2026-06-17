const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.resolve(__dirname, "../../temp"));
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    // Allowed extensions and mime types
    const allowedExtensions = [".jpg", ".jpeg", ".png", ".webp", ".mp4", ".mkv", ".webm"];
    const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp", "video/mp4", "video/x-matroska", "video/webm"];

    const extension = path.extname(file.originalname).toLowerCase();
    const mimetype = file.mimetype;

    if (allowedExtensions.includes(extension) && allowedMimeTypes.includes(mimetype)) {
        cb(null, true);
    } else {
        cb(new Error("Invalid file type. Only JPG, JPEG, PNG, WEBP, MP4, MKV, and WEBM are allowed."), false);
    }
};

const upload = multer({ 
    storage,
    fileFilter,
    limits: { fileSize: 100 * 1024 * 1024 }, // 100MB limit for videos
});

module.exports = { upload };
