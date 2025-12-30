/**
 * 画中画增强模块
 * 支持原生 Picture-in-Picture API、位置记忆、自定义控件
 */

export interface PiPOptions {
  /** 是否优先使用原生 PiP */
  preferNative?: boolean;
  /** 是否记住位置 */
  rememberPosition?: boolean;
  /** 是否记住大小 */
  rememberSize?: boolean;
  /** 存储键名 */
  storageKey?: string;
  /** 默认宽度 */
  defaultWidth?: number;
  /** 默认高度 */
  defaultHeight?: number;
  /** 默认位置 */
  defaultPosition?: PiPPosition;
  /** 是否自动进入 PiP（当页面不可见时） */
  autoEnterOnHidden?: boolean;
  /** 是否自动退出 PiP（当页面可见时） */
  autoExitOnVisible?: boolean;
  /** 是否可拖拽 */
  draggable?: boolean;
  /** 是否可调整大小 */
  resizable?: boolean;
  /** 是否吸附边缘 */
  snapToEdge?: boolean;
  /** 吸附距离 */
  snapDistance?: number;
  /** 最小宽度 */
  minWidth?: number;
  /** 最小高度 */
  minHeight?: number;
  /** z-index */
  zIndex?: number;
  /** 控件配置 */
  controls?: PiPControlsConfig;
}

export interface PiPControlsConfig {
  /** 显示关闭按钮 */
  close?: boolean;
  /** 显示播放/暂停按钮 */
  playPause?: boolean;
  /** 显示静音按钮 */
  mute?: boolean;
  /** 显示进度条 */
  progress?: boolean;
  /** 显示最大化按钮 */
  maximize?: boolean;
  /** 显示返回原位按钮 */
  backToPlayer?: boolean;
}

export type PiPPosition =
  | 'top-left'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right'
  | 'center'
  | { x: number; y: number };

export interface PiPState {
  isActive: boolean;
  mode: 'native' | 'custom' | null;
  position: { x: number; y: number };
  size: { width: number; height: number };
}

export type PiPEventType =
  | 'enter'
  | 'exit'
  | 'resize'
  | 'move'
  | 'modechange';

export interface PiPEventDetail {
  type: PiPEventType;
  state: PiPState;
}

const DEFAULT_OPTIONS: Required<PiPOptions> = {
  preferNative: true,
  rememberPosition: true,
  rememberSize: true,
  storageKey: 'ldesign-pip-state',
  defaultWidth: 320,
  defaultHeight: 180,
  defaultPosition: 'bottom-right',
  autoEnterOnHidden: false,
  autoExitOnVisible: false,
  draggable: true,
  resizable: true,
  snapToEdge: true,
  snapDistance: 20,
  minWidth: 240,
  minHeight: 135,
  zIndex: 9999,
  controls: {
    close: true,
    playPause: true,
    mute: true,
    progress: true,
    maximize: false,
    backToPlayer: true,
  },
};

/**
 * 画中画管理器
 */
export class PictureInPicture {
  private videoElement: HTMLVideoElement;
  private container: HTMLElement;
  private options: Required<PiPOptions>;

  private state: PiPState = {
    isActive: false,
    mode: null,
    position: { x: 0, y: 0 },
    size: { width: 320, height: 180 },
  };

  // 自定义 PiP 窗口
  private pipWindow: HTMLDivElement | null = null;
  private originalParent: HTMLElement | null = null;
  private originalStyles: string = '';

  // 拖拽状态
  private isDragging = false;
  private dragOffset = { x: 0, y: 0 };

  // 调整大小状态
  private isResizing = false;
  private resizeHandle: string | null = null;
  private resizeStart = { x: 0, y: 0, width: 0, height: 0 };

  // 事件处理
  private eventTarget = new EventTarget();
  private boundHandlers: Map<string, EventListener> = new Map();

  // 原生 PiP 事件处理
  private pipWindowEventListeners: Map<string, Function> = new Map();

