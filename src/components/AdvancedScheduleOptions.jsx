import { useState } from 'react'

export function AdvancedScheduleOptions({ 
  players, 
  courts,
  onOptionsChange,
  initialOptions = {}
}) {
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [options, setOptions] = useState({
    maxRepetitions: initialOptions.maxRepetitions || 3,
    preferredPairings: initialOptions.preferredPairings || [],
    avoidedPairings: initialOptions.avoidedPairings || [],
    courtPreferences: initialOptions.courtPreferences || {},
    balanceSkillLevels: initialOptions.balanceSkillLevels || false,
    prioritizeFairness: initialOptions.prioritizeFairness || true,
    ...initialOptions
  })
  
  const [newPreferredPair, setNewPreferredPair] = useState({ player1: '', player2: '' })
  const [newAvoidedPair, setNewAvoidedPair] = useState({ player1: '', player2: '' })
  
  const updateOption = (key, value) => {
    const newOptions = { ...options, [key]: value }
    setOptions(newOptions)
    onOptionsChange(newOptions)
  }
  
  const addPreferredPairing = () => {
    if (newPreferredPair.player1 && newPreferredPair.player2 && 
        newPreferredPair.player1 !== newPreferredPair.player2) {
      const pairing = {
        id: Date.now(),
        players: [newPreferredPair.player1, newPreferredPair.player2]
      }
      updateOption('preferredPairings', [...options.preferredPairings, pairing])
      setNewPreferredPair({ player1: '', player2: '' })
    }
  }
  
  const removePreferredPairing = (id) => {
    updateOption('preferredPairings', options.preferredPairings.filter(p => p.id !== id))
  }
  
  const addAvoidedPairing = () => {
    if (newAvoidedPair.player1 && newAvoidedPair.player2 && 
        newAvoidedPair.player1 !== newAvoidedPair.player2) {
      const pairing = {
        id: Date.now(),
        players: [newAvoidedPair.player1, newAvoidedPair.player2]
      }
      updateOption('avoidedPairings', [...options.avoidedPairings, pairing])
      setNewAvoidedPair({ player1: '', player2: '' })
    }
  }
  
  const removeAvoidedPairing = (id) => {
    updateOption('avoidedPairings', options.avoidedPairings.filter(p => p.id !== id))
  }
  
  const updateCourtPreference = (playerId, courtNumber) => {
    const newPrefs = { ...options.courtPreferences }
    if (courtNumber === '') {
      delete newPrefs[playerId]
    } else {
      newPrefs[playerId] = parseInt(courtNumber)
    }
    updateOption('courtPreferences', newPrefs)
  }
  
  return (
    <div className="bg-blue-50 p-4 rounded-lg mb-4">
      <div className="flex justify-between items-center mb-4">
        <h4 className="font-semibold">Erweiterte Optionen</h4>
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-sm text-blue-600 hover:text-blue-700"
        >
          {showAdvanced ? 'Ausblenden' : 'Anzeigen'}
        </button>
      </div>
      
      {showAdvanced && (
        <div className="space-y-4">
          {/* Maximale Wiederholungen */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Maximale Wiederholungen pro Paarung
            </label>
            <input
              type="number"
              value={options.maxRepetitions}
              onChange={(e) => updateOption('maxRepetitions', parseInt(e.target.value) || 3)}
              min="1"
              max="10"
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
            <p className="text-xs text-gray-600 mt-1">
              Wie oft dieselben Spieler maximal zusammen/gegeneinander spielen sollten
            </p>
          </div>
          
          {/* Bevorzugte Paarungen */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Bevorzugte Paarungen (spielen öfter zusammen)
            </label>
            <div className="flex gap-2 mb-2">
              <select
                value={newPreferredPair.player1}
                onChange={(e) => setNewPreferredPair({ ...newPreferredPair, player1: e.target.value })}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">Spieler 1...</option>
                {players.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
              <select
                value={newPreferredPair.player2}
                onChange={(e) => setNewPreferredPair({ ...newPreferredPair, player2: e.target.value })}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">Spieler 2...</option>
                {players.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
              <button
                onClick={addPreferredPairing}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                +
              </button>
            </div>
            {options.preferredPairings.map(pairing => {
              const p1 = players.find(p => p.id === pairing.players[0])
              const p2 = players.find(p => p.id === pairing.players[1])
              return (
                <div key={pairing.id} className="flex justify-between items-center bg-green-100 p-2 rounded">
                  <span className="text-sm">{p1?.name} & {p2?.name}</span>
                  <button
                    onClick={() => removePreferredPairing(pairing.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    ✕
                  </button>
                </div>
              )
            })}
          </div>
          
          {/* Vermiedene Paarungen */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Vermiedene Paarungen (spielen seltener zusammen)
            </label>
            <div className="flex gap-2 mb-2">
              <select
                value={newAvoidedPair.player1}
                onChange={(e) => setNewAvoidedPair({ ...newAvoidedPair, player1: e.target.value })}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">Spieler 1...</option>
                {players.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
              <select
                value={newAvoidedPair.player2}
                onChange={(e) => setNewAvoidedPair({ ...newAvoidedPair, player2: e.target.value })}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">Spieler 2...</option>
                {players.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
              <button
                onClick={addAvoidedPairing}
                className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700"
              >
                +
              </button>
            </div>
            {options.avoidedPairings.map(pairing => {
              const p1 = players.find(p => p.id === pairing.players[0])
              const p2 = players.find(p => p.id === pairing.players[1])
              return (
                <div key={pairing.id} className="flex justify-between items-center bg-orange-100 p-2 rounded">
                  <span className="text-sm">{p1?.name} ↔ {p2?.name}</span>
                  <button
                    onClick={() => removeAvoidedPairing(pairing.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    ✕
                  </button>
                </div>
              )
            })}
          </div>
          
          {/* Court-Präferenzen */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Court-Präferenzen
            </label>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {players.map(player => (
                <div key={player.id} className="flex items-center gap-2">
                  <span className="text-sm w-32">{player.name}</span>
                  <select
                    value={options.courtPreferences[player.id] || ''}
                    onChange={(e) => updateCourtPreference(player.id, e.target.value)}
                    className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                  >
                    <option value="">Keine Präferenz</option>
                    {Array.from({ length: courts }, (_, i) => (
                      <option key={i + 1} value={i + 1}>Court {i + 1}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>
          
          {/* Weitere Optionen */}
          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={options.balanceSkillLevels}
                onChange={(e) => updateOption('balanceSkillLevels', e.target.checked)}
                className="mr-2"
              />
              <span className="text-sm">Teams nach Spielstärke ausbalancieren</span>
            </label>
            
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={options.prioritizeFairness}
                onChange={(e) => updateOption('prioritizeFairness', e.target.checked)}
                className="mr-2"
              />
              <span className="text-sm">Fairness priorisieren (gleichmäßige Verteilung)</span>
            </label>
          </div>
        </div>
      )}
    </div>
  )
}