const express = require("express");
const {
  sendMessage,
  allMessages,
  markMessageAsRead,
} = require("../controllers/messageControllers");
const { protect } = require("../middleware/authMiddleware");
const router = express.Router();
router.route("/").post(protect, sendMessage);
router.route("/:chatId").get(protect, allMessages);
router.route("/:messageId/read").put(protect, markMessageAsRead);

module.exports = router;
