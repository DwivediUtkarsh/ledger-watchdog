/**
 * USDT (Solana) lightweight poller — free RPC only
 * - Periodically scans recent blocks and extracts SPL-Token transfers for USDT mint
 * - Normalizes and upserts to Transaction table
 *
 * Notes / Tradeoffs:
 * - Public RPCs may rate-limit and occasionally miss blocks; we use gentle concurrency and retries.
 * - This is a best-effort fallback vs. a webhook indexer (Helius). For production, prefer webhooks.
 */

import { config } from '@/config';
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { transactionService } from '@/services/transactionService';

// Correct USDT mint on Solana
// (Earlier we used EPjF... which is USDC; USDT is Es9v...)
const USDT_MINT = config.usdtMint || 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB';
const RPC_URL = config.solanaRpcUrl || 'https://api.mainnet-beta.solana.com';

const INTERVAL_MS = Math.max(15000, config.ingestionIntervalMs || 600000); // default 10 min
const LOOKBACK_SEC = Math.floor(INTERVAL_MS / 1000) + 60; // add 1-min buffer
const MAX_CONCURRENCY = 3; // be gentle on free RPC
const JSONRPC_HEADERS = { 'content-type': 'application/json' };

type JsonRpcResp<T> = { result?: T; error?: { code: number; message: string } };

async function rpc<T = any>(method: string, params: any[] = []): Promise<T> {
  const res = await fetch(RPC_URL, {
    method: 'POST',
    headers: JSONRPC_HEADERS,
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
  });
  
  // Handle large responses that may have corrupted JSON
  let j: JsonRpcResp<T>;
  try {
    j = (await res.json()) as JsonRpcResp<T>;
  } catch (parseError: any) {
    // Check if it's a JSON parse error (common with large blocks)
    if (parseError.message?.includes('JSON') || parseError.message?.includes('Unterminated')) {
      throw new Error(`${method} failed: Response too large or corrupted JSON - ${parseError.message}`);
    }
    throw parseError;
  }
  
  if (j.error) throw new Error(`${method} RPC error ${j.error.code}: ${j.error.message}`);
  return j.result as T;
}

async function findStartSlotAtOrBefore(targetTs: number, endSlot: number): Promise<number> {
  if (endSlot <= 1) return 1;

  // Probe backward to bracket [lo, hi]
  let hi = endSlot;
  let lo = Math.max(1, hi - 64);
  let t = await rpc<number | null>('getBlockTime', [hi]);
  if (t !== null && t <= targetTs) {
    lo = Math.max(1, hi - 10000);
  } else {
    let step = 64;
    while (lo > 1) {
      const ts = await rpc<number | null>('getBlockTime', [lo]);
      if (ts !== null && ts <= targetTs) break;
      hi = lo;
      step *= 2;
      lo = Math.max(1, lo - step);
    }
  }

  // Binary search in [lo, hi]
  let best = lo;
  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);
    const ts = await rpc<number | null>('getBlockTime', [mid]);
    if (ts === null) {
      hi = mid - 1;
      continue;
    }
    if (ts <= targetTs) {
      best = mid;
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }
  return Math.max(1, best);
}

async function mapPool<T, R>(arr: T[], limit: number, fn: (t: T, i: number) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(arr.length);
  let idx = 0;
  let active = 0;
  return new Promise((resolve, reject) => {
    const kick = () => {
      while (active < limit && idx < arr.length) {
        const i = idx++;
        active++;
        fn(arr[i], i)
          .then(res => {
            out[i] = res;
            active--;
            if (idx >= arr.length && active === 0) resolve(out);
            else kick();
          })
          .catch(reject);
      }
    };
    kick();
  });
}

type UsdtEvent = {
  signature: string;
  slot: number;
  blockTime: number | null;
  source?: string;
  destination?: string;
  amountRaw?: string; // integer string (USDT has 6 decimals)
  amount?: number; // float in units
  type: 'transfer' | 'transferChecked' | 'other';
};

async function extractUsdtTransfersFromBlock(block: any): Promise<UsdtEvent[]> {
  if (!block?.signatures?.length) return [];
  
  const slot = block.slot as number;
  const blockTime = block.blockTime ?? null;
  const signatures = block.signatures as string[];
  
  const events: UsdtEvent[] = [];
  
  // Process signatures in small batches to avoid overwhelming the RPC
  const batchSize = 10; // Slightly larger batch for the polling job
  for (let i = 0; i < Math.min(signatures.length, 100); i += batchSize) {
    const batch = signatures.slice(i, i + batchSize);
    
    // Fetch transactions in parallel within batch
    const txPromises = batch.map(async (sig) => {
      try {
        const tx = await rpc<any>('getTransaction', [
          sig,
          {
            encoding: 'jsonParsed',
            commitment: 'confirmed',
            maxSupportedTransactionVersion: 0,
          },
        ]);
        
        if (!tx) return null;
        
        const meta = tx.meta;
        const msg = tx.transaction?.message;
        const parsedInstrs = (msg?.instructions ?? []).concat(
          ...(meta?.innerInstructions?.map((ii: any) => ii.instructions) ?? [])
        );
        
        for (const ins of parsedInstrs) {
          const ix = (ins as any)?.parsed;
          const program = (ins as any)?.program;
          if (!ix || program !== 'spl-token') continue;
          
          const type = ix?.type as string;
          const info = ix?.info ?? {};
          
          if (type === 'transferChecked' && info?.mint === USDT_MINT) {
            const amtRaw: string = info?.tokenAmount?.amount ?? info?.amount ?? '0';
            const dec: number = info?.tokenAmount?.decimals ?? 6;
            const amt = Number(amtRaw) / 10 ** dec;
            return {
              signature: sig,
              slot,
              blockTime,
              source: info?.source,
              destination: info?.destination,
              amountRaw: String(amtRaw),
              amount: amt,
              type: 'transferChecked' as const,
            };
          }
          
          if (type === 'transfer' && info?.amount) {
            const touchedUSDT =
              (meta?.postTokenBalances ?? []).some((b: any) => b?.mint === USDT_MINT) ||
              (meta?.preTokenBalances ?? []).some((b: any) => b?.mint === USDT_MINT);
            
            if (touchedUSDT) {
              const amtRaw: string = String(info?.amount);
              const amt = Number(amtRaw) / 1e6;
              return {
                signature: sig,
                slot,
                blockTime,
                source: info?.source,
                destination: info?.destination,
                amountRaw: amtRaw,
                amount: amt,
                type: 'transfer' as const,
              };
            }
          }
        }
        
        return null;
      } catch (error: any) {
        // Silently skip failed transactions to avoid log spam
        return null;
      }
    });
    
    const results = await Promise.all(txPromises);
    for (const result of results) {
      if (result) events.push(result);
    }
    
    // Small delay between batches
    if (i + batchSize < signatures.length) {
      await new Promise(resolve => setTimeout(resolve, 50));
    }
  }
  
  return events;
}

