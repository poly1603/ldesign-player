/**
 * 智能预加载模块
 * 根据用户行为和网络状况智能预加载媒体资源
 */

export interface PreloadItem {
  /** 资源 URL */
  url: string;
  /** 资源类型 */
  type: 'video' | 'audio';
  /** 优先级 (0-10, 越高越优先) */
  priority?: number;
  /** 预加载的字节数 (默认预加载 2MB) */
  bytes?: number;
  /** 元数据 */
  metadata?: Record<string, unknown>;
}

export interface PreloadStatus {
  url: string;
  status: 'pending' | 'loading' | 'loaded' | 'error';
  progress: number;
  loadedBytes: number;
  totalBytes?: number;
  error?: Error;
}

export interface SmartPreloadOptions {
  /** 是否启用 */
  enabled?: boolean;
  /** 最大并发预加载数 */
  maxConcurrent?: number;
  /** 最大预加载缓存大小 (字节) */
  maxCacheSize?: number;
  /** 默认预加载字节数 */
  defaultPreloadBytes?: number;
  /** 网络慢时是否暂停预加载 */
  pauseOnSlowNetwork?: boolean;
  /** 慢网络阈值 (下行速度 Mbps) */
  slowNetworkThreshold?: number;
  /** 电池电量低时是否暂停 */
  pauseOnLowBattery?: boolean;
  /** 低电量阈值 (0-1) */
  lowBatteryThreshold?: number;
  /** 视口外是否暂停 */
  pauseWhenHidden?: boolean;
}

interface CachedResource {
  url: string;
  blob: Blob;
  objectUrl: string;
  timestamp: number;
  size: number;
}

export class SmartPreload {
  private enabled: boolean;
  private maxConcurrent: number;
  private maxCacheSize: number;
  private defaultPreloadBytes: number;
  private pauseOnSlowNetwork: boolean;
  private slowNetworkThreshold: number;
  private pauseOnLowBattery: boolean;
  private lowBatteryThreshold: number;
  private pauseWhenHidden: boolean;

  private queue: PreloadItem[] = [];
  private loading: Map<string, AbortController> = new Map();
  private statusMap: Map<string, PreloadStatus> = new Map();
  private cache: Map<string, CachedResource> = new Map();
  private totalCacheSize = 0;
  private isPaused = false;
  private networkInfo: { downlink?: number; effectiveType?: string } = {};

  private listeners: Map<string, Set<(status: PreloadStatus) => void>> = new Map();

  constructor(options: SmartPreloadOptions = {}) {
    this.enabled = options.enabled ?? true;
    this.maxConcurrent = options.maxConcurrent ?? 2;
    this.maxCacheSize = options.maxCacheSize ?? 100 * 1024 * 1024; // 100MB
    this.defaultPreloadBytes = options.defaultPreloadBytes ?? 2 * 1024 * 1024; // 2MB
    this.pauseOnSlowNetwork = options.pauseOnSlowNetwork ?? true;
    this.slowNetworkThreshold = options.slowNetworkThreshold ?? 1; // 1 Mbps
    this.pauseOnLowBattery = options.pauseOnLowBattery ?? true;
    this.lowBatteryThreshold = options.lowBatteryThreshold ?? 0.2; // 20%
    this.pauseWhenHidden = options.pauseWhenHidden ?? true;

    this.init();
  }

  private init(): void {
    // 监听网络状态变化
    this.setupNetworkMonitoring();

    // 监听电池状态
    this.setupBatteryMonitoring();

    // 监听页面可见性
    this.setupVisibilityMonitoring();
  }

  /**
   * 设置网络监控
   */
  private setupNetworkMonitoring(): void {
    if ('connection' in navigator) {
      const connection = (navigator as Navigator & { connection?: NetworkInformation }).connection;
      if (connection) {
        this.updateNetworkInfo(connection);
        connection.addEventListener('change', () => {
          this.updateNetworkInfo(connection);
          this.checkShouldPause();
        });
      }
    }
  }

  private updateNetworkInfo(connection: NetworkInformation): void {
    this.networkInfo = {
      downlink: connection.downlink,
      effectiveType: connection.effectiveType,
    };
  }

  /**
   * 设置电池监控
   */
  private async setupBatteryMonitoring(): Promise<void> {
    if ('getBattery' in navigator) {
      try {
        const battery = await (navigator as Navigator & { getBattery: () => Promise<BatteryManager> }).getBattery();
        battery.addEventListener('levelchange', () => {
          this.checkShouldPause();
        });
      } catch {
        // 电池 API 不可用
      }
    }
  }

