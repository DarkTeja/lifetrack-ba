const db = require("../config/db");

// Learning Sessions
exports.addSession = (req, res) => {
  const { user_id, subject, duration_mins, date, notes } = req.body;
  const today = new Date().toISOString().split('T')[0];
  if (date > today) return res.status(400).json({ error: "Cannot log future study sessions" });

  const upperSubject = subject ? subject.toUpperCase() : "GENERAL";
  const sql = "INSERT INTO learning_sessions (user_id, subject, duration_mins, date, notes) VALUES (?, ?, ?, ?, ?)";

  db.query(sql, [user_id, upperSubject, duration_mins, date, notes], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "Session added successfully", id: result.insertId });
  });
};

exports.getSessions = (req, res) => {
  const { user_id } = req.params;
  const sql = "SELECT * FROM learning_sessions WHERE user_id = ? ORDER BY date DESC";
  db.query(sql, [user_id], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
};

exports.deleteSession = (req, res) => {
  const { id } = req.params;
  const sql = "DELETE FROM learning_sessions WHERE id = ?";
  db.query(sql, [id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "Session deleted successfully" });
  });
};

// Learning Goals
exports.addGoal = (req, res) => {
  const { user_id, subject, target_hours, deadline } = req.body;
  const upperSubject = subject ? subject.toUpperCase() : "GENERAL";
  const sql = "INSERT INTO learning_goals (user_id, subject, target_hours, deadline) VALUES (?, ?, ?, ?)";
  db.query(sql, [user_id, upperSubject, target_hours, deadline], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "Goal added successfully", id: result.insertId });
  });
};

exports.getGoals = (req, res) => {
  const { user_id } = req.params;
  const sql = "SELECT * FROM learning_goals WHERE user_id = ?";
  db.query(sql, [user_id], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
};

// Learning Scores
exports.addScore = (req, res) => {
  const { user_id, subject, score, max_score, date } = req.body;
  const today = new Date().toISOString().split('T')[0];
  if (date > today) return res.status(400).json({ error: "Cannot record future scores" });

  const upperSubject = subject ? subject.toUpperCase() : "GENERAL";
  const sql = "INSERT INTO learning_scores (user_id, subject, score, max_score, date) VALUES (?, ?, ?, ?, ?)";

  db.query(sql, [user_id, upperSubject, score, max_score, date], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "Score added successfully", id: result.insertId });
  });
};

exports.getScores = (req, res) => {
  const { user_id } = req.params;
  const sql = "SELECT * FROM learning_scores WHERE user_id = ? ORDER BY date DESC";
  db.query(sql, [user_id], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
};

// Weekly Summary
exports.getWeeklySummary = (req, res) => {
  const { user_id } = req.params;
  // Get sessions from the last 7 days
  const sql = `
    SELECT subject, SUM(duration_mins) as total_duration 
    FROM learning_sessions 
    WHERE user_id = ? AND date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
    GROUP BY subject
  `;
  db.query(sql, [user_id], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
};
