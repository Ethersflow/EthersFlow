/**
 * Embedding & Neural Vector Search Service
 * Powered by OpenRouter nvidia/nemotron-3-embed-1b:free embedding endpoint
 * with local vector & cosine similarity fallbacks.
 */

export interface VectorMatch {
  text: string;
  score: number; // 0.0 to 1.0 (Hybrid Vector + BM25 Similarity Score)
  vectorScore?: number;
  bm25Score?: number;
  index: number;
}

export interface VectorSearchResponse {
  matches: VectorMatch[];
  model: string;
  queryVector?: number[];
  dimension?: number;
}

/**
 * Splits document text into overlapping sliding window chunks.
 * Default target chunk size ~2,000 chars (~500 tokens), with ~400 char overlap (~100 tokens).
 * Preserves semantic continuity across sentence/paragraph boundaries.
 */
export function chunkTextSlidingWindow(
  text: string,
  chunkSize: number = 2000,
  overlap: number = 400
): string[] {
  if (!text || !text.trim()) return [];
  const cleaned = text.trim();
  if (cleaned.length <= chunkSize) {
    return [cleaned];
  }

  const chunks: string[] = [];
  let start = 0;

  while (start < cleaned.length) {
    let end = start + chunkSize;

    if (end < cleaned.length) {
      // Find sentence or paragraph boundary within last 300 chars of the window
      const searchZone = cleaned.slice(Math.max(start, end - 300), Math.min(cleaned.length, end + 100));
      const boundaryMatch = searchZone.search(/(?<=[.!?\n])\s+/);
      if (boundaryMatch !== -1) {
        end = Math.max(start, end - 300) + boundaryMatch;
      }
    } else {
      end = cleaned.length;
    }

    const chunk = cleaned.slice(start, end).trim();
    if (chunk.length >= 25) {
      chunks.push(chunk);
    }

    if (end >= cleaned.length) break;
    start = Math.max(start + 1, end - overlap);
  }

  return chunks;
}

/**
 * Computes BM25 lexical term-frequency & inverse document frequency scores for query against documents
 */
export function computeBM25Scores(query: string, documents: string[]): number[] {
  if (!query || !documents || documents.length === 0) return documents ? documents.map(() => 0) : [];

  const tokenize = (text: string) =>
    text.toLowerCase().replace(/[^\w\s\$\%\-\.]/g, '').split(/\s+/).filter(Boolean);

  const queryTerms = tokenize(query);
  if (queryTerms.length === 0) return documents.map(() => 0);

  const docTokens = documents.map(d => tokenize(d));
  const N = documents.length;
  const avgdl = docTokens.reduce((sum, d) => sum + d.length, 0) / (N || 1);

  // Document frequency
  const df: Record<string, number> = {};
  for (const term of queryTerms) {
    df[term] = docTokens.filter(d => d.includes(term)).length;
  }

  const k1 = 1.2;
  const b = 0.75;

  const rawScores = docTokens.map((doc) => {
    let score = 0;
    const docLen = doc.length;
    const termFreqs: Record<string, number> = {};
    for (const t of doc) {
      termFreqs[t] = (termFreqs[t] || 0) + 1;
    }

    for (const term of queryTerms) {
      const freq = termFreqs[term] || 0;
      if (freq > 0) {
        const idf = Math.log((N - (df[term] || 0) + 0.5) / ((df[term] || 0) + 0.5) + 1);
        const numerator = freq * (k1 + 1);
        const denominator = freq + k1 * (1 - b + b * (docLen / (avgdl || 1)));
        score += idf * (numerator / denominator);
      }
    }
    return Math.max(0, score);
  });

  const maxScore = Math.max(...rawScores, 0.00001);
  return rawScores.map(s => Math.min(1, Math.max(0, s / maxScore)));
}

/**
 * Calculates Cosine Similarity between two numerical vectors
 */
