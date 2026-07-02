const mesaiButtons = require('../buttons/mesaiButtons');
const ticketButtons = require('../buttons/ticketButtons');
const mesaiModals = require('../modals/mesaiModals');
const Whitelist = require('../models/Whitelist');
const GuildConfig = require('../models/GuildConfig');
const { t } = require('../utils/i18n');

module.exports = {
  name: 'interactionCreate',
  async execute(interaction, client) {
    // Whitelist Kontrolü
    if (interaction.guildId) {
      const ownerId = process.env.OWNER_ID;
      const isOwner = interaction.user.id === ownerId || interaction.user.id === '868434749381828668';

      if (!isOwner) {
        const isWhitelisted = await Whitelist.findOne({ guildId: interaction.guildId });
        if (!isWhitelisted) {
          const config = await GuildConfig.findOne({ guildId: interaction.guildId });
          const warningMessage = t(config, 'common.notWhitelisted');
          return interaction.reply({ content: warningMessage, ephemeral: true });
        }
      }
    }

    // 1. Slash Komutları
    if (interaction.isChatInputCommand()) {
      const command = client.commands.get(interaction.commandName);
      if (!command) return;

      try {
        await command.execute(interaction);
      } catch (error) {
        console.error('Command Execution Error:', error);
        const replyPayload = { content: 'Komut çalıştırılırken bir hata oluştu!', ephemeral: true };
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp(replyPayload);
        } else {
          await interaction.reply(replyPayload);
        }
      }
    }
    
    // 2. Buton Tıklamaları
    else if (interaction.isButton()) {
      const { customId } = interaction;
      
      if (customId.startsWith('mesai_')) {
        try {
          await mesaiButtons.handle(interaction, client);
        } catch (error) {
          console.error('Mesai Button Interaction Error:', error);
          await interaction.reply({ content: 'Mesai butonu işlenirken bir hata oluştu!', ephemeral: true });
        }
      } 
      else if (customId.startsWith('ticket_')) {
        try {
          await ticketButtons.handle(interaction, client);
        } catch (error) {
          console.error('Ticket Button Interaction Error:', error);
          await interaction.reply({ content: 'Ticket butonu işlenirken bir hata oluştu!', ephemeral: true });
        }
      }
    }
    
    // 3. Modal Gönderimleri
    else if (interaction.isModalSubmit()) {
      const { customId } = interaction;
      
      if (customId.startsWith('modal_mesai_')) {
        try {
          await mesaiModals.handle(interaction, client);
        } catch (error) {
          console.error('Mesai Modal Submission Error:', error);
          await interaction.reply({ content: 'Süre işlemi yapılırken bir hata oluştu!', ephemeral: true });
        }
      }
    }
  },
};
