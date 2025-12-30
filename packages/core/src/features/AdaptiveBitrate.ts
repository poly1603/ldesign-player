/**
 * 自适应码率切换模块 (ABR)
 * 根据网络状况自动选择最佳视频质量
 */

export interface QualityLevel {
  /** 质量标签 */
  label: string;
  /** 视频 URL */
  url: string;
  /** 码率 (bps) */
  bitrate: number;
  /** 分辨率宽度 */
  width?: number;
  /** 分辨率高度 */
  height?: number;
  /** 编解码器 */
  codec?: string;
}

export interface BandwidthEstimate {
  /** 估计带宽 (bps) */
  bandwidth: number;
  /** 置信度 (0-1) */
  confidence: number;
  /** 样本数 */
  sampleCount: number;
  /** 最后更新时间 */
  lastUpdate: number;
}

export interface ABRState {
  /** 当前质量级别索引 */
  currentLevel: number;
  /** 是否启用自动切换 */
  autoSwitch: boolean;
  /** 当前带宽估计 */
  bandwidth: BandwidthEstimate;
  /** 缓冲健康状态 */
  bufferHealth: 'good' | 'fair' | 'poor';
  /** 正在切换中 */
  switching: boolean;
}

export interface AdaptiveBitrateOptions {
  /** 可用的质量级别 */
  levels: QualityLevel[];
  /** 初始质量级别索引 */
  initialLevel?: number;
  /** 是否启用自动切换 */
  autoSwitch?: boolean;
  /** 切换策略 */
  strategy?: 'conservative' | 'aggressive' | 'balanced';
  /** 最小缓冲时间（秒）才允许升级 */
  minBufferForUpgrade?: number;
  /** 触发降级的缓冲阈值（秒） */
  bufferDowngradeThreshold?: number;
  /** 带宽安全系数 (0-1) */
  bandwidthSafetyFactor?: number;
  /** 质量切换回调 */
  onQualityChange?: (level: QualityLevel, index: number) => void;
  /** 带宽更新回调 */
  onBandwidthUpdate?: (estimate: BandwidthEstimate) => void;
}

/**
 * 带宽估计器
 */
class BandwidthEstimator {
  private samples: Array<{ bandwidth: number; weight: number; timestamp: number }> = [];
  private maxSamples = 20;
  private decayFactor = 0.9;
  private minSamplesForEstimate = 3;

  /**
   * 添加带宽样本
   */
  addSample(bytes: number, durationMs: number): void {
    if (durationMs <= 0) return;

    const bandwidth = (bytes * 8 * 1000) / durationMs; // bps
    const now = Date.now();

    // 衰减旧样本的权重
    this.samples.forEach(s => {
      const age = (now - s.timestamp) / 1000;
      s.weight *= Math.pow(this.decayFactor, age);
    });

    // 添加新样本
    this.samples.push({
      bandwidth,
      weight: 1,
      timestamp: now,
    });

    // 限制样本数量
    if (this.samples.length > this.maxSamples) {
      this.samples.shift();
    }
  }

  /**
   * 获取带宽估计
   */
  getEstimate(): BandwidthEstimate {
    if (this.samples.length < this.minSamplesForEstimate) {
      return {
        bandwidth: 0,
        confidence: 0,
        sampleCount: this.samples.length,
        lastUpdate: this.samples.length > 0 ? this.samples[this.samples.length - 1].timestamp : 0,
      };
    }

    // 加权平均
    let totalWeight = 0;
    let weightedSum = 0;

    for (const sample of this.samples) {
      weightedSum += sample.bandwidth * sample.weight;
      totalWeight += sample.weight;
    }

    const avgBandwidth = totalWeight > 0 ? weightedSum / totalWeight : 0;

    // 计算标准差来评估置信度
    let variance = 0;
    for (const sample of this.samples) {
      variance += Math.pow(sample.bandwidth - avgBandwidth, 2) * sample.weight;
    }
    variance = variance / totalWeight;
    const stdDev = Math.sqrt(variance);
    const coefficientOfVariation = avgBandwidth > 0 ? stdDev / avgBandwidth : 1;
    
    // 置信度基于样本数量和变异系数
    const confidence = Math.min(1, this.samples.length / this.maxSamples) * 
                       Math.max(0, 1 - coefficientOfVariation);

    return {
      bandwidth: Math.floor(avgBandwidth),
      confidence,
      sampleCount: this.samples.length,
      lastUpdate: this.samples[this.samples.length - 1].timestamp,
    };
  }

  /**
   * 清除样本
   */
  clear(): void {
    this.samples = [];
  }
}

