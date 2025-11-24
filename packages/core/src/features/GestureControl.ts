/**
 * 手势控制功能
 * 移动端手势操作：双击暂停、滑动快进/音量/亮度控制
 */

import type { IPlayer } from '../types/player';

export interface GestureControlOptions {
  enableDoubleTap?: boolean; // 双击暂停/播放
  enableHorizontalSwipe?: boolean; // 左右滑动快进/快退
  enableVerticalSwipe?: boolean; // 上下滑动音量/亮度
  doubleTapDelay?: number; // 双击间隔时间（毫秒）
  swipeThreshold?: number; // 滑动触发阈值（像素）
  seekSensitivity?: number; // 快进灵敏度（秒/像素）
  volumeSensitivity?: number; // 音量灵敏度
}

export class GestureControl {
  private player: IPlayer;
  private container: HTMLElement;

  // 选项
  private enableDoubleTap = true;
  private enableHorizontalSwipe = true;
  private enableVerticalSwipe = true;
  private doubleTapDelay = 300;
  private swipeThreshold = 30;
  private seekSensitivity = 0.1;
  private volumeSensitivity = 0.003;

  // 触摸状态
  private touchStartX = 0;
  private touchStartY = 0;
  private touchStartTime = 0;
  private lastTapTime = 0;
  private isSwiping = false;
  private swipeDirection: 'horizontal' | 'vertical' | null = null;

  // UI 元素
  private seekPreview: HTMLDivElement | null = null;
  private volumeIndicator: HTMLDivElement | null = null;
  private brightnessIndicator: HTMLDivElement | null = null;

  constructor(player: IPlayer, container: HTMLElement, options: GestureControlOptions = {}) {
    this.player = player;
    this.container = container;

    // 应用选项
    if (options.enableDoubleTap !== undefined) {
      this.enableDoubleTap = options.enableDoubleTap;
    }
    if (options.enableHorizontalSwipe !== undefined) {
      this.enableHorizontalSwipe = options.enableHorizontalSwipe;
    }
    if (options.enableVerticalSwipe !== undefined) {
      this.enableVerticalSwipe = options.enableVerticalSwipe;
    }
    if (options.doubleTapDelay !== undefined) {
      this.doubleTapDelay = options.doubleTapDelay;
    }
    if (options.swipeThreshold !== undefined) {
      this.swipeThreshold = options.swipeThreshold;
    }
    if (options.seekSensitivity !== undefined) {
      this.seekSensitivity = options.seekSensitivity;
    }
    if (options.volumeSensitivity !== undefined) {
      this.volumeSensitivity = options.volumeSensitivity;
    }

    this.setupGestures();
    this.createIndicators();
  }

