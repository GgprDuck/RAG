export interface IEmbeddingPort {
    embed(text: string): Promise<number[] | null>;
}
