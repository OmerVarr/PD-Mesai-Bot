const DUTY_PREFIX = '[🚨]';

/**
 * Adds the [🚨] prefix to a member's server nickname when entering duty.
 * @param {import('discord.js').GuildMember} member 
 */
async function addDutyPrefix(member) {
  if (!member) return;
  try {
    const currentNick = member.nickname || member.user.displayName || member.user.username;
    if (!currentNick.startsWith(DUTY_PREFIX)) {
      const newNick = `${DUTY_PREFIX} ${currentNick}`;
      await member.setNickname(newNick.slice(0, 32));
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
  if (!member) return;
  try {
    const currentNick = member.nickname || member.displayName;
    if (currentNick && currentNick.includes(DUTY_PREFIX)) {
      const cleaned = currentNick.replace(/\[🚨\]\s*/g, '').trim();
      await member.setNickname(cleaned.length > 0 ? cleaned : null);
    }
  } catch (error) {
    console.error(`[Nickname] Error removing duty prefix for ${member.user?.tag || member.id}:`, error.message);
  }
}

module.exports = {
  addDutyPrefix,
  removeDutyPrefix
};
