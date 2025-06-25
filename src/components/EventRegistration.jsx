import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Calendar, Clock, MapPin, Users, Trophy, Info } from 'lucide-react'

export const EventRegistration = () => {
  const { eventId } = useParams()
  const navigate = useNavigate()
  const [event, setEvent] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)
  const [error, setError] = useState('')
  
  // Form States
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    gender: 'male',
    skillLevel: 'B', // Default für Padel
    agreeToTerms: false
  })

  // Lade Event-Daten
  useEffect(() => {
    loadEvent()
  }, [eventId])

  const loadEvent = async () => {
    try {
      setIsLoading(true)
      // Hier würde normalerweise ein API-Call stehen
      const eventData = JSON.parse(localStorage.getItem('events') || '[]')
      const foundEvent = eventData.find(e => e.id === eventId)
      
      if (!foundEvent) {
        setError('Event nicht gefunden')
        return
      }
      
      setEvent(foundEvent)
      
      // Setze Default-Geschlecht basierend auf Event
      if (foundEvent.genderMode === 'women') {
        setFormData(prev => ({ ...prev, gender: 'female' }))
      } else if (foundEvent.genderMode === 'men') {
        setFormData(prev => ({ ...prev, gender: 'male' }))
      }
      
      // Setze Default Skill Level basierend auf Sportart
      if (foundEvent.sport !== 'padel') {
        setFormData(prev => ({ ...prev, skillLevel: 3 }))
      }
    } catch (error) {
      console.error('Fehler beim Laden des Events:', error)
      setError('Fehler beim Laden des Events')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.agreeToTerms) {
      alert('Bitte akzeptieren Sie die Teilnahmebedingungen')
      return
    }

    // Validierung
    if (event.genderMode !== 'open' && 
        ((event.genderMode === 'men' && formData.gender !== 'male') ||
         (event.genderMode === 'women' && formData.gender !== 'female'))) {
      alert(`Dieses Event ist nur für ${event.genderMode === 'men' ? 'Männer' : 'Frauen'} zugänglich.`)
      return
    }

    // Prüfe ob Event voll ist
    if (event.players.length >= event.maxPlayers) {
      alert('Dieses Event ist leider bereits voll.')
      return
    }

    // Prüfe ob Spieler bereits angemeldet
    const alreadyRegistered = event.players.some(
      p => p.email === formData.email || p.phone === formData.phone
    )
    if (alreadyRegistered) {
      alert('Sie sind bereits für dieses Event angemeldet.')
      return
    }

    try {
      setIsSubmitting(true)
      
      // Erstelle neuen Spieler
      const newPlayer = {
        id: `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim(),
        gender: formData.gender,
        skillLevel: formData.skillLevel,
        registeredAt: new Date().toISOString(),
        skillLevels: {
          padel: event.sport === 'padel' ? formData.skillLevel : 'B',
          pickleball: event.sport === 'pickleball' ? formData.skillLevel : 3,
          spinxball: event.sport === 'spinxball' ? formData.skillLevel : 3
        }
      }

      // Update Event
      const updatedEvent = {
        ...event,
        players: [...event.players, newPlayer]
      }

      // Speichere in localStorage (später API-Call)
      const events = JSON.parse(localStorage.getItem('events') || '[]')
      const eventIndex = events.findIndex(e => e.id === eventId)
      events[eventIndex] = updatedEvent
      localStorage.setItem('events', JSON.stringify(events))

      setEvent(updatedEvent)
      setShowSuccessMessage(true)
      
      // Reset Form
      setFormData({
        name: '',
        email: '',
        phone: '',
        gender: event.genderMode === 'women' ? 'female' : 'male',
        skillLevel: event.sport === 'padel' ? 'B' : 3,
        agreeToTerms: false
      })

      // Nach 3 Sekunden Success-Message ausblenden
      setTimeout(() => {
        setShowSuccessMessage(false)
      }, 5000)

    } catch (error) {
      console.error('Fehler bei der Anmeldung:', error)
      alert('Fehler bei der Anmeldung. Bitte versuchen Sie es erneut.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Lade Event-Daten...</p>
        </div>
      </div>
    )
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-red-600 mb-4">{error || 'Event nicht gefunden'}</p>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Zur Startseite
          </button>
        </div>
      </div>
    )
  }

  const availableSlots = event.maxPlayers - event.players.length
  const isEventFull = availableSlots <= 0
  const eventDate = new Date(event.date)
  const isEventPast = eventDate < new Date()

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        {/* Event Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-3xl font-bold mb-2">{event.title}</h1>
          <p className="text-gray-600 mb-4">{event.description}</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-500" />
              <span>{eventDate.toLocaleDateString('de-DE', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-500" />
              <span>{event.startTime} - {event.endTime} Uhr</span>
            </div>
            
            {event.location && (
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-gray-500" />
                <span>{event.location}</span>
              </div>
            )}
            
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-gray-500" />
              <span>{event.sport === 'padel' ? 'Padel' : 
                     event.sport === 'pickleball' ? 'Pickleball' : 
                     'SpinXball'}</span>
            </div>
          </div>

          {/* Teilnehmer Status */}
          <div className="mt-6 p-4 bg-gray-100 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-gray-600" />
                <span className="font-medium">Teilnehmer:</span>
              </div>
              <span className={`font-bold ${isEventFull ? 'text-red-600' : 'text-green-600'}`}>
                {event.players.length} / {event.maxPlayers}
              </span>
            </div>
            
            {!isEventFull && (
              <p className="text-sm text-gray-600 mt-2">
                Noch {availableSlots} {availableSlots === 1 ? 'Platz' : 'Plätze'} verfügbar
              </p>
            )}
            
            {event.genderMode !== 'open' && (
              <p className="text-sm text-blue-600 mt-2">
                {event.genderMode === 'men' ? '👨 Nur für Männer' : '👩 Nur für Frauen'}
              </p>
            )}
          </div>
        </div>

        {/* Success Message */}
        {showSuccessMessage && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg mb-6">
            <p className="font-bold">Erfolgreich angemeldet!</p>
            <p className="text-sm">Sie erhalten in Kürze eine Bestätigung per E-Mail.</p>
          </div>
        )}

        {/* Anmeldeformular */}
        {!isEventFull && !isEventPast ? (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold mb-6">Jetzt anmelden</h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  placeholder="Max Mustermann"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  E-Mail *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  placeholder="max@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Telefon *
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  placeholder="+49 123 456789"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Für kurzfristige Änderungen oder Absagen
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Geschlecht *
                </label>
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({...formData, gender: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  {(event.genderMode === 'open' || event.genderMode === 'men') && (
                    <option value="male">Männlich</option>
                  )}
                  {(event.genderMode === 'open' || event.genderMode === 'women') && (
                    <option value="female">Weiblich</option>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  {event.sport === 'padel' ? 'Padel' : 
                   event.sport === 'pickleball' ? 'Pickleball' : 
                   'SpinXball'} Level *
                </label>
                {event.sport === 'padel' ? (
                  <select
                    value={formData.skillLevel}
                    onChange={(e) => setFormData({...formData, skillLevel: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="C">C (Anfänger)</option>
                    <option value="B-">B- (Fortgeschrittener Anfänger)</option>
                    <option value="B">B (Unteres Mittelstufe)</option>
                    <option value="B+">B+ (Gutes Mittelstufe)</option>
                    <option value="A-">A- (Oberes Mittelstufe)</option>
                    <option value="A">A (Fortgeschritten/Profi)</option>
                  </select>
                ) : (
                  <select
                    value={formData.skillLevel}
                    onChange={(e) => setFormData({...formData, skillLevel: parseFloat(e.target.value)})}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="1">1.0 - Anfänger</option>
                    <option value="2">2.0 - Fortgeschritten</option>
                    <option value="3">3.0 - Gut</option>
                    <option value="4">4.0 - Sehr gut</option>
                    <option value="5">5.0 - Experte</option>
                  </select>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Für ausgeglichene Spielpaarungen
                </p>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div className="text-sm text-blue-800">
                    <p className="font-semibold mb-1">Wichtige Informationen:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Die Teilnahmegebühr beträgt {event.price || '10'}€</li>
                      <li>Zahlung erfolgt vor Ort</li>
                      <li>Bei Absage bitte mindestens 24h vorher Bescheid geben</li>
                      <li>Spielpaarungen werden nach Skill-Level eingeteilt</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div>
                <label className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    checked={formData.agreeToTerms}
                    onChange={(e) => setFormData({...formData, agreeToTerms: e.target.checked})}
                    className="mt-1"
                    required
                  />
                  <span className="text-sm">
                    Ich akzeptiere die Teilnahmebedingungen und bin damit einverstanden, 
                    dass meine Daten für die Organisation des Events verwendet werden. *
                  </span>
                </label>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full py-3 rounded-lg font-medium transition-colors ${
                  isSubmitting 
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {isSubmitting ? 'Wird angemeldet...' : 'Verbindlich anmelden'}
              </button>
            </form>
          </div>
        ) : isEventFull ? (
          <div className="bg-orange-100 border border-orange-400 text-orange-700 px-4 py-3 rounded-lg">
            <p className="font-bold">Event ausgebucht!</p>
            <p className="text-sm mt-1">
              Leider sind bereits alle Plätze vergeben. Kontaktieren Sie den Veranstalter für die Warteliste.
            </p>
          </div>
        ) : (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
            <p className="font-bold">Event bereits vorbei</p>
            <p className="text-sm mt-1">
              Dieses Event hat bereits stattgefunden.
            </p>
          </div>
        )}

        {/* Aktuelle Teilnehmer (anonymisiert) */}
        {event.players.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mt-6">
            <h3 className="text-lg font-semibold mb-4">
              Angemeldete Teilnehmer ({event.players.length})
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {event.players.map((player, index) => (
                <div key={player.id || index} className="text-sm text-gray-600">
                  {player.name.split(' ')[0]} {player.name.split(' ')[1]?.[0]}.
                  {player.gender === 'female' ? ' ♀️' : ' ♂️'}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}