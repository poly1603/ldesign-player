/**
 * 自定义视频播放器类
 * 封装了完整的视频播放器 UI 和控制逻辑
 */

import '../styles/custom-video-player.css';
import * as LucideIcons from 'lucide';
import { ThemePackage } from '../themes/ThemePackage';
import { SpringFestivalTheme } from '../themes/SpringFestivalTheme';

export type ControlsVisibilityMode = 'always' | 'never' | 'hover';

export interface ControlsVisibilityConfig {
  /** 未播放时的显示模式：'always' 一直显示，'never' 不显示，'hover' 鼠标移上去显示（默认） */
  idle?: ControlsVisibilityMode;
  /** 播放中的显示模式：'always' 一直显示，'never' 不显示，'hover' 鼠标移上去显示（默认） */
  playing?: ControlsVisibilityMode;
}

export type ProgressBarPosition = 'top' | 'inline';

export type ThemeName = 'default' | 'spring-festival' | 'mid-autumn' | 'christmas';

export interface PlayerTheme {
  /** 主题名称 */
  name: string;
  /** 进度条配置 */
  progressBar?: {
    /** 进度条背景（CSS 背景值，如颜色、图片URL、渐变等） */
    background?: string;
    /** 进度条填充渐变色 [起始色, 结束色] */
    fillGradient?: [string, string];
    /** 进度条滑块图标（SVG 字符串或图片 URL） */
    thumbIcon?: string;
    /** 进度条滑块动画类名 */
    thumbAnimation?: string;
    /** 进度条高度 */
    height?: string;
  };
  /** 按钮图标配置（SVG 字符串或图片 URL） */
  icons?: {
    play?: string;
    pause?: string;
    volume?: string;
    muted?: string;
    fullscreen?: string;
    minimize?: string;
    speed?: string;
    pip?: string;
    loop?: string;
  };
  /** 颜色方案 */
  colors?: {
    /** 主色调 */
    primary?: string;
    /** 次色调 */
    secondary?: string;
    /** 控制按钮背景色 */
    controlBg?: string;
    /** 控制按钮悬停背景色 */
    controlBgHover?: string;
  };
  /** 主题 CSS 类名 */
  className?: string;
}

export interface CustomVideoPlayerOptions {
  container: HTMLElement | string;
  src?: string;
  themeColor?: string;
  themeColorSecondary?: string;
  autoplay?: boolean;
  preload?: 'none' | 'metadata' | 'auto';
  width?: number | string;
  height?: number | string;
  aspectRatio?: string; // 例如 "16:9", "4:3"
  poster?: string | boolean | number; // 封面图：字符串URL，true/undefined自动截取第1秒，数字表示截取第几秒（单位：秒）
  /** 工具栏显示/隐藏配置 */
  controlsVisibility?: ControlsVisibilityConfig;
  /** 进度条位置：'top' 顶部显示（默认），'inline' 内联显示（播放按钮后面，时间前面） */
  progressBarPosition?: ProgressBarPosition;
  /** 圆角大小，支持数字（px）或字符串（如 '8px', '50%'），默认为 0 */
  borderRadius?: number | string;
  /** 播放器主题：预设主题名称或自定义主题对象 */
  theme?: ThemeName | PlayerTheme;
  /** 主题包：使用 Canvas 绘制的主题包 */
  themePackage?: ThemePackage | ThemeName;
}

export class CustomVideoPlayer {
  private container: HTMLElement;
  private video: HTMLVideoElement;
  private playerContainer: HTMLElement;
  private customControls: HTMLElement;
  private playPauseBtn: HTMLElement;
  private centerPlayBtn: HTMLElement;
  private progressContainer: HTMLElement;
  private progressBar: HTMLElement;
  private bufferBar: HTMLElement;
  private progressPreview: HTMLElement;
  private progressPreviewImage: HTMLImageElement;
  private progressPreviewTime: HTMLElement;
  private currentTimeDisplay: HTMLElement;
  private durationDisplay: HTMLElement;
  private volumeBtn: HTMLElement;
  private volumeSliderPopup: HTMLElement;
  private volumeSliderPopupContainer: HTMLElement;
  private volumeSliderPopupBar: HTMLElement;
  private fullscreenBtn: HTMLElement;
  private pageFullscreenBtn: HTMLElement;
  private loadingSpinner: HTMLElement;
  private speedBtn: HTMLElement;
  private speedMenu: HTMLElement;
  private pipBtn: HTMLElement;
  private speedOptions: NodeListOf<HTMLElement>;

  private isDragging = false;
  private isDraggingVolume = false;
  private controlsTimeout: number | null = null;
  private currentSpeed = 1;
  private options: CustomVideoPlayerOptions;
  private previewThumbnailCache: Map<number, string> = new Map(); // 缓存缩略图，key为时间（秒）
  private previewThumbnailTimeout: number | null = null; // 缩略图预览的定时器
  private previewThumbnailLoading: number | null = null; // 当前正在加载的缩略图时间
  private thumbnailVideo: HTMLVideoElement | null = null; // 用于截取缩略图的隐藏视频元素
  private posterSettingInProgress: boolean = false; // 标记poster是否正在设置中
  private posterOverlay: HTMLElement | null = null; // Poster显示层
  private miniProgressBar: HTMLElement | null = null; // 简单的底部进度条
  private currentTheme: PlayerTheme | null = null; // 当前主题
  private currentThemePackage: ThemePackage | null = null; // 当前主题包
  private canvasCache: Map<string, HTMLCanvasElement> = new Map(); // Canvas 缓存

  constructor(options: CustomVideoPlayerOptions) {
    this.options = options;
    
    // 获取容器
    if (typeof options.container === 'string') {
      const el = document.querySelector(options.container);
      if (!el) throw new Error(`Container not found: ${options.container}`);
      this.container = el as HTMLElement;
    } else {
      this.container = options.container;
    }

    // 创建播放器 DOM
    this.createPlayerDOM();

    // 初始化事件监听
    this.initEventListeners();

    // 设置初始状态
    this.initState();
  }

  private createPlayerDOM(): void {
    // 创建播放器容器
    this.playerContainer = document.createElement('div');
    this.playerContainer.className = 'custom-video-player-container';
    
    const progressBarPosition = this.options.progressBarPosition || 'top';
    const isInline = progressBarPosition === 'inline';
    
    // 根据配置生成不同的HTML结构
    const progressContainerHTML = `
      <div class="progress-container ${isInline ? 'progress-inline' : 'progress-top'}" id="progress-container">
        <div class="buffer-bar" id="buffer-bar"></div>
        <div class="progress-bar" id="progress-bar"></div>
        <div class="progress-preview" id="progress-preview">
          <img class="progress-preview-image" id="progress-preview-image" alt="预览">
          <div class="progress-preview-time" id="progress-preview-time">0:00</div>
        </div>
      </div>
    `;
    
    const controlsLeftHTML = isInline
      ? `
        <div class="controls-left">
          <button class="play-pause-btn" id="play-pause-btn" aria-label="播放/暂停">
            <i data-lucide="play"></i>
          </button>
          ${progressContainerHTML}
          <div class="time-display">
            <span id="current-time">0:00</span> / <span id="duration">0:00</span>
          </div>
        </div>
      `
      : `
        <div class="controls-left">
          <button class="play-pause-btn" id="play-pause-btn" aria-label="播放/暂停">
            <i data-lucide="play"></i>
          </button>
          <div class="time-display">
            <span id="current-time">0:00</span> / <span id="duration">0:00</span>
          </div>
        </div>
      `;
    
    this.playerContainer.innerHTML = `
      <video id="custom-video-element" preload="${this.options.preload || 'metadata'}" crossOrigin="anonymous"></video>
      <div class="video-poster-overlay" id="video-poster-overlay"></div>
      <div class="loading-spinner" id="loading-spinner"></div>
      <button class="center-play-btn" id="center-play-btn" aria-label="播放">
        <i data-lucide="play"></i>
      </button>
      <div class="mini-progress-bar" id="mini-progress-bar">
        <div class="mini-progress-bar-fill" id="mini-progress-bar-fill"></div>
      </div>
      <div class="custom-controls" id="custom-controls">
        ${!isInline ? progressContainerHTML : ''}
        <div class="controls-row">
          ${controlsLeftHTML}
          <div class="controls-right">
            <div style="position: relative;">
              <button class="speed-btn" id="speed-btn" aria-label="播放速度">
                <i data-lucide="gauge"></i>
              </button>
              <div class="speed-menu" id="speed-menu">
                <div class="speed-option" data-speed="0.5">0.5x<i class="speed-option-icon" data-lucide="check"></i></div>
                <div class="speed-option" data-speed="0.75">0.75x<i class="speed-option-icon" data-lucide="check"></i></div>
                <div class="speed-option active" data-speed="1">1x<i class="speed-option-icon" data-lucide="check"></i></div>
                <div class="speed-option" data-speed="1.25">1.25x<i class="speed-option-icon" data-lucide="check"></i></div>
                <div class="speed-option" data-speed="1.5">1.5x<i class="speed-option-icon" data-lucide="check"></i></div>
                <div class="speed-option" data-speed="2">2x<i class="speed-option-icon" data-lucide="check"></i></div>
              </div>
            </div>
            <div class="volume-control">
              <button class="volume-btn" id="volume-btn" aria-label="音量">
                <i data-lucide="volume-2"></i>
              </button>
              <div class="volume-slider-popup" id="volume-slider-popup">
                <div class="volume-slider-popup-container" id="volume-slider-popup-container">
                  <div class="volume-slider-popup-bar" id="volume-slider-popup-bar"></div>
                </div>
              </div>
            </div>
            <button class="pip-btn" id="pip-btn" aria-label="画中画" style="display: none;">
              <i data-lucide="picture-in-picture"></i>
            </button>
            <button class="page-fullscreen-btn" id="page-fullscreen-btn" aria-label="页面全屏">
              <i data-lucide="maximize-2"></i>
            </button>
            <button class="fullscreen-btn" id="fullscreen-btn" aria-label="全屏">
              <i data-lucide="maximize"></i>
            </button>
          </div>
        </div>
      </div>
    `;

    this.container.appendChild(this.playerContainer);

    // 获取所有元素引用
    this.video = this.playerContainer.querySelector('#custom-video-element') as HTMLVideoElement;
    this.customControls = this.playerContainer.querySelector('#custom-controls') as HTMLElement;
    this.playPauseBtn = this.playerContainer.querySelector('#play-pause-btn') as HTMLElement;
    this.centerPlayBtn = this.playerContainer.querySelector('#center-play-btn') as HTMLElement;
    this.progressContainer = this.playerContainer.querySelector('#progress-container') as HTMLElement;
    this.progressBar = this.playerContainer.querySelector('#progress-bar') as HTMLElement;
    this.bufferBar = this.playerContainer.querySelector('#buffer-bar') as HTMLElement;
        this.progressPreview = this.playerContainer.querySelector('#progress-preview') as HTMLElement;
        this.progressPreviewImage = this.playerContainer.querySelector('#progress-preview-image') as HTMLImageElement;
        this.progressPreviewTime = this.playerContainer.querySelector('#progress-preview-time') as HTMLElement;
        
        // 确保预览容器初始状态正确
        this.progressPreview.style.display = 'block';
        this.progressPreviewImage.style.display = 'block';
    this.currentTimeDisplay = this.playerContainer.querySelector('#current-time') as HTMLElement;
    this.durationDisplay = this.playerContainer.querySelector('#duration') as HTMLElement;
    this.volumeBtn = this.playerContainer.querySelector('#volume-btn') as HTMLElement;
    this.volumeSliderPopup = this.playerContainer.querySelector('#volume-slider-popup') as HTMLElement;
    this.volumeSliderPopupContainer = this.playerContainer.querySelector('#volume-slider-popup-container') as HTMLElement;
    this.volumeSliderPopupBar = this.playerContainer.querySelector('#volume-slider-popup-bar') as HTMLElement;
    this.fullscreenBtn = this.playerContainer.querySelector('#fullscreen-btn') as HTMLElement;
    this.pageFullscreenBtn = this.playerContainer.querySelector('#page-fullscreen-btn') as HTMLElement;
    this.loadingSpinner = this.playerContainer.querySelector('#loading-spinner') as HTMLElement;
    this.posterOverlay = this.playerContainer.querySelector('#video-poster-overlay') as HTMLElement;
    this.miniProgressBar = this.playerContainer.querySelector('#mini-progress-bar') as HTMLElement;
    this.speedBtn = this.playerContainer.querySelector('#speed-btn') as HTMLElement;
    this.speedMenu = this.playerContainer.querySelector('#speed-menu') as HTMLElement;
    this.pipBtn = this.playerContainer.querySelector('#pip-btn') as HTMLElement;
    this.speedOptions = this.playerContainer.querySelectorAll('.speed-option');

    // 设置视频源
    if (this.options.src) {
      // 设置 crossOrigin 以支持跨域视频帧截取
      this.video.crossOrigin = 'anonymous';
      this.video.src = this.options.src;
    }

    // 如果poster需要自动截取，先隐藏视频元素避免闪烁
    const poster = this.options.poster;
    if (poster === true || poster === undefined || typeof poster === 'number') {
      // 先设置黑色背景，完全隐藏视频元素避免闪烁
      this.video.style.backgroundColor = '#000';
      this.video.style.visibility = 'hidden';
      this.video.style.opacity = '0';
    }

    // 设置封面图
    this.setPoster();

    // 设置尺寸和比例
    this.setPlayerSize();

    // 设置圆角
    this.setBorderRadius();

    // 应用主题
    this.applyTheme();

    // 应用主题包（如果配置了）
    this.applyThemePackage();

    // 设置主题色（如果未使用主题和主题包，使用自定义主题色）
    if (!this.options.theme && !this.options.themePackage) {
      if (this.options.themeColor) {
        document.documentElement.style.setProperty('--theme-color', this.options.themeColor);
      }
      if (this.options.themeColorSecondary) {
        document.documentElement.style.setProperty('--theme-color-secondary', this.options.themeColorSecondary);
      }
    }

    // 初始化图标 - 等待 DOM 完全渲染
    requestAnimationFrame(() => {
      this.updateIcons();
      // 初始化速度菜单中的 check 图标
      this.initSpeedMenuIcons();
    });
  }

