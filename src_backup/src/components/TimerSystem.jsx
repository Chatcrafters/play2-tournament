// src/components/TimerSystem.jsx
import { useState, useEffect, useRef, useCallback } from 'react'

export const TimerSystem = ({ event, schedule, onRoundChange, onTimerStateChange }) => {
  // State management
  const [currentRound, setCurrentRound] = useState(0)
  const [timeRemaining, setTimeRemaining] = useState(event.roundDuration * 60) // Convert to seconds
  const [timerState, setTimerState] = useState('stopped') // stopped, running, paused, break
  const [isBreak, setIsBreak] = useState(false)
  const [breakTimeRemaining, setBreakTimeRemaining] = useState(0)
  
  // Refs for interval management
  const intervalRef = useRef(null)
  
  // Get current round matches
  const currentRoundData = schedule[currentRound] || null
  const totalRounds = schedule.length
  const isLastRound = currentRound >= totalRounds - 1
  
  // Format time display
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  
  // Play sound notification using Web Audio API
  const playSound = useCallback(() => {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()
      
      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)
      
      oscillator.frequency.value = 800 // Frequency in Hz
      oscillator.type = 'sine'
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5)
      
      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.5)
    } catch (error) {
      console.log('Audio playback failed:', error)
    }
  }, [])
  
  // Timer tick function
  useEffect(() => {
    if (timerState === 'running') {
      intervalRef.current = setInterval(() => {
        if (isBreak) {
          setBreakTimeRemaining((prev) => {
            if (prev <= 1) {
              // Break finished, start next round
              setIsBreak(false)
              setTimeRemaining(event.roundDuration * 60)
              playSound()
              return 0
            }
            if (prev === 10) playSound() // 10 second warning
            return prev - 1
          })
        } else {
          setTimeRemaining((prev) => {
            if (prev <= 1) {
              // Round finished
              playSound()
              handleRoundComplete()
              return 0
            }
            if (prev === 60) playSound() // 1 minute warning
            if (prev === 10) playSound() // 10 second warning
            return prev - 1
          })
        }
      }, 1000)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [timerState, isBreak, event.roundDuration, playSound])
  
  // Handle round completion
  const handleRoundComplete = () => {
    if (isLastRound) {
      setTimerState('stopped')
      onTimerStateChange?.('completed')
    } else {
      // Start break
      const breakDuration = event.breaks?.find(b => b.afterRound === currentRound)?.duration || 5
      setBreakTimeRemaining(breakDuration * 60)
      setIsBreak(true)
      setCurrentRound(prev => prev + 1)
      onRoundChange?.(currentRound + 1)
    }
  }
  
  // Control functions
  const startTimer = () => {
    setTimerState('running')
    onTimerStateChange?.('running')
  }
  
  const pauseTimer = () => {
    setTimerState('paused')
    onTimerStateChange?.('paused')
  }
  
  const resumeTimer = () => {
    setTimerState('running')
    onTimerStateChange?.('running')
  }
  
  const resetTimer = () => {
    setTimerState('stopped')
    setTimeRemaining(event.roundDuration * 60)
    setIsBreak(false)
    setBreakTimeRemaining(0)
    onTimerStateChange?.('stopped')
  }
  
  const skipToNextRound = () => {
    if (!isLastRound) {
      setCurrentRound(prev => prev + 1)
      setTimeRemaining(event.roundDuration * 60)
      setIsBreak(false)
      setTimerState('stopped')
      onRoundChange?.(currentRound + 1)
    }
  }
  
  const skipToPreviousRound = () => {
    if (currentRound > 0) {
      setCurrentRound(prev => prev - 1)
      setTimeRemaining(event.roundDuration * 60)
      setIsBreak(false)
      setTimerState('stopped')
      onRoundChange?.(currentRound - 1)
    }
  }
  
  // Render current matches
  const renderCurrentMatches = () => {
    if (!currentRoundData) return null
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {currentRoundData.matches.map((match, idx) => (
          <div key={idx} className="bg-gray-50 p-4 rounded-lg">
            <div className="text-sm font-semibold text-gray-600 mb-2">
              Platz {match.court}
            </div>
            <div className="space-y-2">
              <div className="font-medium">
                {match.team1?.map(p => p.name).join(' & ')}
              </div>
              <div className="text-sm text-gray-500">vs</div>
              <div className="font-medium">
                {match.team2?.map(p => p.name).join(' & ')}
              </div>
            </div>
          </div>
        ))}
        
        {currentRoundData.waitingPlayers && currentRoundData.waitingPlayers.length > 0 && (
          <div className="bg-yellow-50 p-4 rounded-lg">
            <div className="text-sm font-semibold text-gray-600 mb-2">
              Wartet
            </div>
            <div className="font-medium">
              {currentRoundData.waitingPlayers.map(p => p.name).join(', ')}
            </div>
          </div>
        )}
      </div>
    )
  }
  
  return (
    <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-2xl font-bold">
          {isBreak ? 'Pause' : `Runde ${currentRound + 1} von ${totalRounds}`}
        </h3>
        <div className="text-3xl font-mono font-bold">
          {formatTime(isBreak ? breakTimeRemaining : timeRemaining)}
        </div>
      </div>
      
      {/* Progress bar */}
      <div className="w-full bg-gray-200 rounded-full h-4 mb-6">
        <div 
          className={`h-4 rounded-full transition-all duration-1000 ${
            isBreak ? 'bg-yellow-500' : 'bg-green-500'
          }`}
          style={{
            width: `${
              isBreak 
                ? ((breakTimeRemaining / ((event.breaks?.find(b => b.afterRound === currentRound - 1)?.duration || 5) * 60)) * 100)
                : ((timeRemaining / (event.roundDuration * 60)) * 100)
            }%`
          }}
        />
      </div>
      
      {/* Current matches */}
      {!isBreak && renderCurrentMatches()}
      
      {/* Control buttons */}
      <div className="flex flex-wrap gap-3 justify-center">
        {timerState === 'stopped' && (
          <button
            onClick={startTimer}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
          >
            Timer starten
          </button>
        )}
        
        {timerState === 'running' && (
          <button
            onClick={pauseTimer}
            className="px-6 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 font-medium"
          >
            Pause
          </button>
        )}
        
        {timerState === 'paused' && (
          <>
            <button
              onClick={resumeTimer}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
            >
              Fortsetzen
            </button>
            <button
              onClick={resetTimer}
              className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-medium"
            >
              Zurücksetzen
            </button>
          </>
        )}
        
        <button
          onClick={skipToPreviousRound}
          disabled={currentRound === 0}
          className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 font-medium"
        >
          ← Vorherige
        </button>
        
        <button
          onClick={skipToNextRound}
          disabled={isLastRound}
          className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 font-medium"
        >
          Nächste →
        </button>
      </div>
      
      {/* Timer settings info */}
      <div className="mt-4 text-sm text-gray-600 text-center">
        Rundendauer: {event.roundDuration} Minuten
        {event.breaks && event.breaks.length > 0 && ' • Pausen konfiguriert'}
      </div>
    </div>
  )
}