  /**
   * 设置手势监听
   */
  private setupGestures(): void {
    this.container.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: true });
    this.container.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
    this.container.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: true });
  }

  /**
   * 触摸开始
   */
  private handleTouchStart(e: TouchEvent): void {
    const touch = e.touches[0];
    this.touchStartX = touch.clientX;
    this.touchStartY = touch.clientY;
    this.touchStartTime = Date.now();
    this.isSwiping = false;
    this.swipeDirection = null;
  }

  /**
   * 触摸移动
   */
  private handleTouchMove(e: TouchEvent): void {
    if (!e.touches.length) return;

    const touch = e.touches[0];
    const deltaX = touch.clientX - this.touchStartX;
    const deltaY = touch.clientY - this.touchStartY;

    // 判断滑动方向
    if (!this.isSwiping && !this.swipeDirection) {
      if (Math.abs(deltaX) > this.swipeThreshold || Math.abs(deltaY) > this.swipeThreshold) {
        this.isSwiping = true;
        this.swipeDirection = Math.abs(deltaX) > Math.abs(deltaY) ? 'horizontal' : 'vertical';
      }
    }

    if (!this.isSwiping) return;

    // 阻止默认滚动行为
    e.preventDefault();

    if (this.swipeDirection === 'horizontal' && this.enableHorizontalSwipe) {
      // 水平滑动：快进/快退
      this.handleHorizontalSwipe(deltaX);
    } else if (this.swipeDirection === 'vertical' && this.enableVerticalSwipe) {
      // 垂直滑动：音量或亮度
      const isLeftSide = this.touchStartX < this.container.offsetWidth / 2;
      if (isLeftSide) {
        this.handleBrightnessSwipe(deltaY);
      } else {
        this.handleVolumeSwipe(deltaY);
      }
    }
  }

  /**
   * 触摸结束
   */
  private handleTouchEnd(e: TouchEvent): void {
    const touchDuration = Date.now() - this.touchStartTime;

    // 双击检测
    if (touchDuration < 200 && !this.isSwiping) {
      const now = Date.now();
      if (now - this.lastTapTime < this.doubleTapDelay && this.enableDoubleTap) {
        this.handleDoubleTap();
      }
      this.lastTapTime = now;
    }

    // 应用快进/快退
    if (this.isSwiping && this.swipeDirection === 'horizontal') {
      this.applySeek();
    }

    // 重置状态
    this.isSwiping = false;
    this.swipeDirection = null;
    this.hideIndicators();
  }

  /**
   * 处理水平滑动（快进/快退）
   */
  private handleHorizontalSwipe(deltaX: number): void {
    const containerWidth = this.container.offsetWidth;
    const seekAmount = (deltaX / containerWidth) * 60 * this.seekSensitivity; // 最多60秒
    const currentTime = this.player.getCurrentTime();
    const newTime = Math.max(0, Math.min(this.player.getDuration(), currentTime + seekAmount));

    this.showSeekPreview(newTime, seekAmount);
  }

  /**
   * 处理音量滑动
   */
  private handleVolumeSwipe(deltaY: number): void {
    const currentVolume = this.player.getVolume();
    const volumeChange = -deltaY * this.volumeSensitivity;
    const newVolume = Math.max(0, Math.min(1, currentVolume + volumeChange));

    this.player.setVolume(newVolume);
    this.showVolumeIndicator(newVolume);
  }

  /**
   * 处理亮度滑动
   */
  private handleBrightnessSwipe(deltaY: number): void {
    const video = this.player.getMediaElement?.() as HTMLVideoElement;
    if (!video) return;

    const currentBrightness = parseFloat(video.style.filter?.match(/brightness\(([0-9.]+)\)/)?.[1] || '1');
    const brightnessChange = -deltaY * 0.002;
    const newBrightness = Math.max(0.2, Math.min(2, currentBrightness + brightnessChange));

    video.style.filter = `brightness(${newBrightness})`;
    this.showBrightnessIndicator(newBrightness);
  }

  /**
   * 处理双击
   */
  private handleDoubleTap(): void {
    const state = this.player.getState?.();
    if (state?.isPlaying) {
      this.player.pause();
    } else {
      this.player.play();
    }
  }

  /**
   * 应用快进/快退
   */
  private applySeek(): void {
    if (this.seekPreview) {
      const timeText = this.seekPreview.dataset.time;
      if (timeText) {
        this.player.seek(parseFloat(timeText));
      }
    }
  }

  /**
   * 创建指示器
   */
  private createIndicators(): void {
    // 快进预览
    this.seekPreview = document.createElement('div');
    this.seekPreview.className = 'gesture-seek-preview';
    this.seekPreview.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(0, 0, 0, 0.8);
      color: white;
      padding: 16px 24px;
      border-radius: 8px;
      font-size: 18px;
      display: none;
      z-index: 1000;
    `;
    this.container.appendChild(this.seekPreview);

    // 音量指示器
    this.volumeIndicator = document.createElement('div');
    this.volumeIndicator.className = 'gesture-volume-indicator';
    this.volumeIndicator.style.cssText = `
      position: absolute;
      top: 50%;
      right: 30px;
      transform: translateY(-50%);
      background: rgba(0, 0, 0, 0.8);
      color: white;
      padding: 12px;
      border-radius: 8px;
      display: none;
      z-index: 1000;
    `;
    this.container.appendChild(this.volumeIndicator);

    // 亮度指示器
    this.brightnessIndicator = document.createElement('div');
    this.brightnessIndicator.className = 'gesture-brightness-indicator';
    this.brightnessIndicator.style.cssText = `
      position: absolute;
      top: 50%;
      left: 30px;
      transform: translateY(-50%);
      background: rgba(0, 0, 0, 0.8);
      color: white;
      padding: 12px;
      border-radius: 8px;
      display: none;
      z-index: 1000;
    `;
    this.container.appendChild(this.brightnessIndicator);
  }

  /**
   * 显示快进预览
   */
  private showSeekPreview(time: number, delta: number): void {
    if (!this.seekPreview) return;

    const sign = delta >= 0 ? '+' : '';
    const formattedTime = this.formatTime(time);
    const formattedDelta = this.formatTime(Math.abs(delta));

    this.seekPreview.textContent = `${sign}${formattedDelta} → ${formattedTime}`;
    this.seekPreview.dataset.time = time.toString();
    this.seekPreview.style.display = 'block';
  }

  /**
   * 显示音量指示器
   */
  private showVolumeIndicator(volume: number): void {
    if (!this.volumeIndicator) return;

    this.volumeIndicator.textContent = `🔊 ${Math.round(volume * 100)}%`;
    this.volumeIndicator.style.display = 'block';
  }

  /**
   * 显示亮度指示器
   */
  private showBrightnessIndicator(brightness: number): void {
    if (!this.brightnessIndicator) return;

    this.brightnessIndicator.textContent = `☀️ ${Math.round(brightness * 100)}%`;
    this.brightnessIndicator.style.display = 'block';
  }

  /**
   * 隐藏所有指示器
   */
  private hideIndicators(): void {
    setTimeout(() => {
      if (this.seekPreview) this.seekPreview.style.display = 'none';
      if (this.volumeIndicator) this.volumeIndicator.style.display = 'none';
      if (this.brightnessIndicator) this.brightnessIndicator.style.display = 'none';
    }, 500);
  }

  /**
   * 格式化时间
   */
  private formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${String(secs).padStart(2, '0')}`;
  }

  /**
   * 销毁
   */
  destroy(): void {
    this.seekPreview?.remove();
    this.volumeIndicator?.remove();
    this.brightnessIndicator?.remove();
  }
}
