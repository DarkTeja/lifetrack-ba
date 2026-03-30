const express = require("express");
const router = express.Router();
const exportController = require("../controllers/exportController");

router.get("/:userId", exportController.exportUserData);

module.exports = router;
