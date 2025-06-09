import { useState, useEffect } from 'react'
import { Calendar, Clock, Users, Settings, Info, Check, AlertCircle, ChevronRight, ChevronLeft, Coffee, Plus, X, Trophy, Zap, Heart } from 'lucide-react'

export const EventForm = ({ 
  editingEvent, 
  onSubmit, 
  onCancel,
  initialData,
  calculateTotalMinutes,
  calculateMaxPlayers
}) => {
  // Wizard Steps
  const steps = [
    { id: 1, name: 'Grundlagen', icon: Info, color: 'blue' },
    { id: 2, name: 'Zeit & Ort', icon: Calendar, color: 'green' },
    { id: 3, name: 'Spielmodus', icon: Settings, color: 'purple' },
    { id: 4, name: 'Teilnehmer', icon: Users, color: 'orange' },
    { id: 5, name: 'Details', icon: Check, color: 'gray' }
  ]

  const [currentStep, setCurrentStep] = useState(1)
  const [showValidationErrors, setShowValidationErrors] = useState(false)
  
  // Quick Templates
  const templates = {
    training: {
      name: 'Training Session',
      startTime: '18:00',
      endTime: '20:00',
      courts: 2,
      maxPlayers: 12,
      roundDuration: 15,
      spielmodus: 'durchgehend',
      eventInfo: 'Wöchentliches Training mit wechselnden Partnern'
    },
    turnier: {
      name: 'Americano Turnier',
      startTime: '09:00',
      endTime: '13:00',
      courts: 4,
      maxPlayers: 24,
      roundDuration: 12,
      spielmodus: 'garantie',
      garantieSpiele: true,
      mindestSpiele: 4,
      eventInfo: 'Turnier mit garantierten Spielen für alle Teilnehmer'
    },
    social: {
      name: 'Social Padel',
      startTime: '14:00',
      endTime: '17:00',
      courts: 3,
      maxPlayers: 16,
      roundDuration: 20,
      spielmodus: 'durchgehend',
      breaks: [{ startTime: '15:30', duration: 30, name: 'Kaffee & Kuchen' }],
      eventInfo: 'Entspanntes Spielen mit Pause für Snacks und Getränke'
    },
    liga: {
      name: 'Liga-Spieltag',
      startTime: '09:00',
      endTime: '18:00',
      courts: 4,
      maxPlayers: 32,
      roundDuration: 15,
      spielmodus: 'garantie',
      garantieMinuten: true,
      mindestMinuten: 90,
      breaks: [
        { startTime: '12:00', duration: 60, name: 'Mittagspause' },
        { startTime: '15:00', duration: 15, name: 'Kaffeepause' }
      ],
      eventInfo: 'Offizieller Liga-Spieltag mit Mittagspause'
    }
  }

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

  // Merge initialData mit Defaults
  const mergeWithDefaults = (data) => {
    const defaults = getDefaultFormData()
    if (!data) return defaults
    
    return {
      ...defaults,
      ...data,
      breaks: data.breaks || [],
      players: data.players || [],
      results: data.results || {},
      courts: parseInt(data.courts) || 2,
      maxPlayers: parseInt(data.maxPlayers) || 16,
      roundDuration: parseInt(data.roundDuration) || 15,
      entryFee: parseFloat(data.entryFee) || 0,
      mindestSpiele: parseInt(data.mindestSpiele) || 3,
      mindestMinuten: parseInt(data.mindestMinuten) || 45
    }
  }

  const [formData, setFormData] = useState(mergeWithDefaults(initialData))
  const [selectedTemplate, setSelectedTemplate] = useState(null)
  const [garantieMode, setGarantieMode] = useState('balanced')
  
  const [liveCalculations, setLiveCalculations] = useState({
    totalMinutes: 0,
    nettoMinutes: 0,
    possibleRounds: 0,
    recommendedPlayers: 16,
    maxPossiblePlayers: 20,
    minGamesPerPlayer: 0,
    minMinutesPerPlayer: 0
  })

  // Update form data helper
  const updateFormData = (updates) => {
    setFormData(prev => ({
      ...prev,
      ...updates
    }))
  }

  // Apply template
  const applyTemplate = (templateKey) => {
    const template = templates[templateKey]
    updateFormData(template)
    setSelectedTemplate(templateKey)
  }

  // Garantie Mode Helper
  useEffect(() => {
    switch (garantieMode) {
      case 'relax':
        updateFormData({
          spielmodus: 'durchgehend',
          garantieSpiele: false,
          garantieMinuten: false
        })
        break
      case 'balanced':
        updateFormData({
          spielmodus: 'garantie',
          garantieSpiele: true,
          garantieMinuten: false,
          mindestSpiele: 3
        })
        break
      case 'intensiv':
        updateFormData({
          spielmodus: 'garantie',
          garantieSpiele: false,
          garantieMinuten: true,
          mindestMinuten: Math.floor(liveCalculations.nettoMinutes * 0.7)
        })
        break
    }
  }, [garantieMode])

  // Live-Berechnungen bei jeder relevanten Änderung
  useEffect(() => {
    if (formData.startTime && formData.endTime && formData.courts && formData.roundDuration) {
      const totalMinutes = calculateTotalMinutes(formData)
      const breakMinutes = formData.breaks.reduce((sum, b) => sum + (b.duration || 0), 0)
      const nettoMinutes = totalMinutes - breakMinutes
      const possibleRounds = Math.floor(nettoMinutes / formData.roundDuration)
      
      // Berechne optimale Spieleranzahl basierend auf Courts
      const playersPerRound = formData.courts * 4
      const waitingPlayers = formData.courts >= 2 ? Math.min(formData.courts, 4) : 0
      const recommendedPlayers = playersPerRound + waitingPlayers
      
      // Berechne maximale Spieleranzahl basierend auf Garantien
      let maxPossiblePlayers = recommendedPlayers
      
      if (formData.spielmodus === 'garantie') {
        if (formData.garantieSpiele && formData.mindestSpiele > 0) {
          const totalGames = possibleRounds * formData.courts
          maxPossiblePlayers = Math.floor((totalGames * 4) / formData.mindestSpiele)
        } else if (formData.garantieMinuten && formData.mindestMinuten > 0) {
          const gamesPerPlayer = Math.ceil(formData.mindestMinuten / formData.roundDuration)
          const totalGames = possibleRounds * formData.courts
          maxPossiblePlayers = Math.floor((totalGames * 4) / gamesPerPlayer)
        }
      } else {
        maxPossiblePlayers = Math.min(
          Math.floor((possibleRounds * formData.courts * 4) / 2),
          40
        )
      }
      
      // Berechne garantierte Werte für aktuelle Spieleranzahl
      const currentPlayers = formData.maxPlayers || recommendedPlayers
      const totalGames = possibleRounds * formData.courts
      const gamesPerPlayer = Math.floor((totalGames * 4) / currentPlayers)
      const minutesPerPlayer = gamesPerPlayer * formData.roundDuration
      
      setLiveCalculations({
        totalMinutes,
        nettoMinutes,
        possibleRounds,
        recommendedPlayers,
        maxPossiblePlayers: Math.max(maxPossiblePlayers, 4),
        minGamesPerPlayer: gamesPerPlayer,
        minMinutesPerPlayer: minutesPerPlayer
      })
    }
  }, [
    formData.startTime, 
    formData.endTime, 
    formData.courts, 
    formData.roundDuration,
    formData.breaks,
    formData.spielmodus,
    formData.garantieSpiele,
    formData.mindestSpiele,
    formData.garantieMinuten,
    formData.mindestMinuten,
    formData.maxPlayers
  ])

  // Auto-Update maxPlayers wenn sich Courts ändern
  useEffect(() => {
    if (!editingEvent) {
      updateFormData({ maxPlayers: liveCalculations.recommendedPlayers })
    }
  }, [liveCalculations.recommendedPlayers])

  // Automatisch Format auf Doppel setzen bei Americano
  useEffect(() => {
    if (formData.eventType === 'americano') {
      updateFormData({ format: 'doubles' })
    }
  }, [formData.eventType])

  // Step validation
  const validateStep = (step) => {
    switch (step) {
      case 1:
        return formData.name.trim() !== ''
      case 2:
        return formData.date && formData.startTime && formData.endTime && formData.courts > 0
      case 3:
        return formData.roundDuration > 0
      case 4:
        return formData.maxPlayers >= 4
      case 5:
        return true
      default:
        return false
    }
  }

  const canProceed = validateStep(currentStep)

  const nextStep = () => {
    if (canProceed && currentStep < 5) {
      setCurrentStep(currentStep + 1)
      setShowValidationErrors(false)
    } else if (!canProceed) {
      setShowValidationErrors(true)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
      setShowValidationErrors(false)
    }
  }

  const handleSubmit = (e) => {
    if (e) e.preventDefault()
    
    // Validate all steps
    let isValid = true
    for (let i = 1; i <= 5; i++) {
      if (!validateStep(i)) {
        isValid = false
        setCurrentStep(i)
        setShowValidationErrors(true)
        break
      }
    }
    
    if (!isValid) return
    
    if (formData.maxPlayers > liveCalculations.maxPossiblePlayers) {
      const proceed = window.confirm(
        `Achtung: Mit ${formData.maxPlayers} Spielern können die gewählten Garantien nicht eingehalten werden.\n` +
        `Empfohlene maximale Spieleranzahl: ${liveCalculations.maxPossiblePlayers}\n\n` +
        `Trotzdem fortfahren?`
      )
      if (!proceed) return
    }
    
    const submitData = {
      ...formData,
      startTime: formData.startTime.split(':').slice(0, 2).join(':'),
      endTime: formData.endTime.split(':').slice(0, 2).join(':'),
      players: formData.players || [],
      breaks: formData.breaks || [],
      results: formData.results || {},
      courts: parseInt(formData.courts) || 2,
      maxPlayers: parseInt(formData.maxPlayers) || 16,
      roundDuration: parseInt(formData.roundDuration) || 15,
      entryFee: parseFloat(formData.entryFee) || 0
    }
    
    onSubmit(submitData)
  }

  // Pausen-Management
  const addBreak = () => {
    updateFormData({
      breaks: [...formData.breaks, { startTime: '', duration: 30, name: 'Pause' }]
    })
  }

  const updateBreak = (index, field, value) => {
    const newBreaks = [...formData.breaks]
    newBreaks[index][field] = value
    updateFormData({ breaks: newBreaks })
  }

  const removeBreak = (index) => {
    updateFormData({
      breaks: formData.breaks.filter((_, i) => i !== index)
    })
  }

  // Tooltip Component
  const Tooltip = ({ children, text }) => (
    <div className="group relative inline-block">
      {children}
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 p-2 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
        {text}
      </div>
    </div>
  )

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-5xl w-full h-[90vh] flex flex-col">
        {/* Header mit Steps */}
        <div className="border-b px-6 py-4">
          <h2 className="text-2xl font-bold mb-4">
            {editingEvent ? 'Event bearbeiten' : 'Neues Event erstellen'}
          </h2>
          
          {/* Step Indicator */}
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const Icon = step.icon
              const isActive = step.id === currentStep
              const isCompleted = step.id < currentStep && validateStep(step.id)
              
              return (
                <div key={step.id} className="flex items-center">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(step.id)}
                    className={`
                      flex items-center gap-2 px-4 py-2 rounded-lg transition-all
                      ${isActive ? `bg-${step.color}-100 text-${step.color}-700 font-semibold` : ''}
                      ${isCompleted ? 'text-green-600' : 'text-gray-400'}
                      ${!isActive && !isCompleted ? 'hover:bg-gray-100' : ''}
                    `}
                  >
                    <div className={`
                      w-8 h-8 rounded-full flex items-center justify-center
                      ${isActive ? `bg-${step.color}-600 text-white` : ''}
                      ${isCompleted ? 'bg-green-600 text-white' : 'bg-gray-200'}
                    `}>
                      {isCompleted ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                    </div>
                    <span className="hidden md:inline">{step.name}</span>
                  </button>
                  {index < steps.length - 1 && (
                    <ChevronRight className="w-5 h-5 text-gray-300 mx-2" />
                  )}
                </div>
              )
            })}
          </div>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          <div className="space-y-6">
            {/* STEP 1: Grundlagen */}
            {currentStep === 1 && (
              <div className="space-y-6 animate-in">
                {/* Template Selection */}
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Zap className="w-5 h-5 text-yellow-500" />
                    Schnellstart-Vorlagen
                  </h4>
                  <p className="text-sm text-gray-600 mb-4">
                    Wählen Sie eine Vorlage für einen schnellen Start:
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {Object.entries(templates).map(([key, template]) => {
                      const icons = {
                        training: '🏃',
                        turnier: '🏆',
                        social: '🎉',
                        liga: '📊'
                      }
                      const descriptions = {
                        training: '2h, 8-12 Spieler',
                        turnier: '4h, 16-24 Spieler',
                        social: '3h, flexibel',
                        liga: 'Ganztags-Event'
                      }
                      
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => applyTemplate(key)}
                          className={`
                            p-3 border-2 rounded-lg text-center transition-all
                            ${selectedTemplate === key 
                              ? 'border-blue-500 bg-blue-50' 
                              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                            }
                          `}
                        >
                          <div className="text-2xl mb-1">{icons[key]}</div>
                          <div className="font-medium text-sm">{key.charAt(0).toUpperCase() + key.slice(1)}</div>
                          <div className="text-xs text-gray-500">{descriptions[key]}</div>
                        </button>
                      )
                    })}
                  </div>
                </div>
                
                {/* Basic Info */}
                <div className="bg-blue-50 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold mb-4 text-blue-900 flex items-center gap-2">
                    <Info className="w-5 h-5" />
                    Event-Grundlagen
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block mb-1 font-medium">
                        Event Name *
                        {showValidationErrors && !formData.name.trim() && (
                          <span className="text-red-500 text-sm ml-2">Pflichtfeld</span>
                        )}
                      </label>
                      <input
                        type="text"
                        value={formData.name || ''}
                        onChange={(e) => updateFormData({ name: e.target.value })}
                        className={`
                          w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500
                          ${showValidationErrors && !formData.name.trim() ? 'border-red-500' : ''}
                        `}
                        placeholder="z.B. Sommer Americano 2024"
                      />
                    </div>
                    
                    <div>
                      <label className="block mb-1 font-medium flex items-center gap-2">
                        Sportart
                        <Tooltip text="Wählen Sie die Sportart für Ihr Event">
                          <Info className="w-4 h-4 text-gray-400" />
                        </Tooltip>
                      </label>
                      <select
                        value={formData.sport || 'padel'}
                        onChange={(e) => updateFormData({ sport: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="padel">Padel</option>
                        <option value="pickleball">Pickleball</option>
                        <option value="spinxball">SpinXball</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block mb-1 font-medium flex items-center gap-2">
                        Event-Typ
                        <Tooltip text="Americano: Jeder spielt mit wechselnden Partnern gegen wechselnde Gegner">
                          <Info className="w-4 h-4 text-gray-400" />
                        </Tooltip>
                      </label>
                      <select
                        value={formData.eventType || 'americano'}
                        onChange={(e) => updateFormData({ eventType: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="americano">Americano</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block mb-1 font-medium">Geschlechtsmodus</label>
                      <select
                        value={formData.genderMode || 'open'}
                        onChange={(e) => updateFormData({ genderMode: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="open">Mixed / Open</option>
                        <option value="men">Nur Herren</option>
                        <option value="women">Nur Damen</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* STEP 2: Zeit & Ort */}
            {currentStep === 2 && (
              <div className="space-y-6 animate-in">
                <div className="bg-green-50 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold mb-4 text-green-900 flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Wann findet das Event statt?
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <label className="block mb-1 font-medium">
                        Datum *
                        {showValidationErrors && !formData.date && (
                          <span className="text-red-500 text-sm ml-2">Pflichtfeld</span>
                        )}
                      </label>
                      <input
                        type="date"
                        value={formData.date || ''}
                        onChange={(e) => updateFormData({ date: e.target.value })}
                        className={`
                          w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500
                          ${showValidationErrors && !formData.date ? 'border-red-500' : ''}
                        `}
                        min={new Date().toISOString().split('T')[0]}
                      />
                    </div>
                    
                    <div>
                      <label className="block mb-1 font-medium">
                        Startzeit *
                        {showValidationErrors && !formData.startTime && (
                          <span className="text-red-500 text-sm ml-2">Pflichtfeld</span>
                        )}
                      </label>
                      <input
                        type="time"
                        value={formData.startTime || '09:00'}
                        onChange={(e) => updateFormData({ startTime: e.target.value })}
                        className={`
                          w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500
                          ${showValidationErrors && !formData.startTime ? 'border-red-500' : ''}
                        `}
                      />
                    </div>
                    
                    <div>
                      <label className="block mb-1 font-medium">
                        Endzeit *
                        {showValidationErrors && !formData.endTime && (
                          <span className="text-red-500 text-sm ml-2">Pflichtfeld</span>
                        )}
                      </label>
                      <input
                        type="time"
                        value={formData.endTime || '13:00'}
                        onChange={(e) => updateFormData({ endTime: e.target.value })}
                        className={`
                          w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500
                          ${showValidationErrors && !formData.endTime ? 'border-red-500' : ''}
                        `}
                      />
                    </div>
                    
                    <div>
                      <label className="block mb-1 font-medium flex items-center gap-2">
                        Anzahl Plätze *
                        <Tooltip text="Wie viele Plätze stehen gleichzeitig zur Verfügung?">
                          <Info className="w-4 h-4 text-gray-400" />
                        </Tooltip>
                      </label>
                      <input
                        type="number"
                        value={formData.courts || 2}
                        onChange={(e) => updateFormData({ courts: parseInt(e.target.value) || 1 })}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                        min="1"
                        max="10"
                      />
                    </div>
                  </div>
                  
                  {/* Live-Berechnung */}
                  <div className="mt-6 p-4 bg-white rounded-lg border border-green-200">
                    <h4 className="font-medium mb-3 text-green-900">Zeit-Übersicht:</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div className="text-center">
                        <Clock className="w-8 h-8 mx-auto mb-1 text-green-600" />
                        <span className="text-gray-600 block">Gesamtzeit</span>
                        <p className="font-bold text-lg">{liveCalculations.totalMinutes} Min</p>
                      </div>
                      <div className="text-center">
                        <Coffee className="w-8 h-8 mx-auto mb-1 text-orange-600" />
                        <span className="text-gray-600 block">Pausen</span>
                        <p className="font-bold text-lg">{formData.breaks.reduce((sum, b) => sum + b.duration, 0)} Min</p>
                      </div>
                      <div className="text-center">
                        <Zap className="w-8 h-8 mx-auto mb-1 text-blue-600" />
                        <span className="text-gray-600 block">Netto-Spielzeit</span>
                        <p className="font-bold text-lg">{liveCalculations.nettoMinutes} Min</p>
                      </div>
                      <div className="text-center">
                        <Trophy className="w-8 h-8 mx-auto mb-1 text-purple-600" />
                        <span className="text-gray-600 block">Mögliche Runden</span>
                        <p className="font-bold text-lg">{liveCalculations.possibleRounds}</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Location */}
                  <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block mb-1 font-medium">Ort</label>
                      <input
                        type="text"
                        value={formData.location || ''}
                        onChange={(e) => updateFormData({ location: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                        placeholder="z.B. Padel Club München"
                      />
                    </div>
                    
                    <div>
                      <label className="block mb-1 font-medium">Kontakt-Telefon</label>
                      <input
                        type="tel"
                        value={formData.phone || ''}
                        onChange={(e) => updateFormData({ phone: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                        placeholder="z.B. +49 123 456789"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* STEP 3: Spielmodus */}
            {currentStep === 3 && (
              <div className="space-y-6 animate-in">
                <div className="bg-purple-50 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold mb-4 text-purple-900 flex items-center gap-2">
                    <Settings className="w-5 h-5" />
                    Wie soll gespielt werden?
                  </h3>
                  
                  {/* Rundenzeit */}
                  <div className="mb-6">
                    <label className="block mb-1 font-medium flex items-center gap-2">
                      Rundenzeit (Minuten) *
                      <Tooltip text="Wie lange dauert eine Spielrunde? Üblich sind 10-20 Minuten">
                        <Info className="w-4 h-4 text-gray-400" />
                      </Tooltip>
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        value={formData.roundDuration || 15}
                        onChange={(e) => updateFormData({ roundDuration: parseInt(e.target.value) })}
                        className="flex-1"
                        min="5"
                        max="30"
                        step="5"
                      />
                      <input
                        type="number"
                        value={formData.roundDuration || 15}
                        onChange={(e) => updateFormData({ roundDuration: parseInt(e.target.value) || 15 })}
                        className="w-20 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 text-center font-bold"
                        min="5"
                        max="60"
                      />
                      <span>Min</span>
                    </div>
                  </div>
                  
                  {/* Spielmodus Presets */}
                  <div className="mb-6">
                    <label className="block mb-3 font-medium">Spielmodus auswählen:</label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <label className={`
                        relative flex flex-col p-4 border-2 rounded-lg cursor-pointer transition-all
                        ${garantieMode === 'relax' 
                          ? 'border-purple-500 bg-purple-50' 
                          : 'border-gray-200 hover:border-purple-300'
                        }
                      `}>
                        <input
                          type="radio"
                          name="garantie"
                          value="relax"
                          checked={garantieMode === 'relax'}
                          onChange={() => setGarantieMode('relax')}
                          className="sr-only"
                        />
                        <Heart className="w-8 h-8 mb-2 text-purple-600" />
                        <strong className="text-lg">Entspannt</strong>
                        <p className="text-sm text-gray-600 mt-1">
                          Viel Pause zwischen den Spielen, ideal für Social Events
                        </p>
                      </label>
                      
                      <label className={`
                        relative flex flex-col p-4 border-2 rounded-lg cursor-pointer transition-all
                        ${garantieMode === 'balanced' 
                          ? 'border-purple-500 bg-purple-50' 
                          : 'border-gray-200 hover:border-purple-300'
                        }
                      `}>
                        <input
                          type="radio"
                          name="garantie"
                          value="balanced"
                          checked={garantieMode === 'balanced'}
                          onChange={() => setGarantieMode('balanced')}
                          className="sr-only"
                        />
                        <Zap className="w-8 h-8 mb-2 text-purple-600" />
                        <strong className="text-lg">Ausgewogen</strong>
                        <p className="text-sm text-gray-600 mt-1">
                          Mind. 3 Spiele garantiert, gute Balance
                        </p>
                      </label>
                      
                      <label className={`
                        relative flex flex-col p-4 border-2 rounded-lg cursor-pointer transition-all
                        ${garantieMode === 'intensiv' 
                          ? 'border-purple-500 bg-purple-50' 
                          : 'border-gray-200 hover:border-purple-300'
                        }
                      `}>
                        <input
                          type="radio"
                          name="garantie"
                          value="intensiv"
                          checked={garantieMode === 'intensiv'}
                          onChange={() => setGarantieMode('intensiv')}
                          className="sr-only"
                        />
                        <Trophy className="w-8 h-8 mb-2 text-purple-600" />
                        <strong className="text-lg">Intensiv</strong>
                        <p className="text-sm text-gray-600 mt-1">
                          Maximale Spielzeit für alle Teilnehmer
                        </p>
                      </label>
                    </div>
                  </div>
                  
                  {/* Details für gewählten Modus */}
                  <details className="mt-4">
                    <summary className="cursor-pointer text-sm text-purple-700 hover:text-purple-900 font-medium">
                      ⚙️ Erweiterte Einstellungen anzeigen
                    </summary>
                    <div className="mt-4 p-4 bg-white rounded-lg border border-purple-200 space-y-3">
                      <div>
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={formData.garantieSpiele || false}
                            onChange={(e) => updateFormData({ 
                              garantieSpiele: e.target.checked,
                              garantieMinuten: e.target.checked ? false : formData.garantieMinuten
                            })}
                            className="mr-2"
                          />
                          <span>Mindestanzahl Spiele garantieren</span>
                        </label>
                        
                        {formData.garantieSpiele && (
                          <div className="ml-6 mt-2">
                            <label className="block text-sm">Mindestspiele pro Spieler:</label>
                            <input
                              type="number"
                              value={formData.mindestSpiele || 3}
                              onChange={(e) => updateFormData({ mindestSpiele: parseInt(e.target.value) || 3 })}
                              className="px-2 py-1 border rounded w-20"
                              min="1"
                              max={liveCalculations.possibleRounds}
                            />
                          </div>
                        )}
                      </div>
                      
                      <div>
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={formData.garantieMinuten || false}
                            onChange={(e) => updateFormData({ 
                              garantieMinuten: e.target.checked,
                              garantieSpiele: e.target.checked ? false : formData.garantieSpiele
                            })}
                            className="mr-2"
                          />
                          <span>Mindestspielzeit garantieren</span>
                        </label>
                        
                        {formData.garantieMinuten && (
                          <div className="ml-6 mt-2">
                            <label className="block text-sm">Mindestspielzeit (Minuten):</label>
                            <input
                              type="number"
                              value={formData.mindestMinuten || 45}
                              onChange={(e) => updateFormData({ mindestMinuten: parseInt(e.target.value) || 45 })}
                              className="px-2 py-1 border rounded w-20"
                              min="15"
                              max={liveCalculations.nettoMinutes}
                              step="15"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </details>
                  
                  {/* Pausen Visual Scheduler */}
                  <div className="mt-6">
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <Coffee className="w-5 h-5 text-orange-600" />
                      Pausen planen
                    </h4>
                    
                    {/* Simple Break List */}
                    <div className="space-y-2">
                      {formData.breaks.map((breakItem, index) => (
                        <div key={index} className="flex items-center gap-2 bg-orange-50 p-3 rounded-lg">
                          <Coffee className="w-4 h-4 text-orange-600" />
                          <input
                            type="text"
                            value={breakItem.name || 'Pause'}
                            onChange={(e) => updateBreak(index, 'name', e.target.value)}
                            className="flex-1 px-2 py-1 border rounded text-sm"
                            placeholder="Pausenname"
                          />
                          <input
                            type="time"
                            value={breakItem.startTime || ''}
                            onChange={(e) => updateBreak(index, 'startTime', e.target.value)}
                            className="px-2 py-1 border rounded text-sm"
                          />
                          <select
                            value={breakItem.duration || 30}
                            onChange={(e) => updateBreak(index, 'duration', parseInt(e.target.value))}
                            className="px-2 py-1 border rounded text-sm"
                          >
                            <option value="15">15 Min</option>
                            <option value="30">30 Min</option>
                            <option value="45">45 Min</option>
                            <option value="60">60 Min</option>
                          </select>
                          <button
                            type="button"
                            onClick={() => removeBreak(index)}
                            className="p-1 text-red-600 hover:bg-red-100 rounded"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={addBreak}
                        className="w-full px-3 py-2 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 flex items-center justify-center gap-2"
                      >
                        <Plus className="w-4 h-4" />
                        Pause hinzufügen
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* STEP 4: Teilnehmer */}
            {currentStep === 4 && (
              <div className="space-y-6 animate-in">
                <div className="bg-orange-50 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold mb-4 text-orange-900 flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Maximale Spieleranzahl festlegen
                  </h3>
                  
                  {/* Smart Recommendations */}
                  <div className="p-4 bg-white rounded-lg border border-orange-200 mb-6">
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <Info className="w-4 h-4 text-orange-600" />
                      Intelligente Empfehlungen für Ihr Event:
                    </h4>
                    
                    <div className="space-y-3">
                      {/* Optimal */}
                      <div className="flex items-center justify-between p-3 bg-green-50 rounded">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-green-600 text-white rounded-full flex items-center justify-center font-bold">
                            {liveCalculations.recommendedPlayers}
                          </div>
                          <div>
                            <strong className="text-green-700">Optimal</strong>
                            <p className="text-sm text-gray-600">Alle spielen regelmäßig ohne lange Pausen</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => updateFormData({ maxPlayers: liveCalculations.recommendedPlayers })}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                        >
                          Übernehmen
                        </button>
                      </div>
                      
                      {/* Maximum mit Garantien */}
                      {formData.spielmodus === 'garantie' && (
                        <div className="flex items-center justify-between p-3 bg-orange-50 rounded">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-orange-600 text-white rounded-full flex items-center justify-center font-bold">
                              {liveCalculations.maxPossiblePlayers}
                            </div>
                            <div>
                              <strong className="text-orange-700">Maximum</strong>
                              <p className="text-sm text-gray-600">
                                Bei gewählten Garantien ({formData.garantieSpiele ? `${formData.mindestSpiele} Spiele` : `${formData.mindestMinuten} Min`})
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => updateFormData({ maxPlayers: liveCalculations.maxPossiblePlayers })}
                            className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
                          >
                            Übernehmen
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Manual Input */}
                  <div>
                    <label className="block mb-2 font-medium">
                      Maximale Spieleranzahl *
                      {showValidationErrors && formData.maxPlayers < 4 && (
                        <span className="text-red-500 text-sm ml-2">Mindestens 4 Spieler erforderlich</span>
                      )}
                    </label>
                    <div className="flex items-center gap-4">
                      <input
                        type="range"
                        value={formData.maxPlayers || liveCalculations.recommendedPlayers}
                        onChange={(e) => updateFormData({ maxPlayers: parseInt(e.target.value) })}
                        className="flex-1"
                        min="4"
                        max={Math.max(40, liveCalculations.maxPossiblePlayers + 8)}
                        step="2"
                      />
                      <input
                        type="number"
                        value={formData.maxPlayers || liveCalculations.recommendedPlayers}
                        onChange={(e) => updateFormData({ maxPlayers: parseInt(e.target.value) || 16 })}
                        className={`
                          w-20 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 text-center font-bold text-lg
                          ${formData.maxPlayers > liveCalculations.maxPossiblePlayers ? 'border-red-500 bg-red-50' : ''}
                        `}
                        min="4"
                        max="100"
                        step="2"
                      />
                      <span>Spieler</span>
                    </div>
                    
                    {/* Warning */}
                    {formData.maxPlayers > liveCalculations.maxPossiblePlayers && (
                      <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                        <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-red-700">
                          <strong>Achtung:</strong> Mit {formData.maxPlayers} Spielern können die gewählten Garantien nicht eingehalten werden!
                          Empfohlene maximale Spieleranzahl: {liveCalculations.maxPossiblePlayers}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Preview Stats */}
                  <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-medium mb-2">Vorschau mit {formData.maxPlayers} Spielern:</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                      <div>
                        <span className="text-gray-600">Spiele pro Person:</span>
                        <p className="font-bold text-lg">{liveCalculations.minGamesPerPlayer}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Spielzeit pro Person:</span>
                        <p className="font-bold text-lg">{liveCalculations.minMinutesPerPlayer} Min</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Pausenzeit:</span>
                        <p className="font-bold text-lg">
                          {Math.max(0, liveCalculations.nettoMinutes - liveCalculations.minMinutesPerPlayer)} Min
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-600">Auslastung:</span>
                        <p className="font-bold text-lg">
                          {Math.round((liveCalculations.minMinutesPerPlayer / liveCalculations.nettoMinutes) * 100)}%
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* STEP 5: Weitere Details */}
            {currentStep === 5 && (
              <div className="space-y-6 animate-in">
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold mb-4 text-gray-900 flex items-center gap-2">
                    <Check className="w-5 h-5" />
                    Weitere Informationen (optional)
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block mb-1 font-medium">Event-Beschreibung</label>
                      <textarea
                        value={formData.eventInfo || ''}
                        onChange={(e) => updateFormData({ eventInfo: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-gray-500"
                        rows="4"
                        placeholder="Zusätzliche Informationen für die Teilnehmer..."
                      />
                    </div>
                    
                    {/* Öffentlichkeit & Anmeldung */}
                    <div className="p-4 bg-white rounded-lg border">
                      <h4 className="font-medium mb-3">Sichtbarkeit & Anmeldung</h4>
                      
                      <div className="space-y-3">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={formData.isPublic || false}
                            onChange={(e) => updateFormData({ 
                              isPublic: e.target.checked,
                              registrationOpen: e.target.checked ? formData.registrationOpen : false
                            })}
                            className="mr-3 w-4 h-4"
                          />
                          <div>
                            <span className="font-medium">Event öffentlich sichtbar machen</span>
                            <p className="text-sm text-gray-600">Andere Nutzer können das Event finden und ansehen</p>
                          </div>
                        </label>
                        
                        {formData.isPublic && (
                          <>
                            <label className="flex items-center ml-7">
                              <input
                                type="checkbox"
                                checked={formData.registrationOpen || false}
                                onChange={(e) => updateFormData({ registrationOpen: e.target.checked })}
                                className="mr-3 w-4 h-4"
                              />
                              <div>
                                <span className="font-medium">Online-Anmeldung aktivieren</span>
                                <p className="text-sm text-gray-600">Spieler können sich selbst anmelden</p>
                              </div>
                            </label>
                            
                            {formData.registrationOpen && (
                              <div className="ml-7 grid grid-cols-1 md:grid-cols-2 gap-4 p-3 bg-gray-50 rounded">
                                <div>
                                  <label className="block text-sm font-medium mb-1">Anmeldeschluss</label>
                                  <input
                                    type="datetime-local"
                                    value={formData.registrationDeadline || ''}
                                    onChange={(e) => updateFormData({ registrationDeadline: e.target.value })}
                                    className="w-full px-2 py-1 border rounded text-sm"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium mb-1">Startgebühr (€)</label>
                                  <input
                                    type="number"
                                    value={formData.entryFee || 0}
                                    onChange={(e) => updateFormData({ entryFee: parseFloat(e.target.value) || 0 })}
                                    className="w-full px-2 py-1 border rounded text-sm"
                                    min="0"
                                    step="0.50"
                                  />
                                </div>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Final Summary */}
                <div className="bg-blue-100 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold mb-4 text-blue-900 flex items-center gap-2">
                    <Trophy className="w-5 h-5" />
                    Event-Zusammenfassung
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="bg-white p-3 rounded">
                      <span className="text-sm text-gray-600">Event</span>
                      <p className="font-semibold">{formData.name || 'Kein Name'}</p>
                    </div>
                    <div className="bg-white p-3 rounded">
                      <span className="text-sm text-gray-600">Datum & Zeit</span>
                      <p className="font-semibold">
                        {formData.date ? new Date(formData.date).toLocaleDateString('de-DE') : 'Kein Datum'}
                        <br />
                        {formData.startTime} - {formData.endTime}
                      </p>
                    </div>
                    <div className="bg-white p-3 rounded">
                      <span className="text-sm text-gray-600">Ort</span>
                      <p className="font-semibold">{formData.location || 'Nicht angegeben'}</p>
                    </div>
                    <div className="bg-white p-3 rounded">
                      <span className="text-sm text-gray-600">Plätze</span>
                      <p className="font-semibold">{formData.courts}</p>
                    </div>
                    <div className="bg-white p-3 rounded">
                      <span className="text-sm text-gray-600">Max. Spieler</span>
                      <p className="font-semibold">{formData.maxPlayers}</p>
                    </div>
                    <div className="bg-white p-3 rounded">
                      <span className="text-sm text-gray-600">Spielmodus</span>
                      <p className="font-semibold">
                        {formData.spielmodus === 'garantie' ? 
                          (formData.garantieSpiele ? `Mind. ${formData.mindestSpiele} Spiele` : `Mind. ${formData.mindestMinuten} Min.`) : 
                          'Durchgehend'
                        }
                      </p>
                    </div>
                    <div className="bg-white p-3 rounded">
                      <span className="text-sm text-gray-600">Rundenzeit</span>
                      <p className="font-semibold">{formData.roundDuration} Minuten</p>
                    </div>
                    <div className="bg-white p-3 rounded">
                      <span className="text-sm text-gray-600">Spielzeit/Person</span>
                      <p className="font-semibold">~{liveCalculations.minMinutesPerPlayer} Minuten</p>
                    </div>
                    <div className="bg-white p-3 rounded">
                      <span className="text-sm text-gray-600">Status</span>
                      <p className="font-semibold">
                        {formData.isPublic ? 'Öffentlich' : 'Privat'}
                        {formData.registrationOpen && ' • Anmeldung offen'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Footer mit Navigation */}
        <div className="border-t px-6 py-4 flex justify-between items-center">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Abbrechen
          </button>
          
          <div className="flex gap-3">
            {currentStep > 1 && (
              <button
                type="button"
                onClick={prevStep}
                className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 flex items-center gap-2"
              >
                <ChevronLeft className="w-4 h-4" />
                Zurück
              </button>
            )}
            
            {currentStep < 5 ? (
              <button
                type="button"
                onClick={nextStep}
                className={`
                  px-4 py-2 rounded-lg flex items-center gap-2
                  ${canProceed 
                    ? 'bg-blue-600 text-white hover:bg-blue-700' 
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }
                `}
                disabled={!canProceed}
              >
                Weiter
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                {editingEvent ? 'Änderungen speichern' : 'Event erstellen'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}