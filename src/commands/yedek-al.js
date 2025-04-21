import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { createBackup } from '../utils/backup.js';
import { getLocaleString } from '../utils/locales.js';

export const data = new SlashCommandBuilder()
  .setName('yedek-al')
  .setDescription('Sunucunun tam yedeğini alır')
  .addStringOption(option => 
    option.setName('şifre')
      .setDescription('Yedek için şifre (isteğe bağlı)')
      .setRequired(false));

export async function execute(interaction, lang) {
  const password = interaction.options.getString('şifre');
  
  // Defer reply as backup creation might take some time
  await interaction.deferReply({ ephemeral: true });
  
  // Create loading embed
  const loadingEmbed = new EmbedBuilder()
    .setColor('#ffcc00')
    .setTitle(getLocaleString(interaction.client, lang, 'general.loading'))
    .setDescription(getLocaleString(interaction.client, lang, 'commands.backup.responses.started'))
    .setTimestamp();
  
  await interaction.editReply({ embeds: [loadingEmbed] });
  
  try {
    // Create backup
    const result = await createBackup(interaction.guild, interaction.user, password);
    
    if (!result.success) {
      // Error embed
      const errorEmbed = new EmbedBuilder()
        .setColor('#ff0000')
        .setTitle(getLocaleString(interaction.client, lang, 'general.error'))
        .setDescription(getLocaleString(interaction.client, lang, 'commands.backup.responses.error', { error: result.error }))
        .setTimestamp();
      
      await interaction.editReply({ embeds: [errorEmbed] });
      return;
    }
    
    // Success embed
    const successEmbed = new EmbedBuilder()
      .setColor('#00ff00')
      .setTitle(getLocaleString(interaction.client, lang, 'general.success'))
      .setDescription(getLocaleString(interaction.client, lang, 'commands.backup.responses.completed', { id: result.id }))
      .addFields(
        { 
          name: 'Sunucu', 
          value: interaction.guild.name, 
          inline: true 
        },
        { 
          name: 'Yedek ID', 
          value: result.id, 
          inline: true 
        },
        { 
          name: 'Şifreli', 
          value: password ? '✅' : '❌', 
          inline: true 
        }
      )
      .setTimestamp();
    
    await interaction.editReply({ embeds: [successEmbed] });
  } catch (error) {
    console.error('Error executing backup command:', error);
    
    // Error embed
    const errorEmbed = new EmbedBuilder()
      .setColor('#ff0000')
      .setTitle(getLocaleString(interaction.client, lang, 'general.error'))
      .setDescription(getLocaleString(interaction.client, lang, 'commands.backup.responses.error', { error: error.message }))
      .setTimestamp();
    
    await interaction.editReply({ embeds: [errorEmbed] });
  }
} 