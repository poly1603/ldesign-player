/**
 * 字幕管理器增强模块
 * 支持样式自定义、双语字幕、搜索跳转、ASS 格式、字幕同步调整
 */

import { SubtitleParser } from './SubtitleParser';

export interface SubtitleCue {
  id?: string;
  start: number;
  end: number;
  text: string;
  /** 第二语言文本（双语字幕） */
  secondaryText?: string;
  /** ASS 样式名 */
  styleName?: string;
  /** 位置 */
  position?: SubtitlePosition;
}

export interface SubtitlePosition {
  x?: number;
  y?: number;
  align?: 'left' | 'center' | 'right';
  verticalAlign?: 'top' | 'middle' | 'bottom';
}

export interface SubtitleStyle {
  /** 字体 */
  fontFamily?: string;
  /** 字号 */
  fontSize?: number;
  /** 字体颜色 */
  color?: string;
  /** 第二语言颜色 */
  secondaryColor?: string;
  /** 背景颜色 */
  backgroundColor?: string;
  /** 描边颜色 */
  strokeColor?: string;
  /** 描边宽度 */
  strokeWidth?: number;
  /** 阴影 */
  shadowColor?: string;
  shadowBlur?: number;
  shadowOffsetX?: number;
  shadowOffsetY?: number;
  /** 字体粗细 */
  fontWeight?: 'normal' | 'bold' | number;
  /** 斜体 */
  fontStyle?: 'normal' | 'italic';
  /** 行高 */
  lineHeight?: number;
  /** 字间距 */
  letterSpacing?: number;
  /** 不透明度 */
  opacity?: number;
  /** 位置 */
  position?: 'top' | 'bottom';
  /** 距离边缘的距离 */
  marginBottom?: number;
  marginTop?: number;
}

export interface SubtitleTrack {
  id: string;
  label: string;
  language: string;
  src?: string;
  cues: SubtitleCue[];
  isDefault?: boolean;
}

export interface SubtitleManagerOptions {
  /** 容器元素 */
  container: HTMLElement;
  /** 视频元素 */
  videoElement: HTMLVideoElement;
  /** 默认样式 */
  defaultStyle?: SubtitleStyle;
  /** 是否启用双语显示 */
  dualLanguage?: boolean;
  /** 时间偏移（秒） */
  timeOffset?: number;
  /** 存储键名 */
  storageKey?: string;
  /** 是否记住设置 */
  rememberSettings?: boolean;
}

export interface SubtitleSearchResult {
  cue: SubtitleCue;
  trackId: string;
  matchStart: number;
  matchEnd: number;
}

const DEFAULT_STYLE: Required<SubtitleStyle> = {
  fontFamily: 'system-ui, -apple-system, sans-serif',
  fontSize: 24,
  color: '#ffffff',
  secondaryColor: '#cccccc',
  backgroundColor: 'rgba(0, 0, 0, 0.6)',
  strokeColor: '#000000',
  strokeWidth: 0,
  shadowColor: 'rgba(0, 0, 0, 0.8)',
  shadowBlur: 4,
  shadowOffsetX: 1,
  shadowOffsetY: 1,
  fontWeight: 'normal',
  fontStyle: 'normal',
  lineHeight: 1.4,
  letterSpacing: 0,
  opacity: 1,
  position: 'bottom',
  marginBottom: 50,
  marginTop: 50,
};

/** 字幕样式预设 */
export const SUBTITLE_STYLE_PRESETS: Record<string, Partial<SubtitleStyle>> = {
  default: {},
  netflix: {
    fontSize: 28,
    fontWeight: 'bold',
    backgroundColor: 'transparent',
    shadowBlur: 6,
    shadowColor: 'rgba(0, 0, 0, 0.9)',
  },
  youtube: {
    fontSize: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    shadowBlur: 0,
  },
  movie: {
    fontSize: 26,
    fontFamily: '"Trebuchet MS", Helvetica, sans-serif',
    color: '#fffdd0',
    backgroundColor: 'transparent',
    strokeColor: '#000000',
    strokeWidth: 2,
  },
  minimal: {
    fontSize: 20,
    backgroundColor: 'transparent',
    opacity: 0.9,
  },
  highContrast: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#ffff00',
    backgroundColor: '#000000',
    opacity: 1,
  },
};

