/**
 * 音频可视化增强模块
 * 提供多种可视化效果：频谱、波形、环形、粒子等
 */

export type VisualizerType =
  | 'bars'
  | 'waveform'
  | 'circular'
  | 'particles'
  | 'spectrum'
  | 'oscilloscope';

export interface VisualizerOptions {
  /** 可视化类型 */
  type?: VisualizerType;
  /** FFT 大小 */
  fftSize?: number;
  /** 平滑时间常数 */
  smoothingTimeConstant?: number;
  /** 主颜色 */
  primaryColor?: string;
  /** 次要颜色 */
  secondaryColor?: string;
  /** 背景颜色 */
  backgroundColor?: string;
  /** 是否启用渐变 */
  gradient?: boolean;
  /** 频谱条数量 */
  barCount?: number;
  /** 条间隙 */
  barGap?: number;
  /** 条圆角 */
  barRadius?: number;
  /** 镜像效果 */
  mirror?: boolean;
  /** 响应灵敏度 */
  sensitivity?: number;
  /** 最小分贝 */
  minDecibels?: number;
  /** 最大分贝 */
  maxDecibels?: number;
}

const DEFAULT_OPTIONS: Required<VisualizerOptions> = {
  type: 'bars',
  fftSize: 256,
  smoothingTimeConstant: 0.8,
  primaryColor: '#6366f1',
  secondaryColor: '#ec4899',
  backgroundColor: 'transparent',
  gradient: true,
  barCount: 64,
  barGap: 2,
  barRadius: 2,
  mirror: false,
  sensitivity: 1,
  minDecibels: -90,
  maxDecibels: -10,
};

/**
 * 音频可视化器
 */
