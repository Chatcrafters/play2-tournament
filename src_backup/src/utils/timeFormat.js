// utils/timeFormat.js
export const formatTimeWithoutSeconds = (time) => {
  if (!time) return '--:--'
  
  // Falls Zeit bereits im HH:MM Format ist
  if (time.match(/^\d{2}:\d{2}$/)) {
    return time
  }
  
  // Falls Zeit im HH:MM:SS Format ist
  if (time.match(/^\d{2}:\d{2}:\d{2}$/)) {
    return time.substring(0, 5)
  }
  
  return time
}

export const formatTimeRange = (startTime, endTime) => {
  return `${formatTimeWithoutSeconds(startTime)} - ${formatTimeWithoutSeconds(endTime)}`
}