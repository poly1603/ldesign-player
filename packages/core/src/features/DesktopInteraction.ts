/**
 * PC 端交互增强
 * 支持鼠标滚轮调节音量、双击全屏、自定义右键菜单等
 */

export interface ContextMenuItem {
  id: string;
  label: string;
  icon?: string;
  shortcut?: string;
  disabled?: boolean;
  divider?: boolean;
  handler?: () => void;
  submenu?: ContextMenuItem[];
}

export interface DesktopInteractionOptions {
  /** 容器元素 */
  container: HTMLElement;
  /** 是否启用鼠标滚轮调节音量 */
  enableWheelVolume?: boolean;
  /** 是否启用双击全屏 */
  enableDoubleClickFullscreen?: boolean;
  /** 是否启用自定义右键菜单 */
  enableContextMenu?: boolean;
  /** 右键菜单项 */
  contextMenuItems?: ContextMenuItem[];
  /** 滚轮音量调节步长 (0-1) */
  volumeStep?: number;
  /** 双击检测延迟 (ms) */
  doubleClickDelay?: number;
  /** 音量变化回调 */
  onVolumeChange?: (volume: number) => void;
  /** 全屏切换回调 */
  onToggleFullscreen?: () => void;
  /** 获取当前音量 */
  getVolume?: () => number;
  /** 设置音量 */
  setVolume?: (volume: number) => void;
  /** 获取是否全屏 */
  isFullscreen?: () => boolean;
  /** 切换全屏 */
  toggleFullscreen?: () => void;
}

export class DesktopInteraction {
  private container: HTMLElement;
  private enableWheelVolume: boolean;
  private enableDoubleClickFullscreen: boolean;
  private enableContextMenu: boolean;
  private contextMenuItems: ContextMenuItem[];
  private volumeStep: number;
  private doubleClickDelay: number;
  private onVolumeChange?: (volume: number) => void;
  private onToggleFullscreen?: () => void;
  private getVolume: () => number;
  private setVolume: (volume: number) => void;
  private isFullscreen: () => boolean;
  private toggleFullscreen: () => void;

  private contextMenuElement: HTMLElement | null = null;
  private lastClickTime = 0;
  private clickTimer: number | null = null;
  private volumeIndicator: HTMLElement | null = null;
  private volumeIndicatorTimer: number | null = null;

  // 绑定的事件处理器
  private boundHandlers: Map<string, EventListener> = new Map();

  constructor(options: DesktopInteractionOptions) {
    this.container = options.container;
    this.enableWheelVolume = options.enableWheelVolume ?? true;
    this.enableDoubleClickFullscreen = options.enableDoubleClickFullscreen ?? true;
    this.enableContextMenu = options.enableContextMenu ?? true;
    this.contextMenuItems = options.contextMenuItems || [];
    this.volumeStep = options.volumeStep ?? 0.05;
    this.doubleClickDelay = options.doubleClickDelay ?? 300;
    this.onVolumeChange = options.onVolumeChange;
    this.onToggleFullscreen = options.onToggleFullscreen;
    this.getVolume = options.getVolume || (() => 1);
    this.setVolume = options.setVolume || (() => {});
    this.isFullscreen = options.isFullscreen || (() => false);
    this.toggleFullscreen = options.toggleFullscreen || (() => {});

    this.init();
  }

  private init(): void {
    // 鼠标滚轮
    if (this.enableWheelVolume) {
      this.setupWheelVolume();
      this.createVolumeIndicator();
    }

    // 双击全屏
    if (this.enableDoubleClickFullscreen) {
      this.setupDoubleClickFullscreen();
    }

    // 右键菜单
    if (this.enableContextMenu) {
      this.setupContextMenu();
    }
  }

  /**
   * 设置鼠标滚轮音量控制
   */
  private setupWheelVolume(): void {
    const handleWheel = (e: WheelEvent) => {
      // 只在播放器容器上响应
      if (!this.container.contains(e.target as Node)) return;
      
      e.preventDefault();
      
      const currentVolume = this.getVolume();
      const delta = e.deltaY > 0 ? -this.volumeStep : this.volumeStep;
      const newVolume = Math.max(0, Math.min(1, currentVolume + delta));
      
      this.setVolume(newVolume);
      this.showVolumeIndicator(newVolume);
      
      if (this.onVolumeChange) {
        this.onVolumeChange(newVolume);
      }
    };

    this.boundHandlers.set('wheel', handleWheel as EventListener);
    this.container.addEventListener('wheel', handleWheel, { passive: false });
  }

  /**
   * 设置双击全屏
   */
  private setupDoubleClickFullscreen(): void {
    const handleClick = (e: MouseEvent) => {
      // 忽略控制栏上的点击
      const target = e.target as HTMLElement;
      if (target.closest('.custom-controls') || target.closest('.cap__main-row')) {
        return;
      }

      const now = Date.now();
      
      if (now - this.lastClickTime < this.doubleClickDelay) {
        // 双击
        if (this.clickTimer) {
          clearTimeout(this.clickTimer);
          this.clickTimer = null;
        }
        this.toggleFullscreen();
        if (this.onToggleFullscreen) {
          this.onToggleFullscreen();
        }
        this.lastClickTime = 0;
      } else {
        this.lastClickTime = now;
        // 设置定时器，防止单击和双击冲突
        this.clickTimer = window.setTimeout(() => {
          this.clickTimer = null;
        }, this.doubleClickDelay);
      }
    };

    this.boundHandlers.set('click', handleClick as EventListener);
    this.container.addEventListener('click', handleClick);
  }

