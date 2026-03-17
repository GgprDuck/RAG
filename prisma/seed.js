"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('Start seeding...');
    const session1 = await prisma.conversationSession.create({
        data: {
            sessionId: 'demo-session-1',
            query: 'What is RAG?',
            answer: 'RAG stands for Retrieval-Augmented Generation, a technique that combines information retrieval with text generation to provide more accurate and contextual responses.',
            timestamp: new Date('2026-02-01T10:00:00Z'),
            embedding: Array(384).fill(0).map(() => Math.random()),
        },
    });
    const session2 = await prisma.conversationSession.create({
        data: {
            sessionId: 'demo-session-1',
            query: 'How does vector search work?',
            answer: 'Vector search works by converting text into numerical vectors (embeddings) and finding similar vectors using distance metrics like cosine similarity or Euclidean distance.',
            timestamp: new Date('2026-02-01T10:05:00Z'),
            embedding: Array(384).fill(0).map(() => Math.random()),
        },
    });
    const session3 = await prisma.conversationSession.create({
        data: {
            sessionId: 'demo-session-2',
            query: 'Explain embeddings',
            answer: 'Embeddings are dense vector representations of text that capture semantic meaning. Similar concepts have similar embeddings, allowing machines to understand text relationships.',
            timestamp: new Date('2026-02-01T11:00:00Z'),
            embedding: Array(384).fill(0).map(() => Math.random()),
        },
    });
    console.log('Seeding finished.');
    console.log({ session1, session2, session3 });
}
main()
    .then(async () => {
    await prisma.$disconnect();
})
    .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
});
//# sourceMappingURL=seed.js.map