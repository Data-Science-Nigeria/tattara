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
 * Get display name for language code
 */
export function getLanguageName(code: string): string {
  return getLanguageForBackend(code);
}
