import { useState, useEffect } from 'react'
import { dbOperations } from '../lib/supabase'
import { transformFromDB, transformToDB } from '../utils/dbHelpers'
import { useTranslation } from '../components/LanguageSelector'
import { interpolate } from '../utils/translations'
import { fixEncoding } from '../utils/encoding';

// Helper-Funktionen fÃ¼r Level-Konvertierung
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
    'C': 'AnfÃ¤nger',
    'B-': 'Fortgeschrittener AnfÃ¤nger',
    'B': 'Unteres Mittelstufe',
    'B+': 'Gutes Mittelstufe',
    'A-': 'Oberes Mittelstufe',
    'A': 'Fortgeschritten/Profi'
  }
  return descriptions[level] || ''
}

// Helper-Funktion fÃ¼r Flaggen-Emoji
const getFlagEmoji = (countryCode) => {
  const flags = {
    'DE': 'ðŸ‡©ðŸ‡ª', 'ES': 'ðŸ‡ªðŸ‡¸', 'FR': 'ðŸ‡«ðŸ‡·', 'IT': 'ðŸ‡®ðŸ‡¹', 'US': 'ðŸ‡ºðŸ‡¸',
    'GB': 'ðŸ‡¬ðŸ‡§', 'AT': 'ðŸ‡¦ðŸ‡¹', 'CH': 'ðŸ‡¨ðŸ‡­', 'NL': 'ðŸ‡³ðŸ‡±', 'BE': 'ðŸ‡§ðŸ‡ª',
    'PT': 'ðŸ‡µðŸ‡¹', 'SE': 'ðŸ‡¸ðŸ‡ª', 'DK': 'ðŸ‡©ðŸ‡°', 'NO': 'ðŸ‡³ðŸ‡´', 'PL': 'ðŸ‡µðŸ‡±'
  }
  return flags[countryCode] || 'ðŸ³ï¸'
}

