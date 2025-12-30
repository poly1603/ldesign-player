/**
 * 播放统计分析模块
 * 记录观看行为、完播率、热点区域等统计数据
 */

export interface PlaybackEvent {
  type: 'play' | 'pause' | 'seek' | 'ended' | 'error' | 'buffer' | 'quality_change' | 'fullscreen';
  timestamp: number;
  position: number;
  duration: number;
  data?: Record<string, unknown>;
}

export interface WatchSession {
  id: string;
  mediaId: string;
  startTime: number;
  endTime?: number;
  duration: number;
  watchedDuration: number;
  completionRate: number;
  events: PlaybackEvent[];
  segments: WatchSegment[];
  quality?: string;
  device: DeviceInfo;
}

export interface WatchSegment {
  start: number;
  end: number;
  watchCount: number;
}

export interface DeviceInfo {
  userAgent: string;
  platform: string;
  screenWidth: number;
  screenHeight: number;
  devicePixelRatio: number;
  isMobile: boolean;
  isTouch: boolean;
}

export interface HeatmapData {
  position: number;
  views: number;
  avgWatchTime: number;
}

export interface AnalyticsStats {
  totalWatchTime: number;
  totalSessions: number;
  avgSessionDuration: number;
  avgCompletionRate: number;
  completedCount: number;
  heatmap: HeatmapData[];
  mostRewatched: WatchSegment[];
  peakViewingHours: { hour: number; count: number }[];
}

export interface PlaybackAnalyticsOptions {
  /** 媒体标识 */
  mediaId: string;
  /** 媒体时长（秒） */
  duration: number;
  /** 热力图分段数 */
  heatmapSegments?: number;
  /** 是否持久化存储 */
  persist?: boolean;
  /** 存储键前缀 */
  storagePrefix?: string;
  /** 数据上报回调 */
  onReport?: (session: WatchSession) => void;
  /** 采样间隔（毫秒） */
  sampleInterval?: number;
}

export class PlaybackAnalytics {
  private mediaId: string;
  private duration: number;
  private heatmapSegments: number;
  private persist: boolean;
  private storagePrefix: string;
  private onReport?: (session: WatchSession) => void;
  private sampleInterval: number;

  private currentSession: WatchSession | null = null;
  private sessions: WatchSession[] = [];
  private isPlaying = false;
  private lastPosition = 0;
  private lastSampleTime = 0;
  private sampleTimer: number | null = null;
  private watchedRanges: Array<{ start: number; end: number }> = [];
  private heatmap: number[] = [];

  constructor(options: PlaybackAnalyticsOptions) {
    this.mediaId = options.mediaId;
    this.duration = options.duration;
    this.heatmapSegments = options.heatmapSegments ?? 100;
    this.persist = options.persist ?? true;
    this.storagePrefix = options.storagePrefix ?? 'player_analytics_';
    this.onReport = options.onReport;
    this.sampleInterval = options.sampleInterval ?? 1000;

    // 初始化热力图
    this.heatmap = new Array(this.heatmapSegments).fill(0);

    // 加载历史数据
    if (this.persist) {
      this.loadFromStorage();
    }
  }

  /**
   * 开始新的观看会话
   */
  startSession(): void {
    this.currentSession = {
      id: this.generateSessionId(),
      mediaId: this.mediaId,
      startTime: Date.now(),
      duration: this.duration,
      watchedDuration: 0,
      completionRate: 0,
      events: [],
      segments: [],
      device: this.getDeviceInfo(),
    };

    this.watchedRanges = [];
    this.lastPosition = 0;
    this.lastSampleTime = Date.now();
  }

  /**
   * 结束当前会话
   */
  endSession(): WatchSession | null {
    if (!this.currentSession) return null;

    this.stopSampling();

    // 计算观看时长和完播率
    this.currentSession.endTime = Date.now();
    this.currentSession.watchedDuration = this.calculateWatchedDuration();
    this.currentSession.completionRate = this.calculateCompletionRate();
    this.currentSession.segments = this.mergeWatchedRanges();

    // 保存会话
    this.sessions.push(this.currentSession);
    
    // 持久化
    if (this.persist) {
      this.saveToStorage();
    }

    // 上报
    if (this.onReport) {
      this.onReport(this.currentSession);
    }

    const session = this.currentSession;
    this.currentSession = null;
    return session;
  }

