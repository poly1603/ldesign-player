/**
 * 视频滤镜功能
 * 支持亮度、对比度、饱和度、色相、模糊等 CSS 滤镜调节
 */

export interface VideoFilterValues {
  /** 亮度 (0-200, 默认 100) */
  brightness?: number;
  /** 对比度 (0-200, 默认 100) */
  contrast?: number;
  /** 饱和度 (0-200, 默认 100) */
  saturation?: number;
  /** 色相旋转 (0-360, 默认 0) */
  hueRotate?: number;
  /** 灰度 (0-100, 默认 0) */
  grayscale?: number;
  /** 反色 (0-100, 默认 0) */
  invert?: number;
  /** 棕褐色 (0-100, 默认 0) */
  sepia?: number;
  /** 模糊 (0-20, 默认 0, 单位 px) */
  blur?: number;
}

export interface VideoFilterPreset {
  name: string;
  displayName: string;
  values: VideoFilterValues;
}

export interface VideoFilterOptions {
  /** 视频元素 */
  video: HTMLVideoElement;
  /** 初始滤镜值 */
  initialValues?: VideoFilterValues;
  /** 是否保存到本地存储 */
  persist?: boolean;
  /** 本地存储 key */
  storageKey?: string;
}

// 预设滤镜
export const VIDEO_FILTER_PRESETS: VideoFilterPreset[] = [
  {
    name: 'normal',
    displayName: '正常',
    values: {},
  },
  {
    name: 'vivid',
    displayName: '鲜艳',
    values: { saturation: 130, contrast: 110 },
  },
  {
    name: 'warm',
    displayName: '暖色',
    values: { sepia: 20, brightness: 105 },
  },
  {
    name: 'cool',
    displayName: '冷色',
    values: { hueRotate: 180, saturation: 90 },
  },
  {
    name: 'dramatic',
    displayName: '戏剧',
    values: { contrast: 130, saturation: 110, brightness: 90 },
  },
  {
    name: 'mono',
    displayName: '黑白',
    values: { grayscale: 100 },
  },
  {
    name: 'vintage',
    displayName: '复古',
    values: { sepia: 40, contrast: 90, brightness: 95 },
  },
  {
    name: 'cinema',
    displayName: '电影',
    values: { contrast: 115, brightness: 95, saturation: 85 },
  },
];

export class VideoFilter {
  private video: HTMLVideoElement;
  private values: Required<VideoFilterValues>;
  private persist: boolean;
  private storageKey: string;
  private defaultValues: Required<VideoFilterValues> = {
    brightness: 100,
    contrast: 100,
    saturation: 100,
    hueRotate: 0,
    grayscale: 0,
    invert: 0,
    sepia: 0,
    blur: 0,
  };

  constructor(options: VideoFilterOptions) {
    this.video = options.video;
    this.persist = options.persist ?? false;
    this.storageKey = options.storageKey ?? 'ldesign-player-video-filter';

    // 尝试从本地存储恢复
    const savedValues = this.loadFromStorage();
    this.values = {
      ...this.defaultValues,
      ...savedValues,
      ...options.initialValues,
    };

    this.apply();
  }

  /**
   * 设置亮度 (0-200)
   */
  public setBrightness(value: number): void {
    this.values.brightness = this.clamp(value, 0, 200);
    this.apply();
  }

  /**
   * 设置对比度 (0-200)
   */
  public setContrast(value: number): void {
    this.values.contrast = this.clamp(value, 0, 200);
    this.apply();
  }

  /**
   * 设置饱和度 (0-200)
   */
  public setSaturation(value: number): void {
    this.values.saturation = this.clamp(value, 0, 200);
    this.apply();
  }

  /**
   * 设置色相旋转 (0-360)
   */
  public setHueRotate(value: number): void {
    this.values.hueRotate = this.clamp(value, 0, 360);
    this.apply();
  }

  /**
   * 设置灰度 (0-100)
   */
  public setGrayscale(value: number): void {
    this.values.grayscale = this.clamp(value, 0, 100);
    this.apply();
  }

  /**
   * 设置反色 (0-100)
   */
  public setInvert(value: number): void {
    this.values.invert = this.clamp(value, 0, 100);
    this.apply();
  }

