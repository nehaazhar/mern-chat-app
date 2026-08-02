const express = require("express");
const { assistMessage } = require("../controllers/aiController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.route("/message-assist").post(protect, assistMessage);

module.exports = router;
