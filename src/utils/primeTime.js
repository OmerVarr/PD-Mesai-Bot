/**
 * Calculates how many milliseconds of a shift interval [clockIn, clockOut]
 * fall within the "Prime Hours" window (20:00 to 02:00 next day).
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
  
  // Start checking from 2 days prior to clockIn date to 2 days after clockOut date
  const curDate = new Date(clockIn);
  curDate.setDate(curDate.getDate() - 2);
  
  const endDate = new Date(clockOut);
  endDate.setDate(endDate.getDate() + 2);
  
  while (curDate <= endDate) {
    const year = curDate.getFullYear();
    const month = curDate.getMonth();
    const date = curDate.getDate();
    
    // Window: 20:00 on curDate to 02:00 on curDate + 1 day
    const windowStart = new Date(year, month, date, 20, 0, 0, 0).getTime();
    const windowEnd = new Date(year, month, date + 1, 2, 0, 0, 0).getTime();
    
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