  /**
   * 设置页面可见性监控
   */
  private setupVisibilityMonitoring(): void {
    if (this.pauseWhenHidden) {
      document.addEventListener('visibilitychange', () => {
        this.checkShouldPause();
        if (!document.hidden && !this.isPaused) {
          this.processQueue();
        }
      });
    }
  }

  /**
   * 检查是否应该暂停预加载
   */
  private async checkShouldPause(): Promise<void> {
    let shouldPause = false;

    // 检查页面可见性
    if (this.pauseWhenHidden && document.hidden) {
      shouldPause = true;
    }

    // 检查网络状况
    if (this.pauseOnSlowNetwork) {
      if (this.networkInfo.downlink !== undefined && 
          this.networkInfo.downlink < this.slowNetworkThreshold) {
        shouldPause = true;
      }
      if (this.networkInfo.effectiveType === '2g' || 
          this.networkInfo.effectiveType === 'slow-2g') {
        shouldPause = true;
      }
    }

    // 检查电池电量
    if (this.pauseOnLowBattery && 'getBattery' in navigator) {
      try {
        const battery = await (navigator as Navigator & { getBattery: () => Promise<BatteryManager> }).getBattery();
        if (!battery.charging && battery.level < this.lowBatteryThreshold) {
          shouldPause = true;
        }
      } catch {
        // 忽略
      }
    }

    this.isPaused = shouldPause;

    if (shouldPause) {
      // 取消所有正在进行的预加载
      this.loading.forEach((controller) => controller.abort());
    }
  }

  /**
   * 添加预加载项
   */
  add(item: PreloadItem | PreloadItem[]): void {
    const items = Array.isArray(item) ? item : [item];
    
    for (const i of items) {
      // 跳过已缓存的
      if (this.cache.has(i.url)) continue;
      
      // 跳过已在队列中的
      if (this.queue.some(q => q.url === i.url)) continue;
      
      // 跳过正在加载的
      if (this.loading.has(i.url)) continue;

      this.queue.push({
        ...i,
        priority: i.priority ?? 5,
        bytes: i.bytes ?? this.defaultPreloadBytes,
      });

      this.statusMap.set(i.url, {
        url: i.url,
        status: 'pending',
        progress: 0,
        loadedBytes: 0,
      });
    }

    // 按优先级排序
    this.queue.sort((a, b) => (b.priority ?? 5) - (a.priority ?? 5));

    this.processQueue();
  }

  /**
   * 处理预加载队列
   */
  private processQueue(): void {
    if (!this.enabled || this.isPaused) return;

    while (this.loading.size < this.maxConcurrent && this.queue.length > 0) {
      const item = this.queue.shift()!;
      this.preloadItem(item);
    }
  }

  /**
   * 预加载单个项目
   */
  private async preloadItem(item: PreloadItem): Promise<void> {
    const controller = new AbortController();
    this.loading.set(item.url, controller);

    this.updateStatus(item.url, { status: 'loading', progress: 0 });

    try {
      const response = await fetch(item.url, {
        signal: controller.signal,
        headers: item.bytes ? { Range: `bytes=0-${item.bytes - 1}` } : {},
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const contentLength = parseInt(response.headers.get('content-length') || '0', 10);
      const reader = response.body?.getReader();
      
      if (!reader) {
        throw new Error('Response body is not readable');
      }

      const chunks: Uint8Array[] = [];
      let loadedBytes = 0;

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;

        chunks.push(value);
        loadedBytes += value.length;

        const progress = contentLength > 0 ? loadedBytes / contentLength : 0;
        this.updateStatus(item.url, {
          progress,
          loadedBytes,
          totalBytes: contentLength || undefined,
        });

        // 检查是否应该停止
        if (this.isPaused) {
          reader.cancel();
          throw new Error('Preload paused');
        }

        // 达到目标字节数
        if (item.bytes && loadedBytes >= item.bytes) {
          reader.cancel();
          break;
        }
      }

      // 创建 Blob 并缓存
      const blob = new Blob(chunks as BlobPart[], { type: item.type === 'video' ? 'video/mp4' : 'audio/mpeg' });
      
      // 检查缓存大小限制
      while (this.totalCacheSize + blob.size > this.maxCacheSize && this.cache.size > 0) {
        this.evictOldest();
      }

      const objectUrl = URL.createObjectURL(blob);
      this.cache.set(item.url, {
        url: item.url,
        blob,
        objectUrl,
        timestamp: Date.now(),
        size: blob.size,
      });
      this.totalCacheSize += blob.size;

      this.updateStatus(item.url, { status: 'loaded', progress: 1 });
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        this.updateStatus(item.url, {
          status: 'error',
          error: error as Error,
        });
      }
    } finally {
      this.loading.delete(item.url);
      this.processQueue();
    }
  }

