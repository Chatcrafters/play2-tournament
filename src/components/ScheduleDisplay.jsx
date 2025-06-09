import { useState, useEffect } from 'react'

export const ScheduleDisplay = ({ 
  schedule, 
  selectedEvent,
  currentTimelinePosition,
  timerState,
  showResults,
  setShowResults,
  showExportMenu,
  setShowExportMenu,
  scoreSystem,
  setScoreSystem,
  updateMatchResult,
  calculateStandings,
  exportToPDF,
  shareViaWhatsApp,
  sharePlayerSchedule,
  highlightRound
}) => {
  const [activeDay, setActiveDay] = useState(0)
  
  // Gruppiere Runden nach Tagen
  const roundsByDay = schedule.rounds.reduce((acc, round) => {
    const dayKey = round.date || selectedEvent.date
    if (!acc[dayKey]) {
      acc[dayKey] = {
        date: dayKey,
        dayName: round.dayName || new Date(dayKey).toLocaleDateString('de-DE', { weekday: 'long' }),
        rounds: []
      }
    }
    acc[dayKey].rounds.push(round)
    return acc
  }, {})

  const days = Object.values(roundsByDay).sort((a, b) => 
    new Date(a.date) - new Date(b.date)
  )

  // Helper function to get player name by ID
  const getPlayerName = (playerId) => {
    const player = selectedEvent.players.find(p => p.id === playerId)
    return player ? player.name : 'Unknown'
  }
const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-2xl font-bold">Spielplan</h3>
        <div className="flex gap-2">
          <button
            onClick={() => setShowResults(!showResults)}
            className={`px-4 py-2 rounded ${
              showResults 
                ? 'bg-green-600 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {showResults ? '✓ Ergebnisse' : 'Ergebnisse'}
          </button>
          
          <div className="relative">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
            >
              Export ↓
            </button>
            
            {showExportMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border">
                <button
                  onClick={() => {
                    exportToPDF()
                    setShowExportMenu(false)
                  }}
                  className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                >
                  📄 Als PDF drucken
                </button>
                <button
                  onClick={() => {
                    shareViaWhatsApp()
                    setShowExportMenu(false)
                  }}
                  className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                >
                  💬 Ergebnisse teilen
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs für mehrtägige Events */}
      {days.length > 1 && (
        <div className="flex space-x-1 mb-6 border-b">
          {days.map((day, index) => (
            <button
              key={day.date}
              onClick={() => setActiveDay(index)}
              className={`px-4 py-2 font-medium transition-colors ${
                activeDay === index 
                  ? 'text-blue-600 border-b-2 border-blue-600' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {day.dayName}
              <span className="ml-2 text-sm text-gray-400">
                {new Date(day.date).toLocaleDateString('de-DE', { 
                  day: 'numeric',
                  month: 'short' 
                })}
              </span>
            </button>
          ))}
        </div>
      )}

