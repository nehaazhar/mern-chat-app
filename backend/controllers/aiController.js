const asyncHandler = require("express-async-handler");
const OpenAI = require("openai");
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

// Updated Gemini REST API Function with System Instruction & Proper Tokens
const getGeminiResponse = async (prompt) => {
  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL || "gemini-1.5-flash";

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  const payload = {
    system_instruction: {
      parts: [
        {
          text: prompt.system,
        },
      ],
    },
    contents: [
      {
        role: "user",
        parts: [
          {
            text: prompt.user,
          },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.3,
      maxOutputTokens: 300, // Tokens count badha diya hai taaki sentence cut-off na ho
    },
  };

  // Try v1 API
  let response = await fetch(
    `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
  );

  // Fallback to v1beta if required
  if (!response.ok && response.status === 404) {
    response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
    );
  }

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API error ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  const content = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";

  return content.trim();
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
        "You are a helpful AI writing assistant for a messaging application. Output ONLY the rewritten or generated text. Do NOT wrap the answer in quotes, do NOT add explanations, and do NOT truncate the sentence.",
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
            "You are a helpful AI writing assistant for a messaging application. Output ONLY the rewritten or generated text. Do NOT wrap the answer in quotes and do NOT add explanations.",
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
