const DUTY_PREFIX = '[🚨]';

/**
 * Adds the [🚨] prefix to a member's server nickname when entering duty.
 * @param {import('discord.js').GuildMember} member 
 */
async function addDutyPrefix(member) {
  if (!member || !member.guild) return;
  try {
    const guildMember = await member.guild.members.fetch(member.id).catch(() => member);
    
    // Check if the bot can manage this member's nickname
    if (!guildMember.manageable) {
      console.warn(`[Nickname] Cannot change nickname for ${guildMember.user?.tag || guildMember.id}. Reason: Member is Guild Owner OR Bot role is lower than Member role in Discord role list.`);
      return;
    }

    const currentName = guildMember.nickname || guildMember.displayName || guildMember.user?.username;
    if (!currentName.includes(DUTY_PREFIX)) {
      const newNick = `${DUTY_PREFIX} ${currentName}`.slice(0, 32);
      await guildMember.setNickname(newNick);
      console.log(`[Nickname] Successfully added duty prefix for ${guildMember.user?.tag}: ${newNick}`);
    }
  } catch (error) {
    console.error(`[Nickname] Error adding duty prefix for ${member.user?.tag || member.id}:`, error.message);
  }
}

/**
 * Removes the [🚨] prefix from a member's server nickname when leaving duty.
 * @param {import('discord.js').GuildMember} member 
 */
async function removeDutyPrefix(member) {
  if (!member || !member.guild) return;
  try {
    const guildMember = await member.guild.members.fetch(member.id).catch(() => member);
    
    // Check if the bot can manage this member's nickname
    if (!guildMember.manageable) {
      console.warn(`[Nickname] Cannot change nickname for ${guildMember.user?.tag || guildMember.id}. Reason: Member is Guild Owner OR Bot role is lower than Member role in Discord role list.`);
      return;
    }

    const currentName = guildMember.nickname || guildMember.displayName;
    if (currentName && currentName.includes(DUTY_PREFIX)) {
      const cleaned = currentName.replace(/\[🚨\]\s*/g, '').trim();
      await guildMember.setNickname(cleaned.length > 0 ? cleaned : null);
      console.log(`[Nickname] Successfully removed duty prefix for ${guildMember.user?.tag}`);
    }
  } catch (error) {
    console.error(`[Nickname] Error removing duty prefix for ${member.user?.tag || member.id}:`, error.message);
  }
}

module.exports = {
  addDutyPrefix,
  removeDutyPrefix
};
