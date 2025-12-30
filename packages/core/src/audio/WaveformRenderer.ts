/**
 * 波形渲染器 - 使用 Web Audio API 和 Canvas
 * 性能优化版本：TypedArray 复用、RAF 节流、离屏渲染
 */

import type { WaveformConfig } from '../types/audio';
import { EventEmitter } from '../core/EventEmitter';

const DEFAULT_CONFIG: Required<WaveformConfig> = {
  width: 800,
  height: 128,
  waveColor: '#1890ff',
  progressColor: '#0050b3',
  cursorColor: '#ff4d4f',
  backgroundColor: '#f0f0f0',
  pixelRatio: window.devicePixelRatio || 1,
  barWidth: 2,
  barGap: 1,
  normalize: true,
  interact: true,
};

/** 对象池 - 复用 TypedArray */
const arrayPool = {
  uint8Arrays: new Map<number, Uint8Array[]>(),
  float32Arrays: new Map<number, Float32Array[]>(),

  getUint8Array(size: number): Uint8Array {
    const pool = this.uint8Arrays.get(size);
    if (pool && pool.length > 0) {
      return pool.pop()!;
    }
    return new Uint8Array(size);
  },

  releaseUint8Array(arr: Uint8Array): void {
    const size = arr.length;
    let pool = this.uint8Arrays.get(size);
    if (!pool) {
      pool = [];
      this.uint8Arrays.set(size, pool);
    }
    if (pool.length < 10) {
      // 限制池大小
      pool.push(arr);
    }
  },

  getFloat32Array(size: number): Float32Array {
    const pool = this.float32Arrays.get(size);
    if (pool && pool.length > 0) {
      return pool.pop()!;
    }
    return new Float32Array(size);
  },

  releaseFloat32Array(arr: Float32Array): void {
    const size = arr.length;
    let pool = this.float32Arrays.get(size);
    if (!pool) {
      pool = [];
      this.float32Arrays.set(size, pool);
    }
    if (pool.length < 10) {
      pool.push(arr);
    }
  },
};

export class WaveformRenderer extends EventEmitter {
  private config: Required<WaveformConfig>;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private audioContext: AudioContext;
  private analyser: AnalyserNode;
  private dataArray: Uint8Array;
  private animationId: number | null = null;
  private progress = 0;
  private isInteracting = false;
  private boundHandlers: Map<string, EventListener> = new Map();

  // 性能优化相关
  private lastRenderTime = 0;
  private targetFPS = 60;
  private frameInterval = 1000 / 60;
  private isLowPerformanceMode = false;
  private offscreenCanvas: OffscreenCanvas | HTMLCanvasElement | null = null;
  private offscreenCtx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D | null = null;
  private staticWaveformCache: ImageData | null = null;
  private lastProgress = -1;

  constructor(
    canvas: HTMLCanvasElement,
    audioContext: AudioContext,
    config: Partial<WaveformConfig> = {}
  ) {
    super();

    this.canvas = canvas;
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.audioContext = audioContext;

    // 设置 canvas 尺寸
    this.setupCanvas();

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to get canvas 2D context');
    }
    this.ctx = ctx;

    // 创建分析器节点
    this.analyser = audioContext.createAnalyser();
    this.analyser.fftSize = 2048;
    this.analyser.smoothingTimeConstant = 0.8;

    // 使用 ArrayBuffer 创建 Uint8Array 避免类型问题
    const buffer = new ArrayBuffer(this.analyser.frequencyBinCount);
    this.dataArray = new Uint8Array(buffer);

    // 绑定交互事件
    if (this.config.interact) {
      this.bindEvents();
    }

    // 初始化离屏画布
    this.initOffscreenCanvas();