/**
 * 字幕管理器
 */
export class SubtitleManager {
  private container: HTMLElement;
  private videoElement: HTMLVideoElement;
  private options: SubtitleManagerOptions;

  private subtitleElement: HTMLDivElement | null = null;
  private primaryTextElement: HTMLDivElement | null = null;
  private secondaryTextElement: HTMLDivElement | null = null;

  private tracks: Map<string, SubtitleTrack> = new Map();
  private activeTrackId: string | null = null;
  private secondaryTrackId: string | null = null;

  private style: Required<SubtitleStyle>;
  private timeOffset = 0;
  private isVisible = true;

  private currentCue: SubtitleCue | null = null;
  private animationFrameId: number | null = null;

  private parser = new SubtitleParser();
  private eventTarget = new EventTarget();

  constructor(options: SubtitleManagerOptions) {
    this.container = options.container;
    this.videoElement = options.videoElement;
    this.options = options;

    this.style = { ...DEFAULT_STYLE, ...options.defaultStyle };
    this.timeOffset = options.timeOffset || 0;

    // 恢复设置
    if (options.rememberSettings) {
      this.restoreSettings();
    }

    // 创建字幕元素
    this.createSubtitleElement();

    // 绑定事件
    this.bindEvents();
  }

  /**
   * 添加字幕轨道
   */
  async addTrack(track: Omit<SubtitleTrack, 'cues'> & { cues?: SubtitleCue[] }): Promise<void> {
    const newTrack: SubtitleTrack = {
      ...track,
      cues: track.cues || [],
    };

    // 如果提供了 URL，加载字幕
    if (track.src && !track.cues?.length) {
      await this.parser.loadFromUrl(track.src);
      const parsedCues = this.parser.getCues();
      newTrack.cues = parsedCues.map((cue, index) => ({
        id: `${track.id}-${index}`,
        ...cue,
      }));
    }

    this.tracks.set(track.id, newTrack);

    // 如果是默认轨道且没有激活的轨道，激活它
    if (track.isDefault && !this.activeTrackId) {
      this.setActiveTrack(track.id);
    }

    this.emit('trackadded', { track: newTrack });
  }

  /**
   * 移除字幕轨道
   */
  removeTrack(trackId: string): void {
    const track = this.tracks.get(trackId);
    if (!track) return;

    this.tracks.delete(trackId);

    if (this.activeTrackId === trackId) {
      this.activeTrackId = null;
      this.hideSubtitle();
    }

    if (this.secondaryTrackId === trackId) {
      this.secondaryTrackId = null;
    }

    this.emit('trackremoved', { trackId });
  }

  /**
   * 设置当前激活的字幕轨道
   */
  setActiveTrack(trackId: string | null): void {
    if (trackId && !this.tracks.has(trackId)) {
      console.warn(`Track "${trackId}" not found`);
      return;
    }

    this.activeTrackId = trackId;

    if (!trackId) {
      this.hideSubtitle();
    }

    this.emit('trackchanged', { trackId });
    this.saveSettings();
  }

  /**
   * 设置第二字幕轨道（双语）
   */
  setSecondaryTrack(trackId: string | null): void {
    if (trackId && !this.tracks.has(trackId)) {
      console.warn(`Track "${trackId}" not found`);
      return;
    }

    this.secondaryTrackId = trackId;
    this.emit('secondarytrackchanged', { trackId });
    this.saveSettings();
  }

  /**
   * 获取所有字幕轨道
   */
  getTracks(): SubtitleTrack[] {
    return Array.from(this.tracks.values());
  }

  /**
   * 获取当前激活的轨道
   */
  getActiveTrack(): SubtitleTrack | null {
    return this.activeTrackId ? this.tracks.get(this.activeTrackId) || null : null;
  }

  /**
   * 设置字幕样式
   */
  setStyle(style: Partial<SubtitleStyle>): void {
    this.style = { ...this.style, ...style };
    this.applyStyle();
    this.emit('stylechanged', { style: this.style });
    this.saveSettings();
  }