export class AudioVisualizer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private audioContext: AudioContext;
  private analyser: AnalyserNode;
  private sourceNode: MediaElementAudioSourceNode | null = null;
  private options: Required<VisualizerOptions>;
  private animationId: number | null = null;
  private dataArray: Uint8Array<ArrayBuffer>;
  private isDestroyed = false;
  private gradientCache: CanvasGradient | null = null;
  private lastWidth = 0;
  private lastHeight = 0;

  constructor(
    canvas: HTMLCanvasElement,
    audioContext: AudioContext,
    options: VisualizerOptions = {}
  ) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to get canvas 2d context');
    }
    this.ctx = ctx;
    this.audioContext = audioContext;
    this.options = { ...DEFAULT_OPTIONS, ...options };

    // 创建分析器
    this.analyser = audioContext.createAnalyser();
    this.analyser.fftSize = this.options.fftSize;
    this.analyser.smoothingTimeConstant = this.options.smoothingTimeConstant;
    this.analyser.minDecibels = this.options.minDecibels;
    this.analyser.maxDecibels = this.options.maxDecibels;

    // 创建数据数组
    const buffer = new ArrayBuffer(this.analyser.frequencyBinCount);
    this.dataArray = new Uint8Array(buffer);

    // 设置 canvas 分辨率
    this.setupCanvas();
  }

  /**
   * 设置 Canvas
   */
  private setupCanvas(): void {
    const dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.getBoundingClientRect();

    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.ctx.scale(dpr, dpr);

    // 清除渐变缓存
    this.gradientCache = null;
  }

  /**
   * 连接音频源
   */
  connectSource(source: MediaElementAudioSourceNode | AudioNode): void {
    if (source instanceof MediaElementAudioSourceNode) {
      this.sourceNode = source;
    }
    source.connect(this.analyser);
    this.analyser.connect(this.audioContext.destination);
  }

  /**
   * 断开音频源
   */
  disconnectSource(): void {
    if (this.sourceNode) {
      try {
        this.sourceNode.disconnect(this.analyser);
      } catch {
        // 忽略断开错误
      }
      this.sourceNode = null;
    }
  }

  /**
   * 开始可视化
   */
  start(): void {
    if (this.animationId !== null || this.isDestroyed) return;
    this.animate();
  }

  /**
   * 停止可视化
   */
  stop(): void {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    this.clear();
  }

  /**
   * 动画循环
   */
  private animate = (): void => {
    if (this.isDestroyed) return;

    // 检查尺寸变化
    const rect = this.canvas.getBoundingClientRect();
    if (rect.width !== this.lastWidth || rect.height !== this.lastHeight) {
      this.lastWidth = rect.width;
      this.lastHeight = rect.height;
      this.setupCanvas();
    }

    // 获取频率数据
    this.analyser.getByteFrequencyData(this.dataArray);

    // 清除画布
    this.clear();

    // 根据类型绘制
    switch (this.options.type) {
      case 'bars':
        this.drawBars();
        break;
      case 'waveform':
        this.drawWaveform();
        break;
      case 'circular':
        this.drawCircular();
        break;
      case 'particles':
        this.drawParticles();
        break;
      case 'spectrum':
        this.drawSpectrum();
        break;
      case 'oscilloscope':
        this.drawOscilloscope();
        break;
    }

    this.animationId = requestAnimationFrame(this.animate);
  };

  /**
   * 清除画布
   */
  private clear(): void {
    const { width, height } = this.canvas.getBoundingClientRect();

    if (this.options.backgroundColor === 'transparent') {
      this.ctx.clearRect(0, 0, width, height);
    } else {
      this.ctx.fillStyle = this.options.backgroundColor;
      this.ctx.fillRect(0, 0, width, height);
    }
  }

  /**
   * 获取渐变
   */
  private getGradient(x1: number, y1: number, x2: number, y2: number): CanvasGradient {
    if (this.gradientCache) return this.gradientCache;

    const gradient = this.ctx.createLinearGradient(x1, y1, x2, y2);
    gradient.addColorStop(0, this.options.primaryColor);
    gradient.addColorStop(1, this.options.secondaryColor);
    this.gradientCache = gradient;

    return gradient;
  }

  /**
   * 绘制条形频谱
   */
  private drawBars(): void {
    const { width, height } = this.canvas.getBoundingClientRect();
    const { barCount, barGap, barRadius, gradient, mirror, sensitivity } = this.options;

    const barWidth = (width - barGap * (barCount - 1)) / barCount;
    const step = Math.floor(this.dataArray.length / barCount);

    // 设置填充样式
    if (gradient) {
      this.ctx.fillStyle = this.getGradient(0, height, 0, 0);
    } else {
      this.ctx.fillStyle = this.options.primaryColor;
    }

    for (let i = 0; i < barCount; i++) {
      const value = this.dataArray[i * step] * sensitivity;
      const percent = value / 255;
      const barHeight = Math.max(2, percent * height);

      const x = i * (barWidth + barGap);
      const y = height - barHeight;

      // 绘制带圆角的条形
      this.roundRect(x, y, barWidth, barHeight, barRadius);

      // 镜像效果
      if (mirror) {
        this.roundRect(x, 0, barWidth, barHeight, barRadius);
      }
    }
  }

  /**
   * 绘制波形
   */
  private drawWaveform(): void {
    const { width, height } = this.canvas.getBoundingClientRect();
    const { sensitivity } = this.options;

    // 获取时域数据
    const buffer = new ArrayBuffer(this.analyser.fftSize);
    const timeData = new Uint8Array(buffer);
    this.analyser.getByteTimeDomainData(timeData);

    this.ctx.lineWidth = 2;
    this.ctx.strokeStyle = this.options.gradient
      ? this.getGradient(0, 0, width, 0)
      : this.options.primaryColor;

    this.ctx.beginPath();

    const sliceWidth = width / timeData.length;
    let x = 0;

    for (let i = 0; i < timeData.length; i++) {
      const v = (timeData[i] / 128.0 - 1) * sensitivity + 1;
      const y = (v * height) / 2;

      if (i === 0) {
        this.ctx.moveTo(x, y);
      } else {
        this.ctx.lineTo(x, y);
      }

      x += sliceWidth;
    }

    this.ctx.lineTo(width, height / 2);
    this.ctx.stroke();
  }

  /**
   * 绘制环形频谱
   */
  private drawCircular(): void {
    const { width, height } = this.canvas.getBoundingClientRect();
    const { barCount, sensitivity, gradient } = this.options;

    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) * 0.3;
    const step = Math.floor(this.dataArray.length / barCount);

    this.ctx.lineWidth = 3;
    this.ctx.lineCap = 'round';

    for (let i = 0; i < barCount; i++) {
      const value = this.dataArray[i * step] * sensitivity;
      const percent = value / 255;
      const barLength = percent * radius * 0.8;

      const angle = (i / barCount) * Math.PI * 2 - Math.PI / 2;
      const x1 = centerX + Math.cos(angle) * radius;
      const y1 = centerY + Math.sin(angle) * radius;
      const x2 = centerX + Math.cos(angle) * (radius + barLength);
      const y2 = centerY + Math.sin(angle) * (radius + barLength);

      // 颜色过渡
      if (gradient) {
        const hue = (i / barCount) * 360;
        this.ctx.strokeStyle = `hsl(${hue}, 80%, 60%)`;
      } else {
        this.ctx.strokeStyle = this.options.primaryColor;
      }

      this.ctx.beginPath();
      this.ctx.moveTo(x1, y1);
      this.ctx.lineTo(x2, y2);
      this.ctx.stroke();
    }

    // 绘制中心圆
    this.ctx.beginPath();
    this.ctx.arc(centerX, centerY, radius * 0.3, 0, Math.PI * 2);
    this.ctx.fillStyle = this.options.primaryColor;
    this.ctx.fill();
  }

  /**
   * 粒子效果
   */
  private particles: Array<{
    x: number;
    y: number;
    vx: number;
    vy: number;
    size: number;
    life: number;
    maxLife: number;
  }> = [];

  private drawParticles(): void {
    const { width, height } = this.canvas.getBoundingClientRect();
    const { sensitivity, gradient } = this.options;

    // 计算平均能量
    let sum = 0;
    for (let i = 0; i < this.dataArray.length; i++) {
      sum += this.dataArray[i];
    }
    const average = (sum / this.dataArray.length) * sensitivity;

    // 根据能量生成粒子
    if (average > 50) {
      const count = Math.floor(average / 50);
      for (let i = 0; i < count && this.particles.length < 200; i++) {
        this.particles.push({
          x: width / 2 + (Math.random() - 0.5) * 50,
          y: height / 2 + (Math.random() - 0.5) * 50,
          vx: (Math.random() - 0.5) * 4,
          vy: (Math.random() - 0.5) * 4,
          size: Math.random() * 4 + 2,
          life: 1,
          maxLife: Math.random() * 60 + 30,
        });
      }
    }

    // 更新和绘制粒子
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];

      p.x += p.vx;
      p.y += p.vy;
      p.life++;

      const lifePercent = 1 - p.life / p.maxLife;

      if (p.life >= p.maxLife) {
        this.particles.splice(i, 1);
        continue;
      }

      // 绘制粒子
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size * lifePercent, 0, Math.PI * 2);

      if (gradient) {
        const hue = (p.life / p.maxLife) * 60 + 260;
        this.ctx.fillStyle = `hsla(${hue}, 80%, 60%, ${lifePercent})`;
      } else {
        this.ctx.fillStyle = this.hexToRgba(this.options.primaryColor, lifePercent);
      }

      this.ctx.fill();
    }
  }

  /**
   * 绘制频谱
   */
  private drawSpectrum(): void {
    const { width, height } = this.canvas.getBoundingClientRect();
    const { sensitivity, gradient } = this.options;

    const barCount = 128;
    const step = Math.floor(this.dataArray.length / barCount);
    const barWidth = width / barCount;

    // 绘制填充区域
    this.ctx.beginPath();
    this.ctx.moveTo(0, height);

    for (let i = 0; i < barCount; i++) {
      const value = this.dataArray[i * step] * sensitivity;
      const percent = value / 255;
      const y = height - percent * height;
      const x = i * barWidth;

      if (i === 0) {
        this.ctx.lineTo(x, y);
      } else {
        // 使用贝塞尔曲线平滑
        const prevX = (i - 1) * barWidth;
        const cpX = (prevX + x) / 2;
        this.ctx.quadraticCurveTo(prevX, y, cpX, y);
      }
    }

    this.ctx.lineTo(width, height);
    this.ctx.closePath();

    // 填充渐变
    if (gradient) {
      const grad = this.ctx.createLinearGradient(0, height, 0, 0);
      grad.addColorStop(0, this.hexToRgba(this.options.primaryColor, 0.1));
      grad.addColorStop(0.5, this.hexToRgba(this.options.primaryColor, 0.3));
      grad.addColorStop(1, this.hexToRgba(this.options.secondaryColor, 0.5));
      this.ctx.fillStyle = grad;
    } else {
      this.ctx.fillStyle = this.hexToRgba(this.options.primaryColor, 0.3);
    }
    this.ctx.fill();

    // 绘制边线
    this.ctx.strokeStyle = gradient
      ? this.getGradient(0, 0, width, 0)
      : this.options.primaryColor;
    this.ctx.lineWidth = 2;
    this.ctx.stroke();
  }

  /**
   * 绘制示波器
   */
  private drawOscilloscope(): void {
    const { width, height } = this.canvas.getBoundingClientRect();
    const { sensitivity, gradient } = this.options;

    // 获取时域数据
    const timeData = new Uint8Array(this.analyser.fftSize);
    this.analyser.getByteTimeDomainData(timeData);

    // 绘制网格
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    this.ctx.lineWidth = 1;

    // 水平线
    for (let i = 0; i <= 4; i++) {
      const y = (height / 4) * i;
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(width, y);
      this.ctx.stroke();
    }

    // 绘制波形
    this.ctx.lineWidth = 2;
    this.ctx.strokeStyle = gradient
      ? this.getGradient(0, 0, width, 0)
      : this.options.primaryColor;
    this.ctx.shadowColor = this.options.primaryColor;
    this.ctx.shadowBlur = 10;

    this.ctx.beginPath();

    const sliceWidth = width / timeData.length;
    let x = 0;

    for (let i = 0; i < timeData.length; i++) {
      const v = (timeData[i] / 128.0 - 1) * sensitivity + 1;
      const y = (v * height) / 2;

      if (i === 0) {
        this.ctx.moveTo(x, y);
      } else {
        this.ctx.lineTo(x, y);
      }

      x += sliceWidth;
    }

    this.ctx.stroke();
    this.ctx.shadowBlur = 0;
  }

  /**
   * 绘制圆角矩形
   */
  private roundRect(x: number, y: number, w: number, h: number, r: number): void {
    if (r > h / 2) r = h / 2;
    if (r > w / 2) r = w / 2;

    this.ctx.beginPath();
    this.ctx.moveTo(x + r, y);
    this.ctx.lineTo(x + w - r, y);
    this.ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    this.ctx.lineTo(x + w, y + h - r);
    this.ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    this.ctx.lineTo(x + r, y + h);
    this.ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    this.ctx.lineTo(x, y + r);
    this.ctx.quadraticCurveTo(x, y, x + r, y);
    this.ctx.closePath();
    this.ctx.fill();
  }

  /**
   * Hex 转 RGBA
   */
  private hexToRgba(hex: string, alpha: number): string {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (result) {
      const r = parseInt(result[1], 16);
      const g = parseInt(result[2], 16);
      const b = parseInt(result[3], 16);
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
    return hex;
  }

  /**
   * 更新选项
   */
  updateOptions(options: Partial<VisualizerOptions>): void {
    this.options = { ...this.options, ...options };

    if (options.fftSize !== undefined) {
      this.analyser.fftSize = options.fftSize;
      const buffer = new ArrayBuffer(this.analyser.frequencyBinCount);
      this.dataArray = new Uint8Array(buffer);
    }

    if (options.smoothingTimeConstant !== undefined) {
      this.analyser.smoothingTimeConstant = options.smoothingTimeConstant;
    }

    if (options.minDecibels !== undefined) {
      this.analyser.minDecibels = options.minDecibels;
    }

    if (options.maxDecibels !== undefined) {
      this.analyser.maxDecibels = options.maxDecibels;
    }

    // 清除渐变缓存
    this.gradientCache = null;
  }

  /**
   * 设置可视化类型
   */
  setType(type: VisualizerType): void {
    this.options.type = type;
    this.particles = []; // 清除粒子
  }

  /**
   * 获取分析器节点
   */
  getAnalyser(): AnalyserNode {
    return this.analyser;
  }

  /**
   * 获取频率数据
   */
  getFrequencyData(): Uint8Array<ArrayBuffer> {
    this.analyser.getByteFrequencyData(this.dataArray);
    return this.dataArray;
  }

  /**
   * 获取时域数据
   */
  getTimeDomainData(): Uint8Array<ArrayBuffer> {
    const buffer = new ArrayBuffer(this.analyser.fftSize);
    const data = new Uint8Array(buffer);
    this.analyser.getByteTimeDomainData(data);
    return data;
  }

  /**
   * 销毁
   */
  destroy(): void {
    this.isDestroyed = true;
    this.stop();
    this.disconnectSource();
    this.particles = [];
    this.gradientCache = null;
  }
}

