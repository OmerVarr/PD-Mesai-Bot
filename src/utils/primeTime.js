/**
 * Calculates how many milliseconds of a shift interval [clockIn, clockOut]
 * fall within the "Prime Hours" window (20:00 to 23:59 Turkey time / UTC+3).
 * 
 * @param {Date} clockIn Shift start time
 * @param {Date} clockOut Shift end time
 * @returns {number} Prime time duration in milliseconds
 */
function calculatePrimeTime(clockIn, clockOut) {
  if (!clockIn || !clockOut) return 0;
  
  const start = new Date(clockIn).getTime();
  const end = new Date(clockOut).getTime();
  
  if (isNaN(start) || isNaN(end) || end <= start) return 0;
  
  let totalPrimeMs = 0;
  
  // Turkey is UTC+3 (10,800,000 ms offset from UTC)
  const TRT_OFFSET_MS = 3 * 60 * 60 * 1000;
  
  // Start checking from 2 days prior to clockIn date to 2 days after clockOut date
  const curDate = new Date(clockIn);
  curDate.setDate(curDate.getDate() - 2);
  
  const endDate = new Date(clockOut);
  endDate.setDate(endDate.getDate() + 2);
  
  while (curDate <= endDate) {
    // Get Turkey local date representation (year, month, date)
    const trtDate = new Date(curDate.getTime() + TRT_OFFSET_MS);
    const year = trtDate.getUTCFullYear();
    const month = trtDate.getUTCMonth();
    const date = trtDate.getUTCDate();
    
    // Window in TRT: 20:00:00 to 24:00:00 (which is 23:59:59.999 TRT)
    // TRT 20:00 is Date.UTC(year, month, date, 20 - 3, 0, 0, 0) -> 17:00 UTC
    // TRT 24:00 is Date.UTC(year, month, date, 24 - 3, 0, 0, 0) -> 21:00 UTC
    const windowStart = Date.UTC(year, month, date, 17, 0, 0, 0);
    const windowEnd = Date.UTC(year, month, date, 21, 0, 0, 0);
    
    const overlapStart = Math.max(start, windowStart);
    const overlapEnd = Math.min(end, windowEnd);
    
    if (overlapEnd > overlapStart) {
      totalPrimeMs += (overlapEnd - overlapStart);
    }
    
    curDate.setDate(curDate.getDate() + 1);
  }
  
  return totalPrimeMs;
}

module.exports = { calculatePrimeTime };
