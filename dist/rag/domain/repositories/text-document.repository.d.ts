import { TextDocument } from '../entities/text-document.entity';
import { Embedding } from '../value-objects/embedding.vo';
export interface ITextDocumentRepository {
    saveMany(documents: TextDocument[]): Promise<void>;
    findByEmbedding(embedding: Embedding, limit: number, options: any): Promise<TextDocument[]>;
    findAll(limit?: number): Promise<TextDocument[]>;
    deleteById(id: string): Promise<void>;
}
