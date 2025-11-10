/**
 * 性能监控工具
 */

export interface PerformanceMetrics {
  /** 帧率 */
  fps: number;
  /** 内存使用（MB） */
  memoryUsage?: number;
  /** 缓冲健康度（0-1） */
  bufferHealth: number;
  /** 丢帧数 */
  droppedFrames?: number;
  /** 延迟（毫秒） */
  latency?: number;
  /** 解码时间（毫秒） */
  decodeTime?: number;
}

export interface MemoryInfo {
  /** 已使用的JS堆大小 */
  usedJSHeapSize: number;
  /** JS堆大小限制 */
  jsHeapSizeLimit: number;
  /** 总JS堆大小 */
  totalJSHeapSize: number;
}

/**
 * 性能监控类
 */
export class PerformanceMonitor {
  private metrics: PerformanceMetrics = {
    fps: 0,
    bufferHealth: 1,
  };

  private listeners = new Set<(metrics: PerformanceMetrics) => void>();
  private isMonitoring = false;
  private animationFrameId: number | null = null;
  private lastFrameTime = 0;
  private frameCount = 0;
  private fpsUpdateInterval = 1000; // 1秒更新一次FPS
  private lastFpsUpdateTime = 0;

  // 弱引用映射，防止内存泄漏
  private elementWeakMap = new WeakMap<HTMLElement, any>();

  /**
   * 开始监控
   */
  start(): void {
    if (this.isMonitoring) return;

    this.isMonitoring = true;
    this.lastFrameTime = performance.now();
    this.lastFpsUpdateTime = this.lastFrameTime;
    this.monitor();
  }

  /**
   * 停止监控
   */
  stop(): void {
    this.isMonitoring = false;

    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  /**
   * 监控循环
   */
  private monitor = (): void => {
    if (!this.isMonitoring) return;

    const currentTime = performance.now();
    this.frameCount++;

    // 更新FPS
    if (currentTime - this.lastFpsUpdateTime >= this.fpsUpdateInterval) {
      const elapsed = currentTime - this.lastFpsUpdateTime;
      this.metrics.fps = Math.round((this.frameCount * 1000) / elapsed);
      this.frameCount = 0;
      this.lastFpsUpdateTime = currentTime;

      // 更新内存使用
      this.updateMemoryUsage();

      // 通知监听器
      this.notifyListeners();
    }

    this.lastFrameTime = currentTime;
    this.animationFrameId = requestAnimationFrame(this.monitor);
  };

  /**
   * 更新内存使用
   */
  private updateMemoryUsage(): void {
    // 仅在Chrome中可用
    const performance = window.performance as any;
    if (performance.memory) {
      const memoryInfo = performance.memory as MemoryInfo;
      this.metrics.memoryUsage = Math.round(memoryInfo.usedJSHeapSize / 1048576); // 转换为MB
    }
  }

  /**
   * 更新视频指标
   */
  updateVideoMetrics(videoElement: HTMLVideoElement): void {
    const quality = videoElement.getVideoPlaybackQuality?.();
    
    if (quality) {
      this.metrics.droppedFrames = quality.droppedVideoFrames;
      
      // 计算解码时间
      if (quality.totalVideoFrames > 0) {
        this.metrics.decodeTime = Math.round(
          (quality.totalFrameDelay ?? 0) * 1000 / quality.totalVideoFrames
        );
      }
    }

    // 更新缓冲健康度
    this.updateBufferHealth(videoElement);
  }

  /**
   * 更新音频指标
   */
  updateAudioMetrics(audioContext?: AudioContext): void {
    if (audioContext) {
      // 计算延迟
      this.metrics.latency = Math.round(audioContext.baseLatency * 1000);
    }
  }

  /**
   * 更新缓冲健康度
   */
  private updateBufferHealth(mediaElement: HTMLMediaElement): void {
    const currentTime = mediaElement.currentTime;
    const buffered = mediaElement.buffered;

    if (buffered.length === 0) {
      this.metrics.bufferHealth = 0;
      return;
    }

    // 查找当前时间所在的缓冲区
    let bufferedAhead = 0;
    for (let i = 0; i < buffered.length; i++) {
      if (buffered.start(i) <= currentTime && currentTime <= buffered.end(i)) {
        bufferedAhead = buffered.end(i) - currentTime;
        break;
      }
    }

    // 计算健康度（假设10秒缓冲为100%健康）
    this.metrics.bufferHealth = Math.min(1, bufferedAhead / 10);
  }

  /**
   * 获取当前指标
   */
  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  /**
   * 订阅指标更新
   */
  subscribe(listener: (metrics: PerformanceMetrics) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * 通知监听器
   */
  private notifyListeners(): void {
    const metrics = this.getMetrics();
    this.listeners.forEach(listener => {
      try {
        listener(metrics);
      } catch (error) {
        console.error('Error in performance listener:', error);
      }
    });
  }

  /**
   * 检测内存泄漏
   */
  checkMemoryLeak(threshold = 100): boolean {
    const performance = window.performance as any;
    if (!performance.memory) return false;

    const memoryInfo = performance.memory as MemoryInfo;
    const usedMemoryMB = memoryInfo.usedJSHeapSize / 1048576;

    // 简单的阈值检测
    return usedMemoryMB > threshold;
  }

  /**
   * 使用弱引用存储元素相关数据
   */
  setElementData(element: HTMLElement, data: any): void {
    this.elementWeakMap.set(element, data);
  }

  /**
   * 获取元素相关数据
   */
  getElementData(element: HTMLElement): any {
    return this.elementWeakMap.get(element);
  }

  /**
   * 性能标记
   */
  mark(name: string): void {
    performance.mark(`player-${name}`);
  }

  /**
   * 性能测量
   */
  measure(name: string, startMark: string, endMark?: string): number {
    const measureName = `player-${name}`;
    const start = `player-${startMark}`;
    const end = endMark ? `player-${endMark}` : undefined;

    try {
      performance.measure(measureName, start, end);
      const entries = performance.getEntriesByName(measureName);
      if (entries.length > 0) {
        const duration = entries[entries.length - 1].duration;
        performance.clearMeasures(measureName); // 清理测量
        return duration;
      }
    } catch (error) {
      console.error('Performance measurement error:', error);
    }

    return 0;
  }

  /**
   * 清理性能标记
   */
  clearMarks(name?: string): void {
    if (name) {
      performance.clearMarks(`player-${name}`);
    } else {
      // 清理所有player相关的标记
      performance.getEntriesByType('mark').forEach(entry => {
        if (entry.name.startsWith('player-')) {
          performance.clearMarks(entry.name);
        }
      });
    }
  }

  /**
   * 获取性能报告
   */
  getReport(): string {
    const metrics = this.getMetrics();
    const report: string[] = [
      '=== 性能报告 ===',
      `FPS: ${metrics.fps}`,
      `内存使用: ${metrics.memoryUsage ?? 'N/A'} MB`,
      `缓冲健康度: ${(metrics.bufferHealth * 100).toFixed(1)}%`,
    ];

    if (metrics.droppedFrames !== undefined) {
      report.push(`丢帧数: ${metrics.droppedFrames}`);
    }

    if (metrics.latency !== undefined) {
      report.push(`延迟: ${metrics.latency}ms`);
    }

    if (metrics.decodeTime !== undefined) {
      report.push(`解码时间: ${metrics.decodeTime}ms`);
    }

    return report.join('\n');
  }

  /**
   * 销毁
   */
  destroy(): void {
    this.stop();
    this.listeners.clear();
    this.clearMarks();
  }
}

// 导出单例
export const performanceMonitor = new PerformanceMonitor();