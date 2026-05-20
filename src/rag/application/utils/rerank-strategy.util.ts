export type RerankStrategy =
  | 'listwise_llm'
  | 'llm_based'
  | 'none'
  | 'hybrid'
  | 'cross_encoder';

/** Maps legacy API value to reranker method. */
export function normalizeRerankStrategy(
  strategy?: RerankStrategy,
): 'llm' | 'embedding' | 'hybrid' | 'listwise' | 'none' {
  if (!strategy || strategy === 'none') return 'none';
  if (strategy === 'cross_encoder' || strategy === 'listwise_llm') {
    return 'listwise';
  }
  if (strategy === 'llm_based') return 'llm';
  if (strategy === 'hybrid') return 'hybrid';
  return 'hybrid';
}
