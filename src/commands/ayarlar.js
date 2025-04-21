import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import { getSettings, updateSettings } from '../utils/settings.js';
import { getLocaleString } from '../utils/locales.js';

export const data = new SlashCommandBuilder()
  .setName('ayarlar')
  .setDescription('Bot ayarlarını yapılandırır')
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
  .addSubcommand(subcommand =>
    subcommand
      .setName('görüntüle')
      .setDescription('Mevcut ayarları görüntüler'))
  .addSubcommand(subcommand =>
    subcommand
      .setName('dil')
      .setDescription('Bot dilini değiştirir')
      .addStringOption(option =>
        option.setName('dil-seçimi')
          .setDescription('Bot dili')
          .setRequired(true)
          .addChoices(
            { name: 'Türkçe', value: 'tr' },
            { name: 'English', value: 'en' }
          )))
  .addSubcommand(subcommand =>
    subcommand
      .setName('rol-kurtarma')
      .setDescription('Otomatik rol kurtarma özelliğini ayarlar')
      .addBooleanOption(option =>
        option.setName('durum')
          .setDescription('Özellik durumu')
          .setRequired(true)))
  .addSubcommand(subcommand =>
    subcommand
      .setName('sıfırla')
      .setDescription('Tüm ayarları varsayılana döndürür'));

export async function execute(interaction, lang) {
  const subcommand = interaction.options.getSubcommand();
  const guildId = interaction.guild.id;
  
  // Check if user is admin
  if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
    const unauthorizedEmbed = new EmbedBuilder()
      .setColor('#ff0000')
      .setTitle(getLocaleString(interaction.client, lang, 'general.unauthorized'))
      .setDescription('Bu komutu kullanmak için yönetici yetkisine sahip olmalısınız.')
      .setTimestamp();
    
    await interaction.reply({ embeds: [unauthorizedEmbed], ephemeral: true });
    return;
  }
  
  try {
    // Get current settings
    const settings = await getSettings(guildId);
    
    if (subcommand === 'görüntüle') {
      // Create settings embed
      const settingsEmbed = new EmbedBuilder()
        .setColor('#0099ff')
        .setTitle('Bot Ayarları')
        .addFields(
          { 
            name: '🌐 Dil', 
            value: settings.language === 'tr' ? 'Türkçe' : 'English', 
            inline: true 
          },
          { 
            name: '🔄 Otomatik Rol Kurtarma', 
            value: settings.autoRoleRecovery ? '✅ Açık' : '❌ Kapalı', 
            inline: true 
          },
          { 
            name: '⏰ Yedek Hatırlatıcıları', 
            value: settings.backupReminders ? '✅ Açık' : '❌ Kapalı', 
            inline: true 
          }
        )
        .setTimestamp();
      
      await interaction.reply({ embeds: [settingsEmbed], ephemeral: true });
    } else if (subcommand === 'dil') {
      const newLanguage = interaction.options.getString('dil-seçimi');
      
      // Update language setting
      const success = await updateSettings(guildId, { language: newLanguage });
      
      if (success) {
        const successEmbed = new EmbedBuilder()
          .setColor('#00ff00')
          .setTitle(getLocaleString(interaction.client, lang, 'general.success'))
          .setDescription(getLocaleString(interaction.client, newLanguage, 'commands.settings.responses.language_changed', { language: newLanguage === 'tr' ? 'Türkçe' : 'English' }))
          .setTimestamp();
        
        await interaction.reply({ embeds: [successEmbed], ephemeral: true });
      } else {
        throw new Error('Dil ayarlanırken bir hata oluştu.');
      }
    } else if (subcommand === 'rol-kurtarma') {
      const newStatus = interaction.options.getBoolean('durum');
      
      // Update auto role recovery setting
      const success = await updateSettings(guildId, { autoRoleRecovery: newStatus });
      
      if (success) {
        const successEmbed = new EmbedBuilder()
          .setColor('#00ff00')
          .setTitle(getLocaleString(interaction.client, lang, 'general.success'))
          .setDescription(`Otomatik rol kurtarma özelliği ${newStatus ? 'aktifleştirildi' : 'devre dışı bırakıldı'}.`)
          .setTimestamp();
        
        await interaction.reply({ embeds: [successEmbed], ephemeral: true });
      } else {
        throw new Error('Ayar değiştirilirken bir hata oluştu.');
      }
    } else if (subcommand === 'sıfırla') {
      // Create confirmation buttons (this would be implemented with a collector like in yedek-yükle command)
      const confirmEmbed = new EmbedBuilder()
        .setColor('#ffcc00')
        .setTitle('Ayarları Sıfırlama Onayı')
        .setDescription('Tüm bot ayarlarını varsayılan değerlerine sıfırlamak istediğinize emin misiniz?')
        .setTimestamp();
      
      // For this simple example, we'll just reset without confirmation
      const success = await updateSettings(guildId, {
        language: process.env.DEFAULT_LANGUAGE || 'tr',
        autoRoleRecovery: true,
        backupReminders: false
      });
      
      if (success) {
        const successEmbed = new EmbedBuilder()
          .setColor('#00ff00')
          .setTitle(getLocaleString(interaction.client, lang, 'general.success'))
          .setDescription('Tüm ayarlar başarıyla sıfırlandı.')
          .setTimestamp();
        
        await interaction.reply({ embeds: [successEmbed], ephemeral: true });
      } else {
        throw new Error('Ayarlar sıfırlanırken bir hata oluştu.');
      }
    }
  } catch (error) {
    console.error('Error executing settings command:', error);
    
    const errorEmbed = new EmbedBuilder()
      .setColor('#ff0000')
      .setTitle(getLocaleString(interaction.client, lang, 'general.error'))
      .setDescription(getLocaleString(interaction.client, lang, 'commands.settings.responses.error', { error: error.message }))
      .setTimestamp();
    
    await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
  }
} 