  /**
   * 设置棕褐色 (0-100)
   */
  public setSepia(value: number): void {
    this.values.sepia = this.clamp(value, 0, 100);
    this.apply();
  }

  /**
   * 设置模糊 (0-20)
   */
  public setBlur(value: number): void {
    this.values.blur = this.clamp(value, 0, 20);
    this.apply();
  }

  /**
   * 批量设置滤镜值
   */
  public setValues(values: Partial<VideoFilterValues>): void {
    if (values.brightness !== undefined) this.values.brightness = this.clamp(values.brightness, 0, 200);
    if (values.contrast !== undefined) this.values.contrast = this.clamp(values.contrast, 0, 200);
    if (values.saturation !== undefined) this.values.saturation = this.clamp(values.saturation, 0, 200);
    if (values.hueRotate !== undefined) this.values.hueRotate = this.clamp(values.hueRotate, 0, 360);
    if (values.grayscale !== undefined) this.values.grayscale = this.clamp(values.grayscale, 0, 100);
    if (values.invert !== undefined) this.values.invert = this.clamp(values.invert, 0, 100);
    if (values.sepia !== undefined) this.values.sepia = this.clamp(values.sepia, 0, 100);
    if (values.blur !== undefined) this.values.blur = this.clamp(values.blur, 0, 20);
    this.apply();
  }

  /**
   * 应用预设
   */
  public applyPreset(presetName: string): void {
    const preset = VIDEO_FILTER_PRESETS.find(p => p.name === presetName);
    if (preset) {
      this.reset();
      this.setValues(preset.values);
    }
  }

  /**
   * 重置为默认值
   */
  public reset(): void {
    this.values = { ...this.defaultValues };
    this.apply();
  }

  /**
   * 获取当前值
   */
  public getValues(): Required<VideoFilterValues> {
    return { ...this.values };
  }

  /**
   * 获取当前滤镜 CSS 字符串
   */
  public getFilterString(): string {
    const filters: string[] = [];

    if (this.values.brightness !== 100) {
      filters.push(`brightness(${this.values.brightness / 100})`);
    }
    if (this.values.contrast !== 100) {
      filters.push(`contrast(${this.values.contrast / 100})`);
    }
    if (this.values.saturation !== 100) {
      filters.push(`saturate(${this.values.saturation / 100})`);
    }
    if (this.values.hueRotate !== 0) {
      filters.push(`hue-rotate(${this.values.hueRotate}deg)`);
    }
    if (this.values.grayscale !== 0) {
      filters.push(`grayscale(${this.values.grayscale / 100})`);
    }
    if (this.values.invert !== 0) {
      filters.push(`invert(${this.values.invert / 100})`);
    }
    if (this.values.sepia !== 0) {
      filters.push(`sepia(${this.values.sepia / 100})`);
    }
    if (this.values.blur !== 0) {
      filters.push(`blur(${this.values.blur}px)`);
    }

    return filters.length > 0 ? filters.join(' ') : 'none';
  }

  /**
   * 获取所有预设
   */
  public static getPresets(): VideoFilterPreset[] {
    return VIDEO_FILTER_PRESETS;
  }

  /**
   * 应用滤镜到视频元素
   */
  private apply(): void {
    this.video.style.filter = this.getFilterString();
    
    if (this.persist) {
      this.saveToStorage();
    }
  }

  /**
   * 保存到本地存储
   */
  private saveToStorage(): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.values));
    } catch (e) {
      console.debug('Failed to save video filter to storage:', e);
    }
  }

  /**
   * 从本地存储加载
   */
  private loadFromStorage(): Partial<VideoFilterValues> {
    if (!this.persist) return {};
    
    try {
      const saved = localStorage.getItem(this.storageKey);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.debug('Failed to load video filter from storage:', e);
    }
    return {};
  }

  /**
   * 限制值范围
   */
  private clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
  }

  /**
   * 销毁
   */
  public destroy(): void {
    this.video.style.filter = '';
  }
}

/**
 * 创建视频滤镜的便捷函数
 */
export function createVideoFilter(
  video: HTMLVideoElement,
  options?: Partial<Omit<VideoFilterOptions, 'video'>>
): VideoFilter {
  return new VideoFilter({
    video,
    ...options,
  });
}
