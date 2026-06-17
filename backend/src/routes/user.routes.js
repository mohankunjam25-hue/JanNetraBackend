const { Router } = require("express");
const { 
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
} = require("../controllers/user.controller");
const { verifyJWT } = require("../middlewares/auth.middleware");
const { upload } = require("../middlewares/multer.middleware");
const { authRateLimiter } = require("../middlewares/rateLimit.middleware");
const { validate } = require("../middlewares/validate.middleware");
const { 
    registerSchema, 
    loginSchema, 
    forgotPasswordSchema, 
    resetPasswordSchema, 
    updateAccountSchema 
} = require("../validators/user.validator");

const router = Router();

router.route("/register").post(authRateLimiter, validate(registerSchema), registerUser);
router.route("/login").post(authRateLimiter, validate(loginSchema), loginUser);
router.route("/google-auth").post(authRateLimiter, googleAuth);
router.route("/verify-2fa-login").post(authRateLimiter, verify2FALogin);
router.route("/refresh-token").post(refreshAccessToken);
router.route("/verify-email/:token").get(verifyEmail);
router.route("/forgot-password").post(authRateLimiter, validate(forgotPasswordSchema), requestPasswordReset);
router.route("/reset-password").post(authRateLimiter, validate(resetPasswordSchema), resetPassword);

// Protected routes
router.route("/logout").post(verifyJWT, logoutUser);
router.route("/current-user").get(verifyJWT, getCurrentUser);
router.route("/profile/:username").get(verifyJWT, getUserProfile);
router.route("/update-account").patch(verifyJWT, validate(updateAccountSchema), updateAccountDetails);
router.route("/update-settings").patch(verifyJWT, updateUserSettings);
router.route("/update-images").patch(
    verifyJWT, 
    upload.fields([
        { name: "avatar", maxCount: 1 },
        { name: "coverImage", maxCount: 1 }
    ]), 
    updateProfileImages
);
router.route("/save-content").patch(verifyJWT, toggleSaveContent);
router.route("/toggle-ally/:targetUserId").patch(verifyJWT, toggleAlly);
router.route("/toggle-block/:targetUserId").patch(verifyJWT, toggleBlockUser);
router.route("/verify-identity").post(verifyJWT, upload.single("idDocument"), submitVerificationRequest);
router.route("/register-fcm-token").post(verifyJWT, updateFCMToken);
router.route("/champions/:userId").get(verifyJWT, getChampions);
router.route("/allies/:userId").get(verifyJWT, getAllies);

// 2FA Routes
router.route("/2fa/generate").post(verifyJWT, generate2FASecret);
router.route("/2fa/enable").post(verifyJWT, verifyAndEnable2FA);

module.exports = router;
