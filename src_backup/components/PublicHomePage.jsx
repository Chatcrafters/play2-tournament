import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { formatTimeRange } from '../utils/timeFormat'

export function PublicHomePage({ onLogin }) {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterSport, setFilterSport] = useState('all')
  const [selectedEvent, setSelectedEvent] = useState(null)

  // Lade öffentliche Events
  useEffect(() => {
    loadPublicEvents()
  }, [])

  const loadPublicEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('is_public', true)
        .gte('date', new Date().toISOString().split('T')[0])
        .order('date', { ascending: true })

      if (error) throw error
      setEvents(data || [])
    } catch (error) {
      console.error('Error loading public events:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredEvents = filterSport === 'all' 
    ? events 
    : events.filter(e => e.sport === filterSport)

  const getSportEmoji = (sport) => {
    switch(sport) {
      case 'padel': return '🎾'
      case 'pickleball': return '🏓'
      case 'spinxball': return '🔄'
      default: return '🏸'
    }
  }

  const getSportBadgeClass = (sport) => {
    switch(sport) {
      case 'padel': return 'bg-emerald-100 text-emerald-800'
      case 'pickleball': return 'bg-amber-100 text-amber-800'
      case 'spinxball': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="min-h-screen play2-bg-aurora">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 relative z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">
                P2
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Play2</h1>
                <p className="text-xs text-gray-500">Turnierplattform für Padel, Pickleball & SpinXball</p>
              </div>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={onLogin}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                Turnierdirektor Login
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 bg-white bg-opacity-90 backdrop-blur-sm py-16">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Finde dein nächstes Turnier
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Entdecke Padel-, Pickleball- und SpinXball-Turniere in deiner Nähe
          </p>
          
          {/* Sport Filter */}
          <div className="flex justify-center gap-3 mb-8">
            <button
              onClick={() => setFilterSport('all')}
              className={`px-6 py-2 rounded-full transition-all ${
                filterSport === 'all' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Alle Sportarten
            </button>
            <button
              onClick={() => setFilterSport('padel')}
              className={`px-6 py-2 rounded-full transition-all ${
                filterSport === 'padel' 
                  ? 'bg-emerald-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              🎾 Padel
            </button>
            <button
              onClick={() => setFilterSport('pickleball')}
              className={`px-6 py-2 rounded-full transition-all ${
                filterSport === 'pickleball' 
                  ? 'bg-amber-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              🏓 Pickleball
            </button>
            <button
              onClick={() => setFilterSport('spinxball')}
              className={`px-6 py-2 rounded-full transition-all ${
                filterSport === 'spinxball' 
                  ? 'bg-purple-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              🔄 SpinXball
            </button>
          </div>
        </div>
      </section>

      {/* Events Grid */}
      <main className="max-w-7xl mx-auto px-4 py-8 relative z-10">
        {loading ? (
          <div className="text-center py-16">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Lade Turniere...</p>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center">
              <span className="text-4xl">📅</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Keine Turniere gefunden
            </h3>
            <p className="text-gray-600">
              {filterSport !== 'all' 
                ? `Keine ${filterSport} Turniere verfügbar.`
                : 'Momentan sind keine öffentlichen Turniere verfügbar.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((event) => {
              const eventDate = new Date(event.date)
              const registrationDeadline = event.registration_deadline ? new Date(event.registration_deadline) : null
              const isRegistrationOpen = !registrationDeadline || registrationDeadline > new Date()
              const spotsLeft = event.max_players - (event.players?.length || 0)
              
              return (
                <div 
                  key={event.id} 
                  className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => setSelectedEvent(event)}
                >
                  {/* Event Header with Sport Color */}
                  <div className={`h-2 rounded-t-lg ${
                    event.sport === 'padel' ? 'bg-emerald-500' :
                    event.sport === 'pickleball' ? 'bg-amber-500' :
                    'bg-purple-500'
                  }`}></div>
                  
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="text-xl font-bold text-gray-900">{event.name}</h3>
                      <span className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${getSportBadgeClass(event.sport)}`}>
                        {event.sport}
                      </span>
                    </div>
                    
                    <div className="space-y-2 text-gray-600 mb-4">
                      <p className="flex items-center gap-2">
                        <span>📅</span>
                        <span>{eventDate.toLocaleDateString('de-DE', { 
                          weekday: 'long', 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}</span>
                      </p>
                      <p className="flex items-center gap-2">
                        <span>🕐</span>
                        <span>{formatTimeRange(event.start_time, event.end_time)}</span>
                      </p>
                      <p className="flex items-center gap-2">
                        <span>📍</span>
                        <span>{event.location || 'Ort wird noch bekannt gegeben'}</span>
                      </p>
                      {event.entry_fee > 0 && (
                        <p className="flex items-center gap-2">
                          <span>💰</span>
                          <span>{event.entry_fee}€ Startgebühr</span>
                        </p>
                      )}
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <div className="text-sm">
                        <span className="font-semibold text-gray-900">{event.players?.length || 0}</span>
                        <span className="text-gray-600">/{event.max_players} Spieler</span>
                      </div>
                      
                      {isRegistrationOpen ? (
                        <button 
                          className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                            spotsLeft > 0 
                              ? 'bg-green-600 text-white hover:bg-green-700' 
                              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          }`}
                          disabled={spotsLeft === 0}
                        >
                          {spotsLeft > 0 ? 'Anmelden' : 'Ausgebucht'}
                        </button>
                      ) : (
                        <span className="text-sm text-red-600 font-medium">
                          Anmeldung geschlossen
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>

      {/* Event Detail Modal */}
      {selectedEvent && (
        <EventDetailModal 
          event={selectedEvent} 
          onClose={() => setSelectedEvent(null)}
        />
      )}

      {/* Footer */}
      <footer className="mt-16 py-8 border-t border-gray-200 bg-white relative z-10">
        <div className="max-w-7xl mx-auto px-4 text-center text-gray-600">
          <p className="text-sm">
            © 2025 Play2 - play2.club | Tournament Management Platform
          </p>
        </div>
      </footer>
    </div>
  )
}

// Temporäre EventDetailModal Komponente (bis separate Datei erstellt wird)
function EventDetailModal({ event, onClose }) {
  const eventDate = new Date(event.date)
  const spotsLeft = event.max_players - (event.players?.length || 0)
  
  // Debug Info - Temporär als globale Variable für Debugging
  window.debugEvent = event
  
  console.log('Event Data:', event)
  console.log('Schedule:', event.schedule)
  console.log('Players:', event.players)
  console.log('Results:', event.results)
  
  // Detaillierte Debug Info
  if (event.schedule && event.schedule.length > 0) {
    console.log('First Match Structure:', JSON.stringify(event.schedule[0], null, 2))
    // Check for results in matches
    const firstMatchWithResult = event.schedule.find(round => 
      round.matches?.find(match => match.result || match.score)
    )
    if (firstMatchWithResult) {
      console.log('Match with result:', firstMatchWithResult)
    }
  }
  if (event.players && event.players.length > 0) {
    console.log('First Player Structure:', JSON.stringify(event.players[0], null, 2))
  }
  
  // Gruppiere Spielplan nach Runden
  const getScheduleByRounds = () => {
    if (!event.schedule || event.schedule.length === 0) return []
    
    // Neue Struktur: schedule ist bereits nach Runden gruppiert
    if (event.schedule[0] && event.schedule[0].round !== undefined) {
      return event.schedule.map(roundData => ({
        round: roundData.round,
        matches: roundData.matches || []
      })).sort((a, b) => a.round - b.round)
    }
    
    // Alte Struktur (Fallback)
    const rounds = {}
    event.schedule.forEach(match => {
      if (!rounds[match.round]) {
        rounds[match.round] = []
      }
      rounds[match.round].push(match)
    })
    
    return Object.entries(rounds).map(([round, matches]) => ({
      round: parseInt(round),
      matches: matches.sort((a, b) => a.court - b.court)
    })).sort((a, b) => a.round - b.round)
  }
  
  const scheduleByRounds = getScheduleByRounds()
  
  // Helper um Spielernamen zu bekommen
  const getPlayerName = (player) => {
    if (!player) return 'TBD'
    // Wenn player bereits ein Objekt mit name ist
    if (typeof player === 'object' && player.name) {
      return player.name
    }
    // Wenn player eine ID ist
    if (typeof player === 'string') {
      const foundPlayer = event.players?.find(p => p.id === player)
      return foundPlayer?.name || 'TBD'
    }
    return 'TBD'
  }
  
  // Helper um Team-Spieler zu bekommen
  const getTeamPlayers = (team) => {
    if (!team || !Array.isArray(team) || team.length === 0) {
      return { player1: 'TBD', player2: 'TBD' }
    }
    
    return {
      player1: getPlayerName(team[0]),
      player2: getPlayerName(team[1]) || 'TBD'
    }
  }
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex justify-between items-start p-6 border-b">
          <h2 className="text-2xl font-bold">{event.name}</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ✕
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-100px)]">
          <div className="space-y-3 mb-6">
            <p>📅 {eventDate.toLocaleDateString('de-DE')}</p>
            <p>🕐 {formatTimeRange(event.start_time, event.end_time)}</p>
            <p>📍 {event.location}</p>
            <p>👥 {event.players?.length || 0}/{event.max_players} Spieler</p>
          </div>
          
          {event.event_info && (
            <div className="mb-6 p-4 bg-gray-50 rounded">
              <h3 className="font-semibold mb-2">Turnier-Information</h3>
              <p className="text-gray-600">{event.event_info}</p>
            </div>
          )}
          
          {/* Teilnehmerliste */}
          {event.players && event.players.length > 0 && (
            <div className="mb-6">
              <h3 className="font-semibold text-lg mb-3">Teilnehmer ({event.players.length})</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {event.players.map((player, index) => (
                  <div key={player.id || index} className="bg-gray-100 rounded px-3 py-2 text-sm">
                    {player.name}
                    {player.skill && (
                      <span className="text-gray-500 ml-1">({player.skill})</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Spielplan */}
          {scheduleByRounds.length > 0 && (
            <div className="mb-6">
              <h3 className="font-semibold text-lg mb-3">Spielplan</h3>
              <div className="space-y-4">
                {scheduleByRounds.map(({ round, matches }) => (
                  <div key={round} className="border rounded-lg p-4">
                    <h4 className="font-medium text-gray-700 mb-2">
                      Runde {round} - {matches[0]?.time || ''}
                    </h4>
                    <div className="grid gap-2">
                      {matches.map((match, idx) => {
                        const team1Players = getTeamPlayers(match.team1)
                        const team2Players = getTeamPlayers(match.team2)
                        
                        return (
                          <div key={idx} className="bg-gray-50 rounded p-3 mb-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3 flex-1">
                                <span className="text-sm font-medium text-gray-500 w-16">
                                  Platz {match.court}
                                </span>
                                <div className="flex items-center gap-2 flex-1">
                                  <span className="font-medium">
                                    {team1Players.player1} & {team1Players.player2}
                                  </span>
                                  <span className="text-gray-400 mx-2">vs</span>
                                  <span className="font-medium">
                                    {team2Players.player1} & {team2Players.player2}
                                  </span>
                                </div>
                              </div>
                              {/* Ergebnis anzeigen */}
                              <div className="ml-4">
                                {(() => {
                                  const resultKey = `${round - 1}-${match.court - 1}`
                                  const matchResult = event.results?.[resultKey]
                                  
                                  if (matchResult?.result && (matchResult.result.team1_score !== undefined || matchResult.result.team2_score !== undefined)) {
                                    return (
                                      <span className="font-bold text-lg">
                                        {matchResult.result.team1_score || 0} - {matchResult.result.team2_score || 0}
                                      </span>
                                    )
                                  }
                                  return <span className="text-gray-400">-</span>
                                })()}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Ergebnisse/Tabelle */}
          {event.results && Object.keys(event.results).length > 0 && (
            <div className="mb-6">
              <h3 className="font-semibold text-lg mb-3">Aktuelle Tabelle</h3>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border p-2 text-left">Pos</th>
                      <th className="border p-2 text-left">Spieler</th>
                      <th className="border p-2 text-center">Spiele</th>
                      <th className="border p-2 text-center">Punkte</th>
                      <th className="border p-2 text-center">Diff</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(event.results)
                      .map(([playerId, stats]) => {
                        const player = event.players.find(p => p.id === playerId)
                        return {
                          name: player?.name || 'Unbekannt',
                          ...stats
                        }
                      })
                      .sort((a, b) => {
                        if (b.points !== a.points) return b.points - a.points
                        return b.pointDiff - a.pointDiff
                      })
                      .map((player, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="border p-2">{index + 1}</td>
                          <td className="border p-2">{player.name}</td>
                          <td className="border p-2 text-center">{player.games || 0}</td>
                          <td className="border p-2 text-center font-semibold">{player.points || 0}</td>
                          <td className="border p-2 text-center">
                            {player.pointDiff > 0 ? '+' : ''}{player.pointDiff || 0}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          
          <button 
            className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold"
            onClick={() => alert('Anmeldung kommt bald!')}
          >
            Für dieses Turnier anmelden
          </button>
        </div>
      </div>
    </div>
  )
}