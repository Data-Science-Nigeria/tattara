/**
 * Convert language code to full language name expected by backend
 */
export function getLanguageForBackend(code: string): string {
  const languageMap: Record<string, string> = {
    en: 'English',
    yo: 'Yoruba',
    ig: 'Igbo',
    ha: 'Hausa',
  };
  return languageMap[code] || 'English';
}

/**
 * Convert full language name from backend to language code
 */
export function getLanguageCode(name: string): string {
  const reverseMap: Record<string, string> = {
    English: 'en',
    Yoruba: 'yo',
    Igbo: 'ig',
    Hausa: 'ha',
  };
  return reverseMap[name] || name.toLowerCase();
}

/**
 * Get display name for language code or full name
 */
export function getLanguageName(codeOrName: string): string {
  // If it's already a full name, return it
  if (['English', 'Yoruba', 'Igbo', 'Hausa'].includes(codeOrName)) {
    return codeOrName;
  }
  // Otherwise convert code to name
  return getLanguageForBackend(codeOrName);
}
