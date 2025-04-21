import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Collection } from 'discord.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Loads button handlers into the client's button collection
 * @param {Client} client - The Discord client
 */
export async function loadButtons(client) {
  client.buttons = new Collection();
  
  const buttonsPath = path.join(__dirname, 'buttons');
  
  // Check if buttons directory exists
  if (!fs.existsSync(buttonsPath)) {
    return;
  }
  
  const buttonFiles = fs.readdirSync(buttonsPath).filter(file => file.endsWith('.js'));
  
  for (const file of buttonFiles) {
    const filePath = `file://${path.join(buttonsPath, file).replace(/\\/g, '/')}`;
    const button = await import(filePath);
    
    // Extract button name from filename
    const buttonName = file.split('.')[0];
    
    if ('execute' in button) {
      client.buttons.set(buttonName, button);
      console.log(`[✓] Buton yüklendi: ${buttonName}`);
    } else {
      console.log(`[✗] ${filePath} butonunda execute fonksiyonu yok!`);
    }
  }
} 