  private setPlayerSize(): void {
    // 设置容器宽度
    if (this.options.width) {
      if (typeof this.options.width === 'number') {
        this.playerContainer.style.width = `${this.options.width}px`;
      } else {
        this.playerContainer.style.width = this.options.width;
      }
    } else {
      // 默认铺满容器
      this.playerContainer.style.width = '100%';
    }

    // 设置容器高度
    if (this.options.height) {
      if (typeof this.options.height === 'number') {
        this.playerContainer.style.height = `${this.options.height}px`;
        this.video.style.height = `${this.options.height}px`;
        this.video.style.width = '100%';
      } else {
        this.playerContainer.style.height = this.options.height;
        this.video.style.height = this.options.height;
        this.video.style.width = '100%';
      }
    } else if (this.options.aspectRatio) {
      // 如果设置了比例，使用 aspect-ratio
      const [width, height] = this.options.aspectRatio.split(':').map(Number);
      this.playerContainer.style.aspectRatio = `${width} / ${height}`;
      this.video.style.width = '100%';
      this.video.style.height = 'auto';
    } else {
      // 默认：宽度铺满，高度根据视频比例自动调整
      this.video.style.width = '100%';
      this.video.style.height = 'auto';
    }
  }

  private setBorderRadius(): void {
    const borderRadius = this.options.borderRadius ?? 0;
    let borderRadiusValue: string;
    
    if (typeof borderRadius === 'number') {
      borderRadiusValue = `${borderRadius}px`;
    } else {
      borderRadiusValue = borderRadius;
    }

    // 设置容器圆角
    this.playerContainer.style.borderRadius = borderRadiusValue;
    
    // 设置视频元素圆角（需要配合 overflow: hidden）
    this.video.style.borderRadius = borderRadiusValue;
    
    // 设置 poster overlay 圆角
    if (this.posterOverlay) {
      this.posterOverlay.style.borderRadius = borderRadiusValue;
    }
  }

  /**
   * 获取预设主题
   */
  private getPresetTheme(themeName: ThemeName): PlayerTheme {
    const themes: Record<ThemeName, PlayerTheme> = {
      default: {
        name: 'default'
      },
      'spring-festival': {
        name: 'spring-festival',
        className: 'theme-spring-festival',
        progressBar: {
          background: 'linear-gradient(90deg, #ff6b6b 0%, #ff8e8e 50%, #ff6b6b 100%)',
          fillGradient: ['#ff4757', '#ff6348'],
          thumbAnimation: 'firecracker-explode',
          height: '6px'
        },
        colors: {
          primary: '#ff4757',
          secondary: '#ff6348',
          controlBg: 'rgba(255, 71, 87, 0.9)',
          controlBgHover: 'rgba(255, 71, 87, 1)'
        },
        icons: {
          play: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>',
          pause: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/></svg>'
        }
      },
      'mid-autumn': {
        name: 'mid-autumn',
        className: 'theme-mid-autumn',
        progressBar: {
          background: 'linear-gradient(90deg, #ffd700 0%, #ffed4e 50%, #ffd700 100%)',
          fillGradient: ['#ffd700', '#ffed4e'],
          height: '6px'
        },
        colors: {
          primary: '#ffd700',
          secondary: '#ffed4e',
          controlBg: 'rgba(255, 215, 0, 0.9)',
          controlBgHover: 'rgba(255, 215, 0, 1)'
        }
      },
      'christmas': {
        name: 'christmas',
        className: 'theme-christmas',
        progressBar: {
          background: 'linear-gradient(90deg, #c41e3a 0%, #228b22 50%, #c41e3a 100%)',
          fillGradient: ['#c41e3a', '#228b22'],
          height: '6px'
        },
        colors: {
          primary: '#c41e3a',
          secondary: '#228b22',
          controlBg: 'rgba(196, 30, 58, 0.9)',
          controlBgHover: 'rgba(196, 30, 58, 1)'
        }
      }
    };
    return themes[themeName] || themes.default;
  }

  /**
   * 应用主题
   */
  private applyTheme(): void {
    const themeOption = this.options.theme;
    if (!themeOption) {
      return;
    }

    let theme: PlayerTheme;
    if (typeof themeOption === 'string') {
      theme = this.getPresetTheme(themeOption);
    } else {
      theme = themeOption;
    }

    this.currentTheme = theme;

    // 移除之前的主题类名
    const themeClasses = ['theme-spring-festival', 'theme-mid-autumn', 'theme-christmas'];
    themeClasses.forEach(className => {
      this.playerContainer.classList.remove(className);
    });

    // 应用主题类名
    if (theme.className) {
      this.playerContainer.classList.add(theme.className);
    }

    // 应用颜色方案
    if (theme.colors) {
      if (theme.colors.primary) {
        document.documentElement.style.setProperty('--theme-color', theme.colors.primary);
      }
      if (theme.colors.secondary) {
        document.documentElement.style.setProperty('--theme-color-secondary', theme.colors.secondary);
      }
      if (theme.colors.controlBg) {
        document.documentElement.style.setProperty('--control-bg', theme.colors.controlBg);
      }
      if (theme.colors.controlBgHover) {
        document.documentElement.style.setProperty('--control-bg-hover', theme.colors.controlBgHover);
      }
    }

    // 应用进度条样式
    if (theme.progressBar) {
      if (theme.progressBar.background) {
        this.progressContainer.style.background = theme.progressBar.background;
      }
      if (theme.progressBar.fillGradient) {
        const [start, end] = theme.progressBar.fillGradient;
        this.progressBar.style.background = `linear-gradient(90deg, ${start} 0%, ${end} 100%)`;
        // 同时更新简单进度条
        if (this.miniProgressBar) {
          const fill = this.miniProgressBar.querySelector('#mini-progress-bar-fill') as HTMLElement;
          if (fill) {
            fill.style.background = `linear-gradient(90deg, ${start} 0%, ${end} 100%)`;
          }
        }
      }
      if (theme.progressBar.height) {
        this.progressContainer.style.height = theme.progressBar.height;
      }
      if (theme.progressBar.thumbAnimation) {
        this.progressBar.classList.add(theme.progressBar.thumbAnimation);
      }
    }

    // 应用图标（如果需要）
    // 注意：当前使用 Lucide 图标库，如果需要完全自定义图标，需要修改图标更新逻辑
  }

  /**
   * 设置主题
   */
  public setTheme(theme: ThemeName | PlayerTheme): void {
    this.options.theme = theme;
    this.applyTheme();
  }

  /**
   * 获取预设主题包
   */
  private getPresetThemePackage(themeName: ThemeName): ThemePackage | null {
    switch (themeName) {
      case 'spring-festival':
        return new SpringFestivalTheme();
      default:
        return null;
    }
  }