export class AdaptiveBitrate {
  private levels: QualityLevel[];
  private currentLevel: number;
  private autoSwitch: boolean;
  private strategy: 'conservative' | 'aggressive' | 'balanced';
  private minBufferForUpgrade: number;
  private bufferDowngradeThreshold: number;
  private bandwidthSafetyFactor: number;
  private onQualityChange?: (level: QualityLevel, index: number) => void;
  private onBandwidthUpdate?: (estimate: BandwidthEstimate) => void;

  private estimator: BandwidthEstimator;
  private switching = false;
  private lastSwitchTime = 0;
  private switchCooldown = 5000; // 切换冷却时间（毫秒）
  private bufferHealth: 'good' | 'fair' | 'poor' = 'good';

  constructor(options: AdaptiveBitrateOptions) {
    // 按码率排序
    this.levels = [...options.levels].sort((a, b) => a.bitrate - b.bitrate);
    this.currentLevel = options.initialLevel ?? this.findInitialLevel();
    this.autoSwitch = options.autoSwitch ?? true;
    this.strategy = options.strategy ?? 'balanced';
    this.minBufferForUpgrade = options.minBufferForUpgrade ?? 10;
    this.bufferDowngradeThreshold = options.bufferDowngradeThreshold ?? 5;
    this.bandwidthSafetyFactor = options.bandwidthSafetyFactor ?? 0.7;
    this.onQualityChange = options.onQualityChange;
    this.onBandwidthUpdate = options.onBandwidthUpdate;

    this.estimator = new BandwidthEstimator();
  }

  /**
   * 找到初始质量级别
   */
  private findInitialLevel(): number {
    // 默认从中间质量开始
    return Math.floor(this.levels.length / 2);
  }

  /**
   * 记录下载进度（用于带宽估计）
   */
  recordProgress(loadedBytes: number, durationMs: number): void {
    this.estimator.addSample(loadedBytes, durationMs);
    
    const estimate = this.estimator.getEstimate();
    if (this.onBandwidthUpdate) {
      this.onBandwidthUpdate(estimate);
    }

    // 检查是否需要切换质量
    if (this.autoSwitch) {
      this.checkQualitySwitch(estimate);
    }
  }

  /**
   * 更新缓冲状态
   */
  updateBufferHealth(bufferedSeconds: number): void {
    if (bufferedSeconds >= this.minBufferForUpgrade) {
      this.bufferHealth = 'good';
    } else if (bufferedSeconds >= this.bufferDowngradeThreshold) {
      this.bufferHealth = 'fair';
    } else {
      this.bufferHealth = 'poor';
    }

    // 缓冲不足时立即降级
    if (this.bufferHealth === 'poor' && this.autoSwitch) {
      const estimate = this.estimator.getEstimate();
      this.checkQualitySwitch(estimate);
    }
  }

  /**
   * 检查是否需要切换质量
   */
  private checkQualitySwitch(estimate: BandwidthEstimate): void {
    if (this.switching) return;
    if (Date.now() - this.lastSwitchTime < this.switchCooldown) return;
    if (estimate.confidence < 0.5) return;

    const targetLevel = this.selectQualityLevel(estimate);
    
    if (targetLevel !== this.currentLevel) {
      this.switchToLevel(targetLevel);
    }
  }

  /**
   * 选择最佳质量级别
   */
  private selectQualityLevel(estimate: BandwidthEstimate): number {
    const safeBandwidth = estimate.bandwidth * this.bandwidthSafetyFactor;
    
    // 根据策略调整
    let adjustedBandwidth = safeBandwidth;
    switch (this.strategy) {
      case 'conservative':
        adjustedBandwidth *= 0.7;
        break;
      case 'aggressive':
        adjustedBandwidth *= 1.2;
        break;
      // balanced 不做调整
    }

    // 根据缓冲状态调整
    if (this.bufferHealth === 'poor') {
      // 缓冲不足，降低目标
      adjustedBandwidth *= 0.5;
    } else if (this.bufferHealth === 'fair') {
      // 不升级
      adjustedBandwidth = Math.min(adjustedBandwidth, this.levels[this.currentLevel].bitrate);
    }

    // 找到不超过调整后带宽的最高质量
    let targetLevel = 0;
    for (let i = this.levels.length - 1; i >= 0; i--) {
      if (this.levels[i].bitrate <= adjustedBandwidth) {
        targetLevel = i;
        break;
      }
    }

    // 防止频繁切换，只允许单级跳变
    if (targetLevel > this.currentLevel + 1) {
      targetLevel = this.currentLevel + 1;
    } else if (targetLevel < this.currentLevel - 1) {
      targetLevel = this.currentLevel - 1;
    }

    return targetLevel;
  }

