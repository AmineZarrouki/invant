import fs from 'fs/promises';
import path from 'path';
import os from 'os';

/**
 * Storage adapter interface supporting Cloud (Upstash Redis / Vercel KV)
 * and Local / Serverless filesystem with automatic fallback.
 */
export interface StorageAdapter {
  get(key: string): Promise<any | null>;
  set(key: string, value: any): Promise<boolean>;
  getProviderName(): string;
  isCloud(): boolean;
  ping?(): Promise<boolean>;
}

export interface CloudCredentials {
  url: string;
  token: string;
}

interface CacheEntry {
  data: any;
  cachedAt: number;
}

// In-memory cache & in-flight requests shared across calls in the instance
const memoryCache = new Map<string, CacheEntry>();
const inFlightRequests = new Map<string, Promise<any | null>>();
const CACHE_TTL_MS = 25_000; // 25 seconds TTL for serverless instances
const MAX_PAYLOAD_BYTES = 2 * 1024 * 1024; // 2 MB safety cap

/**
 * Cloud Storage Adapter using Upstash Redis / Vercel KV via pure REST API.
 * 100% Free, serverless-native, requires 0 extra npm packages.
 */
export class UpstashRedisAdapter implements StorageAdapter {
  private url: string;
  private token: string;

  constructor(url: string, token: string) {
    this.url = url.replace(/\/+$/, '');
    this.token = token.trim();
  }

  getProviderName(): string {
    return 'Upstash Redis Cloud (100% Gratuit)';
  }

  isCloud(): boolean {
    return true;
  }

  async ping(): Promise<boolean> {
    try {
      const res = await fetch(`${this.url}/ping`, {
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
        cache: 'no-store',
      });
      if (!res.ok) return false;
      const data = await res.json();
      return Boolean(data && (data.result === 'PONG' || data.result === true || res.status === 200));
    } catch (err) {
      console.warn('[Upstash] Ping failed:', err);
      return false;
    }
  }

  async get(key: string): Promise<any | null> {
    // 1. Check in-memory cache for 0ms immediate response
    const cached = memoryCache.get(key);
    if (cached && Date.now() - cached.cachedAt < CACHE_TTL_MS) {
      return cached.data;
    }

    // 2. In-flight request deduplication (prevents concurrent duplicate requests)
    if (inFlightRequests.has(key)) {
      return await inFlightRequests.get(key);
    }

    const fetchPromise = (async () => {
      try {
        const res = await fetch(`${this.url}/get/${key}`, {
          headers: {
            Authorization: `Bearer ${this.token}`,
          },
          cache: 'no-store',
        });

        if (!res.ok) {
          console.warn(`[Upstash] GET ${key} failed with status ${res.status}`);
          return null;
        }

        const data = await res.json();
        if (!data || data.result === null || data.result === undefined) {
          return null;
        }

        let parsed: any = data.result;
        if (typeof data.result === 'string') {
          try {
            parsed = JSON.parse(data.result);
          } catch {
            parsed = data.result;
          }
        }

        // Cache the successful result
        memoryCache.set(key, { data: parsed, cachedAt: Date.now() });
        return parsed;
      } catch (err) {
        console.error(`[Upstash] Error getting key "${key}":`, err);
        return null;
      } finally {
        inFlightRequests.delete(key);
      }
    })();

    inFlightRequests.set(key, fetchPromise);
    return await fetchPromise;
  }

