import { EmbedBuilder } from 'discord.js';

export async function execute(interaction) {
  try {
    // Create cancelled embed
    const cancelledEmbed = new EmbedBuilder()
      .setColor('#cccccc')
      .setTitle('İşlem İptal Edildi')
      .setDescription('Yedek yükleme işlemi iptal edildi.')
      .setTimestamp();
    
    await interaction.update({ embeds: [cancelledEmbed], components: [] });
  } catch (error) {
    console.error('Error executing cancel button:', error);
    await interaction.update({ content: 'İşlem iptal edilirken bir hata oluştu.', components: [] });
  }
} 