  constructor(
    videoElement: HTMLVideoElement,
    container: HTMLElement,
    options: PiPOptions = {}
  ) {
    this.videoElement = videoElement;
    this.container = container;
    this.options = { ...DEFAULT_OPTIONS, ...options };

    // 恢复保存的状态
    this.restoreState();

    // 绑定页面可见性事件
    if (this.options.autoEnterOnHidden || this.options.autoExitOnVisible) {
      this.bindVisibilityEvents();
    }

    // 绑定原生 PiP 事件
    this.bindNativePiPEvents();
  }

  /**
   * 检查是否支持原生 PiP
   */
  static isNativeSupported(): boolean {
    return 'pictureInPictureEnabled' in document &&
           document.pictureInPictureEnabled === true;
  }

  /**
   * 检查视频是否可以进入原生 PiP
   */
  canEnterNativePiP(): boolean {
    return PictureInPicture.isNativeSupported() &&
           !this.videoElement.disablePictureInPicture;
  }

  /**
   * 进入画中画模式
   */
  async enter(): Promise<void> {
    if (this.state.isActive) return;

    // 尝试原生 PiP
    if (this.options.preferNative && this.canEnterNativePiP()) {
      try {
        await this.enterNativePiP();
        return;
      } catch (error) {
        console.warn('Native PiP failed, falling back to custom PiP:', error);
      }
    }

    // 使用自定义 PiP
    this.enterCustomPiP();
  }

  /**
   * 退出画中画模式
   */
  async exit(): Promise<void> {
    if (!this.state.isActive) return;

    if (this.state.mode === 'native') {
      await this.exitNativePiP();
    } else {
      this.exitCustomPiP();
    }
  }

  /**
   * 切换画中画模式
   */
  async toggle(): Promise<void> {
    if (this.state.isActive) {
      await this.exit();
    } else {
      await this.enter();
    }
  }

  /**
   * 获取当前状态
   */
  getState(): PiPState {
    return { ...this.state };
  }

  /**
   * 是否处于 PiP 模式
   */
  isActive(): boolean {
    return this.state.isActive;
  }

  /**
   * 设置位置
   */
  setPosition(position: PiPPosition): void {
    if (this.state.mode !== 'custom' || !this.pipWindow) return;

    const pos = this.resolvePosition(position);
    this.state.position = pos;

    this.pipWindow.style.left = `${pos.x}px`;
    this.pipWindow.style.top = `${pos.y}px`;

    this.saveState();
    this.emitEvent('move');
  }

  /**
   * 设置大小
   */
  setSize(width: number, height: number): void {
    if (this.state.mode !== 'custom' || !this.pipWindow) return;

    width = Math.max(this.options.minWidth, width);
    height = Math.max(this.options.minHeight, height);

    this.state.size = { width, height };

    this.pipWindow.style.width = `${width}px`;
    this.pipWindow.style.height = `${height}px`;

    this.saveState();
    this.emitEvent('resize');
  }

  /**
   * 监听事件
   */
  on(type: PiPEventType, handler: (detail: PiPEventDetail) => void): void {
    const wrappedHandler = ((e: CustomEvent<PiPEventDetail>) => {
      handler(e.detail);
    }) as EventListener;

    this.boundHandlers.set(`${type}-${handler}`, wrappedHandler);
    this.eventTarget.addEventListener(type, wrappedHandler);
  }

  /**
   * 取消监听事件
   */
  off(type: PiPEventType, handler: (detail: PiPEventDetail) => void): void {
    const key = `${type}-${handler}`;
    const wrappedHandler = this.boundHandlers.get(key);
    if (wrappedHandler) {
      this.eventTarget.removeEventListener(type, wrappedHandler);
      this.boundHandlers.delete(key);
    }
  }