  async set(key: string, value: any): Promise<boolean> {
    try {
      const payload = typeof value === 'string' ? value : JSON.stringify(value);

      // Security: Payload size validation
      if (Buffer.byteLength(payload, 'utf8') > MAX_PAYLOAD_BYTES) {
        console.error(`[Upstash] Payload for key "${key}" exceeds size limit of 2MB`);
        return false;
      }

      // Write-through in-memory update for 0ms subsequent reads
      memoryCache.set(key, { data: value, cachedAt: Date.now() });

      const res = await fetch(`${this.url}/set/${key}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
        body: payload,
      });

      if (!res.ok) {
        console.error(`[Upstash] SET ${key} failed with status ${res.status}`);
        memoryCache.delete(key);
        return false;
      }
      return true;
    } catch (err) {
      console.error(`[Upstash] Error setting key "${key}":`, err);
      memoryCache.delete(key);
      return false;
    }
  }
}

/**
 * Filesystem Storage Adapter.
 * Uses local data/ folder when writable, and automatically falls back
 * to /tmp in serverless environments (Vercel, Netlify, AWS Lambda)
 * to prevent "EROFS: read-only file system" errors.
 */
export class FileSystemAdapter implements StorageAdapter {
  private baseDir: string;
  private isFallbackTmp: boolean = false;

  constructor() {
    const isServerless = Boolean(
      process.env.VERCEL ||
      process.env.AWS_LAMBDA_FUNCTION_NAME ||
      process.env.NETLIFY
    );

    if (isServerless) {
      this.baseDir = path.join(os.tmpdir(), 'kickbox-data');
      this.isFallbackTmp = true;
    } else {
      this.baseDir = path.join(process.cwd(), 'data');
    }
  }

  getProviderName(): string {
    return this.isFallbackTmp
      ? 'Fichiers Éphémères /tmp (Serverless)'
      : 'Fichiers Locaux JSON (data/)';
  }

  isCloud(): boolean {
    return false;
  }

  private async ensureDir(): Promise<void> {
    try {
      await fs.mkdir(this.baseDir, { recursive: true });
    } catch (err: any) {
      if (err.code === 'EROFS' || err.code === 'EACCES') {
        this.baseDir = path.join(os.tmpdir(), 'kickbox-data');
        this.isFallbackTmp = true;
        await fs.mkdir(this.baseDir, { recursive: true });
      }
    }
  }

  private getFilePath(key: string): string {
    return path.join(this.baseDir, `${key}.json`);
  }

  async get(key: string): Promise<any | null> {
    await this.ensureDir();
    const filePath = this.getFilePath(key);

    try {
      const raw = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(raw);
    } catch (err: any) {
      if (this.isFallbackTmp) {
        try {
          const projectPath = path.join(process.cwd(), 'data', `${key}.json`);
          const raw = await fs.readFile(projectPath, 'utf-8');
          const parsed = JSON.parse(raw);
          await fs.writeFile(filePath, raw, 'utf-8');
          return parsed;
        } catch {
          return null;
        }
      }
      return null;
    }
  }

  async set(key: string, value: any): Promise<boolean> {
    await this.ensureDir();
    let filePath = this.getFilePath(key);

    try {
      await fs.writeFile(filePath, JSON.stringify(value, null, 2), 'utf-8');
      return true;
    } catch (err: any) {
      if (err.code === 'EROFS' || err.code === 'EACCES') {
        this.baseDir = path.join(os.tmpdir(), 'kickbox-data');
        this.isFallbackTmp = true;
        await fs.mkdir(this.baseDir, { recursive: true });
        filePath = this.getFilePath(key);
        await fs.writeFile(filePath, JSON.stringify(value, null, 2), 'utf-8');
        return true;
      }
      console.error(`[FSAdapter] Failed to write ${filePath}:`, err);
      return false;
    }
  }
}

// In-memory or file-based runtime cloud credentials
let runtimeCredentials: CloudCredentials | null = null;
const RUNTIME_CONFIG_FILE = path.join(os.tmpdir(), 'kickbox-cloud-config.json');

export async function setRuntimeCloudCredentials(creds: CloudCredentials | null): Promise<boolean> {
  runtimeCredentials = creds;
  cachedAdapter = null; // Invalidate cached adapter

  try {
    if (creds && creds.url && creds.token) {
      await fs.writeFile(RUNTIME_CONFIG_FILE, JSON.stringify(creds), 'utf-8');
    } else {
      await fs.unlink(RUNTIME_CONFIG_FILE).catch(() => {});
    }
    return true;
  } catch (err) {
    console.warn('[Storage] Could not persist runtime cloud config file:', err);
    return false;
  }
}

export async function getRuntimeCloudCredentials(): Promise<CloudCredentials | null> {
  if (runtimeCredentials) return runtimeCredentials;

  try {
    const raw = await fs.readFile(RUNTIME_CONFIG_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    if (parsed && parsed.url && parsed.token) {
      runtimeCredentials = parsed;
      return parsed;
    }
  } catch {
    // No runtime file found
  }
  return null;
}

// Singleton storage adapter instance
let cachedAdapter: StorageAdapter | null = null;

export function getStorageAdapter(customCreds?: CloudCredentials): StorageAdapter {
  if (customCreds && customCreds.url && customCreds.token) {
    return new UpstashRedisAdapter(customCreds.url, customCreds.token);
  }

  if (cachedAdapter) return cachedAdapter;

  // 1. Check for Vercel KV / Upstash Redis environment variables
  const kvUrl =
    process.env.KV_REST_API_URL ||
    process.env.UPSTASH_REDIS_REST_URL;
  const kvToken =
    process.env.KV_REST_API_TOKEN ||
    process.env.UPSTASH_REDIS_REST_TOKEN;

  if (kvUrl && kvToken) {
    cachedAdapter = new UpstashRedisAdapter(kvUrl, kvToken);
    return cachedAdapter;
  }

  // 2. Check for in-memory runtime credentials
  if (runtimeCredentials && runtimeCredentials.url && runtimeCredentials.token) {
    cachedAdapter = new UpstashRedisAdapter(runtimeCredentials.url, runtimeCredentials.token);
    return cachedAdapter;
  }

  // 3. Default to FileSystemAdapter with safe serverless fallback
  cachedAdapter = new FileSystemAdapter();
  return cachedAdapter;
}
