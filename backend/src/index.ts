import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import db from "./config/database";

// Load variables from .env into process.env
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Simple health check used to confirm the server is running
app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

async function testDatabaseConnection() {
  try {
    await db.raw("SELECT 1");
    console.log("Database connected successfully");
  } catch (error) {
    console.error("Database connection failed:", error);
  }
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

testDatabaseConnection();
