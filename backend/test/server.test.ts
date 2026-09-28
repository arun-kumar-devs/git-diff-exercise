import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { app } from '../src/server.js';

describe('API validation', () => {
  it('rejects malformed commit SHAs', async () => {
    const response = await request(app).get('/repositories/golemfactory/clay/commits/not-a-sha');
    expect(response.status).toBe(400);
    expect(response.body.message).toMatch(/40-character/);
  });
});