  /**
   * 淘汰最旧的缓存
   */
  private evictOldest(): void {
    let oldestUrl: string | null = null;
    let oldestTime = Infinity;

    for (const [url, resource] of this.cache) {
      if (resource.timestamp < oldestTime) {
        oldestTime = resource.timestamp;
        oldestUrl = url;
      }
    }

    if (oldestUrl) {
      this.removeFromCache(oldestUrl);
    }
  }

  /**
   * 从缓存中移除
   */
  private removeFromCache(url: string): void {
    const resource = this.cache.get(url);
    if (resource) {
      URL.revokeObjectURL(resource.objectUrl);
      this.totalCacheSize -= resource.size;
      this.cache.delete(url);
      this.statusMap.delete(url);
    }
  }

  /**
   * 更新状态并通知监听者
   */
  private updateStatus(url: string, update: Partial<PreloadStatus>): void {
    const current = this.statusMap.get(url);
    if (current) {
      const newStatus = { ...current, ...update };
      this.statusMap.set(url, newStatus);
      
      // 通知监听者
      const listeners = this.listeners.get(url);
      if (listeners) {
        listeners.forEach(cb => cb(newStatus));
      }
    }
  }

  /**
   * 获取预加载状态
   */
  getStatus(url: string): PreloadStatus | undefined {
    return this.statusMap.get(url);
  }

  /**
   * 获取缓存的 Object URL
   */
  getCachedUrl(url: string): string | undefined {
    return this.cache.get(url)?.objectUrl;
  }

  /**
   * 检查是否已缓存
   */
  isCached(url: string): boolean {
    return this.cache.has(url);
  }

  /**
   * 监听预加载状态变化
   */
  onStatusChange(url: string, callback: (status: PreloadStatus) => void): () => void {
    if (!this.listeners.has(url)) {
      this.listeners.set(url, new Set());
    }
    this.listeners.get(url)!.add(callback);

    // 返回取消监听函数
    return () => {
      this.listeners.get(url)?.delete(callback);
    };
  }

  /**
   * 取消预加载
   */
  cancel(url: string): void {
    // 从队列中移除
    const queueIndex = this.queue.findIndex(i => i.url === url);
    if (queueIndex !== -1) {
      this.queue.splice(queueIndex, 1);
    }

    // 取消正在进行的加载
    const controller = this.loading.get(url);
    if (controller) {
      controller.abort();
      this.loading.delete(url);
    }

    this.statusMap.delete(url);
  }

  /**
   * 取消所有预加载
   */
  cancelAll(): void {
    this.queue = [];
    this.loading.forEach(controller => controller.abort());
    this.loading.clear();
  }

  /**
   * 清空缓存
   */
  clearCache(): void {
    for (const url of this.cache.keys()) {
      this.removeFromCache(url);
    }
  }

  /**
   * 暂停预加载
   */
  pause(): void {
    this.isPaused = true;
  }

  /**
   * 恢复预加载
   */
  resume(): void {
    this.isPaused = false;
    this.processQueue();
  }

  /**
   * 启用/禁用
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (enabled) {
      this.processQueue();
    } else {
      this.cancelAll();
    }
  }

  /**
   * 获取缓存统计
   */
  getStats(): {
    queueLength: number;
    loadingCount: number;
    cachedCount: number;
    totalCacheSize: number;
    maxCacheSize: number;
    isPaused: boolean;
    networkInfo: SmartPreload['networkInfo'];
  } {
    return {
      queueLength: this.queue.length,
      loadingCount: this.loading.size,
      cachedCount: this.cache.size,
      totalCacheSize: this.totalCacheSize,
      maxCacheSize: this.maxCacheSize,
      isPaused: this.isPaused,
      networkInfo: this.networkInfo,
    };
  }

  /**
   * 销毁
   */
  destroy(): void {
    this.cancelAll();
    this.clearCache();
    this.listeners.clear();
    this.statusMap.clear();
  }
}

// 类型定义
interface NetworkInformation extends EventTarget {
  downlink: number;
  effectiveType: string;
  addEventListener(type: 'change', listener: () => void): void;
}

interface BatteryManager extends EventTarget {
  charging: boolean;
  level: number;
  addEventListener(type: 'levelchange', listener: () => void): void;
}

/**
 * 创建智能预加载实例的便捷函数
 */
export function createSmartPreload(options?: SmartPreloadOptions): SmartPreload {
  return new SmartPreload(options);
}
