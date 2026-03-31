const db = require("../config/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);


// REGISTER
exports.register = async (req, res) => {
  const { first_name, last_name, email, password } = req.body;
  if (!email || !password) return res.send("Email and password required");

  const checkSql = "SELECT * FROM users WHERE email = ?";
  db.query(checkSql, [email], async (err, results) => {
    if (err) return res.status(500).send("Database error");
    
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedPassword = await bcrypt.hash(password, 10);
    
    if (results.length > 0) {
      if (results[0].is_verified) return res.send("Email already exists");
      
      const updateSql = "UPDATE users SET password=?, first_name=?, last_name=?, otp_code=?, otp_expires=DATE_ADD(NOW(), INTERVAL 10 MINUTE) WHERE email=?";
      db.query(updateSql, [hashedPassword, first_name, last_name, otp, email], async (uErr) => {
        if (uErr) return res.status(500).send("Failed to update unverified user");
        try {
          await emailService.sendVerificationEmail(email, otp);
          res.send("Verification OTP sent");
        } catch (mailErr) {
          res.send("Failed to send verify email: " + mailErr.message);
        }
      });
      return;
    }

    const insertSql = "INSERT INTO users (first_name, last_name, email, password, is_verified, otp_code, otp_expires) VALUES (?, ?, ?, ?, 0, ?, DATE_ADD(NOW(), INTERVAL 10 MINUTE))";
    db.query(insertSql, [first_name, last_name, email, hashedPassword, otp], async (iErr) => {
      if (iErr) return res.status(500).send("Database error during registration");
      try {
        await emailService.sendVerificationEmail(email, otp);
        res.send("Verification OTP sent");
      } catch (mailErr) {
        res.send("Failed to send verify email: " + mailErr.message);
      }
    });
  });
};

exports.registerVerify = (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) return res.send("Email and OTP required");

  const sql = "SELECT * FROM users WHERE email = ? AND otp_code = ? AND otp_expires > NOW() AND is_verified = 0";
  db.query(sql, [email, otp], (err, results) => {
    if (err) return res.status(500).send("Database error");
    if (results.length === 0) return res.send("Invalid or expired OTP");

    const user = results[0];
    const updateSql = "UPDATE users SET is_verified = 1, otp_code = NULL, otp_expires = NULL WHERE email = ?";
    db.query(updateSql, [email], (uErr) => {
      if (uErr) return res.status(500).send("Failed to verify account");
      
      const token = jwt.sign({ id: user.id, email: user.email, first_name: user.first_name, last_name: user.last_name }, "secretkey", { expiresIn: "7d" });
      res.json({ message: "Registration successful", token });
    });
  });
};


// LOGIN
exports.login = (req, res) => {
  const { email, password } = req.body;

  const sql = "SELECT * FROM users WHERE email = ?";

  db.query(sql, [email], async (err, results) => {
    if (err) {
      console.error("Login DB Error:", err);
      return res.send("Database error: " + err.message);
    }
    
    if (results.length === 0) {
      return res.send("User not found");
    }

    const user = results[0];

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.send("Invalid password");
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, first_name: user.first_name, last_name: user.last_name },
      "secretkey",
      { expiresIn: "1h" }
    );

    res.json({
      message: "Login successful",
      token
    });
  });
};

exports.googleLogin = async (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(400).json({ error: "Token required" });

  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const { email, given_name, family_name } = payload;

    const sql = "SELECT * FROM users WHERE email = ?";
    db.query(sql, [email], async (err, results) => {
      if (err) {
        console.error("Google Login DB Check Error:", err);
        return res.status(500).json({ error: "Database error during check" });
      }

      if (results.length > 0) {
        const user = results[0];
        const sessionToken = jwt.sign(
          { id: user.id, email: user.email, first_name: user.first_name, last_name: user.last_name },
          process.env.JWT_SECRET || "secretkey",
          { expiresIn: "7d" }
        );
        return res.json({ message: "Login successful", token: sessionToken });
      } else {
        const randomPass = Math.random().toString(36).slice(-10);
        const hashedPassword = await bcrypt.hash(randomPass, 10);
        const insertSql = "INSERT INTO users (first_name, last_name, email, password, is_verified) VALUES (?, ?, ?, ?, 1)";
        
        db.query(insertSql, [given_name || 'Google', family_name || 'User', email, hashedPassword], (iErr, result) => {
          if (iErr) {
            console.error("Google Login User Creation Error:", iErr);
            return res.status(500).json({ error: "Account creation failed" });
          }
          
          const sessionToken = jwt.sign(
            { id: result.insertId, email, first_name: given_name, last_name: family_name },
            process.env.JWT_SECRET || "secretkey",
            { expiresIn: "7d" }
          );
          res.json({ message: "Account created via Google", token: sessionToken });
        });
      }
    });
  } catch (error) {
    console.error("Google Token Verification Failed:", error.message);
    res.status(401).json({ error: "Invalid Google token: " + error.message });
  }
};



