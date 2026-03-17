export class Embedding {
  private readonly _values: number[];

  constructor(values: number[]) {
    if (!values.every(v => typeof v === 'number')) {
      throw new Error('All embedding values must be numbers');
    }
    this._values = [...values];
  }

  get values(): number[] {
    return [...this._values];
  }

  get dimension(): number {
    return this._values.length;
  }

  equals(other: Embedding): boolean {
    if (this.dimension !== other.dimension) return false;
    return this._values.every((v, i) => Math.abs(v - other._values[i]) < 1e-9);
  }
}
