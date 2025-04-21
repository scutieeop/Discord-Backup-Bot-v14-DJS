import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Log directory
const logsDir = path.join(__dirname, '..', 'logs');

/**
 * Log a message to a file
 * @param {string} filename - Log filename
 * @param {string} message - Message to log
 * @returns {Promise<void>}
 */
export async function logToFile(filename, message) {
  try {
    // Create logs directory if not exists
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
    
    const logPath = path.join(logsDir, filename);
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}\n`;
    
    // Append log to file
    fs.appendFileSync(logPath, logMessage);
  } catch (error) {
    console.error(`Error logging to file ${filename}:`, error);
  }
}

/**
 * Get logs from a file
 * @param {string} filename - Log filename
 * @param {number} lines - Number of lines to retrieve (default: 50)
 * @returns {Promise<string[]>} Array of log lines
 */
export async function getLogsFromFile(filename, lines = 50) {
  try {
    const logPath = path.join(logsDir, filename);
    
    // Check if log file exists
    if (!fs.existsSync(logPath)) {
      return [];
    }
    
    // Read log file
    const content = fs.readFileSync(logPath, 'utf8');
    
    // Split into lines and get the last 'lines' lines
    return content.split('\n')
      .filter(line => line.trim()) // Remove empty lines
      .slice(-lines); // Get the last 'lines' lines
  } catch (error) {
    console.error(`Error reading log file ${filename}:`, error);
    return [];
  }
}

/**
 * Get available log files
 * @returns {Promise<string[]>} Array of log filenames
 */
export async function getLogFiles() {
  try {
    // Create logs directory if not exists
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
      return [];
    }
    
    // Read log directory
    return fs.readdirSync(logsDir)
      .filter(file => file.endsWith('.log'))
      .sort();
  } catch (error) {
    console.error('Error getting log files:', error);
    return [];
  }
} 