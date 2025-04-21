import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Settings file path
const settingsFile = path.join(__dirname, '..', 'data', 'settings.json');

// Default settings
const defaultSettings = {
  language: process.env.DEFAULT_LANGUAGE || 'tr',
  prefix: '!',
  autoRoleRecovery: true,
  backupReminders: false
};

/**
 * Get bot settings
 * @param {string} guildId - Guild ID
 * @returns {Promise<Object>} Settings object
 */
export async function getSettings(guildId) {
  try {
    // Create data directory if it doesn't exist
    const dataDir = path.dirname(settingsFile);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    // Read existing settings or create new
    let settings = {};
    if (fs.existsSync(settingsFile)) {
      settings = JSON.parse(fs.readFileSync(settingsFile, 'utf8'));
    }
    
    // Initialize guild settings if not exists
    if (!settings[guildId]) {
      settings[guildId] = { ...defaultSettings };
      
      // Save settings
      fs.writeFileSync(settingsFile, JSON.stringify(settings, null, 2), 'utf8');
    }
    
    return settings[guildId];
  } catch (error) {
    console.error('Error getting settings:', error);
    return { ...defaultSettings };
  }
}

/**
 * Update bot settings
 * @param {string} guildId - Guild ID
 * @param {Object} newSettings - New settings to apply
 * @returns {Promise<boolean>} Success
 */
export async function updateSettings(guildId, newSettings) {
  try {
    // Create data directory if it doesn't exist
    const dataDir = path.dirname(settingsFile);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    // Read existing settings or create new
    let settings = {};
    if (fs.existsSync(settingsFile)) {
      settings = JSON.parse(fs.readFileSync(settingsFile, 'utf8'));
    }
    
    // Initialize guild settings if not exists
    if (!settings[guildId]) {
      settings[guildId] = { ...defaultSettings };
    }
    
    // Update settings
    settings[guildId] = {
      ...settings[guildId],
      ...newSettings
    };
    
    // Save settings
    fs.writeFileSync(settingsFile, JSON.stringify(settings, null, 2), 'utf8');
    
    return true;
  } catch (error) {
    console.error('Error updating settings:', error);
    return false;
  }
}

/**
 * Get a specific setting
 * @param {string} guildId - Guild ID
 * @param {string} key - Setting key
 * @returns {Promise<any>} Setting value
 */
export async function getSetting(guildId, key) {
  const settings = await getSettings(guildId);
  return settings[key];
}

/**
 * Set a specific setting
 * @param {string} guildId - Guild ID
 * @param {string} key - Setting key
 * @param {any} value - Setting value
 * @returns {Promise<boolean>} Success
 */
export async function setSetting(guildId, key, value) {
  return await updateSettings(guildId, { [key]: value });
}

/**
 * Reset settings to default
 * @param {string} guildId - Guild ID
 * @returns {Promise<boolean>} Success
 */
export async function resetSettings(guildId) {
  return await updateSettings(guildId, { ...defaultSettings });
} 