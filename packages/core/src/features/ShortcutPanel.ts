/**
 * 快捷键帮助面板组件
 * 显示可用的键盘快捷键
 */

export interface ShortcutInfo {
  /** 快捷键名称 */
  name: string;
  /** 按键组合 */
  keys: string[];
  /** 描述 */
  description: string;
  /** 分组 */
  category?: string;
  /** 是否需要修饰键 */
  modifiers?: {
    ctrl?: boolean;
    shift?: boolean;
    alt?: boolean;
  };
}

export interface ShortcutPanelOptions {
  /** 容器元素 */
  container: HTMLElement;
  /** 快捷键列表 */
  shortcuts: ShortcutInfo[];
  /** 触发键 (默认 '?') */
  triggerKey?: string;
  /** 是否在按住 Shift 时显示 (默认 true) */
  requireShift?: boolean;
  /** 主题 */
  theme?: 'light' | 'dark' | 'auto';
  /** 标题 */
  title?: string;
  /** 是否显示搜索框 */
  showSearch?: boolean;
  /** 动画时长 (ms) */
  animationDuration?: number;
  /** 自定义样式类名 */
  className?: string;
}

export class ShortcutPanel {
  private container: HTMLElement;
  private shortcuts: ShortcutInfo[];
  private triggerKey: string;
  private requireShift: boolean;
  private theme: 'light' | 'dark' | 'auto';
  private title: string;
  private showSearch: boolean;
  private animationDuration: number;
  private className?: string;

  private panelElement: HTMLElement | null = null;
  private searchInput: HTMLInputElement | null = null;
  private isVisible = false;
  private boundKeyHandler: (e: KeyboardEvent) => void;
  private filteredShortcuts: ShortcutInfo[] = [];

  constructor(options: ShortcutPanelOptions) {
    this.container = options.container;
    this.shortcuts = options.shortcuts;
    this.triggerKey = options.triggerKey ?? '?';
    this.requireShift = options.requireShift ?? true;
    this.theme = options.theme ?? 'auto';
    this.title = options.title ?? '键盘快捷键';
    this.showSearch = options.showSearch ?? true;
    this.animationDuration = options.animationDuration ?? 200;
    this.className = options.className;

    this.filteredShortcuts = [...this.shortcuts];
    this.boundKeyHandler = this.handleKeyDown.bind(this);

    this.init();
  }

  private init(): void {
    // 监听键盘事件
    document.addEventListener('keydown', this.boundKeyHandler);

    // 添加样式
    this.injectStyles();
  }

