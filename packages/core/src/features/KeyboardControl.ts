/**
 * 键盘快捷键控制模块
 * 提供完整的键盘控制支持，支持自定义快捷键映射
 */

export interface KeyboardAction {
  /** 快捷键名称 */
  name: string;
  /** 按键代码 */
  keys: string[];
  /** 描述 */
  description: string;
  /** 处理函数 */
  handler: () => void;
  /** 是否需要 Ctrl/Cmd 键 */
  ctrl?: boolean;
  /** 是否需要 Shift 键 */
  shift?: boolean;
  /** 是否需要 Alt 键 */
  alt?: boolean;
  /** 是否启用（默认 true） */
  enabled?: boolean;
}

export interface KeyboardControlOptions {
  /** 是否启用键盘控制 */
  enabled?: boolean;
  /** 自定义快捷键映射 */
  keyMap?: Partial<KeyboardKeyMap>;
  /** 目标元素（默认 document） */
  target?: HTMLElement | Document;
  /** 是否阻止默认行为 */
  preventDefault?: boolean;
  /** 是否阻止冒泡 */
  stopPropagation?: boolean;
  /** 需要聚焦目标才响应 */
  requireFocus?: boolean;
}

export interface KeyboardKeyMap {
  playPause: string;
  stop: string;
  volumeUp: string;
  volumeDown: string;
  mute: string;
  seekForward: string;
  seekBackward: string;
  seekForwardLarge: string;
  seekBackwardLarge: string;
  fullscreen: string;
  miniPlayer: string;
  speedUp: string;
  speedDown: string;
  next: string;
  prev: string;
}

const DEFAULT_KEY_MAP: KeyboardKeyMap = {
  playPause: 'Space',
  stop: 'Escape',
  volumeUp: 'ArrowUp',
  volumeDown: 'ArrowDown',
  mute: 'KeyM',
  seekForward: 'ArrowRight',
  seekBackward: 'ArrowLeft',
  seekForwardLarge: 'KeyL',
  seekBackwardLarge: 'KeyJ',
  fullscreen: 'KeyF',
  miniPlayer: 'KeyI',
  speedUp: 'Period',
  speedDown: 'Comma',
  next: 'KeyN',
  prev: 'KeyP',
};

export interface KeyboardControlCallbacks {
  onPlayPause?: () => void;
  onStop?: () => void;
  onVolumeUp?: () => void;
  onVolumeDown?: () => void;
  onMute?: () => void;
  onSeekForward?: (seconds: number) => void;
  onSeekBackward?: (seconds: number) => void;
  onFullscreen?: () => void;
  onMiniPlayer?: () => void;
  onSpeedUp?: () => void;
  onSpeedDown?: () => void;
  onNext?: () => void;
  onPrev?: () => void;
}

/**
 * 键盘控制类
 */
export class KeyboardControl {
  private enabled: boolean;
  private keyMap: KeyboardKeyMap;
  private target: HTMLElement | Document;
  private options: KeyboardControlOptions;
  private callbacks: KeyboardControlCallbacks;
  private actions: Map<string, KeyboardAction> = new Map();
  private boundHandleKeyDown: (e: KeyboardEvent) => void;

  constructor(
    callbacks: KeyboardControlCallbacks,
    options: KeyboardControlOptions = {}
  ) {
    this.callbacks = callbacks;
    this.options = options;
    this.enabled = options.enabled ?? true;
    this.keyMap = { ...DEFAULT_KEY_MAP, ...options.keyMap };
    this.target = options.target ?? document;
    this.boundHandleKeyDown = this.handleKeyDown.bind(this);

    this.setupDefaultActions();

    if (this.enabled) {
      this.bind();
    }
  }

