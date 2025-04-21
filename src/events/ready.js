import { Events } from 'discord.js';
import { logToFile } from '../utils/logger.js';

export const name = Events.ClientReady;
export const once = true;

/**
 * Executes when the client is ready
 * @param {Client} client - The Discord client
 */
export async function execute(client) {
  console.log(`[✓] Bot başlatıldı! ${client.user.tag} olarak giriş yapıldı.`);
  
  // Set bot activity
  client.user.setActivity('Sunucu Yedekleme', { type: 'WATCHING' });
  
  // Log bot startup
  await logToFile('system.log', `Bot başlatıldı: ${client.user.tag} (${client.user.id})`);
  
  // Check if there are any guild members that need role recovery
  client.guilds.cache.forEach(async guild => {
    await logToFile('system.log', `Sunucuya bağlandı: ${guild.name} (${guild.id})`);
  });
} 