  /**
   * 注入样式
   */
  private injectStyles(): void {
    const styleId = 'shortcut-panel-styles';
    if (document.getElementById(styleId)) return;

    const styles = document.createElement('style');
    styles.id = styleId;
    styles.textContent = `
      .shortcut-panel-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.6);
        backdrop-filter: blur(4px);
        -webkit-backdrop-filter: blur(4px);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        opacity: 0;
        transition: opacity var(--sp-duration) ease;
        pointer-events: none;
      }

      .shortcut-panel-overlay.visible {
        opacity: 1;
        pointer-events: auto;
      }

      .shortcut-panel {
        background: var(--sp-bg);
        color: var(--sp-text);
        border-radius: 16px;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        max-width: 600px;
        width: 90%;
        max-height: 80vh;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        transform: scale(0.95) translateY(20px);
        transition: transform var(--sp-duration) cubic-bezier(0.4, 0, 0.2, 1);
      }

      .shortcut-panel-overlay.visible .shortcut-panel {
        transform: scale(1) translateY(0);
      }

      .shortcut-panel-header {
        padding: 20px 24px;
        border-bottom: 1px solid var(--sp-border);
        display: flex;
        align-items: center;
        justify-content: space-between;
        flex-shrink: 0;
      }

      .shortcut-panel-title {
        font-size: 18px;
        font-weight: 600;
        margin: 0;
      }

      .shortcut-panel-close {
        width: 32px;
        height: 32px;
        border: none;
        background: var(--sp-hover);
        border-radius: 8px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--sp-text-secondary);
        transition: all 0.15s;
      }

      .shortcut-panel-close:hover {
        background: var(--sp-border);
        color: var(--sp-text);
      }

      .shortcut-panel-search {
        padding: 12px 24px;
        border-bottom: 1px solid var(--sp-border);
        flex-shrink: 0;
      }

      .shortcut-panel-search input {
        width: 100%;
        padding: 10px 16px;
        border: 1px solid var(--sp-border);
        border-radius: 8px;
        background: var(--sp-input-bg);
        color: var(--sp-text);
        font-size: 14px;
        outline: none;
        transition: border-color 0.15s;
      }

      .shortcut-panel-search input:focus {
        border-color: var(--sp-accent);
      }

      .shortcut-panel-search input::placeholder {
        color: var(--sp-text-secondary);
      }

      .shortcut-panel-content {
        padding: 16px 24px;
        overflow-y: auto;
        flex: 1;
      }

      .shortcut-category {
        margin-bottom: 20px;
      }

      .shortcut-category:last-child {
        margin-bottom: 0;
      }

      .shortcut-category-title {
        font-size: 12px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        color: var(--sp-text-secondary);
        margin-bottom: 12px;
      }

      .shortcut-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 10px 12px;
        border-radius: 8px;
        transition: background 0.15s;
      }

      .shortcut-item:hover {
        background: var(--sp-hover);
      }

      .shortcut-description {
        font-size: 14px;
        color: var(--sp-text);
      }

      .shortcut-keys {
        display: flex;
        gap: 6px;
        align-items: center;
      }

      .shortcut-key {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 28px;
        height: 28px;
        padding: 0 8px;
        background: var(--sp-key-bg);
        border: 1px solid var(--sp-key-border);
        border-radius: 6px;
        font-size: 12px;
        font-weight: 500;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', monospace;
        box-shadow: 0 2px 0 var(--sp-key-shadow);
      }

      .shortcut-plus {
        color: var(--sp-text-secondary);
        font-size: 12px;
      }

      .shortcut-panel-footer {
        padding: 12px 24px;
        border-top: 1px solid var(--sp-border);
        font-size: 12px;
        color: var(--sp-text-secondary);
        text-align: center;
        flex-shrink: 0;
      }

      .shortcut-panel-empty {
        text-align: center;
        padding: 40px 20px;
        color: var(--sp-text-secondary);
      }

      /* Light theme */
      .shortcut-panel-overlay.theme-light {
        --sp-bg: #ffffff;
        --sp-text: #1a1a1a;
        --sp-text-secondary: #666666;
        --sp-border: #e5e5e5;
        --sp-hover: #f5f5f5;
        --sp-input-bg: #ffffff;
        --sp-accent: #0066cc;
        --sp-key-bg: #f0f0f0;
        --sp-key-border: #d0d0d0;
        --sp-key-shadow: #c0c0c0;
      }

      /* Dark theme */
      .shortcut-panel-overlay.theme-dark {
        --sp-bg: #1e1e2e;
        --sp-text: #cdd6f4;
        --sp-text-secondary: #a6adc8;
        --sp-border: #313244;
        --sp-hover: #313244;
        --sp-input-bg: #11111b;
        --sp-accent: #89b4fa;
        --sp-key-bg: #313244;
        --sp-key-border: #45475a;
        --sp-key-shadow: #181825;
      }

      @media (prefers-color-scheme: dark) {
        .shortcut-panel-overlay.theme-auto {
          --sp-bg: #1e1e2e;
          --sp-text: #cdd6f4;
          --sp-text-secondary: #a6adc8;
          --sp-border: #313244;
          --sp-hover: #313244;
          --sp-input-bg: #11111b;
          --sp-accent: #89b4fa;
          --sp-key-bg: #313244;
          --sp-key-border: #45475a;
          --sp-key-shadow: #181825;
        }
      }

      @media (prefers-color-scheme: light) {
        .shortcut-panel-overlay.theme-auto {
          --sp-bg: #ffffff;
          --sp-text: #1a1a1a;
          --sp-text-secondary: #666666;
          --sp-border: #e5e5e5;
          --sp-hover: #f5f5f5;
          --sp-input-bg: #ffffff;
          --sp-accent: #0066cc;
          --sp-key-bg: #f0f0f0;
          --sp-key-border: #d0d0d0;
          --sp-key-shadow: #c0c0c0;
        }
      }

      @media (max-width: 480px) {
        .shortcut-panel {
          width: 95%;
          max-height: 90vh;
          border-radius: 12px;
        }

        .shortcut-panel-header {
          padding: 16px;
        }

        .shortcut-panel-content {
          padding: 12px 16px;
        }

        .shortcut-item {
          flex-direction: column;
          align-items: flex-start;
          gap: 8px;
        }
      }
    `;

    document.head.appendChild(styles);
  }