  /**
   * 设置默认快捷键动作
   */
  private setupDefaultActions(): void {
    const { callbacks, keyMap } = this;

    // 播放/暂停
    if (callbacks.onPlayPause) {
      this.registerAction({
        name: 'playPause',
        keys: [keyMap.playPause],
        description: '播放/暂停',
        handler: callbacks.onPlayPause,
      });
    }

    // 停止
    if (callbacks.onStop) {
      this.registerAction({
        name: 'stop',
        keys: [keyMap.stop],
        description: '停止播放',
        handler: callbacks.onStop,
      });
    }

    // 音量增加
    if (callbacks.onVolumeUp) {
      this.registerAction({
        name: 'volumeUp',
        keys: [keyMap.volumeUp],
        description: '增加音量',
        handler: callbacks.onVolumeUp,
      });
    }

    // 音量减少
    if (callbacks.onVolumeDown) {
      this.registerAction({
        name: 'volumeDown',
        keys: [keyMap.volumeDown],
        description: '减少音量',
        handler: callbacks.onVolumeDown,
      });
    }

    // 静音
    if (callbacks.onMute) {
      this.registerAction({
        name: 'mute',
        keys: [keyMap.mute],
        description: '静音/取消静音',
        handler: callbacks.onMute,
      });
    }

    // 快进（5秒）
    if (callbacks.onSeekForward) {
      this.registerAction({
        name: 'seekForward',
        keys: [keyMap.seekForward],
        description: '快进 5 秒',
        handler: () => callbacks.onSeekForward!(5),
      });
    }

    // 快退（5秒）
    if (callbacks.onSeekBackward) {
      this.registerAction({
        name: 'seekBackward',
        keys: [keyMap.seekBackward],
        description: '快退 5 秒',
        handler: () => callbacks.onSeekBackward!(5),
      });
    }

    // 快进（10秒）
    if (callbacks.onSeekForward) {
      this.registerAction({
        name: 'seekForwardLarge',
        keys: [keyMap.seekForwardLarge],
        description: '快进 10 秒',
        handler: () => callbacks.onSeekForward!(10),
      });
    }

    // 快退（10秒）
    if (callbacks.onSeekBackward) {
      this.registerAction({
        name: 'seekBackwardLarge',
        keys: [keyMap.seekBackwardLarge],
        description: '快退 10 秒',
        handler: () => callbacks.onSeekBackward!(10),
      });
    }

    // 全屏
    if (callbacks.onFullscreen) {
      this.registerAction({
        name: 'fullscreen',
        keys: [keyMap.fullscreen],
        description: '全屏/退出全屏',
        handler: callbacks.onFullscreen,
      });
    }

    // 迷你播放器
    if (callbacks.onMiniPlayer) {
      this.registerAction({
        name: 'miniPlayer',
        keys: [keyMap.miniPlayer],
        description: '迷你播放器',
        handler: callbacks.onMiniPlayer,
      });
    }

    // 加速
    if (callbacks.onSpeedUp) {
      this.registerAction({
        name: 'speedUp',
        keys: [keyMap.speedUp],
        description: '加速播放',
        handler: callbacks.onSpeedUp,
        shift: true,
      });
    }

    // 减速
    if (callbacks.onSpeedDown) {
      this.registerAction({
        name: 'speedDown',
        keys: [keyMap.speedDown],
        description: '减速播放',
        handler: callbacks.onSpeedDown,
        shift: true,
      });
    }

    // 下一曲
    if (callbacks.onNext) {
      this.registerAction({
        name: 'next',
        keys: [keyMap.next],
        description: '下一曲',
        handler: callbacks.onNext,
        shift: true,
      });
    }

    // 上一曲
    if (callbacks.onPrev) {
      this.registerAction({
        name: 'prev',
        keys: [keyMap.prev],
        description: '上一曲',
        handler: callbacks.onPrev,
        shift: true,
      });
    }
  }

  /**
   * 注册自定义快捷键动作
   */
  registerAction(action: KeyboardAction): void {
    this.actions.set(action.name, { ...action, enabled: action.enabled ?? true });
  }

  /**
   * 注销快捷键动作
   */
  unregisterAction(name: string): void {
    this.actions.delete(name);
  }

  /**
   * 启用/禁用某个动作
   */
  setActionEnabled(name: string, enabled: boolean): void {
    const action = this.actions.get(name);
    if (action) {
      action.enabled = enabled;
    }
  }

