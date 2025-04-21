import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto-js';
import { randomUUID } from 'crypto';
import { PermissionsBitField } from 'discord.js';
import { logToFile } from './logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Paths
const backupsDir = path.join(__dirname, '..', 'data', 'backups');
const historyFile = path.join(__dirname, '..', 'data', 'yedek-gecmisi.json');

/**
 * Create a backup of the server
 * @param {Guild} guild - The guild to backup
 * @param {User} user - The user who initiated the backup
 * @param {string} password - Optional password for encryption
 * @returns {Promise<{id: string, success: boolean, error: string|null}>}
 */
export async function createBackup(guild, user, password = null) {
  try {
    // Generate unique ID for the backup
    const backupId = randomUUID().substring(0, 8);
    
    // Initialize backup object
    const backup = {
      id: backupId,
      name: guild.name,
      icon: guild.iconURL({ format: 'png' }),
      createdAt: new Date().toISOString(),
      createdBy: {
        id: user.id,
        tag: user.tag
      },
      roles: [],
      channels: [],
      users: []
    };
    
    // Backup roles
    const roles = Array.from(guild.roles.cache.values())
      .filter(role => role.id !== guild.id) // Filter out @everyone role
      .sort((a, b) => b.position - a.position); // Sort by position (highest first)
    
    for (const role of roles) {
      backup.roles.push({
        id: role.id,
        name: role.name,
        color: role.hexColor,
        hoist: role.hoist,
        position: role.position,
        permissions: role.permissions.bitfield.toString(),
        mentionable: role.mentionable
      });
      
      await logToFile('roles.log', `Role backup: ${role.name} (${role.id})`);
    }
    
    // Backup channels
    const categories = guild.channels.cache
      .filter(channel => channel.type === 4) // CategoryChannel
      .sort((a, b) => a.position - b.position); // Sort by position
      
    const channels = guild.channels.cache
      .filter(channel => channel.type !== 4) // Not a category
      .sort((a, b) => a.position - b.position); // Sort by position
    
    // Add categories first
    for (const category of categories.values()) {
      const categoryData = {
        id: category.id,
        name: category.name,
        type: 'category',
        position: category.position,
        permissionOverwrites: []
      };
      
      // Backup permission overwrites
      category.permissionOverwrites.cache.forEach(overwrite => {
        categoryData.permissionOverwrites.push({
          id: overwrite.id,
          type: overwrite.type,
          allow: overwrite.allow.bitfield.toString(),
          deny: overwrite.deny.bitfield.toString()
        });
      });
      
      backup.channels.push(categoryData);
      await logToFile('channels.log', `Category backup: ${category.name} (${category.id})`);
    }
    
    // Then add all other channels
    for (const channel of channels.values()) {
      const channelData = {
        id: channel.id,
        name: channel.name,
        type: channel.type === 0 ? 'text' : 
              channel.type === 2 ? 'voice' : 
              channel.type === 5 ? 'announcement' : 'unknown',
        position: channel.position,
        parentId: channel.parentId,
        topic: channel.topic || null,
        nsfw: channel.nsfw || false,
        rateLimitPerUser: channel.rateLimitPerUser || 0,
        bitrate: channel.bitrate || null,
        userLimit: channel.userLimit || null,
        permissionOverwrites: []
      };
      
      // Backup permission overwrites
      channel.permissionOverwrites.cache.forEach(overwrite => {
        channelData.permissionOverwrites.push({
          id: overwrite.id,
          type: overwrite.type,
          allow: overwrite.allow.bitfield.toString(),
          deny: overwrite.deny.bitfield.toString()
        });
      });
      
      backup.channels.push(channelData);
      await logToFile('channels.log', `Channel backup: ${channel.name} (${channel.id})`);
    }
    
    // Backup user roles
    const members = await guild.members.fetch();
    
    for (const member of members.values()) {
      if (member.user.bot) continue; // Skip bots
      
      const userRoles = member.roles.cache
        .filter(role => role.id !== guild.id) // Filter out @everyone
        .map(role => role.id);
      
      backup.users.push({
        id: member.user.id,
        tag: member.user.tag,
        roles: userRoles
      });
      
      await logToFile('kullanici_rolleri.log', `User roles backup: ${member.user.tag} (${member.user.id}) - ${userRoles.length} roles`);
    }
    
    // Make sure the backups directory exists
    if (!fs.existsSync(backupsDir)) {
      fs.mkdirSync(backupsDir, { recursive: true });
    }
    
    // Serialize backup data
    let backupData = JSON.stringify(backup, null, 2);
    
    // Encrypt if password is provided
    if (password) {
      backupData = crypto.AES.encrypt(backupData, password).toString();
    }
    
    // Save backup file
    const backupPath = path.join(backupsDir, `${backupId}.json`);
    fs.writeFileSync(backupPath, backupData);
    
    // Update backup history
    await updateBackupHistory({
      id: backupId,
      name: guild.name,
      timestamp: backup.createdAt,
      userId: user.id,
      userTag: user.tag,
      type: 'create',
      isEncrypted: !!password
    });
    
    await logToFile('yedek-gecmisi.log', `Backup created: ${backupId} by ${user.tag} (${user.id})`);
    
    return {
      id: backupId,
      success: true,
      error: null
    };
  } catch (error) {
    console.error('Backup error:', error);
    return {
      id: null,
      success: false,
      error: error.message
    };
  }
}

