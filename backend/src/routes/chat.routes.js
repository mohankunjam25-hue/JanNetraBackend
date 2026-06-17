const { Router } = require("express");
const { 
    sendMessage, 
    getMessages, 
    getChatList 
} = require("../controllers/chat.controller");
const { verifyJWT } = require("../middlewares/auth.middleware");

const router = Router();

router.use(verifyJWT);

router.route("/send").post(sendMessage);
router.route("/history/:otherUserId").get(getMessages);
router.route("/list").get(getChatList);

module.exports = router;
