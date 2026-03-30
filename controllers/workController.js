const db = require("../config/db");

// Work Sessions
exports.addSession = (req, res) => {
  const { user_id, project, hours, type, date } = req.body;
  const upperProject = project ? project.toUpperCase() : "GENERAL";
  const sql = "INSERT INTO work_sessions (user_id, project, hours, type, date) VALUES (?, ?, ?, ?, ?)";
  db.query(sql, [user_id, upperProject, hours, type, date], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "Work session added", id: result.insertId });
  });
};

exports.getSessions = (req, res) => {
  const { user_id } = req.params;
  const sql = "SELECT * FROM work_sessions WHERE user_id = ? ORDER BY date DESC";
  db.query(sql, [user_id], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
};

// Tasks
exports.addTask = (req, res) => {
  const { user_id, title, project, priority, due_date } = req.body;
  const upperTitle = title ? title.toUpperCase() : "UNTITLED TASK";
  const upperProject = project ? project.toUpperCase() : "GENERAL";
  const sql = "INSERT INTO tasks (user_id, title, project, priority, due_date) VALUES (?, ?, ?, ?, ?)";
  db.query(sql, [user_id, upperTitle, upperProject, priority, due_date], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "Task added", id: result.insertId });
  });
};

exports.getTasks = (req, res) => {
  const { user_id } = req.params;
  const sql = "SELECT * FROM tasks WHERE user_id = ? ORDER BY due_date ASC";
  db.query(sql, [user_id], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
};

exports.updateTaskStatus = (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const sql = "UPDATE tasks SET status = ? WHERE id = ?";
  db.query(sql, [status, id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "Task updated" });
  });
};

exports.deleteTask = (req, res) => {
  const { id } = req.params;
  const sql = "DELETE FROM tasks WHERE id = ?";
  db.query(sql, [id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "Task deleted" });
  });
};

// Weekly Summary
exports.getWeeklySummary = (req, res) => {
  const { user_id } = req.params;
  const sql = `
    SELECT 
      (SELECT SUM(hours) FROM work_sessions WHERE user_id = ? AND type = 'focused' AND date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)) as focused_hours,
      (SELECT COUNT(*) FROM tasks WHERE user_id = ? AND status = 'Done' AND due_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)) as tasks_completed
  `;
  db.query(sql, [user_id, user_id], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results[0]);
  });
};
