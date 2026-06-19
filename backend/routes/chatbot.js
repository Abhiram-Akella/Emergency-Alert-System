const express = require("express");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { chatbotLimiter } = require("../middlewares/rateLimiters");
require("dotenv").config();

const router = express.Router();

// Initialize Google Generative AI with your API key
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Application context for the chatbot
const APP_CONTEXT = `
You are an AI assistant for our Emergency Alert System application. Here are the key features and capabilities:

1. Emergency Reporting:
   - Users can report emergencies from their dashboard using the "Report Emergency" button
   - Supports different emergency types: Fire, Medical, Crime, and Other
   - Automatically captures user's location
   - Allows media upload for better documentation

2. Emergency Tracking:
   - Users can view all their reports in "My Reports" section
   - Real-time status updates: Pending, Assigned, In Progress, Resolved
   - Interactive map showing emergency locations
   - Detailed view of each report with assigned responder information

3. Safety Resources:
   - Access emergency contacts through "Safety Resources" section
   - First aid and medical guides
   - Disaster preparedness information
   - Crime prevention guidelines
   - Fire safety protocols

4. Notifications:
   - Real-time alerts when responders are assigned
   - Status update notifications
   - Nearby emergency alerts within customizable radius
   - Email and SMS notifications for critical updates

5. Emergency Response:
   - Dedicated responder teams for different emergency types
   - Real-time location tracking
   - Navigation assistance for responders

6. User Dashboard Features:
   - Quick action buttons for emergency reporting
   - Active emergency status overview
   - Recent reports summary
   - Interactive emergency map
   - Real-time chat support
`;

async function getChatbotResponse(userMessage) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const prompt = `${APP_CONTEXT}

Based on the above context about our Emergency Alert System application, provide a helpful response to this user query: ${userMessage}

Remember to:
1. Reference specific features and buttons in the application
2. Provide clear, step-by-step instructions to the query and generate only text without special characters. Provide line breaks for each new step
3. Mention relevant sections or pages where features can be found
4. Keep responses very short but informative
5. If it's a life-threatening emergency, always start by advising to call emergency services 112 in India or report emergency using the application
6. Focus on how our application can help with their specific need

User Query: ${userMessage}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Error generating response:", error);
    throw error;
  }
}

router.post("/", chatbotLimiter, async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    const response = await getChatbotResponse(message);
    
    if (!response) {
      throw new Error("No response generated");
    }

    res.json({ reply: response });
  } catch (error) {
    console.error("Chatbot error:", error);
    res.status(500).json({ 
      error: "Failed to process chatbot response",
      details: error.message 
    });
  }
});

module.exports = router;