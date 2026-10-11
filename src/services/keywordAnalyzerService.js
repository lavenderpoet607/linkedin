const ROLE_KEYWORD_TAXONOMY = {
  'frontend engineer': [
    'javascript',
    'typescript',
    'react',
    'css',
    'html',
    'web performance',
    'accessibility',
    'testing',
    'state management',
    'rest api'
  ],
  'backend engineer': [
    'nodejs',
    'python',
    'go',
    'sql',
    'postgresql',
    'database design',
    'distributed systems',
    'microservices',
    'api design',
    'docker'
  ],
  'full stack engineer': [
    'typescript',
    'javascript',
    'react',
    'nodejs',
    'sql',
    'api design',
    'docker',
    'git',
    'ci/cd',
    'system architecture'
  ],
  'devops engineer': [
    'ci/cd',
    'kubernetes',
    'docker',
    'terraform',
    'linux',
    'cloud infrastructure',
    'monitoring',
    'observability',
    'bash',
    'security'
  ],
  'data engineer': [
    'python',
    'sql',
    'etl',
    'data pipeline',
    'spark',
    'data warehousing',
    'bigquery',
    'kafka',
    'data modeling',
    'orchestration'
  ]
};

function countSyllables(word) {
  const clean = word.toLowerCase().replace(/[^a-z]/g, '');
  if (clean.length <= 3) return 1;
  const replaced = clean
    .replace(/(?:[^laeiouy]|ed|es|e)$/, '')
    .replace(/^y/, '');
  const matches = replaced.match(/[aeiouy]{1,2}/g);
  return matches ? matches.length : 1;
}

export class KeywordAnalyzerService {
  analyze({ profile, jobDescription = '' }) {
    const combinedProfileText = [
      profile.headline || '',
      profile.about || '',
      (profile.skills || []).join(' '),
      ...(profile.experience || []).flatMap((e) => [
        e.title || '',
        e.company || '',
        ...(e.responsibilities || []),
        ...(e.tech_stack || []),
        ...(e.achievements_metrics || [])
      ])
    ]
      .join(' ')
      .toLowerCase();

    const words = combinedProfileText
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 2);

    const totalWordCount = words.length;

    const freqMap = {};
    for (const w of words) {
      freqMap[w] = (freqMap[w] || 0) + 1;
    }

    const keywordFrequencies = Object.entries(freqMap)
      .map(([keyword, count]) => {
        const density = totalWordCount > 0 ? (count / totalWordCount) * 100 : 0;
        return {
          keyword,
          count,
          density: parseFloat(density.toFixed(2)),
          isStuffed: density > 3.5
        };
      })
      .sort((a, b) => b.count - a.count);

    const targetRole = (profile.target_role || '').toLowerCase().trim();
    let expectedKeywords = [];
    for (const [roleKey, keyList] of Object.entries(ROLE_KEYWORD_TAXONOMY)) {
      if (targetRole.includes(roleKey) || roleKey.includes(targetRole)) {
        expectedKeywords = keyList;
        break;
      }
    }
    if (expectedKeywords.length === 0) {
      expectedKeywords = [
        'system architecture',
        'api design',
        'code review',
        'unit testing',
        'ci/cd',
        'performance optimization',
        'git',
        'problem solving'
      ];
    }

    const matchedKeywords = [];
    const missingKeywords = [];

    for (const kw of expectedKeywords) {
      if (combinedProfileText.includes(kw.toLowerCase())) {
        matchedKeywords.push(kw);
      } else {
        missingKeywords.push(kw);
      }
    }

    let jobMatchScore = null;
    let jobExtractedKeywords = [];
    if (jobDescription && jobDescription.trim().length > 20) {
      const jobWords = jobDescription
        .toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .split(/\s+/)
        .filter((w) => w.length > 3);

      const jobUnique = Array.from(new Set(jobWords)).slice(0, 30);
      jobExtractedKeywords = jobUnique;

      let matchedInJob = 0;
      for (const jw of jobUnique) {
        if (combinedProfileText.includes(jw)) {
          matchedInJob += 1;
        }
      }
      jobMatchScore = jobUnique.length > 0 ? Math.round((matchedInJob / jobUnique.length) * 100) : 0;
    }

    const sentences = (profile.about || '')
      .split(/[.!?]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    const sentenceCount = Math.max(sentences.length, 1);
    const aboutWords = (profile.about || '')
      .split(/\s+/)
      .filter((w) => w.length > 0);
    const aboutWordCount = aboutWords.length;

    let totalSyllables = 0;
    for (const w of aboutWords) {
      totalSyllables += countSyllables(w);
    }

    const wordsPerSentence = aboutWordCount / sentenceCount;
    const syllablesPerWord = aboutWordCount > 0 ? totalSyllables / aboutWordCount : 1;
    const readingEase = Math.round(206.835 - 1.015 * wordsPerSentence - 84.6 * syllablesPerWord);
    const clampedReadingEase = Math.max(0, Math.min(100, readingEase));

    let readabilityLabel = 'Optimal';
    if (clampedReadingEase < 40) readabilityLabel = 'Complex: Consider shorter sentences';
    else if (clampedReadingEase > 80) readabilityLabel = 'Very Easy: Simple structure';

    const atsScore = Math.round(
      (matchedKeywords.length / expectedKeywords.length) * 70 + (Math.min(totalWordCount, 400) / 400) * 30
    );

    return {
      totalWordCount,
      atsScore: Math.min(atsScore, 100),
      matchedKeywords,
      missingKeywords,
      topKeywords: keywordFrequencies.slice(0, 15),
      stuffedKeywords: keywordFrequencies.filter((k) => k.isStuffed).map((k) => k.keyword),
      jobMatchScore,
      readability: {
        fleschScore: clampedReadingEase,
        label: readabilityLabel,
        sentenceCount,
        averageSentenceLength: parseFloat(wordsPerSentence.toFixed(1))
      }
    };
  }
}

export const keywordAnalyzerService = new KeywordAnalyzerService();
