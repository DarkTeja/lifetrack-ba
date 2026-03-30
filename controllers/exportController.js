const db = require("../config/db");

exports.exportUserData = async (req, res) => {
  const { userId } = req.params;
  
  const dbQuery = (sql, params) => new Promise((resolve, reject) => {
    db.query(sql, params, (err, results) => err ? reject(err) : resolve(results));
  });

  try {
    const study = await dbQuery("SELECT * FROM learning_sessions WHERE user_id = ?", [userId]);
    const health = await dbQuery("SELECT * FROM workouts WHERE user_id = ?", [userId]);
    const sleep = await dbQuery("SELECT * FROM sleep_logs WHERE user_id = ?", [userId]);
    const work = await dbQuery("SELECT * FROM work_sessions WHERE user_id = ?", [userId]);
    const tasks = await dbQuery("SELECT * FROM tasks WHERE user_id = ?", [userId]);
    const finance = await dbQuery("SELECT * FROM transactions WHERE user_id = ?", [userId]);
    
    let csvString = "--- LifeTrack Cross-Module Data Export ---\n\n";

    csvString += "=== STUDY LOGS ===\nId,Topic,Duration(mins),Date\n";
    study.forEach(s => csvString += `${s.id},"${s.subject}",${s.duration_mins},${s.date}\n`);

    csvString += "\n=== HEALTH & FITNESS LOGS ===\nId,Type,Duration(mins),Calories,Date\n";
    health.forEach(h => csvString += `${h.id},"${h.type}",${h.duration_mins},${h.calories_burned},${h.date}\n`);

    csvString += "\n=== SLEEP LOGS ===\nId,Hours Slept,Quality,Date\n";
    sleep.forEach(h => csvString += `${h.id},${h.hours_slept},${h.quality},${h.date}\n`);

    csvString += "\n=== WORK SESSIONS ===\nId,Project,Hours,Type,Date\n";
    work.forEach(w => csvString += `${w.id},"${w.project}",${w.hours},"${w.type}",${w.date}\n`);

    csvString += "\n=== TASK BOARD ===\nId,Title,Status,Priority,DueDate\n";
    tasks.forEach(t => csvString += `${t.id},"${t.title}","${t.status}","${t.priority}",${t.due_date}\n`);

    csvString += "\n=== FINANCIAL TRANSACTIONS ===\nId,Amount,Type,Category,Date\n";
    finance.forEach(f => csvString += `${f.id},${f.amount},"${f.type}","${f.category}",${f.date}\n`);
    
    res.setHeader('Content-Type', 'text/csv');
    res.attachment('lifetrack-export.csv');
    res.send(csvString);
  } catch (err) {
    res.status(500).json({ error: "Failed to compile cross-table database arrays." });
  }
};