// Helper-Funktion fÃ¼r Altersberechnung
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
  const t = useTranslation()?.t || ((key) => key)  // <-- NUR t hier
  
  // NEUE ZEILEN fÃ¼r Spielerlimit-PrÃ¼fung
  const remainingSlots = event?.maxPlayers - existingPlayers.length || 0;
  const canAddMore = remainingSlots > 0;
  
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
      // removed console.error
      alert(t('database.errorLoading'))
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

        // removed console.log // Debug-Log

        const playersToImport = data.map(row => {
          // Debug jeden Row
          // removed console.log
          
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
            nationality: row['NationalitÃ¤t'] || row['nationality'] || '',
            club: row['Verein'] || row['club'] || '',
            duprId: row['DUPR ID'] || row['duprId'] || ''
          }
          
          // removed console.log
          return player
        }).filter(p => p.name && (p.sports.padel || p.sports.pickleball || p.sports.spinxball))

        // removed console.log

        if (playersToImport.length === 0) {
          alert(t('database.noValidPlayers'))
          return
        }

        // Lade aktuelle Spieler fÃ¼r Duplikat-Check
        const currentPlayers = await dbOperations.getPlayers()
        const existingNames = new Set(
          currentPlayers.map(p => p.name.toLowerCase().trim())
        )
        
        let successCount = 0
        let skipCount = 0
        let errorCount = 0
        
        for (const player of playersToImport) {
          try {
            // PrÃ¼fe auf Duplikate
            if (existingNames.has(fixEncoding(player.name).toLowerCase().trim())) {
              // removed console.log
              skipCount++
              continue
            }
            
            // removed console.log
            const result = await dbOperations.createPlayer(player)
            // removed console.log
            if (result) {
              successCount++
              // FÃ¼ge zur Liste hinzu fÃ¼r weitere Duplikat-Checks
              existingNames.add(fixEncoding(player.name).toLowerCase().trim())
            } else {
              errorCount++
              // removed console.error
            }
          } catch (error) {
            errorCount++
            // removed console.error
          }
        }

        let message = `${t('database.importCompleted')}:\n`
        message += `âœ… ${successCount} ${t('database.newImported')}`
        if (skipCount > 0) message += `\nâ­ï¸ ${skipCount} ${t('database.skipped')}`
        if (errorCount > 0) message += `\nâŒ ${errorCount} ${t('database.errors')}`
        
        // removed console.log
        alert(message)
        await loadPlayers()
      } catch (error) {
        // removed console.error
        alert(t('database.errorReadingExcel'))
      }
    }
    reader.readAsBinaryString(file)
  }

  // PrÃ¼ft ob ein Spieler bereits im Event angemeldet ist
  const isPlayerAlreadyRegistered = (player) => {
    return existingPlayers.some(ep => 
      ep.name.toLowerCase() === fixEncoding(player.name).toLowerCase()
    )
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Validiere dass mindestens eine Sportart ausgewÃ¤hlt ist
    if (!formData.sports.padel && !formData.sports.pickleball && !formData.sports.spinxball) {
      alert(t('database.atLeastOneSport'))
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
        // PrÃ¼fe auf Duplikate vor dem Erstellen
        const existingPlayers = players.filter(p => 
          p.name.toLowerCase().trim() === formData.name.toLowerCase().trim()
        )
        
        if (existingPlayers.length > 0) {
          const confirm = window.confirm(
            interpolate(t('database.duplicateExists'), { name: formData.name })
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
      // removed console.error
      alert(t('database.errorSaving'))
    }
  }

  const handleEdit = (player) => {
    setEditingPlayer(player)
    setFormData({
      name: fixEncoding(player.name) || '',
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
      city: fixEncoding(player.city) || '',
      country: player.country || '',
      nationality: player.nationality || 'DE',
      club: fixEncoding(player.club) || '',
      duprId: player.duprId || ''
    })
    setShowAddForm(true)
  }

  const handleDelete = async (playerId) => {
    if (!window.confirm(t('database.confirmDeletePlayer'))) {
      return
    }
    
    try {
      await dbOperations.deletePlayer(playerId)
      await loadPlayers()
    } catch (error) {
      // removed console.error
      alert(t('navigation.delete'))
    }
  }

  const togglePlayerSelection = (playerId) => {
    const player = players.find(p => p.id === playerId)
    
    // PrÃ¼fe ob Spieler bereits angemeldet ist
    if (isPlayerAlreadyRegistered(player)) {
      alert(interpolate(t('player.alreadyRegistered'), { name: fixEncoding(player.name) }))
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
        // PrÃ¼fe ob der Spieler diese Sportart spielt
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
        fixEncoding(player.name)?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        player.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        player.phone?.includes(searchTerm) ||
        fixEncoding(player.city)?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        fixEncoding(player.club)?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    return filtered;
  };
  
  const filteredPlayers = getFilteredPlayers();

  // ZÃ¤hle verfÃ¼gbare Spieler
  const availablePlayersCount = filteredPlayers.filter(p => !isPlayerAlreadyRegistered(p)).length

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-2xl font-bold">{t('database.playerDatabase')}</h2>
            {(event?.sport || event?.genderMode) && (
              <p className="text-sm text-gray-600 mt-1">
                {interpolate(t('database.showOnlyFor'), { 
                  sport: t(`sports.${event.sport}`) 
                })}
                {event?.genderMode && event.genderMode !== 'open' && (
                  <span>
                    {' '}({event.genderMode === 'men' ? t('database.men') : t('database.women')})
                  </span>
                )}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            âœ•
          </button>
        </div>

        {/* Search and Add Button */}
        <div className="flex gap-4 mb-4">
          <input
            type="text"
            placeholder={t('database.search')}
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
            + {t('database.newPlayer')}
          </button>
          <label className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer">
            ðŸ“Š {t('database.excelImport')}
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
              const template = `Name,Geschlecht,Padel,Pickleball,SpinXball,Padel Level,Pickleball Level,SpinXball Level,Telefon,Email,Geburtstag,Stadt,Land,NationalitÃ¤t,Verein,DUPR ID
Max Mustermann,male,x,,x,B+,,3.5,+49 123 456789,max@example.com,1985-03-15,MÃ¼nchen,Deutschland,DE,TC Blau-WeiÃŸ,
Anna Beispiel,female,x,x,,B,3.5,,+49 987 654321,anna@example.com,1990-07-22,Berlin,Deutschland,DE,Padel Club Berlin,
Carlos Rodriguez,male,x,x,x,A-,4.0,4.5,+34 666 777888,carlos@example.com,1988-11-30,Madrid,Spanien,ES,Club Deportivo Madrid,12345-ABC
Maria Schmidt,female,,x,,,3.0,,+49 555 123456,maria@example.com,1995-02-10,Hamburg,Deutschland,DE,Pickleball Hamburg,
Peter MÃ¼ller,male,x,x,x,A,5.0,4.5,+49 333 444555,peter@example.com,1982-08-05,Frankfurt,Deutschland,DE,Sportclub Frankfurt,98765-XYZ`
              
              // 2. Eine Anleitung als Text-Datei
const anleitung = `PLAY2 TOURNAMENT - SPIELER IMPORT ANLEITUNG
==========================================

SPALTEN-ERKLÃ„RUNG:
-----------------
Name: VollstÃ¤ndiger Name des Spielers (PFLICHT)
Geschlecht: "male" oder "female" (PFLICHT)
Padel/Pickleball/SpinXball: "x" wenn der Spieler diese Sportart spielt, sonst leer lassen

WEITERE PFLICHTFELDER:
---------------------
Geburtstag: Format YYYY-MM-DD (z.B. 1990-05-15) (PFLICHT)
Stadt: Wohnort des Spielers (PFLICHT)
Land: Land des Spielers (PFLICHT)
NationalitÃ¤t: 2-Buchstaben Code (DE, ES, FR, IT, US, etc.) (PFLICHT)
Verein: VereinszugehÃ¶rigkeit (PFLICHT)

OPTIONALE FELDER:
----------------
DUPR ID: Dynamic Universal Pickleball Rating ID (nur fÃ¼r Pickleball-Spieler, optional)
LEVEL-SYSTEME:
-------------
PADEL LEVEL:
- C       = AnfÃ¤nger (1.0-3.0)
- B-      = Fortgeschrittener AnfÃ¤nger (3.0-3.5)
- B       = Unteres Mittelstufe (3.5-4.0)
- B+      = Gutes Mittelstufe (4.0-4.5)
- A-      = Oberes Mittelstufe (4.5-5.0)
- A / A+  = Fortgeschritten/Profi (5.0-6.0)

PICKLEBALL & SPINXBALL LEVEL:
- 1.5     = AnfÃ¤nger (1.0-2.0)
- 2.5     = Fortgeschrittener AnfÃ¤nger
- 3.0     = Einsteiger mit Spielpraxis
- 3.5     = Mittleres Niveau
- 4.0     = Gutes Clubniveau
- 4.5     = Erfahren
- 5.0     = Semiprofessionell
- 5.5     = Profi (5.5-6.0+)

WICHTIGE HINWEISE:
-----------------
- PFLICHTFELDER: Name, Geschlecht, Geburtstag, Stadt, Land, NationalitÃ¤t, Verein
- Mindestens eine Sportart muss mit "x" markiert sein
- Level nur fÃ¼r markierte Sportarten angeben
- Telefon und Email sind optional (aber empfohlen)
- DUPR ID ist nur fÃ¼r Pickleball-Spieler relevant (optional)
- Die erste Zeile (Ãœberschriften) nicht lÃ¶schen!
- Datei als .xlsx oder .xls speichern fÃ¼r Import
- Keine leeren Zeilen zwischen den EintrÃ¤gen`

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
            ðŸ“¥ {t('database.templateAndInstructions')}
          </button>
          <button
            onClick={async () => {
              // Zeige Dialog mit Duplikaten
              const duplicateGroups = new Map()
              
              // Gruppiere Spieler nach Namen
              players.forEach(player => {
                const key = fixEncoding(player.name).toLowerCase().trim()
                if (!duplicateGroups.has(key)) {
                  duplicateGroups.set(key, [])
                }
                duplicateGroups.get(key).push(player)
              })
              
              // Finde nur Gruppen mit mehr als einem Eintrag
              const duplicates = Array.from(duplicateGroups.entries())
                .filter(([_, group]) => group.length > 1)
              
              if (duplicates.length === 0) {
                alert(`âœ… ${t('database.noDuplicatesFound')}`)
                return
              }
              
              // Zeige Zusammenfassung
              let duplicateInfo = `${t('database.foundDuplicates')}:\n\n`
              duplicates.forEach(([name, group]) => {
                duplicateInfo += `"${name}": ${group.length} ${t('player.players')}\n`
              })
              
              const totalDuplicates = duplicates.reduce((sum, [_, group]) => sum + group.length - 1, 0)
              
              if (!window.confirm(
                duplicateInfo + '\n' +
                interpolate(t('database.totalDuplicates'), { count: totalDuplicates }) + '\n\n' +
                t('database.confirmDeleteDuplicates')
              )) {
                return
              }
              
              try {
                setIsLoading(true)
                let deletedCount = 0
                
                // LÃ¶sche alle auÃŸer dem besten Eintrag jeder Gruppe
                for (const [name, group] of duplicates) {
                  // Sortiere nach VollstÃ¤ndigkeit der Daten (beste zuerst)
                  const sorted = group.sort((a, b) => {
                    // ZÃ¤hle ausgefÃ¼llte Felder
                    const scoreA = [
                      a.email, a.phone, a.birthday, a.city, 
                      a.country, a.nationality, a.club, a.duprId
                    ].filter(field => field && field !== '').length
                    
                    const scoreB = [
                      b.email, b.phone, b.birthday, b.city, 
                      b.country, b.nationality, b.club, b.duprId
                    ].filter(field => field && field !== '').length
                    
                    // HÃ¶here Punktzahl = mehr Daten = besser
                    if (scoreB !== scoreA) return scoreB - scoreA
                    
                    // Bei gleicher Punktzahl: Ã¤lterer Eintrag gewinnt
                    return new Date(a.createdAt || 0) - new Date(b.createdAt || 0)
                  })
                  
                  // LÃ¶sche alle auÃŸer dem ersten (besten)
                  for (let i = 1; i < sorted.length; i++) {
                    try {
                      await dbOperations.deletePlayer(sorted[i].id)
                      deletedCount++
                      // removed console.log`)
                    } catch (error) {
                      // removed console.error
                    }
                  }
                }
                
                alert(interpolate(t('database.duplicatesDeleted'), { count: deletedCount }))
                await loadPlayers()
                
              } catch (error) {
                // removed console.error
                alert(`âŒ ${t('database.errorCleaning')}`)
              } finally {
                setIsLoading(false)
              }
            }}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            disabled={isLoading}
          >
            ðŸ§¹ {t('database.cleanDuplicates')}
          </button>
        </div>

       {/* Add/Edit Form */}
{showAddForm && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60]">
    <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold">
          {editingPlayer ? t('database.editPlayer') : t('database.addPlayer')}
        </h3>
        <button
          onClick={() => {
            setShowAddForm(false)
            setEditingPlayer(null)
          }}
          className="text-gray-500 hover:text-gray-700 text-2xl"
        >
          âœ•
        </button>
      </div>
      <div className="overflow-y-auto flex-1 pr-2">
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">{t('player.name')} *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-3 py-2 border rounded"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">{t('player.gender')}</label>
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({...formData, gender: e.target.value})}
                  className="w-full px-3 py-2 border rounded"
                >
                  {(event?.genderMode === 'open' || event?.genderMode === 'men' || !event?.genderMode) && (
                    <option value="male">{t('player.male')}</option>
                  )}
                  {(event?.genderMode === 'open' || event?.genderMode === 'women' || !event?.genderMode) && (
                    <option value="female">{t('player.female')}</option>
                  )}
                </select>
                {event?.genderMode === 'men' && formData.gender === 'female' && (
                  <p className="text-xs text-orange-600 mt-1">
                    {interpolate(t('messages.noteEvent'), { gender: t('player.male') })}
                  </p>
                )}
                {event?.genderMode === 'women' && formData.gender === 'male' && (
                  <p className="text-xs text-orange-600 mt-1">
                    {interpolate(t('messages.noteEvent'), { gender: t('player.female') })}
                  </p>
                )}
              </div>
              
              {/* Sportarten Auswahl */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2">{t('database.sports')} *</label>
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
                    <span>{t('sports.padel')}</span>
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
                    <span>{t('sports.pickleball')}</span>
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
                    <span>{t('sports.spinxball')}</span>
                  </label>
                </div>
                {!formData.sports.padel && !formData.sports.pickleball && !formData.sports.spinxball && (
                  <p className="text-red-500 text-xs mt-1">{t('database.atLeastOneSport')}</p>
                )}
              </div>

              {/* Skill Level nur fÃ¼r ausgewÃ¤hlte Sportarten */}
              {formData.sports.padel && (
                <div>
                  <label className="block text-sm font-medium mb-1">{t('sports.padel')} {t('player.level')}</label>
                  <select
                    value={formData.padelSkill}
                    onChange={(e) => setFormData({...formData, padelSkill: e.target.value})}
                    className="w-full px-3 py-2 border rounded"
                  >
                    <option value="C">C / C+ (1.0-3.0) - {t('playerManagement.beginner')}</option>
                    <option value="B-">B- (3.0-3.5) - {t('playerManagement.advancedBeginner')}</option>
                    <option value="B">B (3.5-4.0) - {t('playerManagement.lowerIntermediate')}</option>
                    <option value="B+">B+ (4.0-4.5) - {t('playerManagement.goodIntermediate')}</option>
                    <option value="A-">A- (4.5-5.0) - {t('playerManagement.upperIntermediate')}</option>
                    <option value="A">A / A+ (5.0-6.0) - {t('playerManagement.advancedPro')}</option>
                  </select>
                </div>
              )}

              {formData.sports.pickleball && (
                <div>
                  <label className="block text-sm font-medium mb-1">{t('sports.pickleball')} {t('player.level')}</label>
                  <select
                    value={formData.pickleballSkill}
                    onChange={(e) => setFormData({...formData, pickleballSkill: parseFloat(e.target.value)})}
                    className="w-full px-3 py-2 border rounded"
                  >
                    <option value="1.5">1.0-2.0 - {t('playerManagement.beginner')}</option>
                    <option value="2.5">2.5 - {t('playerManagement.advancedBeginner')}</option>
                    <option value="3.0">3.0 - {t('playerManagement.lowerIntermediate')}</option>
                    <option value="3.5">3.5 - {t('playerManagement.goodIntermediate')}</option>
                    <option value="4.0">4.0 - {t('playerManagement.upperIntermediate')}</option>
                    <option value="4.5">4.5 - {t('playerManagement.advancedPro')}</option>
                    <option value="5.0">5.0 - {t('playerManagement.expert')}</option>
                    <option value="5.5">5.5-6.0+ - {t('playerManagement.advancedPro')}</option>
                  </select>
                </div>
              )}

              {formData.sports.spinxball && (
                <div>
                  <label className="block text-sm font-medium mb-1">{t('sports.spinxball')} {t('player.level')}</label>
                  <select
                    value={formData.spinxballSkill}
                    onChange={(e) => setFormData({...formData, spinxballSkill: parseFloat(e.target.value)})}
                    className="w-full px-3 py-2 border rounded"
                  >
                    <option value="1.5">1.0-2.0 - {t('playerManagement.beginner')}</option>
                    <option value="2.5">2.5 - {t('playerManagement.advancedBeginner')}</option>
                    <option value="3.0">3.0 - {t('playerManagement.lowerIntermediate')}</option>
                    <option value="3.5">3.5 - {t('playerManagement.goodIntermediate')}</option>
                    <option value="4.0">4.0 - {t('playerManagement.upperIntermediate')}</option>
                    <option value="4.5">4.5 - {t('playerManagement.advancedPro')}</option>
                    <option value="5.0">5.0 - {t('playerManagement.expert')}</option>
                    <option value="5.5">5.5-6.0+ - {t('playerManagement.advancedPro')}</option>
                  </select>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium mb-1">{t('player.phone')}</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="w-full px-3 py-2 border rounded"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">{t('player.email')}</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full px-3 py-2 border rounded"
                />
              </div>

              {/* Neue Felder */}
              <div>
                <label className="block text-sm font-medium mb-1">{t('database.birthday')} *</label>
                <input
                  type="date"
                  value={formData.birthday}
                  onChange={(e) => setFormData({...formData, birthday: e.target.value})}
                  className="w-full px-3 py-2 border rounded"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">{t('database.city')} *</label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({...formData, city: e.target.value})}
                  className="w-full px-3 py-2 border rounded"
                  placeholder="z.B. MÃ¼nchen"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">{t('database.country')} *</label>
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
                <label className="block text-sm font-medium mb-1">{t('database.nationality')} *</label>
                <select
                  value={formData.nationality}
                  onChange={(e) => setFormData({...formData, nationality: e.target.value})}
                  className="w-full px-3 py-2 border rounded"
                  required
                >
            
                  <option value="DE">ðŸ‡©ðŸ‡ª Deutschland</option>
                  <option value="ES">ðŸ‡ªðŸ‡¸ EspaÃ±a</option>
                  <option value="FR">ðŸ‡«ðŸ‡· France</option>
                  <option value="IT">ðŸ‡®ðŸ‡¹ Italia</option>
                  <option value="US">ðŸ‡ºðŸ‡¸ USA</option>
                  <option value="GB">ðŸ‡¬ðŸ‡§ Great Britain</option>
                  <option value="AT">ðŸ‡¦ðŸ‡¹ Ã–sterreich</option>
                  <option value="CH">ðŸ‡¨ðŸ‡­ Schweiz</option>
                  <option value="NL">ðŸ‡³ðŸ‡± Nederland</option>
                  <option value="BE">ðŸ‡§ðŸ‡ª BelgiÃ«</option>
                  <option value="PT">ðŸ‡µðŸ‡¹ Portugal</option>
                  <option value="SE">ðŸ‡¸ðŸ‡ª Sverige</option>
                  <option value="DK">ðŸ‡©ðŸ‡° Danmark</option>
                  <option value="NO">ðŸ‡³ðŸ‡´ Norge</option>
                  <option value="PL">ðŸ‡µðŸ‡± Polska</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">{t('database.clubAssociation')} *</label>
                <input
                  type="text"
                  value={formData.club}
                  onChange={(e) => setFormData({...formData, club: e.target.value})}
                  className="w-full px-3 py-2 border rounded"
                  placeholder="z.B. TC Blau-WeiÃŸ MÃ¼nchen"
                  required
                />
              </div>

              {/* DUPR ID nur bei Pickleball - OPTIONAL */}
              {formData.sports.pickleball && (
                <div>
                  <label className="block text-sm font-medium mb-1">
                    {t('database.duprIdOptional')}
                  </label>
                  <input
                    type="text"
                    value={formData.duprId}
                    onChange={(e) => setFormData({...formData, duprId: e.target.value})}
                    className="w-full px-3 py-2 border rounded"
                    placeholder={`z.B. 12345-ABC (${t('database.optional')})`}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {t('database.duprDescription')}
                  </p>
                </div>
              )}
              
              <div className="md:col-span-2 flex gap-2 mt-4 pt-4 border-t">
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  {editingPlayer ? t('database.saveChanges') : t('database.addPlayer')}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false)
                    setEditingPlayer(null)
                  }}
                  className="px-6 py-2 bg-gray-300 rounded hover:bg-gray-400"
                >
                  {t('navigation.cancel')}
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
              <p className="mt-2">{t('database.loadingPlayers')}</p>
            </div>
          ) : filteredPlayers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {searchTerm ? t('database.noPlayersFound') : 
               event?.sport || event?.genderMode ? 
                 t('database.noMatchingPlayers') :
                 t('player.noPlayers')}
            </div>
          ) : (
            <div>
              <div className="flex justify-between items-center mb-2">
                <p className="text-sm text-gray-600">
                  {interpolate(t('database.playersFound'), { 
                    count: filteredPlayers.length, 
                    available: availablePlayersCount 
                  })}
                </p>
                <button
                  onClick={handleSelectAll}
                  className="text-sm text-blue-600 hover:underline"
                  disabled={availablePlayersCount === 0}
                >
                  {selectedPlayers.length === availablePlayersCount && availablePlayersCount > 0 
                    ? `${t('database.allAvailable')} ${t('database.deselectAll')}` 
                    : `${t('database.allAvailable')} ${t('database.selectAll')}`}
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
                              {fixEncoding(player.name)}
                              {player.nationality && (
                                <span className="ml-2">{getFlagEmoji(player.nationality)}</span>
                              )}
                              {isRegistered && (
                                <span className="ml-2 text-xs text-gray-500 font-normal">({t('database.alreadyRegistered')})</span>
                              )}
                            </p>
                            <div className="text-sm text-gray-600 flex gap-4">
                              <span>{player.gender === 'female' ? 'â™€ï¸' : 'â™‚ï¸'}</span>
                              {player.sports?.padel && <span>{t('sports.padel')}: {player.padelSkill}</span>}
                              {player.sports?.pickleball && <span>{t('sports.pickleball')}: {player.pickleballSkill}</span>}
                              {player.sports?.spinxball && <span>{t('sports.spinxball')}: {player.spinxballSkill}</span>}
                            </div>
                            {/* Neue Zeile fÃ¼r zusÃ¤tzliche Infos */}
                            <div className="text-xs text-gray-500 mt-1">
                              {fixEncoding(player.club) && <span className="mr-3">ðŸ›ï¸ {fixEncoding(player.club)}</span>}
                              {fixEncoding(player.city) && <span className="mr-3">ðŸ“ {fixEncoding(player.city)}</span>}
                              {age && <span className="mr-3">ðŸŽ‚ {age} {t('database.age')}</span>}
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
                            {t('database.edit')}
                          </button>
                          <button
                            onClick={() => handleDelete(player.id)}
                            className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600"
                          >
                            {t('database.delete')}
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
            {interpolate(t('database.playersSelected'), { count: selectedPlayers.length })}
          </p>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-300 rounded-lg hover:bg-gray-400"
            >
              {t('navigation.cancel')}
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
              {interpolate(t('database.importPlayers'), { count: selectedPlayers.length })}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PlayerDatabase