{/* Spielplan für aktiven Tag */}
      <div className="space-y-4">
        {(days[activeDay] || days[0]).rounds.map((round, roundIndex) => {
          const actualRoundIndex = schedule.rounds.findIndex(r => r === round)
          
          return (
            <div 
              key={actualRoundIndex} 
              id={`round-${actualRoundIndex}`}
              className={`border rounded-lg p-4 transition-all duration-300 ${
                highlightRound === actualRoundIndex 
                  ? 'border-2 border-purple-500 bg-purple-50 shadow-lg ring-2 ring-purple-300' 
                  : round.isBreak ? 'bg-gray-50 border-gray-300' : 'bg-white border-gray-200'
              }`}
            >
              {/* Aktive Runde Indicator */}
              {highlightRound === actualRoundIndex && timerState?.isRunning && (
                <div className="mb-3 flex items-center justify-between bg-purple-100 p-2 rounded">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-purple-600 rounded-full animate-pulse mr-2"></div>
                    <span className="text-purple-800 font-semibold">Aktive Runde</span>
                  </div>
                  <div className="text-purple-800 font-mono font-bold">
                    {formatTime(timerState.timeRemaining)}
                  </div>
                </div>
              )}

              {/* Tag-Info nur bei eintägigen Events */}
              {days.length === 1 && roundIndex === 0 && (
                <div className="text-sm text-gray-500 mb-2">
                  {round.dayName}, {new Date(round.date).toLocaleDateString('de-DE')}
                </div>
              )}
              
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-semibold">
                  {round.isBreak ? round.breakName : `Runde ${round.roundNumber}`}
                </h4>
                <span className="text-sm text-gray-500">
                  {round.startTime} - {round.endTime}
                </span>
              </div>
              
              {!round.isBreak && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {round.matches.map((match, matchIndex) => (
                      <div key={matchIndex} className="bg-gray-50 rounded p-3">
                        <div className="font-medium text-sm text-gray-600 mb-1">
                          Court {match.court}
                        </div>
                        
                        {/* Team 1 */}
                        <div className="text-sm mb-1">
                          {getPlayerName(match.players[0])} & {getPlayerName(match.players[1])}
                        </div>
                        
                        {/* vs */}
                        <div className="text-xs text-gray-500 text-center">vs</div>
                        
                        {/* Team 2 */}
                        <div className="text-sm mb-2">
                          {getPlayerName(match.players[2])} & {getPlayerName(match.players[3])}
                        </div>
                        
                        {/* Ergebnis-Eingabe */}
                        {showResults && (
                          <div className="flex gap-2 mt-2">
                            <input
                              type="number"
                              min="0"
                              max="99"
                              className="w-16 px-2 py-1 border rounded text-center"
                              placeholder="0"
                              value={selectedEvent.results?.[`${actualRoundIndex}-${matchIndex}`]?.team1Score || ''}
                              onChange={(e) => updateMatchResult(
                                actualRoundIndex,
                                matchIndex,
                                e.target.value,
                                selectedEvent.results?.[`${actualRoundIndex}-${matchIndex}`]?.team2Score || 0
                              )}
                            />
                            <span className="self-center">:</span>
                            <input
                              type="number"
                              min="0"
                              max="99"
                              className="w-16 px-2 py-1 border rounded text-center"
                              placeholder="0"
                              value={selectedEvent.results?.[`${actualRoundIndex}-${matchIndex}`]?.team2Score || ''}
                              onChange={(e) => updateMatchResult(
                                actualRoundIndex,
                                matchIndex,
                                selectedEvent.results?.[`${actualRoundIndex}-${matchIndex}`]?.team1Score || 0,
                                e.target.value
                              )}
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  
                  {/* Pausende Spieler */}
                  {round.restingPlayerIds && round.restingPlayerIds.length > 0 && (
                    <div className="mt-3 text-sm text-gray-600">
                      <span className="font-medium">Pause: </span>
                      {round.restingPlayerIds.map(id => getPlayerName(id)).join(', ')}
                    </div>
                  )}
                </>
              )}
            </div>
          )
        })}
      </div>

      {/* Tabelle/Standings */}
      {showResults && (
        <div className="mt-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold">Tabelle</h3>
            <div className="flex gap-2">
              <button
                onClick={() => setScoreSystem('americano')}
                className={`px-3 py-1 rounded ${
                  scoreSystem === 'americano' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-700'
                }`}
              >
                Americano
              </button>
              <button
                onClick={() => setScoreSystem('normal')}
                className={`px-3 py-1 rounded ${
                  scoreSystem === 'normal' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-700'
                }`}
              >
                Normal (3-1-0)
              </button>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border p-2 text-left">#</th>
                  <th className="border p-2 text-left">Name</th>
                  <th className="border p-2 text-center">Spiele</th>
                  <th className="border p-2 text-center">Punkte</th>
                  <th className="border p-2 text-center">Tore</th>
                  <th className="border p-2 text-center">Diff</th>
                  <th className="border p-2 text-center">Aktionen</th>
                </tr>
              </thead>
              <tbody>
                {calculateStandings().map((player, index) => (
                  <tr key={player.name} className={index < 3 ? 'bg-green-50' : ''}>
                    <td className="border p-2">{index + 1}</td>
                    <td className="border p-2 font-medium">{player.name}</td>
                    <td className="border p-2 text-center">{player.played}</td>
                    <td className="border p-2 text-center font-bold">{player.points}</td>
                    <td className="border p-2 text-center">
                      {player.goalsFor}:{player.goalsAgainst}
                    </td>
                    <td className="border p-2 text-center">
                      {player.goalDifference > 0 ? '+' : ''}{player.goalDifference}
                    </td>
                    <td className="border p-2 text-center">
                      <button
                        onClick={() => {
                          const playerId = selectedEvent.players.find(p => p.name === player.name)?.id
                          if (playerId) sharePlayerSchedule(playerId)
                        }}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        📅 Spielplan
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}