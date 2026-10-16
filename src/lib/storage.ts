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
}

/**
 * Cloud Storage Adapter using Upstash Redis / Vercel KV via pure REST API.
 * 100% Free, serverless-native, requires 0 extra npm packages.
 */
class UpstashRedisAdapter implements StorageAdapter {
  private url: string;
  private token: string;

  constructor(url: string, token: string) {
    // Strip trailing slash if present
    this.url = url.replace(/\/+$/, '');
    this.token = token;
  }

  getProviderName(): string {
    return 'Upstash Redis / Vercel KV (Cloud)';
  }

  isCloud(): boolean {
    return true;
  }

  async get(key: string): Promise<any | null> {
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

      // If stored as JSON string, parse it; otherwise return raw result
      if (typeof data.result === 'string') {
        try {
          return JSON.parse(data.result);
        } catch {
          return data.result;
        }
      }
      return data.result;
    } catch (err) {
      console.error(`[Upstash] Error getting key "${key}":`, err);
      return null;
    }
  }

  async set(key: string, value: any): Promise<boolean> {
    try {
      const payload = typeof value === 'string' ? value : JSON.stringify(value);
      const res = await fetch(`${this.url}/set/${key}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        console.error(`[Upstash] SET ${key} failed with status ${res.status}`);
        return false;
      }
      return true;
    } catch (err) {
      console.error(`[Upstash] Error setting key "${key}":`, err);
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
class FileSystemAdapter implements StorageAdapter {
  private baseDir: string;
  private isFallbackTmp: boolean = false;

  constructor() {
    // If running in Vercel or read-only serverless, prepare tmp fallback
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
      // If primary baseDir is read-only (EROFS), switch permanently to tmpdir
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
      // If in tmp fallback and file doesn't exist yet, try reading from project data/
      if (this.isFallbackTmp) {
        try {
          const projectPath = path.join(process.cwd(), 'data', `${key}.json`);
          const raw = await fs.readFile(projectPath, 'utf-8');
          const parsed = JSON.parse(raw);
          // Seed tmp file for subsequent writes
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
      // If failed due to read-only filesystem, switch to tmp and retry
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

// Singleton storage adapter instance
let cachedAdapter: StorageAdapter | null = null;

export function getStorageAdapter(): StorageAdapter {
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

  // 2. Default to FileSystemAdapter with safe serverless fallback
  cachedAdapter = new FileSystemAdapter();
  return cachedAdapter;
}
