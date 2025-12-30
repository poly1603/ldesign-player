/**
 * 弹幕系统
 * 支持滚动弹幕、顶部弹幕、底部弹幕
 * 优化：使用对象池复用 DOM 元素，CSS transform 动画避免重排
 */

export type DanmakuType = 'scroll' | 'top' | 'bottom';

export interface DanmakuItem {
  /** 弹幕ID */
  id?: string;
  /** 弹幕文本 */
  text: string;
  /** 弹幕出现时间（秒） */
  time: number;
  /** 弹幕类型 */
  type?: DanmakuType;
  /** 弹幕颜色 */
  color?: string;
  /** 字体大小 */
  fontSize?: number;
  /** 弹幕速度倍率（仅滚动弹幕） */
  speed?: number;
}

export interface DanmakuOptions {
  /** 容器元素 */
  container: HTMLElement;
  /** 视频元素 */
  video: HTMLVideoElement;
  /** 弹幕列表 */
  data?: DanmakuItem[];
  /** 弹幕速度（像素/秒） */
  speed?: number;
  /** 弹幕透明度 (0-1) */
  opacity?: number;
  /** 默认字体大小 */
  fontSize?: number;
  /** 弹幕轨道数量 */
  trackCount?: number;
  /** 是否显示弹幕 */
  visible?: boolean;
  /** 弹幕区域高度百分比 (0-1) */
  areaRatio?: number;
  /** 对象池大小 */
  poolSize?: number;
}

interface DanmakuTrack {
  id: number;
  endTime: number;
}

/** 弹幕元素池项 */
interface PooledDanmakuElement {
  element: HTMLDivElement;
  inUse: boolean;
  animationId?: number;
}

export class Danmaku {
  private container: HTMLElement;
  private video: HTMLVideoElement;
  private danmakuList: DanmakuItem[] = [];
  private speed: number;
  private opacity: number;
  private fontSize: number;
  private trackCount: number;
  private visible: boolean;
  private areaRatio: number;
  private poolSize: number;

  private danmakuContainer: HTMLElement;
  private tracks: DanmakuTrack[] = [];
  private topTracks: DanmakuTrack[] = [];
  private bottomTracks: DanmakuTrack[] = [];
  private activeDanmaku: Map<string, PooledDanmakuElement> = new Map();
  private elementPool: PooledDanmakuElement[] = [];
  private lastTime = 0;
  private animationId: number | null = null;
  private isPlaying = false;
  private idCounter = 0;
  private containerWidth = 0;
  private resizeObserver: ResizeObserver | null = null;

  constructor(options: DanmakuOptions) {
    this.container = options.container;
    this.video = options.video;
    this.danmakuList = options.data || [];
    this.speed = options.speed || 150;
    this.opacity = options.opacity ?? 1;
    this.fontSize = options.fontSize || 24;
    this.trackCount = options.trackCount || 8;
    this.visible = options.visible ?? true;
    this.areaRatio = options.areaRatio ?? 0.75;
    this.poolSize = options.poolSize || 50;

    this.createContainer();
    this.initTracks();
    this.initElementPool();
    this.bindEvents();
    this.setupResizeObserver();
  }

  /**
   * 初始化元素对象池
   */
  private initElementPool(): void {
    for (let i = 0; i < this.poolSize; i++) {
      const element = this.createDanmakuElement();
      this.elementPool.push({
        element,
        inUse: false,
      });
    }
  }

  /**
   * 创建弹幕 DOM 元素
   */
  private createDanmakuElement(): HTMLDivElement {
    const el = document.createElement('div');
    el.className = 'ld-danmaku-item';
    el.style.cssText = `
      position: absolute;
      white-space: nowrap;
      will-change: transform;
      pointer-events: none;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      font-weight: 600;
      text-shadow: 1px 1px 2px rgba(0,0,0,0.8);
      visibility: hidden;
    `;
    this.danmakuContainer.appendChild(el);
    return el;
  }

  /**
   * 从对象池获取元素
   */
  private acquireElement(): PooledDanmakuElement | null {
    // 优先使用池中空闲元素
    for (const pooled of this.elementPool) {
      if (!pooled.inUse) {
        pooled.inUse = true;
        return pooled;
      }
    }
    // 池已满，动态创建新元素
    if (this.elementPool.length < this.poolSize * 2) {
      const element = this.createDanmakuElement();
      const pooled: PooledDanmakuElement = { element, inUse: true };
      this.elementPool.push(pooled);
      return pooled;
    }
    return null;
  }

  /**
   * 释放元素回对象池
   */
  private releaseElement(pooled: PooledDanmakuElement): void {
    if (pooled.animationId) {
      cancelAnimationFrame(pooled.animationId);
      pooled.animationId = undefined;
    }
    pooled.inUse = false;
    pooled.element.style.visibility = 'hidden';
    pooled.element.style.transform = '';
  }

