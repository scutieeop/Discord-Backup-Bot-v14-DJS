import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Collection } from 'discord.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Loads commands into the client's commands collection
 * @param {Client} client - The Discord client
 */
export async function loadCommands(client) {
  client.commands = new Collection();
  
  const commandsPath = path.join(__dirname, 'commands');
  const commandFolders = fs.readdirSync(commandsPath);
  
  for (const folder of commandFolders) {
    const folderPath = path.join(commandsPath, folder);
    
    // Skip if not a directory
    if (!fs.statSync(folderPath).isDirectory()) continue;
    
    const commandFiles = fs.readdirSync(folderPath).filter(file => file.endsWith('.js'));
    
    for (const file of commandFiles) {
      const filePath = `file://${path.join(folderPath, file).replace(/\\/g, '/')}`;
      const command = await import(filePath);
      
      if ('data' in command && 'execute' in command) {
        client.commands.set(command.data.name, command);
        console.log(`[✓] Komut yüklendi: ${command.data.name}`);
      } else {
        console.log(`[✗] ${filePath} komutunda data veya execute yok!`);
      }
    }
  }
} 