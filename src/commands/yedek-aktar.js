import { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder } from 'discord.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getBackups } from '../utils/backup.js';
import { getLocaleString } from '../utils/locales.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Backups directory
const backupsDir = path.join(__dirname, '..', 'data', 'backups');

export const data = new SlashCommandBuilder()
  .setName('yedek-aktar')
  .setDescription('Bir yedeği başka bir kullanıcıya aktarır')
  .addStringOption(option => 
    option.setName('id')
      .setDescription('Yedek ID')
      .setRequired(true))
  .addUserOption(option => 
    option.setName('kullanıcı')
      .setDescription('Yedeği aktaracağınız kullanıcı')
      .setRequired(true));

export async function execute(interaction, lang) {
  const backupId = interaction.options.getString('id');
  const targetUser = interaction.options.getUser('kullanıcı');
  
  await interaction.deferReply({ ephemeral: true });
  
  try {
    // Check if backup exists
    const backups = await getBackups();
    const backup = backups.find(b => b.id === backupId);
    
    if (!backup) {
      // Backup not found
      const notFoundEmbed = new EmbedBuilder()
        .setColor('#ff0000')
        .setTitle(getLocaleString(interaction.client, lang, 'general.not_found'))
        .setDescription(getLocaleString(interaction.client, lang, 'commands.share.responses.not_found'))
        .setTimestamp();
      
      await interaction.editReply({ embeds: [notFoundEmbed] });
      return;
    }
    
    // Get backup file path
    const backupPath = path.join(backupsDir, `${backupId}.json`);
    
    // Create attachment from backup file
    const attachment = new AttachmentBuilder(backupPath, { name: `backup-${backupId}.json` });
    
    // Create message embed for target user
    const messageEmbed = new EmbedBuilder()
      .setColor('#0099ff')
      .setTitle('Yedek Dosyası Aldınız')
      .setDescription(`**${interaction.user.tag}** size bir sunucu yedeği gönderdi.\n\nYedek ID: \`${backupId}\`\nSunucu: \`${backup.name}\`\n\nBu yedeği kullanmak için \`/yedek-yükle\` komutunu kullanabilirsiniz.`)
      .setTimestamp();
    
    if (backup.isEncrypted) {
      messageEmbed.addFields({
        name: '⚠️ Bu yedek şifrelidir',
        value: 'Yüklemek için şifre gerekecektir. Lütfen şifreyi gönderen kişiden isteyiniz.'
      });
    }
    
    // Send DM to target user
    await targetUser.send({ embeds: [messageEmbed], files: [attachment] });
    
    // Success embed
    const successEmbed = new EmbedBuilder()
      .setColor('#00ff00')
      .setTitle(getLocaleString(interaction.client, lang, 'general.success'))
      .setDescription(getLocaleString(interaction.client, lang, 'commands.share.responses.sent', { user: targetUser.tag }))
      .addFields(
        { name: 'Yedek ID', value: backupId, inline: true },
        { name: 'Sunucu', value: backup.name, inline: true },
        { name: 'Şifreli', value: backup.isEncrypted ? '✅' : '❌', inline: true }
      )
      .setTimestamp();
    
    await interaction.editReply({ embeds: [successEmbed] });
  } catch (error) {
    console.error('Error executing backup share command:', error);
    
    // Check if error is due to user having DMs closed
    if (error.code === 50007) {
      const dmClosedEmbed = new EmbedBuilder()
        .setColor('#ff0000')
        .setTitle(getLocaleString(interaction.client, lang, 'general.error'))
        .setDescription(`${targetUser.tag} kullanıcısının DM'leri kapalı. Yedeği paylaşabilmek için kullanıcının DM'leri açık olmalıdır.`)
        .setTimestamp();
      
      await interaction.editReply({ embeds: [dmClosedEmbed] });
      return;
    }
    
    // General error embed
    const errorEmbed = new EmbedBuilder()
      .setColor('#ff0000')
      .setTitle(getLocaleString(interaction.client, lang, 'general.error'))
      .setDescription(getLocaleString(interaction.client, lang, 'commands.share.responses.error', { error: error.message }))
      .setTimestamp();
    
    await interaction.editReply({ embeds: [errorEmbed] });
  }
} 