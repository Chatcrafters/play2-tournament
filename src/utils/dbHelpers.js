// WICHTIG: Diese Datei konvertiert zwischen camelCase (Frontend) und snake_case (Datenbank)
// IMMER diese Funktionen verwenden bei Supabase-Operationen!

/**
 * Konvertiert snake_case zu camelCase
 * @param {string} str - String in snake_case
 * @returns {string} String in camelCase
 */
const snakeToCamel = (str) => {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
};

/**
 * Konvertiert camelCase zu snake_case
 * @param {string} str - String in camelCase
 * @returns {string} String in snake_case
 */
const camelToSnake = (str) => {
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
};

/**
 * Bereinigt Event-Daten nach dem Laden aus der Datenbank
 * Stellt sicher, dass Arrays Arrays sind und nicht null
 * @param {Object} event - Event-Objekt aus der Datenbank
 * @returns {Object} Bereinigtes Event-Objekt
 */
export const sanitizeEventData = (event) => {
  if (!event) return null
  
  return {
    ...event,
    // Arrays müssen Arrays sein, nicht null
    players: Array.isArray(event.players) ? event.players : [],
    schedule: Array.isArray(event.schedule) ? event.schedule : [],
    breaks: Array.isArray(event.breaks) ? event.breaks : [],
    dailySchedule: Array.isArray(event.dailySchedule) ? event.dailySchedule : [],
    
    // Objects müssen Objects sein, nicht null
    results: event.results || {},
    
    // Bereinige Zeitfelder von Sekunden
    startTime: event.startTime ? event.startTime.split(':').slice(0, 2).join(':') : '09:00',
    endTime: event.endTime ? event.endTime.split(':').slice(0, 2).join(':') : '13:00',
    
    // Zahlen müssen Zahlen sein
    courts: parseInt(event.courts) || 2,
    maxPlayers: parseInt(event.maxPlayers) || 16,
    roundDuration: parseInt(event.roundDuration) || 15,
    currentRound: parseInt(event.currentRound) || 0,
    
    // Strings mit Defaults
    timerState: event.timerState || 'stopped',
    eventType: event.eventType || 'americano',
    sport: event.sport || 'padel',
    format: event.format || 'doubles'
  }
}

/**
 * Transformiert ein Objekt von snake_case zu camelCase (von Datenbank zu Frontend)
 * @param {Object} obj - Objekt mit snake_case keys
 * @returns {Object} Objekt mit camelCase keys
 */
export const transformFromDB = (obj) => {
  if (!obj) return null;
  
  const transformed = {};
  const processedKeys = new Set();
  
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const camelKey = snakeToCamel(key);
      
      // Skip if we already processed this key (prioritize snake_case)
      if (processedKeys.has(camelKey)) continue;
      processedKeys.add(camelKey);
      
      // SPEZIALBEHANDLUNG für 'sports' - direkt übernehmen ohne Transformation
      if (key === 'sports' && obj[key] !== null && typeof obj[key] === 'object') {
        transformed[camelKey] = obj[key];
        continue;
      }
      
      // SPEZIALBEHANDLUNG für 'daily_schedule' - Array-Struktur beibehalten
      if (key === 'daily_schedule') {
        transformed[camelKey] = Array.isArray(obj[key]) ? obj[key] : [];
        continue;
      }
      
      // SPEZIALBEHANDLUNG für Arrays die null sein könnten
      if ((key === 'schedule' || key === 'players' || key === 'breaks') && obj[key] === null) {
        transformed[camelKey] = [];
        continue;
      }
      
      // Spezielle Behandlung für verschachtelte Objekte und Arrays
      if (obj[key] !== null && typeof obj[key] === 'object') {
        if (Array.isArray(obj[key])) {
          // Arrays direkt übernehmen
          transformed[camelKey] = obj[key];
        } else if (obj[key] instanceof Date) {
          // Dates direkt übernehmen
          transformed[camelKey] = obj[key];
        } else {
          // Verschachtelte Objekte auch transformieren
          transformed[camelKey] = transformFromDB(obj[key]);
        }
      } else {
        transformed[camelKey] = obj[key];
      }
    }
  }
  
  // Nach der Transformation: Sanitize für Events
  if (transformed.eventType !== undefined || transformed.players !== undefined) {
    return sanitizeEventData(transformed);
  }
  
  return transformed;
};

/**
 * Transformiert ein Objekt von camelCase zu snake_case (von Frontend zu Datenbank)
 * @param {Object} obj - Objekt mit camelCase keys
 * @returns {Object} Objekt mit snake_case keys
 */
