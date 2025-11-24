/**
 * 迷你播放器功能
 * 浮动小窗口播放，支持拖拽、调整大小、吸附边缘
 */

import type { IPlayer } from '../types/player';

export interface MiniPlayerOptions {
  width?: number;
  height?: number;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  draggable?: boolean;
  resizable?: boolean;
  snapToEdge?: boolean;
  snapDistance?: number;
  minWidth?: number;
  minHeight?: number;
  zIndex?: number;
}

export class MiniPlayer {
  private player: IPlayer;
  private container: HTMLElement;
  private miniWindow: HTMLDivElement | null = null;
  private videoElement: HTMLVideoElement | null = null;

  // 配置
  private width = 320;
  private height = 180;
  private position: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left' = 'bottom-right';
  private draggable = true;
  private resizable = true;
  private snapToEdge = true;
  private snapDistance = 20;
  private minWidth = 240;
  private minHeight = 135;
  private zIndex = 9999;

  // 拖拽状态
  private isDragging = false;
  private dragOffsetX = 0;
  private dragOffsetY = 0;

  // 调整大小状态
  private isResizing = false;
  private resizeHandle: string | null = null;
  private resizeStartX = 0;
  private resizeStartY = 0;
  private resizeStartWidth = 0;
  private resizeStartHeight = 0;

  // 激活状态
  private isActive = false;

  constructor(player: IPlayer, container: HTMLElement, options: MiniPlayerOptions = {}) {
    this.player = player;
    this.container = container;

    // 应用配置
    if (options.width) this.width = options.width;
    if (options.height) this.height = options.height;
    if (options.position) this.position = options.position;
    if (options.draggable !== undefined) this.draggable = options.draggable;
    if (options.resizable !== undefined) this.resizable = options.resizable;
    if (options.snapToEdge !== undefined) this.snapToEdge = options.snapToEdge;
    if (options.snapDistance !== undefined) this.snapDistance = options.snapDistance;
    if (options.minWidth) this.minWidth = options.minWidth;
    if (options.minHeight) this.minHeight = options.minHeight;
    if (options.zIndex) this.zIndex = options.zIndex;
  }

  /**
   * 激活迷你播放器
   */
  activate(): void {
    if (this.isActive) return;

    // 创建迷你窗口
    this.createMiniWindow();

    // 移动视频元素到迷你窗口
    this.moveVideoToMini();

    // 设置位置
    this.setInitialPosition();

    // 绑定事件
    this.bindEvents();

    this.isActive = true;
  }

  /**
   * 停用迷你播放器
   */
  deactivate(): void {
    if (!this.isActive) return;

    // 移动视频元素回原容器
    this.moveVideoBack();

    // 移除迷你窗口
    if (this.miniWindow) {
      this.miniWindow.remove();
      this.miniWindow = null;
    }

    this.isActive = false;
  }

  /**
   * 切换激活状态
   */
  toggle(): void {
    if (this.isActive) {
      this.deactivate();
    } else {
      this.activate();
    }
  }

  /**
   * 是否激活
   */
  isActivated(): boolean {
    return this.isActive;
  }

  /**
   * 创建迷你窗口
   */
  private createMiniWindow(): void {
    this.miniWindow = document.createElement('div');
    this.miniWindow.className = 'ldesign-mini-player';
    this.miniWindow.style.cssText = `
      position: fixed;
      width: ${this.width}px;
      height: ${this.height}px;
      background: #000;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      overflow: hidden;
      z-index: ${this.zIndex};
      cursor: ${this.draggable ? 'move' : 'default'};
      transition: box-shadow 0.2s;
    `;

    // 添加控制栏
    this.createControlBar();

    // 添加调整大小手柄
    if (this.resizable) {
      this.createResizeHandles();
    }

    document.body.appendChild(this.miniWindow);
  }

