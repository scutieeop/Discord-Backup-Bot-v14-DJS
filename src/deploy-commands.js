import { REST, Routes } from 'discord.js';
import { config } from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
config();

const commands = [];
const commandsPath = path.join(__dirname, 'commands');

// Read command files
try {
  const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = await import(filePath);
    
    if ('data' in command) {
      commands.push(command.data.toJSON());
      console.log(`[✓] Komut yüklendi: ${command.data.name}`);
    } else {
      console.log(`[✗] ${filePath} komutunda data özelliği eksik.`);
    }
  }
} catch (error) {
  console.error('Error loading commands:', error);
}

// Deploy commands
const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

try {
  console.log(`${commands.length} komut yüklenmeye başlanıyor...`);

  let data;
  
  // Check if GUILD_ID is provided for guild-specific commands
  if (process.env.GUILD_ID) {
    // Guild commands
    data = await rest.put(
      Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
      { body: commands }
    );
    
    console.log(`[✓] ${data.length} guild komutu başarıyla kaydedildi!`);
  } else {
    // Global commands
    data = await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID),
      { body: commands }
    );
    
    console.log(`[✓] ${data.length} global komut başarıyla kaydedildi!`);
  }
} catch (error) {
  console.error('Komutlar kaydedilirken bir hata oluştu:', error);
} 