  /**
   * 进入原生 PiP
   */
  private async enterNativePiP(): Promise<void> {
    const pipWindow = await this.videoElement.requestPictureInPicture();

    this.state.isActive = true;
    this.state.mode = 'native';
    this.state.size = { width: pipWindow.width, height: pipWindow.height };

    // 监听原生 PiP 窗口大小变化
    const resizeHandler = () => {
      this.state.size = { width: pipWindow.width, height: pipWindow.height };
      this.emitEvent('resize');
    };

    pipWindow.addEventListener('resize', resizeHandler);
    this.pipWindowEventListeners.set('resize', resizeHandler);

    this.emitEvent('enter');
    this.emitEvent('modechange');
  }

  /**
   * 退出原生 PiP
   */
  private async exitNativePiP(): Promise<void> {
    if (document.pictureInPictureElement) {
      await document.exitPictureInPicture();
    }

    // 清理事件监听
    this.pipWindowEventListeners.clear();

    this.state.isActive = false;
    this.state.mode = null;

    this.emitEvent('exit');
    this.emitEvent('modechange');
  }

  /**
   * 进入自定义 PiP
   */
  private enterCustomPiP(): void {
    // 保存原始父元素和样式
    this.originalParent = this.videoElement.parentElement;
    this.originalStyles = this.videoElement.style.cssText;

    // 创建 PiP 窗口
    this.createPiPWindow();

    // 移动视频到 PiP 窗口
    if (this.pipWindow) {
      const videoWrapper = this.pipWindow.querySelector('.pip-video-wrapper');
      if (videoWrapper) {
        videoWrapper.appendChild(this.videoElement);
        this.videoElement.style.cssText = `
          width: 100%;
          height: 100%;
          object-fit: contain;
        `;
      }
    }

    // 绑定事件
    this.bindDragEvents();
    this.bindResizeEvents();

    this.state.isActive = true;
    this.state.mode = 'custom';

    this.emitEvent('enter');
    this.emitEvent('modechange');
  }

  /**
   * 退出自定义 PiP
   */
  private exitCustomPiP(): void {
    // 保存状态
    this.saveState();

    // 恢复视频到原位置
    if (this.originalParent) {
      this.originalParent.appendChild(this.videoElement);
      this.videoElement.style.cssText = this.originalStyles;
    }

    // 移除 PiP 窗口
    if (this.pipWindow) {
      this.pipWindow.remove();
      this.pipWindow = null;
    }

    this.state.isActive = false;
    this.state.mode = null;

    this.emitEvent('exit');
    this.emitEvent('modechange');
  }

  /**
   * 创建 PiP 窗口
   */
  private createPiPWindow(): void {
    this.pipWindow = document.createElement('div');
    this.pipWindow.className = 'ldesign-pip-window';

    const { width, height } = this.state.size;
    const pos = this.state.position.x === 0 && this.state.position.y === 0
      ? this.resolvePosition(this.options.defaultPosition)
      : this.state.position;

    this.state.position = pos;

    this.pipWindow.style.cssText = `
      position: fixed;
      left: ${pos.x}px;
      top: ${pos.y}px;
      width: ${width}px;
      height: ${height}px;
      background: #000;
      border-radius: 8px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
      overflow: hidden;
      z-index: ${this.options.zIndex};
      cursor: ${this.options.draggable ? 'move' : 'default'};
      user-select: none;
      transition: box-shadow 0.2s, transform 0.1s;
    `;

    // 视频容器
    const videoWrapper = document.createElement('div');
    videoWrapper.className = 'pip-video-wrapper';
    videoWrapper.style.cssText = `
      width: 100%;
      height: 100%;
      position: relative;
    `;
    this.pipWindow.appendChild(videoWrapper);

    // 控制栏
    this.createControls();

    // 调整大小手柄
    if (this.options.resizable) {
      this.createResizeHandles();
    }

    // 鼠标悬停效果
    this.pipWindow.addEventListener('mouseenter', () => {
      if (this.pipWindow) {
        this.pipWindow.style.boxShadow = '0 12px 48px rgba(0, 0, 0, 0.5)';
        const controls = this.pipWindow.querySelector('.pip-controls') as HTMLElement;
        if (controls) controls.style.opacity = '1';
        const progress = this.pipWindow.querySelector('.pip-progress') as HTMLElement;
        if (progress) progress.style.opacity = '1';
      }
    });

    this.pipWindow.addEventListener('mouseleave', () => {
      if (this.pipWindow && !this.isDragging && !this.isResizing) {
        this.pipWindow.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.4)';
        const controls = this.pipWindow.querySelector('.pip-controls') as HTMLElement;
        if (controls) controls.style.opacity = '0';
        const progress = this.pipWindow.querySelector('.pip-progress') as HTMLElement;
        if (progress) progress.style.opacity = '0';
      }
    });