/**
 * Load a backup to the server
 * @param {string} backupId - The backup ID to load
 * @param {Guild} guild - The guild to load the backup to
 * @param {User} user - The user who initiated the loading
 * @param {string} password - Optional password for decryption
 * @param {string} mode - Loading mode: 'tam', 'roller', 'kanallar', 'sade'
 * @returns {Promise<{success: boolean, error: string|null, missingUsers: string[]}>}
 */
export async function loadBackup(backupId, guild, user, password = null, mode = 'tam') {
  try {
    const backupPath = path.join(backupsDir, `${backupId}.json`);
    
    // Check if backup exists
    if (!fs.existsSync(backupPath)) {
      return {
        success: false,
        error: 'backup_not_found',
        missingUsers: []
      };
    }
    
    // Read backup file
    let backupData = fs.readFileSync(backupPath, 'utf8');
    
    // Try to decrypt if needed
    try {
      // Check if data is encrypted (it will be a long string without JSON structure)
      const isEncrypted = !backupData.trim().startsWith('{');
      
      if (isEncrypted) {
        if (!password) {
          return {
            success: false,
            error: 'password_required',
            missingUsers: []
          };
        }
        
        const decrypted = crypto.AES.decrypt(backupData, password).toString(crypto.enc.Utf8);
        
        if (!decrypted) {
          return {
            success: false,
            error: 'wrong_password',
            missingUsers: []
          };
        }
        
        backupData = decrypted;
      }
    } catch (decryptError) {
      return {
        success: false,
        error: 'decryption_failed',
        missingUsers: []
      };
    }
    
    // Parse backup data
    const backup = JSON.parse(backupData);
    const missingUsers = [];
    
    // Load based on mode
    if (mode === 'tam' || mode === 'sade') {
      // Set server name and icon (basic settings)
      await guild.setName(backup.name);
      if (backup.icon) {
        await guild.setIcon(backup.icon);
      }
    }
    
    if (mode === 'tam' || mode === 'roller') {
      // Delete all roles except @everyone and managed roles
      const rolesToDelete = guild.roles.cache.filter(role => 
        role.id !== guild.id && // Not @everyone
        !role.managed && // Not managed by integrations/bots
        guild.members.me.roles.highest.position > role.position // Bot has permission to delete
      );
      
      for (const [, role] of rolesToDelete) {
        try {
          await role.delete(`Backup load: ${backupId}`);
          await logToFile('roles.log', `Deleted role: ${role.name} (${role.id})`);
        } catch (error) {
          await logToFile('roles.log', `Failed to delete role: ${role.name} (${role.id}) - ${error.message}`);
        }
      }
      
      // Create roles
      const createdRoles = new Map();
      
      // Create roles from highest to lowest position
      for (const roleData of [...backup.roles].sort((a, b) => b.position - a.position)) {
        try {
          const newRole = await guild.roles.create({
            name: roleData.name,
            color: roleData.color,
            hoist: roleData.hoist,
            position: roleData.position,
            permissions: BigInt(roleData.permissions),
            mentionable: roleData.mentionable,
            reason: `Backup load: ${backupId}`
          });
          
          createdRoles.set(roleData.id, newRole.id);
          await logToFile('roles.log', `Created role: ${roleData.name} (${newRole.id}) from backup role ${roleData.id}`);
        } catch (error) {
          await logToFile('roles.log', `Failed to create role: ${roleData.name} - ${error.message}`);
        }
      }
      
      // Restore user roles
      const members = await guild.members.fetch();
      
      for (const userData of backup.users) {
        const member = members.get(userData.id);
        
        if (member) {
          const rolesToAdd = userData.roles
            .map(roleId => createdRoles.get(roleId))
            .filter(Boolean); // Filter out undefined roles
            
          if (rolesToAdd.length > 0) {
            try {
              await member.roles.add(rolesToAdd, `Backup load: ${backupId}`);
              await logToFile('kullanici_rolleri.log', `Restored roles for: ${member.user.tag} (${member.user.id}) - ${rolesToAdd.length} roles`);
            } catch (error) {
              await logToFile('kullanici_rolleri.log', `Failed to restore roles for: ${member.user.tag} (${member.user.id}) - ${error.message}`);
            }
          }
        } else {
          missingUsers.push(userData.tag || userData.id);
          await logToFile('kayip_kullanicilar.log', `Missing user: ${userData.tag || userData.id} (${userData.id})`);
        }
      }
    }
    
    if (mode === 'tam' || mode === 'kanallar') {
      // Delete all channels
      for (const [, channel] of guild.channels.cache) {
        try {
          await channel.delete(`Backup load: ${backupId}`);
          await logToFile('channels.log', `Deleted channel: ${channel.name} (${channel.id})`);
        } catch (error) {
          await logToFile('channels.log', `Failed to delete channel: ${channel.name} (${channel.id}) - ${error.message}`);
        }
      }
      
      // Map to store created categories for parenting
      const createdCategories = new Map();
      
      // Create categories first
      const categories = backup.channels.filter(c => c.type === 'category');
      
      for (const categoryData of categories) {
        try {
          const permissionOverwrites = categoryData.permissionOverwrites.map(overwrite => ({
            id: overwrite.id,
            type: overwrite.type,
            allow: BigInt(overwrite.allow),
            deny: BigInt(overwrite.deny)
          }));
          
          const newCategory = await guild.channels.create({
            name: categoryData.name,
            type: 4, // CategoryChannel
            permissionOverwrites,
            position: categoryData.position,
            reason: `Backup load: ${backupId}`
          });
          
          createdCategories.set(categoryData.id, newCategory.id);
          await logToFile('channels.log', `Created category: ${categoryData.name} (${newCategory.id}) from backup category ${categoryData.id}`);
        } catch (error) {
          await logToFile('channels.log', `Failed to create category: ${categoryData.name} - ${error.message}`);
        }
      }
      
      // Create other channels
      const channels = backup.channels.filter(c => c.type !== 'category');
      
      for (const channelData of channels) {
        try {
          const permissionOverwrites = channelData.permissionOverwrites.map(overwrite => ({
            id: overwrite.id,
            type: overwrite.type,
            allow: BigInt(overwrite.allow),
            deny: BigInt(overwrite.deny)
          }));
          
          const channelType = 
            channelData.type === 'text' ? 0 :
            channelData.type === 'voice' ? 2 :
            channelData.type === 'announcement' ? 5 : 0;
          
          const channelOptions = {
            name: channelData.name,
            type: channelType,
            permissionOverwrites,
            position: channelData.position,
            topic: channelData.topic,
            nsfw: channelData.nsfw,
            parent: channelData.parentId ? createdCategories.get(channelData.parentId) : null,
            reason: `Backup load: ${backupId}`
          };
          
          // Add voice-specific options
          if (channelData.type === 'voice') {
            channelOptions.bitrate = channelData.bitrate;
            channelOptions.userLimit = channelData.userLimit;
          }
          
          // Add text-specific options
          if (channelData.type === 'text') {
            channelOptions.rateLimitPerUser = channelData.rateLimitPerUser;
          }
          
          const newChannel = await guild.channels.create(channelOptions);
          
          await logToFile('channels.log', `Created channel: ${channelData.name} (${newChannel.id}) from backup channel ${channelData.id}`);
        } catch (error) {
          await logToFile('channels.log', `Failed to create channel: ${channelData.name} - ${error.message}`);
        }
      }
    }
    
    // Update backup history
    await updateBackupHistory({
      id: backupId,
      name: guild.name,
      timestamp: new Date().toISOString(),
      userId: user.id,
      userTag: user.tag,
      type: 'load',
      mode: mode
    });
    
    await logToFile('yedek-gecmisi.log', `Backup loaded: ${backupId} by ${user.tag} (${user.id}) - Mode: ${mode}`);
    
    return {
      success: true,
      error: null,
      missingUsers
    };
  } catch (error) {
    console.error('Backup load error:', error);
    return {
      success: false,
      error: error.message,
      missingUsers: []
    };
  }
}

