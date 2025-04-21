import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { getBackupHistory, getBackups } from '../utils/backup.js';
import { getLocaleString } from '../utils/locales.js';

export const data = new SlashCommandBuilder()
  .setName('yedek-geçmişi')
  .setDescription('Tüm yedeklerin geçmişini gösterir');

export async function execute(interaction, lang) {
  await interaction.deferReply({ ephemeral: true });
  
  try {
    // Get backup history and available backups
    const history = await getBackupHistory();
    const backups = await getBackups();
    
    if (history.length === 0) {
      // No backups
      const noBackupsEmbed = new EmbedBuilder()
        .setColor('#cccccc')
        .setTitle(getLocaleString(interaction.client, lang, 'commands.history.responses.history_title'))
        .setDescription(getLocaleString(interaction.client, lang, 'commands.history.responses.no_backups'))
        .setTimestamp();
      
      await interaction.editReply({ embeds: [noBackupsEmbed] });
      return;
    }
    
    // Create history embed
    const historyEmbed = new EmbedBuilder()
      .setColor('#0099ff')
      .setTitle(getLocaleString(interaction.client, lang, 'commands.history.responses.history_title'))
      .setTimestamp();
    
    // Map backup IDs to their encryption status
    const encryptionStatus = new Map();
    for (const backup of backups) {
      encryptionStatus.set(backup.id, backup.isEncrypted);
    }
    
    // Add backup history entries (limit to 25 to avoid overflow)
    const entries = history.slice(0, 25).map(entry => {
      const date = new Date(entry.timestamp).toLocaleString();
      let entryText = getLocaleString(interaction.client, lang, 'commands.history.responses.backup_info', {
        id: entry.id,
        date: date,
        user: entry.userTag
      });
      
      if (entry.type === 'create') {
        entryText = `📥 **${entry.type === 'create' ? 'Oluşturuldu' : 'Yüklendi'}**: ${entryText}`;
        if (encryptionStatus.get(entry.id)) {
          entryText += ' 🔒';
        }
      } else if (entry.type === 'load') {
        entryText = `📤 **Yüklendi (${entry.mode})**: ${entryText}`;
      }
      
      return entryText;
    });
    
    // Add fields to embed
    if (entries.length > 10) {
      // Split into multiple fields if needed
      const firstHalf = entries.slice(0, Math.ceil(entries.length / 2));
      const secondHalf = entries.slice(Math.ceil(entries.length / 2));
      
      historyEmbed.addFields(
        { name: 'Son İşlemler (1)', value: firstHalf.join('\n\n') },
        { name: 'Son İşlemler (2)', value: secondHalf.join('\n\n') }
      );
    } else {
      historyEmbed.setDescription(entries.join('\n\n'));
    }
    
    // Add summary field
    const createCount = history.filter(entry => entry.type === 'create').length;
    const loadCount = history.filter(entry => entry.type === 'load').length;
    
    historyEmbed.addFields({
      name: 'Özet',
      value: `Toplam Yedek: ${backups.length}\nOluşturma İşlemi: ${createCount}\nYükleme İşlemi: ${loadCount}`
    });
    
    await interaction.editReply({ embeds: [historyEmbed] });
  } catch (error) {
    console.error('Error executing backup history command:', error);
    
    // Error embed
    const errorEmbed = new EmbedBuilder()
      .setColor('#ff0000')
      .setTitle(getLocaleString(interaction.client, lang, 'general.error'))
      .setDescription(`Yedek geçmişi alınırken bir hata oluştu: ${error.message}`)
      .setTimestamp();
    
    await interaction.editReply({ embeds: [errorEmbed] });
  }
} 