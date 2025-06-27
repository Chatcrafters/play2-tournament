import { useState } from 'react'
import { formatTimeRange } from '../utils/timeFormat'

export function EventDetailModal({ event, onClose }) {
  const [showRegistration, setShowRegistration] = useState(false)
  
  const eventDate = new Date(event.date)
  const endDate = event.end_date ? new Date(event.end_date) : null
  const isMultiDay = endDate && eventDate.toDateString() !== endDate.toDateString()
  const spotsLeft = event.max_players - (event.players?.length || 0)
  
  const getSportColor = (sport) => {
    switch(sport) {
      case 'padel': return 'bg-emerald-500'
      case 'pickleball': return 'bg-amber-500'
      case 'spinxball': return 'bg-purple-500'
      default: return 'bg-gray-500'
    }
  }

  const handleRegistration = () => {
    // Später implementieren wir hier die Spieler-Registrierung
    alert('Registrierung wird in Kürze verfügbar sein!')
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className={`${getSportColor(event.sport)} text-white p-6`}>
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold mb-2">{event.name}</h2>
              <p className="text-white/90">{event.sport.charAt(0).toUpperCase() + event.sport.slice(1)} {event.event_type}</p>
            </div>
            <button 
              onClick={onClose}
              className="text-white hover:text-white/80 text-2xl"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Event Details */}
          <div className="space-y-4 mb-6">
            <div className="flex items-start gap-3">
              <span className="text-2xl">📅</span>
              <div>
                <p className="font-semibold text-gray-900">Datum</p>
                {isMultiDay ? (
                  <p className="text-gray-600">
                    {eventDate.toLocaleDateString('de-DE')} - {endDate.toLocaleDateString('de-DE')}
                  </p>
                ) : (
                  <p className="text-gray-600">
                    {eventDate.toLocaleDateString('de-DE', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="text-2xl">🕐</span>
              <div>
                <p className="font-semibold text-gray-900">Zeit</p>
                <p className="text-gray-600">{formatTimeRange(event.start_time, event.end_time)}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="text-2xl">📍</span>
              <div>
                <p className="font-semibold text-gray-900">Ort</p>
                <p className="text-gray-600">{event.location || 'Wird noch bekannt gegeben'}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="text-2xl">🏆</span>
              <div>
                <p className="font-semibold text-gray-900">Format</p>
                <p className="text-gray-600">
                  {event.format === 'singles' ? 'Einzel' : 'Doppel'} • 
                  {event.courts} {event.courts === 1 ? 'Platz' : 'Plätze'} • 
                  {event.round_duration} Min. pro Runde
                </p>
              </div>
            </div>

            {event.entry_fee > 0 && (
              <div className="flex items-start gap-3">
                <span className="text-2xl">💰</span>
                <div>
                  <p className="font-semibold text-gray-900">Startgebühr</p>
                  <p className="text-gray-600">{event.entry_fee}€ pro Person</p>
                </div>
              </div>
            )}

            <div className="flex items-start gap-3">
              <span className="text-2xl">👥</span>
              <div>
                <p className="font-semibold text-gray-900">Teilnehmer</p>
                <div className="mt-1">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-4">
                      <div 
                        className="bg-green-500 h-4 rounded-full transition-all"
                        style={{ width: `${(event.players?.length || 0) / event.max_players * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-sm text-gray-600">
                      {event.players?.length || 0}/{event.max_players}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    {spotsLeft > 0 ? `${spotsLeft} Plätze frei` : 'Ausgebucht'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Event Info */}
          {event.event_info && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-gray-900 mb-2">Turnier-Information</h3>
              <p className="text-gray-600 whitespace-pre-wrap">{event.event_info}</p>
            </div>
          )}

          {/* Teilnehmerliste */}
          {event.players && event.players.length > 0 && (
            <div className="mb-6">
              <h3 className="font-semibold text-gray-900 mb-3">Angemeldete Spieler ({event.players.length})</h3>
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

          {/* Registration Button */}
          {spotsLeft > 0 && (
            <div className="border-t pt-6">
              <button
                onClick={handleRegistration}
                className="w-full py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors"
              >
                Jetzt anmelden
              </button>
              <p className="text-center text-sm text-gray-500 mt-2">
                Sie werden zur Registrierung weitergeleitet
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}