  /**
   * 应用样式预设
   */
  applyPreset(presetName: keyof typeof SUBTITLE_STYLE_PRESETS): void {
    const preset = SUBTITLE_STYLE_PRESETS[presetName];
    if (preset) {
      this.setStyle(preset);
    }
  }

  /**
   * 获取当前样式
   */
  getStyle(): Required<SubtitleStyle> {
    return { ...this.style };
  }

  /**
   * 设置时间偏移
   */
  setTimeOffset(offset: number): void {
    this.timeOffset = offset;
    this.emit('offsetchanged', { offset });
    this.saveSettings();
  }

  /**
   * 调整时间偏移
   */
  adjustTimeOffset(delta: number): void {
    this.setTimeOffset(this.timeOffset + delta);
  }

  /**
   * 获取时间偏移
   */
  getTimeOffset(): number {
    return this.timeOffset;
  }

  /**
   * 显示字幕
   */
  show(): void {
    this.isVisible = true;
    if (this.subtitleElement) {
      this.subtitleElement.style.display = 'block';
    }
    this.emit('visibilitychanged', { visible: true });
    this.saveSettings();
  }

  /**
   * 隐藏字幕
   */
  hide(): void {
    this.isVisible = false;
    if (this.subtitleElement) {
      this.subtitleElement.style.display = 'none';
    }
    this.emit('visibilitychanged', { visible: false });
    this.saveSettings();
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
   * 是否可见
   */
  isSubtitleVisible(): boolean {
    return this.isVisible;
  }

  /**
   * 搜索字幕
   */
  search(keyword: string, options?: { trackId?: string; caseSensitive?: boolean }): SubtitleSearchResult[] {
    const results: SubtitleSearchResult[] = [];
    const searchTerm = options?.caseSensitive ? keyword : keyword.toLowerCase();

    const tracksToSearch = options?.trackId
      ? [this.tracks.get(options.trackId)].filter(Boolean) as SubtitleTrack[]
      : Array.from(this.tracks.values());

    for (const track of tracksToSearch) {
      for (const cue of track.cues) {
        const text = options?.caseSensitive ? cue.text : cue.text.toLowerCase();
        const matchStart = text.indexOf(searchTerm);

        if (matchStart !== -1) {
          results.push({
            cue,
            trackId: track.id,
            matchStart,
            matchEnd: matchStart + searchTerm.length,
          });
        }
      }
    }

    return results;
  }

  /**
   * 跳转到字幕
   */
  seekToCue(cue: SubtitleCue): void {
    this.videoElement.currentTime = cue.start + this.timeOffset;
  }

  /**
   * 跳转到下一条字幕
   */
  seekToNextCue(): void {
    const track = this.getActiveTrack();
    if (!track) return;

    const currentTime = this.videoElement.currentTime - this.timeOffset;
    const nextCue = track.cues.find(cue => cue.start > currentTime);

    if (nextCue) {
      this.seekToCue(nextCue);
    }
  }

  /**
   * 跳转到上一条字幕
   */
  seekToPreviousCue(): void {
    const track = this.getActiveTrack();
    if (!track) return;

    const currentTime = this.videoElement.currentTime - this.timeOffset;
    const previousCues = track.cues.filter(cue => cue.end < currentTime);

    if (previousCues.length > 0) {
      this.seekToCue(previousCues[previousCues.length - 1]);
    }
  }

  /**
   * 获取当前字幕
   */
  getCurrentCue(): SubtitleCue | null {
    return this.currentCue;
  }

  /**
   * 解析 ASS 格式
   */
  parseASS(content: string, trackId: string): SubtitleTrack {
    const cues: SubtitleCue[] = [];
    const lines = content.split('\n');
    let inEvents = false;
    let formatIndices: Record<string, number> = {};

    for (const line of lines) {
      const trimmedLine = line.trim();

      // 查找 [Events] 部分
      if (trimmedLine === '[Events]') {
        inEvents = true;
        continue;
      }

      if (trimmedLine.startsWith('[') && trimmedLine !== '[Events]') {
        inEvents = false;
        continue;
      }

      if (!inEvents) continue;

      // 解析 Format 行
      if (trimmedLine.startsWith('Format:')) {
        const formatStr = trimmedLine.substring(7).trim();
        const fields = formatStr.split(',').map(f => f.trim().toLowerCase());
        fields.forEach((field, index) => {
          formatIndices[field] = index;
        });
        continue;
      }

      // 解析 Dialogue 行
      if (trimmedLine.startsWith('Dialogue:')) {
        const dialogueStr = trimmedLine.substring(9).trim();
        const parts = this.parseASSDialogue(dialogueStr, Object.keys(formatIndices).length);

        const startIndex = formatIndices['start'];
        const endIndex = formatIndices['end'];
        const textIndex = formatIndices['text'];
        const styleIndex = formatIndices['style'];

        if (startIndex !== undefined && endIndex !== undefined && textIndex !== undefined) {
          const start = this.parseASSTimestamp(parts[startIndex]);
          const end = this.parseASSTimestamp(parts[endIndex]);
          let text = parts[textIndex];

          // 移除 ASS 标签并处理换行
          text = this.cleanASSText(text);

          cues.push({
            id: `${trackId}-${cues.length}`,
            start,
            end,
            text,
            styleName: styleIndex !== undefined ? parts[styleIndex] : undefined,
          });
        }
      }
    }

    return {
      id: trackId,
      label: 'ASS Subtitle',
      language: 'unknown',
      cues,
    };
  }

  /**
   * 解析 ASS 对话行
   */
  private parseASSDialogue(dialogue: string, fieldCount: number): string[] {
    const parts: string[] = [];
    let current = '';
    let commaCount = 0;

    for (let i = 0; i < dialogue.length; i++) {
      if (dialogue[i] === ',' && commaCount < fieldCount - 1) {
        parts.push(current.trim());
        current = '';
        commaCount++;
      } else {
        current += dialogue[i];
      }
    }
    parts.push(current.trim());

    return parts;
  }

  /**
   * 解析 ASS 时间戳
   */
  private parseASSTimestamp(timestamp: string): number {
    const match = timestamp.match(/(\d+):(\d+):(\d+)\.(\d+)/);
    if (!match) return 0;

    const hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);
    const seconds = parseInt(match[3], 10);
    const centiseconds = parseInt(match[4], 10);

    return hours * 3600 + minutes * 60 + seconds + centiseconds / 100;
  }

