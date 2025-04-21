import { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } from 'discord.js';
import { loadBackup, getBackups } from '../utils/backup.js';
import { getLocaleString } from '../utils/locales.js';

export const data = new SlashCommandBuilder()
  .setName('yedek-yükle')
  .setDescription('Belirtilen yedeği sunucuya yükler')
  .addStringOption(option => 
    option.setName('id')
      .setDescription('Yedek ID')
      .setRequired(true))
  .addStringOption(option => 
    option.setName('şifre')
      .setDescription('Yedek şifresi (gerekirse)')
      .setRequired(false))
  .addStringOption(option => 
    option.setName('mod')
      .setDescription('Yükleme modu')
      .setRequired(false)
      .addChoices(
        { name: 'Tam Yükleme', value: 'tam' },
        { name: 'Sadece Roller', value: 'roller' },
        { name: 'Sadece Kanallar', value: 'kanallar' },
        { name: 'Sade Yükleme', value: 'sade' }
      ));

export async function execute(interaction, lang) {
  const backupId = interaction.options.getString('id');
  const password = interaction.options.getString('şifre');
  const mode = interaction.options.getString('mod') || 'tam';
  
  // Check if user is server owner
  if (interaction.user.id !== interaction.guild.ownerId) {
    const ownerOnlyEmbed = new EmbedBuilder()
      .setColor('#ff0000')
      .setTitle(getLocaleString(interaction.client, lang, 'general.unauthorized'))
      .setDescription('Bu komutu sadece sunucu sahibi kullanabilir!')
      .setTimestamp();
    
    await interaction.reply({ embeds: [ownerOnlyEmbed], ephemeral: true });
    return;
  }
  
  // First, verify backup exists
  const backups = await getBackups();
  const backupExists = backups.some(backup => backup.id === backupId);
  
  if (!backupExists) {
    const notFoundEmbed = new EmbedBuilder()
      .setColor('#ff0000')
      .setTitle(getLocaleString(interaction.client, lang, 'general.not_found'))
      .setDescription(getLocaleString(interaction.client, lang, 'commands.load.responses.not_found'))
      .setTimestamp();
    
    await interaction.reply({ embeds: [notFoundEmbed], ephemeral: true });
    return;
  }
  
  // Create confirmation buttons
  const confirmButton = new ButtonBuilder()
    .setCustomId(`loadBackup_${backupId}_${mode}_${password || 'nopass'}`)
    .setLabel('Yedeği Yükle')
    .setStyle(ButtonStyle.Danger);
  
  const cancelButton = new ButtonBuilder()
    .setCustomId('cancelBackupLoad')
    .setLabel('İptal')
    .setStyle(ButtonStyle.Secondary);
  
  const row = new ActionRowBuilder().addComponents(confirmButton, cancelButton);
  
  // Send confirmation message
  const confirmEmbed = new EmbedBuilder()
    .setColor('#ffcc00')
    .setTitle('Yedek Yükleme Onayı')
    .setDescription(`**Uyarı:** Bu işlem mevcut sunucu yapılandırmanızın üzerine yazacaktır!\n\n**Yedek ID:** ${backupId}\n**Yükleme Modu:** ${mode}\n\nOnaylıyor musunuz?`)
    .setTimestamp();
  
  await interaction.reply({ embeds: [confirmEmbed], components: [row], ephemeral: true });
  
  // Set up button collector
  const filter = i => i.user.id === interaction.user.id;
  const collector = interaction.channel.createMessageComponentCollector({ filter, time: 60000 });
  
  collector.on('collect', async i => {
    if (i.customId === 'cancelBackupLoad') {
      const cancelledEmbed = new EmbedBuilder()
        .setColor('#cccccc')
        .setTitle('İşlem İptal Edildi')
        .setDescription('Yedek yükleme işlemi iptal edildi.')
        .setTimestamp();
      
      await i.update({ embeds: [cancelledEmbed], components: [] });
      collector.stop();
      return;
    }
    
    if (i.customId.startsWith('loadBackup_')) {
      // Defer reply as backup loading might take some time
      await i.update({ 
        embeds: [
          new EmbedBuilder()
            .setColor('#ffcc00')
            .setTitle(getLocaleString(interaction.client, lang, 'general.loading'))
            .setDescription(getLocaleString(interaction.client, lang, 'commands.load.responses.started', { mode }))
        ], 
        components: [] 
      });
      
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
          collector.stop();
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
        console.error('Error executing backup load command:', error);
        
        // Error embed
        const errorEmbed = new EmbedBuilder()
          .setColor('#ff0000')
          .setTitle(getLocaleString(interaction.client, lang, 'general.error'))
          .setDescription(getLocaleString(interaction.client, lang, 'commands.load.responses.error', { error: error.message }))
          .setTimestamp();
        
        await interaction.editReply({ embeds: [errorEmbed], components: [] });
      }
      
      collector.stop();
    }
  });
  
  collector.on('end', collected => {
    if (collected.size === 0) {
      // Timeout embed
      const timeoutEmbed = new EmbedBuilder()
        .setColor('#cccccc')
        .setTitle('Zaman Aşımı')
        .setDescription('Yedek yükleme işlemi zaman aşımına uğradı.')
        .setTimestamp();
      
      interaction.editReply({ embeds: [timeoutEmbed], components: [] }).catch(console.error);
    }
  });
} 