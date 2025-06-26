import { useState, useEffect } from 'react'

export const PlayerManagement = ({ event, onUpdateEvent, onOpenPlayerDatabase }) => {
  const [newPlayerName, setNewPlayerName] = useState('')
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

  // Setze das richtige Default-Geschlecht basierend auf genderMode
  useEffect(() => {
    if (genderMode === 'women') {
      setPlayerGender('female')
    } else if (genderMode === 'men') {
      setPlayerGender('male')
    }
  }, [genderMode])

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
    setPlayerGender(genderMode === 'women' ? 'female' : 'male') // Reset basierend auf genderMode
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

  return (
    <div className="bg-white p-4 rounded-lg mb-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Spieler verwalten</h3>
        <span className="text-sm text-gray-600">
          {players.length} / {maxPlayers} Spieler
        </span>
      </div>

      {/* Spieler hinzufügen */}
      <div className="mb-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={newPlayerName}
            onChange={(e) => setNewPlayerName(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && newPlayerName.trim() && players.length < maxPlayers) {
                handleAddPlayer()
              }
            }}
            placeholder="Spielername eingeben..."
            className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={players.length >= maxPlayers}
          />
          <button
            onClick={handleAddPlayer}
            disabled={!newPlayerName.trim() || players.length >= maxPlayers}
            className={`px-4 py-2 rounded-lg ${
              !newPlayerName.trim() || players.length >= maxPlayers
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            + Hinzufügen
          </button>
          <button
  onClick={onOpenPlayerDatabase}
  disabled={players.length >= maxPlayers}
  className={`px-4 py-2 rounded-lg ${
    players.length >= maxPlayers
      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
      : 'bg-green-600 text-white hover:bg-green-700'
  }`}
>
  📚 Aus Datenbank
</button>
        </div>
      </div>

      {/* Skill Level Dialog */}
      {showSkillDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h4 className="text-lg font-semibold mb-4">
              Details für {newPlayerName}
            </h4>
            
            {/* Geschlecht - Angepasst an genderMode */}
            <div className="mb-4">
              <label className="block mb-2 font-medium">Geschlecht</label>
              <select
                value={playerGender}
                onChange={(e) => setPlayerGender(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
              >
                {/* Zeige nur erlaubte Optionen basierend auf genderMode */}
                {(genderMode === 'open' || genderMode === 'men') && (
                  <option value="male">Männlich</option>
                )}
                {(genderMode === 'open' || genderMode === 'women') && (
                  <option value="female">Weiblich</option>
                )}
              </select>
              {/* Warnung wenn nicht passend */}
              {genderMode === 'men' && playerGender === 'female' && (
                <p className="text-xs text-orange-600 mt-1">
                  Hinweis: Dies ist ein Männer-Event
                </p>
              )}
              {genderMode === 'women' && playerGender === 'male' && (
                <p className="text-xs text-orange-600 mt-1">
                  Hinweis: Dies ist ein Frauen-Event
                </p>
              )}
            </div>

            {/* Skill Level */}
            <div className="mb-4">
              <label className="block mb-2 font-medium">
                {getSportLabel(sport)} Skill Level
              </label>
              {sport === 'padel' ? (
                <select
                  value={playerSkillLevel}
                  onChange={(e) => setPlayerSkillLevel(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
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
                  value={playerSkillLevel}
                  onChange={(e) => setPlayerSkillLevel(parseFloat(e.target.value))}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="1">1.0 - Anfänger</option>
                  <option value="2">2.0 - Fortgeschritten</option>
                  <option value="3">3.0 - Gut</option>
                  <option value="4">4.0 - Sehr gut</option>
                  <option value="5">5.0 - Experte</option>
                </select>
              )}
            </div>

            <div className="flex gap-2">
              <button
                onClick={confirmAddPlayer}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Spieler hinzufügen
              </button>
              <button
                onClick={() => {
                  setShowSkillDialog(false)
                  setPlayerGender(genderMode === 'women' ? 'female' : 'male')
                }}
                className="flex-1 px-4 py-2 bg-gray-300 rounded-lg hover:bg-gray-400"
              >
                Abbrechen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Spielerliste */}
      <div className="space-y-2">
        {players.length === 0 ? (
          <p className="text-gray-500 text-center py-4">
            Noch keine Spieler hinzugefügt
          </p>
        ) : (
          players.map((player) => {
            // Hole das richtige Skill Level für die aktuelle Sportart
            let displaySkillLevel = player.skillLevel // Fallback
            
            if (player.skillLevels) {
              if (sport === 'padel' && player.skillLevels.padel) {
                displaySkillLevel = player.skillLevels.padel
              } else if (sport === 'pickleball' && player.skillLevels.pickleball) {
                displaySkillLevel = player.skillLevels.pickleball
              } else if (sport === 'spinxball' && player.skillLevels.spinxball) {
                displaySkillLevel = player.skillLevels.spinxball
              }
            }

            return (
              <div
                key={player.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div>
                  <span className="font-medium">{player.name}</span>
                  <span className="ml-2 text-sm text-gray-600">
                    {player.gender === 'female' ? '♀️' : '♂️'}
                  </span>
                  <span className="ml-2 text-sm text-gray-600">
                    Level: {displaySkillLevel}
                  </span>
                </div>
                <button
                  onClick={() => handleRemovePlayer(player.id)}
                  className="text-red-500 hover:text-red-700"
                >
                  ✕
                </button>
              </div>
            )
          })
        )}
      </div>

      {/* Info wenn Event voll */}
      {players.length >= maxPlayers && (
        <p className="mt-4 text-sm text-orange-600 text-center">
          Das Event ist voll. Entfernen Sie Spieler, um neue hinzuzufügen.
        </p>
      )}

      {/* Info zu Geschlechts-Modus */}
      {genderMode !== 'open' && (
        <p className="mt-4 text-xs text-gray-600 text-center">
          {genderMode === 'men' ? '👨 Nur Männer können teilnehmen' : '👩 Nur Frauen können teilnehmen'}
        </p>
      )}
    </div>
  )
}