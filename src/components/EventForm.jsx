// ============ FAIRNESS CALCULATION SYSTEM ============

// ERSETZE die calculateFairnessScore Funktion in EventForm.jsx komplett durch diese robuste Version:

const calculateFairnessScore = (playerCount, courts, rounds, roundDuration) => {
  // FIXED: Robuste Validierung und Fallback-Werte
  if (!playerCount || playerCount < 4 || !courts || courts < 1 || !rounds || rounds < 1) {
    return { 
      score: 0, 
      status: 'invalid', 
      message: 'Mindestens 4 Spieler erforderlich',
      color: 'red',
      icon: '❌',
      factors: {
        gameBalance: 0,
        partnerVariety: 0,
        opponentVariety: 0,
        restFairness: 0
      },
      restingPlayersPerRound: 0,
      recommendations: []
    }
  }
  
  try {
    // FIXED: Sichere Berechnungen mit Fallback-Werten
    const matchesPerRound = Math.min(courts, Math.floor(playerCount / 4))
    const playersPerRound = matchesPerRound * 4
    const restingPlayersPerRound = Math.max(0, playerCount - playersPerRound)
    
    // Realistische Amerikanisch-Fairness-Berechnung
    let fairnessScore = 50 // Basis-Score für Americano
    
    // 1. Partner-Vielfalt (wichtigster Faktor)
    const avgGamesPerPlayer = (rounds * matchesPerRound * 4) / playerCount
    const maxPossiblePartners = playerCount - 1
    const estimatedUniquePartners = Math.min(maxPossiblePartners, avgGamesPerPlayer * 0.8)
    const partnerCoverage = maxPossiblePartners > 0 ? estimatedUniquePartners / maxPossiblePartners : 0
    
    // Partner-Score berechnen
    let partnerScore = 0
    if (playerCount <= 8) {
      partnerScore = Math.min(85, 40 + (partnerCoverage * 50))
    } else if (playerCount <= 16) {
      partnerScore = Math.min(75, 30 + (partnerCoverage * 60))
    } else if (playerCount <= 24) {
      partnerScore = Math.min(65, 20 + (partnerCoverage * 55))
    } else {
      partnerScore = Math.min(55, 15 + (partnerCoverage * 45))
    }
    
    // 2. Spiele-Balance (zweitwichtigster Faktor)
    let gameBalance = 80
    if (restingPlayersPerRound > 0) {
      const restRatio = restingPlayersPerRound / playerCount
      gameBalance -= restRatio * 100 // Strafe für wartende Spieler
      
      // Bonus wenn genug Runden für Rotation
      if (rounds >= Math.ceil(playerCount / playersPerRound)) {
        gameBalance += 20
      }
    }
    gameBalance = Math.max(20, Math.min(100, gameBalance))
    
    // 3. Gegner-Vielfalt
    const estimatedOpponents = Math.min(maxPossiblePartners, avgGamesPerPlayer * 1.5)
    const opponentCoverage = maxPossiblePartners > 0 ? estimatedOpponents / maxPossiblePartners : 0
    let opponentScore = Math.min(80, 30 + (opponentCoverage * 60))
    
    // 4. Court/Player Ratio
    let courtRatioScore = 70
    const courtPlayerRatio = courts / playerCount
    if (courtPlayerRatio > 0.25) {
      courtRatioScore += 20 // Viele Courts = bessere Rotation
    } else if (courtPlayerRatio < 0.1) {
      courtRatioScore -= 30 // Zu wenig Courts = schlechte Fairness
    }
    
    // 5. Spiele pro Spieler
    let gamesScore = 70
    if (avgGamesPerPlayer < 3) {
      gamesScore -= 30 // Zu wenig Spiele
    } else if (avgGamesPerPlayer > 6) {
      gamesScore += 15 // Viele Spiele = bessere Durchmischung
    }
    
    // GEWICHTETE BERECHNUNG (ähnlich wie tournaments.js)
    fairnessScore = Math.round(
      partnerScore * 0.40 +      // Partner-Vielfalt wichtigster Faktor
      gameBalance * 0.25 +       // Spiele-Balance
      opponentScore * 0.20 +     // Gegner-Vielfalt  
      courtRatioScore * 0.10 +   // Court-Ratio
      gamesScore * 0.05          // Spiele pro Person
    )
    
    // REALISTISCHE ANPASSUNGEN für Americano
    if (playerCount > courts * 6) {
      fairnessScore -= 15 // Zu viele Spieler für Courts
    }
    
    if (rounds < 6) {
      fairnessScore -= 10 // Zu wenig Runden
    }
    
    // Bonus für optimale Größen
    if (playerCount >= 8 && playerCount <= 20 && courts >= 2) {
      fairnessScore += 5
    }
    
    // Begrenze auf realistischen Bereich für Americano
    fairnessScore = Math.max(10, Math.min(85, fairnessScore))
    
    // Status bestimmen (angepasst an realistische Americano-Werte)
    let status, message, color, icon
    if (fairnessScore >= 70) {
      status = 'excellent'
      message = 'Sehr gute Fairness - empfohlen für optimalen Spielspaß'
      color = 'green'
      icon = '🎯'
    } else if (fairnessScore >= 60) {
      status = 'good'
      message = 'Gute Fairness - funktioniert gut für Americano'
      color = 'blue'
      icon = '👍'
    } else if (fairnessScore >= 50) {
      status = 'acceptable'
      message = 'Akzeptable Fairness - mit kleineren Kompromissen'
      color = 'yellow'
      icon = '⚠️'
    } else if (fairnessScore >= 40) {
      status = 'poor'
      message = 'Mäßige Fairness - kann zu Unzufriedenheit führen'
      color = 'orange'
      icon = '📉'
    } else {
      status = 'terrible'
      message = 'Schlechte Fairness - nicht empfohlen für Americano'
      color = 'red'
      icon = '❌'
    }
    
    // FIXED: Immer vollständiges Objekt zurückgeben
    return {
      score: fairnessScore,
      status,
      message,
      color,
      icon,
      factors: {
        gameBalance: Math.round(gameBalance) || 0,
        partnerVariety: Math.round(partnerScore) || 0,
        opponentVariety: Math.round(opponentScore) || 0,
        restFairness: Math.round(courtRatioScore) || 0
      },
      restingPlayersPerRound: restingPlayersPerRound || 0,
      recommendations: generateRecommendations(fairnessScore, playerCount, courts, rounds) || []
    }
    
  } catch (error) {
    // removed console.error
    
    // FIXED: Robuster Fallback bei Fehlern
    return {
      score: 30,
      status: 'poor',
      message: 'Fairness konnte nicht berechnet werden',
      color: 'orange',
      icon: '⚠️',
      factors: {
        gameBalance: 30,
        partnerVariety: 30,
        opponentVariety: 30,
        restFairness: 30
      },
      restingPlayersPerRound: 0,
      recommendations: ['🔧 Konfiguration prüfen']
    }
  }
}

