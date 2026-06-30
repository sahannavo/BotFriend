// DOM Elements
const chatBox = document.getElementById("chat-box");
const userInput = document.getElementById("user-input");
const sendBtn = document.getElementById("send-btn");
const typingIndicator = document.getElementById("typing-indicator"); // FIXED: was 'chatBox' and wrong ID

// API Configuration
const API_URL = "http://localhost:3000/chat"; // backend endpoint

// State
let isProcessing = false;

// Helper function to add a message to the chat
function addMessage(message, isUser = false) {
  const messageDiv = document.createElement("div");
  messageDiv.className = `message ${isUser ? "user-message" : "bot-message"}`; // FIXED: proper class

  const avatar = document.createElement("div");
  avatar.className = "avatar";
  avatar.textContent = isUser ? "👤" : "🤖";

  const content = document.createElement("div");
  content.className = "message-content";

  const paragraph = document.createElement("p");
  paragraph.textContent = message;
  content.appendChild(paragraph);

  // FIXED: Correct DOM structure
  messageDiv.appendChild(avatar);
  messageDiv.appendChild(content);
  chatBox.appendChild(messageDiv);

  // Scroll to Bottom
  chatBox.scrollTop = chatBox.scrollHeight;
}

// Show/hide typing indicator
function setTyping(typing) {
  // FIXED: function name was 'setTYping'
  if (typing) {
    typingIndicator.classList.remove("hidden");
  } else {
    typingIndicator.classList.add("hidden");
  }
}

// Send the message to the backend and get the response
async function sendMessageToBackend(message) {
  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json", // FIXED: was 'appliction/json'
      },
      body: JSON.stringify({ message }),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to get response from backend");
    }
    const data = await response.json();
    return data.reply;
  } catch (error) {
    console.error("Error", error); // FIXED: was 'Console.error'
    throw error;
  }
}

// Handle sending a message
async function handleSendMessage() {
  const message = userInput.value.trim(); // FIXED: was 'ariaValueMax'

  // Validate
  if (!message || isProcessing) return;

  // Clear input and disable controls
  userInput.value = "";
  isProcessing = true;
  sendBtn.disabled = true;

  // Add user message to chat
  addMessage(message, true);

  // Show typing indicator
  setTyping(true);

  try {
    // Get response from backend
    const reply = await sendMessageToBackend(message);
    // Hide typing indicator
    setTyping(false);
    // Add bot response to chat
    addMessage(reply, false);
  } catch (error) {
    // FIXED: was missing 'error' parameter
    // Hide typing indicator
    setTyping(false);

    // Show error message
    let errorMessage = "Oops! Something went wrong. ";
    if (error.message.includes("401")) {
      errorMessage += "Please check your API key.";
    } else if (error.message.includes("429")) {
      errorMessage += "Rate limit exceeded. Please try again later.";
    } else {
      errorMessage += "Please try again.";
    }
    addMessage(errorMessage, false);
  } finally {
    // Re-enable controls
    isProcessing = false;
    sendBtn.disabled = false;
    userInput.focus();
  }
}

// Event Listeners
sendBtn.addEventListener("click", handleSendMessage);

userInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    handleSendMessage();
  }
});

// Focus input on load
userInput.focus();
