"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.advancedChunkText = advancedChunkText;
exports.chunkTextBySentences = chunkTextBySentences;
function advancedChunkText(text, { minWords = 50, maxWords = 200, overlap = 20, preserveParagraphs = true, } = {}) {
    const paragraphs = text.split(/\n\n+/).map((p) => p.trim()).filter(Boolean);
    const chunks = [];
    let currentChunk = [];
    let currentWords = 0;
    let charIndex = 0;
    for (const paragraph of paragraphs) {
        const sentences = splitIntoSentences(paragraph);
        for (const sentence of sentences) {
            const wordCount = countWords(sentence);
            if (currentWords + wordCount > maxWords && currentWords >= minWords) {
                const chunkText = currentChunk.join(' ');
                const startIdx = charIndex - chunkText.length;
                chunks.push({
                    text: chunkText,
                    startIndex: startIdx,
                    endIndex: charIndex,
                });
                if (overlap > 0 && currentChunk.length > 0) {
                    const words = chunkText.split(/\s+/);
                    const overlapWords = words.slice(-Math.min(overlap, words.length));
                    currentChunk = [overlapWords.join(' ')];
                    currentWords = overlapWords.length;
                }
                else {
                    currentChunk = [];
                    currentWords = 0;
                }
            }
            currentChunk.push(sentence);
            currentWords += wordCount;
            charIndex += sentence.length + 1;
        }
        if (preserveParagraphs && currentChunk.length > 0) {
            currentChunk.push('');
        }
    }
    if (currentChunk.length > 0) {
        const chunkText = currentChunk.join(' ').trim();
        if (chunkText) {
            chunks.push({
                text: chunkText,
                startIndex: charIndex - chunkText.length,
                endIndex: charIndex,
            });
        }
    }
    return chunks;
}
function chunkTextBySentences(text, { minWords = 50, maxWords = 150 } = {}) {
    const chunks = advancedChunkText(text, {
        minWords,
        maxWords,
        overlap: 0,
        preserveParagraphs: false,
    });
    return chunks.map((chunk) => chunk.text);
}
function splitIntoSentences(text) {
    const abbreviations = [
        'Mr',
        'Mrs',
        'Ms',
        'Dr',
        'Prof',
        'Sr',
        'Jr',
        'vs',
        'etc',
        'e.g',
        'i.e',
        'Ph.D',
        'M.D',
        'B.A',
        'M.A',
    ];
    let processed = text;
    const placeholders = new Map();
    abbreviations.forEach((abbr, idx) => {
        const placeholder = `__ABBR${idx}__`;
        const regex = new RegExp(`\\b${abbr}\\.`, 'gi');
        processed = processed.replace(regex, (match) => {
            placeholders.set(placeholder, match);
            return placeholder;
        });
    });
    const sentences = processed
        .split(/(?<=[.!?])\s+(?=[A-ZА-ЯІЇЄҐ])/)
        .map((s) => s.trim())
        .filter(Boolean);
    return sentences.map((sentence) => {
        let restored = sentence;
        placeholders.forEach((original, placeholder) => {
            restored = restored.replace(placeholder, original);
        });
        return restored;
    });
}
function countWords(text) {
    return text.split(/\s+/).filter(Boolean).length;
}
//# sourceMappingURL=text-chunk.util.js.map