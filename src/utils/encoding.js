export const fixEncoding = (text) => {
  if (!text) return text;
  
  const fixes = {
    'Ã¤': 'ä', 'Ã¶': 'ö', 'Ã¼': 'ü',
    'Ã©': 'é', 'Ã­': 'í', 'Ã±': 'ñ',
    'Ã': 'Ü', 'Ã¡': 'á', 'Ã³': 'ó',
    'Ã¯': 'ï', 'Ã§': 'ç'
  };
  
  let fixed = text;
  Object.entries(fixes).forEach(([bad, good]) => {
    fixed = fixed.replace(new RegExp(bad, 'g'), good);
  });
  return fixed;
};