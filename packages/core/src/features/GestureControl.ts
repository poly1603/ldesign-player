/**
 * 手势控制功能
 * 移动端手势操作：双击暂停、滑动快进/音量/亮度控制
 * 增强：双指缩放、长按倍速、边缘滑动检测、触觉反馈
 */

import type { IPlayer } from '../types/player';

export interface GestureControlOptions {
  enableDoubleTap?: boolean; // 双击暂停/播放
  enableHorizontalSwipe?: boolean; // 左右滑动快进/快退
  enableVerticalSwipe?: boolean; // 上下滑动音量/亮度
  enablePinchZoom?: boolean; // 双指缩放
  enableLongPressSpeed?: boolean; // 长按倍速播放
  enableDoubleTapSeek?: boolean; // 双击左右侧快进/快退
  doubleTapDelay?: number; // 双击间隔时间（毫秒）
  swipeThreshold?: number; // 滑动触发阈值（像素）
  seekSensitivity?: number; // 快进灵敏度（秒/像素）
  volumeSensitivity?: number; // 音量灵敏度
  longPressDelay?: number; // 长按触发延迟（毫秒）
  longPressSpeed?: number; // 长按时的播放速度倍率
  edgeWidth?: number; // 边缘区域宽度（像素）
  doubleTapSeekTime?: number; // 双击快进/快退秒数
  enableHapticFeedback?: boolean; // 启用触觉反馈
}

export class GestureControl {
  private player: IPlayer;
  private container: HTMLElement;

  // 选项
  private enableDoubleTap = true;
  private enableHorizontalSwipe = true;
  private enableVerticalSwipe = true;
  private enablePinchZoom = true;
  private enableLongPressSpeed = true;
  private enableDoubleTapSeek = true;
  private doubleTapDelay = 300;
  private swipeThreshold = 30;
  private seekSensitivity = 0.1;
  private volumeSensitivity = 0.003;
  private longPressDelay = 500;
  private longPressSpeed = 2;
  private edgeWidth = 80;
  private doubleTapSeekTime = 10;
  private enableHapticFeedback = true;

  // 触摸状态
  private touchStartX = 0;
  private touchStartY = 0;
  private touchStartTime = 0;
  private lastTapTime = 0;
  private lastTapX = 0;
  private isSwiping = false;
  private swipeDirection: 'horizontal' | 'vertical' | null = null;

  // 长按状态
  private longPressTimer: number | null = null;
  private isLongPressing = false;
  private originalSpeed = 1;

  // 双指缩放状态
  private isPinching = false;
  private initialPinchDistance = 0;
  private currentScale = 1;
  private baseScale = 1;

