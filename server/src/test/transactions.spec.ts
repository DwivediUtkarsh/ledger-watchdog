import request from 'supertest';
import { describe, it, expect } from 'vitest';
import { app } from '@/app';

describe('Transactions endpoints', () => {
  it('GET /api/v1/transactions/stats returns stats', async () => {
    const res = await request(app).get('/api/v1/transactions/stats');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.total).toBeGreaterThanOrEqual(0);
  });

  it('GET /api/v1/transactions returns a list', async () => {
    const res = await request(app).get('/api/v1/transactions');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.data)).toBe(true);
  });

  it('GET /api/v1/transactions/:sig returns details for existing tx', async () => {
    const list = await request(app).get('/api/v1/transactions');
    const first = list.body.data.data[0];
    const res = await request(app).get(`/api/v1/transactions/${first.sig}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.sig).toBe(first.sig);
  });
});


