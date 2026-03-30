const express = require("express");
const router = express.Router();
const aiController = require("../controllers/aiController");

router.get("/insight/daily/:user_id", aiController.generateDailyInsight);
router.post("/chat/:user_id", aiController.chatWithAi);
router.get("/streak/:user_id", aiController.getStreak);

module.exports = router;
