import { afterEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import { app } from '../src/server.js';

const validSha = 'a1bf367b3af680b1182cc52bb77ba095764a11f9';

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

afterEach(() => vi.unstubAllGlobals());

describe('API validation', () => {
  it('publishes the OpenAPI spec and Swagger UI', async () => {
    const spec = await request(app).get('/openapi.json');
    expect(spec.status).toBe(200);
    expect(spec.body.openapi).toBe('3.0.3');
    expect(spec.body.paths['/repositories/{owner}/{repository}/commits/{oid}/diff']).toBeDefined();

    const docs = await request(app).get('/api-docs/');
    expect(docs.status).toBe(200);
    expect(docs.text).toContain('Swagger UI');
  });

  it.each([
    '/repositories/golemfactory/clay/commits/not-a-sha',
    '/repositories/golemfactory/clay/commits/not-a-sha/diff',
  ])('rejects malformed commit SHAs for %s', async path => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const response = await request(app).get(path);
    expect(response.status).toBe(400);
    expect(response.body.message).toMatch(/40-character/);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('returns normalized commit metadata from GitHub', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({
      sha: validSha,
      commit: {
        message: 'Subject line\n\nDetails here',
        author: { name: 'A Person', email: 'person@example.com', date: '2024-01-02T03:04:05Z' },
        committer: { name: 'A Person', email: 'person@example.com', date: '2024-01-02T03:04:05Z' },
      },
      author: { login: 'aperson', avatar_url: 'https://example.com/avatar.png' },
      committer: { login: 'aperson', avatar_url: 'https://example.com/avatar.png' },
      parents: [{ sha: 'b1bf367b3af680b1182cc52bb77ba095764a11f9' }],
    })));

    const response = await request(app).get(`/repositories/acme/project/commits/${validSha}`);
    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(1);
    expect(response.body[0]).toMatchObject({
      oid: validSha,
      subject: 'Subject line',
      body: 'Details here',
      author: { name: 'A Person', username: 'aperson' },
    });
  });

  it('returns an empty array for a commit with no changed files', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({ files: [] })));
    const response = await request(app).get(`/repositories/acme/project/commits/${validSha}/diff`);
    expect(response.status).toBe(200);
    expect(response.body).toEqual([]);
  });

  it.each([
    [404, 404],
    [403, 429],
    [500, 502],
  ])('maps GitHub status %i to backend status %i', async (githubStatus, expectedStatus) => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({ message: 'provider failure' }, githubStatus)));
    const response = await request(app).get(`/repositories/acme/project/commits/${validSha}`);
    expect(response.status).toBe(expectedStatus);
    expect(response.body.message).toContain('provider failure');
  });

  it('returns a generic 500 response when the upstream request throws', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network details')));
    const response = await request(app).get(`/repositories/acme/project/commits/${validSha}`);
    expect(response.status).toBe(500);
    expect(response.body).toEqual({ message: 'Unexpected server error.' });
  });
});
