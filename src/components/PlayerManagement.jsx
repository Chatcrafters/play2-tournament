import { useState, useEffect } from 'react'
import { useTranslation } from '../components/LanguageSelector'

export const PlayerManagement = ({ event, onUpdateEvent, onOpenPlayerDatabase }) => {
  const { t } = useTranslation()
  const [newPlayerName, setNewPlayerName] = useState('')
  const [playerSkillLevel, setPlayerSkillLevel] = useState('B') // Für Padel default
  const [playerGender, setPlayerGender] = useState('male')
  const [showSkillDialog, setShowSkillDialog] = useState(false)

  // Sicherheitschecks
  if (!event) {
    return (
      <div className="bg-gray-50 p-4 rounded-lg mb-6">
        <p className="text-gray-500 text-center">{t('event.noEventsSelected')}</p>
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
      1: t('playerManagement.beginner'),
      2: t('playerManagement.advanced'),
      3: t('playerManagement.good'),
      4: t('playerManagement.veryGood'),
      5: t('playerManagement.expert')
    }
    return labels[level] || t('playerManagement.good')
  }

  const getSportLabel = (sport) => {
    return t(`sports.${sport}`)
  }

  return (
    <div className="bg-white p-4 rounded-lg mb-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">{t('player.managePlayer')}</h3>
        <span className="text-sm text-gray-600">
          {players.length} / {maxPlayers} {t('player.players')}
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
            placeholder={t('player.enterName')}
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
            + {t('buttons.add')}
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
            📚 {t('player.fromDatabase')}
          </button>
        </div>
      </div>

      {/* Skill Level Dialog */}
      {showSkillDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h4 className="text-lg font-semibold mb-4">
              {t('player.details')} {newPlayerName}
            </h4>
            
            {/* Geschlecht - Angepasst an genderMode */}
            <div className="mb-4">
              <label className="block mb-2 font-medium">{t('player.gender')}</label>
              <select
                value={playerGender}
                onChange={(e) => setPlayerGender(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
              >
                {/* Zeige nur erlaubte Optionen basierend auf genderMode */}
                {(genderMode === 'open' || genderMode === 'men') && (
                  <option value="male">{t('player.male')}</option>
                )}
                {(genderMode === 'open' || genderMode === 'women') && (
                  <option value="female">{t('player.female')}</option>
                )}
              </select>
              {/* Warnung wenn nicht passend */}
              {genderMode === 'men' && playerGender === 'female' && (
                <p className="text-xs text-orange-600 mt-1">
                  {t('playerManagement.menEventNote')}
                </p>
              )}
              {genderMode === 'women' && playerGender === 'male' && (
                <p className="text-xs text-orange-600 mt-1">
                  {t('playerManagement.womenEventNote')}
                </p>
              )}
            </div>

            {/* Skill Level */}
            <div className="mb-4">
              <label className="block mb-2 font-medium">
                {getSportLabel(sport)} {t('player.skillLevel')}
              </label>
              {sport === 'padel' ? (
                <select
                  value={playerSkillLevel}
                  onChange={(e) => setPlayerSkillLevel(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="C">C ({t('playerManagement.beginner')})</option>
                  <option value="B-">B- ({t('playerManagement.advancedBeginner')})</option>
                  <option value="B">B ({t('playerManagement.lowerIntermediate')})</option>
                  <option value="B+">B+ ({t('playerManagement.goodIntermediate')})</option>
                  <option value="A-">A- ({t('playerManagement.upperIntermediate')})</option>
                  <option value="A">A ({t('playerManagement.advancedPro')})</option>
                </select>
              ) : (
                <select
                  value={playerSkillLevel}
                  onChange={(e) => setPlayerSkillLevel(parseFloat(e.target.value))}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="1">1.0 - {t('playerManagement.beginner')}</option>
                  <option value="2">2.0 - {t('playerManagement.advanced')}</option>
                  <option value="3">3.0 - {t('playerManagement.good')}</option>
                  <option value="4">4.0 - {t('playerManagement.veryGood')}</option>
                  <option value="5">5.0 - {t('playerManagement.expert')}</option>
                </select>
              )}
            </div>

            <div className="flex gap-2">
              <button
                onClick={confirmAddPlayer}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                {t('player.addPlayer')}
              </button>
              <button
                onClick={() => {
                  setShowSkillDialog(false)
                  setPlayerGender(genderMode === 'women' ? 'female' : 'male')
                }}
                className="flex-1 px-4 py-2 bg-gray-300 rounded-lg hover:bg-gray-400"
              >
                {t('navigation.cancel')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Spielerliste */}
      <div className="space-y-2">
        {players.length === 0 ? (
          <p className="text-gray-500 text-center py-4">
            {t('player.noPlayers')}
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
                    {t('player.level')}: {displaySkillLevel}
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
          {t('messages.eventFull')}
        </p>
      )}

      {/* Info zu Geschlechts-Modus */}
      {genderMode !== 'open' && (
        <p className="mt-4 text-xs text-gray-600 text-center">
          {genderMode === 'men' ? `👨 ${t('playerManagement.menOnly')}` : `👩 ${t('playerManagement.womenOnly')}`}
        </p>
      )}
    </div>
  )
}