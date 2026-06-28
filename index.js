// Import the OpenAI library to communicate with the API
import OpenAI from "openai";
// Load the hidden API key from your .env file
import "dotenv/config";
console.log(
  "Checking API Key:",
  process.env.OPENAI_API_KEY ? "Found!" : "NOT FOUND!",
);
// Import a library to read text from your terminal (input/output)
import readline from "readline";

// Create a new instance of the OpenAI client using your secret key
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
});

// This array acts as the bot's "brain" or "memory"
// We start with a 'system' message to define the bot's personality
const conversationHistory = [
  { role: "system", content: "You are a helpful and funny assistant." },
];

// Set up the terminal interface to listen for your typing
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// This function creates a repeating loop for the conversation
async function chat() {
  // Wait for the user to type something
  rl.question("You: ", async (input) => {
    // If the user types 'exit', close the program
    if (input.toLowerCase() === "exit") return rl.close();

    // 1. Add your input to our memory array so the AI knows you said it
    conversationHistory.push({ role: "user", content: input });
    try {
      // 2. Send the entire memory array to OpenAI so it has full context
      const completion = await openai.chat.completions.create({
        model: "google/gemma-4-26b-a4b-it:free", // The specific model to use
        messages: conversationHistory, // The full history gets sent here
        max_tokens: 500, // Limit the response length to 500 tokens
      });

      // Extract the text response from the AI's reply
      const reply = completion.choices[0].message.content;
      console.log(`Bot: ${reply}`);
      // 3. Add the AI's reply to our memory array so it "remembers" its own response
      conversationHistory.push({ role: "assistant", content: reply });
    } catch (error) {
      // This catches the error and gives the user a clear explanation
      if (error.status === 429) {
        console.error(
          "🐌 Bot : My brain is empty ! please check your openAI billing credits.",
        );
      } else if (error.status === 401) {
        console.log(
          "❌ Bot: Authentication failed. Please check your API key in the .env file.",
        );
      } else {
        console.log("🚫 Bot: Something went wrong: " + error.message);
      }
    }

    // 4. Call the function again to start the next turn (The Loop)
    chat();
  });
}

// Initial message to the user
console.log("Chatbot initialized! (Type 'exit' to quit)");
// Start the first conversation loop
chat();