/**
 * Get all available backups
 * @returns {Promise<Array>} List of backup metadata
 */
export async function getBackups() {
  try {
    // Create backups directory if not exists
    if (!fs.existsSync(backupsDir)) {
      fs.mkdirSync(backupsDir, { recursive: true });
      return [];
    }
    
    // Read backup files
    const files = fs.readdirSync(backupsDir)
      .filter(file => file.endsWith('.json'));
    
    const backups = [];
    
    for (const file of files) {
      const backupId = file.replace('.json', '');
      const backupPath = path.join(backupsDir, file);
      
      try {
        const stats = fs.statSync(backupPath);
        let backupName = "Unknown";
        let isEncrypted = false;
        
        // Try to read the backup content (just to get the name)
        const backupContent = fs.readFileSync(backupPath, 'utf8');
        
        // Check if it's encrypted
        if (!backupContent.trim().startsWith('{')) {
          isEncrypted = true;
        } else {
          // If not encrypted, parse to get server name
          const backupData = JSON.parse(backupContent);
          backupName = backupData.name;
        }
        
        backups.push({
          id: backupId,
          name: backupName,
          createdAt: stats.mtime,
          size: stats.size,
          isEncrypted
        });
      } catch (error) {
        console.error(`Error reading backup ${backupId}:`, error);
        // Include basic info even if parsing failed
        backups.push({
          id: backupId,
          name: "Corrupted Backup",
          createdAt: new Date(0),
          size: 0,
          isEncrypted: false,
          corrupted: true
        });
      }
    }
    
    // Sort by creation date (newest first)
    return backups.sort((a, b) => b.createdAt - a.createdAt);
  } catch (error) {
    console.error('Error getting backups:', error);
    return [];
  }
}

