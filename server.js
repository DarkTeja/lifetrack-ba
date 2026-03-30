const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();

// middleware
app.use(cors());
app.use(express.json());

// routes
const authRoutes = require("./routes/authRoutes");
const learningRoutes = require("./routes/learningRoutes");
const healthRoutes = require("./routes/healthRoutes");
const workRoutes = require("./routes/workRoutes");
const financeRoutes = require("./routes/financeRoutes");
const aiRoutes = require("./routes/aiRoutes");

const exportRoutes = require("./routes/exportRoutes");

app.use("/api/auth", authRoutes);
app.use("/api/learning", learningRoutes);
app.use("/api/health", healthRoutes);
app.use("/api/work", workRoutes);
app.use("/api/finance", financeRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/export", exportRoutes);

// test route
app.get("/", (req, res) => {
  res.send("API running");
});

app.listen(5000, () => {
  console.log("Server running on port 5000");
});