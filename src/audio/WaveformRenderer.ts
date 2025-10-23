/**
 * 波形渲染器 - 使用 Web Audio API 和 Canvas
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

    this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);

    // 绑定交互事件
    if (this.config.interact) {
      this.bindEvents();
    }
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

    this.canvas.addEventListener('mousedown', () => {
      this.isInteracting = true;
    });

    this.canvas.addEventListener('mousemove', (e) => {
      if (this.isInteracting) {
        handleInteract(e);
      }
    });

    this.canvas.addEventListener('mouseup', (e) => {
      if (this.isInteracting) {
        handleInteract(e);
        this.isInteracting = false;
      }
    });

    this.canvas.addEventListener('click', handleInteract);

    this.canvas.style.cursor = 'pointer';
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
   */
  async drawStaticWaveform(audioBuffer: AudioBuffer): Promise<void> {
    const { width, height, waveColor, backgroundColor, pixelRatio, normalize } = this.config;
    const channelData = audioBuffer.getChannelData(0);
    const step = Math.ceil(channelData.length / width);
    const amp = height / 2;

    this.ctx.fillStyle = backgroundColor;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.ctx.fillStyle = waveColor;
    this.ctx.beginPath();

    let max = 0;
    if (normalize) {
      for (let i = 0; i < channelData.length; i += step) {
        const absValue = Math.abs(channelData[i]);
        if (absValue > max) max = absValue;
      }
    } else {
      max = 1;
    }

    for (let i = 0; i < width; i++) {
      const index = i * step;
      let min = 1.0;
      let maxValue = -1.0;

      for (let j = 0; j < step; j++) {
        const datum = channelData[index + j] || 0;
        if (datum < min) min = datum;
        if (datum > maxValue) maxValue = datum;
      }

      const x = i * pixelRatio;
      const yMin = ((1 + min / max) * amp) * pixelRatio;
      const yMax = ((1 + maxValue / max) * amp) * pixelRatio;

      this.ctx.fillRect(x, yMin, pixelRatio, yMax - yMin);
    }

    this.drawProgress();
  }

  /**
   * 绘制实时波形
   */
  drawRealtimeWaveform(): void {
    if (this.animationId !== null) {
      return; // 已经在渲染
    }

    const render = () => {
      this.analyser.getByteTimeDomainData(this.dataArray);

      const { width, height, waveColor, backgroundColor, pixelRatio } = this.config;

      // 清空画布
      this.ctx.fillStyle = backgroundColor;
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

      // 绘制波形
      this.ctx.strokeStyle = waveColor;
      this.ctx.lineWidth = 2 * pixelRatio;
      this.ctx.beginPath();

      const sliceWidth = (width / this.dataArray.length) * pixelRatio;
      let x = 0;

      for (let i = 0; i < this.dataArray.length; i++) {
        const v = this.dataArray[i] / 128.0;
        const y = (v * height / 2) * pixelRatio;

        if (i === 0) {
          this.ctx.moveTo(x, y);
        } else {
          this.ctx.lineTo(x, y);
        }

        x += sliceWidth;
      }

      this.ctx.stroke();

      // 绘制进度
      this.drawProgress();

      this.animationId = requestAnimationFrame(render);
    };

    render();
  }

  /**
   * 绘制频谱
   */
  drawFrequency(): void {
    if (this.animationId !== null) {
      return;
    }

    const render = () => {
      this.analyser.getByteFrequencyData(this.dataArray);

      const { width, height, waveColor, backgroundColor, pixelRatio, barWidth, barGap } = this.config;

      // 清空画布
      this.ctx.fillStyle = backgroundColor;
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

      const totalBarWidth = (barWidth + barGap) * pixelRatio;
      const barCount = Math.floor(width / (barWidth + barGap));

      for (let i = 0; i < barCount; i++) {
        const dataIndex = Math.floor((i / barCount) * this.dataArray.length);
        const barHeight = (this.dataArray[dataIndex] / 255) * height * pixelRatio;

        this.ctx.fillStyle = waveColor;
        this.ctx.fillRect(
          i * totalBarWidth,
          this.canvas.height - barHeight,
          barWidth * pixelRatio,
          barHeight
        );
      }

      // 绘制进度
      this.drawProgress();

      this.animationId = requestAnimationFrame(render);
    };

    render();
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
    }
  }

  /**
   * 销毁
   */
  destroy(): void {
    this.stop();
    this.analyser.disconnect();
    this.clear();
  }
}