/**
 * Get backup history
 * @returns {Promise<Array>} List of backup history entries
 */
export async function getBackupHistory() {
  try {
    // Create history file if not exists
    if (!fs.existsSync(historyFile)) {
      fs.writeFileSync(historyFile, JSON.stringify([], null, 2));
      return [];
    }
    
    // Read history file
    const history = JSON.parse(fs.readFileSync(historyFile, 'utf8'));
    
    // Sort by timestamp (newest first)
    return history.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  } catch (error) {
    console.error('Error getting backup history:', error);
    return [];
  }
}

/**
 * Update backup history
 * @param {Object} historyEntry - The history entry to add
 */
async function updateBackupHistory(historyEntry) {
  try {
    // Create history file directory if not exists
    const historyDir = path.dirname(historyFile);
    if (!fs.existsSync(historyDir)) {
      fs.mkdirSync(historyDir, { recursive: true });
    }
    
    // Read existing history or create new
    let history = [];
    if (fs.existsSync(historyFile)) {
      history = JSON.parse(fs.readFileSync(historyFile, 'utf8'));
    }
    
    // Add new entry
    history.push(historyEntry);
    
    // Write updated history
    fs.writeFileSync(historyFile, JSON.stringify(history, null, 2));
  } catch (error) {
    console.error('Error updating backup history:', error);
  }
} 