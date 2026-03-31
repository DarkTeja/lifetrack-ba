const db = require("../config/db");

// Workouts
exports.addWorkout = (req, res) => {
  const { user_id, type, duration_mins, calories_burned, date } = req.body;
  const today = new Date().toISOString().split('T')[0];
  if (date > today) return res.status(400).json({ error: "Cannot log future workouts" });

  const upperType = type ? type.toUpperCase() : "OTHER";
  const sql = "INSERT INTO workouts (user_id, type, duration_mins, calories_burned, date) VALUES (?, ?, ?, ?, ?)";

  db.query(sql, [user_id, upperType, duration_mins, calories_burned, date], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "Workout added successfully", id: result.insertId });
  });
};
exports.getWorkouts = (req, res) => {
  const { user_id } = req.params;
  const sql = "SELECT * FROM workouts WHERE user_id = ? ORDER BY date DESC";
  db.query(sql, [user_id], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
};

// Sleep Logs
exports.addSleep = (req, res) => {
  const { user_id, hours_slept, quality, date } = req.body;
  const today = new Date().toISOString().split('T')[0];
  if (date > today) return res.status(400).json({ error: "Cannot log future sleep" });

  const sql = "INSERT INTO sleep_logs (user_id, hours_slept, quality, date) VALUES (?, ?, ?, ?)";

  db.query(sql, [user_id, hours_slept, quality, date], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "Sleep logged successfully", id: result.insertId });
  });
};
exports.getSleepLogs = (req, res) => {
  const { user_id } = req.params;
  const sql = "SELECT * FROM sleep_logs WHERE user_id = ? ORDER BY date DESC";
  db.query(sql, [user_id], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
};

// Water Logs
exports.addWater = (req, res) => {
  const { user_id, litres, date } = req.body;
  const today = new Date().toISOString().split('T')[0];
  if (date > today) return res.status(400).json({ error: "Cannot log future hydration" });

  const sql = "INSERT INTO water_logs (user_id, litres, date) VALUES (?, ?, ?)";

  db.query(sql, [user_id, litres, date], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "Water logged successfully", id: result.insertId });
  });
};
exports.getWaterLogs = (req, res) => {
  const { user_id } = req.params;
  const sql = "SELECT * FROM water_logs WHERE user_id = ? ORDER BY date DESC";
  db.query(sql, [user_id], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
};

// Weekly Summary
exports.getWeeklySummary = (req, res) => {
  const { user_id } = req.params;
  
  const sql = `
    SELECT 
      (SELECT COUNT(*) FROM workouts WHERE user_id = ? AND date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)) as total_workouts,
      (SELECT AVG(hours_slept) FROM sleep_logs WHERE user_id = ? AND date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)) as avg_sleep,
      (SELECT AVG(litres) FROM water_logs WHERE user_id = ? AND date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)) as avg_water
  `;
  
  db.query(sql, [user_id, user_id, user_id], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results[0]);
  });
};
