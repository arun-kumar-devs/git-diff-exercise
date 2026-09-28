import { describe, expect, it } from 'vitest';
import { mapFile, parsePatch } from '../src/github.js';

describe('parsePatch', () => {
  it('parses additions, deletions and context with independent line numbers', () => {
    const patch = [
      '@@ -10,3 +10,4 @@ function demo() {',
      ' context',
      '-old value',
      '+new value',
      '+another value',
      ' trailing',
    ].join('\n');
    const [hunk] = parsePatch(patch);
    expect(hunk.header).toBe('@@ -10,3 +10,4 @@ function demo() {');
    expect(hunk.lines).toEqual([
      { baseLineNumber: 10, headLineNumber: 10, content: ' context' },
      { baseLineNumber: 11, headLineNumber: null, content: '-old value' },
      { baseLineNumber: null, headLineNumber: 11, content: '+new value' },
      { baseLineNumber: null, headLineNumber: 12, content: '+another value' },
      { baseLineNumber: 12, headLineNumber: 13, content: ' trailing' },
    ]);
  });

  it('returns an empty hunk list for binary/no-patch files', () => {
    expect(parsePatch(undefined)).toEqual([]);
  });
});

describe('mapFile', () => {
  it('maps added files to a null base file', () => {
    const result = mapFile({ status: 'added', filename: 'src/new.ts', patch: '@@ -0,0 +1 @@\n+export {}' });
    expect(result.changeKind).toBe('ADDED');
    expect(result.baseFile).toBeNull();
    expect(result.headFile).toEqual({ path: 'src/new.ts' });
  });

  it('preserves rename source and target', () => {
    const result = mapFile({ status: 'renamed', filename: 'src/new.ts', previous_filename: 'src/old.ts' });
    expect(result.baseFile).toEqual({ path: 'src/old.ts' });
    expect(result.headFile).toEqual({ path: 'src/new.ts' });
  });
});
