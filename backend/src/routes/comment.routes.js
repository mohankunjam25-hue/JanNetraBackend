const { Router } = require("express");
const { 
    addComment, 
    updateComment,
    getPostComments, 
    deleteComment,
    repairCommentsCount,
    auditAllComments
} = require("../controllers/comment.controller");
const { verifyJWT } = require("../middlewares/auth.middleware");
const rateLimit = require("express-rate-limit");

const router = Router();

// Rate limiter for comments
const commentRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 50, // limit each IP to 50 comment requests per windowMs
    message: "Too many comments from this IP, please try again after 15 minutes",
    standardHeaders: true,
    legacyHeaders: false,
});

// All routes are protected
router.use(verifyJWT);

// Audit routes (Should probably be restricted to admins in production)
router.route("/audit/global").post(auditAllComments);
router.route("/repair/:postId").post(repairCommentsCount);

router.route("/:postId")
    .get(getPostComments)
    .post(commentRateLimiter, addComment);

router.route("/c/:commentId")
    .patch(updateComment)
    .delete(deleteComment);

module.exports = router;
