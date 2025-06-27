// Berechnet die Gesamtspielzeit in Minuten
export const calculateTotalMinutes = (formData) => {
  if (!formData.startTime || !formData.endTime) return 0
  
  const start = new Date(`2000-01-01 ${formData.startTime}`)
  const end = new Date(`2000-01-01 ${formData.endTime}`)
  
  let diff = (end - start) / 1000 / 60
  if (diff < 0) diff += 24 * 60
  
  return Math.floor(diff)
}

// Berechnet die maximale Spieleranzahl
export const calculateMaxPlayers = (formData) => {
  const totalMinutes = calculateTotalMinutes(formData)
  const courts = formData.courts || 1
  const playersPerGame = formData.format === 'singles' ? 2 : 4
  const roundDuration = formData.roundDuration || 15
  
  const breakMinutes = formData.breaks?.reduce((sum, b) => sum + (b.duration || 0), 0) || 0
  const nettoMinutes = totalMinutes - breakMinutes
  
  const spieleProCourt = Math.floor(nettoMinutes / roundDuration)
  const spieleGesamt = spieleProCourt * courts
  
  let maxPlayers = 0
  
  if (formData.garantieMinuten && formData.mindestMinuten) {
    const spieleProSpieler = Math.ceil(formData.mindestMinuten / roundDuration)
    maxPlayers = Math.floor((spieleGesamt * playersPerGame) / spieleProSpieler)
  } else if (formData.garantieSpiele && formData.mindestSpiele) {
    maxPlayers = Math.floor((spieleGesamt * playersPerGame) / formData.mindestSpiele)
  } else {
    maxPlayers = Math.floor((spieleGesamt * playersPerGame) / 3)
  }
  
  maxPlayers = Math.floor(maxPlayers / 2) * 2
  
  const minPlayers = formData.format === 'singles' ? 2 : 4
  return Math.max(maxPlayers, minPlayers)
}

// Format time from seconds to MM:SS
export const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

// Play sound for timer
export const playSound = () => {
  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)()
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()
    
    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)
    
    oscillator.frequency.value = 800
    oscillator.type = 'sine'
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5)
    
    oscillator.start(audioContext.currentTime)
    oscillator.stop(audioContext.currentTime + 0.5)
    
    setTimeout(() => {
      const oscillator2 = audioContext.createOscillator()
      const gainNode2 = audioContext.createGain()
      
      oscillator2.connect(gainNode2)
      gainNode2.connect(audioContext.destination)
      
      oscillator2.frequency.value = 800
      oscillator2.type = 'sine'
      
      gainNode2.gain.setValueAtTime(0.3, audioContext.currentTime)
      gainNode2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5)
      
      oscillator2.start(audioContext.currentTime)
      oscillator2.stop(audioContext.currentTime + 0.5)
    }, 600)
  } catch (error) {
    console.error('Error playing sound:', error)
  }
}