// ERSETZE auch generateRecommendations für mehr Robustheit:
const generateRecommendations = (fairnessScore, playerCount, courts, rounds) => {
  try {
    const recommendations = []
    
    // Sichere Validierung der Parameter
    if (!fairnessScore || !playerCount || !courts || !rounds) {
      return ['🔧 Parameter prüfen']
    }
    
    if (fairnessScore < 50) {
      recommendations.push("🔧 Weniger Spieler für bessere Durchmischung")
    }
    
    if (fairnessScore < 60 && rounds < 8) {
      recommendations.push("🔄 Mehr Runden für bessere Fairness")
    }
    
    if (playerCount > courts * 6) {
      recommendations.push("🏟️ Mehr Plätze oder weniger Spieler")
    }
    
    if (fairnessScore < 55 && courts < 3) {
      recommendations.push("🏟️ Mehr Courts für bessere Rotation")
    }
    
    return recommendations
    
  } catch (error) {
    // removed console.error
    return ['🔧 Konfiguration prüfen']
  }
}


const calculateOptimalPlayers = (courts, rounds) => {
  const playersPerRound = courts * 4
  
  // Finde optimale Anzahl mit bester Fairness
  let optimalPlayers = playersPerRound
  let maxReasonable = playersPerRound
  let bestScore = 0
  
  // Teste verschiedene Spielerzahlen
  for (let players = 4; players <= 32; players += 2) {
    const fairness = calculateFairnessScore(players, courts, rounds, 15)
    
    if (fairness.score > bestScore && fairness.score >= 60) {
      optimalPlayers = players
      bestScore = fairness.score
    }
    
    if (fairness.score >= 50) {
      maxReasonable = players
    }
  }
  
  // Fallback: Mindestens 4 mehr als Courts*4 für Rotation
  const minRecommended = playersPerRound + Math.min(courts, 4)
  
  return {
    optimal: Math.max(optimalPlayers, minRecommended),
    maxReasonable: Math.max(maxReasonable, minRecommended),
    absoluteMax: maxReasonable + 4
  }
}

// ============ MAIN COMPONENT ============

