// Profanity and abuse detection utility
// This is a basic filter - in production, consider using a more robust API

// Words that should only match as standalone words (not within other words)
const profanityList = [
  'fuck', 'shit', 'damn', 'bitch', 'bastard', 'crap', 'piss', 
  'dick', 'cock', 'pussy', 'slut', 'whore', 'fag', 'retard', 'cunt',
  'asshole', 'bullshit', 'motherfucker', 'nigger', 'nigga'
];

// Common words that contain "ass" but are NOT profanity - used to prevent false positives
const safeWordsContainingAss = [
  'class', 'classic', 'classical', 'classification', 'classified', 'classify',
  'pass', 'passed', 'passing', 'passage', 'passenger', 'password', 'passport',
  'mass', 'massive', 'massage', 'masses',
  'bass', 'bassist',
  'grass', 'grassy',
  'glass', 'glasses', 'glassy',
  'brass', 'brassy',
  'assist', 'assistant', 'assistance', 'assisted',
  'assign', 'assigned', 'assignment', 'assigns',
  'assess', 'assessed', 'assessment', 'assessor',
  'asset', 'assets',
  'assume', 'assumed', 'assumes', 'assuming', 'assumption',
  'assure', 'assured', 'assures', 'assurance',
  'assault', 'assaulted', 'assaults',
  'assemble', 'assembled', 'assembly',
  'assert', 'asserted', 'assertion', 'assertive',
  'associate', 'associated', 'association', 'associates',
  'cassette', 'cassava',
  'hassle', 'hassled',
  'lasso', 'lassoed',
  'tassel', 'tassels',
  'compass', 'compasses',
  'embarrass', 'embarrassed', 'embarrassing', 'embarrassment',
  'harass', 'harassed', 'harassment', 'harassing',
  'amass', 'amassed',
  'surpass', 'surpassed', 'surpasses',
  'bypass', 'bypassed', 'bypasses',
  'trespass', 'trespassed', 'trespassing',
  'impasse',
  'morass',
  'carcass', 'carcasses'
];

const abusivePatterns = [
  /you('re| are)?\s*(stupid|idiot|dumb|worthless|useless|pathetic)/gi,
  /i\s*(hate|despise)\s*you/gi,
  /go\s*(to hell|die|kill yourself)/gi,
  /you\s*(make me sick|disgust me)/gi,
  /i('ll|'m going to|will)\s*(kill|hurt|destroy)\s*you/gi,
  /you('re| are)?\s*(a\s*)?(piece of (shit|crap)|loser|failure)/gi,
  /shut\s*(the fuck)?\s*up/gi,
  /you\s*don't\s*deserve/gi,
  /nobody\s*(loves|cares about)\s*you/gi,
];

interface FilterResult {
  isClean: boolean;
  filteredContent: string;
  originalContent: string;
  flaggedWords: string[];
  wasAbusive: boolean;
}

/**
 * Check if "ass" appears as actual profanity vs. part of a safe word
 */
function containsStandaloneAss(content: string): boolean {
  const lowerContent = content.toLowerCase();
  
  // Check if any safe word containing "ass" is present
  for (const safeWord of safeWordsContainingAss) {
    if (lowerContent.includes(safeWord)) {
      // Temporarily remove the safe word to check for other instances
      const withoutSafeWord = lowerContent.replace(new RegExp(safeWord, 'gi'), '___');
      // If "ass" still appears after removing safe words, it might be standalone
      if (!withoutSafeWord.includes('ass')) {
        return false; // Only safe word instances found
      }
    }
  }
  
  // Check for standalone "ass" using word boundaries
  const standaloneRegex = /\bass\b/gi;
  return standaloneRegex.test(content);
}

export function filterContent(content: string): FilterResult {
  const originalContent = content;
  let filteredContent = content;
  const flaggedWords: string[] = [];
  let wasAbusive = false;

  // Check for standard profanity (word boundary matching)
  profanityList.forEach(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    if (regex.test(filteredContent)) {
      flaggedWords.push(word);
      filteredContent = filteredContent.replace(regex, '*'.repeat(word.length));
    }
  });

  // Special handling for "ass" to avoid false positives like "class", "pass", etc.
  if (containsStandaloneAss(content)) {
    flaggedWords.push('ass');
    // Only replace standalone instances
    filteredContent = filteredContent.replace(/\bass\b/gi, '***');
  }

  // Check for abusive patterns
  abusivePatterns.forEach(pattern => {
    if (pattern.test(content)) {
      wasAbusive = true;
      filteredContent = filteredContent.replace(pattern, '[message filtered for harmful content]');
    }
  });

  return {
    isClean: flaggedWords.length === 0 && !wasAbusive,
    filteredContent,
    originalContent,
    flaggedWords,
    wasAbusive,
  };
}

export function containsProfanity(content: string): boolean {
  // Check standard profanity list
  const hasStandardProfanity = profanityList.some(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    return regex.test(content);
  });
  
  if (hasStandardProfanity) return true;
  
  // Check for standalone "ass"
  return containsStandaloneAss(content);
}

export function containsAbusiveLanguage(content: string): boolean {
  return abusivePatterns.some(pattern => pattern.test(content));
}
