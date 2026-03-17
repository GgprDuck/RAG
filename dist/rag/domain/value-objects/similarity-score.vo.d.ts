export declare class SimilarityScore {
    private readonly _value;
    constructor(value: number);
    get value(): number;
    equals(other: SimilarityScore): boolean;
    isGreaterThan(threshold: number): boolean;
}
