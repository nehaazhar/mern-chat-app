const asyncHandler = require("express-async-handler");
const OpenAI = require("openai");
const Chat = require("../Models/chatModels");
const Message = require("../Models/messageModels");

const getOpenAIClient = () => {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
};

const modeInstructions = {
  fix_grammar:
    "Fix grammar and clarity while keeping the user's meaning and tone. Return only the improved message.",
  friendly:
    "Rewrite the draft in a warm, friendly tone. Keep it concise. Return only the rewritten message.",
  professional:
    "Rewrite the draft in a polite, professional tone. Keep it concise. Return only the rewritten message.",
  suggest_reply:
    "Suggest one natural, concise reply based on the recent conversation. Return only the reply text.",
};

const formatRecentMessages = (messages, currentUserId) => {
  return messages
    .map((message) => {
      const senderId = message.sender?._id?.toString();
      const senderName =
        senderId === currentUserId ? "You" : message.sender?.name || "Other user";

      return `${senderName}: ${message.content}`;
    })
    .join("\n");
};

const assistMessage = asyncHandler(async (req, res) => {
  const { mode, draft = "", chatId } = req.body;

  if (!modeInstructions[mode]) {
    return res.status(400).json({ message: "Invalid AI assist mode" });
  }

  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({ message: "OPENAI_API_KEY is not configured" });
  }

  if (mode !== "suggest_reply" && !draft.trim()) {
    return res.status(400).json({ message: "Draft message is required" });
  }

  let recentConversation = "No recent messages.";

  if (chatId) {
    const chat = await Chat.findOne({
      _id: chatId,
      users: { $elemMatch: { $eq: req.user._id } },
    });

    if (!chat) {
      return res.status(404).json({ message: "Chat not found" });
    }

    const messages = await Message.find({ chat: chatId })
      .sort({ createdAt: -1 })
      .limit(12)
      .populate("sender", "name")
      .lean();

    recentConversation =
      formatRecentMessages(messages.reverse(), req.user._id.toString()) ||
      "No recent messages.";
  }

  const openai = getOpenAIClient();

  const completion = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL || "gpt-4o-mini",
    temperature: 0.4,
    max_tokens: 120,
    messages: [
      {
        role: "system",
        content:
          "You are an AI writing assistant inside a chat app. Do not explain your changes. Do not add quotes around the answer.",
      },
      {
        role: "user",
        content: [
          `Task: ${modeInstructions[mode]}`,
          `Recent conversation:\n${recentConversation}`,
          `Draft message:\n${draft || ""}`,
        ].join("\n\n"),
      },
    ],
  });

  const text = completion.choices?.[0]?.message?.content?.trim();

  if (!text) {
    return res.status(502).json({ message: "AI did not return a response" });
  }

  res.json({ text });
});

module.exports = { assistMessage };