export const transformToDB = (obj) => {
  if (!obj) return null;
  
  const transformed = {};
  
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const snakeKey = camelToSnake(key);
      
      // SPEZIALBEHANDLUNG für leere Datums-Strings
      if ((key === 'endDate' || key === 'date' || key === 'registrationDeadline' || 
           key === 'completedAt' || key === 'createdAt' || key === 'updatedAt') && 
          obj[key] === '') {
        transformed[snakeKey] = null;
        continue;
      }
      
      // SPEZIALBEHANDLUNG für 'sports' - direkt übernehmen ohne Transformation
      if (key === 'sports' && obj[key] !== null && typeof obj[key] === 'object') {
        transformed[snakeKey] = obj[key];
        continue;
      }
      
      // SPEZIALBEHANDLUNG für 'dailySchedule' - Array-Struktur beibehalten
      if (key === 'dailySchedule' && Array.isArray(obj[key])) {
        transformed[snakeKey] = obj[key];
        continue;
      }
      
      // SPEZIALBEHANDLUNG für undefined Werte - zu null konvertieren
      if (obj[key] === undefined) {
        transformed[snakeKey] = null;
        continue;
      }
      
      // SPEZIALBEHANDLUNG für leere Arrays - als leere Arrays beibehalten, nicht null
      if (key === 'schedule' || key === 'players' || key === 'breaks') {
        if (Array.isArray(obj[key])) {
          transformed[snakeKey] = obj[key];
        } else {
          transformed[snakeKey] = [];
        }
        continue;
      }
      
      // Spezielle Behandlung für verschachtelte Objekte und Arrays
      if (obj[key] !== null && typeof obj[key] === 'object') {
        if (Array.isArray(obj[key])) {
          // Arrays direkt übernehmen
          transformed[snakeKey] = obj[key];
        } else if (obj[key] instanceof Date) {
          // Dates direkt übernehmen
          transformed[snakeKey] = obj[key];
        } else {
          // Verschachtelte Objekte auch transformieren
          transformed[snakeKey] = transformToDB(obj[key]);
        }
      } else {
        transformed[snakeKey] = obj[key];
      }
    }
  }
  
  return transformed;
};

/**
 * Bereitet Event-Daten für das Speichern in der Datenbank vor
 * Konvertiert leere Arrays zu null wenn gewünscht (für kleinere DB-Größe)
 * @param {Object} event - Event-Objekt
 * @param {boolean} keepEmptyArrays - Ob leere Arrays beibehalten werden sollen
 * @returns {Object} Vorbereitetes Event-Objekt
 */
export const prepareEventForDB = (event, keepEmptyArrays = true) => {
  const prepared = { ...event }
  
  // Optional: Konvertiere leere Arrays zu null
  if (!keepEmptyArrays) {
    if (Array.isArray(prepared.schedule) && prepared.schedule.length === 0) {
      prepared.schedule = null
    }
    if (Array.isArray(prepared.breaks) && prepared.breaks.length === 0) {
      prepared.breaks = null
    }
    if (Array.isArray(prepared.dailySchedule) && prepared.dailySchedule.length === 0) {
      prepared.dailySchedule = null
    }
  }
  
  // Stelle sicher, dass players immer ein Array ist (niemals null)
  if (!Array.isArray(prepared.players)) {
    prepared.players = []
  }
  
  // Entferne undefined Werte
  Object.keys(prepared).forEach(key => {
    if (prepared[key] === undefined) {
      delete prepared[key]
    }
  })
  
  return prepared
}

/**
 * Mapping-Referenz für häufig verwendete Felder
 * Frontend (camelCase) → Datenbank (snake_case)
 */
export const fieldMapping = {
  // Event-Felder
  startTime: 'start_time',
  endTime: 'end_time',
  endDate: 'end_date',
  roundDuration: 'round_duration',
  eventType: 'event_type',
  genderMode: 'gender_mode',
  teamFormat: 'team_format',
  registrationDeadline: 'registration_deadline',
  registrationOpen: 'registration_open',
  regenerateCount: 'regenerate_count',
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  completedAt: 'completed_at',
  userId: 'user_id',
  organisationId: 'organisation_id',
  eventInfo: 'event_info',
  entryFee: 'entry_fee',
  maxPlayers: 'max_players',
  dailySchedule: 'daily_schedule',
  flexibleTimes: 'flexible_times',
  minPlayTimeMinutes: 'min_play_time_minutes',
  isPublic: 'is_public',
  timerState: 'timer_state',
  currentRound: 'current_round',
  
  // Player-Felder
  padelSkill: 'padel_skill',
  pickleballSkill: 'pickleball_skill',
  spinxballSkill: 'spinxball_skill',
  duprId: 'dupr_id',
  skillLevel: 'skill_level',
  skillLevels: 'skill_levels',
  
  // Sonstige
  sports: 'sports',
  phone: 'phone',
  email: 'email',
  birthday: 'birthday',
  city: 'city',
  country: 'country',
  nationality: 'nationality',
  club: 'club'
};