  /**
   * 清理 ASS 文本标签
   */
  private cleanASSText(text: string): string {
    // 移除 {\xxx} 格式的标签
    text = text.replace(/\{[^}]*\}/g, '');
    // 转换换行标签
    text = text.replace(/\\N/g, '\n');
    text = text.replace(/\\n/g, '\n');
    // 移除其他特殊标签
    text = text.replace(/\\[hH]/g, ' ');
    return text.trim();
  }

  /**
   * 导出字幕为 SRT 格式
   */
  exportToSRT(trackId?: string): string {
    const track = trackId ? this.tracks.get(trackId) : this.getActiveTrack();
    if (!track) return '';

    let srt = '';
    track.cues.forEach((cue, index) => {
      srt += `${index + 1}\n`;
      srt += `${this.formatSRTTimestamp(cue.start)} --> ${this.formatSRTTimestamp(cue.end)}\n`;
      srt += `${cue.text}\n\n`;
    });

    return srt;
  }

  /**
   * 导出字幕为 VTT 格式
   */
  exportToVTT(trackId?: string): string {
    const track = trackId ? this.tracks.get(trackId) : this.getActiveTrack();
    if (!track) return '';

    let vtt = 'WEBVTT\n\n';
    track.cues.forEach((cue, index) => {
      vtt += `${index + 1}\n`;
      vtt += `${this.formatVTTTimestamp(cue.start)} --> ${this.formatVTTTimestamp(cue.end)}\n`;
      vtt += `${cue.text}\n\n`;
    });

    return vtt;
  }

  /**
   * 格式化 SRT 时间戳
   */
  private formatSRTTimestamp(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const millis = Math.floor((seconds % 1) * 1000);

    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')},${String(millis).padStart(3, '0')}`;
  }

  /**
   * 格式化 VTT 时间戳
   */
  private formatVTTTimestamp(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const millis = Math.floor((seconds % 1) * 1000);

    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${String(millis).padStart(3, '0')}`;
  }

  /**
   * 监听事件
   */
  on(type: string, handler: (detail: any) => void): void {
    this.eventTarget.addEventListener(type, ((e: CustomEvent) => {
      handler(e.detail);
    }) as EventListener);
  }

  /**
   * 取消监听事件
   */
  off(type: string, handler: (detail: any) => void): void {
    this.eventTarget.removeEventListener(type, handler as EventListener);
  }

  /**
   * 创建字幕元素
   */
  private createSubtitleElement(): void {
    this.subtitleElement = document.createElement('div');
    this.subtitleElement.className = 'ldesign-subtitle';
    this.subtitleElement.style.cssText = `
      position: absolute;
      left: 0;
      right: 0;
      text-align: center;
      pointer-events: none;
      z-index: 100;
      transition: opacity 0.15s;
    `;

    // 主字幕文本
    this.primaryTextElement = document.createElement('div');
    this.primaryTextElement.className = 'ldesign-subtitle-primary';
    this.subtitleElement.appendChild(this.primaryTextElement);

    // 次要字幕文本（双语）
    this.secondaryTextElement = document.createElement('div');
    this.secondaryTextElement.className = 'ldesign-subtitle-secondary';
    this.subtitleElement.appendChild(this.secondaryTextElement);

    this.container.appendChild(this.subtitleElement);
    this.applyStyle();
  }

  /**
   * 应用样式
   */
  private applyStyle(): void {
    if (!this.subtitleElement || !this.primaryTextElement || !this.secondaryTextElement) return;

    const s = this.style;

    // 容器定位
    if (s.position === 'top') {
      this.subtitleElement.style.top = `${s.marginTop}px`;
      this.subtitleElement.style.bottom = 'auto';
    } else {
      this.subtitleElement.style.bottom = `${s.marginBottom}px`;
      this.subtitleElement.style.top = 'auto';
    }

    // 文本样式
    const textShadow = s.strokeWidth > 0
      ? `${s.strokeWidth}px ${s.strokeWidth}px 0 ${s.strokeColor}, -${s.strokeWidth}px -${s.strokeWidth}px 0 ${s.strokeColor}, ${s.strokeWidth}px -${s.strokeWidth}px 0 ${s.strokeColor}, -${s.strokeWidth}px ${s.strokeWidth}px 0 ${s.strokeColor}`
      : `${s.shadowOffsetX}px ${s.shadowOffsetY}px ${s.shadowBlur}px ${s.shadowColor}`;

    const baseStyle = `
      font-family: ${s.fontFamily};
      font-size: ${s.fontSize}px;
      font-weight: ${s.fontWeight};
      font-style: ${s.fontStyle};
      line-height: ${s.lineHeight};
      letter-spacing: ${s.letterSpacing}px;
      text-shadow: ${textShadow};
      padding: 4px 8px;
      display: inline-block;
      white-space: pre-wrap;
      word-break: break-word;
      max-width: 80%;
    `;

    // 主字幕样式
    this.primaryTextElement.style.cssText = `
      ${baseStyle}
      color: ${s.color};
      background-color: ${s.backgroundColor};
      opacity: ${s.opacity};
    `;

    // 次要字幕样式（略小、不同颜色）
    this.secondaryTextElement.style.cssText = `
      ${baseStyle}
      color: ${s.secondaryColor};
      background-color: ${s.backgroundColor};
      opacity: ${s.opacity * 0.9};
      font-size: ${s.fontSize * 0.85}px;
      margin-top: 4px;
    `;
  }

  /**
   * 绑定事件
   */
  private bindEvents(): void {
    // 时间更新
    this.videoElement.addEventListener('timeupdate', this.updateSubtitle.bind(this));

    // 视频结束时清除字幕
    this.videoElement.addEventListener('ended', () => {
      this.hideSubtitle();
    });

    // 全屏变化时更新样式
    document.addEventListener('fullscreenchange', () => {
      // 全屏时可以增大字体
      if (document.fullscreenElement) {
        this.applyStyle();
      }
    });
  }

  /**
   * 更新字幕显示
   */
  private updateSubtitle(): void {
    if (!this.isVisible || !this.activeTrackId) {
      this.hideSubtitle();
      return;
    }

    const track = this.tracks.get(this.activeTrackId);
    if (!track) return;

    const currentTime = this.videoElement.currentTime - this.timeOffset;
    const cue = this.findCueAtTime(track.cues, currentTime);

    // 如果字幕没有变化，不更新
    if (cue === this.currentCue) return;

    this.currentCue = cue;

    if (cue) {
      this.showSubtitle(cue);

      // 获取第二语言字幕
      if (this.secondaryTrackId) {
        const secondaryTrack = this.tracks.get(this.secondaryTrackId);
        if (secondaryTrack) {
          const secondaryCue = this.findCueAtTime(secondaryTrack.cues, currentTime);
          if (secondaryCue && this.secondaryTextElement) {
            this.secondaryTextElement.textContent = secondaryCue.text;
            this.secondaryTextElement.style.display = 'block';
          }
        }
      } else if (this.secondaryTextElement) {
        this.secondaryTextElement.style.display = 'none';
      }
    } else {
      this.hideSubtitle();
    }
  }

  /**
   * 在时间点查找字幕
   */
  private findCueAtTime(cues: SubtitleCue[], time: number): SubtitleCue | null {
    // 使用二分查找提高性能
    let left = 0;
    let right = cues.length - 1;

    while (left <= right) {
      const mid = Math.floor((left + right) / 2);
      const cue = cues[mid];

      if (time >= cue.start && time <= cue.end) {
        return cue;
      } else if (time < cue.start) {
        right = mid - 1;
      } else {
        left = mid + 1;
      }
    }

    return null;
  }

  /**
   * 显示字幕文本
   */
  private showSubtitle(cue: SubtitleCue): void {
    if (!this.primaryTextElement) return;

    this.primaryTextElement.textContent = cue.text;
    this.primaryTextElement.style.display = 'block';

    this.emit('cuechanged', { cue });
  }

  /**
   * 隐藏字幕文本
   */
  private hideSubtitle(): void {
    if (this.primaryTextElement) {
      this.primaryTextElement.style.display = 'none';
    }
    if (this.secondaryTextElement) {
      this.secondaryTextElement.style.display = 'none';
    }
    this.currentCue = null;
  }

  /**
   * 保存设置
   */
  private saveSettings(): void {
    if (!this.options.rememberSettings) return;

    const settings = {
      style: this.style,
      timeOffset: this.timeOffset,
      isVisible: this.isVisible,
      activeTrackId: this.activeTrackId,
      secondaryTrackId: this.secondaryTrackId,
    };

    try {
      localStorage.setItem(
        this.options.storageKey || 'ldesign-subtitle-settings',
        JSON.stringify(settings)
      );
    } catch {
      // 忽略存储错误
    }
  }

  /**
   * 恢复设置
   */
  private restoreSettings(): void {
    try {
      const saved = localStorage.getItem(
        this.options.storageKey || 'ldesign-subtitle-settings'
      );
      if (saved) {
        const settings = JSON.parse(saved);
        if (settings.style) {
          this.style = { ...DEFAULT_STYLE, ...settings.style };
        }
        if (typeof settings.timeOffset === 'number') {
          this.timeOffset = settings.timeOffset;
        }
        if (typeof settings.isVisible === 'boolean') {
          this.isVisible = settings.isVisible;
        }
      }
    } catch {
      // 使用默认值
    }
  }

  /**
   * 发送事件
   */
  private emit(type: string, detail: any): void {
    this.eventTarget.dispatchEvent(new CustomEvent(type, { detail }));
  }

  /**
   * 销毁
   */
  destroy(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }

    if (this.subtitleElement) {
      this.subtitleElement.remove();
    }

    this.tracks.clear();
    this.parser.clear();
  }
}

/**
 * 字幕设置面板组件
 */
export function createSubtitleSettingsPanel(manager: SubtitleManager): HTMLDivElement {
  const panel = document.createElement('div');
  panel.className = 'ldesign-subtitle-settings';
  panel.style.cssText = `
    background: rgba(0, 0, 0, 0.9);
    border-radius: 8px;
    padding: 16px;
    color: white;
    font-family: system-ui, sans-serif;
    font-size: 14px;
    min-width: 280px;
    max-height: 400px;
    overflow-y: auto;
  `;

  const currentStyle = manager.getStyle();

  // 标题
  const title = document.createElement('h3');
  title.textContent = '字幕设置';
  title.style.cssText = 'margin: 0 0 16px 0; font-size: 16px;';
  panel.appendChild(title);

  // 字体大小
  const fontSizeGroup = createSliderControl('字体大小', currentStyle.fontSize, 12, 48, 1, (value) => {
    manager.setStyle({ fontSize: value });
  });
  panel.appendChild(fontSizeGroup);

  // 颜色选择
  const colorGroup = createColorControl('字体颜色', currentStyle.color, (value) => {
    manager.setStyle({ color: value });
  });
  panel.appendChild(colorGroup);

  // 背景颜色
  const bgColorGroup = createColorControl('背景颜色', currentStyle.backgroundColor, (value) => {
    manager.setStyle({ backgroundColor: value });
  });
  panel.appendChild(bgColorGroup);

  // 透明度
  const opacityGroup = createSliderControl('透明度', currentStyle.opacity * 100, 0, 100, 5, (value) => {
    manager.setStyle({ opacity: value / 100 });
  });
  panel.appendChild(opacityGroup);

  // 时间偏移
  const offsetGroup = createSliderControl('时间偏移 (秒)', manager.getTimeOffset(), -10, 10, 0.1, (value) => {
    manager.setTimeOffset(value);
  });
  panel.appendChild(offsetGroup);

  // 预设选择
  const presetGroup = document.createElement('div');
  presetGroup.style.cssText = 'margin-bottom: 12px;';

  const presetLabel = document.createElement('label');
  presetLabel.textContent = '样式预设';
  presetLabel.style.cssText = 'display: block; margin-bottom: 8px;';
  presetGroup.appendChild(presetLabel);

  const presetSelect = document.createElement('select');
  presetSelect.style.cssText = `
    width: 100%;
    padding: 8px;
    border-radius: 4px;
    border: 1px solid rgba(255,255,255,0.2);
    background: rgba(255,255,255,0.1);
    color: white;
  `;

  Object.keys(SUBTITLE_STYLE_PRESETS).forEach(name => {
    const option = document.createElement('option');
    option.value = name;
    option.textContent = name.charAt(0).toUpperCase() + name.slice(1);
    presetSelect.appendChild(option);
  });

  presetSelect.addEventListener('change', () => {
    manager.applyPreset(presetSelect.value as keyof typeof SUBTITLE_STYLE_PRESETS);
  });

  presetGroup.appendChild(presetSelect);
  panel.appendChild(presetGroup);

  return panel;
}

function createSliderControl(
  label: string,
  initialValue: number,
  min: number,
  max: number,
  step: number,
  onChange: (value: number) => void
): HTMLDivElement {
  const group = document.createElement('div');
  group.style.cssText = 'margin-bottom: 12px;';

  const labelEl = document.createElement('label');
  labelEl.textContent = `${label}: ${initialValue}`;
  labelEl.style.cssText = 'display: block; margin-bottom: 8px;';
  group.appendChild(labelEl);

  const slider = document.createElement('input');
  slider.type = 'range';
  slider.min = String(min);
  slider.max = String(max);
  slider.step = String(step);
  slider.value = String(initialValue);
  slider.style.cssText = 'width: 100%; cursor: pointer;';

  slider.addEventListener('input', () => {
    const value = parseFloat(slider.value);
    labelEl.textContent = `${label}: ${value}`;
    onChange(value);
  });

  group.appendChild(slider);
  return group;
}

function createColorControl(
  label: string,
  initialValue: string,
  onChange: (value: string) => void
): HTMLDivElement {
  const group = document.createElement('div');
  group.style.cssText = 'margin-bottom: 12px;';

  const labelEl = document.createElement('label');
  labelEl.textContent = label;
  labelEl.style.cssText = 'display: block; margin-bottom: 8px;';
  group.appendChild(labelEl);

  const input = document.createElement('input');
  input.type = 'color';
  input.value = initialValue.startsWith('#') ? initialValue : '#ffffff';
  input.style.cssText = `
    width: 100%;
    height: 32px;
    cursor: pointer;
    border: none;
    border-radius: 4px;
  `;

  input.addEventListener('input', () => {
    onChange(input.value);
  });

  group.appendChild(input);
  return group;
}
