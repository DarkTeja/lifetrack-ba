const { GoogleGenerativeAI } = require("@google/generative-ai");

const getDailyInsight = async (prompt) => {
  if (!process.env.GEMINI_API_KEY) {
    return JSON.stringify({
      analysis: "Google AI configuration missing. Please add GEMINI_API_KEY to your .env file.",
      pros: ["System is ready for activation."],
      cons: ["AI features currently disabled."],
      ai_score_estimation: 0
    });
  }
  
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    // Use the confirmed identifier from the listModels diagnostic
    const model = genAI.getGenerativeModel({ 
      model: "gemini-flash-latest",
      generationConfig: { responseMimeType: "application/json" }
    });
    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    console.error("Gemini API Error:", error.message);
    if (error.message.includes("429")) {
      return JSON.stringify({
        analysis: "Wow! You've been very active today. We've hit the daily free limit for AI insights. Your data is still safe and we'll have new insights ready for you tomorrow!",
        pros: ["Maximum productivity reached for today.", "Data is securely logged."],
        cons: ["Daily AI quota reached. Resetting in 24 hours."],
        ai_score_estimation: 100
      });
    }
    throw error;
  }
};

const chatWithCoach = async (context, question) => {
  if (!process.env.GEMINI_API_KEY) return "Gemini API key is missing.";
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });
    const prompt = `Context of the user's latest daily performance:\n${context}\n\nThe user is asking you a direct question: "${question}"\n\nProvide a concise, helpful, and direct answer as their life coach. Under 4 sentences.`;
    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (err) {
    throw err;
  }
};

module.exports = { getDailyInsight, chatWithCoach };
