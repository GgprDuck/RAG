export function levenshteinDistance(a: string, b: string): number {
  const dp = Array.from({ length: a.length + 1 }, () =>
    Array(b.length + 1).fill(0),
  );

  for (let i = 0; i <= a.length; i++) {
    dp[i][0] = i;
  }

  for (let j = 0; j <= b.length; j++) {
    dp[0][j] = j;
  }

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
  }

  return dp[a.length][b.length];
}

export function parseQueryWithNegation(query: string): {
  include: string[];
  exclude: string[];
} {
  const tokens = query
    .toLowerCase()
    .split(/\s+/)
    .map((t) => t.replace(/[^a-z]/g, ''))
    .filter(Boolean);

  const include: string[] = [];
  const exclude: string[] = [];
  let negate = false;

  for (const t of tokens) {
    if (t === 'not') {
      negate = true;
      continue;
    }

    if (negate) {
      exclude.push(t);
      negate = false;
    } else {
      include.push(t);
    }
  }

  return { include, exclude };
}