  // UI 元素
  private seekPreview: HTMLDivElement | null = null;
  private volumeIndicator: HTMLDivElement | null = null;
  private brightnessIndicator: HTMLDivElement | null = null;
  private speedIndicator: HTMLDivElement | null = null;
  private doubleTapIndicator: HTMLDivElement | null = null;
  private zoomIndicator: HTMLDivElement | null = null;

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
    if (options.enablePinchZoom !== undefined) {
      this.enablePinchZoom = options.enablePinchZoom;
    }
    if (options.enableLongPressSpeed !== undefined) {
      this.enableLongPressSpeed = options.enableLongPressSpeed;
    }
    if (options.enableDoubleTapSeek !== undefined) {
      this.enableDoubleTapSeek = options.enableDoubleTapSeek;
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
    if (options.longPressDelay !== undefined) {
      this.longPressDelay = options.longPressDelay;
    }
    if (options.longPressSpeed !== undefined) {
      this.longPressSpeed = options.longPressSpeed;
    }
    if (options.edgeWidth !== undefined) {
      this.edgeWidth = options.edgeWidth;
    }
    if (options.doubleTapSeekTime !== undefined) {
      this.doubleTapSeekTime = options.doubleTapSeekTime;
    }
    if (options.enableHapticFeedback !== undefined) {
      this.enableHapticFeedback = options.enableHapticFeedback;
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
    // 双指触摸
    if (e.touches.length === 2 && this.enablePinchZoom) {
      this.startPinch(e);
      return;
    }

    const touch = e.touches[0];
    this.touchStartX = touch.clientX;
    this.touchStartY = touch.clientY;
    this.touchStartTime = Date.now();
    this.isSwiping = false;
    this.swipeDirection = null;

    // 启动长按检测
    if (this.enableLongPressSpeed) {
      this.startLongPressDetection();
    }
  }

  /**
   * 触摸移动
   */
  private handleTouchMove(e: TouchEvent): void {
    if (!e.touches.length) return;

    // 双指缩放
    if (e.touches.length === 2 && this.isPinching) {
      this.handlePinch(e);
      return;
    }

    // 取消长按检测（用户在移动）
    if (this.longPressTimer) {
      this.cancelLongPress();
    }

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
    // 双指缩放结束
    if (this.isPinching) {
      this.endPinch();
      return;
    }

    // 取消长按
    this.cancelLongPress();

    // 长按结束，恢复速度
    if (this.isLongPressing) {
      this.endLongPress();
      return;
    }

    const touchDuration = Date.now() - this.touchStartTime;

    // 双击检测
    if (touchDuration < 200 && !this.isSwiping) {
      const now = Date.now();
      if (now - this.lastTapTime < this.doubleTapDelay) {
        // 双击处理
        if (this.enableDoubleTapSeek) {
          this.handleDoubleTapSeek();
        } else if (this.enableDoubleTap) {
          this.handleDoubleTap();
        }
      }
      this.lastTapTime = now;
      this.lastTapX = this.touchStartX;
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
    // 尝试获取媒体元素
    const video = (this.player as unknown as { getMediaElement?: () => HTMLVideoElement }).getMediaElement?.() 
      || this.container.querySelector('video');
    if (!video) return;

    const currentBrightness = parseFloat(video.style.filter?.match(/brightness\(([0-9.]+)\)/)?.[1] || '1');
    const brightnessChange = -deltaY * 0.002;
    const newBrightness = Math.max(0.2, Math.min(2, currentBrightness + brightnessChange));

    video.style.filter = `brightness(${newBrightness})`;
    this.showBrightnessIndicator(newBrightness);
  }

  /**
   * 处理双击播放/暂停
   */
  private handleDoubleTap(): void {
    this.triggerHapticFeedback();
    const state = this.player.getState?.();
    if (state?.playState === 'playing') {
      this.player.pause();
    } else {
      this.player.play();
    }
  }

  /**
   * 处理双击快进/快退
   */
  private handleDoubleTapSeek(): void {
    const containerWidth = this.container.offsetWidth;
    const isLeftSide = this.lastTapX < containerWidth / 3;
    const isRightSide = this.lastTapX > (containerWidth * 2) / 3;

    if (isLeftSide) {
      // 左侧双击：快退
      const currentTime = this.player.getCurrentTime();
      const newTime = Math.max(0, currentTime - this.doubleTapSeekTime);
      this.player.seek(newTime);
      this.showDoubleTapIndicator('left', this.doubleTapSeekTime);
      this.triggerHapticFeedback();
    } else if (isRightSide) {
      // 右侧双击：快进
      const currentTime = this.player.getCurrentTime();
      const duration = this.player.getDuration();
      const newTime = Math.min(duration, currentTime + this.doubleTapSeekTime);
      this.player.seek(newTime);
      this.showDoubleTapIndicator('right', this.doubleTapSeekTime);
      this.triggerHapticFeedback();
    } else {
      // 中间双击：播放/暂停
      this.handleDoubleTap();
    }
  }

  /**
   * 启动长按检测
   */
  private startLongPressDetection(): void {
    this.longPressTimer = window.setTimeout(() => {
      this.startLongPress();
    }, this.longPressDelay);
  }

  /**
   * 取消长按检测
   */
  private cancelLongPress(): void {
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
    }
  }

  /**
   * 开始长按倍速播放
   */
  private startLongPress(): void {
    this.isLongPressing = true;
    this.originalSpeed = this.player.getPlaybackRate();
    this.player.setPlaybackRate(this.longPressSpeed);
    this.showSpeedIndicator(this.longPressSpeed);
    this.triggerHapticFeedback();
  }

  /**
   * 结束长按
   */
  private endLongPress(): void {
    this.isLongPressing = false;
    this.player.setPlaybackRate(this.originalSpeed);
    this.hideSpeedIndicator();
  }

  /**
   * 开始双指缩放
   */
  private startPinch(e: TouchEvent): void {
    this.isPinching = true;
    this.initialPinchDistance = this.getPinchDistance(e);
    this.baseScale = this.currentScale;
  }

  /**
   * 处理双指缩放
   */
  private handlePinch(e: TouchEvent): void {
    e.preventDefault();
    const distance = this.getPinchDistance(e);
    const scale = (distance / this.initialPinchDistance) * this.baseScale;
    this.currentScale = Math.max(1, Math.min(3, scale));
    this.applyZoom(this.currentScale);
    this.showZoomIndicator(this.currentScale);
  }

  /**
   * 结束双指缩放
   */
  private endPinch(): void {
    this.isPinching = false;
    this.hideZoomIndicator();
  }

  /**
   * 获取双指距离
   */
  private getPinchDistance(e: TouchEvent): number {
    const touch1 = e.touches[0];
    const touch2 = e.touches[1];
    return Math.hypot(
      touch2.clientX - touch1.clientX,
      touch2.clientY - touch1.clientY
    );
  }

  /**
   * 应用缩放
   */
  private applyZoom(scale: number): void {
    const video = (this.player as any).getMediaElement?.() as HTMLVideoElement;
    if (video) {
      video.style.transform = `scale(${scale})`;
      video.style.transformOrigin = 'center center';
    }
  }

  /**
   * 重置缩放
   */
  public resetZoom(): void {
    this.currentScale = 1;
    const video = (this.player as any).getMediaElement?.() as HTMLVideoElement;
    if (video) {
      video.style.transform = '';
    }
  }

  /**
   * 触发触觉反馈
   */
  private triggerHapticFeedback(): void {
    if (this.enableHapticFeedback && 'vibrate' in navigator) {
      navigator.vibrate(10);
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
    const baseStyle = `
      position: absolute;
      background: rgba(0, 0, 0, 0.8);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      color: white;
      border-radius: 12px;
      font-size: 16px;
      font-weight: 500;
      z-index: 1000;
      pointer-events: none;
      transition: opacity 0.2s;
    `;

    // 快进预览
    this.seekPreview = document.createElement('div');
    this.seekPreview.className = 'gesture-seek-preview';
    this.seekPreview.style.cssText = `
      ${baseStyle}
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      padding: 16px 24px;
      display: none;
    `;
    this.container.appendChild(this.seekPreview);

    // 音量指示器
    this.volumeIndicator = document.createElement('div');
    this.volumeIndicator.className = 'gesture-volume-indicator';
    this.volumeIndicator.style.cssText = `
      ${baseStyle}
      top: 50%;
      right: 30px;
      transform: translateY(-50%);
      padding: 16px;
      min-width: 80px;
      text-align: center;
      display: none;
    `;
    this.container.appendChild(this.volumeIndicator);

    // 亮度指示器
    this.brightnessIndicator = document.createElement('div');
    this.brightnessIndicator.className = 'gesture-brightness-indicator';
    this.brightnessIndicator.style.cssText = `
      ${baseStyle}
      top: 50%;
      left: 30px;
      transform: translateY(-50%);
      padding: 16px;
      min-width: 80px;
      text-align: center;
      display: none;
    `;
    this.container.appendChild(this.brightnessIndicator);

    // 速度指示器（长按）
    this.speedIndicator = document.createElement('div');
    this.speedIndicator.className = 'gesture-speed-indicator';
    this.speedIndicator.style.cssText = `
      ${baseStyle}
      top: 60px;
      left: 50%;
      transform: translateX(-50%);
      padding: 10px 20px;
      display: none;
    `;
    this.container.appendChild(this.speedIndicator);

    // 双击快进/快退指示器
    this.doubleTapIndicator = document.createElement('div');
    this.doubleTapIndicator.className = 'gesture-doubletap-indicator';
    this.doubleTapIndicator.style.cssText = `
      ${baseStyle}
      top: 50%;
      transform: translateY(-50%);
      padding: 20px;
      border-radius: 50%;
      display: none;
    `;
    this.container.appendChild(this.doubleTapIndicator);

    // 缩放指示器
    this.zoomIndicator = document.createElement('div');
    this.zoomIndicator.className = 'gesture-zoom-indicator';
    this.zoomIndicator.style.cssText = `
      ${baseStyle}
      bottom: 80px;
      left: 50%;
      transform: translateX(-50%);
      padding: 10px 20px;
      display: none;
    `;
    this.container.appendChild(this.zoomIndicator);
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

    const volumePercent = Math.round(volume * 100);
    const icon = volume === 0 ? '🔇' : volume < 0.5 ? '🔉' : '🔊';
    this.volumeIndicator.innerHTML = `
      <div style="font-size: 24px; margin-bottom: 8px;">${icon}</div>
      <div>${volumePercent}%</div>
    `;
    this.volumeIndicator.style.display = 'block';
  }

  /**
   * 显示亮度指示器
   */
  private showBrightnessIndicator(brightness: number): void {
    if (!this.brightnessIndicator) return;

    const brightnessPercent = Math.round(brightness * 100);
    const icon = brightness < 0.5 ? '🌙' : '☀️';
    this.brightnessIndicator.innerHTML = `
      <div style="font-size: 24px; margin-bottom: 8px;">${icon}</div>
      <div>${brightnessPercent}%</div>
    `;
    this.brightnessIndicator.style.display = 'block';
  }

  /**
   * 显示速度指示器
   */
  private showSpeedIndicator(speed: number): void {
    if (!this.speedIndicator) return;

    this.speedIndicator.innerHTML = `
      <span style="margin-right: 8px;">⏩</span>
      <span>${speed}x 倍速播放</span>
    `;
    this.speedIndicator.style.display = 'block';
  }

  /**
   * 隐藏速度指示器
   */
  private hideSpeedIndicator(): void {
    if (this.speedIndicator) {
      this.speedIndicator.style.display = 'none';
    }
  }

  /**
   * 显示双击快进/快退指示器
   */
  private showDoubleTapIndicator(side: 'left' | 'right', seconds: number): void {
    if (!this.doubleTapIndicator) return;

    const icon = side === 'left' ? '⏪' : '⏩';
    const text = side === 'left' ? `-${seconds}s` : `+${seconds}s`;
    
    this.doubleTapIndicator.innerHTML = `
      <div style="font-size: 32px;">${icon}</div>
      <div style="font-size: 14px; margin-top: 4px;">${text}</div>
    `;
    this.doubleTapIndicator.style.left = side === 'left' ? '25%' : '75%';
    this.doubleTapIndicator.style.display = 'block';

    setTimeout(() => {
      if (this.doubleTapIndicator) {
        this.doubleTapIndicator.style.display = 'none';
      }
    }, 500);
  }

  /**
   * 显示缩放指示器
   */
  private showZoomIndicator(scale: number): void {
    if (!this.zoomIndicator) return;

    this.zoomIndicator.innerHTML = `
      <span style="margin-right: 8px;">🔍</span>
      <span>${Math.round(scale * 100)}%</span>
    `;
    this.zoomIndicator.style.display = 'block';
  }

  /**
   * 隐藏缩放指示器
   */
  private hideZoomIndicator(): void {
    setTimeout(() => {
      if (this.zoomIndicator) {
        this.zoomIndicator.style.display = 'none';
      }
    }, 300);
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
   * 获取当前缩放级别
   */
  public getZoomLevel(): number {
    return this.currentScale;
  }

  /**
   * 设置缩放级别
   */
  public setZoomLevel(scale: number): void {
    this.currentScale = Math.max(1, Math.min(3, scale));
    this.applyZoom(this.currentScale);
  }

  /**
   * 启用/禁用手势
   */
  public setEnabled(options: Partial<GestureControlOptions>): void {
    if (options.enableDoubleTap !== undefined) this.enableDoubleTap = options.enableDoubleTap;
    if (options.enableHorizontalSwipe !== undefined) this.enableHorizontalSwipe = options.enableHorizontalSwipe;
    if (options.enableVerticalSwipe !== undefined) this.enableVerticalSwipe = options.enableVerticalSwipe;
    if (options.enablePinchZoom !== undefined) this.enablePinchZoom = options.enablePinchZoom;
    if (options.enableLongPressSpeed !== undefined) this.enableLongPressSpeed = options.enableLongPressSpeed;
    if (options.enableDoubleTapSeek !== undefined) this.enableDoubleTapSeek = options.enableDoubleTapSeek;
  }

  /**
   * 销毁
   */
  destroy(): void {
    this.cancelLongPress();
    this.seekPreview?.remove();
    this.volumeIndicator?.remove();
    this.brightnessIndicator?.remove();
    this.speedIndicator?.remove();
    this.doubleTapIndicator?.remove();
    this.zoomIndicator?.remove();
    this.resetZoom();
  }
}
