import { useState, useEffect } from 'react'
import { dbOperations } from '../lib/supabase'
import { transformFromDB, transformToDB } from '../utils/dbHelpers'

// Helper-Funktionen für Level-Konvertierung
const getPadelNumericValue = (level) => {
  const mapping = {
    'C': 2.0,
    'B-': 3.25,
    'B': 3.75,
    'B+': 4.25,
    'A-': 4.75,
    'A': 5.5
  }
  return mapping[level] || 3.75
}

const getPadelLevelDescription = (level) => {
  const descriptions = {
    'C': 'Anfänger',
    'B-': 'Fortgeschrittener Anfänger',
    'B': 'Unteres Mittelstufe',
    'B+': 'Gutes Mittelstufe',
    'A-': 'Oberes Mittelstufe',
    'A': 'Fortgeschritten/Profi'
  }
  return descriptions[level] || ''
}

// Helper-Funktion für Flaggen-Emoji
const getFlagEmoji = (countryCode) => {
  const flags = {
    'DE': '🇩🇪', 'ES': '🇪🇸', 'FR': '🇫🇷', 'IT': '🇮🇹', 'US': '🇺🇸',
    'GB': '🇬🇧', 'AT': '🇦🇹', 'CH': '🇨🇭', 'NL': '🇳🇱', 'BE': '🇧🇪',
    'PT': '🇵🇹', 'SE': '🇸🇪', 'DK': '🇩🇰', 'NO': '🇳🇴', 'PL': '🇵🇱'
  }
  return flags[countryCode] || '🏳️'
}

// Helper-Funktion für Altersberechnung
const calculateAge = (birthday) => {
  if (!birthday) return null
  const birthDate = new Date(birthday)
  const today = new Date()
  let age = today.getFullYear() - birthDate.getFullYear()
  const monthDiff = today.getMonth() - birthDate.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--
  }
  return age
}