    document.body.appendChild(this.pipWindow);
  }

  /**
   * 创建控制栏
   */
  private createControls(): void {
    if (!this.pipWindow) return;

    const { controls } = this.options;

    // 顶部控制栏
    const topControls = document.createElement('div');
    topControls.className = 'pip-controls pip-controls-top';
    topControls.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 36px;
      background: linear-gradient(to bottom, rgba(0, 0, 0, 0.7), transparent);
      display: flex;
      align-items: center;
      justify-content: flex-end;
      padding: 0 8px;
      opacity: 0;
      transition: opacity 0.2s;
      z-index: 10;
    `;

    // 返回原位按钮
    if (controls.backToPlayer) {
      const backBtn = this.createButton('⇱', '返回播放器', () => this.exit());
      topControls.appendChild(backBtn);
    }

    // 最大化按钮
    if (controls.maximize) {
      const maxBtn = this.createButton('⛶', '最大化', () => {
        this.setSize(window.innerWidth * 0.6, window.innerWidth * 0.6 * 9 / 16);
        this.setPosition('center');
      });
      topControls.appendChild(maxBtn);
    }

    // 关闭按钮
    if (controls.close) {
      const closeBtn = this.createButton('✕', '关闭', () => this.exit());
      topControls.appendChild(closeBtn);
    }

    this.pipWindow.appendChild(topControls);

    // 底部控制栏
    const bottomControls = document.createElement('div');
    bottomControls.className = 'pip-controls pip-controls-bottom';
    bottomControls.style.cssText = `
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 40px;
      background: linear-gradient(to top, rgba(0, 0, 0, 0.7), transparent);
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 16px;
      padding: 0 12px;
      opacity: 0;
      transition: opacity 0.2s;
      z-index: 10;
    `;

    // 播放/暂停按钮
    if (controls.playPause) {
      const playPauseBtn = this.createButton('▶', '播放/暂停', () => {
        if (this.videoElement.paused) {
          this.videoElement.play();
        } else {
          this.videoElement.pause();
        }
      });
      playPauseBtn.className = 'pip-btn pip-play-btn';

      // 监听播放状态
      this.videoElement.addEventListener('play', () => {
        playPauseBtn.innerHTML = '⏸';
        playPauseBtn.title = '暂停';
      });
      this.videoElement.addEventListener('pause', () => {
        playPauseBtn.innerHTML = '▶';
        playPauseBtn.title = '播放';
      });

      // 初始状态
      if (!this.videoElement.paused) {
        playPauseBtn.innerHTML = '⏸';
        playPauseBtn.title = '暂停';
      }

      bottomControls.appendChild(playPauseBtn);
    }

    // 静音按钮
    if (controls.mute) {
      const muteBtn = this.createButton(this.videoElement.muted ? '🔇' : '🔊', '静音', () => {
        this.videoElement.muted = !this.videoElement.muted;
      });
      muteBtn.className = 'pip-btn pip-mute-btn';

      // 监听静音状态
      this.videoElement.addEventListener('volumechange', () => {
        muteBtn.innerHTML = this.videoElement.muted || this.videoElement.volume === 0 ? '🔇' : '🔊';
      });

      bottomControls.appendChild(muteBtn);
    }

    this.pipWindow.appendChild(bottomControls);

    // 进度条
    if (controls.progress) {
      this.createProgressBar();
    }
  }

  /**
   * 创建进度条
   */
  private createProgressBar(): void {
    if (!this.pipWindow) return;

    const progressContainer = document.createElement('div');
    progressContainer.className = 'pip-progress';
    progressContainer.style.cssText = `
      position: absolute;
      bottom: 40px;
      left: 8px;
      right: 8px;
      height: 4px;
      background: rgba(255, 255, 255, 0.2);
      border-radius: 2px;
      cursor: pointer;
      opacity: 0;
      transition: opacity 0.2s, height 0.1s;
      z-index: 10;
    `;

    const progressBar = document.createElement('div');
    progressBar.className = 'pip-progress-bar';
    progressBar.style.cssText = `
      height: 100%;
      background: linear-gradient(to right, #6366f1, #ec4899);
      border-radius: 2px;
      width: 0%;
      transition: width 0.1s linear;
    `;
    progressContainer.appendChild(progressBar);

    const bufferedBar = document.createElement('div');
    bufferedBar.className = 'pip-buffered-bar';
    bufferedBar.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      height: 100%;
      background: rgba(255, 255, 255, 0.3);
      border-radius: 2px;
      width: 0%;
      z-index: -1;
    `;
    progressContainer.appendChild(bufferedBar);

    // 更新进度
    const updateProgress = () => {
      if (this.videoElement.duration) {
        const percent = (this.videoElement.currentTime / this.videoElement.duration) * 100;
        progressBar.style.width = `${percent}%`;
      }
    };

    // 更新缓冲
    const updateBuffered = () => {
      if (this.videoElement.buffered.length > 0 && this.videoElement.duration) {
        const bufferedEnd = this.videoElement.buffered.end(this.videoElement.buffered.length - 1);
        const percent = (bufferedEnd / this.videoElement.duration) * 100;
        bufferedBar.style.width = `${percent}%`;
      }
    };

    this.videoElement.addEventListener('timeupdate', updateProgress);
    this.videoElement.addEventListener('progress', updateBuffered);

    // 点击跳转
    progressContainer.addEventListener('click', (e) => {
      const rect = progressContainer.getBoundingClientRect();
      const percent = (e.clientX - rect.left) / rect.width;
      this.videoElement.currentTime = percent * this.videoElement.duration;
    });

    // 悬停效果
    progressContainer.addEventListener('mouseenter', () => {
      progressContainer.style.height = '6px';
    });
    progressContainer.addEventListener('mouseleave', () => {
      progressContainer.style.height = '4px';
    });

    this.pipWindow.appendChild(progressContainer);
  }

  /**
   * 创建按钮
   */
  private createButton(icon: string, title: string, onClick: () => void): HTMLButtonElement {
    const btn = document.createElement('button');
    btn.className = 'pip-btn';
    btn.innerHTML = icon;
    btn.title = title;
    btn.style.cssText = `
      background: rgba(255, 255, 255, 0.15);
      border: none;
      color: white;
      width: 28px;
      height: 28px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.2s;
      margin-left: 4px;
    `;

    btn.addEventListener('mouseenter', () => {
      btn.style.background = 'rgba(255, 255, 255, 0.3)';
    });
    btn.addEventListener('mouseleave', () => {
      btn.style.background = 'rgba(255, 255, 255, 0.15)';
    });

    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      onClick();
    });

    return btn;
  }

  /**
   * 创建调整大小手柄
   */
  private createResizeHandles(): void {
    if (!this.pipWindow) return;

    const handles = ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'];
    const cursors: Record<string, string> = {
      n: 'ns-resize',
      s: 'ns-resize',
      e: 'ew-resize',
      w: 'ew-resize',
      ne: 'nesw-resize',
      nw: 'nwse-resize',
      se: 'nwse-resize',
      sw: 'nesw-resize',
    };

    handles.forEach(position => {
      const handle = document.createElement('div');
      handle.className = `pip-resize-handle pip-resize-${position}`;
      handle.dataset.position = position;

      const styles: Record<string, string> = {
        position: 'absolute',
        zIndex: '20',
        cursor: cursors[position],
      };

      // 边缘手柄
      if (position === 'n') {
        Object.assign(styles, { top: '0', left: '10px', right: '10px', height: '6px' });
      } else if (position === 's') {
        Object.assign(styles, { bottom: '0', left: '10px', right: '10px', height: '6px' });
      } else if (position === 'e') {
        Object.assign(styles, { right: '0', top: '10px', bottom: '10px', width: '6px' });
      } else if (position === 'w') {
        Object.assign(styles, { left: '0', top: '10px', bottom: '10px', width: '6px' });
      }
      // 角落手柄
      else if (position === 'ne') {
        Object.assign(styles, { top: '0', right: '0', width: '12px', height: '12px' });
      } else if (position === 'nw') {
        Object.assign(styles, { top: '0', left: '0', width: '12px', height: '12px' });
      } else if (position === 'se') {
        Object.assign(styles, { bottom: '0', right: '0', width: '12px', height: '12px' });
      } else if (position === 'sw') {
        Object.assign(styles, { bottom: '0', left: '0', width: '12px', height: '12px' });
      }

      handle.style.cssText = Object.entries(styles).map(([k, v]) => `${k}: ${v}`).join('; ');
      this.pipWindow!.appendChild(handle);
    });
  }

  /**
   * 绑定拖拽事件
   */
  private bindDragEvents(): void {
    if (!this.pipWindow || !this.options.draggable) return;

    const handleDragStart = (e: MouseEvent) => {
      // 忽略调整大小手柄和控件上的点击
      const target = e.target as HTMLElement;
      if (
        target.classList.contains('pip-resize-handle') ||
        target.classList.contains('pip-btn') ||
        target.classList.contains('pip-progress') ||
        target.closest('.pip-controls')
      ) {
        return;
      }

      this.isDragging = true;
      this.dragOffset = {
        x: e.clientX - this.pipWindow!.offsetLeft,
        y: e.clientY - this.pipWindow!.offsetTop,
      };

      this.pipWindow!.style.cursor = 'grabbing';
      this.pipWindow!.style.transition = 'none';
    };

    const handleDrag = (e: MouseEvent) => {
      if (!this.isDragging || !this.pipWindow) return;

      let x = e.clientX - this.dragOffset.x;
      let y = e.clientY - this.dragOffset.y;

      // 边界限制
      const { innerWidth, innerHeight } = window;
      const { offsetWidth, offsetHeight } = this.pipWindow;

      x = Math.max(0, Math.min(x, innerWidth - offsetWidth));
      y = Math.max(0, Math.min(y, innerHeight - offsetHeight));

      // 边缘吸附
      if (this.options.snapToEdge) {
        const snap = this.options.snapDistance;
        if (x < snap) x = 0;
        if (y < snap) y = 0;
        if (innerWidth - x - offsetWidth < snap) x = innerWidth - offsetWidth;
        if (innerHeight - y - offsetHeight < snap) y = innerHeight - offsetHeight;
      }

      this.pipWindow.style.left = `${x}px`;
      this.pipWindow.style.top = `${y}px`;

      this.state.position = { x, y };
    };

    const handleDragEnd = () => {
      if (!this.isDragging) return;

      this.isDragging = false;
      if (this.pipWindow) {
        this.pipWindow.style.cursor = this.options.draggable ? 'move' : 'default';
        this.pipWindow.style.transition = 'box-shadow 0.2s, transform 0.1s';
      }

      this.saveState();
      this.emitEvent('move');
    };

    this.pipWindow.addEventListener('mousedown', handleDragStart);
    document.addEventListener('mousemove', handleDrag);
    document.addEventListener('mouseup', handleDragEnd);
  }

  /**
   * 绑定调整大小事件
   */
  private bindResizeEvents(): void {
    if (!this.pipWindow || !this.options.resizable) return;

    const handles = this.pipWindow.querySelectorAll('.pip-resize-handle');

    const handleResizeStart = (e: Event) => {
      const mouseEvent = e as MouseEvent;
      mouseEvent.stopPropagation();

      this.isResizing = true;
      this.resizeHandle = (mouseEvent.target as HTMLElement).dataset.position || null;
      this.resizeStart = {
        x: mouseEvent.clientX,
        y: mouseEvent.clientY,
        width: this.pipWindow!.offsetWidth,
        height: this.pipWindow!.offsetHeight,
      };

      this.pipWindow!.style.transition = 'none';
    };

    const handleResize = (e: MouseEvent) => {
      if (!this.isResizing || !this.pipWindow || !this.resizeHandle) return;

      const deltaX = e.clientX - this.resizeStart.x;
      const deltaY = e.clientY - this.resizeStart.y;

      let newWidth = this.resizeStart.width;
      let newHeight = this.resizeStart.height;
      let newLeft = this.pipWindow.offsetLeft;
      let newTop = this.pipWindow.offsetTop;

      // 根据手柄位置调整
      if (this.resizeHandle.includes('e')) {
        newWidth = this.resizeStart.width + deltaX;
      }
      if (this.resizeHandle.includes('w')) {
        newWidth = this.resizeStart.width - deltaX;
        newLeft = this.pipWindow.offsetLeft + deltaX;
      }
      if (this.resizeHandle.includes('s')) {
        newHeight = this.resizeStart.height + deltaY;
      }
      if (this.resizeHandle.includes('n')) {
        newHeight = this.resizeStart.height - deltaY;
        newTop = this.pipWindow.offsetTop + deltaY;
      }

      // 限制最小尺寸
      newWidth = Math.max(this.options.minWidth, newWidth);
      newHeight = Math.max(this.options.minHeight, newHeight);

      // 保持 16:9 比例
      const aspectRatio = 16 / 9;
      if (this.resizeHandle.includes('e') || this.resizeHandle.includes('w')) {
        newHeight = newWidth / aspectRatio;
      } else {
        newWidth = newHeight * aspectRatio;
      }

      // 更新尺寸
      this.pipWindow.style.width = `${newWidth}px`;
      this.pipWindow.style.height = `${newHeight}px`;

      // 更新位置（用于 n 和 w 方向）
      if (this.resizeHandle.includes('w') && newWidth > this.options.minWidth) {
        this.pipWindow.style.left = `${newLeft}px`;
      }
      if (this.resizeHandle.includes('n') && newHeight > this.options.minHeight) {
        this.pipWindow.style.top = `${newTop}px`;
      }

      this.state.size = { width: newWidth, height: newHeight };
      this.state.position = { x: this.pipWindow.offsetLeft, y: this.pipWindow.offsetTop };
    };

    const handleResizeEnd = () => {
      if (!this.isResizing) return;

      this.isResizing = false;
      this.resizeHandle = null;

      if (this.pipWindow) {
        this.pipWindow.style.transition = 'box-shadow 0.2s, transform 0.1s';
      }

      this.saveState();
      this.emitEvent('resize');
    };

    handles.forEach(handle => {
      handle.addEventListener('mousedown', handleResizeStart);
    });

    document.addEventListener('mousemove', handleResize);
    document.addEventListener('mouseup', handleResizeEnd);
  }

  /**
   * 绑定页面可见性事件
   */
  private bindVisibilityEvents(): void {
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && this.options.autoEnterOnHidden && !this.state.isActive) {
        this.enter();
      } else if (!document.hidden && this.options.autoExitOnVisible && this.state.isActive) {
        this.exit();
      }
    });
  }

  /**
   * 绑定原生 PiP 事件
   */
  private bindNativePiPEvents(): void {
    this.videoElement.addEventListener('enterpictureinpicture', () => {
      if (this.state.mode !== 'native') {
        this.state.isActive = true;
        this.state.mode = 'native';
        this.emitEvent('enter');
        this.emitEvent('modechange');
      }
    });

    this.videoElement.addEventListener('leavepictureinpicture', () => {
      if (this.state.mode === 'native') {
        this.state.isActive = false;
        this.state.mode = null;
        this.emitEvent('exit');
        this.emitEvent('modechange');
      }
    });
  }

  /**
   * 解析位置
   */
  private resolvePosition(position: PiPPosition): { x: number; y: number } {
    const padding = 20;
    const { innerWidth, innerHeight } = window;
    const { width, height } = this.state.size;

    if (typeof position === 'object' && 'x' in position) {
      return position;
    }

    switch (position) {
      case 'top-left':
        return { x: padding, y: padding };
      case 'top-right':
        return { x: innerWidth - width - padding, y: padding };
      case 'bottom-left':
        return { x: padding, y: innerHeight - height - padding };
      case 'bottom-right':
        return { x: innerWidth - width - padding, y: innerHeight - height - padding };
      case 'center':
        return {
          x: (innerWidth - width) / 2,
          y: (innerHeight - height) / 2,
        };
      default:
        return { x: innerWidth - width - padding, y: innerHeight - height - padding };
    }
  }

  /**
   * 保存状态
   */
  private saveState(): void {
    if (!this.options.rememberPosition && !this.options.rememberSize) return;

    const stateToSave: Partial<PiPState> = {};

    if (this.options.rememberPosition) {
      stateToSave.position = this.state.position;
    }
    if (this.options.rememberSize) {
      stateToSave.size = this.state.size;
    }

    try {
      localStorage.setItem(this.options.storageKey, JSON.stringify(stateToSave));
    } catch {
      // 忽略存储错误
    }
  }

  /**
   * 恢复状态
   */
  private restoreState(): void {
    try {
      const saved = localStorage.getItem(this.options.storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (this.options.rememberPosition && parsed.position) {
          this.state.position = parsed.position;
        }
        if (this.options.rememberSize && parsed.size) {
          this.state.size = parsed.size;
        }
      }
    } catch {
      // 使用默认值
    }

    // 确保有默认值
    if (!this.state.size.width) {
      this.state.size = {
        width: this.options.defaultWidth,
        height: this.options.defaultHeight,
      };
    }
  }

  /**
   * 发送事件
   */
  private emitEvent(type: PiPEventType): void {
    const detail: PiPEventDetail = {
      type,
      state: { ...this.state },
    };
    this.eventTarget.dispatchEvent(new CustomEvent(type, { detail }));
  }

  /**
   * 销毁
   */
  destroy(): void {
    this.exit();
    this.boundHandlers.clear();
    this.pipWindowEventListeners.clear();
  }
}

/**
 * 画中画按钮组件
 */
export function createPiPButton(pip: PictureInPicture): HTMLButtonElement {
  const button = document.createElement('button');
  button.className = 'ldesign-pip-button';
  button.title = '画中画';
  button.innerHTML = `
    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
      <path d="M19 7h-8v6h8V7zm2-4H3c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H3V5h18v14z"/>
    </svg>
  `;
  button.style.cssText = `
    background: transparent;
    border: none;
    color: white;
    padding: 8px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0.8;
    transition: opacity 0.2s;
  `;

  button.addEventListener('mouseenter', () => {
    button.style.opacity = '1';
  });
  button.addEventListener('mouseleave', () => {
    button.style.opacity = '0.8';
  });

  button.addEventListener('click', () => {
    pip.toggle();
  });

  // 更新状态
  pip.on('enter', () => {
    button.title = '退出画中画';
    button.style.color = '#6366f1';
  });

  pip.on('exit', () => {
    button.title = '画中画';
    button.style.color = 'white';
  });

  return button;
}
