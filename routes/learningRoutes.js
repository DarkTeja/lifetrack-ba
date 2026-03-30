const express = require("express");
const router = express.Router();

const learningController = require("../controllers/learningController");

// Basic CRUD for Sessions
router.post("/session", learningController.addSession);
router.get("/sessions/:user_id", learningController.getSessions);
router.delete("/session/:id", learningController.deleteSession);

// Goals
router.post("/goal", learningController.addGoal);
router.get("/goals/:user_id", learningController.getGoals);

// Scores
router.post("/score", learningController.addScore);
router.get("/scores/:user_id", learningController.getScores);

// Summaries
router.get("/summary/weekly/:user_id", learningController.getWeeklySummary);

module.exports = router;
