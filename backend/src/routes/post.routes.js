const { Router } = require("express");
const { 
    createPost, 
    getAllPosts, 
    getBuzzPosts, 
    getPostById,
    getUserPosts,
    updatePost,
    toggleAppreciation,
    incrementShares,
    deletePost
} = require("../controllers/post.controller");
const { verifyJWT } = require("../middlewares/auth.middleware");
const { upload } = require("../middlewares/multer.middleware");
const rateLimit = require("express-rate-limit");

const router = Router();

// Apply Rate Limiting
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 100, // Limit each IP to 100 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: "Too many requests from this IP, please try again after 15 minutes" }
});

// All routes are protected
router.use(verifyJWT);
router.use(apiLimiter);

// Create and Get All Posts
router.route("/")
    .post(upload.array("media", 5), createPost)
    .get(getAllPosts);

// Buzz Feed (Videos)
router.route("/buzz").get(getBuzzPosts);

// Appreciate a post
router.route("/appreciate/:postId").patch(toggleAppreciation);

// Share a post
router.route("/share/:postId").patch(incrementShares);

// Get all posts for a specific user
router.route("/user/:userId").get(getUserPosts);

// CRUD operations for a single post
router.route("/:postId")
    .get(getPostById)
    .patch(updatePost)
    .delete(deletePost);

module.exports = router;