  /**
   * 应用主题包
   */
  private applyThemePackage(): void {
    const themePackageOption = this.options.themePackage;
    if (!themePackageOption) {
      return;
    }

    let themePackage: ThemePackage | null;
    if (typeof themePackageOption === 'string') {
      themePackage = this.getPresetThemePackage(themePackageOption);
    } else {
      themePackage = themePackageOption;
    }

    if (!themePackage) {
      return;
    }

    this.currentThemePackage = themePackage;
    this.canvasCache.clear();

    // 应用颜色方案
    const colors = themePackage.getColors();
    document.documentElement.style.setProperty('--theme-color', colors.primary);
    document.documentElement.style.setProperty('--theme-color-secondary', colors.secondary);
    document.documentElement.style.setProperty('--control-bg', colors.controlBg);
    document.documentElement.style.setProperty('--control-bg-hover', colors.controlBgHover);

    // 等待 DOM 渲染完成后应用 Canvas 绘制的图标
    requestAnimationFrame(() => {
      this.applyCanvasIcons(themePackage!);
      this.applyCanvasProgressBar(themePackage!);
    });
  }

  /**
   * 应用 Canvas 绘制的图标
   */
  private applyCanvasIcons(themePackage: ThemePackage): void {
    // 播放/暂停按钮
    if (this.playPauseBtn) {
      this.updateButtonIcon(this.playPauseBtn, () => {
        const canvas = document.createElement('canvas');
        const isPaused = this.video ? this.video.paused : true;
        if (isPaused) {
          themePackage.drawPlayButton(canvas, 50, false);
        } else {
          themePackage.drawPauseButton(canvas, 50, false);
        }
        return canvas.toDataURL();
      });
    }

    if (this.centerPlayBtn) {
      this.updateButtonIcon(this.centerPlayBtn, () => {
        const canvas = document.createElement('canvas');
        themePackage.drawPlayButton(canvas, 80, false);
        return canvas.toDataURL();
      });
    }

    // 音量按钮
    if (this.volumeBtn) {
      this.updateButtonIcon(this.volumeBtn, () => {
        const canvas = document.createElement('canvas');
        const volume = this.video ? this.video.volume : 1;
        const isMuted = this.video ? this.video.muted : false;
        themePackage.drawVolumeButton(canvas, 50, volume, isMuted, false);
        return canvas.toDataURL();
      });
    }

    // 全屏按钮
    if (this.fullscreenBtn) {
      this.updateButtonIcon(this.fullscreenBtn, () => {
        const canvas = document.createElement('canvas');
        const isFullscreen = document.fullscreenElement === this.playerContainer;
        themePackage.drawFullscreenButton(canvas, 50, isFullscreen, false);
        return canvas.toDataURL();
      });
    }

    // 页面全屏按钮
    if (this.pageFullscreenBtn) {
      this.updateButtonIcon(this.pageFullscreenBtn, () => {
        const canvas = document.createElement('canvas');
        const isPageFullscreen = document.fullscreenElement === document.documentElement;
        themePackage.drawPageFullscreenButton(canvas, 50, isPageFullscreen, false);
        return canvas.toDataURL();
      });
    }

    // 速度按钮
    if (this.speedBtn) {
      this.updateButtonIcon(this.speedBtn, () => {
        const canvas = document.createElement('canvas');
        themePackage.drawSpeedButton(canvas, 50, this.currentSpeed, false);
        return canvas.toDataURL();
      });
    }

    // 画中画按钮
    if (this.pipBtn) {
      this.updateButtonIcon(this.pipBtn, () => {
        const canvas = document.createElement('canvas');
        themePackage.drawPipButton(canvas, 50, false);
        return canvas.toDataURL();
      });
    }
  }

  /**
   * 更新按钮图标（使用 Canvas 绘制的图片）
   */
  private updateButtonIcon(button: HTMLElement, getImageData: () => string): void {
    // 先查找是否已有 img 标签（主题包图标）
    let img = button.querySelector('img') as HTMLImageElement;
    if (img) {
      // 如果已有 img，直接更新 src
      img.src = getImageData();
      return;
    }
    
    // 如果没有 img，查找 SVG 或 i 标签并替换
    const icon = button.querySelector('i[data-lucide]') || button.querySelector('svg');
    if (icon) {
      img = document.createElement('img');
      img.src = getImageData();
      img.style.width = '100%';
      img.style.height = '100%';
      img.style.objectFit = 'contain';
      icon.replaceWith(img);
    }
  }

  /**
   * 应用 Canvas 绘制的进度条
   */
  private applyCanvasProgressBar(themePackage: ThemePackage): void {
    if (!this.progressContainer || !this.progressBar) {
      return;
    }

    // 隐藏原有的进度条样式
    this.progressBar.style.background = 'transparent';
    this.progressContainer.style.background = 'transparent';
    
    // 隐藏 CSS ::after 滑块（使用主题包时）
    this.progressBar.classList.add('theme-package-thumb');

    // 创建背景 Canvas
    const bgCanvas = document.createElement('canvas');
    bgCanvas.className = 'theme-progress-bg-canvas';
    bgCanvas.style.position = 'absolute';
    bgCanvas.style.top = '0';
    bgCanvas.style.left = '0';
    bgCanvas.style.width = '100%';
    bgCanvas.style.height = '100%';
    bgCanvas.style.pointerEvents = 'none';
    bgCanvas.style.zIndex = '0';

    const updateBackground = () => {
      const rect = this.progressContainer.getBoundingClientRect();
      bgCanvas.width = rect.width;
      bgCanvas.height = rect.height;
      themePackage.drawProgressBarBackground(bgCanvas, rect.width, rect.height);
    };

    updateBackground();
    this.progressContainer.insertBefore(bgCanvas, this.progressContainer.firstChild);

    // 创建填充 Canvas
    const fillCanvas = document.createElement('canvas');
    fillCanvas.className = 'theme-progress-fill-canvas';
    fillCanvas.style.position = 'absolute';
    fillCanvas.style.top = '0';
    fillCanvas.style.left = '0';
    fillCanvas.style.height = '100%';
    fillCanvas.style.pointerEvents = 'none';
    fillCanvas.style.zIndex = '2';

    const updateFill = () => {
      const rect = this.progressContainer.getBoundingClientRect();
      const progress = this.video.duration ? this.video.currentTime / this.video.duration : 0;
      const fillWidth = rect.width * progress;
      fillCanvas.width = fillWidth;
      fillCanvas.height = rect.height;
      fillCanvas.style.width = `${fillWidth}px`;
      if (fillWidth > 0) {
        themePackage.drawProgressBarFill(fillCanvas, fillWidth, rect.height, progress);
      }
    };

    updateFill();
    this.progressContainer.insertBefore(fillCanvas, this.progressBar);

    // 创建当前播放位置的滑块 Canvas
    const thumbCanvas = document.createElement('canvas');
    thumbCanvas.className = 'theme-progress-thumb-canvas';
    thumbCanvas.style.position = 'absolute';
    thumbCanvas.style.top = '50%';
    thumbCanvas.style.transform = 'translateY(-50%)';
    thumbCanvas.style.pointerEvents = 'none';
    thumbCanvas.style.zIndex = '3';
    thumbCanvas.style.transition = 'opacity 0.2s';
    
    // 创建预览位置的滑块 Canvas（鼠标悬停时显示）
    const previewThumbCanvas = document.createElement('canvas');
    previewThumbCanvas.className = 'theme-progress-preview-thumb-canvas';
    previewThumbCanvas.style.position = 'absolute';
    previewThumbCanvas.style.top = '50%';
    previewThumbCanvas.style.transform = 'translateY(-50%)';
    previewThumbCanvas.style.pointerEvents = 'none';
    previewThumbCanvas.style.zIndex = '4';
    previewThumbCanvas.style.transition = 'opacity 0.2s';
    previewThumbCanvas.style.opacity = '0';
    
    const thumbSize = 16; // 默认滑块大小
    thumbCanvas.width = thumbSize;
    thumbCanvas.height = thumbSize;
    thumbCanvas.style.width = `${thumbSize}px`;
    thumbCanvas.style.height = `${thumbSize}px`;
    
    previewThumbCanvas.width = thumbSize;
    previewThumbCanvas.height = thumbSize;
    previewThumbCanvas.style.width = `${thumbSize}px`;
    previewThumbCanvas.style.height = `${thumbSize}px`;
    
    let isHovering = false;
    let hoverTimeout: number | null = null;
    let previewProgress = 0; // 预览位置的进度
    
    // 更新当前播放位置的滑块
    const updateThumb = (progress: number) => {
      const rect = this.progressContainer.getBoundingClientRect();
      const thumbX = rect.width * progress;
      thumbCanvas.style.left = `${thumbX}px`;
      thumbCanvas.style.marginLeft = `-${thumbSize / 2}px`;
      
      // 绘制滑块（当前播放位置，不使用悬停效果）
      themePackage.drawProgressBarThumb(thumbCanvas, thumbSize, progress, false);
      
      // 显示/隐藏滑块：播放时显示（稍微透明），拖拽时完全显示
      const isPlaying = !this.video.paused;
      if (this.isDragging) {
        thumbCanvas.style.opacity = '1';
      } else if (isPlaying) {
        // 播放时显示，但稍微透明
        thumbCanvas.style.opacity = '0.7';
      } else {
        // 暂停时隐藏
        thumbCanvas.style.opacity = '0';
      }
    };
    
    // 更新预览位置的滑块（鼠标悬停位置）
    const updatePreviewThumb = (progress: number) => {
      previewProgress = progress;
      const rect = this.progressContainer.getBoundingClientRect();
      const thumbX = rect.width * progress;
      previewThumbCanvas.style.left = `${thumbX}px`;
      previewThumbCanvas.style.marginLeft = `-${thumbSize / 2}px`;
      
      // 绘制预览滑块（使用悬停效果）
      themePackage.drawProgressBarThumb(previewThumbCanvas, thumbSize, progress, true);
      
      // 只在悬停时显示预览滑块
      if (isHovering && !this.isDragging) {
        previewThumbCanvas.style.opacity = '1';
      } else {
        previewThumbCanvas.style.opacity = '0';
      }
    };
    
    // 初始更新
    const initialProgress = this.video.duration ? this.video.currentTime / this.video.duration : 0;
    updateThumb(initialProgress);
    
    this.progressContainer.appendChild(thumbCanvas);
    this.progressContainer.appendChild(previewThumbCanvas);
    
    // 监听进度条悬停
    this.progressContainer.addEventListener('mouseenter', () => {
      isHovering = true;
      if (hoverTimeout) {
        clearTimeout(hoverTimeout);
      }
    });
    
    this.progressContainer.addEventListener('mouseleave', () => {
      isHovering = false;
      previewThumbCanvas.style.opacity = '0';
      if (!this.isDragging) {
        hoverTimeout = window.setTimeout(() => {
          const progress = this.video.duration ? this.video.currentTime / this.video.duration : 0;
          updateThumb(progress);
        }, 200);
      }
    });
    
    // 注意：mousemove 事件监听已在 initEventListeners 中处理，这里不需要重复添加
    // 滑块位置更新会在 updateProgress 和 seekTo 中通过 _updateProgressThumb 调用

    // 保存更新函数，在 updateProgress 中调用
    (this as any)._updateProgressFill = updateFill;
    // 更新当前播放位置的滑块
    (this as any)._updateProgressThumb = (progress: number) => {
      updateThumb(progress);
    };
    // 更新预览位置的滑块（鼠标悬停位置）
    (this as any)._updatePreviewThumb = (progress: number) => {
      updatePreviewThumb(progress);
    };
    // 保存悬停状态，供外部访问
    (this as any)._progressThumbIsHovering = () => isHovering;

    // 监听窗口大小变化
    const resizeObserver = new ResizeObserver(() => {
      updateBackground();
      updateFill();
      const progress = this.video.duration ? this.video.currentTime / this.video.duration : 0;
      updateThumb(progress);
      if (isHovering) {
        updatePreviewThumb(previewProgress);
      }
    });
    resizeObserver.observe(this.progressContainer);
  }