export const EventForm = ({ 
  editingEvent, 
  onSubmit, 
  onCancel,
  initialData,
  calculateTotalMinutes,
  calculateMaxPlayers
}) => {
  const t = useTranslation()?.t || ((key) => key)

  // Wizard Steps
  const steps = [
    { id: 1, name: t('form.steps.basics'), icon: Info, color: 'blue' },
    { id: 2, name: t('form.steps.timeLocation'), icon: Calendar, color: 'green' },
    { id: 3, name: t('form.steps.playMode'), icon: Settings, color: 'purple' },
    { id: 4, name: t('form.steps.players'), icon: Users, color: 'orange' },
    { id: 5, name: t('form.steps.details'), icon: Check, color: 'gray' }
  ]

 const [currentStep, setCurrentStep] = useState(1)
const [showValidationErrors, setShowValidationErrors] = useState(false)
const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Quick Templates
  const templates = {
    americano: {
      name: 'Americano',
      startTime: '09:00',
      endTime: '13:00',
      courts: 4,
      maxPlayers: 24,
      roundDuration: 12,
      spielmodus: 'garantie',
      garantieSpiele: true,
      mindestSpiele: 4,
      eventInfo: ''
    },
    tournament: {
      name: t('form.tournament'),
      startTime: '09:00',
      endTime: '18:00',
      courts: 4,
      maxPlayers: 32,
      roundDuration: 15,
      spielmodus: 'garantie',
      garantieSpiele: true,
      mindestSpiele: 5,
      eventInfo: ''
    },
    league: {
      name: t('form.league'),
      startTime: '09:00',
      endTime: '18:00',
      courts: 4,
      maxPlayers: 32,
      roundDuration: 15,
      spielmodus: 'garantie',
      garantieMinuten: true,
      mindestMinuten: 90,
      breaks: [
        { startTime: '12:00', duration: 60, name: t('form.lunchBreak') },
        { startTime: '15:00', duration: 15, name: t('form.coffeBreak') }
      ],
      eventInfo: ''
    }
  }

  // Sichere Standardwerte
  const getDefaultFormData = () => ({
    name: '',
    sport: 'padel',
    eventType: 'americano',
    genderMode: 'open',
    format: 'doubles',
    date: new Date().toLocaleDateString('en-CA'),
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

  // Numerische Input Handler
  const handleNumericInput = (fieldName, value, min = 1, max = 100, defaultValue = 1) => {
    if (value === '') {
      updateFormData({ [fieldName]: '' })
      return
    }
    
    if (!/^\d*$/.test(value)) return
    
    const numValue = parseInt(value)
    if (!isNaN(numValue) && numValue >= 0 && numValue <= max) {
      updateFormData({ [fieldName]: numValue })
    }
  }

  // Template anwenden
  const applyTemplate = (templateKey) => {
    const template = templates[templateKey]
    updateFormData(template)
    setSelectedTemplate(templateKey)
  }

  // Event-Info generieren
  const generateEventInfo = () => {
    const infos = []
    
    if (formData.entryFee && formData.entryFee > 0) {
      infos.push(`${t('form.entryFee')}: ${formData.entryFee}€`)
    }
    
    if (formData.registrationDeadline) {
      const deadline = new Date(formData.registrationDeadline)
      infos.push(`${t('form.registrationDeadline')}: ${deadline.toLocaleString()}`)
    }
    
    if (formData.garantieSpiele && formData.mindestSpiele) {
      infos.push(`${t('form.minGamesPerPlayer')}: ${formData.mindestSpiele}`)
    } else if (formData.garantieMinuten && formData.mindestMinuten) {
      infos.push(`${t('form.minPlayTime')}: ${formData.mindestMinuten} ${t('form.min')}`)
    }
    
    if (formData.breaks && formData.breaks.length > 0) {
      formData.breaks.forEach(breakItem => {
        infos.push(`${breakItem.name}: ${breakItem.startTime} (${breakItem.duration} ${t('form.min')})`)
      })
    }
    
    return infos.join('\n')
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

  // Live-Berechnungen
  useEffect(() => {
    if (formData.startTime && formData.endTime && formData.courts && formData.roundDuration) {
      const totalMinutes = calculateTotalMinutes(formData.startTime, formData.endTime, formData.breaks)
      const breakMinutes = formData.breaks.reduce((sum, b) => sum + (b.duration || 0), 0)
      const nettoMinutes = totalMinutes - breakMinutes
      const possibleRounds = Math.floor(nettoMinutes / formData.roundDuration)
      
      const playersPerRound = formData.courts * 4
      const waitingPlayers = formData.courts >= 2 ? Math.min(formData.courts, 4) : 0
      const recommendedPlayers = playersPerRound + waitingPlayers
      
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

  // Auto-Update maxPlayers
  useEffect(() => {
    if (!editingEvent) {
      updateFormData({ maxPlayers: liveCalculations.recommendedPlayers })
    }
  }, [liveCalculations.recommendedPlayers])

  // Update eventInfo
  useEffect(() => {
    const newEventInfo = generateEventInfo()
    if (newEventInfo !== formData.eventInfo) {
      updateFormData({ eventInfo: newEventInfo })
    }
  }, [formData.entryFee, formData.registrationDeadline, formData.garantieSpiele, formData.mindestSpiele, formData.garantieMinuten, formData.mindestMinuten, formData.breaks])

  // Auto-Format bei Americano
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

 const handleSubmit = async (e) => {
  // SOFORT preventDefault und Mehrfach-Check
  if (e) {
    e.preventDefault()
    e.stopPropagation()
  }
  
  if (isSubmitting) {
    // removed console.log
    return
  }
  
  // removed console.log
  setIsSubmitting(true)
  
  try {
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
    
    if (!isValid) {
      setIsSubmitting(false)
      return
    }
    
    // Fairness check before submit
    const fairnessCheck = calculateFairnessScore(
      formData.maxPlayers,
      formData.courts,
      liveCalculations.possibleRounds,
      formData.roundDuration
    )
    
    if (fairnessCheck.score < 60) {
      const proceed = window.confirm(
        `⚠️ Fairness-Warnung:\n\n` +
        `${fairnessCheck.message} (${fairnessCheck.score}% Fairness)\n\n` +
        `Dies kann zu unausgewogenen Spielerfahrungen führen.\n\n` +
        `Möchten Sie trotzdem fortfahren?`
      )
      if (!proceed) {
        setIsSubmitting(false)
        return
      }
    }
    
    if (formData.maxPlayers > liveCalculations.maxPossiblePlayers) {
      const proceed = window.confirm(
        t('form.guaranteeWarning').replace('{players}', formData.maxPlayers) + '\n' +
        t('form.recommendedMax') + ': ' + liveCalculations.maxPossiblePlayers + '\n\n' +
        t('form.proceedAnyway')
      )
      if (!proceed) {
        setIsSubmitting(false)
        return
      }
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
    }
    
    delete submitData.entryFee
    
    // removed console.log
    await onSubmit(submitData)
    // removed console.log
    
  } catch (error) {
    // removed console.error
    alert('Fehler beim Erstellen des Events. Bitte versuchen Sie es erneut.')
  } finally {
    setIsSubmitting(false)
  }
}

  // Pausen-Management
  const addBreak = () => {
    updateFormData({
      breaks: [...formData.breaks, { startTime: '', duration: 30, name: t('form.pauseName') }]
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
            {editingEvent ? t('form.editEvent') : t('form.createEvent')}
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
                    {t('form.quickTemplates')}
                  </h4>
                  <p className="text-sm text-gray-600 mb-4">
                    {t('form.selectTemplate')}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {Object.entries(templates).map(([key, template]) => {
                      const icons = {
                        americano: '🏆',
                        tournament: '🎯',
                        league: '📊'
                      }
                      const descriptions = {
                        americano: t('form.americanoDesc'),
                        tournament: t('form.tournamentDesc'),
                        league: t('form.leagueDesc')
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
                          <div className="font-medium text-sm">{t(`form.${key}`)}</div>
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
                    {t('form.eventBasics')}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block mb-1 font-medium">
                        {t('form.eventName')} *
                        {showValidationErrors && !formData.name.trim() && (
                          <span className="text-red-500 text-sm ml-2">{t('form.required')}</span>
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
                        {t('form.sport')}
                        <Tooltip text={t('form.selectSportTooltip')}>
                          <Info className="w-4 h-4 text-gray-400" />
                        </Tooltip>
                      </label>
                      <select
                        value={formData.sport || 'padel'}
                        onChange={(e) => updateFormData({ sport: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="padel">{t('sports.padel')}</option>
                        <option value="pickleball">{t('sports.pickleball')}</option>
                        <option value="spinxball">{t('sports.spinxball')}</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block mb-1 font-medium flex items-center gap-2">
                        {t('form.eventType')}
                        <Tooltip text={t('form.americanoTooltip')}>
                          <Info className="w-4 h-4 text-gray-400" />
                        </Tooltip>
                      </label>
                      <select
                        value={formData.eventType || 'americano'}
                        onChange={(e) => updateFormData({ eventType: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="americano">{t('eventTypes.americano')}</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block mb-1 font-medium">{t('form.genderMode')}</label>
                      <select
                        value={formData.genderMode || 'open'}
                        onChange={(e) => updateFormData({ genderMode: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="open">{t('form.mixed')}</option>
                        <option value="men">{t('form.menOnly')}</option>
                        <option value="women">{t('form.womenOnly')}</option>
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
                    {t('form.when')}
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <label className="block mb-1 font-medium">
                        {t('form.date')} *
                        {showValidationErrors && !formData.date && (
                          <span className="text-red-500 text-sm ml-2">{t('form.required')}</span>
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
                        {t('form.startTime')} *
                        {showValidationErrors && !formData.startTime && (
                          <span className="text-red-500 text-sm ml-2">{t('form.required')}</span>
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
                        {t('form.endTime')} *
                        {showValidationErrors && !formData.endTime && (
                          <span className="text-red-500 text-sm ml-2">{t('form.required')}</span>
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
                        {t('form.numberOfCourts')} *
                        <Tooltip text={t('form.courtsTooltip')}>
                          <Info className="w-4 h-4 text-gray-400" />
                        </Tooltip>
                      </label>
                      <input
                        type="number"
                        value={formData.courts === '' ? '' : (formData.courts || 2)}
                        onChange={(e) => handleNumericInput('courts', e.target.value, 1, 10, 2)}
                        onBlur={(e) => {
                          if (e.target.value === '' || parseInt(e.target.value) < 1) {
                            updateFormData({ courts: 2 })
                          }
                        }}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                        min="1"
                        max="10"
                        placeholder="2"
                        inputMode="numeric"
                        pattern="[0-9]*"
                      />
                    </div>
                  </div>
                  
                  {/* Live-Berechnung */}
                  <div className="mt-6 p-4 bg-white rounded-lg border border-green-200">
                    <h4 className="font-medium mb-3 text-green-900">{t('form.timeOverview')}</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div className="text-center">
                        <Clock className="w-8 h-8 mx-auto mb-1 text-green-600" />
                        <span className="text-gray-600 block">{t('form.totalTime')}</span>
                        <p className="font-bold text-lg">{liveCalculations.totalMinutes} {t('form.min')}</p>
                      </div>
                      <div className="text-center">
                        <Coffee className="w-8 h-8 mx-auto mb-1 text-orange-600" />
                        <span className="text-gray-600 block">{t('form.breaks')}</span>
                        <p className="font-bold text-lg">{formData.breaks.reduce((sum, b) => sum + b.duration, 0)} {t('form.min')}</p>
                      </div>
                      <div className="text-center">
                        <Zap className="w-8 h-8 mx-auto mb-1 text-blue-600" />
                        <span className="text-gray-600 block">{t('form.netPlayTime')}</span>
                        <p className="font-bold text-lg">{liveCalculations.nettoMinutes} {t('form.min')}</p>
                      </div>
                      <div className="text-center">
                        <Trophy className="w-8 h-8 mx-auto mb-1 text-purple-600" />
                        <span className="text-gray-600 block">{t('form.possibleRounds')}</span>
                        <p className="font-bold text-lg">{liveCalculations.possibleRounds}</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Location */}
                  <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block mb-1 font-medium">{t('form.location')}</label>
                      <input
                        type="text"
                        value={formData.location || ''}
                        onChange={(e) => updateFormData({ location: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                        placeholder="z.B. Padel Club München"
                      />
                    </div>
                    
                    <div>
                      <label className="block mb-1 font-medium">{t('form.contactPhone')}</label>
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
                    {t('form.howToPlay')}
                  </h3>
                  
                  {/* Rundenzeit */}
                  <div className="mb-6">
                    <label className="block mb-1 font-medium flex items-center gap-2">
                      {t('form.roundDuration')} *
                      <Tooltip text={t('form.roundDurationTooltip')}>
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
                        value={formData.roundDuration === '' ? '' : (formData.roundDuration || 15)}
                        onChange={(e) => handleNumericInput('roundDuration', e.target.value, 5, 60, 15)}
                        onBlur={(e) => {
                          if (e.target.value === '' || parseInt(e.target.value) < 5) {
                            updateFormData({ roundDuration: 15 })
                          }
                        }}
                        className="w-20 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 text-center font-bold"
                        min="5"
                        max="60"
                        placeholder="15"
                        inputMode="numeric"
                        pattern="[0-9]*"
                      />
                      <span>{t('form.min')}</span>
                    </div>
                  </div>
                  
                  {/* Spielmodus Presets */}
                  <div className="mb-6">
                    <label className="block mb-3 font-medium">{t('form.playMode')}</label>
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
                        <strong className="text-lg">{t('form.relaxed')}</strong>
                        <p className="text-sm text-gray-600 mt-1">
                          {t('form.relaxedDesc')}
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
                        <strong className="text-lg">{t('form.balanced')}</strong>
                        <p className="text-sm text-gray-600 mt-1">
                          {t('form.balancedDesc')}
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
                        <strong className="text-lg">{t('form.intensive')}</strong>
                        <p className="text-sm text-gray-600 mt-1">
                          {t('form.intensiveDesc')}
                        </p>
                      </label>
                    </div>
                  </div>
                  
                  {/* Details für gewählten Modus */}
                  <details className="mt-4">
                    <summary className="cursor-pointer text-sm text-purple-700 hover:text-purple-900 font-medium">
                      ⚙️ {t('form.advancedSettings')}
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
                          <span>{t('form.guaranteeGames')}</span>
                        </label>
                        
                        {formData.garantieSpiele && (
                          <div className="ml-6 mt-2">
                            <label className="block text-sm">{t('form.minGamesPerPlayer')}</label>
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
                          <span>{t('form.guaranteeTime')}</span>
                        </label>
                        
                        {formData.garantieMinuten && (
                          <div className="ml-6 mt-2">
                            <label className="block text-sm">{t('form.minPlayTime')}</label>
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
                  
                  {/* Pausen */}
                  <div className="mt-6">
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <Coffee className="w-5 h-5 text-orange-600" />
                      {t('form.breaks')}
                    </h4>
                    
                    <div className="space-y-2">
                      {formData.breaks.map((breakItem, index) => (
                        <div key={index} className="flex items-center gap-2 bg-orange-50 p-3 rounded-lg">
                          <Coffee className="w-4 h-4 text-orange-600" />
                          <input
                            type="text"
                            value={breakItem.name || t('form.pauseName')}
                            onChange={(e) => updateBreak(index, 'name', e.target.value)}
                            className="flex-1 px-2 py-1 border rounded text-sm"
                            placeholder={t('form.pauseName')}
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
                            <option value="15">15 {t('form.min')}</option>
                            <option value="30">30 {t('form.min')}</option>
                            <option value="45">45 {t('form.min')}</option>
                            <option value="60">60 {t('form.min')}</option>
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
                        {t('form.addBreak')}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* STEP 4: Enhanced Players mit Fairness */}
            {currentStep === 4 && (
              <div className="space-y-6 animate-in">
                <div className="bg-orange-50 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold mb-4 text-orange-900 flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    {t('form.maxPlayers')} mit Fairness-Bewertung
                  </h3>
                  
                  {/* FAIRNESS FEEDBACK - NEUES FEATURE! */}
                  {(() => {
                    const fairnessData = calculateFairnessScore(
                      formData.maxPlayers || 16,
                      formData.courts || 2,
                      liveCalculations.possibleRounds || 8,
                      formData.roundDuration || 15
                    )
                    const optimalPlayers = calculateOptimalPlayers(
                      formData.courts || 2,
                      liveCalculations.possibleRounds || 8
                    )
                    
                    return (
                      <div className={`p-4 rounded-lg border-2 mb-6 ${
                        fairnessData.color === 'green' ? 'bg-green-50 border-green-200' :
                        fairnessData.color === 'blue' ? 'bg-blue-50 border-blue-200' :
                        fairnessData.color === 'yellow' ? 'bg-yellow-50 border-yellow-200' :
                        fairnessData.color === 'orange' ? 'bg-orange-50 border-orange-200' :
                        'bg-red-50 border-red-200'
                      }`}>
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">{fairnessData.icon}</span>
                            <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                              <Target className="w-4 h-4" />
                              Americano Fairness-Bewertung
                            </h4>
                          </div>
                          <div className={`px-3 py-1 rounded-full text-sm font-bold ${
                            fairnessData.color === 'green' ? 'bg-green-600 text-white' :
                            fairnessData.color === 'blue' ? 'bg-blue-600 text-white' :
                            fairnessData.color === 'yellow' ? 'bg-yellow-600 text-white' :
                            fairnessData.color === 'orange' ? 'bg-orange-600 text-white' :
                            'bg-red-600 text-white'
                          }`}>
                            {fairnessData.score}% Fairness
                          </div>
                        </div>
                        
                        <p className={`text-sm mb-3 ${
                          fairnessData.color === 'green' ? 'text-green-700' :
                          fairnessData.color === 'blue' ? 'text-blue-700' :
                          fairnessData.color === 'yellow' ? 'text-yellow-700' :
                          fairnessData.color === 'orange' ? 'text-orange-700' :
                          'text-red-700'
                        }`}>
                          {fairnessData.message}
                        </p>
                        
                        {/* Kritische Warnung bei sehr schlechter Fairness */}
                        {fairnessData.score < 45 && (
                          <div className="p-3 bg-red-100 border border-red-300 rounded-lg mb-3">
                            <div className="flex items-center gap-2 text-red-800">
                              <AlertCircle className="w-5 h-5" />
                              <strong>Kritische Fairness-Warnung</strong>
                            </div>
                            <p className="text-sm text-red-700 mt-1">
                              Diese Konfiguration führt zu sehr unausgewogenem Spielspaß. 
                              Die meisten Spieler werden sich über unfaire Verteilung beschweren.
                            </p>
                          </div>
                        )}
                        
                        {/* Wartende Spieler Info */}
                        {fairnessData.restingPlayersPerRound > 0 && (
                          <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                            <Info className="w-4 h-4" />
                            <span>
                              Pro Runde pausieren {fairnessData.restingPlayersPerRound} Spieler
                              ({Math.round((fairnessData.restingPlayersPerRound / (formData.maxPlayers || 16)) * 100)}% Ausfallzeit)
                            </span>
                          </div>
                        )}
                        
                        {/* Fairness-Details Expandable */}
                        <details className="group">
                          <summary className="cursor-pointer text-sm font-medium text-gray-600 hover:text-gray-800 flex items-center gap-1">
                            <span className="group-open:rotate-90 transition-transform">▶</span>
                            Detaillierte Fairness-Analyse
                          </summary>
                          <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
                            <div className="space-y-2">
                              <div className="flex justify-between">
                                <span>Spiel-Balance:</span>
                                <span className={`font-medium ${fairnessData.factors.gameBalance >= 70 ? 'text-green-600' : 'text-red-600'}`}>
                                  {fairnessData.factors.gameBalance}%
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span>Partner-Vielfalt:</span>
                                <span className={`font-medium ${fairnessData.factors.partnerVariety >= 70 ? 'text-green-600' : 'text-red-600'}`}>
                                  {fairnessData.factors.partnerVariety}%
                                </span>
                              </div>
                            </div>
                            <div className="space-y-2">
                              <div className="flex justify-between">
                                <span>Gegner-Vielfalt:</span>
                                <span className={`font-medium ${fairnessData.factors.opponentVariety >= 70 ? 'text-green-600' : 'text-red-600'}`}>
                                  {fairnessData.factors.opponentVariety}%
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span>Pausen-Fairness:</span>
                                <span className={`font-medium ${fairnessData.factors.restFairness >= 70 ? 'text-green-600' : 'text-red-600'}`}>
                                  {fairnessData.factors.restFairness}%
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          {/* Recommendations */}
                          {fairnessData.recommendations.length > 0 && (
                            <div className="mt-3 p-2 bg-blue-50 rounded text-xs">
                              <strong className="text-blue-800">Verbesserungsvorschläge:</strong>
                              <ul className="mt-1 space-y-1">
                                {fairnessData.recommendations.map((rec, idx) => (
                                  <li key={idx} className="text-blue-700">• {rec}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </details>
                      </div>
                    )
                  })()}
                  
                  {/* Smart Recommendations */}
                  <div className="p-4 bg-white rounded-lg border border-orange-200 mb-6">
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <Star className="w-4 h-4 text-orange-600" />
                      Intelligente Empfehlungen
                    </h4>
                    
                    <div className="space-y-3">
                      {/* Optimal */}
                      {(() => {
                        const optimalPlayers = calculateOptimalPlayers(
                          formData.courts || 2,
                          liveCalculations.possibleRounds || 8
                        )
                        
                        return (
                          <>
                            <div className="flex items-center justify-between p-3 bg-green-50 rounded">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-green-600 text-white rounded-full flex items-center justify-center font-bold">
                                  {optimalPlayers.optimal}
                                </div>
                                <div>
                                  <strong className="text-green-700 flex items-center gap-1">
                                    <Trophy className="w-4 h-4" />
                                    Optimal für besten Spielspaß
                                  </strong>
                                  <p className="text-sm text-gray-600">Maximale Fairness und Durchmischung</p>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => updateFormData({ maxPlayers: optimalPlayers.optimal })}
                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-1"
                              >
                                <Check className="w-4 h-4" />
                                Übernehmen
                              </button>
                            </div>
                            
                            {/* Maximum mit akzeptabler Fairness */}
                            {optimalPlayers.maxReasonable > optimalPlayers.optimal && (
                              <div className="flex items-center justify-between p-3 bg-blue-50 rounded">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                                    {optimalPlayers.maxReasonable}
                                  </div>
                                  <div>
                                    <strong className="text-blue-700 flex items-center gap-1">
                                      <TrendingUp className="w-4 h-4" />
                                      Maximum mit guter Fairness
                                    </strong>
                                    <p className="text-sm text-gray-600">Akzeptable Balance zwischen Teilnehmern und Fairness</p>
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => updateFormData({ maxPlayers: optimalPlayers.maxReasonable })}
                                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-1"
                                >
                                  <Check className="w-4 h-4" />
                                  Übernehmen
                                </button>
                              </div>
                            )}
                          </>
                        )
                      })()}
                    </div>
                  </div>
                  
                  {/* Manual Input mit Live-Feedback */}
                  <div>
                    <label className="block mb-2 font-medium">
                      {t('form.maxPlayers')} *
                      {showValidationErrors && formData.maxPlayers < 4 && (
                        <span className="text-red-500 text-sm ml-2">{t('form.atLeast4Players')}</span>
                      )}
                    </label>
                    <div className="flex items-center gap-4">
                      <input
                        type="range"
                        value={formData.maxPlayers || liveCalculations.recommendedPlayers}
                        onChange={(e) => updateFormData({ maxPlayers: parseInt(e.target.value) })}
                        className="flex-1"
                        min="4"
                        max="40"
                        step="2"
                      />
                      <input
                        type="number"
                        value={formData.maxPlayers === '' ? '' : (formData.maxPlayers || liveCalculations.recommendedPlayers)}
                        onChange={(e) => handleNumericInput('maxPlayers', e.target.value, 4, 100, 16)}
                        onBlur={(e) => {
                          if (e.target.value === '' || parseInt(e.target.value) < 4) {
                            updateFormData({ maxPlayers: liveCalculations.recommendedPlayers || 16 })
                          }
                        }}
                        className={`
                          w-20 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 text-center font-bold text-lg
                          ${(() => {
                            const fairness = calculateFairnessScore(formData.maxPlayers || 16, formData.courts || 2, liveCalculations.possibleRounds || 8)
                            return fairness.score < 60 ? 'border-red-500 bg-red-50' : 
                                   fairness.score < 75 ? 'border-yellow-500 bg-yellow-50' : 
                                   'border-green-500 bg-green-50'
                          })()}
                        `}
                        min="4"
                        max="100"
                        step="2"
                        placeholder="16"
                        inputMode="numeric"
                        pattern="[0-9]*"
                      />
                      <span>{t('player.players')}</span>
                    </div>
                  </div>
                  
                  {/* Live Preview Stats */}
                  <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <Info className="w-4 h-4 text-blue-600" />
                      Vorschau mit {formData.maxPlayers} Spielern:
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                      <div>
                        <span className="text-gray-600">Spiele/Person:</span>
                        <p className="font-bold text-lg">{liveCalculations.minGamesPerPlayer}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Spielzeit/Person:</span>
                        <p className="font-bold text-lg">{liveCalculations.minMinutesPerPlayer} {t('form.min')}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Pausenzeit:</span>
                        <p className="font-bold text-lg">
                          {Math.max(0, liveCalculations.nettoMinutes - liveCalculations.minMinutesPerPlayer)} {t('form.min')}
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
                    {t('form.additionalInfo')}
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block mb-1 font-medium">{t('form.eventDescription')}</label>
                      <textarea
                        value={formData.eventInfo || ''}
                        onChange={(e) => updateFormData({ eventInfo: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-gray-500"
                        rows="4"
                        placeholder={t('form.eventDescriptionPlaceholder')}
                      />
                    </div>
                    
                    {/* Öffentlichkeit & Anmeldung */}
                    <div className="p-4 bg-white rounded-lg border">
                      <h4 className="font-medium mb-3">{t('form.visibility')}</h4>
                      
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
                            <span className="font-medium">{t('form.makePublic')}</span>
                            <p className="text-sm text-gray-600">{t('form.publicDesc')}</p>
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
                                <span className="font-medium">{t('form.enableRegistration')}</span>
                                <p className="text-sm text-gray-600">{t('form.registrationDesc')}</p>
                              </div>
                            </label>
                            
                            {formData.registrationOpen && (
                              <div className="ml-7 grid grid-cols-1 md:grid-cols-2 gap-4 p-3 bg-gray-50 rounded">
                                <div>
                                  <label className="block text-sm font-medium mb-1">{t('form.registrationDeadline')}</label>
                                  <input
                                    type="datetime-local"
                                    value={formData.registrationDeadline || ''}
                                    onChange={(e) => updateFormData({ registrationDeadline: e.target.value })}
                                    className="w-full px-2 py-1 border rounded text-sm"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium mb-1">{t('form.entryFee')}</label>
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
                
                {/* Final Summary mit Fairness */}
                <div className="bg-blue-100 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold mb-4 text-blue-900 flex items-center gap-2">
                    <Trophy className="w-5 h-5" />
                    {t('form.summary')}
                  </h3>
                  
                  {/* Fairness Summary */}
                  {(() => {
                    const finalFairness = calculateFairnessScore(
                      formData.maxPlayers || 16,
                      formData.courts || 2,
                      liveCalculations.possibleRounds || 8,
                      formData.roundDuration || 15
                    )
                    
                    return (
                      <div className={`p-3 rounded-lg mb-4 ${
                        finalFairness.color === 'green' ? 'bg-green-100 border border-green-300' :
                        finalFairness.color === 'blue' ? 'bg-blue-100 border border-blue-300' :
                        finalFairness.color === 'yellow' ? 'bg-yellow-100 border border-yellow-300' :
                        'bg-red-100 border border-red-300'
                      }`}>
                        <div className="flex items-center justify-between">
                          <span className="font-medium">Finale Fairness-Bewertung:</span>
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{finalFairness.icon}</span>
                            <span className="font-bold">{finalFairness.score}%</span>
                          </div>
                        </div>
                        <p className="text-sm mt-1">{finalFairness.message}</p>
                      </div>
                    )
                  })()}
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="bg-white p-3 rounded">
                      <span className="text-sm text-gray-600">{t('event.title')}</span>
                      <p className="font-semibold">{formData.name || t('form.noName')}</p>
                    </div>
                    <div className="bg-white p-3 rounded">
                      <span className="text-sm text-gray-600">{t('form.date')} & {t('form.time')}</span>
                      <p className="font-semibold">
                        {formData.date ? new Date(formData.date).toLocaleDateString('de-DE') : t('form.noDate')}
                        <br />
                        {formData.startTime} - {formData.endTime}
                      </p>
                    </div>
                    <div className="bg-white p-3 rounded">
                      <span className="text-sm text-gray-600">{t('form.location')}</span>
                      <p className="font-semibold">{formData.location || t('form.notSpecified')}</p>
                    </div>
                    <div className="bg-white p-3 rounded">
                      <span className="text-sm text-gray-600">{t('form.numberOfCourts')}</span>
                      <p className="font-semibold">{formData.courts}</p>
                    </div>
                    <div className="bg-white p-3 rounded">
                      <span className="text-sm text-gray-600">{t('event.maxPlayers')}</span>
                      <p className="font-semibold">{formData.maxPlayers}</p>
                    </div>
                    <div className="bg-white p-3 rounded">
                      <span className="text-sm text-gray-600">{t('form.playMode')}</span>
                      <p className="font-semibold">
                        {formData.spielmodus === 'garantie' ? 
                          (formData.garantieSpiele ? `${t('form.min')}. ${formData.mindestSpiele} ${t('tournament.games')}` : `${t('form.min')}. ${formData.mindestMinuten} ${t('form.min')}.`) : 
                          t('form.relaxed')
                        }
                      </p>
                    </div>
                    <div className="bg-white p-3 rounded">
                      <span className="text-sm text-gray-600">{t('form.roundDuration')}</span>
                      <p className="font-semibold">{formData.roundDuration} {t('form.min')}</p>
                    </div>
                    <div className="bg-white p-3 rounded">
                      <span className="text-sm text-gray-600">{t('form.playTimePerPerson')}</span>
                      <p className="font-semibold">~{liveCalculations.minMinutesPerPlayer} {t('form.min')}</p>
                    </div>
                    <div className="bg-white p-3 rounded">
                      <span className="text-sm text-gray-600">Status</span>
                      <p className="font-semibold">
                        {formData.isPublic ? t('form.public') : t('form.private')}
                        {formData.registrationOpen && ` • ${t('form.registrationOpen')}`}
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
            {t('navigation.cancel')}
          </button>
          
          <div className="flex gap-3">
            {currentStep > 1 && (
              <button
                type="button"
                onClick={prevStep}
                className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 flex items-center gap-2"
              >
                <ChevronLeft className="w-4 h-4" />
                {t('navigation.back')}
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
                {t('navigation.next')}
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
  type="button"
  onClick={handleSubmit}
  disabled={isSubmitting}
  className={`
    px-6 py-2 rounded-lg flex items-center gap-2
    ${isSubmitting 
      ? 'bg-gray-400 text-gray-600 cursor-not-allowed' 
      : 'bg-green-600 text-white hover:bg-green-700'
    }
  `}
>
  {isSubmitting ? (
    <>
      <div className="w-4 h-4 border-2 border-gray-600 border-t-transparent rounded-full animate-spin"></div>
      {editingEvent ? 'Speichere...' : 'Erstelle Event...'}
    </>
  ) : (
    <>
      <Check className="w-4 h-4" />
      {editingEvent ? t('form.saveChanges') : t('event.create')}
    </>
  )}
</button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

