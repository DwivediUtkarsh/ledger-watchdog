import request from 'supertest';
import { describe, it, expect } from 'vitest';
import { app } from '@/app';

describe('Flags endpoints', () => {
  it('POST /api/v1/flags should create a flag', async () => {
    const list = await request(app).get('/api/v1/transactions');
    const tx = list.body.data.data[0];
    const uniqueHandle = `integration_tester_${Date.now()}`;
    const res = await request(app)
      .post('/api/v1/flags')
      .send({
        txSig: tx.sig,
        category: 'Test Flag',
        severity: 'medium',
        confidence: 80,
        notes: 'This is a test flag submission for integration test.',
        evidenceUrls: ['https://solscan.io/tx/test'],
        reporterHandle: uniqueHandle,
      })
      .set('Content-Type', 'application/json');

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.flag.txSig).toBe(tx.sig);
  });

  it('GET /api/v1/flags/stats returns stats', async () => {
    const res = await request(app).get('/api/v1/flags/stats');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.total).toBeGreaterThanOrEqual(1);
  });
});