  /**
   * 设置主题包
   */
  public setThemePackage(themePackage: ThemePackage | ThemeName): void {
    this.options.themePackage = themePackage;
    this.applyThemePackage();
  }

  private setPoster(): void {
    const poster = this.options.poster;
    
    if (typeof poster === 'string') {
      // 如果设置了字符串 URL，直接使用
      this.video.poster = poster;
      // 同时设置背景图片作为备用显示
      this.video.style.backgroundImage = `url(${poster})`;
      this.video.style.backgroundSize = 'cover';
      this.video.style.backgroundPosition = 'center';
      this.video.style.backgroundRepeat = 'no-repeat';
      // 设置poster overlay
      if (this.posterOverlay) {
        this.posterOverlay.style.backgroundImage = `url(${poster})`;
        this.posterOverlay.classList.add('show');
      }
      // 确保视频可见
      this.video.style.visibility = 'visible';
      this.video.style.opacity = '1';
    } else if (poster === false) {
      // 如果明确设置为 false，不设置 poster
      this.video.poster = '';
      this.video.style.backgroundImage = '';
      // 隐藏poster overlay
      if (this.posterOverlay) {
        this.posterOverlay.classList.remove('show');
      }
      // 确保视频可见
      this.video.style.visibility = 'visible';
      this.video.style.opacity = '1';
    }
    // 如果 poster 是 true、undefined 或数字，在 loadedmetadata 事件中处理
  }

  private async handlePosterCapture(timeInSeconds: number): Promise<void> {
    // 如果poster正在设置中，直接返回，避免重复执行
    if (this.posterSettingInProgress) {
      return;
    }
    
    // 如果poster已经设置，直接返回
    if (this.video.poster) {
      this.video.style.visibility = 'visible';
      this.video.style.opacity = '1';
      return;
    }
    
    this.posterSettingInProgress = true;
    
    try {
      // 确保视频有 duration 和尺寸信息
      if (!this.video.duration || isNaN(this.video.duration) || !this.video.videoWidth || !this.video.videoHeight) {
        // 如果信息不完整，等待一下再重试
        await new Promise(resolve => setTimeout(resolve, 200));
        if (!this.video.duration || isNaN(this.video.duration) || !this.video.videoWidth || !this.video.videoHeight) {
          console.warn('Video metadata not ready for poster capture');
          // 即使metadata不完整，也要恢复可见性
          this.video.style.visibility = 'visible';
          this.video.style.opacity = '1';
          
          // 标记poster设置完成
          this.posterSettingInProgress = false;
          return;
        }
      }
      
      // 确保视频暂停
      this.video.pause();
      
      // 保存当前时间，以便恢复
      const originalTime = this.video.currentTime;
      
      // 确保视频暂停在时间 0，这样 poster 才会显示
      this.video.pause();
      if (Math.abs(this.video.currentTime) > 0.1) {
        await new Promise<void>((resolve) => {
          const onSeeked = () => {
            this.video.removeEventListener('seeked', onSeeked);
            resolve();
          };
          this.video.addEventListener('seeked', onSeeked);
          this.video.currentTime = 0;
          
          // 超时保护
          setTimeout(() => {
            this.video.removeEventListener('seeked', onSeeked);
            resolve();
          }, 1000);
        });
      } else {
        this.video.currentTime = 0;
      }
      
      // 直接调用 captureVideoFrame，它会处理跳转到指定时间
      const posterDataUrl = await this.captureVideoFrame(timeInSeconds);
      if (posterDataUrl) {
        console.log('Poster captured, setting poster attribute');
        
        // 先设置背景图片，确保立即显示
        this.video.style.backgroundImage = `url(${posterDataUrl})`;
        this.video.style.backgroundSize = 'cover';
        this.video.style.backgroundPosition = 'center';
        this.video.style.backgroundRepeat = 'no-repeat';
        
        // 设置poster overlay的背景图片
        if (this.posterOverlay) {
          this.posterOverlay.style.backgroundImage = `url(${posterDataUrl})`;
          this.posterOverlay.classList.add('show');
        }
        
        // 设置 poster 属性
        this.video.poster = posterDataUrl;
        
        // 确保视频暂停在时间 0
        this.video.pause();
        this.video.currentTime = 0;
        
        // 等待视频跳转到时间0
        await new Promise<void>((resolve) => {
          const onSeeked = () => {
            this.video.removeEventListener('seeked', onSeeked);
            resolve();
          };
          this.video.addEventListener('seeked', onSeeked);
          setTimeout(() => {
            this.video.removeEventListener('seeked', onSeeked);
            resolve();
          }, 500);
        });
        
        // 再次确保视频暂停在时间 0
        this.video.pause();
        this.video.currentTime = 0;
        
        // 等待 poster 设置完成
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // 检查 poster 是否设置成功
        if (this.video.poster) {
          console.log('Poster set successfully:', this.video.poster.substring(0, 50) + '...');
        }
        
        // 恢复视频元素可见性
        this.video.style.visibility = 'visible';
        this.video.style.opacity = '1';
        
        // 移除playing类，确保poster显示
        this.video.classList.remove('playing');
        
        // 标记poster设置完成
        this.posterSettingInProgress = false;
      } else {
        console.warn('Failed to capture poster frame');
        // 如果截取失败，恢复原始时间
        if (Math.abs(this.video.currentTime - originalTime) > 0.1) {
          this.video.currentTime = originalTime;
        }
        // 即使失败也要恢复可见性
        this.video.style.visibility = 'visible';
        this.video.style.opacity = '1';
        
        // 标记poster设置完成
        this.posterSettingInProgress = false;
      }
    } catch (error) {
      console.error('Error setting poster:', error);
      // 即使出错也要恢复可见性
      this.video.style.visibility = 'visible';
      this.video.style.opacity = '1';
      
      // 标记poster设置完成
      this.posterSettingInProgress = false;
    }
  }