  /**
   * 设置容器尺寸监听
   */
  private setupResizeObserver(): void {
    this.containerWidth = this.danmakuContainer.clientWidth;
    this.resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        this.containerWidth = entry.contentRect.width;
      }
    });
    this.resizeObserver.observe(this.danmakuContainer);
  }

  private createContainer(): void {
    this.danmakuContainer = document.createElement('div');
    this.danmakuContainer.className = 'ld-danmaku-container';
    this.danmakuContainer.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: ${this.areaRatio * 100}%;
      overflow: hidden;
      pointer-events: none;
      opacity: ${this.opacity};
      display: ${this.visible ? 'block' : 'none'};
    `;
    this.container.style.position = 'relative';
    this.container.appendChild(this.danmakuContainer);
  }

  private initTracks(): void {
    for (let i = 0; i < this.trackCount; i++) {
      this.tracks.push({ id: i, endTime: 0 });
      this.topTracks.push({ id: i, endTime: 0 });
      this.bottomTracks.push({ id: i, endTime: 0 });
    }
  }

  private bindEvents(): void {
    this.video.addEventListener('play', () => this.start());
    this.video.addEventListener('pause', () => this.pause());
    this.video.addEventListener('seeking', () => this.clear());
    this.video.addEventListener('ended', () => this.pause());
  }

  /**
   * 添加弹幕
   */
  public add(item: DanmakuItem): void {
    const id = item.id || `danmaku_${++this.idCounter}`;
    this.danmakuList.push({ ...item, id });
    this.danmakuList.sort((a, b) => a.time - b.time);
  }

  /**
   * 发送即时弹幕（立即显示）
   */
  public send(text: string, options: Partial<DanmakuItem> = {}): void {
    const item: DanmakuItem = {
      id: `realtime_${++this.idCounter}`,
      text,
      time: this.video.currentTime,
      type: options.type || 'scroll',
      color: options.color || '#ffffff',
      fontSize: options.fontSize || this.fontSize,
      speed: options.speed,
    };
    this.renderDanmaku(item);
  }

  /**
   * 加载弹幕数据
   */
  public load(data: DanmakuItem[]): void {
    this.danmakuList = data.map((item, index) => ({
      ...item,
      id: item.id || `danmaku_${index}`,
    }));
    this.danmakuList.sort((a, b) => a.time - b.time);
  }

  /**
   * 开始播放弹幕
   */
  public start(): void {
    if (this.isPlaying) return;
    this.isPlaying = true;
    this.tick();
  }

  /**
   * 暂停弹幕
   */
  public pause(): void {
    this.isPlaying = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    // 暂停所有动画 - 取消 RAF 动画
    this.activeDanmaku.forEach((pooled) => {
      if (pooled.animationId) {
        cancelAnimationFrame(pooled.animationId);
      }
    });
  }

  /**
   * 恢复弹幕
   */
  public resume(): void {
    // RAF 动画会在 start() 中重新开始
    this.start();
  }

  /**
   * 清空弹幕
   */
  public clear(): void {
    this.activeDanmaku.forEach((pooled) => {
      this.releaseElement(pooled);
    });
    this.activeDanmaku.clear();
    this.tracks.forEach((t) => (t.endTime = 0));
    this.topTracks.forEach((t) => (t.endTime = 0));
    this.bottomTracks.forEach((t) => (t.endTime = 0));
  }

  /**
   * 显示/隐藏弹幕
   */
  public toggle(visible?: boolean): void {
    this.visible = visible ?? !this.visible;
    this.danmakuContainer.style.display = this.visible ? 'block' : 'none';
  }

  /**
   * 设置透明度
   */
  public setOpacity(opacity: number): void {
    this.opacity = Math.max(0, Math.min(1, opacity));
    this.danmakuContainer.style.opacity = String(this.opacity);
  }

  /**
   * 设置字体大小
   */
  public setFontSize(size: number): void {
    this.fontSize = size;
  }

  /**
   * 设置速度
   */
  public setSpeed(speed: number): void {
    this.speed = speed;
  }

  private tick(): void {
    if (!this.isPlaying) return;

    const currentTime = this.video.currentTime;

    // 查找需要显示的弹幕
    for (const item of this.danmakuList) {
      if (item.time >= this.lastTime && item.time < currentTime) {
        this.renderDanmaku(item);
      }
    }

    this.lastTime = currentTime;
    this.animationId = requestAnimationFrame(() => this.tick());
  }

  private renderDanmaku(item: DanmakuItem): void {
    const pooled = this.acquireElement();
    if (!pooled) return; // 对象池已满

    const el = pooled.element;
    el.textContent = item.text;
    el.style.color = item.color || '#ffffff';
    el.style.fontSize = `${item.fontSize || this.fontSize}px`;
    el.style.visibility = 'visible';

    const type = item.type || 'scroll';
    const trackHeight = this.danmakuContainer.clientHeight / this.trackCount;
    const containerWidth = this.containerWidth || this.danmakuContainer.clientWidth;

    if (type === 'scroll') {
      const track = this.findAvailableTrack(this.tracks);
      const speedMultiplier = item.speed || 1;
      const duration = (containerWidth + 300) / (this.speed * speedMultiplier);

      el.style.top = `${track.id * trackHeight}px`;
      el.style.left = '';
      el.style.bottom = '';
      
      // 使用 JavaScript 动画 + transform 替代 CSS animation
      this.animateScrollDanmaku(pooled, item.id!, containerWidth, duration);
      track.endTime = performance.now() + duration * 1000 * 0.3;
    } else if (type === 'top') {
      const track = this.findAvailableTrack(this.topTracks);
      el.style.top = `${track.id * trackHeight}px`;
      el.style.left = '50%';
      el.style.bottom = '';
      el.style.transform = 'translateX(-50%)';
      this.animateStaticDanmaku(pooled, item.id!, 4000);
      track.endTime = performance.now() + 4000;
    } else {
      const track = this.findAvailableTrack(this.bottomTracks);
      el.style.top = '';
      el.style.left = '50%';
      el.style.bottom = `${track.id * trackHeight}px`;
      el.style.transform = 'translateX(-50%)';
      this.animateStaticDanmaku(pooled, item.id!, 4000);
      track.endTime = performance.now() + 4000;
    }

    this.activeDanmaku.set(item.id!, pooled);
  }

  /**
   * 滚动弹幕动画 - 使用 requestAnimationFrame + transform
   */
  private animateScrollDanmaku(
    pooled: PooledDanmakuElement,
    id: string,
    containerWidth: number,
    duration: number
  ): void {
    const el = pooled.element;
    const startX = containerWidth;
    const endX = -el.offsetWidth - 50;
    const startTime = performance.now();
    const durationMs = duration * 1000;

    const animate = (currentTime: number) => {
      if (!pooled.inUse) return;

      // 如果暂停，保持当前位置不变
      if (!this.isPlaying) {
        pooled.animationId = requestAnimationFrame(animate);
        return;
      }

      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / durationMs, 1);
      const currentX = startX + (endX - startX) * progress;

      el.style.transform = `translateX(${currentX}px)`;

      if (progress < 1) {
        pooled.animationId = requestAnimationFrame(animate);
      } else {
        // 动画结束，释放元素
        this.releaseElement(pooled);
        this.activeDanmaku.delete(id);
      }
    };

    el.style.transform = `translateX(${startX}px)`;
    pooled.animationId = requestAnimationFrame(animate);
  }

  /**
   * 静态弹幕动画 - 显示固定时间后消失
   */
  private animateStaticDanmaku(
    pooled: PooledDanmakuElement,
    id: string,
    duration: number
  ): void {
    const startTime = performance.now();

    const checkEnd = (currentTime: number) => {
      if (!pooled.inUse) return;

      const elapsed = currentTime - startTime;
      if (elapsed >= duration) {
        this.releaseElement(pooled);
        this.activeDanmaku.delete(id);
      } else {
        pooled.animationId = requestAnimationFrame(checkEnd);
      }
    };

    pooled.animationId = requestAnimationFrame(checkEnd);
  }

  private findAvailableTrack(tracks: DanmakuTrack[]): DanmakuTrack {
    const now = performance.now();
    for (const track of tracks) {
      if (track.endTime < now) {
        return track;
      }
    }
    // 返回最早可用的轨道
    return tracks.reduce((min, t) => (t.endTime < min.endTime ? t : min));
  }

  public destroy(): void {
    this.pause();
    this.clear();
    // 销毁对象池中所有元素
    this.elementPool.forEach((pooled) => {
      if (pooled.animationId) {
        cancelAnimationFrame(pooled.animationId);
      }
      pooled.element.remove();
    });
    this.elementPool = [];
    // 停止尺寸监听
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }
    this.danmakuContainer.remove();
  }

  /**
   * 获取当前活动弹幕数量
   */
  public getActiveCount(): number {
    return this.activeDanmaku.size;
  }

  /**
   * 获取对象池使用情况
   */
  public getPoolStats(): { total: number; inUse: number } {
    const inUse = this.elementPool.filter((p) => p.inUse).length;
    return { total: this.elementPool.length, inUse };
  }
}
