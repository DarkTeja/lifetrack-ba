const db = require("../config/db");
const aiService = require("../services/gemini");

exports.generateDailyInsight = async (req, res) => {
  const { user_id } = req.params;
  
  try {
    // Check if an insight was already generated TODAY
    const checkSql = "SELECT * FROM ai_insights WHERE user_id = ? AND DATE(generated_at) = CURDATE() ORDER BY generated_at DESC LIMIT 1";
    
    // Promise wrapper for DB callbacks
    const dbQuery = (sql, params) => new Promise((resolve, reject) => {
      db.query(sql, params, (err, results) => err ? reject(err) : resolve(results));
    });

    const existing = await dbQuery(checkSql, [user_id]);
    if (existing.length > 0) {
      return res.json({ insight: existing[0].insight_text, cached: true });
    }

    // Map Domain variables for TODAY only
    const learning = await dbQuery(`SELECT SUM(duration_mins) as total_mins FROM learning_sessions WHERE user_id = ? AND DATE(date) = CURDATE()`, [user_id]);
    const studyHours = (learning[0].total_mins || 0) / 60;

    const workouts = await dbQuery("SELECT COUNT(*) as c FROM workouts WHERE user_id = ? AND DATE(date) = CURDATE()", [user_id]);
    const sleep = await dbQuery("SELECT hours_slept as s FROM sleep_logs WHERE user_id = ? AND DATE(date) = CURDATE() LIMIT 1", [user_id]);
    
    const work = await dbQuery("SELECT SUM(hours) as h FROM work_sessions WHERE user_id = ? AND type = 'focused' AND DATE(date) = CURDATE()", [user_id]);
    const tasks = await dbQuery("SELECT COUNT(*) as c FROM tasks WHERE user_id = ? AND status = 'Done' AND DATE(due_date) = CURDATE()", [user_id]);

    const financeInc = await dbQuery("SELECT SUM(amount) as sum FROM transactions WHERE user_id = ? AND type = 'income' AND DATE(date) = CURDATE()", [user_id]);
    const financeExp = await dbQuery("SELECT SUM(amount) as sum FROM transactions WHERE user_id = ? AND type = 'expense' AND DATE(date) = CURDATE()", [user_id]);
    
    const balance = (financeInc[0].sum || 0) - (financeExp[0].sum || 0);

    const noData = studyHours === 0 && 
                   workouts[0].c === 0 && 
                   (sleep.length === 0 || sleep[0].s === null) && 
                   (work[0].h === null || work[0].h === 0) && 
                   tasks[0].c === 0 && 
                   (financeInc[0].sum === null || financeInc[0].sum === 0) && 
                   (financeExp[0].sum === null || financeExp[0].sum === 0);

    if (noData) {
      const dailyWelcome = JSON.stringify({
        analysis: "Ready to conquer your day? I'm standing by to analyze your performance. Log your first session in Study, Health, or Work to see your daily insight!",
        pros: ["Your roadmap is clear for today.", "Perfect opportunity to start your daily streaks."],
        cons: ["No data logged for today yet. Take the first step!"],
        ai_score_estimation: 0
      });
      return res.json({ insight: dailyWelcome, cached: true });
    }

    const prompt = `
      You are an elite life coach providing a DAILY performance review for today, ${new Date().toLocaleDateString()}.
      Data logged TODAY so far:
      1. Study: ${studyHours.toFixed(1)} hours logged today.
      2. Health: ${workouts[0].c} workouts today, ${parseFloat(sleep[0]?.s || 0).toFixed(1)}h sleep logged.
      3. Work: ${work[0].h || 0} focused hours today, ${tasks[0].c} tasks completed.
      4. Finance: Net daily balance: $${balance}.

      GUIDELINES:
      - This is a DAILY report. Be punchy and immediate.
      - If it's early in the day, provide encouraging momentum.
      - Focus on how today's actions are building a better tomorrow.
      
      You MUST respond ONLY with a raw, valid JSON object. Do NOT wrap it in markdown block quotes. Use exactly this structure:
      {
        "analysis": "Two sentences of high-energy coaching based ONLY on today's logs.",
        "pros": ["Key win from today", "Another positive thing"],
        "cons": ["One small thing to improve before the day ends", "Focus area for tomorrow"],
        "ai_score_estimation": 80
      }
    `;

    let insightText;
    let provider = 'Gemini';
    try {
      insightText = await aiService.getDailyInsight(prompt);
      // Even if it returns, if it's the catch-all "Daily AI quota reached" JSON, handle it
      if (insightText && insightText.includes("Daily AI quota reached")) {
        throw new Error("Quota reached");
      }
    } catch (e) {
      console.log("Gemini failed, falling back to Groq Llama 3...");
      const groqService = require("../services/groqService");
      insightText = await groqService.getDailyInsight(prompt);
      provider = 'Groq-Llama3';
      if (!insightText) {
        return res.status(503).json({ error: "AI Services currently busy. Please try again soon." });
      }
    }

    // Persist Cache
    if (insightText && !insightText.includes("Error")) {
      const insertSql = "INSERT INTO ai_insights (user_id, week_start_date, insight_text) VALUES (?, CURDATE(), ?)";
      await dbQuery(insertSql, [user_id, insightText]);
    }

    res.json({ insight: insightText, cached: false, provider: provider });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.chatWithAi = async (req, res) => {
  const { user_id } = req.params;
  const { question } = req.body;
  
  if (!question) return res.status(400).json({ error: "No question provided" });

  try {
    const dbQuery = (sql, params) => new Promise((resolve, reject) => {
      db.query(sql, params, (err, results) => err ? reject(err) : resolve(results));
    });

    const checkSql = "SELECT insight_text FROM ai_insights WHERE user_id = ? ORDER BY generated_at DESC LIMIT 1";
    const existing = await dbQuery(checkSql, [user_id]);
    
    const context = existing.length > 0 ? existing[0].insight_text : "No recent data evaluated.";
    let answer;
    try {
      answer = await aiService.chatWithCoach(context, question);
      if (!answer || answer.includes("Error") || answer.includes("503") || answer.includes("429")) {
        throw new Error("Gemini chat error, falling back to Groq");
      }
    } catch (e) {
      console.log("Gemini Chat failed, trying Groq fallback...");
      const groqService = require("../services/groqService");
      answer = await groqService.chatWithCoach(context, question);
    }
    
    res.json({ answer });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getStreak = async (req, res) => {
  const { user_id } = req.params;
  const dbQuery = (sql, params) => new Promise((resolve, reject) => {
    db.query(sql, params, (err, results) => err ? reject(err) : resolve(results));
  });

  try {
    const sql = `
      SELECT COUNT(*) as c FROM (
        SELECT date FROM learning_sessions WHERE user_id = ? AND DATE(date) = CURDATE()
        UNION ALL
        SELECT date FROM workouts WHERE user_id = ? AND DATE(date) = CURDATE()
        UNION ALL
        SELECT date FROM work_sessions WHERE user_id = ? AND DATE(date) = CURDATE()
        UNION ALL
        SELECT date FROM transactions WHERE user_id = ? AND DATE(date) = CURDATE()
      ) AS today_logs
    `;
    const result = await dbQuery(sql, [user_id, user_id, user_id, user_id]);
    res.json({ loggedToday: result[0].c > 0 });
  } catch (err) {
    res.json({ loggedToday: false });
  }
};
