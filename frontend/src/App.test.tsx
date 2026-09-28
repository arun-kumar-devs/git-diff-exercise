import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
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

const validSha = 'a1bf367b3af680b1182cc52bb77ba095764a11f9';

function renderCommitPage(commitSHA = validSha) {
  return render(
    <MemoryRouter initialEntries={[`/repositories/acme/project/commit/${commitSHA}`]}>
      <Routes><Route path="/repositories/:owner/:repository/commit/:commitSHA" element={<CommitPage />} /></Routes>
    </MemoryRouter>,
  );
}

function mockApi(commits: unknown = [commit], files: unknown = diff) {
  vi.spyOn(globalThis, 'fetch').mockImplementation(async input => new Response(
    String(input).endsWith('/diff') ? JSON.stringify(files) : JSON.stringify(commits),
    { status: 200, headers: { 'Content-Type': 'application/json' } },
  ));
}

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('CommitPage', () => {
  it('loads commit metadata and diff', async () => {
    mockApi();
    renderCommitPage();

    await waitFor(() => expect(screen.getByText('Example commit')).toBeInTheDocument());
    expect(screen.getByText('src/example.ts')).toBeInTheDocument();
    expect(screen.getByText('new')).toBeInTheDocument();
  });

  it('rejects an invalid SHA without making API requests', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch');
    renderCommitPage('ABC123');
    expect(await screen.findByRole('alert')).toHaveTextContent('40-character lowercase hexadecimal');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('shows the backend error message when loading fails', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(async () => new Response(
      JSON.stringify({ message: 'Repository not found.' }),
      { status: 404, headers: { 'Content-Type': 'application/json' } },
    ));
    renderCommitPage();
    expect(await screen.findByRole('alert')).toHaveTextContent('Repository not found.');
  });

  it('shows a useful error if the API returns no commit metadata', async () => {
    mockApi([], []);
    renderCommitPage();
    expect(await screen.findByRole('alert')).toHaveTextContent('The API returned no commit metadata.');
  });

  it('renders the empty-diff state when a commit has no changed files', async () => {
    mockApi([commit], []);
    renderCommitPage();
    expect(await screen.findByText('This commit has no textual file differences.')).toBeInTheDocument();
    expect(screen.getByText('Example commit')).toBeInTheDocument();
  });
});