  private async captureVideoFrame(timeInSeconds: number = 0): Promise<string | null> {
    return new Promise(async (resolve) => {
      if (!this.video.src) {
        resolve(null);
        return;
      }

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        resolve(null);
        return;
      }

      // 始终使用隐藏视频元素来截取poster，避免主视频闪烁和跳转
      // 创建或使用隐藏的视频元素
      if (!this.thumbnailVideo) {
        this.thumbnailVideo = document.createElement('video');
        this.thumbnailVideo.crossOrigin = 'anonymous';
        this.thumbnailVideo.preload = 'metadata';
        this.thumbnailVideo.style.display = 'none';
        this.thumbnailVideo.style.width = '1px';
        this.thumbnailVideo.style.height = '1px';
        this.thumbnailVideo.style.position = 'absolute';
        this.thumbnailVideo.style.opacity = '0';
        this.thumbnailVideo.style.pointerEvents = 'none';
        this.thumbnailVideo.style.zIndex = '-1';
        document.body.appendChild(this.thumbnailVideo);
      }
      
      // 如果隐藏视频还没有加载源，设置源
      if (!this.thumbnailVideo.src || this.thumbnailVideo.src !== this.video.src) {
        this.thumbnailVideo.src = this.video.src;
        // 等待视频加载元数据和第一帧数据
        await new Promise<void>((resolve) => {
          if (this.thumbnailVideo!.readyState >= 2) {
            resolve();
          } else {
            const onLoadedData = () => {
              this.thumbnailVideo!.removeEventListener('loadeddata', onLoadedData);
              this.thumbnailVideo!.removeEventListener('loadedmetadata', onLoadedMetadata);
              resolve();
            };
            const onLoadedMetadata = () => {
              // 如果只需要metadata，也继续等待loadeddata
              if (this.thumbnailVideo!.readyState >= 2) {
                this.thumbnailVideo!.removeEventListener('loadeddata', onLoadedData);
                this.thumbnailVideo!.removeEventListener('loadedmetadata', onLoadedMetadata);
                resolve();
              }
            };
            this.thumbnailVideo!.addEventListener('loadeddata', onLoadedData, { once: true });
            this.thumbnailVideo!.addEventListener('loadedmetadata', onLoadedMetadata, { once: true });
            setTimeout(() => {
              this.thumbnailVideo!.removeEventListener('loadeddata', onLoadedData);
              this.thumbnailVideo!.removeEventListener('loadedmetadata', onLoadedMetadata);
              resolve();
            }, 5000); // 超时保护
          }
        });
      }
      
      const videoToCapture = this.thumbnailVideo;

      // 确保视频尺寸有效，如果还没有，等待一下
      const checkAndCapture = (retries: number = 3) => {
        if (videoToCapture.videoWidth && videoToCapture.videoHeight) {
          this.captureFrameInternal(videoToCapture, canvas, ctx, timeInSeconds, resolve);
        } else if (retries > 0) {
          setTimeout(() => {
            checkAndCapture(retries - 1);
          }, 200);
        } else {
          console.warn('Video dimensions not available after retries');
          resolve(null);
        }
      };

      checkAndCapture();
    });
  }

  private captureFrameInternal(
    video: HTMLVideoElement,
    canvas: HTMLCanvasElement,
    ctx: CanvasRenderingContext2D,
    timeInSeconds: number,
    resolve: (value: string | null) => void
  ): void {
    // 设置 canvas 尺寸为视频尺寸
    if (!video.videoWidth || !video.videoHeight) {
      resolve(null);
      return;
    }
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // 计算目标时间点（单位：秒）
    let targetTime = timeInSeconds;
    if (video.duration && !isNaN(video.duration) && isFinite(video.duration)) {
      // 如果指定了时间且视频有 duration，确保不超过视频长度
      if (timeInSeconds > 0) {
        targetTime = Math.min(timeInSeconds, Math.max(0, video.duration - 0.1));
      } else {
        targetTime = 0;
      }
    } else if (timeInSeconds > 0) {
      // 如果视频 duration 还没准备好，但指定了非0时间，等待一下
      setTimeout(() => {
        if (video.duration && !isNaN(video.duration) && isFinite(video.duration)) {
          targetTime = Math.min(timeInSeconds, Math.max(0, video.duration - 0.1));
          this.captureFrameInternal(video, canvas, ctx, targetTime, resolve);
        } else {
          // 如果还是没准备好，截取当前帧
          this.captureFrameInternal(video, canvas, ctx, 0, resolve);
        }
      }, 200);
      return;
    }

    const captureFrame = () => {
      try {
        // 确保视频已暂停
        if (!video.paused) {
          video.pause();
        }
        
        // 等待多个动画帧确保视频帧已完全渲染
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            try {
              // 绘制视频帧到 canvas
              ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
              
              // 转换为 base64 数据 URL
              const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
              resolve(dataUrl);
            } catch (error) {
              console.warn('Failed to capture video frame:', error);
              resolve(null);
            }
          });
        });
      } catch (error) {
        console.warn('Failed to capture video frame:', error);
        resolve(null);
      }
    };

    // 如果目标时间大于0，需要跳转
    if (targetTime > 0 && video.duration && !isNaN(video.duration) && targetTime < video.duration) {
      // 需要跳转到指定帧
      let timeoutId: number | null = null;
      let seeked = false;
      
      const onSeeked = () => {
        if (seeked) return;
        seeked = true;
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }
        video.removeEventListener('seeked', onSeeked);
        
        // 等待多个动画帧确保视频帧已完全渲染
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            setTimeout(() => {
              captureFrame();
            }, 100);
          });
        });
      };
      
      // 设置超时，防止 seeked 事件不触发
      timeoutId = window.setTimeout(() => {
        if (!seeked) {
          seeked = true;
          video.removeEventListener('seeked', onSeeked);
          // 即使没有 seeked 事件，也尝试截取
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              setTimeout(() => {
                captureFrame();
              }, 100);
            });
          });
        }
      }, 2000);
      
      video.addEventListener('seeked', onSeeked);
      video.currentTime = targetTime;
    } else {
      // 直接截取当前帧（第一帧或指定时间已经是0）
      // 确保视频在目标时间
      if (Math.abs(video.currentTime - targetTime) > 0.1) {
        let timeoutId: number | null = null;
        let seeked = false;
        
        const onSeeked = () => {
          if (seeked) return;
          seeked = true;
          if (timeoutId) {
            clearTimeout(timeoutId);
            timeoutId = null;
          }
          video.removeEventListener('seeked', onSeeked);
          captureFrame();
        };
        
        timeoutId = window.setTimeout(() => {
          if (!seeked) {
            seeked = true;
            video.removeEventListener('seeked', onSeeked);
            captureFrame();
          }
        }, 1000);
        
        video.addEventListener('seeked', onSeeked);
        video.currentTime = targetTime;
      } else {
        captureFrame();
      }
    }
  }

  private initSpeedMenuIcons(): void {
    // 为所有速度选项的 check 图标渲染 SVG
    const checkIcons = this.speedMenu.querySelectorAll('.speed-option-icon');
    checkIcons.forEach(icon => {
      const iconElement = icon as HTMLElement;
      // 清除现有内容
      while (iconElement.firstChild) {
        iconElement.removeChild(iconElement.firstChild);
      }
      // 只对 active 选项显示 check 图标
      const option = iconElement.closest('.speed-option');
      if (option && option.classList.contains('active')) {
        const svg = this.renderIcon('check', 16, 2);
        iconElement.appendChild(svg);
      }
    });
  }

  private initEventListeners(): void {
    // 视频加载事件
    this.video.addEventListener('loadstart', () => {
      this.loadingSpinner.classList.add('show');
    });

    this.video.addEventListener('loadedmetadata', async () => {
      this.durationDisplay.textContent = this.formatTime(this.video.duration);
      this.updateVolumeBar();
      // 如果设置了比例，根据视频实际比例调整
      if (!this.options.height && !this.options.aspectRatio) {
        const videoAspectRatio = this.video.videoWidth / this.video.videoHeight;
        if (videoAspectRatio && !isNaN(videoAspectRatio) && isFinite(videoAspectRatio)) {
          this.playerContainer.style.aspectRatio = `${videoAspectRatio} / 1`;
        }
      }

      // 处理自动截取封面图
      const poster = this.options.poster;
      if (poster === true || poster === undefined || typeof poster === 'number') {
        // true 或 undefined 使用第1秒，数字直接使用秒数
        const timeInSeconds = typeof poster === 'number' ? poster : (poster === true ? 1 : 0);
        
        // 使用 loadeddata 事件，这时视频的第一帧已经加载完成
        // 如果视频数据已经加载，直接处理
        if (this.video.readyState >= 2) {
          this.handlePosterCapture(timeInSeconds);
        } else {
          this.video.addEventListener('loadeddata', () => {
            this.handlePosterCapture(timeInSeconds);
          }, { once: true });
        }
      }
    });

    this.video.addEventListener('canplay', () => {
      this.loadingSpinner.classList.remove('show');
    });

    this.video.addEventListener('canplaythrough', () => {
      this.loadingSpinner.classList.remove('show');
    });

    this.video.addEventListener('timeupdate', () => this.updateProgress());
    this.video.addEventListener('progress', () => this.updateBufferProgress());
    this.video.addEventListener('loadedmetadata', () => this.updateBufferProgress());

    this.video.addEventListener('play', () => {
      this.centerPlayBtn.classList.remove('show');
      this.loadingSpinner.classList.remove('show');
      // 播放时移除背景图片（如果有）并添加playing类
      this.video.style.backgroundImage = '';
      this.video.classList.add('playing');
      // 隐藏poster overlay
      if (this.posterOverlay) {
        this.posterOverlay.classList.remove('show');
      }
      this.updateIcons();
      // 更新工具栏显示状态
      this.updateControlsVisibility();
    });

    this.video.addEventListener('pause', () => {
      this.centerPlayBtn.classList.add('show');
      // 如果视频暂停在时间 0 或接近 0，恢复 poster 显示
      if (this.video.poster && Math.abs(this.video.currentTime) < 0.1) {
        // 如果 poster 存在，使用背景图片作为备用显示
        // 无论是 data URL 还是普通 URL 都支持
        this.video.style.backgroundImage = `url(${this.video.poster})`;
        this.video.style.backgroundSize = 'cover';
        this.video.style.backgroundPosition = 'center';
        this.video.style.backgroundRepeat = 'no-repeat';
        // 移除playing类，确保poster显示
        this.video.classList.remove('playing');
        // 显示poster overlay
        if (this.posterOverlay) {
          this.posterOverlay.style.backgroundImage = `url(${this.video.poster})`;
          this.posterOverlay.classList.add('show');
        }
      }
      this.updateIcons();
      // 更新工具栏显示状态
      this.updateControlsVisibility();
    });

    this.video.addEventListener('playing', () => {
      this.centerPlayBtn.classList.remove('show');
      this.loadingSpinner.classList.remove('show');
      this.updateIcons();
    });

    this.video.addEventListener('waiting', () => {
      this.loadingSpinner.classList.add('show');
    });

    this.video.addEventListener('ended', () => {
      this.centerPlayBtn.classList.add('show');
      this.updateIcons();
    });

    // 全屏和画中画事件
    document.addEventListener('fullscreenchange', () => this.updateIcons());
    this.video.addEventListener('enterpictureinpicture', () => this.updateIcons());
    this.video.addEventListener('leavepictureinpicture', () => this.updateIcons());

    // 控制栏交互
    this.playerContainer.addEventListener('mousemove', (e) => {
      console.log('[playerContainer] mousemove 事件触发', e.target);
      this.showControls();
    });
    this.playerContainer.addEventListener('mouseleave', () => {
      console.log('[playerContainer] mouseleave 事件触发');
      this.hideControls();
    });
    this.playerContainer.addEventListener('click', (e) => {
      if (e.target === this.video || e.target === this.playerContainer) {
        this.togglePlayPause();
      }
    });

    // 按钮事件
    this.playPauseBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.togglePlayPause();
    });

    this.centerPlayBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.togglePlayPause();
    });

    this.progressContainer.addEventListener('click', (e) => {
      e.stopPropagation();
      this.seekTo(e);
    });

    // 进度条悬停预览
    this.progressContainer.addEventListener('mousemove', (e) => {
      console.log('[progressContainer] mousemove 事件触发', e.target);
      // 直接调用 showControls，确保控制栏显示
      this.showControls();
      // 不阻止事件冒泡，让 playerContainer 的 mousemove 事件也能触发
      if (!this.isDragging) { // 只有在非拖拽状态下才显示预览
        this.showProgressPreview(e);
        // 如果使用了主题包，更新预览滑块位置（鼠标位置）
        if (this.currentThemePackage && (this as any)._updatePreviewThumb) {
          const rect = this.progressContainer.getBoundingClientRect();
          const progress = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
          (this as any)._updatePreviewThumb(progress);
        }
      } else {
        // 拖拽时更新当前播放位置的滑块
        if (this.currentThemePackage && (this as any)._updateProgressThumb) {
          const rect = this.progressContainer.getBoundingClientRect();
          const progress = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
          (this as any)._updateProgressThumb(progress);
        }
      }
    });

    this.progressContainer.addEventListener('mouseleave', () => {
      this.hideProgressPreview();
    });

    // 进度条拖拽
    this.progressContainer.addEventListener('mousedown', (e) => {
      e.stopPropagation();
      this.isDragging = true;
      this.hideProgressPreview(); // 拖拽时隐藏预览
      this.seekTo(e);
    });

    document.addEventListener('mousemove', (e) => {
      if (this.isDragging) {
        this.seekTo(e);
      }
    });

    document.addEventListener('mouseup', () => {
      this.isDragging = false;
    });

    // 音量控制
    this.volumeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleVolumePopup();
    });

    this.volumeSliderPopupContainer.addEventListener('click', (e) => {
      e.stopPropagation();
      this.setVolumeFromPopup(e);
    });

    this.volumeSliderPopupContainer.addEventListener('mousedown', (e) => {
      e.stopPropagation();
      this.isDraggingVolume = true;
      this.setVolumeFromPopup(e);
    });

    document.addEventListener('mousemove', (e) => {
      if (this.isDraggingVolume) {
        this.setVolumeFromPopup(e);
      }
    });

    document.addEventListener('mouseup', () => {
      this.isDraggingVolume = false;
    });

    document.addEventListener('click', (e) => {
      if (!this.volumeBtn.contains(e.target as Node) && !this.volumeSliderPopup.contains(e.target as Node)) {
        this.volumeSliderPopup.classList.remove('show');
      }
    });

    // 全屏按钮
    this.fullscreenBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleFullscreen();
    });

    // 页面全屏按钮
    this.pageFullscreenBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.togglePageFullscreen();
    });

    // 播放速度控制
    this.speedBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleSpeedMenu();
    });

    this.speedOptions.forEach(option => {
      option.addEventListener('click', (e) => {
        e.stopPropagation();
        this.setPlaybackSpeed(option.dataset.speed!);
      });
    });

    // 画中画控制
    this.pipBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.togglePiP();
    });

    // 点击外部关闭速度菜单
    document.addEventListener('click', (e) => {
      if (!this.speedBtn.contains(e.target as Node) && !this.speedMenu.contains(e.target as Node)) {
        this.speedMenu.classList.remove('show');
      }
    });

    // 键盘快捷键
    document.addEventListener('keydown', (e) => {
      if ((e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'TEXTAREA') return;
      
      switch(e.code) {
        case 'Space':
          e.preventDefault();
          this.togglePlayPause();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          this.video.currentTime = Math.max(0, this.video.currentTime - 10);
          break;
        case 'ArrowRight':
          e.preventDefault();
          this.video.currentTime = Math.min(this.video.duration, this.video.currentTime + 10);
          break;
        case 'ArrowUp':
          e.preventDefault();
          this.video.volume = Math.min(1, this.video.volume + 0.1);
          this.updateVolumeBar();
          break;
        case 'ArrowDown':
          e.preventDefault();
          this.video.volume = Math.max(0, this.video.volume - 0.1);
          this.updateVolumeBar();
          break;
        case 'KeyM':
          e.preventDefault();
          this.toggleMute();
          break;
        case 'KeyF':
          e.preventDefault();
          this.toggleFullscreen();
          break;
      }
    });
  }

  private initState(): void {
    this.updateVolumeBar();
    this.updateBufferProgress();
    // 初始化工具栏显示状态
    this.updateControlsVisibility();
    this.checkPiPSupport();
    this.video.playbackRate = 1;
    
    if (this.video.paused) {
      this.centerPlayBtn.classList.add('show');
    } else {
      this.centerPlayBtn.classList.remove('show');
    }
    
    // 确保 DOM 完全渲染后再更新图标
    requestAnimationFrame(() => {
      this.updateIcons();
    });
  }

  private getIconComponent(iconName: string): any {
    // 将 kebab-case 转换为 PascalCase
    const pascalName = iconName
      .split('-')
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join('');
    
    return (LucideIcons as any)[pascalName] || (LucideIcons as any).Play;
  }

  private renderIcon(iconName: string, size: number = 24, strokeWidth: number = 2): SVGElement {
    const IconComponent = this.getIconComponent(iconName);
    
    // 创建 SVG 元素
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', size.toString());
    svg.setAttribute('height', size.toString());
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('stroke-width', strokeWidth.toString());
    svg.setAttribute('stroke-linecap', 'round');
    svg.setAttribute('stroke-linejoin', 'round');
    
    try {
      // lucide 图标数据是一个数组: [tag, attrs, children]
      let iconData: any = null;
      
      if (typeof IconComponent === 'function') {
        // 如果是函数，调用它获取图标数据
        iconData = IconComponent({ size, strokeWidth });
      } else if (Array.isArray(IconComponent)) {
        // 如果直接是数组数据
        iconData = IconComponent;
      } else if (IconComponent && typeof IconComponent === 'object') {
        // 可能是对象格式
        iconData = IconComponent;
      }
      
      if (iconData) {
        // lucide 图标数据结构: [tag, attrs, children]
        if (Array.isArray(iconData) && iconData.length >= 2) {
          const [tag, attrs = {}, children = []] = iconData;
          
          if (tag === 'svg') {
            // 递归构建子元素
            this.buildChildren(svg, children, strokeWidth);
          } else {
            // 如果不是 svg，直接处理为子元素
            this.buildChildren(svg, [iconData], strokeWidth);
          }
        } else if (iconData.children) {
          // 可能是 React 元素结构
          this.buildChildren(svg, iconData.children, strokeWidth);
        }
      }
    } catch (error) {
      console.warn(`Failed to render icon ${iconName}:`, error);
    }
    
    // 如果没有成功添加路径，添加一个默认路径
    if (svg.children.length === 0) {
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', 'M12 2L2 7l10 5 10-5-10-5z');
      svg.appendChild(path);
    }
    
    return svg;
  }

  private buildChildren(parent: SVGElement, children: any[], strokeWidth: number): void {
    if (!children || !Array.isArray(children)) return;
    
    children.forEach((child: any) => {
      if (Array.isArray(child) && child.length >= 2) {
        // lucide 数据结构: [tag, attrs, children]
        const [tag, attrs = {}, childNodes = []] = child;
        
        if (tag === 'path' || tag === 'circle' || tag === 'rect' || 
            tag === 'line' || tag === 'polyline' || tag === 'polygon' || 
            tag === 'ellipse') {
          const element = document.createElementNS('http://www.w3.org/2000/svg', tag);
          
          // 设置属性
          Object.keys(attrs).forEach(key => {
            const value = attrs[key];
            if (value !== undefined && value !== null) {
              element.setAttribute(key, value.toString());
            }
          });
          
          // 确保 stroke-width 被设置
          if (!attrs['stroke-width']) {
            element.setAttribute('stroke-width', strokeWidth.toString());
          }
          
          parent.appendChild(element);
          
          // 递归处理子元素
          if (childNodes && childNodes.length > 0) {
            this.buildChildren(element, childNodes, strokeWidth);
          }
        } else {
          // 其他元素类型，递归处理
          this.buildChildren(parent, childNodes, strokeWidth);
        }
      } else if (typeof child === 'object' && child !== null) {
        // 可能是对象格式
        if (child.type === 'path' || child.tag === 'path') {
          const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
          if (child.props && child.props.d) {
            path.setAttribute('d', child.props.d);
          } else if (child.attrs && child.attrs.d) {
            path.setAttribute('d', child.attrs.d);
          } else if (child.d) {
            path.setAttribute('d', child.d);
          }
          path.setAttribute('stroke-width', strokeWidth.toString());
          parent.appendChild(path);
        }
      }
    });
  }

  private updateSingleIcon(buttonElement: HTMLElement, iconName: string): void {
    if (!buttonElement) return;
    
    // 移除所有现有的 SVG
    const allSvgs = buttonElement.querySelectorAll('svg');
    allSvgs.forEach(svg => svg.remove());
    
    // 移除或清空 <i> 标签
    let iconElement = buttonElement.querySelector('i');
    if (iconElement) {
      while (iconElement.firstChild) {
        iconElement.removeChild(iconElement.firstChild);
      }
    } else {
      iconElement = document.createElement('i');
      buttonElement.appendChild(iconElement);
    }
    
    // 创建并插入 SVG 图标
    const svg = this.renderIcon(iconName);
    iconElement.appendChild(svg);
  }

  private updateIcons(): void {
    // 如果使用了主题包，使用 Canvas 绘制的图标
    if (this.currentThemePackage) {
      this.applyCanvasIcons(this.currentThemePackage);
      return;
    }

    // 否则使用默认的 Lucide 图标
    const playPauseIconName = this.video.paused ? 'play' : 'pause';
    this.updateSingleIcon(this.playPauseBtn, playPauseIconName);
    this.updateSingleIcon(this.centerPlayBtn, 'play');
    
    let volumeIconName = 'volume-2';
    if (this.video.muted || this.video.volume === 0) {
      volumeIconName = 'volume-x';
    } else if (this.video.volume < 0.5) {
      volumeIconName = 'volume-1';
    }
    this.updateSingleIcon(this.volumeBtn, volumeIconName);
    
    // 更新速度按钮图标
    this.updateSingleIcon(this.speedBtn, 'gauge');
    
    const fullscreenIconName = document.fullscreenElement === this.playerContainer ? 'minimize' : 'maximize';
    this.updateSingleIcon(this.fullscreenBtn, fullscreenIconName);
    
    // 页面全屏按钮图标：如果整个页面全屏，显示 minimize-2，否则显示 maximize-2
    const pageFullscreenIconName = document.fullscreenElement === document.documentElement ? 'minimize-2' : 'maximize-2';
    this.updateSingleIcon(this.pageFullscreenBtn, pageFullscreenIconName);
    
    const pipIconName = document.pictureInPictureElement ? 'picture-in-picture-2' : 'picture-in-picture';
    this.updateSingleIcon(this.pipBtn, pipIconName);
  }

  private formatTime(seconds: number): string {
    if (isNaN(seconds)) return '0:00';
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  private updateProgress(): void {
    if (this.video.duration) {
      const percent = (this.video.currentTime / this.video.duration) * 100;
      const progress = this.video.currentTime / this.video.duration;
      this.progressBar.style.width = percent + '%';
      
      // 如果使用了主题包，更新进度条填充 Canvas 和滑块
      if (this.currentThemePackage && (this as any)._updateProgressFill) {
        (this as any)._updateProgressFill();
      }
      if (this.currentThemePackage && (this as any)._updateProgressThumb) {
        (this as any)._updateProgressThumb(progress);
      }
      
      // 更新简单进度条
      if (this.miniProgressBar) {
        const miniProgressBarFill = this.miniProgressBar.querySelector('#mini-progress-bar-fill') as HTMLElement;
        if (miniProgressBarFill) {
          miniProgressBarFill.style.width = percent + '%';
          // 如果使用了主题包，更新简单进度条的 Canvas
          if (this.currentThemePackage) {
            const canvas = miniProgressBarFill.querySelector('canvas') as HTMLCanvasElement;
            if (canvas) {
              const rect = this.miniProgressBar.getBoundingClientRect();
              const fillWidth = rect.width * (percent / 100);
              canvas.width = fillWidth;
              canvas.height = rect.height;
              canvas.style.width = `${fillWidth}px`;
              if (fillWidth > 0) {
                this.currentThemePackage.drawProgressBarFill(canvas, fillWidth, rect.height, percent / 100);
              }
            } else {
              // 如果没有 Canvas，创建一个
              const newCanvas = document.createElement('canvas');
              newCanvas.style.width = '100%';
              newCanvas.style.height = '100%';
              newCanvas.style.position = 'absolute';
              newCanvas.style.top = '0';
              newCanvas.style.left = '0';
              miniProgressBarFill.appendChild(newCanvas);
            }
          }
        }
      }
    }
    this.currentTimeDisplay.textContent = this.formatTime(this.video.currentTime);
  }

  private updateBufferProgress(): void {
    if (this.video.buffered.length > 0 && this.video.duration) {
      const bufferedEnd = this.video.buffered.end(this.video.buffered.length - 1);
      const bufferedPercent = (bufferedEnd / this.video.duration) * 100;
      this.bufferBar.style.width = bufferedPercent + '%';
    }
  }

  private updateVolumeBar(): void {
    const percent = this.video.volume * 100;
    this.volumeSliderPopupBar.style.height = percent + '%';
    this.updateIcons();
  }

  private toggleVolumePopup(): void {
    this.volumeSliderPopup.classList.toggle('show');
  }

  private setVolumeFromPopup(e: MouseEvent): void {
    const rect = this.volumeSliderPopupContainer.getBoundingClientRect();
    const percent = Math.max(0, Math.min(1, 1 - (e.clientY - rect.top) / rect.height));
    this.video.volume = percent;
    this.video.muted = false;
    this.updateVolumeBar();
  }

  /**
   * 根据配置和播放状态更新工具栏显示状态
   */
  private updateControlsVisibility(): void {
    const config = this.options.controlsVisibility || {};
    const isPlaying = !this.video.paused;
    // 播放时默认使用 'hover' 模式（鼠标移上去显示），而不是 'never'
    const mode = isPlaying ? (config.playing ?? 'hover') : (config.idle ?? 'hover');

    console.log('[updateControlsVisibility] 调用', { isPlaying, mode, config });

    // 清除之前的定时器
    if (this.controlsTimeout) {
      clearTimeout(this.controlsTimeout);
      this.controlsTimeout = null;
    }

    // 移除所有模式相关的类
    const beforeClasses = this.customControls.className;
    this.customControls.classList.remove('always-visible', 'never-visible', 'hover-only');

    switch (mode) {
      case 'always':
        this.customControls.classList.add('always-visible', 'visible');
        // 工具栏一直显示时，隐藏简单进度条
        if (this.miniProgressBar) {
          this.miniProgressBar.classList.remove('show');
        }
        break;
      case 'never':
        this.customControls.classList.add('never-visible');
        this.customControls.classList.remove('visible');
        // 清除内联样式，确保 never 模式生效
        this.customControls.style.opacity = '';
        // 工具栏隐藏时，如果正在播放，显示简单进度条
        if (isPlaying && this.miniProgressBar) {
          this.miniProgressBar.classList.add('show');
        } else if (this.miniProgressBar) {
          this.miniProgressBar.classList.remove('show');
        }
        break;
      case 'hover':
      default:
        this.customControls.classList.add('hover-only');
        // 清除内联样式，让 CSS 控制显示
        this.customControls.style.opacity = '';
        // 如果正在播放，默认隐藏，鼠标移上去时显示
        if (isPlaying) {
          this.customControls.classList.remove('visible');
          // 工具栏隐藏时，显示简单进度条
          if (this.miniProgressBar) {
            this.miniProgressBar.classList.add('show');
          }
        } else {
          // 未播放时，默认显示（hover模式）
          this.customControls.classList.add('visible');
          // 工具栏显示时，隐藏简单进度条
          if (this.miniProgressBar) {
            this.miniProgressBar.classList.remove('show');
          }
        }
        break;
    }
    
    const afterClasses = this.customControls.className;
    const computedOpacity = window.getComputedStyle(this.customControls).opacity;
    console.log('[updateControlsVisibility] 更新后', { 
      before: beforeClasses, 
      after: afterClasses,
      computedOpacity,
      elementVisible: this.customControls.offsetParent !== null
    });
  }

  private showControls(): void {
    const config = this.options.controlsVisibility || {};
    const isPlaying = !this.video.paused;
    const mode = isPlaying ? (config.playing ?? 'hover') : (config.idle ?? 'hover');

    console.log('[showControls] 调用', { isPlaying, mode, config });

    // 如果模式是 never，不显示（即使鼠标移上去也不显示）
    if (mode === 'never') {
      console.log('[showControls] 模式是 never，不显示');
      return;
    }

    // 如果模式是 always，已经显示，不需要额外处理
    if (mode === 'always') {
      console.log('[showControls] 模式是 always，已经显示');
      return;
    }

    // hover 模式：鼠标移上去时显示
    const beforeClasses = this.customControls.className;
    this.customControls.classList.remove('never-visible');
    this.customControls.classList.add('hover-only', 'visible');
    const afterClasses = this.customControls.className;
    
    console.log('[showControls] 类名变化', { before: beforeClasses, after: afterClasses });
    
    // 强制设置 opacity（通过内联样式确保优先级）
    this.customControls.style.opacity = '1';
    
    const computedOpacity = window.getComputedStyle(this.customControls).opacity;
    console.log('[showControls] 样式检查', { 
      inlineOpacity: this.customControls.style.opacity,
      computedOpacity,
      elementVisible: this.customControls.offsetParent !== null
    });
    
    // 工具栏显示时，立即隐藏简单进度条
    if (this.miniProgressBar) {
      this.miniProgressBar.classList.remove('show');
    }
    
    // 如果正在播放，且模式是 hover，3秒后自动隐藏工具栏，并立即显示简单进度条
    if (isPlaying && mode === 'hover') {
      if (this.controlsTimeout) {
        clearTimeout(this.controlsTimeout);
      }
      this.controlsTimeout = window.setTimeout(() => {
        console.log('[showControls] 3秒后自动隐藏');
        this.customControls.classList.remove('visible');
        this.customControls.style.opacity = '';
        // 工具栏隐藏时，立即显示简单进度条
        if (this.miniProgressBar && isPlaying) {
          this.miniProgressBar.classList.add('show');
        }
      }, 3000);
    }
  }

  private hideControls(): void {
    const config = this.options.controlsVisibility || {};
    const isPlaying = !this.video.paused;
    const mode = isPlaying ? (config.playing ?? 'hover') : (config.idle ?? 'hover');

    console.log('[hideControls] 调用', { isPlaying, mode, config });

    // 如果模式是 always，不隐藏
    if (mode === 'always') {
      console.log('[hideControls] 模式是 always，不隐藏');
      return;
    }

    // 如果模式是 never，已经是隐藏状态
    if (mode === 'never') {
      console.log('[hideControls] 模式是 never，已经是隐藏状态');
      return;
    }

    // hover 模式：鼠标移开时隐藏
    if (mode === 'hover') {
      console.log('[hideControls] hover 模式，隐藏控制栏');
      this.customControls.classList.remove('visible');
      this.customControls.style.opacity = '';
      // 工具栏隐藏时，如果正在播放，显示简单进度条
      if (this.miniProgressBar && isPlaying) {
        this.miniProgressBar.classList.add('show');
      }
    }
  }

  private togglePlayPause(): void {
    if (this.video.paused) {
      this.video.play().then(() => {
        this.centerPlayBtn.classList.remove('show');
        this.updateIcons();
      }).catch(() => {
        this.updateIcons();
      });
    } else {
      this.video.pause();
      this.centerPlayBtn.classList.add('show');
      this.updateIcons();
    }
    // 播放/暂停状态改变时，更新控制栏显示状态（而不是强制显示）
    // play/pause 事件监听器会调用 updateControlsVisibility，这里不需要重复调用
  }

  private seekTo(e: MouseEvent): void {
    const rect = this.progressContainer.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    const progress = Math.max(0, Math.min(1, percent));
    this.video.currentTime = progress * this.video.duration;
    
    // 如果使用了主题包，更新滑块位置
    if (this.currentThemePackage && (this as any)._updateProgressThumb) {
      (this as any)._updateProgressThumb(progress);
    }
  }

  private showProgressPreview(e: MouseEvent): void {
    if (!this.video.duration) return;
    
    // 确保预览容器存在
    if (!this.progressPreview || !this.progressPreviewImage || !this.progressPreviewTime) {
      return;
    }
    
    const rect = this.progressContainer.getBoundingClientRect();
    const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const previewTime = percent * this.video.duration;
    
    // 更新预览时间显示
    this.progressPreviewTime.textContent = this.formatTime(previewTime);
    
    // 计算预览位置（使用百分比，配合 transform: translateX(-50%) 居中）
    let previewLeft = percent * 100;
    
    // 边界检测：确保弹层不会超出屏幕
    // 使用 CSS 中定义的固定宽度 160px，或者尝试获取实际宽度
    let previewWidth = 160; // CSS 中定义的默认宽度
    try {
      // 尝试获取实际宽度
      const computedStyle = window.getComputedStyle(this.progressPreview);
      const widthValue = computedStyle.width;
      if (widthValue && widthValue !== 'auto' && widthValue !== '0px') {
        previewWidth = parseFloat(widthValue) || 160;
      }
    } catch (e) {
      // 如果获取失败，使用默认值
    }
    
    const previewHalfWidth = previewWidth / 2;
    const containerLeft = rect.left;
    const containerWidth = rect.width;
    
    // 计算弹层中心点的绝对位置（相对于视口）
    const previewCenterX = containerLeft + (percent * containerWidth);
    
    // 检查左边界
    if (previewCenterX < previewHalfWidth) {
      // 弹层会超出左边界，调整位置使其紧贴左边界
      const minLeftPercent = (previewHalfWidth - containerLeft) / containerWidth * 100;
      previewLeft = Math.max(0, minLeftPercent);
    }
    
    // 检查右边界
    const viewportWidth = window.innerWidth;
    if (previewCenterX > viewportWidth - previewHalfWidth) {
      // 弹层会超出右边界，调整位置使其紧贴右边界
      const maxLeftPercent = ((viewportWidth - previewHalfWidth) - containerLeft) / containerWidth * 100;
      previewLeft = Math.min(100, maxLeftPercent);
    }
    
    // 更新预览位置
    this.progressPreview.style.left = `${previewLeft}%`;
    
    // 确保预览容器可见
    if (!this.progressPreview.classList.contains('show')) {
      this.progressPreview.classList.add('show');
    }
    
    // 延迟加载缩略图（防抖）
    if (this.previewThumbnailTimeout) {
      clearTimeout(this.previewThumbnailTimeout);
    }
    
    this.previewThumbnailTimeout = window.setTimeout(() => {
      this.loadPreviewThumbnail(previewTime);
    }, 200);
  }

  private hideProgressPreview(): void {
    this.progressPreview.classList.remove('show');
    if (this.previewThumbnailTimeout) {
      clearTimeout(this.previewThumbnailTimeout);
      this.previewThumbnailTimeout = null;
    }
  }

  private async loadPreviewThumbnail(timeInSeconds: number): Promise<void> {
    // 四舍五入到整数秒，用于缓存
    const roundedTime = Math.round(timeInSeconds);
    
    // 检查缓存
    if (this.previewThumbnailCache.has(roundedTime)) {
      const cachedUrl = this.previewThumbnailCache.get(roundedTime)!;
      this.progressPreviewImage.src = cachedUrl;
      return;
    }
    
    // 如果已经有其他缩略图正在加载，取消它
    if (this.previewThumbnailLoading !== null && this.previewThumbnailLoading !== roundedTime) {
      // 不取消，让新的请求继续，但标记当前加载的时间
    }
    
    // 标记当前正在加载的时间
    this.previewThumbnailLoading = roundedTime;
    
    // 确保视频已加载元数据（至少需要 HAVE_METADATA）
    if (!this.video.duration || this.video.readyState < 1) {
      this.previewThumbnailLoading = null;
      return;
    }
    
    // 保存当前时间
    const originalTime = this.video.currentTime;
    
    // 如果目标时间与当前时间很接近（0.5秒内），直接使用当前帧
    if (Math.abs(originalTime - roundedTime) < 0.5) {
      try {
        // 检查是否还是当前请求
        if (this.previewThumbnailLoading !== roundedTime) {
          return;
        }
        
        // 直接截取当前帧，不跳转
        const thumbnailDataUrl = await this.captureVideoFrameAtCurrentTime();
        
        // 再次检查是否还是当前请求
        if (this.previewThumbnailLoading !== roundedTime) {
          return;
        }
        
        if (thumbnailDataUrl && this.progressPreviewImage) {
          this.previewThumbnailCache.set(roundedTime, thumbnailDataUrl);
          this.progressPreviewImage.src = thumbnailDataUrl;
          this.progressPreviewImage.style.display = 'block';
          this.progressPreviewImage.style.opacity = '1';
        }
        
        // 标记加载完成
        this.previewThumbnailLoading = null;
      } catch (error) {
        console.warn('Failed to load preview thumbnail:', error);
        this.previewThumbnailLoading = null;
      }
      return;
    }
    
    // 需要跳转到目标时间截取
    try {
      // 如果视频正在播放，使用隐藏的视频元素截取，避免影响主视频
      const wasPlaying = !this.video.paused;
      let videoToCapture = this.video;
      let needRestoreTime = false;
      
      if (wasPlaying) {
        // 创建或使用隐藏的视频元素
        if (!this.thumbnailVideo) {
          this.thumbnailVideo = document.createElement('video');
          this.thumbnailVideo.crossOrigin = 'anonymous';
          this.thumbnailVideo.preload = 'metadata';
          this.thumbnailVideo.style.display = 'none';
          this.thumbnailVideo.style.width = '1px';
          this.thumbnailVideo.style.height = '1px';
          this.thumbnailVideo.style.position = 'absolute';
          this.thumbnailVideo.style.opacity = '0';
          this.thumbnailVideo.style.pointerEvents = 'none';
          document.body.appendChild(this.thumbnailVideo);
        }
        
        // 如果隐藏视频还没有加载源，设置源
        if (!this.thumbnailVideo.src || this.thumbnailVideo.src !== this.video.src) {
          this.thumbnailVideo.src = this.video.src;
          // 等待视频加载元数据
          await new Promise<void>((resolve) => {
            if (this.thumbnailVideo!.readyState >= 1) {
              resolve();
            } else {
              this.thumbnailVideo!.addEventListener('loadedmetadata', () => resolve(), { once: true });
              setTimeout(() => resolve(), 2000); // 超时保护
            }
          });
        }
        
        videoToCapture = this.thumbnailVideo;
      } else {
        // 视频暂停时，需要恢复时间
        needRestoreTime = true;
      }
      
      // 跳转到目标时间
      videoToCapture.currentTime = roundedTime;
      
      // 等待视频跳转完成并确保帧已渲染
      await new Promise<void>((resolve) => {
        let seeked = false;
        const onSeeked = () => {
          if (seeked) return;
          seeked = true;
          videoToCapture.removeEventListener('seeked', onSeeked);
          
          // 等待多个动画帧确保视频帧已完全渲染
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              requestAnimationFrame(() => {
                resolve();
              });
            });
          });
        };
        videoToCapture.addEventListener('seeked', onSeeked);
        
        // 设置超时，防止 seeked 事件不触发
        setTimeout(() => {
          if (!seeked) {
            seeked = true;
            videoToCapture.removeEventListener('seeked', onSeeked);
            requestAnimationFrame(() => {
              requestAnimationFrame(() => {
                resolve();
              });
            });
          }
        }, 500);
      });
      
      // 检查是否还是当前请求（用户可能已经移动鼠标了）
      if (this.previewThumbnailLoading !== roundedTime) {
        // 如果需要恢复时间，先恢复
        if (needRestoreTime && videoToCapture === this.video) {
          this.video.currentTime = originalTime;
        }
        return;
      }
      
      // 截取当前帧
      const thumbnailDataUrl = await this.captureVideoFrameFromElement(videoToCapture);
      
      // 如果需要恢复时间，先恢复
      if (needRestoreTime && videoToCapture === this.video) {
        this.video.currentTime = originalTime;
      }
      
      // 再次检查是否还是当前请求
      if (this.previewThumbnailLoading !== roundedTime) {
        return;
      }
      
      if (thumbnailDataUrl && this.progressPreviewImage) {
        this.previewThumbnailCache.set(roundedTime, thumbnailDataUrl);
        this.progressPreviewImage.src = thumbnailDataUrl;
        this.progressPreviewImage.style.display = 'block';
        this.progressPreviewImage.style.opacity = '1';
      }
      
      // 标记加载完成
      this.previewThumbnailLoading = null;
    } catch (error) {
      console.warn('Failed to load preview thumbnail:', error);
      this.previewThumbnailLoading = null;
    }
  }

  private async captureVideoFrameAtCurrentTime(): Promise<string | null> {
    return this.captureVideoFrameFromElement(this.video);
  }

  private async captureVideoFrameFromElement(video: HTMLVideoElement): Promise<string | null> {
    return new Promise((resolve) => {
      if (!video.src) {
        resolve(null);
        return;
      }

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        resolve(null);
        return;
      }

      // 确保视频尺寸有效
      if (!video.videoWidth || !video.videoHeight) {
        resolve(null);
        return;
      }
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // 直接截取当前帧
      try {
        requestAnimationFrame(() => {
          try {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
            resolve(dataUrl);
          } catch (error) {
            console.warn('Failed to capture video frame:', error);
            resolve(null);
          }
        });
      } catch (error) {
        console.warn('Failed to capture video frame:', error);
        resolve(null);
      }
    });
  }

  private toggleMute(): void {
    this.video.muted = !this.video.muted;
    this.updateVolumeBar();
  }

  private toggleFullscreen(): void {
    if (!document.fullscreenElement) {
      // 如果当前没有全屏，进入视频全屏
      this.playerContainer.requestFullscreen().catch(err => {
        console.log('无法进入全屏:', err);
      });
    } else if (document.fullscreenElement === this.playerContainer) {
      // 如果当前是视频全屏，退出
      document.exitFullscreen();
    } else {
      // 如果当前是页面全屏，先退出页面全屏，再进入视频全屏
      document.exitFullscreen().then(() => {
        setTimeout(() => {
          this.playerContainer.requestFullscreen().catch(err => {
            console.log('无法进入全屏:', err);
          });
        }, 100);
      });
    }
  }

  private togglePageFullscreen(): void {
    if (!document.fullscreenElement) {
      // 如果当前没有全屏，进入页面全屏
      document.documentElement.requestFullscreen().catch(err => {
        console.log('无法进入页面全屏:', err);
      });
    } else if (document.fullscreenElement === document.documentElement) {
      // 如果当前是页面全屏，退出
      document.exitFullscreen();
    } else {
      // 如果当前是视频全屏，先退出视频全屏，再进入页面全屏
      document.exitFullscreen().then(() => {
        setTimeout(() => {
          document.documentElement.requestFullscreen().catch(err => {
            console.log('无法进入页面全屏:', err);
          });
        }, 100);
      });
    }
  }

  private toggleSpeedMenu(): void {
    this.speedMenu.classList.toggle('show');
    if (this.speedMenu.classList.contains('show')) {
      // 更新速度菜单中的 check 图标 - 只显示 active 选项的图标
      this.updateSpeedMenuIcons();
    }
  }

  private updateSpeedMenuIcons(): void {
    const checkIcons = this.speedMenu.querySelectorAll('.speed-option-icon');
    checkIcons.forEach(icon => {
      const iconElement = icon as HTMLElement;
      // 清除现有 SVG
      const svgs = iconElement.querySelectorAll('svg');
      svgs.forEach(svg => svg.remove());
      
      // 检查是否是 active 选项
      const option = iconElement.closest('.speed-option');
      if (option && option.classList.contains('active')) {
        const svg = this.renderIcon('check', 16, 2);
        iconElement.appendChild(svg);
      }
    });
  }

  private setPlaybackSpeed(speed: string): void {
    this.currentSpeed = parseFloat(speed);
    this.video.playbackRate = this.currentSpeed;
    
    this.speedOptions.forEach(option => {
      const iconElement = option.querySelector('.speed-option-icon') as HTMLElement;
      const svgs = iconElement?.querySelectorAll('svg') || [];
      svgs.forEach(svg => svg.remove());
      
      if (parseFloat(option.dataset.speed!) === this.currentSpeed) {
        option.classList.add('active');
        // 添加 check 图标
        if (iconElement) {
          const svg = this.renderIcon('check', 16, 2);
          iconElement.appendChild(svg);
        }
      } else {
        option.classList.remove('active');
      }
    });
    
    this.speedMenu.classList.remove('show');
  }

  private async togglePiP(): Promise<void> {
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else {
        await this.video.requestPictureInPicture();
      }
    } catch (error) {
      console.log('画中画功能不支持或出错:', error);
    }
  }

  private checkPiPSupport(): void {
    if (document.pictureInPictureEnabled && this.video.requestPictureInPicture) {
      this.pipBtn.style.display = 'flex';
    }
  }

  // 公共 API
  public setSrc(src: string): void {
    this.video.src = src;
  }

  public play(): Promise<void> {
    return this.video.play();
  }

  public pause(): void {
    this.video.pause();
  }

  public setThemeColor(primary: string, secondary?: string): void {
    document.documentElement.style.setProperty('--theme-color', primary);
    if (secondary) {
      document.documentElement.style.setProperty('--theme-color-secondary', secondary);
    }
  }

  public destroy(): void {
    // 清理事件监听器
    this.video.pause();
    this.video.src = '';
    this.playerContainer.remove();
  }
}

