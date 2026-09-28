import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { DiffFile } from './DiffFile';
import type { FileDifference } from '../types';

const renamedFile: FileDifference = {
  changeKind: 'RENAMED',
  baseFile: { path: 'src/old.ts' },
  headFile: { path: 'src/new.ts' },
  hunks: [{ header: '@@ -1 +1 @@', lines: [{ baseLineNumber: 1, headLineNumber: 1, content: ' unchanged' }] }],
};

afterEach(() => cleanup());

describe('DiffFile', () => {
  it('shows rename paths and collapses its diff lines', async () => {
    const user = userEvent.setup();
    render(<DiffFile file={renamedFile} index={0} />);

    expect(screen.getByText('src/old.ts → src/new.ts')).toBeInTheDocument();
    expect(screen.getByText('unchanged')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /src\/old\.ts/ }));
    expect(screen.getByRole('button', { name: /src\/old\.ts/ })).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByText('unchanged')).not.toBeInTheDocument();
  });

  it('explains when a file has no textual patch', () => {
    render(<DiffFile file={{ ...renamedFile, hunks: [] }} index={0} />);
    expect(screen.getByText('No textual diff is available for this file.')).toBeInTheDocument();
  });
});