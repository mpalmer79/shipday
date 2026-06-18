/**
 * Deterministic, browser-only matching for the ShipDay Project Assistant.
 *
 * Given a free-text question, this scores it against the local knowledge base
 * and returns the best entry — or a fixed fallback when nothing matches well.
 * There is no async behaviour, no fetch, no external package, and no model: the
 * same input always produces the same output. Everything here is pure string
 * work over the local `knowledgeBase`.
 */

import {
  FALLBACK_ANSWER,
  knowledgeBase,
  type KnowledgeEntry,
} from "./knowledge";

/** The result of matching a question. `entry` is null only on the fallback. */
export type MatchResult = {
  /** The matched knowledge entry, or null when we fall back. */
  entry: KnowledgeEntry | null;
  /** The answer text to show (entry answer, or the exact fallback). */
  answer: string;
  /** The category to surface, when an entry matched. */
  category: KnowledgeEntry["category"] | null;
  /** Follow-up questions to offer, when the matched entry defines them. */
  relatedQuestions: string[];
  /** Whether this was a real match (true) or the no-guess fallback (false). */
  matched: boolean;
};

/**
 * Common misspellings, abbreviations, and variants normalized to a canonical
 * token before scoring. This is how we stay typo-tolerant and alias-aware
 * without any external library. Keys are matched per-token after normalization.
 */
const TOKEN_ALIASES: Record<string, string> = {
  // Product / domain aliases
  builder: "studio",
  authoring: "studio",
  author: "studio",
  editor: "studio",
  dossier: "scenario",
  dossiers: "scenario",
  mission: "scenario",
  missions: "scenario",
  debrief: "report",
  afteraction: "report",
  // Determinism / infrastructure aliases
  repeatable: "deterministic",
  reproducible: "deterministic",
  determinism: "deterministic",
  server: "backend",
  db: "database",
  // Tech-stack aliases
  technologies: "technology",
  technologie: "technology",
  tech: "technology",
  stack: "technology",
  nextjs: "next",
  threejs: "three",
  // Risk aliases
  amber: "risk",
  // Common misspellings
  simlator: "simulator",
  simualtor: "simulator",
  simulater: "simulator",
  determinstic: "deterministic",
  determanistic: "deterministic",
  detereministic: "deterministic",
  scenrio: "scenario",
  scenarip: "scenario",
  metrick: "metric",
  qualtiy: "quality",
  recuiter: "recruiter",
  recruter: "recruiter",
  acessibility: "accessibility",
  accesibility: "accessibility",
  architechture: "architecture",
  databse: "database",
};

/** Multi-word phrases collapsed to a single canonical token before tokenizing.
 * These run on the whole normalized string so spaces and hyphens are handled. */
const PHRASE_ALIASES: { pattern: RegExp; replacement: string }[] = [
  { pattern: /\bscenario editor\b/g, replacement: "studio" },
  { pattern: /\brun history\b/g, replacement: "replay" },
  { pattern: /\bdecision trail\b/g, replacement: "replay" },
  { pattern: /\bafter action\b/g, replacement: "report" },
  { pattern: /\bafter-action\b/g, replacement: "report" },
  { pattern: /\bsame result\b/g, replacement: "deterministic" },
  { pattern: /\bno calls\b/g, replacement: "backend" },
  { pattern: /\bred alert\b/g, replacement: "risk" },
  { pattern: /\btest confidence\b/g, replacement: "testconfidence" },
  { pattern: /\btech stack\b/g, replacement: "technology" },
  { pattern: /\bbuilt with\b/g, replacement: "technology" },
];

/** Very common words that carry no signal toward any particular entry. */
const STOP_WORDS = new Set([
  "a",
  "an",
  "the",
  "is",
  "are",
  "do",
  "does",
  "did",
  "it",
  "this",
  "that",
  "to",
  "of",
  "in",
  "on",
  "for",
  "and",
  "or",
  "i",
  "me",
  "my",
  "you",
  "your",
  "we",
  "can",
  "could",
  "would",
  "should",
  "will",
  "what",
  "whats",
  "how",
  "why",
  "when",
  "where",
  "who",
  "which",
  "about",
  "with",
  "any",
  "there",
  "have",
  "has",
  "use",
  "uses",
  "get",
  "gets",
  "from",
  "tell",
  "explain",
  "please",
]);

