// index.js - Updated to handle HTTP requests
// Import the OpenAI library to communicate with the API
import OpenAI from "openai";
// Load the hidden API key from your .env file
import "dotenv/config";

import express from "express";
import cors from "cors";

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

console.log(
  "Checking API Key:",
  process.env.OPENAI_API_KEY ? "Found!" : "NOT FOUND!",
);

// Create a new instance of the OpenAI client using your secret key
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
});

// In-memory conversation history (per session)
// For production, use a database or session storage
const conversations = new Map();

// Chat endpoint
app.post("/chat", async (req, res) => {
  const { message, sessionId = "default" } = req.body;

  if (!message) {
    return res.status(400).json({ error: "Message is required" });
  }

  // Get or create conversation history
  if (!conversations.has(sessionId)) {
    conversations.set(sessionId, [
      {
        role: "system",
        content: "You are a helpful and funny assistant.",
      },
    ]);
  }

  const conversationHistory = conversations.get(sessionId);

  try {
    // Add user message to history
    conversationHistory.push({ role: "user", content: message });

    // Send entire conversation to OpenAI
    const completion = await openai.chat.completions.create({
      model: "google/gemma-4-26b-a4b-it:free",
      messages: conversationHistory,
      max_tokens: 500,
    });

    // Extract the AI's reply
    const reply = completion.choices[0].message.content;
    console.log(`Bot: ${reply}`);

    // Add AI's reply to history
    conversationHistory.push({ role: "assistant", content: reply });

    // Store updated history
    conversations.set(sessionId, conversationHistory);

    res.json({ reply });
  } catch (error) {
    console.error("Error:", error);

    let errorMessage = "Failed to get response";
    if (error.status === 429) {
      errorMessage =
        "🐌 Rate limit exceeded. Please check your OpenAI billing credits.";
    } else if (error.status === 401) {
      errorMessage = "❌ Authentication failed. Please check your API key.";
    } else {
      errorMessage = "🚫 Something went wrong: " + error.message;
    }
    res.status(error.status || 500).json({ error: errorMessage });
  }
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "healthy", timestamp: new Date().toISOString() });
});

app.listen(port, () => {
  console.log(`🚀 Server running on http://localhost:${port}`);
});
