export const fixEncoding = (text) => {
  if (!text || typeof text !== 'string') return text;
  
  const fixes = {
    // Deutsche Umlaute
    'Ã¤': 'ä', 'Ã¶': 'ö', 'Ã¼': 'ü', 'ÃŸ': 'ß',
    'Ã„': 'Ä', 'Ã–': 'Ö', 'Ãœ': 'Ü',
    
    // Spanische Zeichen
    'Ã±': 'ñ', 'Ã©': 'é', 'Ã­': 'í', 'Ã³': 'ó', 'Ãº': 'ú',
    'Ã¡': 'á', 'Ã': 'Ñ',
    
    // Französische Zeichen
    'Ã¨': 'è', 'Ã ': 'à', 'Ã§': 'ç', 'Ã´': 'ô', 'Ã¢': 'â',
    
    // Länder-Namen Fixes
    'EspaÃ±a': 'España',
    'Deutschland': 'Deutschland',
    'Ã–sterreich': 'Österreich',
    'BelgiÃ«': 'België',
    'DÃ¤nemark': 'Dänemark',
    
    // Weitere häufige
    'Ã¯': 'ï', 'Ã«': 'ë', 'Ã®': 'î', 'Ã¬': 'ì'
  };
  
  let fixed = text;
  Object.entries(fixes).forEach(([bad, good]) => {
    fixed = fixed.replace(new RegExp(bad, 'g'), good);
  });
  
  return fixed;
};