// Profanity and abuse detection utility
// This filter uses safe-word lists to prevent false positives (the "Scunthorpe problem")

// Words that are unambiguous and unlikely to appear within safe words
const unambiguousProfanity = [
  'fuck', 'shit', 'bitch', 'bastard', 'piss', 'slut', 'whore', 
  'asshole', 'bullshit', 'motherfucker', 'nigger', 'nigga'
];

// Words that commonly appear within legitimate words - need special handling
// Format: { word, safeWords[] } - if the content contains a safeWord, don't flag the profanity within it
const contextualProfanity: { word: string; safeWords: string[] }[] = [
  {
    word: 'ass',
    safeWords: [
      // class family
      'class', 'classic', 'classical', 'classification', 'classified', 'classify', 'classmate', 'classroom', 'classy', 'declassify', 'outclass', 'underclass', 'subclass', 'superclass', 'masterclass', 'workingclass', 'middleclass', 'upperclass', 'lowerclass', 'firstclass', 'worldclass',
      // pass family
      'pass', 'passed', 'passing', 'passage', 'passenger', 'password', 'passport', 'bypass', 'bypassed', 'bypasses', 'surpass', 'surpassed', 'surpasses', 'trespass', 'trespassed', 'trespassing', 'overpass', 'underpass', 'impasse', 'passable', 'impassable', 'passerby', 'passway', 'passthrough',
      // mass family
      'mass', 'massive', 'massage', 'masses', 'amass', 'amassed', 'biomass', 'landmass',
      // bass/grass/glass/brass family
      'bass', 'bassist', 'seabass', 'grass', 'grassy', 'bluegrass', 'grassland', 'grasshopper', 'glass', 'glasses', 'glassy', 'fiberglass', 'hourglass', 'eyeglass', 'sunglasses', 'looking-glass', 'brass', 'brassy', 'brassiere',
      // assist family
      'assist', 'assistant', 'assistance', 'assisted', 'assisting', 'unassisted',
      // assign family
      'assign', 'assigned', 'assignment', 'assigns', 'reassign', 'reassigned', 'unassigned',
      // assess family
      'assess', 'assessed', 'assessment', 'assessor', 'reassess', 'reassessed',
      // asset family
      'asset', 'assets',
      // assume family
      'assume', 'assumed', 'assumes', 'assuming', 'assumption', 'presumption',
      // assure family
      'assure', 'assured', 'assures', 'assurance', 'reassure', 'reassured', 'reassurance',
      // assault family (still negative but legitimate word)
      'assault', 'assaulted', 'assaults', 'assaulting',
      // assemble family
      'assemble', 'assembled', 'assembly', 'assembler', 'reassemble', 'disassemble',
      // assert family
      'assert', 'asserted', 'assertion', 'assertive', 'reassert',
      // associate family
      'associate', 'associated', 'association', 'associates', 'disassociate',
      // other safe words
      'cassette', 'cassava', 'casserole', 'hassle', 'hassled', 'lasso', 'lassoed', 'tassel', 'tassels', 'compass', 'compasses', 'embarrass', 'embarrassed', 'embarrassing', 'embarrassment', 'harass', 'harassed', 'harassment', 'harassing', 'morass', 'carcass', 'carcasses', 'molasses', 'sassy', 'sassafras', 'embassy', 'ambassador', 'canvass', 'canvassed'
    ]
  },
  {
    word: 'crap',
    safeWords: [
      'scrap', 'scrappy', 'scrapbook', 'scraps', 'scrapped', 'scrapping', 'scrapyard', 'scrapheap', 'scraper', 'scraped', 'scraping', 'skyscraper'
    ]
  },
  {
    word: 'dick',
    safeWords: [
      // Names
      'dickens', 'dickensian', 'dickinson', 'dickenson', 'frederick', 'benedick', 'brodick',
      // Other words
      'dickcissel', // a bird
      'medick', 'verdict'
    ]
  },
  {
    word: 'cock',
    safeWords: [
      'peacock', 'peacocks', 'cocktail', 'cocktails', 'cockatoo', 'cockatoos', 'cockpit', 'cockpits', 'hancock', 'weathercock', 'cockle', 'cockles', 'poppycock', 'cocky', 'cocked', 'cocking', 'cockerel', 'cockatiel', 'cockade', 'cockcrow', 'cockleshell', 'gamecock', 'stopcock', 'woodcock', 'shuttlecock', 'haycock', 'petcock', 'babcock', 'hitchcock', 'alcock', 'adcock', 'laycock', 'pocock', 'leacock', 'heathcock'
    ]
  },
  {
    word: 'cunt',
    safeWords: [
      // The famous "Scunthorpe problem" - town in England
      'scunthorpe'
    ]
  },
  {
    word: 'damn',
    safeWords: [
      // Names containing damn
      'amsterdam', 'rotterdam', 'potsdam', 'macadam', 'tarmacadam', 'adam', 'madam', 'madame'
    ]
  },
  {
    word: 'fag',
    safeWords: [
      'fagin', // Character name
      'fagot', 'fagots', // Bundle of sticks (archaic)
    ]
  },
  {
    word: 'retard',
    safeWords: [
      'retardant', 'retardants', 'retarder', 'retarders', 'fire-retardant', 'flame-retardant', 'fireretardant', 'flameretardant'
    ]
  }
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
 * Check if a profanity word appears as actual profanity vs. part of a safe word
 */
function containsStandaloneProfanity(content: string, word: string, safeWords: string[]): boolean {
  const lowerContent = content.toLowerCase();
  
  // First check if the word even appears
  if (!lowerContent.includes(word)) {
    return false;
  }
  
  // Create a working copy to remove safe words from
  let workingContent = lowerContent;
  
  // Remove all instances of safe words (replace with underscores to preserve positions)
  for (const safeWord of safeWords) {
    const safeWordLower = safeWord.toLowerCase();
    if (workingContent.includes(safeWordLower)) {
      workingContent = workingContent.split(safeWordLower).join('_'.repeat(safeWordLower.length));
    }
  }
  
  // Now check if the profanity word still appears as a standalone word
  const standaloneRegex = new RegExp(`\\b${word}\\b`, 'gi');
  return standaloneRegex.test(workingContent);
}

export function filterContent(content: string): FilterResult {
  const originalContent = content;
  let filteredContent = content;
  const flaggedWords: string[] = [];
  let wasAbusive = false;

  // Check for unambiguous profanity (word boundary matching)
  unambiguousProfanity.forEach(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    if (regex.test(filteredContent)) {
      flaggedWords.push(word);
      filteredContent = filteredContent.replace(regex, '*'.repeat(word.length));
    }
  });

  // Check for contextual profanity with safe-word filtering
  contextualProfanity.forEach(({ word, safeWords }) => {
    if (containsStandaloneProfanity(content, word, safeWords)) {
      flaggedWords.push(word);
      // Only replace standalone instances, preserving safe words
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
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
  // Check unambiguous profanity list
  const hasUnambiguous = unambiguousProfanity.some(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    return regex.test(content);
  });
  
  if (hasUnambiguous) return true;
  
  // Check contextual profanity with safe-word filtering
  return contextualProfanity.some(({ word, safeWords }) => 
    containsStandaloneProfanity(content, word, safeWords)
  );
}

export function containsAbusiveLanguage(content: string): boolean {
  return abusivePatterns.some(pattern => pattern.test(content));
}
