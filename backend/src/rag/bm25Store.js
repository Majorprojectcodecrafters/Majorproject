const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(process.cwd(), 'data');
const INDEX_FILE = path.join(DATA_DIR, 'bm25_index.json');

// BM25 Default Hyperparameters
const DEFAULT_K1 = 1.2;
const DEFAULT_B = 0.75;

/**
 * Preservation Tokenizer: Preserves scientific symbols, chemical formulas (H2SO4, PV=nRT),
 * mathematical expressions, operators, and technical terms.
 */
function tokenizePreservingScientific(text) {
  if (!text || typeof text !== 'string') return [];

  // Match words, chemical compounds, TeX commands, equations, numbers with symbols
  const tokens = text.match(/[A-Za-z0-9_\+\-\=\/\^\.\%\\]+|[θΩαβγΔελμπρστϕΨ°±×·÷∞≈≠≤≥∈⇌→↑↓]/g) || [];

  return tokens
    .map(t => t.toLowerCase().trim())
    .filter(t => t.length > 0 && t !== '\\');
}

class BM25Store {
  constructor(k1 = DEFAULT_K1, b = DEFAULT_B) {
    this.k1 = k1;
    this.b = b;

    // Document store: Map<chunkId, { id, text, metadata, tokens, docLength }>
    this.documents = new Map();

    // Inverted index: Map<token, Set<chunkId>>
    this.invertedIndex = new Map();

    // Term frequency index: Map<chunkId, Map<token, count>>
    this.docTermFreqs = new Map();

    // Aggregate stats
    this.totalDocLength = 0;
    this.avgDocLength = 0;
    this.isLoaded = false;
  }

