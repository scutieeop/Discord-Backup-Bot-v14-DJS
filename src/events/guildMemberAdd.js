import { Events } from 'discord.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getSettings } from '../utils/settings.js';
import { logToFile } from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Backup directory
const backupsDir = path.join(__dirname, '..', 'data', 'backups');

export const name = Events.GuildMemberAdd;
export const once = false;

/**
 * Executes when a member joins a guild
 * @param {GuildMember} member - The guild member
 */
export async function execute(member) {
  // Skip bots
  if (member.user.bot) return;
  
  // Get guild settings
  const settings = await getSettings(member.guild.id);
  
  // Check if auto role recovery is enabled
  if (!settings.autoRoleRecovery) return;
  
  try {
    // Get all backups for the guild
    const backups = fs.readdirSync(backupsDir)
      .filter(file => file.endsWith('.json'));
    
    if (backups.length === 0) return;
    
    // Sort backups by modification time (newest first)
    const sortedBackups = backups
      .map(file => {
        const filePath = path.join(backupsDir, file);
        return {
          id: file.replace('.json', ''),
          mtime: fs.statSync(filePath).mtime,
          path: filePath
        };
      })
      .sort((a, b) => b.mtime - a.mtime);
    
    // Check each backup for user roles (newest first)
    for (const backup of sortedBackups) {
      try {
        // Read backup file
        const backupData = fs.readFileSync(backup.path, 'utf8');
        
        // Skip encrypted backups
        if (!backupData.trim().startsWith('{')) continue;
        
        // Parse backup data
        const backupObj = JSON.parse(backupData);
        
        // Find user in backup
        const userBackup = backupObj.users.find(u => u.id === member.user.id);
        
        if (userBackup && userBackup.roles.length > 0) {
          // Map old role IDs to new role IDs (by name)
          const newRoles = [];
          
          for (const oldRoleId of userBackup.roles) {
            // Find old role data
            const oldRoleData = backupObj.roles.find(r => r.id === oldRoleId);
            
            if (oldRoleData) {
              // Find equivalent role in current guild
              const newRole = member.guild.roles.cache.find(r => 
                r.name === oldRoleData.name && 
                !r.managed && 
                r.id !== member.guild.id
              );
              
              if (newRole) {
                newRoles.push(newRole.id);
              }
            }
          }
          
          // Add roles to member
          if (newRoles.length > 0) {
            try {
              await member.roles.add(newRoles, 'Otomatik rol kurtarma');
              await logToFile('role_recovery.log', `Roles recovered for user: ${member.user.tag} (${member.user.id}) - ${newRoles.length} roles`);
            } catch (roleError) {
              await logToFile('role_recovery.log', `Error recovering roles for user: ${member.user.tag} (${member.user.id}) - ${roleError.message}`);
            }
          }
          
          // We found the user in a backup, no need to check more backups
          break;
        }
      } catch (backupError) {
        // Skip corrupted backups
        continue;
      }
    }
  } catch (error) {
    await logToFile('errors.log', `Role recovery error: ${error.message}`);
  }
} 