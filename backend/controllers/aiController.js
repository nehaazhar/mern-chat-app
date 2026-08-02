const asyncHandler = require("express-async-handler");
const OpenAI = require("openai");
const { GoogleGenAI } = require("@google/genai");
const Chat = require("../Models/chatModels");
const Message = require("../Models/messageModels");

const getOpenAIClient = () => {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  return new OpenAI({
    apiKey,
  });
};

// Official SDK implementation for Gemini
const getGeminiResponse = async (prompt) => {
  const apiKey = process.env.GEMINI_API_KEY;
  const modelName = process.env.GEMINI_MODEL || "gemini-2.5-flash";

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  const ai = new GoogleGenAI({ apiKey });

  const response = await ai.models.generateContent({
    model: modelName,
    contents: prompt.user,
    config: {
      systemInstruction: prompt.system,
      temperature: 0.3,
      maxOutputTokens: 300,
    },
  });

  return response.text ? response.text.trim() : "";
};

const modeInstructions = {
  fix_grammar:
    "Fix grammar, spelling, and clarity while keeping the original meaning and tone.",
  friendly:
    "Rewrite the draft message in a warm, polite, and friendly conversational tone.",
  professional:
    "Rewrite the draft message in a professional, clear, and business-appropriate tone.",
  suggest_reply:
    "Generate a natural, helpful, and concise response to the recent conversation.",
};

const formatRecentMessages = (messages, currentUserId) => {
  return messages
    .map((message) => {
      const senderId = message.sender?._id?.toString();
      const senderName =
        senderId === currentUserId
          ? "You"
          : message.sender?.name || "Other user";

      return `${senderName}: ${message.content}`;
    })
    .join("\n");
};

const assistMessage = asyncHandler(async (req, res) => {
  const { mode, draft = "", chatId } = req.body;

  if (!modeInstructions[mode]) {
    return res.status(400).json({ message: "Invalid AI assist mode" });
  }

  if (!process.env.OPENAI_API_KEY && !process.env.GEMINI_API_KEY) {
    return res
      .status(500)
      .json({ message: "OPENAI_API_KEY or GEMINI_API_KEY is not configured" });
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
      .limit(10)
      .populate("sender", "name")
      .lean();

    recentConversation =
      formatRecentMessages(messages.reverse(), req.user._id.toString()) ||
      "No recent messages.";
  }

  let text;

  if (process.env.GEMINI_API_KEY && !process.env.OPENAI_API_KEY) {
    text = await getGeminiResponse({
      system:
        "You are a helpful AI writing assistant inside a chat application. Output ONLY the rewritten or generated response. Do NOT wrap the answer in quotes, do NOT add explanations, and do NOT truncate sentences.",
      user: [
        `Instruction: ${modeInstructions[mode]}`,
        `Context (Recent Chat History):\n${recentConversation}`,
        `Original Draft to Rewrite: "${draft || ""}"`,
      ].join("\n\n"),
    });
  } else {
    const openai = getOpenAIClient();

    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      temperature: 0.4,
      max_tokens: 300,
      messages: [
        {
          role: "system",
          content:
            "You are a helpful AI writing assistant inside a chat application. Output ONLY the rewritten or generated response. Do NOT wrap the answer in quotes and do NOT add explanations.",
        },
        {
          role: "user",
          content: [
            `Instruction: ${modeInstructions[mode]}`,
            `Context (Recent Chat History):\n${recentConversation}`,
            `Original Draft to Rewrite: "${draft || ""}"`,
          ].join("\n\n"),
        },
      ],
    });

    text = completion.choices?.[0]?.message?.content?.trim();
  }

  if (!text) {
    return res.status(502).json({ message: "AI did not return a response" });
  }

  res.json({ text });
});

module.exports = { assistMessage };
