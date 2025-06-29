import React, { useState, useEffect } from 'react'
import playerService from '../services/playerService'
import excelExportService from '../services/excelExportService'
// import './PlayerDatabase.css'  <- auskommentiert

const PlayerDatabase = ({ onClose, onSelectPlayer }) => {
  const [players, setPlayers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingPlayer, setEditingPlayer] = useState(null)
  const [newPlayer, setNewPlayer] = useState({
    name: '',
    email: '',
    phone: '',
    skill_level: 3,
    sports: { padel: true, pickleball: false, spinxball: false },
    notes: ''
  })

  useEffect(() => {
    loadPlayers()
  }, [])

  const loadPlayers = async () => {
    setLoading(true)
    const data = await playerService.getPlayers()
    setPlayers(data)
    setLoading(false)
  }

  const handleSavePlayer = async () => {
    try {
      if (editingPlayer) {
        await playerService.updatePlayer(editingPlayer.id, newPlayer)
      } else {
        await playerService.createPlayer(newPlayer)
      }
      setShowAddForm(false)
      setEditingPlayer(null)
      setNewPlayer({
        name: '',
        email: '',
        phone: '',
        skill_level: 3,
        sports: { padel: true, pickleball: false, spinxball: false },
        notes: ''
      })
      loadPlayers()
    } catch (error) {
      alert('Fehler beim Speichern: ' + error.message)
    }
  }

  const handleDeletePlayer = async (playerId) => {
    if (window.confirm('Spieler wirklich lÃ¶schen?')) {
      try {
        await playerService.deletePlayer(playerId)
        loadPlayers()
      } catch (error) {
        alert('Fehler beim LÃ¶schen: ' + error.message)
      }
    }
  }

  const handleExportPlayers = () => {
    excelExportService.exportPlayersList(players, 'spieler_datenbank.xlsx')
  }

  const handleImportPlayers = async (event) => {
    const file = event.target.files[0]
    if (!file) return

    try {
      const importedPlayers = await excelExportService.importPlayersFromExcel(file)
      
      if (importedPlayers.length === 0) {
        alert('Keine Spieler in der Datei gefunden!')
        return
      }

      const result = await playerService.importPlayers(importedPlayers)
      alert(`${result.length} Spieler erfolgreich importiert!`)
      loadPlayers()
    } catch (error) {
      alert('Fehler beim Import: ' + error.message)
      // removed console.error
    }
    
    // Reset file input
    event.target.value = ''
  }

  const handleEditPlayer = (player) => {
    setEditingPlayer(player)
    setNewPlayer({
      name: player.name,
      email: player.email || '',
      phone: player.phone || '',
      skill_level: player.skill_level,
      sports: player.sports || { padel: true, pickleball: false, spinxball: false },
      notes: player.notes || ''
    })
    setShowAddForm(true)
  }

  const filteredPlayers = players.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="player-database-modal">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Spieler-Datenbank</h2>
          <button onClick={onClose} className="close-btn">Ã—</button>
        </div>

        <div className="player-controls">
          <input
            type="text"
            placeholder="Spieler suchen..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <button 
            onClick={() => setShowAddForm(true)}
            className="btn btn-primary"
          >
            + Neuer Spieler
          </button>
          <button
            onClick={handleExportPlayers}
            className="btn btn-secondary"
            disabled={players.length === 0}
          >
            ðŸ“Š Export Excel
          </button>
          <label className="btn btn-secondary cursor-pointer">
            ðŸ“¥ Import Excel
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleImportPlayers}
              className="hidden"
            />
          </label>
        </div>

        {showAddForm && (
          <div className="add-player-form">
            <h3>{editingPlayer ? 'Spieler bearbeiten' : 'Neuer Spieler'}</h3>
            <div className="form-grid">
              <div>
                <label>Name *</label>
                <input
                  type="text"
                  value={newPlayer.name}
                  onChange={(e) => setNewPlayer({...newPlayer, name: e.target.value})}
                  placeholder="Spielername"
                />
              </div>
              <div>
                <label>E-Mail</label>
                <input
                  type="email"
                  value={newPlayer.email}
                  onChange={(e) => setNewPlayer({...newPlayer, email: e.target.value})}
                  placeholder="email@beispiel.de"
                />
              </div>
              <div>
                <label>Telefon</label>
                <input
                  type="tel"
                  value={newPlayer.phone}
                  onChange={(e) => setNewPlayer({...newPlayer, phone: e.target.value})}
                  placeholder="+49 123 456789"
                />
              </div>
              <div>
                <label>Skill Level</label>
                <select
                  value={newPlayer.skill_level}
                  onChange={(e) => setNewPlayer({...newPlayer, skill_level: parseInt(e.target.value)})}
                >
                  <option value="1">1 - AnfÃ¤nger</option>
                  <option value="2">2 - Fortgeschritten</option>
                  <option value="3">3 - Gut</option>
                  <option value="4">4 - Sehr gut</option>
                  <option value="5">5 - Experte</option>
                </select>
              </div>
              <div className="sports-checkboxes">
                <label>Sportarten:</label>
                <div>
                  <label>
                    <input
                      type="checkbox"
                      checked={newPlayer.sports.padel}
                      onChange={(e) => setNewPlayer({
                        ...newPlayer, 
                        sports: {...newPlayer.sports, padel: e.target.checked}
                      })}
                    />
                    Padel
                  </label>
                  <label>
                    <input
                      type="checkbox"
                      checked={newPlayer.sports.pickleball}
                      onChange={(e) => setNewPlayer({
                        ...newPlayer, 
                        sports: {...newPlayer.sports, pickleball: e.target.checked}
                      })}
                    />
                    Pickleball
                  </label>
                  <label>
                    <input
                      type="checkbox"
                      checked={newPlayer.sports.spinxball}
                      onChange={(e) => setNewPlayer({
                        ...newPlayer, 
                        sports: {...newPlayer.sports, spinxball: e.target.checked}
                      })}
                    />
                    SpinXball
                  </label>
                </div>
              </div>
              <div className="full-width">
                <label>Notizen</label>
                <textarea
                  value={newPlayer.notes}
                  onChange={(e) => setNewPlayer({...newPlayer, notes: e.target.value})}
                  placeholder="ZusÃ¤tzliche Informationen..."
                  rows="3"
                />
              </div>
            </div>
            <div className="form-actions">
              <button onClick={() => {
                setShowAddForm(false)
                setEditingPlayer(null)
              }} className="btn btn-secondary">
                Abbrechen
              </button>
              <button 
                onClick={handleSavePlayer}
                className="btn btn-primary"
                disabled={!newPlayer.name.trim()}
              >
                {editingPlayer ? 'Aktualisieren' : 'Speichern'}
              </button>
            </div>
          </div>
        )}

        <div className="players-list">
          {loading ? (
            <div className="loading">Lade Spieler...</div>
          ) : filteredPlayers.length === 0 ? (
            <div className="no-players">
              {searchTerm ? 'Keine Spieler gefunden' : 'Noch keine Spieler in der Datenbank'}
            </div>
          ) : (
            <table className="players-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Skill</th>
                  <th>Sportarten</th>
                  <th>Kontakt</th>
                  <th>Aktionen</th>
                </tr>
              </thead>
              <tbody>
                {filteredPlayers.map(player => (
                  <tr key={player.id}>
                    <td>{player.name}</td>
                    <td>{player.skill_level}</td>
                    <td>
                      {Object.entries(player.sports || {})
                        .filter(([_, active]) => active)
                        .map(([sport]) => sport.charAt(0).toUpperCase() + sport.slice(1))
                        .join(', ')}
                    </td>
                    <td>
                      {player.email && <div className="contact-info">ðŸ“§ {player.email}</div>}
                      {player.phone && <div className="contact-info">ðŸ“± {player.phone}</div>}
                    </td>
                    <td>
                      {onSelectPlayer && (
                        <button 
                          onClick={() => onSelectPlayer(player)}
                          className="btn btn-sm btn-primary"
                        >
                          AuswÃ¤hlen
                        </button>
                      )}
                      <button 
                        onClick={() => handleEditPlayer(player)}
                        className="btn btn-sm btn-secondary"
                      >
                        âœï¸
                      </button>
                      <button 
                        onClick={() => handleDeletePlayer(player.id)}
                        className="btn btn-sm btn-danger"
                      >
                        ðŸ—‘ï¸
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}

export default PlayerDatabase
