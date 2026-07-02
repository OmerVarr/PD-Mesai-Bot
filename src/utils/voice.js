const { joinVoiceChannel, getVoiceConnection } = require('@discordjs/voice');

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

/**
 * Disconnects the bot client from the voice channel in the specified guild.
 * @param {string} guildId 
 */
function disconnectFromVoice(guildId) {
  try {
    const connection = getVoiceConnection(guildId);
    if (connection) {
      connection.destroy();
      console.log(`[Voice] Disconnected and destroyed voice connection in guild: ${guildId}`);
    }
  } catch (error) {
    console.error(`[Voice] Error disconnecting from voice channel in guild ${guildId}:`, error);
  }
}

module.exports = { connectToVoice, disconnectFromVoice };
