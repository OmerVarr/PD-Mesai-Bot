const Shift = require('../models/Shift');

/**
 * Calculates shift statistics for a user in a guild over recent time windows:
 * - last24h: last 24 hours
 * - last7d: last 7 days
 * - last30d: last 30 days
 * 
 * @param {string} userId
 * @param {string} guildId
 * @returns {Promise<{ last24h: number, last7d: number, last30d: number }>} Durations in ms
 */
async function getUserShiftStats(userId, guildId) {
  const now = Date.now();
  const start24h = now - (24 * 60 * 60 * 1000);
  const start7d = now - (7 * 24 * 60 * 60 * 1000);
  const start30d = now - (30 * 24 * 60 * 60 * 1000);

  // Query shifts that could overlap with last 30 days
  const shifts = await Shift.find({
    userId,
    guildId,
    status: { $in: ['completed', 'active'] },
    $or: [
      { clockOut: { $gte: new Date(start30d) } },
      { status: 'active' }
    ]
  });

  let last24h = 0;
  let last7d = 0;
  let last30d = 0;

  for (const shift of shifts) {
    const shiftStart = shift.clockIn.getTime();
    const shiftEnd = shift.status === 'active' ? now : (shift.clockOut ? shift.clockOut.getTime() : now);

    if (shiftEnd <= shiftStart) continue;

    // Overlap for 24h
    if (shiftEnd > start24h) {
      const overlap24 = Math.max(0, Math.min(shiftEnd, now) - Math.max(shiftStart, start24h));
      last24h += overlap24;
    }

    // Overlap for 7d
    if (shiftEnd > start7d) {
      const overlap7 = Math.max(0, Math.min(shiftEnd, now) - Math.max(shiftStart, start7d));
      last7d += overlap7;
    }

    // Overlap for 30d
    if (shiftEnd > start30d) {
      const overlap30 = Math.max(0, Math.min(shiftEnd, now) - Math.max(shiftStart, start30d));
      last30d += overlap30;
    }
  }

  return { last24h, last7d, last30d };
}

module.exports = { getUserShiftStats };
