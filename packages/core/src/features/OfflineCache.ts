/**
 * 离线缓存管理
 * 使用 IndexedDB 缓存音频/视频文件，支持离线播放
 */

import type { Track } from '../types/player';

export interface CachedTrack {
  id: string;
  data: Blob;
  metadata: Track;
  cachedAt: Date;
  size: number;
  mimeType: string;
}

export interface CacheStatistics {
  totalTracks: number;
  totalSize: number;
  oldestCache: Date | null;
  newestCache: Date | null;
}

export class OfflineCache {
  private dbName = 'ldesign-player-offline';
  private dbVersion = 1;
  private storeName = 'tracks';
  private db: IDBDatabase | null = null;
  private maxCacheSize = 500 * 1024 * 1024; // 500MB 默认限制

  /**
   * 初始化数据库
   */
  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => {
        reject(new Error('Failed to open IndexedDB'));
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // 创建对象存储
        if (!db.objectStoreNames.contains(this.storeName)) {
          const objectStore = db.createObjectStore(this.storeName, { keyPath: 'id' });
          objectStore.createIndex('cachedAt', 'cachedAt', { unique: false });
          objectStore.createIndex('size', 'size', { unique: false });
        }
      };
    });
  }

  /**
   * 缓存音轨
   */
  async cacheTrack(track: Track, onProgress?: (progress: number) => void): Promise<void> {
    if (!this.db) {
      await this.init();
    }

    // 检查缓存空间
    const stats = await this.getStatistics();
    if (stats.totalSize >= this.maxCacheSize) {
      // 自动清理最老的缓存
      await this.clearOldCache(30);
    }

    try {
      // 下载文件
      const response = await fetch(track.src);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const contentLength = parseInt(response.headers.get('content-length') || '0', 10);
      const reader = response.body?.getReader();

      if (!reader) {
        throw new Error('Failed to get response reader');
      }

      const chunks: Uint8Array[] = [];
      let receivedLength = 0;

      // 读取数据流
      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        chunks.push(value);
        receivedLength += value.length;

        // 报告进度
        if (onProgress && contentLength > 0) {
          onProgress((receivedLength / contentLength) * 100);
        }
      }

      // 合并数据
      const chunksAll = new Uint8Array(receivedLength);
      let position = 0;
      for (const chunk of chunks) {
        chunksAll.set(chunk, position);
        position += chunk.length;
      }

      // 创建 Blob
      const mimeType = response.headers.get('content-type') || 'audio/mpeg';
      const blob = new Blob([chunksAll], { type: mimeType });

      // 保存到 IndexedDB
      const cachedTrack: CachedTrack = {
        id: track.id,
        data: blob,
        metadata: track,
        cachedAt: new Date(),
        size: blob.size,
        mimeType,
      };

      await this.saveToDb(cachedTrack);
    } catch (error) {
      console.error('Failed to cache track:', error);
      throw error;
    }
  }

  /**
   * 获取缓存的音轨
   */
  async getCachedTrack(trackId: string): Promise<CachedTrack | null> {
    if (!this.db) {
      await this.init();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.get(trackId);

      request.onsuccess = () => {
        const result = request.result as CachedTrack | undefined;
        if (result) {
          // 转换日期
          result.cachedAt = new Date(result.cachedAt);
        }
        resolve(result || null);
      };

      request.onerror = () => {
        reject(new Error('Failed to get cached track'));
      };
    });
  }

  /**
   * 获取缓存的媒体 URL
   */
  async getCachedUrl(trackId: string): Promise<string | null> {
    const cached = await this.getCachedTrack(trackId);
    if (!cached) return null;

    return URL.createObjectURL(cached.data);
  }

  /**
   * 检查是否已缓存
   */
  async isCached(trackId: string): Promise<boolean> {
    const cached = await this.getCachedTrack(trackId);
    return cached !== null;
  }

  /**
   * 删除缓存
   */
  async removeCache(trackId: string): Promise<void> {
    if (!this.db) {
      await this.init();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.delete(trackId);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('Failed to remove cache'));
    });
  }

  /**
   * 获取所有缓存的音轨 ID
   */
  async getAllCachedIds(): Promise<string[]> {
    if (!this.db) {
      await this.init();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.getAllKeys();

      request.onsuccess = () => {
        resolve(request.result as string[]);
      };

      request.onerror = () => {
        reject(new Error('Failed to get cached IDs'));
      };
    });
  }

  /**
   * 获取所有缓存的音轨
   */
  async getAllCached(): Promise<CachedTrack[]> {
    if (!this.db) {
      await this.init();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.getAll();

      request.onsuccess = () => {
        const results = request.result as CachedTrack[];
        // 转换日期
        results.forEach(result => {
          result.cachedAt = new Date(result.cachedAt);
        });
        resolve(results);
      };

      request.onerror = () => {
        reject(new Error('Failed to get all cached tracks'));
      };
    });
  }

  /**
   * 清除指定天数之前的缓存
   */
  async clearOldCache(daysOld = 30): Promise<number> {
    if (!this.db) {
      await this.init();
    }

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const allCached = await this.getAllCached();
    let removedCount = 0;

    for (const cached of allCached) {
      if (cached.cachedAt < cutoffDate) {
        await this.removeCache(cached.id);
        removedCount++;
      }
    }

    return removedCount;
  }

  /**
   * 清除所有缓存
   */
  async clearAll(): Promise<void> {
    if (!this.db) {
      await this.init();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('Failed to clear cache'));
    });
  }

  /**
   * 获取缓存统计信息
   */
  async getStatistics(): Promise<CacheStatistics> {
    const allCached = await this.getAllCached();

    if (allCached.length === 0) {
      return {
        totalTracks: 0,
        totalSize: 0,
        oldestCache: null,
        newestCache: null,
      };
    }

    const totalSize = allCached.reduce((sum, cached) => sum + cached.size, 0);
    const dates = allCached.map(cached => cached.cachedAt.getTime());
    const oldestCache = new Date(Math.min(...dates));
    const newestCache = new Date(Math.max(...dates));

    return {
      totalTracks: allCached.length,
      totalSize,
      oldestCache,
      newestCache,
    };
  }

  /**
   * 设置最大缓存大小
   */
  setMaxCacheSize(bytes: number): void {
    this.maxCacheSize = bytes;
  }

  /**
   * 获取最大缓存大小
   */
  getMaxCacheSize(): number {
    return this.maxCacheSize;
  }

  /**
   * 批量缓存
   */
  async batchCache(
    tracks: Track[],
    onProgress?: (trackIndex: number, progress: number) => void
  ): Promise<void> {
    for (let i = 0; i < tracks.length; i++) {
      const track = tracks[i];

      // 检查是否已缓存
      const isCached = await this.isCached(track.id);
      if (isCached) {
        onProgress?.(i, 100);
        continue;
      }

      await this.cacheTrack(track, (progress) => {
        onProgress?.(i, progress);
      });
    }
  }

  /**
   * 保存到数据库
   */
  private async saveToDb(cachedTrack: CachedTrack): Promise<void> {
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.put(cachedTrack);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('Failed to save to database'));
    });
  }

  /**
   * 关闭数据库连接
   */
  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }

  /**
   * 删除整个数据库
   */
  static async deleteDatabase(dbName = 'ldesign-player-offline'): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.deleteDatabase(dbName);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('Failed to delete database'));
    });
  }
}