const emailService = require("../services/email");

exports.forgotPassword = (req, res) => {
  const { email } = req.body;
  if (!email) return res.send("Email is required");

  const sql = "SELECT * FROM users WHERE email = ?";
  db.query(sql, [email], async (err, results) => {
    if (err) return res.status(500).send("Database error");
    if (results.length === 0) return res.send("User not found"); 

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const updateSql = "UPDATE users SET otp_code = ?, otp_expires = DATE_ADD(NOW(), INTERVAL 10 MINUTE) WHERE email = ?";
    
    db.query(updateSql, [otp, email], async (uErr) => {
      if (uErr) return res.status(500).send("Failed to generate OTP");
      
      try {
        await emailService.sendOtpEmail(email, otp);
        res.send("OTP sent successfully");
      } catch (mailErr) {
        console.error("Mail Error:", mailErr);
        res.send("Failed to dispatch email: " + mailErr.message);
      }
    });
  });
};

exports.verifyOtp = (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) return res.send("Email and OTP required");

  const sql = "SELECT * FROM users WHERE email = ? AND otp_code = ? AND otp_expires > NOW()";
  db.query(sql, [email, otp], (err, results) => {
    if (err) return res.status(500).send("Database error");
    if (results.length === 0) return res.send("Invalid or expired OTP");
    
    res.send("OTP verified");
  });
};

exports.resetPassword = (req, res) => {
  const { email, otp, newPassword } = req.body;
  if (!email || !otp || !newPassword) return res.status(400).send("Missing parameters");

  const sql = "SELECT * FROM users WHERE email = ? AND otp_code = ? AND otp_expires > NOW()";
  db.query(sql, [email, otp], async (err, results) => {
    if (err) return res.status(500).send("Database error");
    if (results.length === 0) return res.send("Verification failed or expired");
    
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const updateSql = "UPDATE users SET password = ?, otp_code = NULL, otp_expires = NULL WHERE email = ?";
    
    db.query(updateSql, [hashedPassword, email], (uErr) => {
      if (uErr) return res.status(500).send("Failed to update password");
      res.send("Password reset successfully");
    });
  });
};

exports.updateProfile = (req, res) => {
  const { id, first_name, last_name, email } = req.body;
  if (!id || !first_name || !last_name || !email) return res.status(400).send("Missing profile fields");

  const sql = "UPDATE users SET first_name = ?, last_name = ?, email = ? WHERE id = ?";
  db.query(sql, [first_name, last_name, email, id], (err) => {
    if (err) return res.status(500).send("Database error updating profile");
    
    // Reflash and encode the user's updated session token natively
    const token = jwt.sign({ id, email, first_name, last_name }, "secretkey", { expiresIn: "7d" });
    res.json({ message: "Profile securely updated", token });
  });
};

exports.updatePassword = async (req, res) => {
  const { id, currentPassword, newPassword } = req.body;
  if (!id || !currentPassword || !newPassword) return res.status(400).send("Missing active credentials");

  const sql = "SELECT * FROM users WHERE id = ?";
  db.query(sql, [id], async (err, results) => {
    if (err) return res.status(500).send("Database error resolving profile");
    if (results.length === 0) return res.status(404).send("User session unbound");

    const user = results[0];
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) return res.status(400).send("Incorrect current authentication string");

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const updateSql = "UPDATE users SET password = ? WHERE id = ?";
    db.query(updateSql, [hashedPassword, id], (uErr) => {
      if (uErr) return res.status(500).send("Failed to deploy password override schema");
      res.send("Password override successful");
    });
  });
};