  /**
   * 设置右键菜单
   */
  private setupContextMenu(): void {
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      this.showContextMenu(e.clientX, e.clientY);
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (this.contextMenuElement && !this.contextMenuElement.contains(e.target as Node)) {
        this.hideContextMenu();
      }
    };

    this.boundHandlers.set('contextmenu', handleContextMenu as EventListener);
    this.boundHandlers.set('documentClick', handleClickOutside as EventListener);
    
    this.container.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('click', handleClickOutside);
  }

  /**
   * 创建音量指示器
   */
  private createVolumeIndicator(): void {
    this.volumeIndicator = document.createElement('div');
    this.volumeIndicator.className = 'desktop-volume-indicator';
    this.volumeIndicator.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(0, 0, 0, 0.8);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      color: white;
      padding: 16px 24px;
      border-radius: 12px;
      font-size: 16px;
      font-weight: 500;
      display: none;
      z-index: 1000;
      pointer-events: none;
      transition: opacity 0.2s;
    `;
    this.container.appendChild(this.volumeIndicator);
  }

  /**
   * 显示音量指示器
   */
  private showVolumeIndicator(volume: number): void {
    if (!this.volumeIndicator) return;

    const volumePercent = Math.round(volume * 100);
    const icon = volume === 0 ? '🔇' : volume < 0.3 ? '🔈' : volume < 0.7 ? '🔉' : '🔊';

    this.volumeIndicator.innerHTML = `
      <div style="display: flex; align-items: center; gap: 12px;">
        <span style="font-size: 24px;">${icon}</span>
        <div>
          <div style="width: 100px; height: 4px; background: rgba(255,255,255,0.3); border-radius: 2px;">
            <div style="width: ${volumePercent}%; height: 100%; background: white; border-radius: 2px; transition: width 0.1s;"></div>
          </div>
          <div style="margin-top: 4px; text-align: center; font-size: 12px;">${volumePercent}%</div>
        </div>
      </div>
    `;
    this.volumeIndicator.style.display = 'block';
    this.volumeIndicator.style.opacity = '1';

    // 自动隐藏
    if (this.volumeIndicatorTimer) {
      clearTimeout(this.volumeIndicatorTimer);
    }
    this.volumeIndicatorTimer = window.setTimeout(() => {
      if (this.volumeIndicator) {
        this.volumeIndicator.style.opacity = '0';
        setTimeout(() => {
          if (this.volumeIndicator) {
            this.volumeIndicator.style.display = 'none';
          }
        }, 200);
      }
    }, 1000);
  }

  /**
   * 显示右键菜单
   */
  private showContextMenu(x: number, y: number): void {
    this.hideContextMenu();

    if (this.contextMenuItems.length === 0) {
      // 如果没有自定义菜单项，使用默认菜单
      this.contextMenuItems = this.getDefaultMenuItems();
    }

    this.contextMenuElement = document.createElement('div');
    this.contextMenuElement.className = 'desktop-context-menu';
    this.contextMenuElement.style.cssText = `
      position: fixed;
      left: ${x}px;
      top: ${y}px;
      background: rgba(30, 30, 30, 0.95);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border-radius: 8px;
      padding: 6px 0;
      min-width: 180px;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.4);
      z-index: 10000;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      font-size: 13px;
      animation: contextMenuFadeIn 0.15s ease;
    `;

    // 添加动画样式
    const style = document.createElement('style');
    style.textContent = `
      @keyframes contextMenuFadeIn {
        from { opacity: 0; transform: scale(0.95); }
        to { opacity: 1; transform: scale(1); }
      }
      .context-menu-item {
        padding: 8px 16px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: space-between;
        color: #fff;
        transition: background 0.1s;
      }
      .context-menu-item:hover {
        background: rgba(255, 255, 255, 0.1);
      }
      .context-menu-item.disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
      .context-menu-divider {
        height: 1px;
        background: rgba(255, 255, 255, 0.1);
        margin: 6px 0;
      }
      .context-menu-shortcut {
        color: rgba(255, 255, 255, 0.5);
        font-size: 12px;
        margin-left: 20px;
      }
    `;
    this.contextMenuElement.appendChild(style);

    // 渲染菜单项
    this.contextMenuItems.forEach(item => {
      if (item.divider) {
        const divider = document.createElement('div');
        divider.className = 'context-menu-divider';
        this.contextMenuElement!.appendChild(divider);
        return;
      }

      const menuItem = document.createElement('div');
      menuItem.className = `context-menu-item${item.disabled ? ' disabled' : ''}`;
      menuItem.innerHTML = `
        <span>${item.icon ? item.icon + ' ' : ''}${item.label}</span>
        ${item.shortcut ? `<span class="context-menu-shortcut">${item.shortcut}</span>` : ''}
      `;

      if (!item.disabled && item.handler) {
        menuItem.addEventListener('click', () => {
          item.handler!();
          this.hideContextMenu();
        });
      }

      this.contextMenuElement!.appendChild(menuItem);
    });

    document.body.appendChild(this.contextMenuElement);

    // 确保菜单在视口内
    const rect = this.contextMenuElement.getBoundingClientRect();
    if (rect.right > window.innerWidth) {
      this.contextMenuElement.style.left = `${x - rect.width}px`;
    }
    if (rect.bottom > window.innerHeight) {
      this.contextMenuElement.style.top = `${y - rect.height}px`;
    }
  }

  /**
   * 隐藏右键菜单
   */
  private hideContextMenu(): void {
    if (this.contextMenuElement) {
      this.contextMenuElement.remove();
      this.contextMenuElement = null;
    }
  }

  /**
   * 获取默认菜单项
   */
  private getDefaultMenuItems(): ContextMenuItem[] {
    return [
      {
        id: 'playPause',
        label: '播放/暂停',
        shortcut: 'Space',
        handler: () => {
          // 需要外部实现
        },
      },
      {
        id: 'mute',
        label: '静音/取消静音',
        shortcut: 'M',
        handler: () => {
          // 需要外部实现
        },
      },
      { id: 'divider1', label: '', divider: true },
      {
        id: 'fullscreen',
        label: this.isFullscreen() ? '退出全屏' : '全屏',
        shortcut: 'F',
        handler: () => {
          this.toggleFullscreen();
        },
      },
      {
        id: 'pip',
        label: '画中画',
        shortcut: 'P',
        handler: () => {
          // 需要外部实现
        },
      },
      { id: 'divider2', label: '', divider: true },
      {
        id: 'speed',
        label: '播放速度',
        submenu: [
          { id: 'speed-0.5', label: '0.5x', handler: () => {} },
          { id: 'speed-1', label: '1x', handler: () => {} },
          { id: 'speed-1.5', label: '1.5x', handler: () => {} },
          { id: 'speed-2', label: '2x', handler: () => {} },
        ],
      },
      {
        id: 'loop',
        label: '循环播放',
        handler: () => {
          // 需要外部实现
        },
      },
    ];
  }

  /**
   * 设置右键菜单项
   */
  public setContextMenuItems(items: ContextMenuItem[]): void {
    this.contextMenuItems = items;
  }

  /**
   * 添加右键菜单项
   */
  public addContextMenuItem(item: ContextMenuItem, index?: number): void {
    if (index !== undefined) {
      this.contextMenuItems.splice(index, 0, item);
    } else {
      this.contextMenuItems.push(item);
    }
  }

  /**
   * 移除右键菜单项
   */
  public removeContextMenuItem(id: string): void {
    const index = this.contextMenuItems.findIndex(item => item.id === id);
    if (index !== -1) {
      this.contextMenuItems.splice(index, 1);
    }
  }

  /**
   * 启用/禁用功能
   */
  public setEnabled(options: {
    wheelVolume?: boolean;
    doubleClickFullscreen?: boolean;
    contextMenu?: boolean;
  }): void {
    if (options.wheelVolume !== undefined) {
      this.enableWheelVolume = options.wheelVolume;
    }
    if (options.doubleClickFullscreen !== undefined) {
      this.enableDoubleClickFullscreen = options.doubleClickFullscreen;
    }
    if (options.contextMenu !== undefined) {
      this.enableContextMenu = options.contextMenu;
    }
  }

  /**
   * 销毁
   */
  public destroy(): void {
    // 移除事件监听
    const wheelHandler = this.boundHandlers.get('wheel');
    if (wheelHandler) {
      this.container.removeEventListener('wheel', wheelHandler);
    }

    const clickHandler = this.boundHandlers.get('click');
    if (clickHandler) {
      this.container.removeEventListener('click', clickHandler);
    }

    const contextMenuHandler = this.boundHandlers.get('contextmenu');
    if (contextMenuHandler) {
      this.container.removeEventListener('contextmenu', contextMenuHandler);
    }

    const documentClickHandler = this.boundHandlers.get('documentClick');
    if (documentClickHandler) {
      document.removeEventListener('click', documentClickHandler);
    }

    this.boundHandlers.clear();

    // 清理 UI
    this.hideContextMenu();
    this.volumeIndicator?.remove();

    if (this.clickTimer) {
      clearTimeout(this.clickTimer);
    }
    if (this.volumeIndicatorTimer) {
      clearTimeout(this.volumeIndicatorTimer);
    }
  }
}

/**
 * 创建 PC 端交互增强的便捷函数
 */
export function createDesktopInteraction(
  container: HTMLElement,
  options?: Partial<Omit<DesktopInteractionOptions, 'container'>>
): DesktopInteraction {
  return new DesktopInteraction({
    container,
    ...options,
  });
}
