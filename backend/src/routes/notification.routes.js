const { Router } = require("express");
const { 
    getNotifications, 
    markAsRead, 
    markAllAsRead, 
    getUnreadCount, 
    deleteNotification 
} = require("../controllers/notification.controller");
const { verifyJWT } = require("../middlewares/auth.middleware");

const router = Router();

// All routes are protected
router.use(verifyJWT);

router.route("/").get(getNotifications);
router.route("/unread-count").get(getUnreadCount);
router.route("/read-all").patch(markAllAsRead);
router.route("/read/:notificationId").patch(markAsRead);
router.route("/:notificationId").delete(deleteNotification);

module.exports = router;