/** Lowercase, strip punctuation, collapse whitespace. */
function normalize(input: string): string {
  return input
    .toLowerCase()
    .replace(/[’']/g, "")
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Apply phrase aliases to a normalized string. */
function applyPhraseAliases(text: string): string {
  let out = text;
  for (const { pattern, replacement } of PHRASE_ALIASES) {
    out = out.replace(pattern, replacement);
  }
  return out;
}

/** Reduce a word to a rough singular form for practical plural matching. */
function singularize(word: string): string {
  if (word.length > 4 && word.endsWith("ies")) {
    return `${word.slice(0, -3)}y`;
  }
  if (word.length > 4 && word.endsWith("es")) {
    return word.slice(0, -2);
  }
  if (word.length > 3 && word.endsWith("s") && !word.endsWith("ss")) {
    return word.slice(0, -1);
  }
  return word;
}

/** Canonicalize a single token: dehyphenate, de-alias, singularize. */
function canonicalToken(token: string): string {
  const dehyphenated = token.replace(/-/g, "");
  const aliased = TOKEN_ALIASES[token] ?? TOKEN_ALIASES[dehyphenated] ?? token;
  const singular = singularize(aliased);
  return TOKEN_ALIASES[singular] ?? singular;
}

/** Tokenize a normalized, phrase-aliased string into canonical, meaningful
 * tokens with stop-words removed. */
function tokenize(text: string): string[] {
  return applyPhraseAliases(text)
    .split(" ")
    .filter((t) => t.length > 0)
    .map(canonicalToken)
    .filter((t) => t.length > 0 && !STOP_WORDS.has(t));
}

/** Classic Levenshtein edit distance, iterative two-row implementation. Used
 * only for short, conservative typo tolerance against known keywords. */
function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  let curr = new Array<number>(b.length + 1);

  for (let i = 1; i <= a.length; i++) {
    curr[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(
        prev[j] + 1, // deletion
        curr[j - 1] + 1, // insertion
        prev[j - 1] + cost // substitution
      );
    }
    [prev, curr] = [curr, prev];
  }
  return prev[b.length];
}

/** Conservative typo tolerance: is `token` within an allowed edit distance of
 * `known`? Distance 1 for short words, distance 2 for words 6+ chars. We never
 * fuzz across very short words where a single edit changes meaning entirely. */
function isTypoMatch(token: string, known: string): boolean {
  if (token === known) return true;
  if (token.length < 4 || known.length < 4) return false;
  const allowed = Math.min(token.length, known.length) >= 6 ? 2 : 1;
  return levenshtein(token, known) <= allowed;
}

/** Score weights. Exact phrase hits dominate; keyword and overlap fill in. */
const WEIGHT = {
  exactQuestion: 100,
  questionTokenOverlap: 6,
  keywordExact: 10,
  keywordTypo: 5,
  tokenOverlap: 4,
} as const;

/** Minimum score for a match to be trusted over the no-guess fallback. */
const SCORE_THRESHOLD = 12;
/** If the runner-up is within this margin, prefer the broader/safer entry. */
const AMBIGUITY_MARGIN = 4;

/** Broadness ranking: when two entries tie, the lower number is the "safer,
 * broader" answer to return rather than a narrow one. */
const BREADTH_ORDER: string[] = [
  "overview",
  "determinism",
  "tech-stack",
  "simulator",
  "runs",
  "studio",
  "scenarios",
  "metrics",
  "risk",
  "recruiter-value",
  "accessibility",
];

function breadthRank(id: string): number {
  const idx = BREADTH_ORDER.indexOf(id);
  return idx === -1 ? BREADTH_ORDER.length : idx;
}

/** Score a single entry against the already-tokenized question. */
function scoreEntry(
  entry: KnowledgeEntry,
  normalizedQuestion: string,
  questionTokens: string[]
): number {
  let score = 0;

  // Exact-ish question phrase matching: a strong, near-unambiguous signal.
  for (const q of entry.questions) {
    const nq = normalize(q);
    if (nq === normalizedQuestion) {
      score += WEIGHT.exactQuestion;
      continue;
    }
    // Token overlap with each canonical question phrasing.
    const qTokens = new Set(tokenize(nq));
    if (qTokens.size === 0) continue;
    let shared = 0;
    for (const t of questionTokens) {
      if (qTokens.has(t)) shared += 1;
    }
    score += shared * WEIGHT.questionTokenOverlap;
  }

  // Keyword matching, including conservative typo tolerance. Canonicalize the
  // entry keywords too so aliases line up on both sides.
  const keywordSet = new Set(entry.keywords.map(canonicalToken));
  const seen = new Set<string>();
  for (const token of questionTokens) {
    if (seen.has(token)) continue;
    seen.add(token);
    if (keywordSet.has(token)) {
      score += WEIGHT.keywordExact;
      continue;
    }
    // Typo-tolerant keyword match against the known keywords only.
    let typoHit = false;
    for (const kw of keywordSet) {
      if (isTypoMatch(token, kw)) {
        typoHit = true;
        break;
      }
    }
    if (typoHit) score += WEIGHT.keywordTypo;
  }

  return score;
}

/**
 * Match a free-text question against the local knowledge base.
 *
 * Pure and synchronous. Returns the best entry when it clears the threshold,
 * preferring the broader/safer entry when the top two scores are close;
 * otherwise returns the exact no-guess fallback.
 */
export function matchQuestion(question: string): MatchResult {
  const normalized = normalize(question);

  if (normalized.length === 0) {
    return {
      entry: null,
      answer: FALLBACK_ANSWER,
      category: null,
      relatedQuestions: [],
      matched: false,
    };
  }

  const questionTokens = tokenize(normalized);

  const scored = knowledgeBase
    .map((entry) => ({
      entry,
      score: scoreEntry(entry, normalized, questionTokens),
    }))
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      // Deterministic tie-break: prefer the broader entry, then by id.
      const rank = breadthRank(a.entry.id) - breadthRank(b.entry.id);
      if (rank !== 0) return rank;
      return a.entry.id.localeCompare(b.entry.id);
    });

  const best = scored[0];

  if (!best || best.score < SCORE_THRESHOLD) {
    return {
      entry: null,
      answer: FALLBACK_ANSWER,
      category: null,
      relatedQuestions: [],
      matched: false,
    };
  }

  // Ambiguity guard: if a close runner-up exists, return whichever of the two
  // is the broader, safer entry rather than committing to a narrow answer.
  let chosen = best.entry;
  const runnerUp = scored[1];
  if (
    runnerUp &&
    best.score - runnerUp.score <= AMBIGUITY_MARGIN &&
    breadthRank(runnerUp.entry.id) < breadthRank(best.entry.id)
  ) {
    chosen = runnerUp.entry;
  }

  return {
    entry: chosen,
    answer: chosen.answer,
    category: chosen.category,
    relatedQuestions: chosen.relatedQuestions ?? [],
    matched: true,
  };
}
