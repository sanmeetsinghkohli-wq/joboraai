export type DiffPart = { text: string; type: 'same' | 'added' | 'removed' };

/**
 * Word-level diff (longest common subsequence) for showing what changed
 * between two versions of a CV section. Whitespace is kept with each word.
 */
export function wordDiff(before: string, after: string): DiffPart[] {
  const a = before.split(/(\s+)/).filter((t) => t !== '');
  const b = after.split(/(\s+)/).filter((t) => t !== '');
  // Guard against very long inputs: fall back to a plain before/after block.
  if (a.length * b.length > 4_000_000) {
    return [
      { text: before, type: 'removed' },
      { text: after, type: 'added' },
    ];
  }
  const n = a.length;
  const m = b.length;
  const lcs: Uint16Array[] = Array.from({ length: n + 1 }, () => new Uint16Array(m + 1));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      lcs[i][j] = a[i] === b[j] ? lcs[i + 1][j + 1] + 1 : Math.max(lcs[i + 1][j], lcs[i][j + 1]);
    }
  }
  const out: DiffPart[] = [];
  const push = (text: string, type: DiffPart['type']) => {
    const last = out[out.length - 1];
    if (last && last.type === type) last.text += text;
    else out.push({ text, type });
  };
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (a[i] === b[j]) {
      push(a[i], 'same');
      i++;
      j++;
    } else if (lcs[i + 1][j] >= lcs[i][j + 1]) {
      push(a[i++], 'removed');
    } else {
      push(b[j++], 'added');
    }
  }
  while (i < n) push(a[i++], 'removed');
  while (j < m) push(b[j++], 'added');
  return out;
}

/**
 * Line-level comparison for sections such as experience, where tailoring
 * mostly reorders bullets. Lines in both versions count as unchanged wherever
 * they moved; only new lines are "added", and dropped lines are listed last.
 */
export function lineDiff(before: string, after: string): DiffPart[] {
  const norm = (l: string) => l.trim().replace(/\s+/g, ' ').toLowerCase();
  const beforeLines = before.split('\n');
  const afterLines = after.split('\n');
  const beforeSet = new Set(beforeLines.map(norm).filter(Boolean));
  const afterSet = new Set(afterLines.map(norm).filter(Boolean));
  const out: DiffPart[] = afterLines.map((l) => ({
    text: `${l}\n`,
    type: !l.trim() || beforeSet.has(norm(l)) ? 'same' : 'added',
  }));
  for (const l of beforeLines) {
    if (l.trim() && !afterSet.has(norm(l))) out.push({ text: `${l}\n`, type: 'removed' });
  }
  return out;
}