/**
 * 创建简易频谱动画（不需要音频输入）
 */
export function createFakeSpectrum(
  container: HTMLElement,
  options: {
    barCount?: number;
    primaryColor?: string;
    secondaryColor?: string;
  } = {}
): {
  start: () => void;
  stop: () => void;
  destroy: () => void;
} {
  const barCount = options.barCount ?? 5;
  const primaryColor = options.primaryColor ?? '#6366f1';
  const secondaryColor = options.secondaryColor ?? '#ec4899';

  const wrapper = document.createElement('div');
  wrapper.style.cssText = `
    display: flex;
    align-items: flex-end;
    justify-content: center;
    gap: 3px;
    height: 24px;
  `;

  const bars: HTMLElement[] = [];
  for (let i = 0; i < barCount; i++) {
    const bar = document.createElement('div');
    bar.style.cssText = `
      width: 4px;
      height: 100%;
      background: linear-gradient(to top, ${primaryColor}, ${secondaryColor});
      border-radius: 2px;
      transform-origin: bottom;
      animation: fakeSpectrum 0.8s ease-in-out infinite;
      animation-delay: ${i * 0.1}s;
    `;
    bars.push(bar);
    wrapper.appendChild(bar);
  }

  // 添加动画样式
  const style = document.createElement('style');
  style.textContent = `
    @keyframes fakeSpectrum {
      0%, 100% { transform: scaleY(0.3); }
      50% { transform: scaleY(1); }
    }
  `;
  document.head.appendChild(style);

  container.appendChild(wrapper);

  let isRunning = false;

  return {
    start: () => {
      isRunning = true;
      bars.forEach((bar) => {
        bar.style.animationPlayState = 'running';
      });
    },
    stop: () => {
      isRunning = false;
      bars.forEach((bar) => {
        bar.style.animationPlayState = 'paused';
      });
    },
    destroy: () => {
      wrapper.remove();
      style.remove();
    },
  };
}
