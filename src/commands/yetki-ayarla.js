import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import { setCommandPermission, getCommandPermissions, removeCommandPermission } from '../utils/permissions.js';
import { getLocaleString } from '../utils/locales.js';

export const data = new SlashCommandBuilder()
  .setName('yetki-ayarla')
  .setDescription('Komut yetki ayarlarını yapılandırır')
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
  .addSubcommand(subcommand =>
    subcommand
      .setName('ekle')
      .setDescription('Komut için yetki rolü ayarlar')
      .addStringOption(option =>
        option.setName('komut')
          .setDescription('Yetkilendirme yapılacak komut')
          .setRequired(true)
          .addChoices(
            { name: 'yedek-al', value: 'yedek-al' },
            { name: 'yedek-yükle', value: 'yedek-yükle' },
            { name: 'yedek-geçmişi', value: 'yedek-geçmişi' },
            { name: 'yedek-aktar', value: 'yedek-aktar' },
            { name: 'ayarlar', value: 'ayarlar' }
          ))
      .addRoleOption(option =>
        option.setName('rol')
          .setDescription('Yetkili rol')
          .setRequired(true)))
  .addSubcommand(subcommand =>
    subcommand
      .setName('kaldır')
      .setDescription('Komut için yetki rolünü kaldırır')
      .addStringOption(option =>
        option.setName('komut')
          .setDescription('Yetkisi kaldırılacak komut')
          .setRequired(true)
          .addChoices(
            { name: 'yedek-al', value: 'yedek-al' },
            { name: 'yedek-yükle', value: 'yedek-yükle' },
            { name: 'yedek-geçmişi', value: 'yedek-geçmişi' },
            { name: 'yedek-aktar', value: 'yedek-aktar' },
            { name: 'ayarlar', value: 'ayarlar' }
          )))
  .addSubcommand(subcommand =>
    subcommand
      .setName('liste')
      .setDescription('Mevcut komut yetkilerini listeler'));

export async function execute(interaction, lang) {
  const subcommand = interaction.options.getSubcommand();
  
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
    if (subcommand === 'ekle') {
      const commandName = interaction.options.getString('komut');
      const role = interaction.options.getRole('rol');
      
      // Check if role is not @everyone
      if (role.id === interaction.guild.id) {
        const everyoneEmbed = new EmbedBuilder()
          .setColor('#ff0000')
          .setTitle(getLocaleString(interaction.client, lang, 'general.error'))
          .setDescription('@everyone rolü kullanılamaz. Lütfen başka bir rol seçin.')
          .setTimestamp();
        
        await interaction.reply({ embeds: [everyoneEmbed], ephemeral: true });
        return;
      }
      
      // Set permission
      const success = await setCommandPermission(commandName, role.id);
      
      if (success) {
        const successEmbed = new EmbedBuilder()
          .setColor('#00ff00')
          .setTitle(getLocaleString(interaction.client, lang, 'general.success'))
          .setDescription(getLocaleString(interaction.client, lang, 'commands.permission.responses.set', { command: commandName, role: role.name }))
          .setTimestamp();
        
        await interaction.reply({ embeds: [successEmbed], ephemeral: true });
      } else {
        throw new Error('Yetki ayarlanırken bir hata oluştu.');
      }
    } else if (subcommand === 'kaldır') {
      const commandName = interaction.options.getString('komut');
      
      // Remove permission
      const success = await removeCommandPermission(commandName);
      
      if (success) {
        const successEmbed = new EmbedBuilder()
          .setColor('#00ff00')
          .setTitle(getLocaleString(interaction.client, lang, 'general.success'))
          .setDescription(`\`${commandName}\` komutu için özel yetki kaldırıldı.`)
          .setTimestamp();
        
        await interaction.reply({ embeds: [successEmbed], ephemeral: true });
      } else {
        throw new Error('Yetki kaldırılırken bir hata oluştu.');
      }
    } else if (subcommand === 'liste') {
      // Get all permissions
      const permissions = await getCommandPermissions();
      
      const permissionEmbed = new EmbedBuilder()
        .setColor('#0099ff')
        .setTitle('Komut Yetkileri')
        .setTimestamp();
      
      if (Object.keys(permissions).length === 0) {
        permissionEmbed.setDescription('Hiçbir komut için özel yetki ayarlanmamış.');
      } else {
        // Get role names
        const permissionEntries = await Promise.all(
          Object.entries(permissions).map(async ([commandName, roleId]) => {
            let roleName = roleId;
            
            try {
              const role = await interaction.guild.roles.fetch(roleId);
              if (role) {
                roleName = role.name;
              }
            } catch (error) {
              console.error(`Error fetching role ${roleId}:`, error);
            }
            
            return `**/${commandName}**: <@&${roleId}> (${roleName})`;
          })
        );
        
        permissionEmbed.setDescription(permissionEntries.join('\n\n'));
      }
      
      await interaction.reply({ embeds: [permissionEmbed], ephemeral: true });
    }
  } catch (error) {
    console.error('Error executing permission command:', error);
    
    const errorEmbed = new EmbedBuilder()
      .setColor('#ff0000')
      .setTitle(getLocaleString(interaction.client, lang, 'general.error'))
      .setDescription(getLocaleString(interaction.client, lang, 'commands.permission.responses.error', { error: error.message }))
      .setTimestamp();
    
    await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
  }
} 