  /**
   * 处理键盘事件
   */
  private handleKeyDown(e: KeyboardEvent): void {
    if (!this.enabled) return;

    // 检查是否需要聚焦
    if (this.options.requireFocus && this.target instanceof HTMLElement) {
      if (!this.target.contains(document.activeElement)) {
        return;
      }
    }

    // 忽略输入框中的按键
    const target = e.target as HTMLElement;
    if (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.isContentEditable
    ) {
      return;
    }

    // 查找匹配的动作
    for (const action of this.actions.values()) {
      if (!action.enabled) continue;

      const keyMatch = action.keys.includes(e.code);
      const ctrlMatch = action.ctrl ? e.ctrlKey || e.metaKey : !e.ctrlKey && !e.metaKey;
      const shiftMatch = action.shift ? e.shiftKey : !e.shiftKey;
      const altMatch = action.alt ? e.altKey : !e.altKey;

      if (keyMatch && ctrlMatch && shiftMatch && altMatch) {
        if (this.options.preventDefault !== false) {
          e.preventDefault();
        }
        if (this.options.stopPropagation) {
          e.stopPropagation();
        }
        action.handler();
        return;
      }
    }
  }

  /**
   * 绑定键盘事件
   */
  bind(): void {
    this.target.addEventListener('keydown', this.boundHandleKeyDown as EventListener);
    this.enabled = true;
  }

  /**
   * 解绑键盘事件
   */
  unbind(): void {
    this.target.removeEventListener('keydown', this.boundHandleKeyDown as EventListener);
    this.enabled = false;
  }

  /**
   * 启用键盘控制
   */
  enable(): void {
    if (!this.enabled) {
      this.bind();
    }
  }

  /**
   * 禁用键盘控制
   */
  disable(): void {
    if (this.enabled) {
      this.unbind();
    }
  }

  /**
   * 获取所有快捷键列表
   */
  getShortcuts(): Array<{
    name: string;
    keys: string[];
    description: string;
    enabled: boolean;
    modifiers: { ctrl?: boolean; shift?: boolean; alt?: boolean };
  }> {
    return Array.from(this.actions.values()).map((action) => ({
      name: action.name,
      keys: action.keys,
      description: action.description,
      enabled: action.enabled ?? true,
      modifiers: {
        ctrl: action.ctrl,
        shift: action.shift,
        alt: action.alt,
      },
    }));
  }

  /**
   * 更新快捷键映射
   */
  updateKeyMap(keyMap: Partial<KeyboardKeyMap>): void {
    this.keyMap = { ...this.keyMap, ...keyMap };
    // 重新设置动作
    this.actions.clear();
    this.setupDefaultActions();
  }

  /**
   * 销毁
   */
  destroy(): void {
    this.unbind();
    this.actions.clear();
  }
}

/**
 * 快捷键提示组件配置
 */
export interface ShortcutHintConfig {
  /** 是否显示快捷键提示 */
  show?: boolean;
  /** 提示位置 */
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  /** 显示持续时间（毫秒） */
  duration?: number;
}

/**
 * 创建快捷键提示 DOM
 */
export function createShortcutHint(
  container: HTMLElement,
  config: ShortcutHintConfig = {}
): {
  show: (text: string) => void;
  hide: () => void;
  destroy: () => void;
} {
  const position = config.position ?? 'top-right';
  const duration = config.duration ?? 1500;

  const hint = document.createElement('div');
  hint.className = 'ldesign-player-shortcut-hint';
  hint.style.cssText = `
    position: absolute;
    ${position.includes('top') ? 'top: 16px' : 'bottom: 16px'};
    ${position.includes('left') ? 'left: 16px' : 'right: 16px'};
    padding: 8px 16px;
    background: rgba(0, 0, 0, 0.8);
    backdrop-filter: blur(10px);
    color: #fff;
    font-size: 14px;
    font-weight: 500;
    border-radius: 8px;
    opacity: 0;
    transform: translateY(${position.includes('top') ? '-10px' : '10px'});
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    pointer-events: none;
    z-index: 1000;
    white-space: nowrap;
  `;
  container.appendChild(hint);

  let hideTimeout: ReturnType<typeof setTimeout> | null = null;

  const show = (text: string) => {
    if (hideTimeout) {
      clearTimeout(hideTimeout);
    }
    hint.textContent = text;
    hint.style.opacity = '1';
    hint.style.transform = 'translateY(0)';

    hideTimeout = setTimeout(hide, duration);
  };

  const hide = () => {
    hint.style.opacity = '0';
    hint.style.transform = `translateY(${position.includes('top') ? '-10px' : '10px'})`;
  };

  const destroy = () => {
    if (hideTimeout) {
      clearTimeout(hideTimeout);
    }
    hint.remove();
  };

  return { show, hide, destroy };
}
