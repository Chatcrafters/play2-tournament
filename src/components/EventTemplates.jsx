import { useState } from 'react'

export function EventTemplates({ templates, setTemplates, onUseTemplate, onClose }) {
  const [editingTemplate, setEditingTemplate] = useState(null)
  const [templateName, setTemplateName] = useState('')

  const handleSaveTemplate = () => {
    if (!templateName.trim()) return

    if (editingTemplate) {
      setTemplates(templates.map(t => 
        t.id === editingTemplate.id 
          ? { ...t, name: templateName.trim() }
          : t
      ))
      setEditingTemplate(null)
    }
    setTemplateName('')
  }

  const handleDeleteTemplate = (templateId) => {
    if (window.confirm('Möchten Sie diese Vorlage wirklich löschen?')) {
      setTemplates(templates.filter(t => t.id !== templateId))
    }
  }

  const handleEditTemplate = (template) => {
    setEditingTemplate(template)
    setTemplateName(template.name)
  }

  const getSportIcon = (sport) => {
    switch(sport) {
      case 'padel': return '🎾'
      case 'pickleball': return '🏓'
      case 'spinxball': return '🏸'
      default: return '🏆'
    }
  }

  const getEventTypeLabel = (type) => {
    switch(type) {
      case 'americano': return 'Americano'
      case 'openplay': return 'Open Play'
      case 'express': return 'Tournament Express'
      case 'tournament': return 'Tournament'
      case 'liga': return 'Liga'
      default: return type
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Event-Vorlagen</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {templates.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">Noch keine Vorlagen gespeichert</p>
              <p className="text-sm text-gray-400">
                Erstellen Sie ein Event und speichern Sie es als Vorlage für die spätere Wiederverwendung
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {templates.map((template) => (
                <div key={template.id} className="bg-gray-50 rounded-lg p-4 hover:shadow-md transition-shadow">
                  {editingTemplate?.id === template.id ? (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={templateName}
                        onChange={(e) => setTemplateName(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') handleSaveTemplate()
                        }}
                        className="flex-1 px-2 py-1 border rounded"
                        autoFocus
                      />
                      <button
                        onClick={handleSaveTemplate}
                        className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                      >
                        ✓
                      </button>
                      <button
                        onClick={() => {
                          setEditingTemplate(null)
                          setTemplateName('')
                        }}
                        className="px-3 py-1 bg-gray-300 rounded hover:bg-gray-400"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="flex justify-between items-start mb-3">
                        <h3 className="font-semibold text-lg">{template.name}</h3>
                        <span className="text-2xl">{getSportIcon(template.data.sport)}</span>
                      </div>
                      
                      <div className="text-sm text-gray-600 space-y-1 mb-3">
                        <p>📅 {getEventTypeLabel(template.data.eventType)} - {template.data.format}</p>
                        <p>⏱️ {template.data.roundDuration} Min Runden</p>
                        <p>🏟️ {template.data.courts} {template.data.courts === 1 ? 'Court' : 'Courts'}</p>
                        <p>👥 Max. {template.data.maxPlayers} Spieler</p>
                        {template.data.startTime && template.data.endTime && (
                          <p>🕐 {template.data.startTime} - {template.data.endTime}</p>
                        )}
                        {template.data.breaks?.length > 0 && (
                          <p>☕ {template.data.breaks.length} Pause(n)</p>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => onUseTemplate(template)}
                          className="flex-1 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                          Verwenden
                        </button>
                        <button
                          onClick={() => handleEditTemplate(template)}
                          className="px-3 py-2 bg-gray-200 rounded hover:bg-gray-300"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleDeleteTemplate(template.id)}
                          className="px-3 py-2 bg-red-100 text-red-600 rounded hover:bg-red-200"
                        >
                          🗑️
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Standard-Vorlagen Vorschlag */}
        {templates.length === 0 && (
          <div className="p-6 border-t bg-gray-50">
            <h3 className="font-semibold mb-3">Schnellstart mit Standard-Vorlagen:</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <button
                onClick={() => {
                  const newTemplate = {
                    id: Date.now().toString(),
                    name: 'Freitags-Americano',
                    data: {
                      sport: 'padel',
                      eventType: 'americano',
                      format: 'doubles',
                      courts: 2,
                      roundDuration: 15,
                      maxPlayers: 16,
                      startTime: '18:00',
                      endTime: '21:00',
                      breaks: [],
                      playMode: 'continuous',
                      minGamesPerPlayer: 3,
                      minPlayTimeMinutes: 45,
                      waitingTime: 5
                    }
                  }
                  setTemplates([...templates, newTemplate])
                }}
                className="p-3 bg-white border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50"
              >
                <span className="text-2xl">🎾</span>
                <p className="font-medium">Freitags-Americano</p>
                <p className="text-xs text-gray-500">Padel, 18-21 Uhr</p>
              </button>

              <button
                onClick={() => {
                  const newTemplate = {
                    id: Date.now().toString() + '1',
                    name: 'Weekend Liga',
                    data: {
                      sport: 'pickleball',
                      eventType: 'liga',
                      format: 'doubles',
                      courts: 3,
                      roundDuration: 20,
                      maxPlayers: 24,
                      startTime: '10:00',
                      endTime: '14:00',
                      breaks: [{ startTime: '12:00', duration: 30 }],
                      playMode: 'rotation',
                      minGamesPerPlayer: 5,
                      minPlayTimeMinutes: 60,
                      waitingTime: 3
                    }
                  }
                  setTemplates([...templates, newTemplate])
                }}
                className="p-3 bg-white border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50"
              >
                <span className="text-2xl">🏓</span>
                <p className="font-medium">Weekend Liga</p>
                <p className="text-xs text-gray-500">Pickleball, 10-14 Uhr</p>
              </button>

              <button
                onClick={() => {
                  const newTemplate = {
                    id: Date.now().toString() + '2',
                    name: 'Express Turnier',
                    data: {
                      sport: 'spinxball',
                      eventType: 'express',
                      format: 'singles',
                      courts: 2,
                      roundDuration: 10,
                      maxPlayers: 8,
                      startTime: '17:00',
                      endTime: '19:00',
                      breaks: [],
                      playMode: 'minGames',
                      minGamesPerPlayer: 4,
                      minPlayTimeMinutes: 40,
                      waitingTime: 5
                    }
                  }
                  setTemplates([...templates, newTemplate])
                }}
                className="p-3 bg-white border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50"
              >
                <span className="text-2xl">🏸</span>
                <p className="font-medium">Express Turnier</p>
                <p className="text-xs text-gray-500">SpinXball, 17-19 Uhr</p>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}