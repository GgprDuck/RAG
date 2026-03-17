export class SimilarityScore {
  private readonly _value: number;

  constructor(value: number) {
    if (value < 0 || value > 1) {
      throw new Error('Similarity score must be more than 0');
    }
    this._value = value;
  }

  get value(): number {
    return this._value;
  }

  equals(other: SimilarityScore): boolean {
    return Math.abs(this._value - other._value) < 1e-9;
  }

  isGreaterThan(threshold: number): boolean {
    return this._value >= threshold;
  }
}