  /**
   * 创建控制栏
   */
  private createControlBar(): void {
    if (!this.miniWindow) return;

    const controlBar = document.createElement('div');
    controlBar.className = 'mini-player-controls';
    controlBar.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 32px;
      background: linear-gradient(to bottom, rgba(0,0,0,0.6), transparent);
      display: flex;
      align-items: center;
      justify-content: flex-end;
      padding: 0 8px;
      opacity: 0;
      transition: opacity 0.2s;
      z-index: 1;
    `;

    // 关闭按钮
    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = '✕';
    closeBtn.style.cssText = `
      background: rgba(255, 255, 255, 0.2);
      border: none;
      color: white;
      width: 24px;
      height: 24px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
    `;
    closeBtn.onclick = () => this.deactivate();

    controlBar.appendChild(closeBtn);
    this.miniWindow.appendChild(controlBar);

    // 鼠标悬停显示控制栏
    this.miniWindow.addEventListener('mouseenter', () => {
      controlBar.style.opacity = '1';
    });
    this.miniWindow.addEventListener('mouseleave', () => {
      controlBar.style.opacity = '0';
    });
  }

  /**
   * 创建调整大小手柄
   */
  private createResizeHandles(): void {
    if (!this.miniWindow) return;

    const handles = ['se', 'sw', 'ne', 'nw'];

    handles.forEach(position => {
      const handle = document.createElement('div');
      handle.className = `resize-handle resize-${position}`;
      handle.dataset.position = position;

      const styles: Record<string, string> = {
        position: 'absolute',
        width: '10px',
        height: '10px',
        zIndex: '2',
      };

      // 设置位置
      if (position.includes('n')) styles.top = '0';
      if (position.includes('s')) styles.bottom = '0';
      if (position.includes('w')) styles.left = '0';
      if (position.includes('e')) styles.right = '0';

      // 设置光标
      const cursors: Record<string, string> = {
        'se': 'nwse-resize',
        'sw': 'nesw-resize',
        'ne': 'nesw-resize',
        'nw': 'nwse-resize',
      };
      styles.cursor = cursors[position];

      handle.style.cssText = Object.entries(styles)
        .map(([k, v]) => `${k}: ${v}`)
        .join('; ');

      this.miniWindow!.appendChild(handle);
    });
  }

  /**
   * 移动视频到迷你窗口
   */
  private moveVideoToMini(): void {
    this.videoElement = this.container.querySelector('video');
    if (this.videoElement && this.miniWindow) {
      this.miniWindow.appendChild(this.videoElement);
      this.videoElement.style.cssText = `
        width: 100%;
        height: 100%;
        object-fit: contain;
      `;
    }
  }

  /**
   * 移动视频回原容器
   */
  private moveVideoBack(): void {
    if (this.videoElement) {
      this.container.appendChild(this.videoElement);
      this.videoElement.style.cssText = '';
    }
  }

  /**
   * 设置初始位置
   */
  private setInitialPosition(): void {
    if (!this.miniWindow) return;

    const padding = 20;

    switch (this.position) {
      case 'bottom-right':
        this.miniWindow.style.right = `${padding}px`;
        this.miniWindow.style.bottom = `${padding}px`;
        break;
      case 'bottom-left':
        this.miniWindow.style.left = `${padding}px`;
        this.miniWindow.style.bottom = `${padding}px`;
        break;
      case 'top-right':
        this.miniWindow.style.right = `${padding}px`;
        this.miniWindow.style.top = `${padding}px`;
        break;
      case 'top-left':
        this.miniWindow.style.left = `${padding}px`;
        this.miniWindow.style.top = `${padding}px`;
        break;
    }
  }

  /**
   * 绑定事件
   */
  private bindEvents(): void {
    if (!this.miniWindow) return;

    // 拖拽事件
    if (this.draggable) {
      this.miniWindow.addEventListener('mousedown', this.handleDragStart.bind(this));
    }

    // 调整大小事件
    if (this.resizable) {
      const handles = this.miniWindow.querySelectorAll('.resize-handle');
      handles.forEach(handle => {
        handle.addEventListener('mousedown', this.handleResizeStart.bind(this));
      });
    }

    // 全局事件
    document.addEventListener('mousemove', this.handleMouseMove.bind(this));
    document.addEventListener('mouseup', this.handleMouseUp.bind(this));
  }

  /**
   * 开始拖拽
   */
  private handleDragStart(e: MouseEvent): void {
    // 如果点击的是调整大小手柄，不开始拖拽
    if ((e.target as HTMLElement).classList.contains('resize-handle')) {
      return;
    }

    this.isDragging = true;
    this.dragOffsetX = e.clientX - this.miniWindow!.offsetLeft;
    this.dragOffsetY = e.clientY - this.miniWindow!.offsetTop;
    this.miniWindow!.style.cursor = 'grabbing';
  }

  /**
   * 开始调整大小
   */
  private handleResizeStart(e: MouseEvent): void {
    e.stopPropagation();
    this.isResizing = true;
    this.resizeHandle = (e.target as HTMLElement).dataset.position || null;
    this.resizeStartX = e.clientX;
    this.resizeStartY = e.clientY;
    this.resizeStartWidth = this.miniWindow!.offsetWidth;
    this.resizeStartHeight = this.miniWindow!.offsetHeight;
  }

  /**
   * 鼠标移动
   */
  private handleMouseMove(e: MouseEvent): void {
    if (this.isDragging) {
      this.handleDrag(e);
    } else if (this.isResizing) {
      this.handleResize(e);
    }
  }

  /**
   * 处理拖拽
   */
  private handleDrag(e: MouseEvent): void {
    if (!this.miniWindow) return;

    let x = e.clientX - this.dragOffsetX;
    let y = e.clientY - this.dragOffsetY;

    // 边界限制
    x = Math.max(0, Math.min(x, window.innerWidth - this.miniWindow.offsetWidth));
    y = Math.max(0, Math.min(y, window.innerHeight - this.miniWindow.offsetHeight));

    // 吸附边缘
    if (this.snapToEdge) {
      if (x < this.snapDistance) x = 0;
      if (y < this.snapDistance) y = 0;
      if (window.innerWidth - x - this.miniWindow.offsetWidth < this.snapDistance) {
        x = window.innerWidth - this.miniWindow.offsetWidth;
      }
      if (window.innerHeight - y - this.miniWindow.offsetHeight < this.snapDistance) {
        y = window.innerHeight - this.miniWindow.offsetHeight;
      }
    }

    this.miniWindow.style.left = `${x}px`;
    this.miniWindow.style.top = `${y}px`;
    this.miniWindow.style.right = 'auto';
    this.miniWindow.style.bottom = 'auto';
  }

  /**
   * 处理调整大小
   */
  private handleResize(e: MouseEvent): void {
    if (!this.miniWindow || !this.resizeHandle) return;

    const deltaX = e.clientX - this.resizeStartX;
    const deltaY = e.clientY - this.resizeStartY;

    let newWidth = this.resizeStartWidth;
    let newHeight = this.resizeStartHeight;

    // 根据手柄位置计算新尺寸
    if (this.resizeHandle.includes('e')) {
      newWidth = this.resizeStartWidth + deltaX;
    }
    if (this.resizeHandle.includes('w')) {
      newWidth = this.resizeStartWidth - deltaX;
    }
    if (this.resizeHandle.includes('s')) {
      newHeight = this.resizeStartHeight + deltaY;
    }
    if (this.resizeHandle.includes('n')) {
      newHeight = this.resizeStartHeight - deltaY;
    }

    // 限制最小尺寸
    newWidth = Math.max(this.minWidth, newWidth);
    newHeight = Math.max(this.minHeight, newHeight);

    // 保持比例 (16:9)
    const aspectRatio = 16 / 9;
    if (Math.abs(newWidth / newHeight - aspectRatio) > 0.1) {
      newHeight = newWidth / aspectRatio;
    }

    this.miniWindow.style.width = `${newWidth}px`;
    this.miniWindow.style.height = `${newHeight}px`;
  }

  /**
   * 鼠标释放
   */
  private handleMouseUp(): void {
    if (this.isDragging) {
      this.isDragging = false;
      if (this.miniWindow) {
        this.miniWindow.style.cursor = this.draggable ? 'move' : 'default';
      }
    }
    if (this.isResizing) {
      this.isResizing = false;
      this.resizeHandle = null;
    }
  }

  /**
   * 销毁
   */
  destroy(): void {
    this.deactivate();
  }
}
