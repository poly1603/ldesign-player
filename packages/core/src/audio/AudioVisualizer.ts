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
  | 'oscilloscope'
  | 'circularDouble'   // 双环形频谱
  | 'circularWave'     // 环形波浪
  | 'particleFlow'     // 粒子流
  | 'starfield'        // 星空粒子
  | 'pulse'            // 脉冲动画
  | 'galaxy';          // 银河旋转

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
  /** 第三颜色（用于高级效果） */
  tertiaryColor?: string;
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
  /** 旋转速度 */
  rotationSpeed?: number;
  /** 粒子数量上限 */
  maxParticles?: number;
  /** 发光效果强度 */
  glowIntensity?: number;
  /** 是否启用轨迹 */
  trails?: boolean;
  /** 轨迹衰减系数 */
  trailsFade?: number;
}

const DEFAULT_OPTIONS: Required<VisualizerOptions> = {
  type: 'bars',
  fftSize: 256,
  smoothingTimeConstant: 0.8,
  primaryColor: '#6366f1',
  secondaryColor: '#ec4899',
  tertiaryColor: '#22d3ee',
  backgroundColor: 'transparent',
  gradient: true,
  barCount: 64,
  barGap: 2,
  barRadius: 2,
  mirror: false,
  sensitivity: 1,
  minDecibels: -90,
  maxDecibels: -10,
  rotationSpeed: 0.5,
  maxParticles: 300,
  glowIntensity: 15,
  trails: false,
  trailsFade: 0.1,
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
  
  // 高级效果状态
  private rotation = 0;
  private frameCount = 0;
  private starParticles: StarParticle[] = [];
  private flowParticles: FlowParticle[] = [];
  private galaxyStars: GalaxyStar[] = [];
  private pulseRings: PulseRing[] = [];
  private previousData: Uint8Array | null = null;

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

    // 轨迹效果：不完全清除
    if (this.options.trails) {
      const { width, height } = this.canvas.getBoundingClientRect();
      this.ctx.fillStyle = `rgba(0, 0, 0, ${this.options.trailsFade})`;
      this.ctx.fillRect(0, 0, width, height);
    }

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
      case 'circularDouble':
        this.drawCircularDouble();
        break;
      case 'circularWave':
        this.drawCircularWave();
        break;
      case 'particleFlow':
        this.drawParticleFlow();
        break;
      case 'starfield':
        this.drawStarfield();
        break;
      case 'pulse':
        this.drawPulse();
        break;
      case 'galaxy':
        this.drawGalaxy();
        break;
    }

    this.frameCount++;
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
   * 双环形频谱
   */
  private drawCircularDouble(): void {
    const { width, height } = this.canvas.getBoundingClientRect();
    const { barCount, sensitivity, gradient, rotationSpeed, glowIntensity } = this.options;

    const centerX = width / 2;
    const centerY = height / 2;
    const baseRadius = Math.min(width, height) * 0.25;
    const step = Math.floor(this.dataArray.length / barCount);

    // 更新旋转
    this.rotation += rotationSpeed * 0.01;

    this.ctx.lineCap = 'round';
    this.ctx.lineWidth = 3;

    // 外环（向外）
    for (let i = 0; i < barCount; i++) {
      const value = this.dataArray[i * step] * sensitivity;
      const percent = value / 255;
      const barLength = percent * baseRadius * 0.6;

      const angle = (i / barCount) * Math.PI * 2 + this.rotation;
      const innerRadius = baseRadius * 1.2;

      const x1 = centerX + Math.cos(angle) * innerRadius;
      const y1 = centerY + Math.sin(angle) * innerRadius;
      const x2 = centerX + Math.cos(angle) * (innerRadius + barLength);
      const y2 = centerY + Math.sin(angle) * (innerRadius + barLength);

      if (gradient) {
        const hue = (i / barCount) * 120 + 180; // 蓝到绿
        this.ctx.strokeStyle = `hsla(${hue}, 80%, 60%, ${0.5 + percent * 0.5})`;
        this.ctx.shadowColor = `hsl(${hue}, 80%, 60%)`;
        this.ctx.shadowBlur = glowIntensity * percent;
      } else {
        this.ctx.strokeStyle = this.options.primaryColor;
      }

      this.ctx.beginPath();
      this.ctx.moveTo(x1, y1);
      this.ctx.lineTo(x2, y2);
      this.ctx.stroke();
    }

    // 内环（向内）
    for (let i = 0; i < barCount; i++) {
      const value = this.dataArray[Math.floor((barCount - 1 - i) * step)] * sensitivity;
      const percent = value / 255;
      const barLength = percent * baseRadius * 0.4;

      const angle = (i / barCount) * Math.PI * 2 - this.rotation;
      const outerRadius = baseRadius * 0.8;

      const x1 = centerX + Math.cos(angle) * outerRadius;
      const y1 = centerY + Math.sin(angle) * outerRadius;
      const x2 = centerX + Math.cos(angle) * (outerRadius - barLength);
      const y2 = centerY + Math.sin(angle) * (outerRadius - barLength);

      if (gradient) {
        const hue = (i / barCount) * 120 + 300; // 紫到粉
        this.ctx.strokeStyle = `hsla(${hue}, 80%, 60%, ${0.5 + percent * 0.5})`;
        this.ctx.shadowColor = `hsl(${hue}, 80%, 60%)`;
        this.ctx.shadowBlur = glowIntensity * percent;
      } else {
        this.ctx.strokeStyle = this.options.secondaryColor;
      }

      this.ctx.beginPath();
      this.ctx.moveTo(x1, y1);
      this.ctx.lineTo(x2, y2);
      this.ctx.stroke();
    }

    this.ctx.shadowBlur = 0;

    // 中心脉冲圆
    const avgValue = this.getAverageFrequency() / 255;
    const pulseRadius = baseRadius * 0.3 * (0.8 + avgValue * 0.4);

    const centerGrad = this.ctx.createRadialGradient(
      centerX, centerY, 0,
      centerX, centerY, pulseRadius
    );
    centerGrad.addColorStop(0, this.hexToRgba(this.options.primaryColor, 0.8));
    centerGrad.addColorStop(0.5, this.hexToRgba(this.options.secondaryColor, 0.4));
    centerGrad.addColorStop(1, 'transparent');

    this.ctx.beginPath();
    this.ctx.arc(centerX, centerY, pulseRadius, 0, Math.PI * 2);
    this.ctx.fillStyle = centerGrad;
    this.ctx.fill();
  }

  /**
   * 环形波浪
   */
  private drawCircularWave(): void {
    const { width, height } = this.canvas.getBoundingClientRect();
    const { sensitivity, gradient, rotationSpeed, glowIntensity } = this.options;

    const centerX = width / 2;
    const centerY = height / 2;
    const baseRadius = Math.min(width, height) * 0.3;
    const points = 180;

    this.rotation += rotationSpeed * 0.005;

    // 绘制多层波浪
    for (let layer = 0; layer < 3; layer++) {
      const layerOffset = layer * 0.15;
      const layerRadius = baseRadius * (1 + layerOffset);
      const layerAlpha = 1 - layer * 0.3;

      this.ctx.beginPath();

      for (let i = 0; i <= points; i++) {
        const angle = (i / points) * Math.PI * 2 + this.rotation + layer * 0.5;
        const dataIndex = Math.floor((i / points) * this.dataArray.length);
        const value = (this.dataArray[dataIndex] || 0) * sensitivity;
        const displacement = (value / 255) * baseRadius * 0.3;

        const r = layerRadius + displacement;
        const x = centerX + Math.cos(angle) * r;
        const y = centerY + Math.sin(angle) * r;

        if (i === 0) {
          this.ctx.moveTo(x, y);
        } else {
          this.ctx.lineTo(x, y);
        }
      }

      this.ctx.closePath();

      // 填充
      if (gradient) {
        const hue = (this.frameCount + layer * 60) % 360;
        this.ctx.fillStyle = `hsla(${hue}, 70%, 50%, ${layerAlpha * 0.2})`;
        this.ctx.strokeStyle = `hsla(${hue}, 80%, 60%, ${layerAlpha})`;
        this.ctx.shadowColor = `hsl(${hue}, 80%, 60%)`;
        this.ctx.shadowBlur = glowIntensity;
      } else {
        this.ctx.fillStyle = this.hexToRgba(this.options.primaryColor, layerAlpha * 0.2);
        this.ctx.strokeStyle = this.hexToRgba(this.options.primaryColor, layerAlpha);
      }

      this.ctx.lineWidth = 2;
      this.ctx.fill();
      this.ctx.stroke();
    }

    this.ctx.shadowBlur = 0;
  }

  /**
   * 粒子流
   */
  private drawParticleFlow(): void {
    const { width, height } = this.canvas.getBoundingClientRect();
    const { sensitivity, gradient, maxParticles, glowIntensity } = this.options;

    const avgFreq = this.getAverageFrequency() * sensitivity;
    const bassFreq = this.getBassFrequency() * sensitivity;

    // 根据音频能量生成新粒子
    const spawnRate = Math.floor(avgFreq / 30);
    for (let i = 0; i < spawnRate && this.flowParticles.length < maxParticles; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 2 + bassFreq / 100;

      this.flowParticles.push({
        x: width / 2,
        y: height / 2,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 2 + Math.random() * 3,
        life: 0,
        maxLife: 80 + Math.random() * 40,
        hue: Math.random() * 60 + 200,
        trail: [],
      });
    }

    // 更新和绘制粒子
    for (let i = this.flowParticles.length - 1; i >= 0; i--) {
      const p = this.flowParticles[i];

      // 保存轨迹
      p.trail.push({ x: p.x, y: p.y });
      if (p.trail.length > 10) p.trail.shift();

      // 更新位置（添加扰动）
      const turbulence = avgFreq / 500;
      p.vx += (Math.random() - 0.5) * turbulence;
      p.vy += (Math.random() - 0.5) * turbulence;
      p.x += p.vx;
      p.y += p.vy;
      p.life++;

      const lifePercent = 1 - p.life / p.maxLife;

      if (p.life >= p.maxLife || p.x < 0 || p.x > width || p.y < 0 || p.y > height) {
        this.flowParticles.splice(i, 1);
        continue;
      }

      // 绘制轨迹
      if (p.trail.length > 1) {
        this.ctx.beginPath();
        this.ctx.moveTo(p.trail[0].x, p.trail[0].y);
        for (let j = 1; j < p.trail.length; j++) {
          this.ctx.lineTo(p.trail[j].x, p.trail[j].y);
        }
        const trailAlpha = lifePercent * 0.3;
        this.ctx.strokeStyle = gradient
          ? `hsla(${p.hue}, 80%, 60%, ${trailAlpha})`
          : this.hexToRgba(this.options.primaryColor, trailAlpha);
        this.ctx.lineWidth = p.size * 0.5;
        this.ctx.stroke();
      }

      // 绘制粒子
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size * lifePercent, 0, Math.PI * 2);

      if (gradient) {
        this.ctx.fillStyle = `hsla(${p.hue}, 80%, 60%, ${lifePercent})`;
        this.ctx.shadowColor = `hsl(${p.hue}, 80%, 60%)`;
        this.ctx.shadowBlur = glowIntensity * lifePercent;
      } else {
        this.ctx.fillStyle = this.hexToRgba(this.options.primaryColor, lifePercent);
      }

      this.ctx.fill();
    }

    this.ctx.shadowBlur = 0;
  }

  /**
   * 星空粒子
   */
  private drawStarfield(): void {
    const { width, height } = this.canvas.getBoundingClientRect();
    const { sensitivity, gradient, maxParticles, glowIntensity } = this.options;

    const centerX = width / 2;
    const centerY = height / 2;
    const avgFreq = this.getAverageFrequency() * sensitivity;

    // 初始化星星
    while (this.starParticles.length < maxParticles * 0.5) {
      const angle = Math.random() * Math.PI * 2;
      const distance = Math.random() * 10;
      this.starParticles.push({
        x: centerX + Math.cos(angle) * distance,
        y: centerY + Math.sin(angle) * distance,
        z: Math.random() * 1000,
        size: 0.5 + Math.random() * 1.5,
        speed: 2 + Math.random() * 3,
        hue: Math.random() * 60 + 200,
      });
    }

    // 更新和绘制星星
    for (let i = 0; i < this.starParticles.length; i++) {
      const star = this.starParticles[i];

      // 移动（音频影响速度）
      const speedMultiplier = 1 + avgFreq / 100;
      star.z -= star.speed * speedMultiplier;

      // 重置远处的星星
      if (star.z <= 0) {
        star.z = 1000;
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * 10;
        star.x = centerX + Math.cos(angle) * distance;
        star.y = centerY + Math.sin(angle) * distance;
      }

      // 投影
      const perspective = 300 / star.z;
      const screenX = centerX + (star.x - centerX) * perspective;
      const screenY = centerY + (star.y - centerY) * perspective;
      const screenSize = star.size * perspective;

      // 绘制星星
      const alpha = Math.min(1, (1000 - star.z) / 500);
      this.ctx.beginPath();
      this.ctx.arc(screenX, screenY, Math.max(0.5, screenSize), 0, Math.PI * 2);

      if (gradient) {
        this.ctx.fillStyle = `hsla(${star.hue}, 80%, 80%, ${alpha})`;
        this.ctx.shadowColor = `hsl(${star.hue}, 80%, 80%)`;
        this.ctx.shadowBlur = glowIntensity * alpha * (avgFreq / 128);
      } else {
        this.ctx.fillStyle = this.hexToRgba(this.options.primaryColor, alpha);
      }

      this.ctx.fill();

      // 高速时绘制拖尾
      if (speedMultiplier > 1.5 && star.z < 800) {
        const tailLength = (1000 - star.z) / 50 * speedMultiplier;
        const tailX = centerX + (star.x - centerX) * (300 / (star.z + tailLength));
        const tailY = centerY + (star.y - centerY) * (300 / (star.z + tailLength));

        this.ctx.beginPath();
        this.ctx.moveTo(screenX, screenY);
        this.ctx.lineTo(tailX, tailY);
        this.ctx.strokeStyle = gradient
          ? `hsla(${star.hue}, 80%, 80%, ${alpha * 0.5})`
          : this.hexToRgba(this.options.primaryColor, alpha * 0.5);
        this.ctx.lineWidth = screenSize * 0.5;
        this.ctx.stroke();
      }
    }

    this.ctx.shadowBlur = 0;
  }

  /**
   * 脉冲动画
   */
  private drawPulse(): void {
    const { width, height } = this.canvas.getBoundingClientRect();
    const { sensitivity, gradient, glowIntensity } = this.options;

    const centerX = width / 2;
    const centerY = height / 2;
    const maxRadius = Math.min(width, height) * 0.45;

    // 检测节拍
    const bassFreq = this.getBassFrequency() * sensitivity;
    if (bassFreq > 150 && (this.pulseRings.length === 0 || this.pulseRings[this.pulseRings.length - 1].radius > 30)) {
      this.pulseRings.push({
        radius: 20,
        maxRadius: maxRadius,
        alpha: 1,
        lineWidth: 3 + (bassFreq / 255) * 5,
        hue: Math.random() * 60 + 280,
        speed: 3 + (bassFreq / 255) * 4,
      });
    }

    // 绘制中心圆
    const avgFreq = this.getAverageFrequency() * sensitivity;
    const centerRadius = 20 + (avgFreq / 255) * 30;

    const centerGrad = this.ctx.createRadialGradient(
      centerX, centerY, 0,
      centerX, centerY, centerRadius
    );

    if (gradient) {
      const hue = (this.frameCount * 2) % 360;
      centerGrad.addColorStop(0, `hsla(${hue}, 80%, 70%, 1)`);
      centerGrad.addColorStop(0.5, `hsla(${hue + 30}, 80%, 60%, 0.5)`);
      centerGrad.addColorStop(1, 'transparent');
    } else {
      centerGrad.addColorStop(0, this.options.primaryColor);
      centerGrad.addColorStop(1, 'transparent');
    }

    this.ctx.beginPath();
    this.ctx.arc(centerX, centerY, centerRadius, 0, Math.PI * 2);
    this.ctx.fillStyle = centerGrad;
    this.ctx.fill();

    // 更新和绘制脉冲环
    for (let i = this.pulseRings.length - 1; i >= 0; i--) {
      const ring = this.pulseRings[i];

      ring.radius += ring.speed;
      ring.alpha = 1 - ring.radius / ring.maxRadius;

      if (ring.radius >= ring.maxRadius) {
        this.pulseRings.splice(i, 1);
        continue;
      }

      this.ctx.beginPath();
      this.ctx.arc(centerX, centerY, ring.radius, 0, Math.PI * 2);

      if (gradient) {
        this.ctx.strokeStyle = `hsla(${ring.hue}, 80%, 60%, ${ring.alpha})`;
        this.ctx.shadowColor = `hsl(${ring.hue}, 80%, 60%)`;
        this.ctx.shadowBlur = glowIntensity * ring.alpha;
      } else {
        this.ctx.strokeStyle = this.hexToRgba(this.options.primaryColor, ring.alpha);
      }

      this.ctx.lineWidth = ring.lineWidth * ring.alpha;
      this.ctx.stroke();
    }

    // 绘制频谱条作为装饰
    const barCount = 32;
    const step = Math.floor(this.dataArray.length / barCount);

    for (let i = 0; i < barCount; i++) {
      const value = this.dataArray[i * step] * sensitivity;
      const percent = value / 255;
      const barLength = percent * 40;

      const angle = (i / barCount) * Math.PI * 2 - Math.PI / 2;
      const innerRadius = centerRadius + 10;

      const x1 = centerX + Math.cos(angle) * innerRadius;
      const y1 = centerY + Math.sin(angle) * innerRadius;
      const x2 = centerX + Math.cos(angle) * (innerRadius + barLength);
      const y2 = centerY + Math.sin(angle) * (innerRadius + barLength);

      if (gradient) {
        const hue = (i / barCount) * 60 + 280;
        this.ctx.strokeStyle = `hsla(${hue}, 80%, 60%, ${0.3 + percent * 0.7})`;
      } else {
        this.ctx.strokeStyle = this.hexToRgba(this.options.secondaryColor, 0.3 + percent * 0.7);
      }

      this.ctx.lineWidth = 2;
      this.ctx.lineCap = 'round';
      this.ctx.beginPath();
      this.ctx.moveTo(x1, y1);
      this.ctx.lineTo(x2, y2);
      this.ctx.stroke();
    }

    this.ctx.shadowBlur = 0;
  }

  /**
   * 银河旋转
   */
  private drawGalaxy(): void {
    const { width, height } = this.canvas.getBoundingClientRect();
    const { sensitivity, gradient, maxParticles, rotationSpeed, glowIntensity } = this.options;

    const centerX = width / 2;
    const centerY = height / 2;
    const avgFreq = this.getAverageFrequency() * sensitivity;

    this.rotation += rotationSpeed * 0.01 * (1 + avgFreq / 200);

    // 初始化银河星星
    while (this.galaxyStars.length < maxParticles * 0.7) {
      const arm = Math.floor(Math.random() * 4);
      const distance = Math.random() * Math.min(width, height) * 0.4;
      const armAngle = (arm / 4) * Math.PI * 2;
      const spiralAngle = distance * 0.01;

      this.galaxyStars.push({
        distance,
        angle: armAngle + spiralAngle + (Math.random() - 0.5) * 0.5,
        size: 0.5 + Math.random() * 2,
        brightness: 0.3 + Math.random() * 0.7,
        hue: 200 + Math.random() * 60,
        speed: 0.001 + Math.random() * 0.002,
        offset: Math.random() * Math.PI * 2,
      });
    }

    // 绘制银河核心
    const coreRadius = 20 + (avgFreq / 255) * 20;
    const coreGrad = this.ctx.createRadialGradient(
      centerX, centerY, 0,
      centerX, centerY, coreRadius * 2
    );

    if (gradient) {
      coreGrad.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
      coreGrad.addColorStop(0.3, this.hexToRgba(this.options.primaryColor, 0.6));
      coreGrad.addColorStop(0.6, this.hexToRgba(this.options.secondaryColor, 0.3));
      coreGrad.addColorStop(1, 'transparent');
    } else {
      coreGrad.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
      coreGrad.addColorStop(0.5, this.hexToRgba(this.options.primaryColor, 0.4));
      coreGrad.addColorStop(1, 'transparent');
    }

    this.ctx.beginPath();
    this.ctx.arc(centerX, centerY, coreRadius * 2, 0, Math.PI * 2);
    this.ctx.fillStyle = coreGrad;
    this.ctx.fill();

    // 更新和绘制星星
    for (const star of this.galaxyStars) {
      // 内层转快，外层转慢
      const speedFactor = 1 - star.distance / (Math.min(width, height) * 0.4);
      star.angle += star.speed * (1 + speedFactor) * (1 + avgFreq / 200);

      // 添加脉动效果
      const pulse = Math.sin(this.frameCount * 0.05 + star.offset) * 0.3 + 1;

      const x = centerX + Math.cos(star.angle + this.rotation) * star.distance;
      const y = centerY + Math.sin(star.angle + this.rotation) * star.distance;

      // 根据距离调整大小和亮度
      const distanceFactor = 1 - star.distance / (Math.min(width, height) * 0.5);
      const sizeMultiplier = 0.5 + distanceFactor * 0.5 + (avgFreq / 255) * 0.5;
      const size = star.size * sizeMultiplier * pulse;
      const brightness = star.brightness * (0.7 + distanceFactor * 0.3);

      this.ctx.beginPath();
      this.ctx.arc(x, y, Math.max(0.3, size), 0, Math.PI * 2);

      if (gradient) {
        this.ctx.fillStyle = `hsla(${star.hue}, 70%, ${60 + brightness * 30}%, ${brightness})`;
        if (size > 1.5) {
          this.ctx.shadowColor = `hsl(${star.hue}, 70%, 70%)`;
          this.ctx.shadowBlur = glowIntensity * 0.5;
        }
      } else {
        this.ctx.fillStyle = this.hexToRgba(this.options.primaryColor, brightness);
      }

      this.ctx.fill();
    }

    // 绘制旋臂光晕
    for (let arm = 0; arm < 4; arm++) {
      const armAngle = (arm / 4) * Math.PI * 2 + this.rotation;

      this.ctx.beginPath();
      for (let d = 30; d < Math.min(width, height) * 0.35; d += 5) {
        const spiralAngle = d * 0.012;
        const x = centerX + Math.cos(armAngle + spiralAngle) * d;
        const y = centerY + Math.sin(armAngle + spiralAngle) * d;

        if (d === 30) {
          this.ctx.moveTo(x, y);
        } else {
          this.ctx.lineTo(x, y);
        }
      }

      const armHue = 220 + arm * 15;
      this.ctx.strokeStyle = gradient
        ? `hsla(${armHue}, 60%, 60%, 0.1)`
        : this.hexToRgba(this.options.primaryColor, 0.1);
      this.ctx.lineWidth = 15 + (avgFreq / 255) * 10;
      this.ctx.lineCap = 'round';
      this.ctx.stroke();
    }

    this.ctx.shadowBlur = 0;
  }

  /**
   * 获取平均频率
   */
  private getAverageFrequency(): number {
    let sum = 0;
    for (let i = 0; i < this.dataArray.length; i++) {
      sum += this.dataArray[i];
    }
    return sum / this.dataArray.length;
  }

  /**
   * 获取低频（Bass）能量
   */
  private getBassFrequency(): number {
    const bassRange = Math.floor(this.dataArray.length * 0.1);
    let sum = 0;
    for (let i = 0; i < bassRange; i++) {
      sum += this.dataArray[i];
    }
    return sum / bassRange;
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
    // 清除粒子状态
    this.particles = [];
    this.flowParticles = [];
    this.starParticles = [];
    this.galaxyStars = [];
    this.pulseRings = [];
    this.rotation = 0;
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
    this.flowParticles = [];
    this.starParticles = [];
    this.galaxyStars = [];
    this.pulseRings = [];
    this.gradientCache = null;
    this.previousData = null;
  }
}

/**
 * 粒子流粒子
 */
interface FlowParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  life: number;
  maxLife: number;
  hue: number;
  trail: { x: number; y: number }[];
}

/**
 * 星空粒子
 */
interface StarParticle {
  x: number;
  y: number;
  z: number;
  size: number;
  speed: number;
  hue: number;
}

/**
 * 银河星星
 */
interface GalaxyStar {
  distance: number;
  angle: number;
  size: number;
  brightness: number;
  hue: number;
  speed: number;
  offset: number;
}

/**
 * 脉冲环
 */
interface PulseRing {
  radius: number;
  maxRadius: number;
  alpha: number;
  lineWidth: number;
  hue: number;
  speed: number;
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
