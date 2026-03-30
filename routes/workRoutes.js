const express = require("express");
const router = express.Router();
const workController = require("../controllers/workController");

router.post("/session", workController.addSession);
router.get("/sessions/:user_id", workController.getSessions);

router.post("/task", workController.addTask);
router.get("/tasks/:user_id", workController.getTasks);
router.put("/task/:id", workController.updateTaskStatus);
router.delete("/task/:id", workController.deleteTask);

router.get("/summary/weekly/:user_id", workController.getWeeklySummary);

module.exports = router;
