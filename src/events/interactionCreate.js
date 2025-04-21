import { Events, EmbedBuilder } from 'discord.js';
import { hasCommandPermission } from '../utils/permissions.js';
import { getSettings } from '../utils/settings.js';
import { getLocaleString } from '../utils/locales.js';
import { logToFile } from '../utils/logger.js';

export const name = Events.InteractionCreate;
export const once = false;

/**
 * Handles interactions (commands, buttons)
 * @param {Interaction} interaction - The interaction
 */
export async function execute(interaction) {
  // Get guild settings and language
  const settings = await getSettings(interaction.guild.id);
  const lang = settings.language;
  
  // Handle slash commands
  if (interaction.isChatInputCommand()) {
    const command = interaction.client.commands.get(interaction.commandName);
    
    if (!command) {
      console.error(`Command ${interaction.commandName} not found.`);
      return;
    }
    
    // Check permissions
    const hasPermission = await hasCommandPermission(interaction.commandName, interaction.member);
    
    if (!hasPermission) {
      const errorEmbed = new EmbedBuilder()
        .setColor('#ff0000')
        .setTitle(getLocaleString(interaction.client, lang, 'general.unauthorized'))
        .setDescription(getLocaleString(interaction.client, lang, 'commands.permission.responses.unauthorized'));
      
      await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
      return;
    }
    
    try {
      await command.execute(interaction, lang);
      await logToFile('commands.log', `Command executed: ${interaction.commandName} by ${interaction.user.tag} (${interaction.user.id})`);
    } catch (error) {
      console.error(`Error executing command ${interaction.commandName}:`, error);
      
      const errorEmbed = new EmbedBuilder()
        .setColor('#ff0000')
        .setTitle(getLocaleString(interaction.client, lang, 'general.error'))
        .setDescription(getLocaleString(interaction.client, lang, 'commands.general.responses.error', { error: error.message }));
      
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({ embeds: [errorEmbed], ephemeral: true });
      } else {
        await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
      }
      
      await logToFile('errors.log', `Command error: ${interaction.commandName} - ${error.message}`);
    }
  }
  
  // Handle buttons
  if (interaction.isButton()) {
    const [buttonName, ...args] = interaction.customId.split('_');
    const button = interaction.client.buttons.get(buttonName);
    
    if (!button) {
      console.error(`Button ${buttonName} not found.`);
      return;
    }
    
    try {
      await button.execute(interaction, args, lang);
    } catch (error) {
      console.error(`Error executing button ${buttonName}:`, error);
      
      const errorEmbed = new EmbedBuilder()
        .setColor('#ff0000')
        .setTitle(getLocaleString(interaction.client, lang, 'general.error'))
        .setDescription(getLocaleString(interaction.client, lang, 'commands.general.responses.error', { error: error.message }));
      
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({ embeds: [errorEmbed], ephemeral: true });
      } else {
        await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
      }
      
      await logToFile('errors.log', `Button error: ${buttonName} - ${error.message}`);
    }
  }
} 