  ensureDataDir() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  }

  loadIndex() {
    if (this.isLoaded) return;
    this.ensureDataDir();

    if (fs.existsSync(INDEX_FILE)) {
      try {
        const raw = fs.readFileSync(INDEX_FILE, 'utf-8');
        const parsed = JSON.parse(raw);

        this.documents = new Map(parsed.documents || []);
        this.totalDocLength = parsed.totalDocLength || 0;
        this.avgDocLength = parsed.avgDocLength || 0;

        // Rebuild in-memory inverted index and term freqs from document store
        this.rebuildInvertedIndex();
        this.isLoaded = true;
        console.log(`✅ Loaded BM25 Index from disk (${this.documents.size} documents)`);
        return;
      } catch (err) {
        console.warn('⚠️ Failed to load BM25 index file, initializing empty index:', err.message);
      }
    }

    this.isLoaded = true;
    console.log('ℹ️ Initialized clean BM25 Index');
  }

  saveIndex() {
    try {
      this.ensureDataDir();
      const serializableDocs = Array.from(this.documents.entries());
      const payload = {
        totalDocLength: this.totalDocLength,
        avgDocLength: this.avgDocLength,
        documents: serializableDocs
      };
      fs.writeFileSync(INDEX_FILE, JSON.stringify(payload), 'utf-8');
      console.log(`💾 Saved BM25 Index to disk (${this.documents.size} documents)`);
    } catch (err) {
      console.error('❌ Error saving BM25 index:', err.message);
    }
  }

  rebuildInvertedIndex() {
    this.invertedIndex.clear();
    this.docTermFreqs.clear();
    this.totalDocLength = 0;

    for (const [id, doc] of this.documents.entries()) {
      const tokens = doc.tokens || tokenizePreservingScientific(doc.text);
      const termFreqs = new Map();

      for (const t of tokens) {
        termFreqs.set(t, (termFreqs.get(t) || 0) + 1);

        if (!this.invertedIndex.has(t)) {
          this.invertedIndex.set(t, new Set());
        }
        this.invertedIndex.get(t).add(id);
      }

      this.docTermFreqs.set(id, termFreqs);
      this.totalDocLength += doc.docLength || tokens.length;
    }

    this.avgDocLength = this.documents.size > 0 ? this.totalDocLength / this.documents.size : 0;
  }

  addChunk(id, text, metadata = {}) {
    this.loadIndex();

    const tokens = tokenizePreservingScientific(text);
    const docLength = tokens.length;

    // Remove existing if present to avoid duplication
    if (this.documents.has(id)) {
      this.removeChunkInternal(id);
    }

    const docObj = { id, text, metadata, tokens, docLength };
    this.documents.set(id, docObj);

    const termFreqs = new Map();
    for (const t of tokens) {
      termFreqs.set(t, (termFreqs.get(t) || 0) + 1);
      if (!this.invertedIndex.has(t)) {
        this.invertedIndex.set(t, new Set());
      }
      this.invertedIndex.get(t).add(id);
    }

    this.docTermFreqs.set(id, termFreqs);
    this.totalDocLength += docLength;
    this.avgDocLength = this.documents.size > 0 ? this.totalDocLength / this.documents.size : 0;
  }

  addChunksBatch(chunks) {
    this.loadIndex();
    for (const c of chunks) {
      if (c && c.id && c.text) {
        this.addChunk(c.id, c.text, c.metadata || {});
      }
    }
    this.saveIndex();
  }

  removeChunkInternal(id) {
    const doc = this.documents.get(id);
    if (!doc) return;

    const termFreqs = this.docTermFreqs.get(id);
    if (termFreqs) {
      for (const t of termFreqs.keys()) {
        const postSet = this.invertedIndex.get(t);
        if (postSet) {
          postSet.delete(id);
          if (postSet.size === 0) {
            this.invertedIndex.delete(t);
          }
        }
      }
    }

    this.totalDocLength -= doc.docLength || 0;
    this.documents.delete(id);
    this.docTermFreqs.delete(id);
    this.avgDocLength = this.documents.size > 0 ? this.totalDocLength / this.documents.size : 0;
  }

  deleteBySource(fileName) {
    this.loadIndex();
    let count = 0;
    for (const [id, doc] of Array.from(this.documents.entries())) {
      if (doc.metadata?.source === fileName || doc.metadata?.fileName === fileName) {
        this.removeChunkInternal(id);
        count++;
      }
    }
    if (count > 0) {
      this.saveIndex();
      console.log(`🗑️ Removed ${count} chunks from BM25 index for file: ${fileName}`);
    }
  }

  deleteBySourceId(knowledgeSourceId) {
    this.loadIndex();
    let count = 0;
    for (const [id, doc] of Array.from(this.documents.entries())) {
      if (doc.metadata?.knowledgeSourceId === knowledgeSourceId) {
        this.removeChunkInternal(id);
        count++;
      }
    }
    if (count > 0) {
      this.saveIndex();
      console.log(`🗑️ Removed ${count} chunks from BM25 index for knowledgeSourceId: ${knowledgeSourceId}`);
    }
  }

  deleteBySubject(subjectId) {
    this.loadIndex();
    let count = 0;
    for (const [id, doc] of Array.from(this.documents.entries())) {
      if (doc.metadata?.subjectId === subjectId) {
        this.removeChunkInternal(id);
        count++;
      }
    }
    if (count > 0) {
      this.saveIndex();
      console.log(`🗑️ Removed ${count} chunks from BM25 index for subjectId: ${subjectId}`);
    }
  }

  // Filter evaluation logic matching ChromaDB metadata conditions
  matchesFilter(docMetadata, filter) {
    if (!filter || Object.keys(filter).length === 0) return true;

    // Handles $eq and $and filters
    const checkCondition = (meta, cond) => {
      for (const [key, val] of Object.entries(cond)) {
        if (key === '$and' && Array.isArray(val)) {
          return val.every(subCond => checkCondition(meta, subCond));
        }
        if (val && typeof val === 'object' && '$eq' in val) {
          if (String(meta[key] || '') !== String(val.$eq)) return false;
        } else if (String(meta[key] || '') !== String(val)) {
          return false;
        }
      }
      return true;
    };

    return checkCondition(docMetadata || {}, filter);
  }

  search(query, filter = {}, topK = 20) {
    this.loadIndex();

    if (this.documents.size === 0) return [];

    const queryTokens = tokenizePreservingScientific(query);
    if (queryTokens.length === 0) return [];

    const N = this.documents.size;
    const scores = new Map();

    for (const token of queryTokens) {
      const postingList = this.invertedIndex.get(token);
      if (!postingList) continue;

      const df = postingList.size;
      // Inverse Document Frequency (IDF) formula
      const idf = Math.log(1 + (N - df + 0.5) / (df + 0.5));

      for (const chunkId of postingList) {
        const doc = this.documents.get(chunkId);
        if (!doc) continue;

        if (!this.matchesFilter(doc.metadata, filter)) continue;

        const termFreqs = this.docTermFreqs.get(chunkId);
        const tf = termFreqs ? (termFreqs.get(token) || 0) : 0;
        const Ld = doc.docLength || 1;

        // BM25 term score formula
        const num = tf * (this.k1 + 1);
        const denom = tf + this.k1 * (1 - this.b + this.b * (Ld / (this.avgDocLength || 1)));
        const termScore = idf * (num / denom);

        scores.set(chunkId, (scores.get(chunkId) || 0) + termScore);
      }
    }

    const results = Array.from(scores.entries())
      .map(([chunkId, bm25Score]) => {
        const doc = this.documents.get(chunkId);
        return {
          chunkId,
          text: doc.text,
          metadata: doc.metadata,
          bm25Score
        };
      })
      .sort((a, b) => b.bm25Score - a.bm25Score)
      .slice(0, topK);

    return results;
  }
}

// Export singleton instance
const bm25Store = new BM25Store();

module.exports = {
  bm25Store,
  tokenizePreservingScientific
};