  /**
   * 记录播放事件
   */
  recordEvent(type: PlaybackEvent['type'], position: number, data?: Record<string, unknown>): void {
    if (!this.currentSession) return;

    const event: PlaybackEvent = {
      type,
      timestamp: Date.now(),
      position,
      duration: this.duration,
      data,
    };

    this.currentSession.events.push(event);

    // 更新状态
    if (type === 'play') {
      this.isPlaying = true;
      this.startSampling();
    } else if (type === 'pause' || type === 'ended') {
      this.isPlaying = false;
      this.stopSampling();
      this.recordWatchedRange(this.lastPosition, position);
    } else if (type === 'seek') {
      if (this.isPlaying) {
        this.recordWatchedRange(this.lastPosition, position);
      }
    }

    this.lastPosition = position;
  }

  /**
   * 更新当前播放位置（用于采样）
   */
  updatePosition(position: number): void {
    if (!this.currentSession || !this.isPlaying) return;

    const now = Date.now();
    const elapsed = now - this.lastSampleTime;

    if (elapsed >= this.sampleInterval) {
      // 更新热力图
      this.updateHeatmap(position);
      
      // 记录观看范围
      if (Math.abs(position - this.lastPosition) < 3) {
        // 正常播放，不是跳转
        this.recordWatchedRange(this.lastPosition, position);
      }

      this.lastPosition = position;
      this.lastSampleTime = now;
    }
  }

  /**
   * 开始采样
   */
  private startSampling(): void {
    if (this.sampleTimer) return;

    this.sampleTimer = window.setInterval(() => {
      // 定期检查播放状态
    }, this.sampleInterval);
  }

  /**
   * 停止采样
   */
  private stopSampling(): void {
    if (this.sampleTimer) {
      clearInterval(this.sampleTimer);
      this.sampleTimer = null;
    }
  }

  /**
   * 记录观看范围
   */
  private recordWatchedRange(start: number, end: number): void {
    if (start > end) {
      [start, end] = [end, start];
    }

    // 添加新的观看范围
    this.watchedRanges.push({ start, end });
  }

  /**
   * 合并观看范围
   */
  private mergeWatchedRanges(): WatchSegment[] {
    if (this.watchedRanges.length === 0) return [];

    // 按开始时间排序
    const sorted = [...this.watchedRanges].sort((a, b) => a.start - b.start);

    const merged: WatchSegment[] = [];
    let current = { ...sorted[0], watchCount: 1 };

    for (let i = 1; i < sorted.length; i++) {
      const range = sorted[i];
      
      if (range.start <= current.end + 1) {
        // 重叠或相邻，合并
        current.end = Math.max(current.end, range.end);
        current.watchCount++;
      } else {
        // 不重叠，保存当前并开始新的
        merged.push(current);
        current = { ...range, watchCount: 1 };
      }
    }
    merged.push(current);

    return merged;
  }

  /**
   * 计算观看时长
   */
  private calculateWatchedDuration(): number {
    const merged = this.mergeWatchedRanges();
    return merged.reduce((total, segment) => total + (segment.end - segment.start), 0);
  }

  /**
   * 计算完播率
   */
  private calculateCompletionRate(): number {
    const watchedDuration = this.calculateWatchedDuration();
    return Math.min(1, watchedDuration / this.duration);
  }

  /**
   * 更新热力图
   */
  private updateHeatmap(position: number): void {
    const segmentIndex = Math.floor((position / this.duration) * this.heatmapSegments);
    if (segmentIndex >= 0 && segmentIndex < this.heatmapSegments) {
      this.heatmap[segmentIndex]++;
    }
  }

  /**
   * 获取统计数据
   */
  getStats(): AnalyticsStats {
    const allSessions = [...this.sessions];
    if (this.currentSession) {
      allSessions.push({
        ...this.currentSession,
        watchedDuration: this.calculateWatchedDuration(),
        completionRate: this.calculateCompletionRate(),
      });
    }

    const totalWatchTime = allSessions.reduce((sum, s) => sum + s.watchedDuration, 0);
    const totalSessions = allSessions.length;
    const avgSessionDuration = totalSessions > 0 ? totalWatchTime / totalSessions : 0;
    const avgCompletionRate = totalSessions > 0
      ? allSessions.reduce((sum, s) => sum + s.completionRate, 0) / totalSessions
      : 0;
    const completedCount = allSessions.filter(s => s.completionRate >= 0.9).length;

    // 生成热力图数据
    const maxViews = Math.max(...this.heatmap, 1);
    const heatmapData: HeatmapData[] = this.heatmap.map((views, index) => ({
      position: (index / this.heatmapSegments) * this.duration,
      views,
      avgWatchTime: views * (this.sampleInterval / 1000),
    }));

    // 找出最常重看的片段
    const allSegments: WatchSegment[] = [];
    allSessions.forEach(s => allSegments.push(...s.segments));
    const mostRewatched = allSegments
      .filter(s => s.watchCount > 1)
      .sort((a, b) => b.watchCount - a.watchCount)
      .slice(0, 10);

    // 计算观看高峰时段
    const hourCounts = new Array(24).fill(0);
    allSessions.forEach(s => {
      const hour = new Date(s.startTime).getHours();
      hourCounts[hour]++;
    });
    const peakViewingHours = hourCounts.map((count, hour) => ({ hour, count }))
      .sort((a, b) => b.count - a.count);

    return {
      totalWatchTime,
      totalSessions,
      avgSessionDuration,
      avgCompletionRate,
      completedCount,
      heatmap: heatmapData,
      mostRewatched,
      peakViewingHours,
    };
  }

