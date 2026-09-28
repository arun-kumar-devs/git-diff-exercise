import type { Commit, FileDifference } from '../types';

/** Fetches JSON from the backend and includes its error message when available. */
async function getJson<T>(url: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(url, { signal, headers: { Accept: 'application/json' } });
  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;
    try {
      const body = await response.json() as { message?: string };
      if (body.message) message = body.message;
    } catch {
      // Keep the HTTP status message when the server did not return JSON.
    }
    throw new Error(message);
  }
  return response.json() as Promise<T>;
}

/** Fetches the backend's single-item-array response for a commit. */
export async function getCommit(owner: string, repository: string, oid: string, signal?: AbortSignal) {
  return getJson<Commit[]>(`/api/repositories/${encodeURIComponent(owner)}/${encodeURIComponent(repository)}/commits/${oid}`, signal);
}

/** Fetches normalized file changes for a commit; the signal can cancel navigation requests. */
export async function getDiff(owner: string, repository: string, oid: string, signal?: AbortSignal) {
  return getJson<FileDifference[]>(`/api/repositories/${encodeURIComponent(owner)}/${encodeURIComponent(repository)}/commits/${oid}/diff`, signal);
}