  /**
   * 处理键盘事件
   */
  private handleKeyDown(e: KeyboardEvent): void {
    // 检查触发键
    if (e.key === this.triggerKey || (this.requireShift && e.shiftKey && e.key === '/')) {
      // 忽略输入框中的按键
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      e.preventDefault();
      this.toggle();
      return;
    }

    // Escape 关闭
    if (e.key === 'Escape' && this.isVisible) {
      this.hide();
      return;
    }
  }

  /**
   * 创建面板 DOM
   */
  private createPanel(): void {
    if (this.panelElement) return;

    const overlay = document.createElement('div');
    overlay.className = `shortcut-panel-overlay theme-${this.theme} ${this.className || ''}`;
    overlay.style.setProperty('--sp-duration', `${this.animationDuration}ms`);

    overlay.innerHTML = `
      <div class="shortcut-panel">
        <div class="shortcut-panel-header">
          <h2 class="shortcut-panel-title">${this.title}</h2>
          <button class="shortcut-panel-close" aria-label="关闭">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>
        ${this.showSearch ? `
          <div class="shortcut-panel-search">
            <input type="text" placeholder="搜索快捷键..." />
          </div>
        ` : ''}
        <div class="shortcut-panel-content"></div>
        <div class="shortcut-panel-footer">
          按 <span class="shortcut-key">?</span> 或 <span class="shortcut-key">Esc</span> 关闭
        </div>
      </div>
    `;

    // 点击遮罩关闭
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        this.hide();
      }
    });

    // 关闭按钮
    overlay.querySelector('.shortcut-panel-close')?.addEventListener('click', () => {
      this.hide();
    });

    // 搜索功能
    if (this.showSearch) {
      this.searchInput = overlay.querySelector('.shortcut-panel-search input') as HTMLInputElement;
      this.searchInput?.addEventListener('input', (e) => {
        this.filterShortcuts((e.target as HTMLInputElement).value);
      });
    }

    document.body.appendChild(overlay);
    this.panelElement = overlay;

    // 渲染快捷键列表
    this.renderShortcuts();
  }

  /**
   * 渲染快捷键列表
   */
  private renderShortcuts(): void {
    const content = this.panelElement?.querySelector('.shortcut-panel-content');
    if (!content) return;

    if (this.filteredShortcuts.length === 0) {
      content.innerHTML = `
        <div class="shortcut-panel-empty">
          没有找到匹配的快捷键
        </div>
      `;
      return;
    }

    // 按分类分组
    const categories = new Map<string, ShortcutInfo[]>();
    this.filteredShortcuts.forEach(shortcut => {
      const category = shortcut.category || '通用';
      if (!categories.has(category)) {
        categories.set(category, []);
      }
      categories.get(category)!.push(shortcut);
    });

    let html = '';
    categories.forEach((shortcuts, categoryName) => {
      html += `
        <div class="shortcut-category">
          <div class="shortcut-category-title">${categoryName}</div>
          ${shortcuts.map(s => this.renderShortcutItem(s)).join('')}
        </div>
      `;
    });

    content.innerHTML = html;
  }

  /**
   * 渲染单个快捷键项
   */
  private renderShortcutItem(shortcut: ShortcutInfo): string {
    const keys: string[] = [];

    // 添加修饰键
    if (shortcut.modifiers?.ctrl) {
      keys.push(this.isMac() ? '⌘' : 'Ctrl');
    }
    if (shortcut.modifiers?.alt) {
      keys.push(this.isMac() ? '⌥' : 'Alt');
    }
    if (shortcut.modifiers?.shift) {
      keys.push('Shift');
    }

    // 添加主键
    keys.push(...shortcut.keys.map(key => this.formatKeyName(key)));

    return `
      <div class="shortcut-item">
        <span class="shortcut-description">${shortcut.description}</span>
        <div class="shortcut-keys">
          ${keys.map((key, i) => `
            ${i > 0 ? '<span class="shortcut-plus">+</span>' : ''}
            <span class="shortcut-key">${key}</span>
          `).join('')}
        </div>
      </div>
    `;
  }

  /**
   * 格式化按键名称
   */
  private formatKeyName(key: string): string {
    const keyMap: Record<string, string> = {
      'Space': '空格',
      'ArrowUp': '↑',
      'ArrowDown': '↓',
      'ArrowLeft': '←',
      'ArrowRight': '→',
      'Escape': 'Esc',
      'Enter': '↵',
      'Backspace': '⌫',
      'Tab': '⇥',
      'Period': '.',
      'Comma': ',',
    };

    // 处理 KeyX 格式
    if (key.startsWith('Key')) {
      return key.slice(3);
    }

    return keyMap[key] || key;
  }

  /**
   * 检测是否 Mac
   */
  private isMac(): boolean {
    return /Mac|iPhone|iPad|iPod/.test(navigator.platform);
  }

  /**
   * 过滤快捷键
   */
  private filterShortcuts(query: string): void {
    const q = query.toLowerCase().trim();
    
    if (!q) {
      this.filteredShortcuts = [...this.shortcuts];
    } else {
      this.filteredShortcuts = this.shortcuts.filter(s => 
        s.description.toLowerCase().includes(q) ||
        s.name.toLowerCase().includes(q) ||
        s.keys.some(k => k.toLowerCase().includes(q)) ||
        (s.category && s.category.toLowerCase().includes(q))
      );
    }

    this.renderShortcuts();
  }

  /**
   * 显示面板
   */
  show(): void {
    if (this.isVisible) return;

    this.createPanel();
    
    // 触发重排后添加 visible 类
    requestAnimationFrame(() => {
      this.panelElement?.classList.add('visible');
    });

    this.isVisible = true;

    // 聚焦搜索框
    if (this.searchInput) {
      setTimeout(() => {
        this.searchInput?.focus();
      }, this.animationDuration);
    }
  }

  /**
   * 隐藏面板
   */
  hide(): void {
    if (!this.isVisible || !this.panelElement) return;

    this.panelElement.classList.remove('visible');
    this.isVisible = false;

    // 清空搜索
    if (this.searchInput) {
      this.searchInput.value = '';
      this.filteredShortcuts = [...this.shortcuts];
      this.renderShortcuts();
    }
  }

  /**
   * 切换显示/隐藏
   */
  toggle(): void {
    if (this.isVisible) {
      this.hide();
    } else {
      this.show();
    }
  }

  /**
   * 更新快捷键列表
   */
  updateShortcuts(shortcuts: ShortcutInfo[]): void {
    this.shortcuts = shortcuts;
    this.filteredShortcuts = [...shortcuts];
    if (this.panelElement) {
      this.renderShortcuts();
    }
  }

  /**
   * 设置主题
   */
  setTheme(theme: 'light' | 'dark' | 'auto'): void {
    this.theme = theme;
    if (this.panelElement) {
      this.panelElement.className = `shortcut-panel-overlay theme-${theme} ${this.className || ''}`;
    }
  }

  /**
   * 销毁
   */
  destroy(): void {
    document.removeEventListener('keydown', this.boundKeyHandler);
    this.panelElement?.remove();
    this.panelElement = null;
    this.searchInput = null;
    this.isVisible = false;
  }
}