export function calculateCosineSimilarity(vecA: number[], vecB: number[]): number {
  if (!vecA || !vecB || vecA.length !== vecB.length || vecA.length === 0) return 0;
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  if (denominator === 0) return 0;

  const sim = dotProduct / denominator;
  // Normalize to 0 - 1 range
  return Math.max(0, Math.min(1, (sim + 1) / 2));
}

/**
 * Calls backend to generate vector embeddings using nvidia/nemotron-3-embed-1b:free
 */
export async function generateEmbeddings(texts: string[]): Promise<{ vectors: number[][]; dimension: number; model: string }> {
  if (!texts || texts.length === 0) {
    return { vectors: [], dimension: 0, model: 'nvidia/nemotron-3-embed-1b:free' };
  }

  try {
    const response = await fetch('/api/embeddings/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ texts })
    });

    if (!response.ok) {
      throw new Error(`Embedding API returned HTTP ${response.status}`);
    }

    const data = await response.json();
    return {
      vectors: data.vectors || [],
      dimension: data.dimension || 1024,
      model: data.model || 'nvidia/nemotron-3-embed-1b:free'
    };
  } catch (error) {
    console.warn('[EmbeddingService] Vector endpoint fallback active:', error);
    // Fallback vector generation
    const fallbackVectors = texts.map(t => generateFallbackVector(t, 128));
    return {
      vectors: fallbackVectors,
      dimension: 128,
      model: 'nvidia/nemotron-3-embed-1b:free (local fallback)'
    };
  }
}

/**
 * Performs semantic vector search grounding across document chunks using Nemotron embeddings
 */
export async function performVectorSearch(
  query: string,
  documents: string[],
  topK: number = 5
): Promise<VectorSearchResponse> {
  if (!query.trim() || !documents || documents.length === 0) {
    return { matches: [], model: 'nvidia/nemotron-3-embed-1b:free' };
  }

  try {
    const response = await fetch('/api/embeddings/vector-search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, documents, topK })
    });

    if (!response.ok) {
      throw new Error(`Vector Search API returned HTTP ${response.status}`);
    }

    const data = await response.json();
    return {
      matches: data.matches || [],
      model: data.model || 'nvidia/nemotron-3-embed-1b:free',
      queryVector: data.queryVector,
      dimension: data.dimension
    };
  } catch (error) {
    console.warn('[EmbeddingService] Performing client-side fallback vector search:', error);
    
    // Client-side fallback hybrid semantic + BM25 lexical scoring
    const queryVec = generateFallbackVector(query, 128);
    const bm25Scores = computeBM25Scores(query, documents);

    const matches: VectorMatch[] = documents.map((doc, idx) => {
      const docVec = generateFallbackVector(doc, 128);
      const vectorScore = calculateCosineSimilarity(queryVec, docVec);
      const bm25Score = bm25Scores[idx] || 0;
      // Hybrid score weighting: 60% Neural Vector Cosine Similarity + 40% BM25 Lexical Matching
      const hybridScore = 0.6 * vectorScore + 0.4 * bm25Score;
      return { text: doc, score: hybridScore, vectorScore, bm25Score, index: idx };
    });

    matches.sort((a, b) => b.score - a.score);

    return {
      matches: matches.slice(0, topK),
      model: 'nvidia/nemotron-3-embed-1b:free (local fallback)',
      queryVector: queryVec,
      dimension: 128
    };
  }
}

/**
 * Simple deterministic character/term-frequency feature hashing for fallback vector space
 */
function generateFallbackVector(text: string, dim: number = 128): number[] {
  const vec = new Array(dim).fill(0);
  const words = text.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/).filter(Boolean);

  if (words.length === 0) return vec;

  for (const word of words) {
    let hash = 0;
    for (let i = 0; i < word.length; i++) {
      hash = (hash << 5) - hash + word.charCodeAt(i);
      hash |= 0;
    }
    const idx = Math.abs(hash) % dim;
    vec[idx] += 1;
  }

  // L2 Normalize
  const norm = Math.sqrt(vec.reduce((sum, val) => sum + val * val, 0));
  if (norm > 0) {
    for (let i = 0; i < dim; i++) {
      vec[i] /= norm;
    }
  }

  return vec;
}
