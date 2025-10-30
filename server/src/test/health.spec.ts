import request from 'supertest';
import { describe, it, expect } from 'vitest';
import { app } from '@/app';

describe('Health endpoint', () => {
  it('GET /health should return healthy status', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('healthy');
  });
});


