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
    expect(parsePatch('')).toEqual([]);
  });

  it('parses multiple CRLF hunks and ignores no-newline markers', () => {
    const patch = '@@ -1 +1 @@\r\n-old\r\n+new\r\n\\ No newline at end of file\r\n@@ -8 +8 @@\r\n context';
    expect(parsePatch(patch)).toEqual([
      {
        header: '@@ -1 +1 @@',
        lines: [
          { baseLineNumber: 1, headLineNumber: null, content: '-old' },
          { baseLineNumber: null, headLineNumber: 1, content: '+new' },
        ],
      },
      {
        header: '@@ -8 +8 @@',
        lines: [{ baseLineNumber: 8, headLineNumber: 8, content: ' context' }],
      },
    ]);
  });

  it('ignores content before the first valid hunk header', () => {
    expect(parsePatch('header text\n@@ invalid @@\n@@ -2 +3 @@\n value')).toEqual([
      { header: '@@ -2 +3 @@', lines: [{ baseLineNumber: 2, headLineNumber: 3, content: ' value' }] },
    ]);
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

  it('maps deleted files to a null head path', () => {
    const result = mapFile({ status: 'removed', filename: 'src/old.ts' });
    expect(result).toMatchObject({ changeKind: 'DELETED', baseFile: { path: 'src/old.ts' }, headFile: null, hunks: [] });
  });

  it.each([
    ['copied', 'COPIED'],
    ['changed', 'TYPE_CHANGED'],
    ['modified', 'MODIFIED'],
    ['unknown-status', 'MODIFIED'],
  ])('maps GitHub status %s to %s', (status, changeKind) => {
    expect(mapFile({ status, filename: 'src/file.ts' }).changeKind).toBe(changeKind);
  });
});
