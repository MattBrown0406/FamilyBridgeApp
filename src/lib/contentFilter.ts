// Profanity and abuse detection utility
// This is a basic filter - in production, consider using a more robust API

const profanityList = [
  'fuck', 'shit', 'damn', 'ass', 'bitch', 'bastard', 'crap', 'piss', 
  'dick', 'cock', 'pussy', 'slut', 'whore', 'fag', 'retard', 'cunt',
  'asshole', 'bullshit', 'motherfucker', 'nigger', 'nigga'
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

export function filterContent(content: string): FilterResult {
  const originalContent = content;
  let filteredContent = content;
  const flaggedWords: string[] = [];
  let wasAbusive = false;

  // Check for profanity
  profanityList.forEach(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    if (regex.test(filteredContent)) {
      flaggedWords.push(word);
      filteredContent = filteredContent.replace(regex, '*'.repeat(word.length));
    }
  });

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
  return profanityList.some(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    return regex.test(content);
  });
}

export function containsAbusiveLanguage(content: string): boolean {
  return abusivePatterns.some(pattern => pattern.test(content));
}
