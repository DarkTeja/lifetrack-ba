const express = require("express");
const router = express.Router();
const financeController = require("../controllers/financeController");

router.post("/transaction", financeController.addTransaction);
router.get("/transactions/:user_id", financeController.getTransactions);
router.delete("/transaction/:id", financeController.deleteTransaction);

router.post("/budget", financeController.setBudget);
router.get("/budgets/:user_id", financeController.getBudgets);

router.get("/summary/monthly/:user_id", financeController.getMonthlySummary);

module.exports = router;
