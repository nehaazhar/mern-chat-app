const asyncHandler = require("express-async-handler");
const Message = require("../Models/messageModels");
const User = require("../Models/userModels");
const Chat = require("../Models/chatModels");
const Notification = require("../Models/notificationModel");

const sendMessage = asyncHandler(async (req, resp) => {
  const { content, chatId, replyTo } = req.body;

  if (!content || !chatId) {
    console.log("Invalid data passed into request");
    return resp.sendStatus(400);
  }

  if (replyTo) {
    const repliedMessage = await Message.findById(replyTo);

    if (!repliedMessage) {
      return resp.status(404).json({
        message: "Reply message not found",
      });
    }
  }

  var newMessage = {
    sender: req.user._id,
    content: content,
    chat: chatId,
    replyTo: replyTo || null,
  };

  try {
    var message = await Message.create(newMessage);
    message = await message.populate("sender", "name pic");
    message = await message.populate("chat");

    message = await message.populate({
      path: "replyTo",
      populate: {
        path: "sender",
        select: "name pic",
      },
    });

    message = await User.populate(message, {
      path: "chat.users",
      select: "name pic email",
    });

    await Chat.findByIdAndUpdate(req.body.chatId, {
      latestMessage: message,
    });

    const currentChat = await Chat.findById(chatId);
    if (currentChat && currentChat.users) {
      const notificationPromises = currentChat.users
        .filter((userId) => userId.toString() !== req.user._id.toString())
        .map((receiverId) => {
          return Notification.create({
            receiver: receiverId,
            chat: chatId,
            message: message._id,
          });
        });
      await Promise.all(notificationPromises);
    }

    resp.json(message);
  } catch (error) {
    resp.status(400);
    throw new Error(error.message);
  }
});

const allMessages = asyncHandler(async (req, res) => {
  try {
    const messages = await Message.find({ chat: req.params.chatId })
      .populate("sender", "name pic email")
      .populate("chat")
      .populate({
        path: "replyTo",
        populate: {
          path: "sender",
          select: "name pic email",
        },
      });

    res.json(messages);
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }
});

module.exports = { sendMessage, allMessages };