/**
 * Hilfsfunktion für Batch-Transformationen
 * @param {Array} array - Array von Objekten
 * @param {Function} transformFn - transformFromDB oder transformToDB
 * @returns {Array} Transformiertes Array
 */
export const transformArray = (array, transformFn) => {
  if (!Array.isArray(array)) return [];
  return array.map(item => transformFn(item));
};

/**
 * Debug-Funktion zum Anzeigen der Transformation
 * @param {Object} original - Original-Objekt
 * @param {Object} transformed - Transformiertes Objekt
 */
export const debugTransformation = (original, transformed) => {
  console.group('🔄 Datenbank-Transformation');
  console.log('Original:', original);
  console.log('Transformiert:', transformed);
  console.log('Feld-Mapping:');
  for (const key in original) {
    const newKey = Object.keys(transformed).find(k => 
      transformed[k] === original[key]
    );
    if (newKey && newKey !== key) {
      console.log(`  ${key} → ${newKey}`);
    }
  }
  console.groupEnd();
};

/**
 * Bereinigt Event-Daten vor dem Speichern in die Datenbank
 * @param {Object} event - Event-Objekt
 * @returns {Object} Bereinigtes Event-Objekt
 */
export const cleanEventData = (event) => {
  const cleaned = { ...event };
  
  // Entferne temporäre oder UI-spezifische Felder
  delete cleaned.showAdvancedOptions;
  delete cleaned.flexibleTimesEnabled;
  
  // Stelle sicher, dass erforderliche Felder vorhanden sind
  if (!cleaned.date) {
    cleaned.date = new Date().toISOString().split('T')[0];
  }
  
  // Konvertiere leere Strings zu null für optionale Felder
  const optionalFields = ['endDate', 'phone', 'location', 'eventInfo', 'registrationDeadline'];
  optionalFields.forEach(field => {
    if (cleaned[field] === '') {
      cleaned[field] = null;
    }
  });
  
  // Stelle sicher, dass Arrays Arrays sind (niemals null für diese Felder)
  if (!Array.isArray(cleaned.players)) {
    cleaned.players = [];
  }
  if (!Array.isArray(cleaned.schedule)) {
    cleaned.schedule = [];
  }
  if (!Array.isArray(cleaned.breaks)) {
    cleaned.breaks = [];
  }
  if (!Array.isArray(cleaned.dailySchedule)) {
    cleaned.dailySchedule = [];
  }
  
  // Stelle sicher, dass results ein Objekt ist
  if (!cleaned.results || typeof cleaned.results !== 'object') {
    cleaned.results = {};
  }
  
  // Stelle sicher, dass Zahlen Zahlen sind
  const numericFields = ['courts', 'maxPlayers', 'roundDuration', 'entryFee', 'mindestSpiele', 'mindestMinuten', 'currentRound'];
  numericFields.forEach(field => {
    if (typeof cleaned[field] === 'string') {
      cleaned[field] = parseFloat(cleaned[field]) || 0;
    }
  });
  
  // Setze Default-Werte für wichtige Felder
  cleaned.timerState = cleaned.timerState || 'stopped';
  cleaned.currentRound = cleaned.currentRound || 0;
  
  return cleaned;
};

/**
 * Bereinigt Player-Daten vor dem Speichern
 * @param {Object} player - Player-Objekt
 * @returns {Object} Bereinigtes Player-Objekt
 */
export const cleanPlayerData = (player) => {
  const cleaned = { ...player };
  
  // Stelle sicher, dass erforderliche Felder vorhanden sind
  if (!cleaned.name) {
    throw new Error('Player name is required');
  }
  
  // Setze Defaults für optionale Felder
  cleaned.gender = cleaned.gender || 'male';
  cleaned.sports = cleaned.sports || { padel: false, pickleball: false, spinxball: false };
  
  // Konvertiere leere Strings zu null
  const optionalFields = ['email', 'phone', 'birthday', 'city', 'country', 'nationality', 'club', 'duprId'];
  optionalFields.forEach(field => {
    if (cleaned[field] === '') {
      cleaned[field] = null;
    }
  });
  
  return cleaned;
};

// Beispiel-Verwendung in Kommentaren:
/**
 * VERWENDUNG:
 * 
 * // Beim Lesen aus der Datenbank:
 * const { data, error } = await supabase.from('events').select('*');
 * const events = data.map(transformFromDB);
 * 
 * // Beim Schreiben in die Datenbank:
 * const cleanedEvent = cleanEventData(myEvent);
 * const eventForDB = transformToDB(cleanedEvent);
 * await supabase.from('events').insert(eventForDB);
 * 
 * // Für Arrays:
 * const transformedEvents = transformArray(rawEvents, transformFromDB);
 * 
 * // Zum Debuggen:
 * debugTransformation(rawData, transformedData);
 */