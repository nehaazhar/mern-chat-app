const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const {
  getNotifications,
  clearNotifications,
} = require("../controllers/notificationControllers");

const router = express.Router();

router.route("/").get(protect, getNotifications);
router.route("/:chatId").delete(protect, clearNotifications);

module.exports = router;
