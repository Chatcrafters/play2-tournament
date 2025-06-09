import { useState } from 'react'

export const PlayerManagement = ({ event, onUpdateEvent, onOpenPlayerDatabase }) => {
  const [newPlayerName, setNewPlayerName] = useState('')
  // FIX: Verwende einen festen Initialwert statt der noch nicht definierten Variable 'sport'
  const [playerSkillLevel, setPlayerSkillLevel] = useState('B') // Für Padel default
  const [playerGender, setPlayerGender] = useState('male')
  const [showSkillDialog, setShowSkillDialog] = useState(false)

  // Sicherheitschecks
  if (!event) {
    return (
      <div className="bg-gray-50 p-4 rounded-lg mb-6">
        <p className="text-gray-500 text-center">Kein Event ausgewählt</p>
      </div>
    )
  }

  // Sichere Defaults
  const players = event.players || []
  const maxPlayers = event.maxPlayers || 16
  const sport = event.sport || 'padel'
  const genderMode = event.genderMode || 'open'
  const teamFormat = event.teamFormat || 'double'

  const handleAddPlayer = () => {
    if (newPlayerName.trim() && players.length < maxPlayers) {
      // Setze das richtige Default-Level basierend auf der Sportart beim Öffnen des Dialogs
      setPlayerSkillLevel(sport === 'padel' ? 'B' : 3.0)
      setShowSkillDialog(true)
    }
  }

  const confirmAddPlayer = () => {
  // Generiere eine eindeutige ID mit mehreren Komponenten für maximale Eindeutigkeit
  const uniqueId = `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}_${players.length}`
  
  const updatedEvent = {
    ...event,
    players: [...players, {
      id: uniqueId,
      name: newPlayerName.trim(),
      gender: playerGender,
      skillLevel: playerSkillLevel,
      skillLevels: {
        padel: sport === 'padel' ? playerSkillLevel : 'B',
        pickleball: sport === 'pickleball' ? playerSkillLevel : 3,
        spinxball: sport === 'spinxball' ? playerSkillLevel : 3
      }
    }]
  }
  onUpdateEvent(updatedEvent)
  setNewPlayerName('')
  setPlayerSkillLevel(sport === 'padel' ? 'B' : 3.0) // Reset mit korrektem Default
  setPlayerGender('male')
  setShowSkillDialog(false)
}

  const handleRemovePlayer = (playerId) => {
    const updatedEvent = {
      ...event,
      players: players.filter(p => p.id !== playerId)
    }
    onUpdateEvent(updatedEvent)
  }

  const getSkillLabel = (level) => {
    const labels = {
      1: 'Anfänger',
      2: 'Fortgeschritten', 
      3: 'Gut',
      4: 'Sehr gut',
      5: 'Experte'
    }
    return labels[level] || 'Gut'
  }

  const getSportLabel = (sport) => {
    const labels = {
      'padel': 'Padel',
      'pickleball': 'Pickleball',
      'spinxball': 'SpinXball'
    }
    return labels[sport] || sport
  }

  const getGenderIcon = (gender) => {
    switch(gender) {
      case 'female': return '👩'
      case 'male': return '👨'
      default: return '⚧'
    }
  }

  const getGenderLabel = () => {
    switch(genderMode) {
      case 'men': return 'Männer-Americano'
      case 'women': return 'Frauen-Americano'
      case 'mixed': return 'Mixed-Americano'
      default: return 'Open Americano'
    }
  }

  const getPlayerStatusColor = (player) => {
    // Bei Mixed: Zeige ob genug Männer/Frauen für Teams
    if (genderMode === 'mixed' && teamFormat === 'double') {
      const activeMen = players.filter(p => p.gender === 'male').length
      const activeWomen = players.filter(p => p.gender === 'female').length
      
      if (player.gender === 'male' && activeMen > activeWomen) {
        return 'text-orange-600' // Zu viele Männer
      }
      if (player.gender === 'female' && activeWomen > activeMen) {
        return 'text-orange-600' // Zu viele Frauen
      }
    }
    
    // Bei geschlechtsspezifischen Events: Markiere "Ausnahmen"
    if (genderMode === 'men' && player.gender === 'female') {
      return 'text-purple-600' // Frau bei Männer-Event
    }
    if (genderMode === 'women' && player.gender === 'male') {
      return 'text-purple-600' // Mann bei Frauen-Event
    }
    
    return 'text-gray-900'
  }

  // Sortiere Spieler nach Geschlechts-Modus
  const getSortedPlayers = () => {
    if (!players || players.length === 0) return []
    
    let sortedPlayers = [...players]
    
    switch(genderMode) {
      case 'men':
        // Männer zuerst, dann Frauen
        sortedPlayers.sort((a, b) => {
          if (a.gender === 'male' && b.gender !== 'male') return -1
          if (a.gender !== 'male' && b.gender === 'male') return 1
          return (a.name || '').localeCompare(b.name || '')
        })
        break
        
      case 'women':
        // Frauen zuerst, dann Männer
        sortedPlayers.sort((a, b) => {
          if (a.gender === 'female' && b.gender !== 'female') return -1
          if (a.gender !== 'female' && b.gender === 'female') return 1
          return (a.name || '').localeCompare(b.name || '')
        })
        break
        
      case 'mixed':
        // Getrennt nach Geschlecht für einfache Auswahl
        sortedPlayers.sort((a, b) => {
          if (a.gender === b.gender) {
            return (a.name || '').localeCompare(b.name || '')
          }
          return a.gender === 'male' ? -1 : 1
        })
        break
        
      default:
        // Open: Nur nach Name sortieren
        sortedPlayers.sort((a, b) => (a.name || '').localeCompare(b.name || ''))
    }
    
    return sortedPlayers
  }

  const sortedPlayers = getSortedPlayers()
  
  // Zähle Geschlechter für Mixed-Events
  const genderCount = {
    male: players.filter(p => p.gender === 'male').length,
    female: players.filter(p => p.gender === 'female').length,
    other: players.filter(p => !p.gender || (p.gender !== 'male' && p.gender !== 'female')).length
  }

  return (
    <div className="bg-gray-50 p-4 rounded-lg mb-6">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-lg font-semibold">
            Angemeldete Spieler ({players.length}/{maxPlayers})
          </h3>
          <p className="text-sm text-gray-600">{getGenderLabel()}</p>
          {genderMode === 'mixed' && teamFormat === 'double' && (
            <p className="text-xs text-gray-500 mt-1">
              {genderCount.male} Männer, {genderCount.female} Frauen
              {genderCount.other > 0 && `, ${genderCount.other} Divers`}
              {Math.abs(genderCount.male - genderCount.female) > 1 && (
                <span className="text-orange-600 ml-2">
                  ⚠️ Ungleiche Geschlechterverteilung
                </span>
              )}
            </p>
          )}
        </div>
        
        {/* NEU: Spieler-Datenbank Button */}
        {onOpenPlayerDatabase && (
          <button
            onClick={onOpenPlayerDatabase}
            className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 text-sm flex items-center gap-2"
          >
            <span>📚</span>
            <span>Aus Datenbank</span>
          </button>
        )}
      </div>

      {players.length < maxPlayers && (
        <div className="mb-4 p-3 bg-white rounded border border-gray-200">
          <div className="flex gap-2">
            <input
              type="text"
              value={newPlayerName}
              onChange={(e) => setNewPlayerName(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleAddPlayer()
                }
              }}
              placeholder="Spielername eingeben und Enter drücken"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
            <button
              onClick={handleAddPlayer}
              disabled={!newPlayerName.trim() || players.length >= maxPlayers}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400"
            >
              Hinzufügen
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Nach dem Namen werden Sie nach dem Skill-Level für {getSportLabel(sport)} gefragt
          </p>
        </div>
      )}

      {/* Skill Level Dialog - NUR für die Event-Sportart */}
      {showSkillDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">
              Spieler-Details für {newPlayerName}
            </h3>
            
            {/* Geschlecht Auswahl */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">
                Geschlecht:
              </label>
              <select
                value={playerGender}
                onChange={(e) => setPlayerGender(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="male">👨 Männlich</option>
                <option value="female">👩 Weiblich</option>
                <option value="other">⚧ Divers</option>
              </select>
              {/* Warnung bei Geschlechts-Mismatch */}
              {genderMode === 'men' && playerGender === 'female' && (
                <p className="text-xs text-purple-600 mt-1">
                  Hinweis: Dies ist ein Männer-Event (Frauen als Ausnahme erlaubt)
                </p>
              )}
              {genderMode === 'women' && playerGender === 'male' && (
                <p className="text-xs text-purple-600 mt-1">
                  Hinweis: Dies ist ein Frauen-Event (Männer als Ausnahme erlaubt)
                </p>
              )}
            </div>

            {/* Skill Level */}
<div>
  <label className="block text-sm font-medium mb-1">
    {getSportLabel(sport)} Level:
  </label>
  {sport === 'padel' ? (
    <select
      value={playerSkillLevel}
      onChange={(e) => setPlayerSkillLevel(e.target.value)}
      className="w-full px-3 py-2 border border-gray-300 rounded-md"
    >
      <option value="C">C / C+ (1.0-3.0) - Anfänger</option>
      <option value="B-">B- (3.0-3.5) - Fortgeschrittener Anfänger</option>
      <option value="B">B (3.5-4.0) - Unteres Mittelstufe</option>
      <option value="B+">B+ (4.0-4.5) - Gutes Mittelstufe</option>
      <option value="A-">A- (4.5-5.0) - Oberes Mittelstufe</option>
      <option value="A">A / A+ (5.0-6.0) - Fortgeschritten/Profi</option>
    </select>
  ) : (
    <select
      value={playerSkillLevel}
      onChange={(e) => setPlayerSkillLevel(parseFloat(e.target.value))}
      className="w-full px-3 py-2 border border-gray-300 rounded-md"
    >
      <option value="1.5">1.0-2.0 - Anfänger</option>
      <option value="2.5">2.5 - Fortgeschrittener Anfänger</option>
      <option value="3.0">3.0 - Einsteiger mit Spielpraxis</option>
      <option value="3.5">3.5 - Mittleres Niveau</option>
      <option value="4.0">4.0 - Gutes Clubniveau</option>
      <option value="4.5">4.5 - Erfahren</option>
      <option value="5.0">5.0 - Semiprofessionell</option>
      <option value="5.5">5.5-6.0+ - Profi</option>
    </select>
  )}
</div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={confirmAddPlayer}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                Spieler hinzufügen
              </button>
              <button
                onClick={() => {
                  setShowSkillDialog(false)
                  setPlayerSkillLevel(sport === 'padel' ? 'B' : 3.0)
                  setPlayerGender('male')
                }}
                className="flex-1 px-4 py-2 bg-gray-300 rounded-md hover:bg-gray-400"
              >
                Abbrechen
              </button>
            </div>
          </div>
        </div>
      )}

      {players.length >= maxPlayers && (
        <p className="text-sm text-red-600 mb-4">
          Maximale Spieleranzahl erreicht!
        </p>
      )}

      {/* Spielerliste nach Geschlechts-Modus */}
      {genderMode === 'mixed' && sortedPlayers.length > 0 ? (
        <div className="space-y-4">
          {/* Männer Sektion */}
          {genderCount.male > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Männer ({genderCount.male})</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {sortedPlayers.filter(p => p.gender === 'male').map((player) => (
                  <PlayerCard
                    key={player.id}
                    player={player}
                    event={event}
                    onRemove={handleRemovePlayer}
                    statusColor={getPlayerStatusColor(player)}
                    icon={getGenderIcon(player.gender)}
                    getSportLabel={getSportLabel}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Frauen Sektion */}
          {genderCount.female > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Frauen ({genderCount.female})</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {sortedPlayers.filter(p => p.gender === 'female').map((player) => (
                  <PlayerCard
                    key={player.id}
                    player={player}
                    event={event}
                    onRemove={handleRemovePlayer}
                    statusColor={getPlayerStatusColor(player)}
                    icon={getGenderIcon(player.gender)}
                    getSportLabel={getSportLabel}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Diverse Sektion */}
          {genderCount.other > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Divers ({genderCount.other})</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {sortedPlayers.filter(p => !p.gender || (p.gender !== 'male' && p.gender !== 'female')).map((player) => (
                  <PlayerCard
                    key={player.id}
                    player={player}
                    event={event}
                    onRemove={handleRemovePlayer}
                    statusColor={getPlayerStatusColor(player)}
                    icon={getGenderIcon(player.gender)}
                    getSportLabel={getSportLabel}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
          {sortedPlayers.map((player) => (
            <PlayerCard
              key={player.id}
              player={player}
              event={event}
              onRemove={handleRemovePlayer}
              statusColor={getPlayerStatusColor(player)}
              icon={getGenderIcon(player.gender)}
              getSportLabel={getSportLabel}
            />
          ))}
        </div>
      )}

      {players.length === 0 && (
        <p className="text-gray-500 text-center py-4">
          Noch keine Spieler angemeldet
        </p>
      )}

      {/* Warnung bei ungerader Spielerzahl */}
      {players.length % 2 !== 0 && teamFormat === 'double' && players.length > 0 && (
        <p className="text-sm text-orange-600 mt-4">
          ⚠️ Ungerade Spieleranzahl - Ein Spieler pausiert pro Runde
        </p>
      )}
    </div>
  )
}

// Separate PlayerCard Komponente
const PlayerCard = ({ player, event, onRemove, statusColor, icon, getSportLabel }) => {
  // Sichere Defaults für player
  const playerName = player?.name || 'Unbekannt'
  const playerSkill = player?.skillLevels?.[event?.sport || 'padel'] || 
                      player?.skillLevel || 
                      3

  return (
    <div className="bg-white p-3 rounded border border-gray-200">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <span className={`font-medium ${statusColor}`}>
            {playerName} {icon}
          </span>
          <div className="text-sm text-gray-600 mt-1">
            {getSportLabel(event?.sport || 'padel')}: Level {playerSkill}
          </div>
        </div>
        <button
          onClick={() => onRemove(player.id)}
          className="text-red-600 hover:text-red-700 ml-2 text-lg"
        >
          ✕
        </button>
      </div>
    </div>
  )
}