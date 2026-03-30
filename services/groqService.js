const axios = require('axios');

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

const getDailyInsight = async (prompt) => {
  if (!process.env.GROQ_API_KEY) return null;
  
  try {
    const response = await axios.post(GROQ_URL, {
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: "You are a professional life coach. Response must be in valid JSON format." },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" }
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    return response.data.choices[0].message.content;
  } catch (error) {
    console.error("Groq API Error:", error.response ? error.response.data : error.message);
    return null;
  }
};

const chatWithCoach = async (context, question) => {
  if (!process.env.GROQ_API_KEY) return "Groq API key is missing.";
  
  try {
    const response = await axios.post(GROQ_URL, {
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: "You are a concise, helpful life coach." },
        { role: "user", content: `Context: ${context}\n\nQuestion: ${question}` }
      ]
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    return response.data.choices[0].message.content;
  } catch (error) {
    return "Groq Chat Error: " + error.message;
  }
};

module.exports = { getDailyInsight, chatWithCoach };
