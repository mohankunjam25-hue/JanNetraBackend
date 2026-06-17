const Notification = require("../models/notification.model");
const User = require("../models/user.model");

/**
 * @description Create a notification if user preferences allow it
 */
const createNotification = async ({ recipient, sender, type, post = null, comment = null }) => {
    try {
        if (recipient.toString() === sender.toString()) return; // Don't notify self

        const user = await User.findById(recipient).select("settings.notifications");
        if (!user) return;

        const prefs = user.settings.notifications;
        let shouldNotify = false;

        switch (type) {
            case "APPRECIATION":
                shouldNotify = prefs.appreciations;
                break;
            case "COMMENT":
                shouldNotify = prefs.comments;
                break;
            case "REPLY":
                shouldNotify = prefs.replies;
                break;
            case "MENTION":
                shouldNotify = prefs.mentions;
                break;
            case "SHARE":
                shouldNotify = prefs.shares;
                break;
            case "ALLY_ACTIVITY":
                shouldNotify = prefs.allyActivity;
                break;
        }

        if (shouldNotify) {
            await Notification.create({
                recipient,
                sender,
                type,
                post,
                comment,
            });
            
            // Note: In a real-world scenario, you'd trigger a socket.io emit or push notification here
        }
    } catch (error) {
        console.error("Error creating notification:", error);
    }
};

module.exports = { createNotification };
