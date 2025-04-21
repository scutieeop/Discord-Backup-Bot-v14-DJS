import { Client, GatewayIntentBits, Partials, Collection } from 'discord.js';
import { config } from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { setupLocales } from './utils/locales.js';
import { loadButtons } from './buttonLoader.js';

// Environment variables
config();

// Dirname setup for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create client instance
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages
  ],
  partials: [Partials.Message, Partials.Channel, Partials.GuildMember, Partials.User]
});

// Bot collections
client.commands = new Collection();
client.buttons = new Collection();
client.locales = new Collection();

// Load commands
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const filePath = `file://${path.join(commandsPath, file).replace(/\\/g, '/')}`;
  const command = await import(filePath);
  
  if ('data' in command && 'execute' in command) {
    client.commands.set(command.data.name, command);
    console.log(`[✓] Komut yüklendi: ${command.data.name}`);
  } else {
    console.log(`[✗] ${filePath} komutunda gerekli özellikler eksik!`);
  }
}

// Load events
const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
  const filePath = `file://${path.join(eventsPath, file).replace(/\\/g, '/')}`;
  const event = await import(filePath);
  
  if (event.once) {
    client.once(event.name, (...args) => event.execute(...args));
  } else {
    client.on(event.name, (...args) => event.execute(...args));
  }
  console.log(`[✓] Event yüklendi: ${event.name}`);
}

// Load buttons
await loadButtons(client);

// Create required directories if not exist
const directories = [
  './src/data',
  './src/data/backups',
  './src/logs'
];

directories.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`[✓] Dizin oluşturuldu: ${dir}`);
  }
});

// Setup localization
setupLocales(client);

// Login to Discord API
client.login(process.env.TOKEN); 