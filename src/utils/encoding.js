﻿export const fixEncoding = (text) => {
  if (!text || typeof text !== 'string') return text;
  
  const fixes = {
    'Ã¤': 'ä', 'Ã¶': 'ö', 'Ã¼': 'ü', 'ÃŸ': 'ß',
    'Ã„': 'Ä', 'Ã–': 'Ö', 'Ãœ': 'Ü',
    'Ã±': 'ñ', 'Ã©': 'é', 'Ã­': 'í', 'Ã³': 'ó', 'Ãº': 'ú',
    'Ã¡': 'á', 'Ã': 'Ñ',
    'Ã¨': 'è', 'Ã ': 'à', 'Ã§': 'ç', 'Ã´': 'ô', 'Ã¢': 'â',
    'EspaÃ±a': 'España',
    'Ã–sterreich': 'Österreich',
    'BelgiÃ«': 'België',
    'DÃ¤nemark': 'Dänemark',
    'Ã¯': 'ï', 'Ã«': 'ë', 'Ã®': 'î', 'Ã¬': 'ì'
  };
  
  let fixed = text;
  Object.entries(fixes).forEach(([bad, good]) => {
    fixed = fixed.replace(new RegExp(bad, 'g'), good);
  });
  
  return fixed;
};