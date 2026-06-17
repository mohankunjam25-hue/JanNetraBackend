const User = require("../models/user.model");

/**
 * Generates a MongoDB query filter to exclude posts/comments/activity 
 * from users that the current user has blocked, OR users who have blocked the current user.
 * 
 * @param {Object} currentUser - The req.user object.
 * @returns {Promise<Object>} A query object snippet (e.g., { author: { $nin: [...] } })
 */
const generateBlockFilter = async (currentUser) => {
    if (!currentUser) return {};

    const blockedByMe = currentUser.blockedUsers || [];
    
    // Find users who have blocked the current user
    const usersWhoBlockedMe = await User.find({ blockedUsers: currentUser._id }).select("_id");
    const blockedMeIds = usersWhoBlockedMe.map(u => u._id);
    
    const allBlockedIds = [...blockedByMe, ...blockedMeIds];
    
    if (allBlockedIds.length > 0) {
        return { $nin: allBlockedIds };
    }
    
    return null;
};

module.exports = {
    generateBlockFilter
};
