const { joinVoiceChannel } = require('@discordjs/voice');

/**
 * Connects the bot client to a specified voice channel.
 * @param {import('discord.js').Client} client 
 * @param {string} guildId 
 * @param {string} channelId 
 */
function connectToVoice(client, guildId, channelId) {
  const guild = client.guilds.cache.get(guildId);
  if (!guild) {
    console.warn(`[Voice] Guild not found in cache: ${guildId}`);
    return;
  }

  const channel = guild.channels.cache.get(channelId);
  if (!channel) {
    console.warn(`[Voice] Channel not found in cache: ${channelId} for guild: ${guild.name}`);
    return;
  }

  try {
    joinVoiceChannel({
      channelId: channel.id,
      guildId: guild.id,
      adapterCreator: guild.voiceAdapterCreator,
      selfMute: true,
      selfDeaf: true
    });
    console.log(`[Voice] Connected to voice channel "${channel.name}" (${channel.id}) in guild "${guild.name}"`);
  } catch (error) {
    console.error(`[Voice] Failed to join voice channel ${channelId} in guild ${guildId}:`, error);
  }
}

module.exports = { connectToVoice };
