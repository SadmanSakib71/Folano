import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import db from "./config/database";
import authRoutes from "./routes/authRoutes";
import productRoutes from "./routes/productRoutes";
import categoryRoutes from "./routes/categoryRoutes";
import orderRoutes from "./routes/orderRoutes";
import preorderBatchRoutes from "./routes/preorderBatchRoutes";

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

app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/preorder-batches", preorderBatchRoutes);

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
