export declare class Embedding {
    private readonly _values;
    constructor(values: number[]);
    get values(): number[];
    get dimension(): number;
    equals(other: Embedding): boolean;
}
