import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { CommitPage } from './App';

const commit = {
  oid: 'a1bf367b3af680b1182cc52bb77ba095764a11f9',
  subject: 'Example commit',
  body: 'A small test commit.',
  parents: [{ oid: 'b1bf367b3af680b1182cc52bb77ba095764a11f9' }],
  author: { name: 'Jane Doe', email: 'jane@example.com', date: new Date().toISOString(), avatarUrl: 'https://example.com/avatar.png' },
  committer: { name: 'Jane Doe', email: 'jane@example.com', date: new Date().toISOString(), avatarUrl: 'https://example.com/avatar.png' },
};

const diff = [{
  changeKind: 'MODIFIED',
  baseFile: { path: 'src/example.ts' },
  headFile: { path: 'src/example.ts' },
  hunks: [{
    header: '@@ -1,1 +1,1 @@',
    lines: [
      { baseLineNumber: 1, headLineNumber: null, content: '-old' },
      { baseLineNumber: null, headLineNumber: 1, content: '+new' },
    ],
  }],
}];

describe('CommitPage', () => {
  it('loads commit metadata and diff', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
      const url = String(input);
      return new Response(url.endsWith('/diff') ? JSON.stringify(diff) : JSON.stringify([commit]), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    });

    render(
      <MemoryRouter initialEntries={['/repositories/acme/project/commit/a1bf367b3af680b1182cc52bb77ba095764a11f9']}>
        <Routes><Route path="/repositories/:owner/:repository/commit/:commitSHA" element={<CommitPage />} /></Routes>
      </MemoryRouter>,
    );

    await waitFor(() => expect(screen.getByRole('heading', { name: 'Example commit' })).toBeInTheDocument());
    expect(screen.getByText('src/example.ts')).toBeInTheDocument();
    expect(screen.getByText('new')).toBeInTheDocument();
  });
});
