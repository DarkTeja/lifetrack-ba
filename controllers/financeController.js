const db = require("../config/db");

// Transactions
exports.addTransaction = (req, res) => {
  const { user_id, type, amount, category, date, note } = req.body;
  const upperCategory = category ? category.toUpperCase() : "OTHER";
  const sql = "INSERT INTO transactions (user_id, type, amount, category, date, note) VALUES (?, ?, ?, ?, ?, ?)";
  db.query(sql, [user_id, type, amount, upperCategory, date, note], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "Transaction added", id: result.insertId });
  });
};

exports.getTransactions = (req, res) => {
  const { user_id } = req.params;
  const sql = "SELECT * FROM transactions WHERE user_id = ? ORDER BY date DESC";
  db.query(sql, [user_id], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
};

exports.deleteTransaction = (req, res) => {
  const { id } = req.params;
  const sql = "DELETE FROM transactions WHERE id = ?";
  db.query(sql, [id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "Transaction deleted" });
  });
};

// Budgets
exports.setBudget = (req, res) => {
  const { user_id, category, monthly_limit, month } = req.body;
  // This uses a simpler INSERT setup since MySQL ON DUPLICATE lacks simple index definitions if we assume composite unique wasn't added
  const upperCategory = category ? category.toUpperCase() : "GENERAL";
  const checkSql = "SELECT * FROM budgets WHERE user_id = ? AND category = ? AND month = ?";
  db.query(checkSql, [user_id, upperCategory, month], (err, results) => {
    if (results.length > 0) {
      const updateSql = "UPDATE budgets SET monthly_limit = ? WHERE id = ?";
      db.query(updateSql, [monthly_limit, results[0].id], (updateErr) => {
        if (updateErr) return res.status(500).json({ error: updateErr.message });
        return res.json({ message: "Budget updated" });
      });
    } else {
      const insertSql = "INSERT INTO budgets (user_id, category, monthly_limit, month) VALUES (?, ?, ?, ?)";
      db.query(insertSql, [user_id, upperCategory, monthly_limit, month], (insertErr, result) => {
        if (insertErr) return res.status(500).json({ error: insertErr.message });
        return res.json({ message: "Budget set", id: result.insertId });
      });
    }
  });
};

exports.getBudgets = (req, res) => {
  const { user_id } = req.params;
  const sql = "SELECT * FROM budgets WHERE user_id = ?";
  db.query(sql, [user_id], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
};

// Monthly Summary
exports.getMonthlySummary = (req, res) => {
  const { user_id } = req.params;
  const sql = `
    SELECT 
      (SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE user_id = ? AND type = 'income' AND MONTH(date) = MONTH(CURDATE()) AND YEAR(date) = YEAR(CURDATE())) as total_income,
      (SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE user_id = ? AND type = 'expense' AND MONTH(date) = MONTH(CURDATE()) AND YEAR(date) = YEAR(CURDATE())) as total_expense
  `;
  db.query(sql, [user_id, user_id], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results[0]);
  });
};