/**
 * 创建快捷键面板的便捷函数
 */
export function createShortcutPanel(options: ShortcutPanelOptions): ShortcutPanel {
  return new ShortcutPanel(options);
}

/**
 * 默认播放器快捷键配置
 */
export const DEFAULT_PLAYER_SHORTCUTS: ShortcutInfo[] = [
  { name: 'playPause', keys: ['Space'], description: '播放/暂停', category: '播放控制' },
  { name: 'stop', keys: ['Escape'], description: '停止播放', category: '播放控制' },
  { name: 'seekForward', keys: ['ArrowRight'], description: '快进 5 秒', category: '播放控制' },
  { name: 'seekBackward', keys: ['ArrowLeft'], description: '快退 5 秒', category: '播放控制' },
  { name: 'seekForwardLarge', keys: ['KeyL'], description: '快进 10 秒', category: '播放控制' },
  { name: 'seekBackwardLarge', keys: ['KeyJ'], description: '快退 10 秒', category: '播放控制' },
  { name: 'volumeUp', keys: ['ArrowUp'], description: '增加音量', category: '音量' },
  { name: 'volumeDown', keys: ['ArrowDown'], description: '减少音量', category: '音量' },
  { name: 'mute', keys: ['KeyM'], description: '静音/取消静音', category: '音量' },
  { name: 'fullscreen', keys: ['KeyF'], description: '全屏/退出全屏', category: '显示' },
  { name: 'miniPlayer', keys: ['KeyI'], description: '迷你播放器', category: '显示' },
  { name: 'speedUp', keys: ['Period'], description: '加速播放', category: '速度', modifiers: { shift: true } },
  { name: 'speedDown', keys: ['Comma'], description: '减速播放', category: '速度', modifiers: { shift: true } },
  { name: 'next', keys: ['KeyN'], description: '下一曲/下一集', category: '播放列表', modifiers: { shift: true } },
  { name: 'prev', keys: ['KeyP'], description: '上一曲/上一集', category: '播放列表', modifiers: { shift: true } },
];