  /**
   * 获取热力图数据（归一化）
   */
  getNormalizedHeatmap(): number[] {
    const max = Math.max(...this.heatmap, 1);
    return this.heatmap.map(v => v / max);
  }

  /**
   * 获取设备信息
   */
  private getDeviceInfo(): DeviceInfo {
    const ua = navigator.userAgent;
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

    return {
      userAgent: ua,
      platform: navigator.platform,
      screenWidth: window.screen.width,
      screenHeight: window.screen.height,
      devicePixelRatio: window.devicePixelRatio || 1,
      isMobile,
      isTouch,
    };
  }

  /**
   * 生成会话 ID
   */
  private generateSessionId(): string {
    return `${this.mediaId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 从存储加载数据
   */
  private loadFromStorage(): void {
    try {
      const key = `${this.storagePrefix}${this.mediaId}`;
      const data = localStorage.getItem(key);
      if (data) {
        const parsed = JSON.parse(data);
        this.sessions = parsed.sessions || [];
        this.heatmap = parsed.heatmap || new Array(this.heatmapSegments).fill(0);
      }
    } catch (error) {
      console.warn('Failed to load analytics from storage:', error);
    }
  }

  /**
   * 保存到存储
   */
  private saveToStorage(): void {
    try {
      const key = `${this.storagePrefix}${this.mediaId}`;
      const data = {
        sessions: this.sessions.slice(-50), // 只保留最近50个会话
        heatmap: this.heatmap,
      };
      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to save analytics to storage:', error);
    }
  }

  /**
   * 清除所有数据
   */
  clearData(): void {
    this.sessions = [];
    this.heatmap = new Array(this.heatmapSegments).fill(0);
    this.watchedRanges = [];
    
    if (this.persist) {
      try {
        const key = `${this.storagePrefix}${this.mediaId}`;
        localStorage.removeItem(key);
      } catch {
        // 忽略
      }
    }
  }

  /**
   * 导出数据
   */
  exportData(): {
    mediaId: string;
    sessions: WatchSession[];
    stats: AnalyticsStats;
  } {
    return {
      mediaId: this.mediaId,
      sessions: this.sessions,
      stats: this.getStats(),
    };
  }

  /**
   * 销毁
   */
  destroy(): void {
    this.endSession();
    this.stopSampling();
  }
}

/**
 * 创建播放统计实例的便捷函数
 */
export function createPlaybackAnalytics(options: PlaybackAnalyticsOptions): PlaybackAnalytics {
  return new PlaybackAnalytics(options);
}

/**
 * 热力图渲染辅助函数
 */
export function renderHeatmapToCanvas(
  canvas: HTMLCanvasElement,
  heatmap: number[],
  options?: {
    colorStart?: string;
    colorEnd?: string;
    height?: number;
  }
): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const colorStart = options?.colorStart ?? 'rgba(0, 123, 255, 0.2)';
  const colorEnd = options?.colorEnd ?? 'rgba(0, 123, 255, 1)';
  const height = options?.height ?? canvas.height;

  const barWidth = canvas.width / heatmap.length;

  heatmap.forEach((value, index) => {
    const barHeight = value * height;
    
    // 创建渐变
    const gradient = ctx.createLinearGradient(0, height, 0, height - barHeight);
    gradient.addColorStop(0, colorStart);
    gradient.addColorStop(1, colorEnd);
    
    ctx.fillStyle = gradient;
    ctx.fillRect(index * barWidth, height - barHeight, barWidth, barHeight);
  });
}