let seen = new Set<string>();

export async function pollUsdtOnce(): Promise<void> {
  const nowSec = Math.floor(Date.now() / 1000);

  // Load cursor
  const cursor = await prisma.ingestionCursor.findUnique({ where: { source: 'rpc_polling' } });
  const endSlot = await rpc<number>('getSlot', [{ commitment: 'confirmed' }]);
  const since = nowSec - LOOKBACK_SEC;

  let startSlot: number;
  if (cursor?.lastSlot && endSlot >= Number(cursor.lastSlot)) {
    startSlot = Number(cursor.lastSlot);
    const maybeEarlier = await findStartSlotAtOrBefore(since, endSlot);
    startSlot = Math.min(startSlot, maybeEarlier);
  } else {
    startSlot = await findStartSlotAtOrBefore(since, endSlot);
  }

  if (startSlot > endSlot) startSlot = endSlot;

  logger.info('USDT poll window', { startSlot, endSlot, slots: endSlot - startSlot + 1 });

  const slots: number[] = await rpc('getBlocks', [startSlot, endSlot, { commitment: 'confirmed' }]);
  if (!slots.length) {
    await prisma.ingestionCursor.upsert({
      where: { source: 'rpc_polling' },
      create: { source: 'rpc_polling', lastSlot: BigInt(endSlot + 1), lastRunAt: new Date() },
      update: { lastSlot: BigInt(endSlot + 1), lastRunAt: new Date() },
    });
    return;
  }

  const results = await mapPool(slots, MAX_CONCURRENCY, async s => {
    try {
      // Use 'signatures' instead of 'full' to drastically reduce response size
      // This prevents "Unterminated string in JSON" errors from large blocks
      return await rpc<any>('getBlock', [
        s,
        {
          encoding: 'jsonParsed',
          transactionDetails: 'signatures',
          rewards: false,
          maxSupportedTransactionVersion: 0,
          commitment: 'confirmed',
        },
      ]);
    } catch (e: any) {
      logger.warn('getBlock failed', { slot: s, error: e?.message });
      return null;
    }
  });

  const events: UsdtEvent[] = [];
  for (const blk of results) {
    if (!blk) continue;
    // extractUsdtTransfersFromBlock is now async
    const blockEvents = await extractUsdtTransfersFromBlock(blk);
    for (const ev of blockEvents) {
      if (ev.signature && !seen.has(ev.signature)) {
        seen.add(ev.signature);
        events.push(ev);
      }
    }
  }

  for (const e of events) {
    try {
      if (!e.blockTime || !e.source || !e.destination || !e.amount) continue;
      await transactionService.upsertTransaction({
        id: '', // ignored
        sig: e.signature,
        tsISO: new Date(e.blockTime * 1000),
        slot: e.slot,
        status: 'confirmed',
        from: e.source,
        to: e.destination,
        amountUSDT: e.amount,
        risk: 0,
        riskFactors: [],
        labels: [],
        hints: [],
        metadata: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);
    } catch (err: any) {
      logger.warn('Failed to upsert USDT tx', { sig: e.signature, error: err?.message });
    }
  }

  // Update cursor and trim seen set
  await prisma.ingestionCursor.upsert({
    where: { source: 'rpc_polling' },
    create: { source: 'rpc_polling', lastSlot: BigInt(endSlot + 1), lastRunAt: new Date() },
    update: { lastSlot: BigInt(endSlot + 1), lastRunAt: new Date() },
  });

  if (seen.size > 50000) seen = new Set<string>();
}

export function startUsdtPoller(): void {
  logger.info('Starting USDT RPC poller', { rpc: RPC_URL, intervalMs: INTERVAL_MS, mint: USDT_MINT });
  // Run immediately then on interval
  pollUsdtOnce().catch(e => logger.error('USDT poll immediate run failed', { error: e?.message }));
  setInterval(() => {
    pollUsdtOnce().catch(e => logger.error('USDT poll interval error', { error: e?.message }));
  }, INTERVAL_MS);
}

// Allow running standalone: `npm run ingest:poll`
if (import.meta.url === `file://${process.argv[1]}`) {
  startUsdtPoller();
}






