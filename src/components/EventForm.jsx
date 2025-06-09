import { useState, useEffect } from 'react'

export const EventForm = ({ 
  editingEvent, 
  onSubmit, 
  onCancel,
  initialData,
  calculateTotalMinutes,
  calculateMaxPlayers
}) => {
  // Sichere Standardwerte für alle Felder
  const getDefaultFormData = () => ({
    name: '',
    sport: 'padel',
    eventType: 'americano',
    genderMode: 'open',
    format: 'doubles',
    date: new Date().toISOString().split('T')[0],
    endDate: '',
    startTime: '09:00',
    endTime: '13:00',
    courts: 2,
    maxPlayers: 16,
    roundDuration: 15,
    location: '',
    phone: '',
    isPublic: false,
    registrationOpen: false,
    registrationDeadline: '',
    entryFee: 0,
    showAdvancedOptions: false,
    flexibleTimes: false,
    dailySchedule: [],
    spielmodus: 'durchgehend',
    garantieSpiele: false,
    mindestSpiele: 3,
    garantieMinuten: false,
    mindestMinuten: 45,
    breaks: [],
    eventInfo: '',
    players: [],
    results: {},
    schedule: null
  })

  // Merge initialData mit Defaults um null-Werte zu vermeiden
  const mergeWithDefaults = (data) => {
    const defaults = getDefaultFormData()
    if (!data) return defaults
    
    return {
      ...defaults,
      ...data,
      // Spezielle Behandlung für Arrays
      breaks: data.breaks || [],
      players: data.players || [],
      dailySchedule: data.dailySchedule || [],
      results: data.results || {},
      // Sicherstellen dass Zahlen wirklich Zahlen sind
      courts: parseInt(data.courts) || 2,
      maxPlayers: parseInt(data.maxPlayers) || 16,
      roundDuration: parseInt(data.roundDuration) || 15,
      entryFee: parseFloat(data.entryFee) || 0,
      mindestSpiele: parseInt(data.mindestSpiele) || 3,
      mindestMinuten: parseInt(data.mindestMinuten) || 45
    }
  }

  const [formData, setFormData] = useState(mergeWithDefaults(initialData))

  useEffect(() => {
    setFormData(mergeWithDefaults(initialData))
  }, [initialData])

  // Automatisch flexible Zeiten aktivieren bei mehrtägigen Events
  useEffect(() => {
    if (formData.date && formData.endDate && formData.date !== formData.endDate) {
      updateFormData({ flexibleTimes: true })
    }
  }, [formData.date, formData.endDate])

  // Automatisch Format auf Doppel setzen bei Americano
  useEffect(() => {
    if (formData.eventType === 'americano') {
      updateFormData({ format: 'doubles' })
    }
  }, [formData.eventType])

  const handleSubmit = (e) => {
  e.preventDefault()
  
  // Validierung
  if (!formData.name.trim()) {
    alert('Bitte geben Sie einen Event-Namen ein')
    return
  }
  
  // Sicherstellen dass Arrays existieren
  const submitData = {
    ...formData,
    // Bereinige Zeitfelder von Sekunden
    startTime: formData.startTime ? formData.startTime.split(':').slice(0, 2).join(':') : '09:00',
    endTime: formData.endTime ? formData.endTime.split(':').slice(0, 2).join(':') : '13:00',
    players: formData.players || [],
    breaks: formData.breaks || [],
    results: formData.results || {},
    // Zahlen sicherstellen
    courts: parseInt(formData.courts) || 2,
    maxPlayers: parseInt(formData.maxPlayers) || 16,
    roundDuration: parseInt(formData.roundDuration) || 15,
    entryFee: parseFloat(formData.entryFee) || 0
  }
  
  onSubmit(submitData)
}

  // Hilfsfunktion für sichere Updates
  const updateFormData = (updates) => {
    setFormData(prev => ({
      ...prev,
      ...updates
    }))
  }

  // Berechne Gesamtspielzeit pro Tag
  const calculateDailyPlayTime = (dayIndex) => {
    const schedule = formData.dailySchedule?.[dayIndex]
    if (!schedule?.start || !schedule?.end) return 0
    
    const start = new Date(`2024-01-01 ${schedule.start}`)
    const end = new Date(`2024-01-01 ${schedule.end}`)
    return Math.max(0, (end - start) / 60000) // in Minuten
  }

  // Berechne maximale Spieler pro Tag
  const calculateMaxPlayersPerDay = (dayIndex) => {
    const schedule = formData.dailySchedule?.[dayIndex]
    if (!schedule) return 0
    
    const playTime = calculateDailyPlayTime(dayIndex)
    const courts = schedule.courts || 1
    const rounds = Math.floor(playTime / (formData.roundDuration || 15))
    
    // Formel: Bei genug Runden können alle Spieler rotieren
    // Optimal: Courts * 4 + einige Pausierte
    if (rounds >= 3) {
      return courts * 4 + Math.min(rounds - 2, courts * 2)
    }
    return courts * 4
  }

  // Check ob mehrtägig
  const isMultiDay = formData.date && formData.endDate && formData.date !== formData.endDate

  // Generiere Tage-Array
  const getDaysArray = () => {
    if (!isMultiDay) return []
    
    const days = []
    const startDate = new Date(formData.date)
    const endDate = new Date(formData.endDate)
    
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      days.push(new Date(d))
    }
    
    return days
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4">
          {editingEvent ? 'Event bearbeiten' : 'Neues Event erstellen'}
        </h2>
        
        <form onSubmit={handleSubmit}>
          {/* Basis-Informationen */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3 text-blue-600">Basis-Informationen</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block mb-1 font-semibold">Event Name</label>
                <input
                  type="text"
                  value={formData.name || ''}
                  onChange={(e) => updateFormData({ name: e.target.value })}
                  className="w-full px-3 py-2 border rounded"
                  required
                />
              </div>
              
              <div>
                <label className="block mb-1 font-semibold">Sportart</label>
                <select
                  value={formData.sport || 'padel'}
                  onChange={(e) => updateFormData({ sport: e.target.value })}
                  className="w-full px-3 py-2 border rounded"
                >
                  <option value="padel">Padel</option>
                  <option value="pickleball">Pickleball</option>
                  <option value="spinxball">SpinXball</option>
                </select>
              </div>
              
              <div>
                <label className="block mb-1 font-semibold">Event-Typ</label>
                <select
                  value={formData.eventType || 'americano'}
                  onChange={(e) => updateFormData({ eventType: e.target.value })}
                  className="w-full px-3 py-2 border rounded"
                >
                  <option value="americano">Americano</option>
                  <option value="roundrobin">Round Robin</option>
                  <option value="express">Express Turnier</option>
                  <option value="tournament">Turnier</option>
                  <option value="liga">Liga</option>
                </select>
              </div>
              
              {/* Format - Nur anzeigen wenn NICHT Americano */}
              {formData.eventType !== 'americano' ? (
                <div>
                  <label className="block mb-1 font-semibold">Format</label>
                  <select
                    value={formData.format || 'doubles'}
                    onChange={(e) => updateFormData({ format: e.target.value })}
                    className="w-full px-3 py-2 border rounded"
                  >
                    <option value="doubles">Doppel</option>
                    {formData.sport !== 'padel' && (
                      <option value="singles">Einzel</option>
                    )}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block mb-1 font-semibold">Americano-Typ</label>
                  <select
                    value={formData.genderMode || 'open'}
                    onChange={(e) => updateFormData({ genderMode: e.target.value })}
                    className="w-full px-3 py-2 border rounded"
                  >
                    <option value="open">Open - Alle Geschlechter</option>
                    <option value="men">Männer-Americano</option>
                    <option value="women">Frauen-Americano</option>
                    <option value="mixed">Mixed-Americano (1M + 1F pro Team)</option>
                  </select>
                </div>
              )}
            </div>

            {/* Americano Erklärung */}
            {formData.eventType === 'americano' && (
              <div className="mt-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-900 mb-2">ℹ️ Americano Format</h4>
                  <p className="text-sm text-gray-700">
                    Beim Americano spielt jeder Teilnehmer in wechselnden 2er-Teams. 
                    Der Algorithmus sorgt für maximale Durchmischung: 
                    Sie spielen mit möglichst vielen verschiedenen Partnern und gegen möglichst viele verschiedene Gegner.
                    Format ist immer Doppel (2 vs 2).
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Zeitraum & Ort */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3 text-blue-600">Zeitraum & Ort</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block mb-1 font-semibold">Startdatum</label>
                <input
                  type="date"
                  value={formData.date || ''}
                  onChange={(e) => updateFormData({ date: e.target.value })}
                  className="w-full px-3 py-2 border rounded"
                  required
                />
              </div>
              
              <div>
                <label className="block mb-1 font-semibold">Enddatum (für mehrtägige Events)</label>
                <input
                  type="date"
                  value={formData.endDate || ''}
                  onChange={(e) => updateFormData({ endDate: e.target.value })}
                  className="w-full px-3 py-2 border rounded"
                  min={formData.date}
                />
              </div>
              
              <div>
                <label className="block mb-1 font-semibold">Ort</label>
                <input
                  type="text"
                  value={formData.location || ''}
                  onChange={(e) => updateFormData({ location: e.target.value })}
                  className="w-full px-3 py-2 border rounded"
                  placeholder="z.B. Padel Club München"
                />
              </div>
              
              <div>
                <label className="block mb-1 font-semibold">Telefon</label>
                <input
                  type="tel"
                  value={formData.phone || ''}
                  onChange={(e) => updateFormData({ phone: e.target.value })}
                  className="w-full px-3 py-2 border rounded"
                  placeholder="z.B. +49 123 456789"
                />
              </div>
            </div>
          </div>

          {/* Spielzeit-Konfiguration */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3 text-blue-600">Spielzeit-Konfiguration</h3>
            
            {!isMultiDay ? (
              // Eintägiges Event
              <div className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block mb-1 font-semibold">Startzeit</label>
                    <input
                      type="time"
                      value={formData.startTime || '09:00'}
                      onChange={(e) => updateFormData({ startTime: e.target.value })}
                      className="w-full px-3 py-2 border rounded"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block mb-1 font-semibold">Endzeit</label>
                    <input
                      type="time"
                      value={formData.endTime || '13:00'}
                      onChange={(e) => updateFormData({ endTime: e.target.value })}
                      className="w-full px-3 py-2 border rounded"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block mb-1 font-semibold">Courts</label>
                    <input
                      type="number"
                      value={formData.courts || 2}
                      onChange={(e) => updateFormData({ courts: parseInt(e.target.value) || 1 })}
                      className="w-full px-3 py-2 border rounded"
                      min="1"
                      max="10"
                      required
                    />
                  </div>
                </div>
                
                {/* Live-Berechnung für eintägiges Event */}
                {formData.startTime && formData.endTime && formData.courts && (
                  <div className="mt-4 p-3 bg-blue-50 rounded">
                    <p className="text-sm text-blue-800">
                      <strong>Spielzeit:</strong> {calculateTotalMinutes ? calculateTotalMinutes(formData) : 0} Minuten<br/>
                      <strong>Empfohlene max. Spieler:</strong> {
                        formData.courts * 4 + (formData.courts >= 2 ? 2 : 0)
                      } Spieler
                    </p>
                  </div>
                )}
              </div>
            ) : (
              // Mehrtägiges Event
              <div className="space-y-3">
                <p className="text-sm text-gray-600 mb-2">
                  Konfigurieren Sie Zeiten und Courts für jeden Tag:
                </p>
                
                {getDaysArray().map((day, index) => (
                  <div key={index} className="bg-gray-50 p-4 rounded">
                    <h4 className="font-medium mb-3">
                      {day.toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                      <div>
                        <label className="block text-sm">Startzeit</label>
                        <input
                          type="time"
                          value={formData.dailySchedule?.[index]?.start || ''}
                          onChange={(e) => {
                            const newSchedule = [...(formData.dailySchedule || [])]
                            newSchedule[index] = { 
                              ...(newSchedule[index] || {}), 
                              start: e.target.value 
                            }
                            updateFormData({ dailySchedule: newSchedule })
                          }}
                          className="w-full px-2 py-1 border rounded"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm">Endzeit</label>
                        <input
                          type="time"
                          value={formData.dailySchedule?.[index]?.end || ''}
                          onChange={(e) => {
                            const newSchedule = [...(formData.dailySchedule || [])]
                            newSchedule[index] = { 
                              ...(newSchedule[index] || {}), 
                              end: e.target.value 
                            }
                            updateFormData({ dailySchedule: newSchedule })
                          }}
                          className="w-full px-2 py-1 border rounded"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm">Courts</label>
                        <input
                          type="number"
                          value={formData.dailySchedule?.[index]?.courts || 2}
                          onChange={(e) => {
                            const newSchedule = [...(formData.dailySchedule || [])]
                            newSchedule[index] = { 
                              ...(newSchedule[index] || {}), 
                              courts: parseInt(e.target.value) || 1
                            }
                            updateFormData({ dailySchedule: newSchedule })
                          }}
                          className="w-full px-2 py-1 border rounded"
                          min="1"
                          max="10"
                        />
                      </div>
                      
                      <div className="flex items-center">
                        <label className="flex items-center text-sm">
                          <input
                            type="checkbox"
                            checked={formData.dailySchedule?.[index]?.active !== false}
                            onChange={(e) => {
                              const newSchedule = [...(formData.dailySchedule || [])]
                              newSchedule[index] = { 
                                ...(newSchedule[index] || {}), 
                                active: e.target.checked
                              }
                              updateFormData({ dailySchedule: newSchedule })
                            }}
                            className="mr-2"
                          />
                          Spieltag
                        </label>
                      </div>
                    </div>
                    
                    {/* Live-Berechnung pro Tag */}
                    {formData.dailySchedule?.[index]?.start && 
                     formData.dailySchedule?.[index]?.end && 
                     formData.dailySchedule?.[index]?.active !== false && (
                      <div className="mt-2 p-2 bg-blue-50 rounded text-xs">
                        <strong>Spielzeit:</strong> {calculateDailyPlayTime(index)} Min • 
                        <strong> Max. Spieler:</strong> {calculateMaxPlayersPerDay(index)}
                      </div>
                    )}
                  </div>
                ))}
                
                {/* Gesamt-Übersicht */}
                <div className="mt-4 p-3 bg-blue-100 rounded">
                  <p className="text-sm font-semibold text-blue-900">
                    Gesamt-Kapazität über alle Tage: {
                      getDaysArray().reduce((sum, _, idx) => 
                        sum + (formData.dailySchedule?.[idx]?.active !== false ? calculateMaxPlayersPerDay(idx) : 0), 0
                      )
                    } verschiedene Spieler möglich
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Spiel-Einstellungen */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3 text-blue-600">Spiel-Einstellungen</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block mb-1 font-semibold">Rundenzeit (Minuten)</label>
                <input
                  type="number"
                  value={formData.roundDuration || 15}
                  onChange={(e) => updateFormData({ roundDuration: parseInt(e.target.value) || 15 })}
                  className="w-full px-3 py-2 border rounded"
                  min="5"
                  max="120"
                  required
                />
              </div>
              
              <div>
                <label className="block mb-1 font-semibold">Maximale Spieleranzahl</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={formData.maxPlayers || 16}
                    onChange={(e) => updateFormData({ maxPlayers: parseInt(e.target.value) || 16 })}
                    className="flex-1 px-3 py-2 border rounded"
                    min="4"
                    max="100"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (!isMultiDay) {
                        const courts = formData.courts || 1
                        const optimalPlayers = courts * 4 + (courts >= 2 ? 2 : 0)
                        updateFormData({ maxPlayers: optimalPlayers })
                      } else {
                        // Bei mehrtägigen Events: Summe der optimalen Spieler pro Tag
                        const total = getDaysArray().reduce((sum, _, idx) => 
                          sum + (formData.dailySchedule?.[idx]?.active !== false ? calculateMaxPlayersPerDay(idx) : 0), 0
                        )
                        updateFormData({ maxPlayers: Math.max(16, total) })
                      }
                    }}
                    className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm whitespace-nowrap"
                  >
                    Optimal berechnen
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {!isMultiDay 
                    ? `Optimal: ${formData.courts || 1} Plätze × 4 Spieler ${formData.courts >= 2 ? '+ 2 Pausierte' : ''} = ${(formData.courts || 1) * 4 + (formData.courts >= 2 ? 2 : 0)} Spieler`
                    : 'Basierend auf den Tages-Konfigurationen oben'
                  }
                </p>
              </div>
            </div>
          </div>

          {/* Erweiterte Optionen Toggle */}
          <div className="mt-6 mb-4">
            <button
              type="button"
              onClick={() => updateFormData({ showAdvancedOptions: !formData.showAdvancedOptions })}
              className="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-2"
            >
              <span>{formData.showAdvancedOptions ? '▼' : '▶'}</span>
              Erweiterte Optionen
            </button>
          </div>

          {/* Erweiterte Optionen */}
          {formData.showAdvancedOptions && (
            <div className="border-t pt-4 space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Spielmodus</h4>
                <select
                  value={formData.spielmodus || 'durchgehend'}
                  onChange={(e) => updateFormData({ spielmodus: e.target.value })}
                  className="w-full px-3 py-2 border rounded"
                >
                  <option value="durchgehend">Durchgehend spielen</option>
                  <option value="rotation">Rotation mit Pausen</option>
                  <option value="garantie">Mit Garantien</option>
                </select>
              </div>

              {formData.spielmodus === 'garantie' && (
                <div className="bg-gray-50 p-4 rounded space-y-3">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.garantieSpiele || false}
                      onChange={(e) => updateFormData({ garantieSpiele: e.target.checked })}
                      className="mr-2"
                    />
                    <span>Mindestspiele garantieren</span>
                  </label>
                  
                  {formData.garantieSpiele && (
                    <div className="ml-6">
                      <label className="block text-sm">Mindestanzahl Spiele pro Spieler:</label>
                      <input
                        type="number"
                        value={formData.mindestSpiele || 3}
                        onChange={(e) => updateFormData({ mindestSpiele: parseInt(e.target.value) || 3 })}
                        className="px-2 py-1 border rounded w-20"
                        min="1"
                      />
                    </div>
                  )}
                  
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.garantieMinuten || false}
                      onChange={(e) => updateFormData({ garantieMinuten: e.target.checked })}
                      className="mr-2"
                    />
                    <span>Mindestspielzeit garantieren</span>
                  </label>
                  
                  {formData.garantieMinuten && (
                    <div className="ml-6">
                      <label className="block text-sm">Mindestspielzeit pro Spieler (Minuten):</label>
                      <input
                        type="number"
                        value={formData.mindestMinuten || 45}
                        onChange={(e) => updateFormData({ mindestMinuten: parseInt(e.target.value) || 45 })}
                        className="px-2 py-1 border rounded w-20"
                        min="15"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Berechnung maximale Spieleranzahl */}
              {formData.startTime && formData.endTime && calculateTotalMinutes && calculateMaxPlayers && !isMultiDay && (
                <div className="bg-blue-50 p-4 rounded">
                  <p className="text-sm text-blue-800">
                    <strong>Maximale Spieleranzahl:</strong> {calculateMaxPlayers(formData)} Spieler
                    <br />
                    <span className="text-xs">
                      (Basierend auf {calculateTotalMinutes(formData)} Minuten Spielzeit, {formData.courts} Court(s) 
                      und {formData.roundDuration} Min pro Runde)
                    </span>
                  </p>
                </div>
              )}

              {/* Pausen */}
              <div>
                <h4 className="font-semibold mb-2">Pausen</h4>
                {(formData.breaks || []).map((breakItem, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <input
                      type="time"
                      value={breakItem.startTime || ''}
                      onChange={(e) => {
                        const newBreaks = [...(formData.breaks || [])]
                        newBreaks[index] = {
                          ...newBreaks[index],
                          startTime: e.target.value
                        }
                        updateFormData({ breaks: newBreaks })
                      }}
                      className="px-2 py-1 border rounded"
                      placeholder="Startzeit"
                    />
                    <input
                      type="number"
                      value={breakItem.duration || 15}
                      onChange={(e) => {
                        const newBreaks = [...(formData.breaks || [])]
                        newBreaks[index] = {
                          ...newBreaks[index],
                          duration: parseInt(e.target.value) || 15
                        }
                        updateFormData({ breaks: newBreaks })
                      }}
                      className="px-2 py-1 border rounded w-20"
                      placeholder="Dauer"
                      min="5"
                    />
                    <span className="py-1">Minuten</span>
                    <button
                      type="button"
                      onClick={() => {
                        const newBreaks = (formData.breaks || []).filter((_, i) => i !== index)
                        updateFormData({ breaks: newBreaks })
                      }}
                      className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                    >
                      Entfernen
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => updateFormData({
                    breaks: [...(formData.breaks || []), { startTime: '', duration: 15 }]
                  })}
                  className="px-3 py-1 bg-gray-300 rounded hover:bg-gray-400 text-sm"
                >
                  + Pause hinzufügen
                </button>
              </div>

              {/* Event Info Textarea */}
              <div>
                <label className="block mb-1 font-semibold">
                  Event-Informationen (für Teilnehmer)
                </label>
                <textarea
                  value={formData.eventInfo || ''}
                  onChange={(e) => updateFormData({ eventInfo: e.target.value })}
                  className="w-full px-3 py-2 border rounded"
                  rows="6"
                  placeholder="Zusätzliche Informationen zum Event, Regeln, Hinweise, etc."
                />
              </div>

              {/* Sichtbarkeit */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1 font-semibold">Sichtbarkeit</label>
                  <select
                    value={formData.isPublic ? 'public' : 'private'}
                    onChange={(e) => updateFormData({ isPublic: e.target.value === 'public' })}
                    className="w-full px-3 py-2 border rounded"
                  >
                    <option value="private">Privat (nur für mich)</option>
                    <option value="public">Öffentlich (für alle sichtbar)</option>
                  </select>
                </div>

                {formData.isPublic && (
                  <div>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.registrationOpen || false}
                        onChange={(e) => updateFormData({ registrationOpen: e.target.checked })}
                        className="mr-2"
                      />
                      <span>Online-Anmeldung aktivieren</span>
                    </label>
                  </div>
                )}
              </div>
              
              {formData.isPublic && formData.registrationOpen && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block mb-1 font-semibold">Anmeldeschluss</label>
                    <input
                      type="datetime-local"
                      value={formData.registrationDeadline || ''}
                      onChange={(e) => updateFormData({ registrationDeadline: e.target.value })}
                      className="w-full px-3 py-2 border rounded"
                    />
                  </div>
                  
                  <div>
                    <label className="block mb-1 font-semibold">Startgebühr (€)</label>
                    <input
                      type="number"
                      value={formData.entryFee || 0}
                      onChange={(e) => updateFormData({ entryFee: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border rounded"
                      min="0"
                      step="0.50"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="mt-6 flex justify-end gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              {editingEvent ? 'Speichern' : 'Erstellen'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}