    // 检测设备性能
    this.detectPerformance();
  }

  /**
   * 初始化离屏画布
   */
  private initOffscreenCanvas(): void {
    try {
      if (typeof OffscreenCanvas !== 'undefined') {
        this.offscreenCanvas = new OffscreenCanvas(
          this.canvas.width,
          this.canvas.height
        );
        this.offscreenCtx = this.offscreenCanvas.getContext('2d');
      } else {
        // 回退到普通 canvas
        this.offscreenCanvas = document.createElement('canvas');
        this.offscreenCanvas.width = this.canvas.width;
        this.offscreenCanvas.height = this.canvas.height;
        this.offscreenCtx = this.offscreenCanvas.getContext('2d');
      }
    } catch {
      // OffscreenCanvas 不可用，回退到普通 canvas
      this.offscreenCanvas = document.createElement('canvas');
      this.offscreenCanvas.width = this.canvas.width;
      this.offscreenCanvas.height = this.canvas.height;
      this.offscreenCtx = this.offscreenCanvas.getContext('2d');
    }
  }

  /**
   * 检测设备性能
   */
  private detectPerformance(): void {
    // 简单的性能检测
    const canvas = document.createElement('canvas');
    canvas.width = 100;
    canvas.height = 100;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const start = performance.now();
    for (let i = 0; i < 1000; i++) {
      ctx.fillRect(0, 0, 100, 100);
    }
    const elapsed = performance.now() - start;

    // 如果 1000 次填充耗时超过 50ms，认为是低性能设备
    this.isLowPerformanceMode = elapsed > 50;

    if (this.isLowPerformanceMode) {
      this.targetFPS = 30;
      this.frameInterval = 1000 / 30;
    }
  }

  /**
   * 设置目标帧率
   */
  setTargetFPS(fps: number): void {
    this.targetFPS = Math.max(1, Math.min(60, fps));
    this.frameInterval = 1000 / this.targetFPS;
  }

  /**
   * 检查是否应该渲染下一帧（RAF 节流）
   */
  private shouldRenderFrame(timestamp: number): boolean {
    const elapsed = timestamp - this.lastRenderTime;
    if (elapsed < this.frameInterval) {
      return false;
    }
    this.lastRenderTime = timestamp - (elapsed % this.frameInterval);
    return true;
  }

  /**
   * 设置 canvas 尺寸
   */
  private setupCanvas(): void {
    const { width, height, pixelRatio } = this.config;

    this.canvas.width = width * pixelRatio;
    this.canvas.height = height * pixelRatio;
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;
  }

  /**
   * 绑定交互事件
   */
  private bindEvents(): void {
    const handleInteract = (e: MouseEvent) => {
      const rect = this.canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const progress = x / rect.width;

      this.emit('seek', { progress: Math.max(0, Math.min(1, progress)) });
    };

    const onMouseDown = () => {
      this.isInteracting = true;
    };

    const onMouseMove = (e: MouseEvent) => {
      if (this.isInteracting) {
        handleInteract(e);
      }
    };

    const onMouseUp = (e: MouseEvent) => {
      if (this.isInteracting) {
        handleInteract(e);
        this.isInteracting = false;
      }
    };

    // 保存引用以便移除
    this.boundHandlers.set('mousedown', onMouseDown as EventListener);
    this.boundHandlers.set('mousemove', onMouseMove as EventListener);
    this.boundHandlers.set('mouseup', onMouseUp as EventListener);
    this.boundHandlers.set('click', handleInteract as EventListener);

    this.canvas.addEventListener('mousedown', onMouseDown);
    this.canvas.addEventListener('mousemove', onMouseMove);
    this.canvas.addEventListener('mouseup', onMouseUp);
    this.canvas.addEventListener('click', handleInteract);

    this.canvas.style.cursor = 'pointer';
  }

  /**
   * 移除交互事件
   */
  private unbindEvents(): void {
    this.boundHandlers.forEach((handler, event) => {
      this.canvas.removeEventListener(event, handler);
    });
    this.boundHandlers.clear();
    this.canvas.style.cursor = '';
  }

  /**
   * 连接音频源
   */
  connectSource(source: MediaElementAudioSourceNode): void {
    source.connect(this.analyser);
    this.analyser.connect(this.audioContext.destination);
  }

  /**
   * 获取分析器节点
   */
  getAnalyser(): AnalyserNode {
    return this.analyser;
  }

  /**
   * 设置进度
   */
  setProgress(progress: number): void {
    this.progress = Math.max(0, Math.min(1, progress));
  }

  /**
   * 绘制静态波形（从音频缓冲区）
   * 优化：使用离屏画布和缓存
   */
  async drawStaticWaveform(audioBuffer: AudioBuffer): Promise<void> {
    const { width, height, waveColor, backgroundColor, pixelRatio, normalize } = this.config;
    const channelData = audioBuffer.getChannelData(0);
    const step = Math.ceil(channelData.length / width);
    const amp = height / 2;

    // 使用离屏画布进行绘制
    const ctx = this.offscreenCtx || this.ctx;
    const canvas = this.offscreenCanvas || this.canvas;

    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = waveColor;

    // 优化：使用 Float32Array 复用池来存储采样数据
    const sampledData = arrayPool.getFloat32Array(width * 2);

    let max = 0;
    if (normalize) {
      // 优化：批量计算最大值
      for (let i = 0; i < channelData.length; i += step) {
        const absValue = Math.abs(channelData[i]);
        if (absValue > max) max = absValue;
      }
    } else {
      max = 1;
    }

    // 预计算采样数据
    for (let i = 0; i < width; i++) {
      const index = i * step;
      let min = 1.0;
      let maxValue = -1.0;

      for (let j = 0; j < step; j++) {
        const datum = channelData[index + j] || 0;
        if (datum < min) min = datum;
        if (datum > maxValue) maxValue = datum;
      }

      sampledData[i * 2] = min;
      sampledData[i * 2 + 1] = maxValue;
    }

    // 批量绘制
    ctx.beginPath();
    for (let i = 0; i < width; i++) {
      const min = sampledData[i * 2];
      const maxValue = sampledData[i * 2 + 1];

      const x = i * pixelRatio;
      const yMin = ((1 + min / max) * amp) * pixelRatio;
      const yMax = ((1 + maxValue / max) * amp) * pixelRatio;

      ctx.fillRect(x, yMin, pixelRatio, Math.max(1, yMax - yMin));
    }

    // 释放 Float32Array 回到池
    arrayPool.releaseFloat32Array(sampledData);

    // 缓存静态波形
    this.staticWaveformCache = ctx.getImageData(0, 0, canvas.width, canvas.height);

    // 将离屏画布内容复制到主画布
    if (this.offscreenCanvas && this.offscreenCanvas !== this.canvas) {
      if (this.offscreenCanvas instanceof OffscreenCanvas) {
        const bitmap = this.offscreenCanvas.transferToImageBitmap();
        this.ctx.drawImage(bitmap, 0, 0);
        bitmap.close();
      } else {
        this.ctx.drawImage(this.offscreenCanvas, 0, 0);
      }
    }

    this.drawProgress();
  }

  /**
   * 从缓存绘制静态波形（用于进度更新时）
   */
  private drawFromCache(): void {
    if (this.staticWaveformCache) {
      this.ctx.putImageData(this.staticWaveformCache, 0, 0);
    }
  }

  /**
   * 更新静态波形的进度显示（优化版本）
   */
  updateStaticProgress(): void {
    // 只有进度变化超过阈值时才重绘
    if (Math.abs(this.progress - this.lastProgress) < 0.001) {
      return;
    }
    this.lastProgress = this.progress;

    // 从缓存恢复静态波形
    this.drawFromCache();
    // 绘制进度
    this.drawProgress();
  }

  /**
   * 绘制实时波形
   * 优化：RAF 节流 + 批量绘制
   */
  drawRealtimeWaveform(): void {
    if (this.animationId !== null) {
      return; // 已经在渲染
    }

    const render = (timestamp: number) => {
      // RAF 节流
      if (!this.shouldRenderFrame(timestamp)) {
        this.animationId = requestAnimationFrame(render);
        return;
      }

      // @ts-ignore - Web Audio API 类型定义问题
      this.analyser.getByteTimeDomainData(this.dataArray);

      const { width, height, waveColor, backgroundColor, pixelRatio } = this.config;

      // 使用离屏画布
      const ctx = this.offscreenCtx || this.ctx;
      const canvas = this.offscreenCanvas || this.canvas;

      // 清空画布
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 绘制波形
      ctx.strokeStyle = waveColor;
      ctx.lineWidth = 2 * pixelRatio;
      ctx.beginPath();

      // 优化：低性能模式下减少采样点
      const step = this.isLowPerformanceMode ? 2 : 1;
      const sliceWidth = (width / this.dataArray.length) * pixelRatio * step;
      let x = 0;

      for (let i = 0; i < this.dataArray.length; i += step) {
        const v = this.dataArray[i] / 128.0;
        const y = (v * height / 2) * pixelRatio;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }

        x += sliceWidth;
      }

      ctx.stroke();

      // 复制到主画布
      if (this.offscreenCanvas && this.offscreenCanvas !== this.canvas) {
        if (this.offscreenCanvas instanceof OffscreenCanvas) {
          const bitmap = this.offscreenCanvas.transferToImageBitmap();
          this.ctx.drawImage(bitmap, 0, 0);
          bitmap.close();
        } else {
          this.ctx.drawImage(this.offscreenCanvas, 0, 0);
        }
      }

      // 绘制进度
      this.drawProgress();

      this.animationId = requestAnimationFrame(render);
    };

    this.animationId = requestAnimationFrame(render);
  }

  /**
   * 绘制频谱
   * 优化：RAF 节流 + 批量绘制
   */
  drawFrequency(): void {
    if (this.animationId !== null) {
      return;
    }

    const render = (timestamp: number) => {
      // RAF 节流
      if (!this.shouldRenderFrame(timestamp)) {
        this.animationId = requestAnimationFrame(render);
        return;
      }

      // @ts-ignore - Web Audio API 类型定义问题
      this.analyser.getByteFrequencyData(this.dataArray);

      const { width, height, waveColor, backgroundColor, pixelRatio, barWidth, barGap } = this.config;

      // 使用离屏画布
      const ctx = this.offscreenCtx || this.ctx;
      const canvas = this.offscreenCanvas || this.canvas;

      // 清空画布
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const totalBarWidth = (barWidth + barGap) * pixelRatio;
      const barCount = Math.floor(width / (barWidth + barGap));

      // 优化：低性能模式下减少柱子数量
      const step = this.isLowPerformanceMode ? 2 : 1;

      ctx.fillStyle = waveColor;
      for (let i = 0; i < barCount; i += step) {
        const dataIndex = Math.floor((i / barCount) * this.dataArray.length);
        const barHeight = (this.dataArray[dataIndex] / 255) * height * pixelRatio;

        ctx.fillRect(
          i * totalBarWidth,
          canvas.height - barHeight,
          barWidth * pixelRatio * step,
          barHeight
        );
      }

      // 复制到主画布
      if (this.offscreenCanvas && this.offscreenCanvas !== this.canvas) {
        if (this.offscreenCanvas instanceof OffscreenCanvas) {
          const bitmap = this.offscreenCanvas.transferToImageBitmap();
          this.ctx.drawImage(bitmap, 0, 0);
          bitmap.close();
        } else {
          this.ctx.drawImage(this.offscreenCanvas, 0, 0);
        }
      }

      // 绘制进度
      this.drawProgress();

      this.animationId = requestAnimationFrame(render);
    };

    this.animationId = requestAnimationFrame(render);
  }

  /**
   * 获取性能统计信息
   */
  getPerformanceStats(): {
    targetFPS: number;
    isLowPerformanceMode: boolean;
    hasOffscreenCanvas: boolean;
    hasCachedWaveform: boolean;
  } {
    return {
      targetFPS: this.targetFPS,
      isLowPerformanceMode: this.isLowPerformanceMode,
      hasOffscreenCanvas: this.offscreenCanvas !== null,
      hasCachedWaveform: this.staticWaveformCache !== null,
    };
  }

  /**
   * 绘制进度覆盖层
   */
  private drawProgress(): void {
    if (this.progress === 0) return;

    const { progressColor, pixelRatio } = this.config;
    const progressWidth = this.canvas.width * this.progress;

    // 半透明覆盖层
    this.ctx.fillStyle = progressColor + '40'; // 添加透明度
    this.ctx.fillRect(0, 0, progressWidth, this.canvas.height);

    // 进度线
    this.ctx.strokeStyle = this.config.cursorColor;
    this.ctx.lineWidth = 2 * pixelRatio;
    this.ctx.beginPath();
    this.ctx.moveTo(progressWidth, 0);
    this.ctx.lineTo(progressWidth, this.canvas.height);
    this.ctx.stroke();
  }

  /**
   * 停止渲染
   */
  stop(): void {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  /**
   * 清空画布
   */
  clear(): void {
    this.stop();
    this.ctx.fillStyle = this.config.backgroundColor;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  /**
   * 更新配置
   */
  updateConfig(config: Partial<WaveformConfig>): void {
    const needsResize =
      config.width !== undefined ||
      config.height !== undefined ||
      config.pixelRatio !== undefined;

    this.config = { ...this.config, ...config };

    if (needsResize) {
      this.setupCanvas();
      // 更新离屏画布尺寸
      if (this.offscreenCanvas) {
        this.offscreenCanvas.width = this.canvas.width;
        this.offscreenCanvas.height = this.canvas.height;
      }
      // 清除缓存
      this.staticWaveformCache = null;
      this.lastProgress = -1;
    }
  }

  /**
   * 清除波形缓存
   */
  clearCache(): void {
    this.staticWaveformCache = null;
    this.lastProgress = -1;
  }

  /**
   * 销毁
   */
  destroy(): void {
    this.stop();
    this.unbindEvents();
    this.analyser.disconnect();
    this.clear();
    
    // 清理离屏画布
    this.offscreenCanvas = null;
    this.offscreenCtx = null;
    
    // 清理缓存
    this.staticWaveformCache = null;
    
    // 释放 TypedArray 回到池
    if (this.dataArray) {
      arrayPool.releaseUint8Array(this.dataArray);
    }
  }
}

/**
 * 导出对象池以便外部使用
 */
export { arrayPool };