  /**
   * 切换到指定质量级别
   */
  switchToLevel(levelIndex: number): boolean {
    if (levelIndex < 0 || levelIndex >= this.levels.length) {
      return false;
    }

    if (levelIndex === this.currentLevel) {
      return true;
    }

    this.switching = true;
    this.currentLevel = levelIndex;
    this.lastSwitchTime = Date.now();

    if (this.onQualityChange) {
      this.onQualityChange(this.levels[levelIndex], levelIndex);
    }

    this.switching = false;
    return true;
  }

  /**
   * 获取当前质量级别
   */
  getCurrentLevel(): QualityLevel {
    return this.levels[this.currentLevel];
  }

  /**
   * 获取当前质量级别索引
   */
  getCurrentLevelIndex(): number {
    return this.currentLevel;
  }

  /**
   * 获取所有质量级别
   */
  getLevels(): QualityLevel[] {
    return [...this.levels];
  }

  /**
   * 获取带宽估计
   */
  getBandwidthEstimate(): BandwidthEstimate {
    return this.estimator.getEstimate();
  }

  /**
   * 获取当前状态
   */
  getState(): ABRState {
    return {
      currentLevel: this.currentLevel,
      autoSwitch: this.autoSwitch,
      bandwidth: this.estimator.getEstimate(),
      bufferHealth: this.bufferHealth,
      switching: this.switching,
    };
  }

  /**
   * 设置是否自动切换
   */
  setAutoSwitch(enabled: boolean): void {
    this.autoSwitch = enabled;
  }

  /**
   * 设置切换策略
   */
  setStrategy(strategy: 'conservative' | 'aggressive' | 'balanced'): void {
    this.strategy = strategy;
  }

  /**
   * 手动选择质量级别
   */
  selectLevel(levelIndex: number): boolean {
    this.autoSwitch = false; // 手动选择时禁用自动切换
    return this.switchToLevel(levelIndex);
  }

  /**
   * 获取推荐的质量级别
   */
  getRecommendedLevel(): number {
    const estimate = this.estimator.getEstimate();
    if (estimate.confidence < 0.3) {
      return this.currentLevel;
    }
    return this.selectQualityLevel(estimate);
  }

  /**
   * 格式化带宽显示
   */
  static formatBandwidth(bps: number): string {
    if (bps >= 1000000) {
      return `${(bps / 1000000).toFixed(1)} Mbps`;
    } else if (bps >= 1000) {
      return `${(bps / 1000).toFixed(0)} Kbps`;
    }
    return `${bps} bps`;
  }

  /**
   * 格式化分辨率显示
   */
  static formatResolution(level: QualityLevel): string {
    if (level.height) {
      return `${level.height}p`;
    }
    return level.label;
  }

  /**
   * 重置状态
   */
  reset(): void {
    this.estimator.clear();
    this.currentLevel = this.findInitialLevel();
    this.switching = false;
    this.lastSwitchTime = 0;
    this.bufferHealth = 'good';
  }

  /**
   * 销毁
   */
  destroy(): void {
    this.reset();
  }
}

/**
 * 创建自适应码率实例的便捷函数
 */
export function createAdaptiveBitrate(options: AdaptiveBitrateOptions): AdaptiveBitrate {
  return new AdaptiveBitrate(options);
}

/**
 * 从 HLS 清单解析质量级别
 */
export function parseHLSLevels(manifest: string, baseUrl: string): QualityLevel[] {
  const levels: QualityLevel[] = [];
  const lines = manifest.split('\n');
  
  let currentBandwidth = 0;
  let currentResolution = { width: 0, height: 0 };
  let currentCodec = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    if (line.startsWith('#EXT-X-STREAM-INF:')) {
      // 解析参数
      const bandwidthMatch = line.match(/BANDWIDTH=(\d+)/);
      const resolutionMatch = line.match(/RESOLUTION=(\d+)x(\d+)/);
      const codecMatch = line.match(/CODECS="([^"]+)"/);

      if (bandwidthMatch) {
        currentBandwidth = parseInt(bandwidthMatch[1], 10);
      }
      if (resolutionMatch) {
        currentResolution = {
          width: parseInt(resolutionMatch[1], 10),
          height: parseInt(resolutionMatch[2], 10),
        };
      }
      if (codecMatch) {
        currentCodec = codecMatch[1];
      }
    } else if (line && !line.startsWith('#')) {
      // 这是播放列表 URL
      const url = line.startsWith('http') ? line : new URL(line, baseUrl).href;
      
      levels.push({
        label: currentResolution.height ? `${currentResolution.height}p` : `${Math.round(currentBandwidth / 1000)}k`,
        url,
        bitrate: currentBandwidth,
        width: currentResolution.width || undefined,
        height: currentResolution.height || undefined,
        codec: currentCodec || undefined,
      });

      // 重置
      currentBandwidth = 0;
      currentResolution = { width: 0, height: 0 };
      currentCodec = '';
    }
  }

  return levels.sort((a, b) => a.bitrate - b.bitrate);
}
