import fs from "fs";
import path from "path";

const logsDir = path.join(process.cwd(), "backend", "logs");
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

export const logMessage = (level, message) => {
  const timestamp = new Date().toISOString();
  const logLine = `[${timestamp}] [${level.toUpperCase()}] ${message}\n`;
  console.log(`[${level.toUpperCase()}] ${message}`);
  try {
    fs.appendFileSync(path.join(logsDir, "app.log"), logLine);
  } catch (err) {
    // Ignore error
  }
};
