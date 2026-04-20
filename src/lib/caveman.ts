/**
 * Caveman Compression — TypeScript port of caveman_compress_nlp.py
 * https://github.com/wilpel/caveman-compression
 *
 * Strips predictable grammar (articles, auxiliaries, determiners, filler
 * adverbs, connectives) while preserving facts, names, numbers, and
 * technical terms. Targets 15–30% token reduction with no API cost.
 *
 * Only use for text sent to LLMs — not for user-facing output.
 */

// ── Word sets to strip ────────────────────────────────────────────────────────

const ARTICLES = new Set([
  "a", "an", "the",
]);

const AUXILIARIES = new Set([
  "is", "are", "was", "were",
  "have", "has", "had",
  "be", "been", "being",
  "do", "does", "did",
  "will", "would", "shall", "should",
  "may", "might", "can", "could",
]);

const DETERMINERS = new Set([
  "this", "that", "these", "those",
  "such", "each", "every",
  "either", "neither",
]);

const FILLER_ADVERBS = new Set([
  "very", "really", "quite", "extremely",
  "incredibly", "absolutely", "totally",
  "completely", "utterly", "highly",
  "particularly", "especially", "truly",
  "actually", "basically", "essentially",
]);

const CONNECTIVES = new Set([
  "therefore", "however", "furthermore", "moreover",
  "additionally", "consequently", "nevertheless",
  "nonetheless", "subsequently", "accordingly",
  "thus", "hence", "whereby", "namely",
  "notwithstanding",
]);

const COORD_CONJUNCTIONS = new Set(["and", "or"]);

// ── Multi-word phrases to strip first (order matters — longest first) ─────────

const FILLER_PHRASES: [RegExp, string][] = [
  [/\bin order to\b/gi, "to"],
  [/\bas a result of\b/gi, ""],
  [/\bfor the purpose of\b/gi, "for"],
  [/\bdue to the fact that\b/gi, "because"],
  [/\bin addition to\b/gi, ""],
  [/\bwith regard to\b/gi, "about"],
  [/\bin terms of\b/gi, "about"],
  [/\bit is important to note that\b/gi, ""],
  [/\bit should be noted that\b/gi, ""],
  [/\bit is worth noting that\b/gi, ""],
  [/\bplease note that\b/gi, ""],
  [/\bmore often than not\b/gi, "often"],
  [/\bat this point in time\b/gi, "now"],
  [/\bin the event that\b/gi, "if"],
  [/\bfor the most part\b/gi, "mostly"],
  [/\bin spite of the fact that\b/gi, "although"],
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function isUpperCase(word: string): boolean {
  return word.length > 0 && word[0] === word[0].toUpperCase() && word[0] !== word[0].toLowerCase();
}

function isNumber(word: string): boolean {
  return /^[\d.,:%$€£+\-*/=<>]+$/.test(word);
}

function isCode(word: string): boolean {
  // Keep technical identifiers: camelCase, snake_case, O(n), URLs, paths
  return /[_A-Z]/.test(word) && /[a-z]/.test(word)  // camelCase / snake_case
    || /[()[\]{}]/.test(word)                        // O(log n) etc.
    || /https?:\/\//.test(word)                      // URLs
    || /[./\\]/.test(word);                          // paths
}

function stripPunctuation(word: string): string {
  return word.replace(/^[^a-zA-Z0-9]+|[^a-zA-Z0-9]+$/g, "");
}

// ── Core sentence compressor ──────────────────────────────────────────────────

function compressSentence(sentence: string): string {
  const words = sentence.trim().split(/\s+/);
  const kept: string[] = [];

  for (const rawWord of words) {
    const clean = stripPunctuation(rawWord).toLowerCase();

    if (!clean) continue;

    // Always keep: numbers, codes, and capitalized proper nouns
    if (isNumber(rawWord) || isCode(rawWord)) {
      kept.push(rawWord);
      continue;
    }

    // Keep proper nouns (capitalized mid-sentence) — likely names/places
    const isProperNoun = isUpperCase(rawWord) && kept.length > 0;
    if (isProperNoun) {
      kept.push(rawWord);
      continue;
    }

    // Strip word categories
    if (ARTICLES.has(clean)) continue;
    if (AUXILIARIES.has(clean)) continue;
    if (DETERMINERS.has(clean)) continue;
    if (FILLER_ADVERBS.has(clean)) continue;
    if (CONNECTIVES.has(clean)) continue;
    if (COORD_CONJUNCTIONS.has(clean)) continue;

    kept.push(rawWord);
  }

  if (kept.length === 0) return "";

  const joined = kept.join(" ");
  // Ensure sentence ends with a period
  const last = joined[joined.length - 1];
  return last === "." || last === "?" || last === "!" ? joined : joined + ".";
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Compress text using caveman NLP rules.
 * Safe to call on any string — returns original on error.
 */
export function cavemanCompress(text: string): string {
  try {
    // 1. Apply multi-word phrase substitutions
    let processed = text;
    for (const [pattern, replacement] of FILLER_PHRASES) {
      processed = processed.replace(pattern, replacement);
    }

    // 2. Split into sentences (on . ! ? followed by space or end)
    const sentenceRegex = /[^.!?]+[.!?]*/g;
    const sentences = processed.match(sentenceRegex) ?? [processed];

    // 3. Compress each sentence
    const compressed = sentences
      .map((s) => compressSentence(s))
      .filter(Boolean)
      .join(" ");

    if (!compressed.trim()) return text;

    // 4. Capitalize first letter
    return compressed.charAt(0).toUpperCase() + compressed.slice(1);
  } catch {
    return text;
  }
}

/**
 * Estimate token count (chars / 4, same heuristic as the Python original).
 */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * Returns compression stats for display.
 */
export function compressionStats(original: string, compressed: string): {
  originalTokens: number;
  compressedTokens: number;
  reductionPct: number;
} {
  const originalTokens = estimateTokens(original);
  const compressedTokens = estimateTokens(compressed);
  const reductionPct = originalTokens > 0
    ? Math.round(((originalTokens - compressedTokens) / originalTokens) * 100)
    : 0;
  return { originalTokens, compressedTokens, reductionPct };
}
