import { useState } from 'react'
import { generateAmericanoSchedule, canRegenerateSchedule, getRegenerateMessage } from '../utils/americanoAlgorithm'

export const ScheduleGenerator = ({ event, onUpdateEvent, onScheduleGenerated }) => {
  const [regenerateCount, setRegenerateCount] = useState(0)
  const [isGenerating, setIsGenerating] = useState(false)
  
  const generateSchedule = async () => {
    setIsGenerating(true)
    
    try {
      // Für Americano den neuen Algorithmus verwenden
      if (event.eventType === 'americano') {
        const { schedule, statistics } = generateAmericanoSchedule(
          event.players,
          event.courts,
          calculateRounds(),
          {
            regenerateCount,
            eventId: event.id,
            ...event.advancedOptions
          }
        )
        
        // Konvertiere zum erwarteten Format
        const formattedSchedule = {
          rounds: schedule.map((round, index) => ({
            roundNumber: round.round,
            matches: round.matches,
            restingPlayerIds: round.restingPlayerIds,
            startTime: calculateRoundTime(index).start,
            endTime: calculateRoundTime(index).end,
            date: event.date,
            isBreak: false
          })),
          statistics,
          regenerateCount
        }
        
        // Update Event mit neuem Schedule
        const updatedEvent = {
          ...event,
          schedule: formattedSchedule,
          regenerateCount
        }
        
        await onUpdateEvent(updatedEvent)
        onScheduleGenerated(formattedSchedule)
        
        // Erhöhe Regenerate Counter
        setRegenerateCount(prev => prev + 1)
        
      } else {
        // Für andere Event-Typen: bestehende Logik
        // ... (existing code für liga, tournament, etc.)
      }
      
    } catch (error) {
      console.error('Fehler beim Generieren des Spielplans:', error)
      alert('Fehler beim Erstellen des Spielplans')
    } finally {
      setIsGenerating(false)
    }
  }
  
  const calculateRounds = () => {
    // Ihre bestehende Logik zur Rundenberechnung
    const totalMinutes = calculateTotalMinutes(event)
    return Math.floor(totalMinutes / event.roundDuration)
  }
  
  const calculateRoundTime = (roundIndex) => {
    // Ihre bestehende Logik zur Zeitberechnung
    const startMinutes = roundIndex * event.roundDuration
    const endMinutes = startMinutes + event.roundDuration
    
    // Konvertiere zu Zeitstrings
    const baseTime = new Date(`2024-01-01 ${event.startTime}`)
    const startTime = new Date(baseTime.getTime() + startMinutes * 60000)
    const endTime = new Date(baseTime.getTime() + endMinutes * 60000)
    
    return {
      start: startTime.toTimeString().slice(0, 5),
      end: endTime.toTimeString().slice(0, 5)
    }
  }
  
  const calculateTotalMinutes = (event) => {
    // Ihre bestehende Logik
    const start = new Date(`2024-01-01 ${event.startTime}`)
    const end = new Date(`2024-01-01 ${event.endTime}`)
    return (end - start) / 60000
  }
  
  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h3 className="text-xl font-bold mb-4">Spielplan Generator</h3>
      
      {!event.schedule ? (
        <button
          onClick={generateSchedule}
          disabled={isGenerating || event.players.length < 4}
          className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400"
        >
          {isGenerating ? 'Generiere...' : 'Spielplan generieren'}
        </button>
      ) : (
        <div className="space-y-4">
          <div className="bg-green-50 p-4 rounded-lg">
            <p className="text-green-800">
              ✓ Spielplan wurde erstellt
              {event.eventType === 'americano' && event.regenerateCount !== undefined && (
                <span className="text-sm text-gray-600 ml-2">
                  (Variante {(event.regenerateCount % 4) + 1}/4)
                </span>
              )}
            </p>
          </div>
          
          {event.eventType === 'americano' && (
            <button
              onClick={generateSchedule}
              disabled={isGenerating}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
            >
              {isGenerating ? 'Generiere...' : getRegenerateMessage(regenerateCount)}
            </button>
          )}
        </div>
      )}
      
      {event.players.length < 4 && (
        <p className="text-red-600 text-sm mt-2">
          Mindestens 4 Spieler erforderlich
        </p>
      )}
    </div>
  )
}