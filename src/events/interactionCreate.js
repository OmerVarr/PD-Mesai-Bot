const mesaiButtons = require('../buttons/mesaiButtons');
const ticketButtons = require('../buttons/ticketButtons');
const mesaiModals = require('../modals/mesaiModals');

module.exports = {
  name: 'interactionCreate',
  async execute(interaction, client) {
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
