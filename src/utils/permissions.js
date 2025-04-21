import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { logToFile } from './logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Permissions file path
const permissionsFile = path.join(__dirname, '..', 'data', 'permissions.json');

/**
 * Set permission for a command
 * @param {string} commandName - Command name
 * @param {string} roleId - Role ID
 * @returns {Promise<boolean>} Success
 */
export async function setCommandPermission(commandName, roleId) {
  try {
    // Create data directory if it doesn't exist
    const dataDir = path.dirname(permissionsFile);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    // Read existing permissions or create new
    let permissions = {};
    if (fs.existsSync(permissionsFile)) {
      permissions = JSON.parse(fs.readFileSync(permissionsFile, 'utf8'));
    }
    
    // Set permission
    permissions[commandName] = roleId;
    
    // Save permissions
    fs.writeFileSync(permissionsFile, JSON.stringify(permissions, null, 2), 'utf8');
    
    // Log permission change
    await logToFile('permissions.log', `Command permission set: ${commandName} -> ${roleId}`);
    
    return true;
  } catch (error) {
    console.error('Error setting command permission:', error);
    return false;
  }
}

/**
 * Check if a user has permission to use a command
 * @param {string} commandName - Command name
 * @param {GuildMember} member - Guild member
 * @returns {Promise<boolean>} Has permission
 */
export async function hasCommandPermission(commandName, member) {
  try {
    // If user is an administrator or the server owner, always allow
    if (member.permissions.has('Administrator') || member.id === member.guild.ownerId) {
      return true;
    }
    
    // If permissions file doesn't exist, assume no restrictions
    if (!fs.existsSync(permissionsFile)) {
      return true;
    }
    
    // Read permissions
    const permissions = JSON.parse(fs.readFileSync(permissionsFile, 'utf8'));
    
    // If command has no specific permission, allow
    if (!permissions[commandName]) {
      return true;
    }
    
    // Check if user has the required role
    return member.roles.cache.has(permissions[commandName]);
  } catch (error) {
    console.error('Error checking command permission:', error);
    return false;
  }
}

/**
 * Get all command permissions
 * @returns {Promise<Object>} Permissions object
 */
export async function getCommandPermissions() {
  try {
    // If permissions file doesn't exist, return empty object
    if (!fs.existsSync(permissionsFile)) {
      return {};
    }
    
    // Read permissions
    return JSON.parse(fs.readFileSync(permissionsFile, 'utf8'));
  } catch (error) {
    console.error('Error getting command permissions:', error);
    return {};
  }
}

/**
 * Remove permission for a command
 * @param {string} commandName - Command name
 * @returns {Promise<boolean>} Success
 */
export async function removeCommandPermission(commandName) {
  try {
    // If permissions file doesn't exist, nothing to remove
    if (!fs.existsSync(permissionsFile)) {
      return true;
    }
    
    // Read permissions
    const permissions = JSON.parse(fs.readFileSync(permissionsFile, 'utf8'));
    
    // If command doesn't have specific permission, nothing to remove
    if (!permissions[commandName]) {
      return true;
    }
    
    // Remove permission
    delete permissions[commandName];
    
    // Save permissions
    fs.writeFileSync(permissionsFile, JSON.stringify(permissions, null, 2), 'utf8');
    
    // Log permission change
    await logToFile('permissions.log', `Command permission removed: ${commandName}`);
    
    return true;
  } catch (error) {
    console.error('Error removing command permission:', error);
    return false;
  }
} 