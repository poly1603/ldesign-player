/**
 * 播放速度记忆功能
 * 记住每个音视频的播放速度，下次自动应用
 */

export interface RateMemory {
  trackId: string;
  rate: number;
  timestamp: Date;
}

export interface PlaybackRateMemoryOptions {
  storageKey?: string;
  defaultRate?: number;
  globalRate?: boolean; // 是否使用全局速度（所有视频相同速度）
}

export class PlaybackRateMemory {
  private storageKey = 'ldesign-player-rate-memory';
  private rates: Map<string, RateMemory> = new Map();
  private defaultRate = 1.0;
  private globalRate = false;
  private globalRateValue = 1.0;

  constructor(options: PlaybackRateMemoryOptions = {}) {
    if (options.storageKey) {
      this.storageKey = options.storageKey;
    }
    if (options.defaultRate !== undefined) {
      this.defaultRate = options.defaultRate;
    }
    if (options.globalRate !== undefined) {
      this.globalRate = options.globalRate;
    }

    this.loadFromStorage();
  }

  /**
   * 记住播放速度
   */
  rememberRate(trackId: string, rate: number): void {
    // 验证速度范围
    if (rate < 0.25 || rate > 4.0) {
      console.warn('Playback rate must be between 0.25 and 4.0');
      return;
    }

    if (this.globalRate) {
      // 全局模式：所有视频使用相同速度
      this.globalRateValue = rate;
      localStorage.setItem(`${this.storageKey}-global`, rate.toString());
    } else {
      // 单独记忆模式
      const memory: RateMemory = {
        trackId,
        rate,
        timestamp: new Date(),
      };

      this.rates.set(trackId, memory);
      this.saveToStorage();
    }
  }

  /**
   * 获取播放速度
   */
  getRate(trackId: string): number {
    if (this.globalRate) {
      return this.globalRateValue;
    }

    const memory = this.rates.get(trackId);
    return memory ? memory.rate : this.defaultRate;
  }

  /**
   * 设置默认速度
   */
  setDefaultRate(rate: number): void {
    if (rate < 0.25 || rate > 4.0) {
      console.warn('Playback rate must be between 0.25 and 4.0');
      return;
    }
    this.defaultRate = rate;
  }

  /**
   * 获取默认速度
   */
  getDefaultRate(): number {
    return this.defaultRate;
  }

  /**
   * 启用全局速度模式
   */
  enableGlobalRate(rate?: number): void {
    this.globalRate = true;
    if (rate !== undefined) {
      this.globalRateValue = rate;
      localStorage.setItem(`${this.storageKey}-global`, rate.toString());
    }
  }

  /**
   * 禁用全局速度模式
   */
  disableGlobalRate(): void {
    this.globalRate = false;
  }

  /**
   * 是否使用全局速度
   */
  isGlobalRateEnabled(): boolean {
    return this.globalRate;
  }

  /**
   * 清除指定记录
   */
  clearRate(trackId: string): void {
    this.rates.delete(trackId);
    this.saveToStorage();
  }

  /**
   * 清除所有记录
   */
  clearAll(): void {
    this.rates.clear();
    this.saveToStorage();
  }

  /**
   * 获取所有记录
   */
  getAllRates(): RateMemory[] {
    return Array.from(this.rates.values());
  }

  /**
   * 获取最常用的速度
   */
  getMostUsedRate(): number {
    if (this.rates.size === 0) {
      return this.defaultRate;
    }

    const rateCount = new Map<number, number>();

    for (const memory of this.rates.values()) {
      const count = rateCount.get(memory.rate) || 0;
      rateCount.set(memory.rate, count + 1);
    }

    let mostUsedRate = this.defaultRate;
    let maxCount = 0;

    for (const [rate, count] of rateCount.entries()) {
      if (count > maxCount) {
        maxCount = count;
        mostUsedRate = rate;
      }
    }

    return mostUsedRate;
  }

  /**
   * 根据类型获取推荐速度
   */
  getRecommendedRate(type: 'music' | 'video' | 'podcast' | 'audiobook'): number {
    const recommendations = {
      music: 1.0,
      video: 1.0,
      podcast: 1.25,
      audiobook: 1.5,
    };

    return recommendations[type] || this.defaultRate;
  }

  /**
   * 从 localStorage 加载
   */
  private loadFromStorage(): void {
    try {
      // 加载全局速度
      const globalRate = localStorage.getItem(`${this.storageKey}-global`);
      if (globalRate) {
        this.globalRateValue = parseFloat(globalRate);
      }

      // 加载单独记忆
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        this.rates = new Map(
          parsed.map((item: any) => [
            item.trackId,
            {
              ...item,
              timestamp: new Date(item.timestamp),
            },
          ])
        );
      }
    } catch (error) {
      console.error('Failed to load playback rate memory:', error);
    }
  }

  /**
   * 保存到 localStorage
   */
  private saveToStorage(): void {
    try {
      const data = Array.from(this.rates.values());
      localStorage.setItem(this.storageKey, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save playback rate memory:', error);
    }
  }
}
