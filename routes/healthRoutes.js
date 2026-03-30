const express = require("express");
const router = express.Router();
const healthController = require("../controllers/healthController");

router.post("/workout", healthController.addWorkout);
router.get("/workouts/:user_id", healthController.getWorkouts);

router.post("/sleep", healthController.addSleep);
router.get("/sleep/:user_id", healthController.getSleepLogs);

router.post("/water", healthController.addWater);
router.get("/water/:user_id", healthController.getWaterLogs);

router.get("/summary/weekly/:user_id", healthController.getWeeklySummary);

module.exports = router;