const PlayerDatabase = ({ onSelectPlayers, isOpen, onClose, existingPlayers = [], event }) => {
  const [players, setPlayers] = useState([])
  const [selectedPlayers, setSelectedPlayers] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingPlayer, setEditingPlayer] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    gender: 'male',
    sports: {
      padel: false,
      pickleball: false,
      spinxball: false
    },
    padelSkill: 'B',
    pickleballSkill: 3.0,
    spinxballSkill: 3.0,
    phone: '',
    email: '',
    birthday: '',
    city: '',
    country: '',
    nationality: 'DE',
    club: '',
    duprId: ''
  })

  // Load players from database
  useEffect(() => {
    if (isOpen) {
      loadPlayers()
    }
  }, [isOpen])

  const loadPlayers = async () => {
    try {
      setIsLoading(true)
      const data = await dbOperations.getPlayers()
      setPlayers(data || [])
    } catch (error) {
      console.error('Fehler beim Laden der Spieler:', error)
      alert('Fehler beim Laden der Spieler')
    } finally {
      setIsLoading(false)
    }
  }

  const handleExcelImport = async (event) => {
    const file = event.target.files[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = async (e) => {
      try {
        const { read, utils } = await import('xlsx')
        const workbook = read(e.target.result, { type: 'binary' })
        const sheetName = workbook.SheetNames[0]
        const sheet = workbook.Sheets[sheetName]
        const data = utils.sheet_to_json(sheet)

        console.log('Excel Daten gelesen:', data) // Debug-Log

        const playersToImport = data.map(row => {
          // Debug jeden Row
          console.log('Verarbeite Row:', row)
          
          const player = {
            name: row['Name'] || row['name'] || '',
            gender: (row['Geschlecht'] || row['gender'] || 'male').toLowerCase(),
            sports: {
              padel: row['Padel'] === 'x' || row['Padel'] === true || row['padel'] === true,
              pickleball: row['Pickleball'] === 'x' || row['Pickleball'] === true || row['pickleball'] === true,
              spinxball: row['SpinXball'] === 'x' || row['SpinXball'] === true || row['spinxball'] === true
            },
            padelSkill: row['Padel Level'] || row['padelSkill'] || 'B',
            pickleballSkill: parseFloat(row['Pickleball Level'] || row['pickleballSkill']) || 3.0,
            spinxballSkill: parseFloat(row['SpinXball Level'] || row['spinxballSkill']) || 3.0,
            phone: row['Telefon'] || row['phone'] || '',
            email: row['Email'] || row['email'] || '',
            birthday: row['Geburtstag'] || row['birthday'] || '',
            city: row['Stadt'] || row['city'] || '',
            country: row['Land'] || row['country'] || '',
            nationality: row['Nationalität'] || row['nationality'] || '',
            club: row['Verein'] || row['club'] || '',
            duprId: row['DUPR ID'] || row['duprId'] || ''
          }
          
          console.log('Erstellter Spieler:', player)
          return player
        }).filter(p => p.name && (p.sports.padel || p.sports.pickleball || p.sports.spinxball))

        console.log('Gefilterte Spieler zum Import:', playersToImport)

        if (playersToImport.length === 0) {
          alert('Keine gültigen Spieler in der Excel-Datei gefunden')
          return
        }

        // Lade aktuelle Spieler für Duplikat-Check
        const currentPlayers = await dbOperations.getPlayers()
        const existingNames = new Set(
          currentPlayers.map(p => p.name.toLowerCase().trim())
        )
        
        let successCount = 0
        let skipCount = 0
        let errorCount = 0
        
        for (const player of playersToImport) {
          try {
            // Prüfe auf Duplikate
            if (existingNames.has(player.name.toLowerCase().trim())) {
              console.log(`Überspringe ${player.name} - bereits vorhanden`)
              skipCount++
              continue
            }
            
            console.log('Importiere Spieler:', player.name)
            const result = await dbOperations.createPlayer(player)
            console.log('Import Ergebnis:', result)
            if (result) {
              successCount++
              // Füge zur Liste hinzu für weitere Duplikat-Checks
              existingNames.add(player.name.toLowerCase().trim())
            } else {
              errorCount++
              console.error(`Fehler beim Import von ${player.name}: Kein Ergebnis`)
            }
          } catch (error) {
            errorCount++
            console.error(`Fehler beim Import von ${player.name}:`, error)
          }
        }

        let message = `Import abgeschlossen:\n`
        message += `✅ ${successCount} neue Spieler importiert`
        if (skipCount > 0) message += `\n⏭️ ${skipCount} übersprungen (bereits vorhanden)`
        if (errorCount > 0) message += `\n❌ ${errorCount} Fehler`
        
        console.log(message)
        alert(message)
        await loadPlayers()
      } catch (error) {
        console.error('Excel Import Fehler:', error)
        alert('Fehler beim Lesen der Excel-Datei')
      }
    }
    reader.readAsBinaryString(file)
  }

  // Prüft ob ein Spieler bereits im Event angemeldet ist
  const isPlayerAlreadyRegistered = (player) => {
    return existingPlayers.some(ep => 
      ep.name.toLowerCase() === player.name.toLowerCase()
    )
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Validiere dass mindestens eine Sportart ausgewählt ist
    if (!formData.sports.padel && !formData.sports.pickleball && !formData.sports.spinxball) {
      alert('Bitte wählen Sie mindestens eine Sportart aus')
      return
    }
    
    try {
      if (editingPlayer) {
        // Update existing player
        const updatedPlayer = {
          ...editingPlayer,
          ...formData
        }
        await dbOperations.updatePlayer(editingPlayer.id, updatedPlayer)
      } else {
        // Prüfe auf Duplikate vor dem Erstellen
        const existingPlayers = players.filter(p => 
          p.name.toLowerCase().trim() === formData.name.toLowerCase().trim()
        )
        
        if (existingPlayers.length > 0) {
          const confirm = window.confirm(
            `Ein Spieler namens "${formData.name}" existiert bereits.\n\n` +
            `Möchten Sie trotzdem fortfahren?`
          )
          if (!confirm) {
            return
          }
        }
        
        // Create new player
        await dbOperations.createPlayer(formData)
      }
      
      // Reload players
      await loadPlayers()
      
      // Reset form
      setShowAddForm(false)
      setEditingPlayer(null)
      setFormData({
        name: '',
        gender: 'male',
        sports: {
          padel: false,
          pickleball: false,
          spinxball: false
        },
        padelSkill: 'B',
        pickleballSkill: 3.0,
        spinxballSkill: 3.0,
        phone: '',
        email: '',
        birthday: '',
        city: '',
        country: '',
        nationality: 'DE',
        club: '',
        duprId: ''
      })
    } catch (error) {
      console.error('Fehler beim Speichern:', error)
      alert('Fehler beim Speichern des Spielers')
    }
  }

  const handleEdit = (player) => {
    setEditingPlayer(player)
    setFormData({
      name: player.name || '',
      gender: player.gender || 'male',
      sports: player.sports || {
        padel: false,
        pickleball: false,
        spinxball: false
      },
      padelSkill: player.padelSkill || 'B',
      pickleballSkill: player.pickleballSkill || 3.0,
      spinxballSkill: player.spinxballSkill || 3.0,
      phone: player.phone || '',
      email: player.email || '',
      birthday: player.birthday || '',
      city: player.city || '',
      country: player.country || '',
      nationality: player.nationality || 'DE',
      club: player.club || '',
      duprId: player.duprId || ''
    })
    setShowAddForm(true)
  }

  const handleDelete = async (playerId) => {
    if (!window.confirm('Möchten Sie diesen Spieler wirklich löschen?')) {
      return
    }
    
    try {
      await dbOperations.deletePlayer(playerId)
      await loadPlayers()
    } catch (error) {
      console.error('Fehler beim Löschen:', error)
      alert('Fehler beim Löschen des Spielers')
    }
  }

  const togglePlayerSelection = (playerId) => {
    const player = players.find(p => p.id === playerId)
    
    // Prüfe ob Spieler bereits angemeldet ist
    if (isPlayerAlreadyRegistered(player)) {
      alert(`${player.name} ist bereits für dieses Event angemeldet.`)
      return
    }
    
    setSelectedPlayers(prev => 
      prev.includes(playerId) 
        ? prev.filter(id => id !== playerId)
        : [...prev, playerId]
    )
  }

  const handleSelectAll = () => {
    // Filtere nur die Spieler, die noch nicht angemeldet sind
    const availablePlayers = filteredPlayers.filter(p => !isPlayerAlreadyRegistered(p))
    
    if (selectedPlayers.length === availablePlayers.length) {
      setSelectedPlayers([])
    } else {
      setSelectedPlayers(availablePlayers.map(p => p.id))
    }
  }

  const handleImport = () => {
    const playersToImport = players.filter(p => selectedPlayers.includes(p.id))
    onSelectPlayers(playersToImport)
    onClose()
    setSelectedPlayers([])
  }

  // Filter players based on search, sport and gender
  const getFilteredPlayers = () => {
    let filtered = [...players];
    
    // NEU: Filtere nach Sportart des Events
    if (event?.sport) {
      filtered = filtered.filter(player => {
        // Prüfe ob der Spieler diese Sportart spielt
        switch(event.sport) {
          case 'padel':
            return player.sports?.padel === true;
          case 'pickleball':
            return player.sports?.pickleball === true;
          case 'spinxball':
            return player.sports?.spinxball === true;
          default:
            return true;
        }
      });
    }
    
    // NEU: Filtere nach Geschlecht des Events
    if (event?.genderMode && event.genderMode !== 'open') {
      filtered = filtered.filter(player => {
        switch(event.genderMode) {
          case 'men':
            return player.gender === 'male';
          case 'women':
            return player.gender === 'female';
          default:
            return true;
        }
      });
    }
    
    // Existierende Suchfilter anwenden
    if (searchTerm) {
      filtered = filtered.filter(player =>
        player.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        player.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        player.phone?.includes(searchTerm) ||
        player.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        player.club?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    return filtered;
  };
  
  const filteredPlayers = getFilteredPlayers();

  // Zähle verfügbare Spieler
  const availablePlayersCount = filteredPlayers.filter(p => !isPlayerAlreadyRegistered(p)).length

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-2xl font-bold">Spieler-Datenbank</h2>
            {(event?.sport || event?.genderMode) && (
              <p className="text-sm text-gray-600 mt-1">
                Zeige nur {event.sport === 'padel' ? 'Padel' : 
                         event.sport === 'pickleball' ? 'Pickleball' : 
                         'SpinXball'}-Spieler
                {event?.genderMode && event.genderMode !== 'open' && (
                  <span>
                    {' '}({event.genderMode === 'men' ? 'Männer' : 'Frauen'})
                  </span>
                )}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        {/* Search and Add Button */}
        <div className="flex gap-4 mb-4">
          <input
            type="text"
            placeholder="Suche nach Name, Email, Telefon, Stadt oder Verein..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 px-4 py-2 border rounded-lg"
          />
          <button
            onClick={() => {
              setEditingPlayer(null)
              setFormData({
                name: '',
                gender: event?.genderMode === 'women' ? 'female' : 'male',
                sports: {
                  padel: false,
                  pickleball: false,
                  spinxball: false
                },
                padelSkill: 'B',
                pickleballSkill: 3.0,
                spinxballSkill: 3.0,
                phone: '',
                email: '',
                birthday: '',
                city: '',
                country: '',
                nationality: 'DE',
                club: '',
                duprId: ''
              })
              setShowAddForm(true)
            }}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            + Neuer Spieler
          </button>
          <label className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer">
            📊 Excel Import
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleExcelImport}
              className="hidden"
            />
          </label>
          <button
            onClick={() => {
              // Erstelle zwei Dateien: Vorlage und Anleitung
              
              // 1. Die eigentliche CSV-Vorlage
              const template = `Name,Geschlecht,Padel,Pickleball,SpinXball,Padel Level,Pickleball Level,SpinXball Level,Telefon,Email,Geburtstag,Stadt,Land,Nationalität,Verein,DUPR ID
Max Mustermann,male,x,,x,B+,,3.5,+49 123 456789,max@example.com,1985-03-15,München,Deutschland,DE,TC Blau-Weiß,
Anna Beispiel,female,x,x,,B,3.5,,+49 987 654321,anna@example.com,1990-07-22,Berlin,Deutschland,DE,Padel Club Berlin,
Carlos Rodriguez,male,x,x,x,A-,4.0,4.5,+34 666 777888,carlos@example.com,1988-11-30,Madrid,Spanien,ES,Club Deportivo Madrid,12345-ABC
Maria Schmidt,female,,x,,,3.0,,+49 555 123456,maria@example.com,1995-02-10,Hamburg,Deutschland,DE,Pickleball Hamburg,
Peter Müller,male,x,x,x,A,5.0,4.5,+49 333 444555,peter@example.com,1982-08-05,Frankfurt,Deutschland,DE,Sportclub Frankfurt,98765-XYZ`
              
              // 2. Eine Anleitung als Text-Datei
const anleitung = `PLAY2 TOURNAMENT - SPIELER IMPORT ANLEITUNG
==========================================

SPALTEN-ERKLÄRUNG:
-----------------
Name: Vollständiger Name des Spielers (PFLICHT)
Geschlecht: "male" oder "female" (PFLICHT)
Padel/Pickleball/SpinXball: "x" wenn der Spieler diese Sportart spielt, sonst leer lassen

WEITERE PFLICHTFELDER:
---------------------
Geburtstag: Format YYYY-MM-DD (z.B. 1990-05-15) (PFLICHT)
Stadt: Wohnort des Spielers (PFLICHT)
Land: Land des Spielers (PFLICHT)
Nationalität: 2-Buchstaben Code (DE, ES, FR, IT, US, etc.) (PFLICHT)
Verein: Vereinszugehörigkeit (PFLICHT)

OPTIONALE FELDER:
----------------
DUPR ID: Dynamic Universal Pickleball Rating ID (nur für Pickleball-Spieler, optional)
LEVEL-SYSTEME:
-------------
PADEL LEVEL:
- C       = Anfänger (1.0-3.0)
- B-      = Fortgeschrittener Anfänger (3.0-3.5)
- B       = Unteres Mittelstufe (3.5-4.0)
- B+      = Gutes Mittelstufe (4.0-4.5)
- A-      = Oberes Mittelstufe (4.5-5.0)
- A / A+  = Fortgeschritten/Profi (5.0-6.0)

PICKLEBALL & SPINXBALL LEVEL:
- 1.5     = Anfänger (1.0-2.0)
- 2.5     = Fortgeschrittener Anfänger
- 3.0     = Einsteiger mit Spielpraxis
- 3.5     = Mittleres Niveau
- 4.0     = Gutes Clubniveau
- 4.5     = Erfahren
- 5.0     = Semiprofessionell
- 5.5     = Profi (5.5-6.0+)

WICHTIGE HINWEISE:
-----------------
- PFLICHTFELDER: Name, Geschlecht, Geburtstag, Stadt, Land, Nationalität, Verein
- Mindestens eine Sportart muss mit "x" markiert sein
- Level nur für markierte Sportarten angeben
- Telefon und Email sind optional (aber empfohlen)
- DUPR ID ist nur für Pickleball-Spieler relevant (optional)
- Die erste Zeile (Überschriften) nicht löschen!
- Datei als .xlsx oder .xls speichern für Import
- Keine leeren Zeilen zwischen den Einträgen`

              // Download Vorlage
              const blob1 = new Blob([template], { type: 'text/csv;charset=utf-8;' })
              const url1 = URL.createObjectURL(blob1)
              const a1 = document.createElement('a')
              a1.href = url1
              a1.download = 'spieler_import_vorlage.csv'
              a1.click()
              
              // Download Anleitung
              setTimeout(() => {
                const blob2 = new Blob([anleitung], { type: 'text/plain;charset=utf-8;' })
                const url2 = URL.createObjectURL(blob2)
                const a2 = document.createElement('a')
                a2.href = url2
                a2.download = 'spieler_import_anleitung.txt'
                a2.click()
              }, 500) // Kleines Delay zwischen den Downloads
            }}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            📥 Vorlage + Anleitung
          </button>
          <button
            onClick={async () => {
              // Zeige Dialog mit Duplikaten
              const duplicateGroups = new Map()
              
              // Gruppiere Spieler nach Namen
              players.forEach(player => {
                const key = player.name.toLowerCase().trim()
                if (!duplicateGroups.has(key)) {
                  duplicateGroups.set(key, [])
                }
                duplicateGroups.get(key).push(player)
              })
              
              // Finde nur Gruppen mit mehr als einem Eintrag
              const duplicates = Array.from(duplicateGroups.entries())
                .filter(([_, group]) => group.length > 1)
              
              if (duplicates.length === 0) {
                alert('✅ Keine doppelten Einträge gefunden! Deine Datenbank ist sauber.')
                return
              }
              
              // Zeige Zusammenfassung
              let duplicateInfo = 'Gefundene Duplikate:\n\n'
              duplicates.forEach(([name, group]) => {
                duplicateInfo += `"${name}": ${group.length} Einträge\n`
              })
              
              const totalDuplicates = duplicates.reduce((sum, [_, group]) => sum + group.length - 1, 0)
              
              if (!window.confirm(
                duplicateInfo + '\n' +
                `Insgesamt ${totalDuplicates} doppelte Einträge.\n\n` +
                `Möchten Sie alle Duplikate löschen?\n` +
                `(Behält jeweils den Eintrag mit den meisten Daten)`
              )) {
                return
              }
              
              try {
                setIsLoading(true)
                let deletedCount = 0
                
                // Lösche alle außer dem besten Eintrag jeder Gruppe
                for (const [name, group] of duplicates) {
                  // Sortiere nach Vollständigkeit der Daten (beste zuerst)
                  const sorted = group.sort((a, b) => {
                    // Zähle ausgefüllte Felder
                    const scoreA = [
                      a.email, a.phone, a.birthday, a.city, 
                      a.country, a.nationality, a.club, a.duprId
                    ].filter(field => field && field !== '').length
                    
                    const scoreB = [
                      b.email, b.phone, b.birthday, b.city, 
                      b.country, b.nationality, b.club, b.duprId
                    ].filter(field => field && field !== '').length
                    
                    // Höhere Punktzahl = mehr Daten = besser
                    if (scoreB !== scoreA) return scoreB - scoreA
                    
                    // Bei gleicher Punktzahl: älterer Eintrag gewinnt
                    return new Date(a.createdAt || 0) - new Date(b.createdAt || 0)
                  })
                  
                  // Lösche alle außer dem ersten (besten)
                  for (let i = 1; i < sorted.length; i++) {
                    try {
                      await dbOperations.deletePlayer(sorted[i].id)
                      deletedCount++
                      console.log(`Gelöscht: ${sorted[i].name} (ID: ${sorted[i].id})`)
                    } catch (error) {
                      console.error(`Fehler beim Löschen von ${sorted[i].name}:`, error)
                    }
                  }
                }
                
                alert(`✅ ${deletedCount} doppelte Einträge wurden gelöscht!`)
                await loadPlayers()
                
              } catch (error) {
                console.error('Fehler beim Bereinigen:', error)
                alert('❌ Fehler beim Bereinigen der Datenbank')
              } finally {
                setIsLoading(false)
              }
            }}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            disabled={isLoading}
          >
            🧹 Duplikate löschen
          </button>
        </div>

       {/* Add/Edit Form */}
{showAddForm && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60]">
    <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold">
          {editingPlayer ? 'Spieler bearbeiten' : 'Neuen Spieler hinzufügen'}
        </h3>
        <button
          onClick={() => {
            setShowAddForm(false)
            setEditingPlayer(null)
          }}
          className="text-gray-500 hover:text-gray-700 text-2xl"
        >
          ✕
        </button>
      </div>
      <div className="overflow-y-auto flex-1 pr-2">
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-3 py-2 border rounded"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Geschlecht</label>
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({...formData, gender: e.target.value})}
                  className="w-full px-3 py-2 border rounded"
                >
                  {(event?.genderMode === 'open' || event?.genderMode === 'men' || !event?.genderMode) && (
                    <option value="male">Männlich</option>
                  )}
                  {(event?.genderMode === 'open' || event?.genderMode === 'women' || !event?.genderMode) && (
                    <option value="female">Weiblich</option>
                  )}
                </select>
                {event?.genderMode === 'men' && formData.gender === 'female' && (
                  <p className="text-xs text-orange-600 mt-1">
                    Hinweis: Dies ist ein Männer-Event
                  </p>
                )}
                {event?.genderMode === 'women' && formData.gender === 'male' && (
                  <p className="text-xs text-orange-600 mt-1">
                    Hinweis: Dies ist ein Frauen-Event
                  </p>
                )}
              </div>
              
              {/* Sportarten Auswahl */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2">Sportarten *</label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.sports.padel}
                      onChange={(e) => setFormData({
                        ...formData, 
                        sports: {...formData.sports, padel: e.target.checked}
                      })}
                      className="mr-2"
                    />
                    <span>Padel</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.sports.pickleball}
                      onChange={(e) => setFormData({
                        ...formData, 
                        sports: {...formData.sports, pickleball: e.target.checked}
                      })}
                      className="mr-2"
                    />
                    <span>Pickleball</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.sports.spinxball}
                      onChange={(e) => setFormData({
                        ...formData, 
                        sports: {...formData.sports, spinxball: e.target.checked}
                      })}
                      className="mr-2"
                    />
                    <span>SpinXball</span>
                  </label>
                </div>
                {!formData.sports.padel && !formData.sports.pickleball && !formData.sports.spinxball && (
                  <p className="text-red-500 text-xs mt-1">Mindestens eine Sportart muss ausgewählt werden</p>
                )}
              </div>

              {/* Skill Level nur für ausgewählte Sportarten */}
              {formData.sports.padel && (
                <div>
                  <label className="block text-sm font-medium mb-1">Padel Level</label>
                  <select
                    value={formData.padelSkill}
                    onChange={(e) => setFormData({...formData, padelSkill: e.target.value})}
                    className="w-full px-3 py-2 border rounded"
                  >
                    <option value="C">C / C+ (1.0-3.0) - Anfänger</option>
                    <option value="B-">B- (3.0-3.5) - Fortgeschrittener Anfänger</option>
                    <option value="B">B (3.5-4.0) - Unteres Mittelstufe</option>
                    <option value="B+">B+ (4.0-4.5) - Gutes Mittelstufe</option>
                    <option value="A-">A- (4.5-5.0) - Oberes Mittelstufe</option>
                    <option value="A">A / A+ (5.0-6.0) - Fortgeschritten/Profi</option>
                  </select>
                </div>
              )}

              {formData.sports.pickleball && (
                <div>
                  <label className="block text-sm font-medium mb-1">Pickleball Level</label>
                  <select
                    value={formData.pickleballSkill}
                    onChange={(e) => setFormData({...formData, pickleballSkill: parseFloat(e.target.value)})}
                    className="w-full px-3 py-2 border rounded"
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
                </div>
              )}

              {formData.sports.spinxball && (
                <div>
                  <label className="block text-sm font-medium mb-1">SpinXball Level</label>
                  <select
                    value={formData.spinxballSkill}
                    onChange={(e) => setFormData({...formData, spinxballSkill: parseFloat(e.target.value)})}
                    className="w-full px-3 py-2 border rounded"
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
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium mb-1">Telefon</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="w-full px-3 py-2 border rounded"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full px-3 py-2 border rounded"
                />
              </div>

              {/* Neue Felder */}
              <div>
                <label className="block text-sm font-medium mb-1">Geburtstag *</label>
                <input
                  type="date"
                  value={formData.birthday}
                  onChange={(e) => setFormData({...formData, birthday: e.target.value})}
                  className="w-full px-3 py-2 border rounded"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Stadt *</label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({...formData, city: e.target.value})}
                  className="w-full px-3 py-2 border rounded"
                  placeholder="z.B. München"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Land *</label>
                <input
                  type="text"
                  value={formData.country}
                  onChange={(e) => setFormData({...formData, country: e.target.value})}
                  className="w-full px-3 py-2 border rounded"
                  placeholder="z.B. Deutschland"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Nationalität (für Flagge) *</label>
                <select
                  value={formData.nationality}
                  onChange={(e) => setFormData({...formData, nationality: e.target.value})}
                  className="w-full px-3 py-2 border rounded"
                  required
                >
            
                  <option value="DE">🇩🇪 Deutschland</option>
                  <option value="ES">🇪🇸 Spanien</option>
                  <option value="FR">🇫🇷 Frankreich</option>
                  <option value="IT">🇮🇹 Italien</option>
                  <option value="US">🇺🇸 USA</option>
                  <option value="GB">🇬🇧 Großbritannien</option>
                  <option value="AT">🇦🇹 Österreich</option>
                  <option value="CH">🇨🇭 Schweiz</option>
                  <option value="NL">🇳🇱 Niederlande</option>
                  <option value="BE">🇧🇪 Belgien</option>
                  <option value="PT">🇵🇹 Portugal</option>
                  <option value="SE">🇸🇪 Schweden</option>
                  <option value="DK">🇩🇰 Dänemark</option>
                  <option value="NO">🇳🇴 Norwegen</option>
                  <option value="PL">🇵🇱 Polen</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Verein/Club *</label>
                <input
                  type="text"
                  value={formData.club}
                  onChange={(e) => setFormData({...formData, club: e.target.value})}
                  className="w-full px-3 py-2 border rounded"
                  placeholder="z.B. TC Blau-Weiß München"
                  required
                />
              </div>

              {/* DUPR ID nur bei Pickleball - OPTIONAL */}
              {formData.sports.pickleball && (
                <div>
                  <label className="block text-sm font-medium mb-1">
                    DUPR ID 
                    <span className="text-xs text-gray-500 ml-1">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={formData.duprId}
                    onChange={(e) => setFormData({...formData, duprId: e.target.value})}
                    className="w-full px-3 py-2 border rounded"
                    placeholder="z.B. 12345-ABC (optional)"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Dynamic Universal Pickleball Rating - nur wenn vorhanden
                  </p>
                </div>
              )}
              
              <div className="md:col-span-2 flex gap-2 mt-4 pt-4 border-t">
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  {editingPlayer ? 'Änderungen speichern' : 'Spieler hinzufügen'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false)
                    setEditingPlayer(null)
                  }}
                  className="px-6 py-2 bg-gray-300 rounded hover:bg-gray-400"
                >
                  Abbrechen
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    )}
    

        {/* Player List */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2">Lade Spieler...</p>
            </div>
          ) : filteredPlayers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {searchTerm ? 'Keine Spieler gefunden' : 
               event?.sport || event?.genderMode ? 
                 `Keine passenden Spieler in der Datenbank` :
                 'Noch keine Spieler in der Datenbank'}
            </div>
          ) : (
            <div>
              <div className="flex justify-between items-center mb-2">
                <p className="text-sm text-gray-600">
                  {filteredPlayers.length} Spieler gefunden ({availablePlayersCount} verfügbar)
                </p>
                <button
                  onClick={handleSelectAll}
                  className="text-sm text-blue-600 hover:underline"
                  disabled={availablePlayersCount === 0}
                >
                  {selectedPlayers.length === availablePlayersCount && availablePlayersCount > 0 
                    ? 'Alle verfügbaren abwählen' 
                    : 'Alle verfügbaren auswählen'}
                </button>
              </div>
              
              <div className="space-y-2">
                {filteredPlayers.map(player => {
                  const isRegistered = isPlayerAlreadyRegistered(player)
                  const age = calculateAge(player.birthday)
                  
                  return (
                    <div 
                      key={player.id}
                      className={`p-3 rounded-lg border transition-colors ${
                        isRegistered 
                          ? 'bg-gray-100 border-gray-300 opacity-60' 
                          : selectedPlayers.includes(player.id) 
                            ? 'bg-blue-50 border-blue-300 cursor-pointer' 
                            : 'bg-white hover:bg-gray-50 cursor-pointer'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div 
                          className="flex items-center gap-3 flex-1"
                          onClick={() => !isRegistered && togglePlayerSelection(player.id)}
                        >
                          <input
                            type="checkbox"
                            checked={selectedPlayers.includes(player.id)}
                            onChange={() => {}}
                            disabled={isRegistered}
                            className="h-4 w-4 text-blue-600"
                          />
                          <div>
                            <p className={`font-semibold ${isRegistered ? 'line-through text-gray-500' : ''}`}>
                              {player.name}
                              {player.nationality && (
                                <span className="ml-2">{getFlagEmoji(player.nationality)}</span>
                              )}
                              {isRegistered && (
                                <span className="ml-2 text-xs text-gray-500 font-normal">(bereits angemeldet)</span>
                              )}
                            </p>
                            <div className="text-sm text-gray-600 flex gap-4">
                              <span>{player.gender === 'female' ? '♀️' : '♂️'}</span>
                              {player.sports?.padel && <span>Padel: {player.padelSkill}</span>}
                              {player.sports?.pickleball && <span>Pickleball: {player.pickleballSkill}</span>}
                              {player.sports?.spinxball && <span>SpinXball: {player.spinxballSkill}</span>}
                            </div>
                            {/* Neue Zeile für zusätzliche Infos */}
                            <div className="text-xs text-gray-500 mt-1">
                              {player.club && <span className="mr-3">🏛️ {player.club}</span>}
                              {player.city && <span className="mr-3">📍 {player.city}</span>}
                              {age && <span className="mr-3">🎂 {age} Jahre</span>}
                              {player.duprId && player.sports?.pickleball && (
                                <span className="mr-3">DUPR: {player.duprId}</span>
                              )}
                            </div>
                            {(player.email || player.phone) && (
                              <div className="text-xs text-gray-500">
                                {player.email && <span className="mr-3">{player.email}</span>}
                                {player.phone && <span>{player.phone}</span>}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => handleEdit(player)}
                            className="px-3 py-1 text-sm bg-yellow-500 text-white rounded hover:bg-yellow-600"
                          >
                            Bearbeiten
                          </button>
                          <button
                            onClick={() => handleDelete(player.id)}
                            className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600"
                          >
                            Löschen
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer with Import Button */}
        <div className="mt-4 pt-4 border-t flex justify-between items-center">
          <p className="text-sm text-gray-600">
            {selectedPlayers.length} Spieler ausgewählt
          </p>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-300 rounded-lg hover:bg-gray-400"
            >
              Abbrechen
            </button>
            <button
              onClick={handleImport}
              disabled={selectedPlayers.length === 0}
              className={`px-4 py-2 rounded-lg ${
                selectedPlayers.length > 0
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {selectedPlayers.length} Spieler importieren
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PlayerDatabase