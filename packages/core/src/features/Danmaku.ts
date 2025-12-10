/**
 * 弹幕系统
 * 支持滚动弹幕、顶部弹幕、底部弹幕
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
}

interface DanmakuTrack {
  id: number;
  endTime: number;
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

  private danmakuContainer: HTMLElement;
  private tracks: DanmakuTrack[] = [];
  private topTracks: DanmakuTrack[] = [];
  private bottomTracks: DanmakuTrack[] = [];
  private activeDanmaku: Map<string, HTMLElement> = new Map();
  private lastTime = 0;
  private animationId: number | null = null;
  private isPlaying = false;
  private idCounter = 0;

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

    this.createContainer();
    this.initTracks();
    this.bindEvents();
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
    // 暂停所有动画
    this.activeDanmaku.forEach((el) => {
      el.style.animationPlayState = 'paused';
    });
  }

  /**
   * 恢复弹幕
   */
  public resume(): void {
    this.activeDanmaku.forEach((el) => {
      el.style.animationPlayState = 'running';
    });
    this.start();
  }

  /**
   * 清空弹幕
   */
  public clear(): void {
    this.activeDanmaku.forEach((el) => el.remove());
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
    const el = document.createElement('div');
    el.className = 'ld-danmaku-item';
    el.textContent = item.text;
    el.style.cssText = `
      position: absolute;
      white-space: nowrap;
      color: ${item.color || '#ffffff'};
      font-size: ${item.fontSize || this.fontSize}px;
      text-shadow: 1px 1px 2px rgba(0,0,0,0.8);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      font-weight: 600;
    `;

    const type = item.type || 'scroll';
    const trackHeight = this.danmakuContainer.clientHeight / this.trackCount;

    if (type === 'scroll') {
      const track = this.findAvailableTrack(this.tracks);
      const duration = (this.danmakuContainer.clientWidth + 300) / (this.speed * (item.speed || 1));

      el.style.top = `${track.id * trackHeight}px`;
      el.style.right = `-300px`;
      el.style.animation = `danmaku-scroll ${duration}s linear forwards`;

      track.endTime = performance.now() + duration * 1000 * 0.3;
    } else if (type === 'top') {
      const track = this.findAvailableTrack(this.topTracks);
      el.style.top = `${track.id * trackHeight}px`;
      el.style.left = '50%';
      el.style.transform = 'translateX(-50%)';
      el.style.animation = 'danmaku-static 4s linear forwards';
      track.endTime = performance.now() + 4000;
    } else {
      const track = this.findAvailableTrack(this.bottomTracks);
      el.style.bottom = `${track.id * trackHeight}px`;
      el.style.left = '50%';
      el.style.transform = 'translateX(-50%)';
      el.style.animation = 'danmaku-static 4s linear forwards';
      track.endTime = performance.now() + 4000;
    }

    this.danmakuContainer.appendChild(el);
    this.activeDanmaku.set(item.id!, el);

    el.addEventListener('animationend', () => {
      el.remove();
      this.activeDanmaku.delete(item.id!);
    });
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
    this.danmakuContainer.remove();
  }
}

// 注入弹幕动画样式
const style = document.createElement('style');
style.textContent = `
  @keyframes danmaku-scroll {
    from { transform: translateX(0); }
    to { transform: translateX(calc(-100% - 100vw)); }
  }
  @keyframes danmaku-static {
    0%, 100% { opacity: 1; }
  }
`;
if (typeof document !== 'undefined') {
  document.head.appendChild(style);
}
