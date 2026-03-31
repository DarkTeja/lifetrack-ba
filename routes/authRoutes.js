const express = require("express");
const router = express.Router();

const authcontrollers = require("../controllers/authcontrollers");

router.post("/register", authcontrollers.register);
router.post("/register-verify", authcontrollers.registerVerify);
router.post("/login", authcontrollers.login);
router.post("/forgot-password", authcontrollers.forgotPassword);
router.post("/verify-otp", authcontrollers.verifyOtp);
router.post("/reset-password", authcontrollers.resetPassword);
router.post("/google", authcontrollers.googleLogin);
router.put("/profile", authcontrollers.updateProfile);
router.put("/update-password", authcontrollers.updatePassword);


module.exports = router;