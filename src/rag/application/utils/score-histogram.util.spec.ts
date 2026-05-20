import { buildScoreHistogram } from './score-histogram.util';

describe('buildScoreHistogram', () => {
  it('returns undefined for empty scores', () => {
    expect(buildScoreHistogram([])).toBeUndefined();
  });

  it('builds histogram stats', () => {
    const hist = buildScoreHistogram([0.1, 0.2, 0.35, 0.4, 0.9]);
    expect(hist).toBeDefined();
    expect(hist!.count).toBe(5);
    expect(hist!.min).toBe(0.1);
    expect(hist!.max).toBe(0.9);
    expect(hist!.bins.length).toBe(5);
  });
});
