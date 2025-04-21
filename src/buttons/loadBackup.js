import { EmbedBuilder } from 'discord.js';
import { loadBackup } from '../utils/backup.js';
import { getLocaleString } from '../utils/locales.js';

export async function execute(interaction, args, lang) {
  // Args should be [backupId, mode, password]
  if (args.length < 3) {
    await interaction.reply({
      content: 'Geçersiz buton argümanları!',
      ephemeral: true
    });
    return;
  }
  
  const backupId = args[0];
  const mode = args[1];
  const password = args[2] === 'nopass' ? null : args[2];
  
  // Defer reply as backup loading might take some time
  await interaction.deferUpdate();
  
  try {
    // Load backup
    const result = await loadBackup(backupId, interaction.guild, interaction.user, password, mode);
    
    if (!result.success) {
      let errorKey = 'commands.load.responses.error';
      
      // Handle specific error cases
      if (result.error === 'backup_not_found') {
        errorKey = 'commands.load.responses.not_found';
      } else if (result.error === 'wrong_password') {
        errorKey = 'commands.load.responses.wrong_password';
      } else if (result.error === 'password_required') {
        errorKey = 'commands.load.responses.password_required';
      }
      
      // Error embed
      const errorEmbed = new EmbedBuilder()
        .setColor('#ff0000')
        .setTitle(getLocaleString(interaction.client, lang, 'general.error'))
        .setDescription(getLocaleString(interaction.client, lang, errorKey, { error: result.error }))
        .setTimestamp();
      
      await interaction.editReply({ embeds: [errorEmbed], components: [] });
      return;
    }
    
    // Success embed
    const successEmbed = new EmbedBuilder()
      .setColor('#00ff00')
      .setTitle(getLocaleString(interaction.client, lang, 'general.success'))
      .setDescription(getLocaleString(interaction.client, lang, 'commands.load.responses.completed'))
      .addFields(
        { 
          name: 'Sunucu', 
          value: interaction.guild.name, 
          inline: true 
        },
        { 
          name: 'Yedek ID', 
          value: backupId, 
          inline: true 
        },
        { 
          name: 'Mod', 
          value: mode, 
          inline: true 
        }
      )
      .setTimestamp();
    
    // Add missing users field if any
    if (result.missingUsers && result.missingUsers.length > 0) {
      successEmbed.addFields({
        name: 'Eksik Kullanıcılar',
        value: result.missingUsers.slice(0, 10).join('\n') + 
              (result.missingUsers.length > 10 ? `\n...ve ${result.missingUsers.length - 10} kullanıcı daha` : '')
      });
    }
    
    await interaction.editReply({ embeds: [successEmbed], components: [] });
  } catch (error) {
    console.error('Error executing load backup button:', error);
    
    // Error embed
    const errorEmbed = new EmbedBuilder()
      .setColor('#ff0000')
      .setTitle(getLocaleString(interaction.client, lang, 'general.error'))
      .setDescription(getLocaleString(interaction.client, lang, 'commands.load.responses.error', { error: error.message }))
      .setTimestamp();
    
    await interaction.editReply({ embeds: [errorEmbed], components: [] });
  }
} 