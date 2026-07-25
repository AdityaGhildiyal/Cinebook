// Cache + seat-lock store. Redis when REDIS_URL is set, otherwise an in-memory fallback with the same API.
const Redis = require('ioredis');

class MemoryStore {
  constructor() { this.m = new Map(); }
  _gc() { const n = Date.now(); for (const [k, v] of this.m) if (v.exp && v.exp <= n) this.m.delete(k); }
  async get(k) { this._gc(); const e = this.m.get(k); return e ? e.val : null; }
  async set(k, v, ttl) { this.m.set(k, { val: v, exp: ttl ? Date.now() + ttl * 1000 : 0 }); }
  async setnx(k, v, ttl) { this._gc(); if (this.m.has(k)) return false; await this.set(k, v, ttl); return true; }
  async del(...ks) { ks.forEach((k) => this.m.delete(k)); }
  async keys(prefix) { this._gc(); return [...this.m.keys()].filter((k) => k.startsWith(prefix)); }
}

class RedisStore {
  constructor(url) { this.r = new Redis(url, { maxRetriesPerRequest: 2 }); }
  get(k) { return this.r.get(k); }
  set(k, v, ttl) { return ttl ? this.r.set(k, v, 'EX', ttl) : this.r.set(k, v); }
  async setnx(k, v, ttl) { return (await this.r.set(k, v, 'EX', ttl, 'NX')) === 'OK'; }
  del(...ks) { return ks.length ? this.r.del(...ks) : 0; }
  async keys(prefix) {
    const out = []; let cursor = '0';
    do { const [next, ks] = await this.r.scan(cursor, 'MATCH', `${prefix}*`, 'COUNT', 200); cursor = next; out.push(...ks); } while (cursor !== '0');
    return out;
  }
}

module.exports = process.env.REDIS_URL ? new RedisStore(process.env.REDIS_URL) : new MemoryStore();
