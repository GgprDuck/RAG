export interface ScoreHistogramBin {
  min: number;
  max: number;
  count: number;
}

export interface ScoreHistogram {
  bins: ScoreHistogramBin[];
  min: number;
  max: number;
  mean: number;
  median: number;
  p75: number;
  count: number;
}

export function buildScoreHistogram(
  scores: number[],
  binCount = 5,
): ScoreHistogram | undefined {
  const valid = scores.filter(s => typeof s === 'number' && Number.isFinite(s));
  if (valid.length === 0) return undefined;

  const sorted = [...valid].sort((a, b) => a - b);
  const min = sorted[0];
  const max = sorted[sorted.length - 1];
  const mean = valid.reduce((a, b) => a + b, 0) / valid.length;
  const median = sorted[Math.floor(sorted.length / 2)];
  const p75 = sorted[Math.floor(sorted.length * 0.75)] ?? max;

  const range = max - min || 1;
  const bins: ScoreHistogramBin[] = Array.from({ length: binCount }, (_, i) => ({
    min: min + (range * i) / binCount,
    max: min + (range * (i + 1)) / binCount,
    count: 0,
  }));

  for (const score of valid) {
    const idx = Math.min(
      binCount - 1,
      Math.floor(((score - min) / range) * binCount),
    );
    bins[idx].count += 1;
  }

  return { bins, min, max, mean, median, p75, count: valid.length };
}
