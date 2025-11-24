/**
 * 画质切换功能
 * 支持多清晰度切换（480p/720p/1080p/4K），自动根据网速选择最佳画质
 */

import type { IPlayer } from '../types/player';

export interface QualityLevel {
  id: string;
  label: string; // '4K', '1080p', '720p', '480p', '360p'
  width: number;
  height: number;
  bitrate: number; // kbps
  url: string;
  isDefault?: boolean;
}

export type QualityChangeListener = (quality: QualityLevel) => void;

export class QualitySwitcher {
  private player: IPlayer;
  private qualities: QualityLevel[] = [];
  private currentQuality: QualityLevel | null = null;
  private autoSwitch = true;
  private listeners: Set<QualityChangeListener> = new Set();
  private bandwidthMonitor: number | null = null;

  constructor(player: IPlayer) {
    this.player = player;
  }

  /**
   * 添加画质选项
   */
  addQuality(quality: QualityLevel): void {
    // 检查是否已存在
    const existing = this.qualities.find(q => q.id === quality.id);
    if (existing) {
      console.warn(`Quality ${quality.id} already exists`);
      return;
    }

    this.qualities.push(quality);

    // 按分辨率排序（从高到低）
    this.qualities.sort((a, b) => b.height - a.height);

    // 设置默认画质
    if (quality.isDefault || this.currentQuality === null) {
      this.currentQuality = quality;
    }
  }

  /**
   * 批量添加画质
   */
  addQualities(qualities: QualityLevel[]): void {
    qualities.forEach(q => this.addQuality(q));
  }

  /**
   * 切换画质
   */
  async switchQuality(qualityId: string, preservePosition = true): Promise<boolean> {
    const quality = this.qualities.find(q => q.id === qualityId);

    if (!quality) {
      console.error(`Quality ${qualityId} not found`);
      return false;
    }

    if (quality === this.currentQuality) {
      return true; // 已经是当前画质
    }

    try {
      // 保存当前播放状态
      const currentTime = preservePosition ? this.player.getCurrentTime() : 0;
      const isPlaying = this.player.getState?.().isPlaying || false;

      // 加载新画质
      await this.player.load(quality.url);

      // 恢复播放位置
      if (preservePosition && currentTime > 0) {
        this.player.seek(currentTime);
      }

      // 恢复播放状态
      if (isPlaying) {
        await this.player.play();
      }

      this.currentQuality = quality;
      this.notifyListeners(quality);

      return true;
    } catch (error) {
      console.error('Failed to switch quality:', error);
      return false;
    }
  }

  /**
   * 获取当前画质
   */
  getCurrentQuality(): QualityLevel | null {
    return this.currentQuality;
  }

  /**
   * 获取所有画质
   */
  getAllQualities(): QualityLevel[] {
    return [...this.qualities];
  }

  /**
   * 根据标签获取画质
   */
  getQualityByLabel(label: string): QualityLevel | null {
    return this.qualities.find(q => q.label === label) || null;
  }

  /**
   * 启用自动画质切换
   */
  enableAutoSwitch(): void {
    this.autoSwitch = true;
    this.startBandwidthMonitoring();
  }

  /**
   * 禁用自动画质切换
   */
  disableAutoSwitch(): void {
    this.autoSwitch = false;
    this.stopBandwidthMonitoring();
  }

  /**
   * 是否启用自动切换
   */
  isAutoSwitchEnabled(): boolean {
    return this.autoSwitch;
  }

  /**
   * 自动选择最佳画质
   */
  async autoSelectQuality(): Promise<void> {
    const quality = this.selectBestQuality();
    if (quality && quality !== this.currentQuality) {
      await this.switchQuality(quality.id);
    }
  }

  /**
   * 根据网络状况选择最佳画质
   */
  private selectBestQuality(): QualityLevel | null {
    if (this.qualities.length === 0) {
      return null;
    }

    // 尝试使用 Network Information API
    const connection = (navigator as any).connection;

    if (connection) {
      const effectiveType = connection.effectiveType; // '4g', '3g', '2g', 'slow-2g'
      const downlink = connection.downlink; // Mbps

      if (effectiveType === '4g' && downlink >= 10) {
        return this.getQualityByLabel('1080p') || this.qualities[0];
      } else if (effectiveType === '4g' && downlink >= 5) {
        return this.getQualityByLabel('720p') || this.qualities[1];
      } else if (effectiveType === '3g') {
        return this.getQualityByLabel('480p') || this.qualities[2];
      } else {
        return this.getQualityByLabel('360p') || this.qualities[this.qualities.length - 1];
      }
    }

    // 降级方案：使用默认画质或中等画质
    return this.qualities[Math.floor(this.qualities.length / 2)];
  }

  /**
   * 开始带宽监控
   */
  private startBandwidthMonitoring(): void {
    if (this.bandwidthMonitor !== null) return;

    // 每30秒检查一次网络状况
    this.bandwidthMonitor = window.setInterval(() => {
      if (this.autoSwitch) {
        this.autoSelectQuality();
      }
    }, 30000);
  }

  /**
   * 停止带宽监控
   */
  private stopBandwidthMonitoring(): void {
    if (this.bandwidthMonitor !== null) {
      clearInterval(this.bandwidthMonitor);
      this.bandwidthMonitor = null;
    }
  }

  /**
   * 监听画质变化
   */
  onChange(listener: QualityChangeListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * 通知监听器
   */
  private notifyListeners(quality: QualityLevel): void {
    this.listeners.forEach(listener => {
      try {
        listener(quality);
      } catch (error) {
        console.error('Error in quality change listener:', error);
      }
    });
  }

  /**
   * 获取推荐画质（基于屏幕尺寸）
   */
  getRecommendedQuality(): QualityLevel | null {
    const screenWidth = window.screen.width;
    const screenHeight = window.screen.height;
    const maxDimension = Math.max(screenWidth, screenHeight);

    // 根据屏幕分辨率推荐画质
    if (maxDimension >= 3840) {
      return this.getQualityByLabel('4K');
    } else if (maxDimension >= 1920) {
      return this.getQualityByLabel('1080p');
    } else if (maxDimension >= 1280) {
      return this.getQualityByLabel('720p');
    } else {
      return this.getQualityByLabel('480p');
    }
  }

  /**
   * 销毁
   */
  destroy(): void {
    this.stopBandwidthMonitoring();
    this.listeners.clear();
    this.qualities = [];
    this.currentQuality = null;
  }
}
