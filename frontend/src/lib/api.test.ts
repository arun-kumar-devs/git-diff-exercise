import { afterEach, describe, expect, it, vi } from 'vitest';
import { getCommit, getDiff } from './api';

afterEach(() => vi.restoreAllMocks());

describe('backend API helpers', () => {
  it('encodes owner and repository path segments for commit requests', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('[]', { status: 200 }));
    const signal = new AbortController().signal;

    await getCommit('owner/name', 'repo name', 'abc123', signal);

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/repositories/owner%2Fname/repo%20name/commits/abc123',
      { signal, headers: { Accept: 'application/json' } },
    );
  });

  it('requests the diff endpoint and returns its JSON payload', async () => {
    const payload = [{ changeKind: 'MODIFIED', hunks: [] }];
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify(payload), { status: 200 }));
    await expect(getDiff('owner', 'repo', 'abc123')).resolves.toEqual(payload);
    expect(fetchMock.mock.calls[0][0]).toBe('/api/repositories/owner/repo/commits/abc123/diff');
  });

  it('uses the API-provided message for failed responses', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(
      JSON.stringify({ message: 'Commit not found.' }),
      { status: 404, headers: { 'Content-Type': 'application/json' } },
    ));
    await expect(getCommit('owner', 'repo', 'abc123')).rejects.toThrow('Commit not found.');
  });

  it('falls back to the status when an error response is not JSON', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('upstream unavailable', { status: 502 }));
    await expect(getDiff('owner', 'repo', 'abc123')).rejects.toThrow('Request failed with status 502');
  });

  it('propagates request cancellation', async () => {
    const abortError = new DOMException('Aborted', 'AbortError');
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(abortError);
    await expect(getCommit('owner', 'repo', 'abc123')).rejects.toBe(abortError);
  });
});