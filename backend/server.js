import express from "express";
import cors from "cors";
import path from "path";
import dotenv from "dotenv";
import { connectDB } from "./config/database.js";
import authRoutes from "./routes/authRoutes.js";
import settingsRoutes from "./routes/settingsRoutes.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { logMessage } from "./utils/logger.js";

dotenv.config({ path: path.join(process.cwd(), "backend", ".env") });

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true, limit: "20mb" }));

// Connect Database
connectDB().then(() => {
  logMessage("info", "Database initialized.");
});

// Serve uploaded assets
const uploadsDir = path.join(process.cwd(), "uploads");
app.use("/uploads", express.static(uploadsDir));

// Modular REST Routes
app.use("/api/auth", authRoutes);
app.use("/api/settings", settingsRoutes);

// Error Handler
app.use(errorHandler);

export default app;
