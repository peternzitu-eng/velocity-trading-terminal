import { kv } from '@vercel/kv';

const MAX_TRADES = 200;

export async function saveTrade(trade) {
      const { symbol, action, price, stop, target, source, reason } = trade;
      const timestamp = new Date().toISOString();
      const id = await kv.incr('trades:seq');
      const record = {
                id, timestamp, symbol, action,
                price: price || 0, stop: stop || 0, target: target || 0,
                exit_price: null, exit_time: null, result: 'OPEN',
                source, reason: reason || ''
      };
      const existing = (await kv.get('trades:list')) || [];
      existing.unshift(record);
      if (existing.length > MAX_TRADES) existing.length = MAX_TRADES;
      await kv.set('trades:list', existing);
      return record;
}

export async function updateTrade(id, exitPrice, result) {
      const existing = (await kv.get('trades:list')) || [];
      const idx = existing.findIndex(t => t.id === id);
      if (idx !== -1) {
                existing[idx].exit_price = exitPrice;
                existing[idx].exit_time = new Date().toISOString();
                existing[idx].result = result;
                await kv.set('trades:list', existing);
      }
}

export async function getTrades(limit = 100) {
      const all = (await kv.get('trades:list')) || [];
      return all.slice(0, limit);
}

export async function getStats() {
      const all = (await kv.get('trades:list')) || [];
      const closed = all.filter(t => t.result !== 'OPEN');
      const wins = closed.filter(t => t.result === 'WIN').length;
      const total = closed.length;
      const winRate = total > 0 ? (wins / total * 100).toFixed(1) : 0;
      return { total, wins, winRate };
}
