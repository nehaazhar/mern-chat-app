const asyncHandler = require("express-async-handler");
const Notification = require("../Models/notificationModel");

const getNotifications = asyncHandler(async (req, res) => {
  try {
    const dbNotifications = await Notification.find({ receiver: req.user._id })
      .populate({
        path: "chat",
        populate: { path: "users", select: "name pic email" },
      })
      .populate("message");

    const formattedNotifications = dbNotifications
      .map((notif) => {
        if (!notif.message) return null;

        return {
          _id: notif.message._id,
          content: notif.message.content,
          sender: notif.message.sender,
          chat: notif.chat,
          createdAt: notif.message.createdAt,
        };
      })
      .filter(Boolean);

    res.json(formattedNotifications);
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }
});

const clearNotifications = asyncHandler(async (req, res) => {
  try {
    await Notification.deleteMany({
      receiver: req.user._id,
      chat: req.params.chatId,
    });
    res.json({ message: "Notifications cleared from DB" });
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }
});

module.exports = { getNotifications, clearNotifications };
