import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchCommit, fetchFiles, GitHubApiError } from '../src/github.js';

const validSha = 'a1bf367b3af680b1182cc52bb77ba095764a11f9';
const commitResponse = {
  sha: validSha,
  commit: {
    message: 'A subject\n\nA body',
    author: { name: 'Commit author', email: 'author@example.com', date: '2024-01-02T03:04:05Z' },
    committer: { name: 'Commit committer', email: 'committer@example.com', date: '2024-01-03T03:04:05Z' },
  },
  author: { login: 'author', avatar_url: 'https://example.com/author.png' },
  committer: { login: 'committer', avatar_url: 'https://example.com/committer.png' },
  parents: [{ sha: 'b1bf367b3af680b1182cc52bb77ba095764a11f9' }],
};

const fetchMock = vi.fn<typeof fetch>();

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock);
  fetchMock.mockReset();
});

afterEach(() => vi.unstubAllGlobals());

describe('GitHub API normalization', () => {
  it('splits the commit subject and body and includes profile details', async () => {
    fetchMock.mockResolvedValue(jsonResponse(commitResponse));
    const commit = await fetchCommit('some owner', 'some/repo', validSha);

    expect(commit).toMatchObject({
      oid: validSha,
      subject: 'A subject',
      body: 'A body',
      parents: [{ oid: 'b1bf367b3af680b1182cc52bb77ba095764a11f9' }],
      author: { name: 'Commit author', username: 'author', avatarUrl: 'https://example.com/author.png' },
      committer: { name: 'Commit committer', username: 'committer' },
    });
    expect(fetchMock).toHaveBeenCalledWith(
      `https://api.github.com/repos/some%20owner/some%2Frepo/commits/${validSha}`,
      expect.objectContaining({ headers: expect.objectContaining({ Accept: 'application/vnd.github+json' }) }),
    );
  });

  it('uses safe fallback identity values when GitHub omits author data', async () => {
    fetchMock.mockResolvedValue(jsonResponse({
      ...commitResponse,
      commit: { ...commitResponse.commit, author: null, committer: null },
      author: null,
      committer: null,
      parents: [],
    }));
    const commit = await fetchCommit('owner', 'repo', validSha);

    expect(commit.author).toMatchObject({ name: 'Unknown', email: '', date: '1970-01-01T00:00:00.000Z' });
    expect(commit.committer.avatarUrl).toContain('ghost.png');
  });

  it('throws a typed error for unsuccessful GitHub responses', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ message: 'Not Found' }, 404));
    await expect(fetchCommit('owner', 'repo', validSha)).rejects.toMatchObject({
      name: 'GitHubApiError',
      status: 404,
      message: 'Not Found',
    });
  });
});

describe('GitHub changed-file pagination', () => {
  it('loads another page when the previous page contains 100 files', async () => {
    const firstPage = Array.from({ length: 100 }, (_, index) => ({ status: 'modified', filename: `file-${index}.ts` }));
    fetchMock.mockImplementation(async input => {
      const page = new URL(String(input)).searchParams.get('page');
      return jsonResponse({ files: page === '1' ? firstPage : [{ status: 'added', filename: 'last.ts' }] });
    });

    const files = await fetchFiles('owner', 'repo', validSha);
    expect(files).toHaveLength(101);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(String(fetchMock.mock.calls[1][0])).toContain('page=2');
  });

  it('stops after a partial page', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ files: [{ status: 'modified', filename: 'one.ts' }] }));
    await expect(fetchFiles('owner', 'repo', validSha)).resolves.toHaveLength(1);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});