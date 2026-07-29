const { ActivityType } = require('discord.js');
const Shift = require('../models/Shift');

/**
 * Updates the bot's presence to display how many officers are currently on duty.
 * Example: "5 kişi mesaide"
 * 
 * @param {import('discord.js').Client} client 
 */
async function updateBotPresence(client) {
  if (!client || !client.user) return;
  try {
    const activeCount = await Shift.countDocuments({ status: 'active' });
    const activityText = `${activeCount} kişi mesaide`;

    client.user.setPresence({
      activities: [{ name: activityText, type: ActivityType.Watching }],
      status: 'online',
    });
  } catch (error) {
    console.error('[Presence] Error updating bot presence:', error.message);
  }
}

module.exports = { updateBotPresence };
