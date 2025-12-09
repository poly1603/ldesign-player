/**
 * 性能优化工具函数
 */

/**
 * 防抖函数 - 延迟执行，多次调用只执行最后一次
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return function (this: unknown, ...args: Parameters<T>) {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      fn.apply(this, args);
      timeoutId = null;
    }, delay);
  };
}

/**
 * 节流函数 - 限制执行频率
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
  fn: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;
  let lastArgs: Parameters<T> | null = null;

  return function (this: unknown, ...args: Parameters<T>) {
    if (!inThrottle) {
      fn.apply(this, args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
        if (lastArgs) {
          fn.apply(this, lastArgs);
          lastArgs = null;
        }
      }, limit);
    } else {
      lastArgs = args;
    }
  };
}

/**
 * 请求动画帧节流 - 基于 requestAnimationFrame 的节流
 */
export function rafThrottle<T extends (...args: unknown[]) => unknown>(
  fn: T
): (...args: Parameters<T>) => void {
  let rafId: number | null = null;
  let lastArgs: Parameters<T> | null = null;

  return function (this: unknown, ...args: Parameters<T>) {
    lastArgs = args;
    if (rafId === null) {
      rafId = requestAnimationFrame(() => {
        if (lastArgs) {
          fn.apply(this, lastArgs);
        }
        rafId = null;
      });
    }
  };
}

/**
 * 懒加载管理器
 */
export class LazyLoader {
  private loadedResources: Map<string, unknown> = new Map();
  private loadingPromises: Map<string, Promise<unknown>> = new Map();

  /**
   * 懒加载资源
   */
  async load<T>(
    key: string,
    loader: () => Promise<T>,
    options?: { cache?: boolean }
  ): Promise<T> {
    const cache = options?.cache ?? true;

    // 已加载，直接返回
    if (cache && this.loadedResources.has(key)) {
      return this.loadedResources.get(key) as T;
    }

    // 正在加载，返回同一个 Promise
    if (this.loadingPromises.has(key)) {
      return this.loadingPromises.get(key) as Promise<T>;
    }

    // 开始加载
    const loadPromise = loader().then((resource) => {
      if (cache) {
        this.loadedResources.set(key, resource);
      }
      this.loadingPromises.delete(key);
      return resource;
    });

    this.loadingPromises.set(key, loadPromise);
    return loadPromise;
  }

  /**
   * 预加载资源
   */
  preload<T>(key: string, loader: () => Promise<T>): void {
    if (!this.loadedResources.has(key) && !this.loadingPromises.has(key)) {
      this.load(key, loader);
    }
  }

  /**
   * 清除缓存
   */
  clear(key?: string): void {
    if (key) {
      this.loadedResources.delete(key);
      this.loadingPromises.delete(key);
    } else {
      this.loadedResources.clear();
      this.loadingPromises.clear();
    }
  }

  /**
   * 检查资源是否已加载
   */
  isLoaded(key: string): boolean {
    return this.loadedResources.has(key);
  }
}

/**
 * 对象池 - 用于复用频繁创建销毁的对象
 */
export class ObjectPool<T> {
  private pool: T[] = [];
  private factory: () => T;
  private reset?: (obj: T) => void;
  private maxSize: number;

  constructor(
    factory: () => T,
    options?: {
      reset?: (obj: T) => void;
      maxSize?: number;
      initialSize?: number;
    }
  ) {
    this.factory = factory;
    this.reset = options?.reset;
    this.maxSize = options?.maxSize ?? 50;

    // 预创建对象
    const initialSize = options?.initialSize ?? 0;
    for (let i = 0; i < initialSize; i++) {
      this.pool.push(factory());
    }
  }

  /**
   * 获取对象
   */
  acquire(): T {
    if (this.pool.length > 0) {
      return this.pool.pop()!;
    }
    return this.factory();
  }

  /**
   * 释放对象
   */
  release(obj: T): void {
    if (this.pool.length < this.maxSize) {
      if (this.reset) {
        this.reset(obj);
      }
      this.pool.push(obj);
    }
  }

  /**
   * 清空对象池
   */
  clear(): void {
    this.pool = [];
  }

  /**
   * 获取当前池大小
   */
  get size(): number {
    return this.pool.length;
  }
}

/**
 * 内存感知缓存 - 监控内存使用并自动清理
 */
export class MemoryAwareCache<K, V> {
  private cache: Map<K, { value: V; size: number; lastAccess: number }> = new Map();
  private totalSize = 0;
  private maxSize: number;

  constructor(maxSizeBytes: number = 50 * 1024 * 1024) {
    this.maxSize = maxSizeBytes;
  }

  /**
   * 设置缓存
   */
  set(key: K, value: V, sizeBytes: number): void {
    // 如果已存在，先移除
    if (this.cache.has(key)) {
      this.totalSize -= this.cache.get(key)!.size;
    }

    // 检查是否需要清理
    while (this.totalSize + sizeBytes > this.maxSize && this.cache.size > 0) {
      this.evictLRU();
    }

    this.cache.set(key, {
      value,
      size: sizeBytes,
      lastAccess: Date.now(),
    });
    this.totalSize += sizeBytes;
  }

  /**
   * 获取缓存
   */
  get(key: K): V | undefined {
    const entry = this.cache.get(key);
    if (entry) {
      entry.lastAccess = Date.now();
      return entry.value;
    }
    return undefined;
  }

  /**
   * 检查是否存在
   */
  has(key: K): boolean {
    return this.cache.has(key);
  }

  /**
   * 删除缓存
   */
  delete(key: K): boolean {
    const entry = this.cache.get(key);
    if (entry) {
      this.totalSize -= entry.size;
      return this.cache.delete(key);
    }
    return false;
  }

  /**
   * 清空缓存
   */
  clear(): void {
    this.cache.clear();
    this.totalSize = 0;
  }

  /**
   * 淘汰最久未使用的缓存
   */
  private evictLRU(): void {
    let oldestKey: K | null = null;
    let oldestTime = Infinity;

    for (const [key, entry] of this.cache) {
      if (entry.lastAccess < oldestTime) {
        oldestTime = entry.lastAccess;
        oldestKey = key;
      }
    }

    if (oldestKey !== null) {
      this.delete(oldestKey);
    }
  }

  /**
   * 获取缓存统计
   */
  getStats(): { entries: number; totalSize: number; maxSize: number } {
    return {
      entries: this.cache.size,
      totalSize: this.totalSize,
      maxSize: this.maxSize,
    };
  }
}

/**
 * 创建 Intersection Observer 懒加载
 */
export function createLazyObserver(
  callback: (entry: IntersectionObserverEntry) => void,
  options?: IntersectionObserverInit
): IntersectionObserver {
  return new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        callback(entry);
      }
    });
  }, options);
}

/**
 * 测量函数执行时间
 */
export function measureTime<T>(
  fn: () => T,
  label?: string
): { result: T; duration: number } {
  const start = performance.now();
  const result = fn();
  const duration = performance.now() - start;

  if (label) {
    console.log(`[Performance] ${label}: ${duration.toFixed(2)}ms`);
  }

  return { result, duration };
}

/**
 * 异步测量函数执行时间
 */
export async function measureTimeAsync<T>(
  fn: () => Promise<T>,
  label?: string
): Promise<{ result: T; duration: number }> {
  const start = performance.now();
  const result = await fn();
  const duration = performance.now() - start;

  if (label) {
    console.log(`[Performance] ${label}: ${duration.toFixed(2)}ms`);
  }

  return { result, duration };
}

// 导出全局懒加载器实例
export const globalLazyLoader = new LazyLoader();
