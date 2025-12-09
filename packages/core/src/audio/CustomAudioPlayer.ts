/**
 * 自定义音频播放器类
 * 提供完整的音频播放器 UI，与 Vue 组件渲染完全一致
 */

import '../styles/custom-audio-player.css';
import { AudioPlayer } from '../core/AudioPlayer';
import { LyricsParser } from './LyricsParser';

export interface CustomAudioPlayerOptions {
  container: HTMLElement | string;
  /** 单个音频源或多个音频源列表 */
  src?: string | string[];
  title?: string;
  artist?: string;
  cover?: string;
  volume?: number;
  autoplay?: boolean;
  /** 歌词内容(LRC格式)或歌词文件URL */
  lyrics?: string;
  /** 是否显示歌词 */
  showLyrics?: boolean;
  /** 播放器高度 */
  height?: number | string;
  /** 歌词区域高度，默认150px */
  lyricsHeight?: number | string;
  /** 布局模式：compact(紧凑横排) 或 vertical(垂直居中) */
  layout?: 'compact' | 'vertical';
  /** 封面样式：square(方形) 或 round(圆形CD效果) */
  coverStyle?: 'square' | 'round';
  /** 主题色 */
  themeColor?: string;
}

export class CustomAudioPlayer {
  private container: HTMLElement;
  private playerContainer: HTMLElement;
  private audioPlayer: AudioPlayer;
  private options: CustomAudioPlayerOptions;

  // UI 元素
  private playBtn: HTMLElement;
  private prevBtn: HTMLElement;
  private nextBtn: HTMLElement;
  private progressBar: HTMLElement;
  private progressFill: HTMLElement;
  private currentTimeEl: HTMLElement;
  private durationEl: HTMLElement;
  private volumeBtn: HTMLElement;
  private volumeSlider: HTMLElement;
  private volumeFill: HTMLElement;
  private speedBtn: HTMLElement;
  private coverImg: HTMLImageElement;
  private titleEl: HTMLElement;
  private artistEl: HTMLElement;
  private lyricsContainer: HTMLElement | null = null;
  private lyricsParser: LyricsParser | null = null;
  private currentLyricIndex = -1;

  private volumePopup: HTMLElement | null = null;
  private speedMenu: HTMLElement | null = null;

  // 状态
  private isPlaying = false;
  private currentSpeed = 1;
  private isMuted = false;
  private speeds = [0.5, 0.75, 1, 1.25, 1.5, 2];
  private hasPlaylist = false;

  // 默认封面
  private defaultCover = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjIwMCIgaGVpZ2h0PSIyMDAiIGZpbGw9IiM2MzY2ZjEiLz48Y2lyY2xlIGN4PSIxMDAiIGN5PSIxMDAiIHI9IjYwIiBmaWxsPSIjNGY0NmU1Ii8+PGNpcmNsZSBjeD0iMTAwIiBjeT0iMTAwIiByPSIyMCIgZmlsbD0iIzYzNjZmMSIvPjwvc3ZnPg==';

  constructor(options: CustomAudioPlayerOptions) {
    this.options = options;

    // 获取容器
    if (typeof options.container === 'string') {
      const el = document.querySelector(options.container);
      if (!el) throw new Error(`Container not found: ${options.container}`);
      this.container = el as HTMLElement;
    } else {
      this.container = options.container;
    }

    // 检查是否有播放列表
    this.hasPlaylist = Array.isArray(options.src) && options.src.length > 1;
    const firstSrc = Array.isArray(options.src) ? options.src[0] : options.src;

    // 创建音频播放器核心
    this.audioPlayer = new AudioPlayer({
      src: firstSrc,
      volume: options.volume ?? 0.8,
      autoplay: options.autoplay ?? false,
    });

    // 创建 UI
    this.createPlayerDOM();

    // 绑定事件
    this.bindEvents();
  }

  private createPlayerDOM(): void {
    const layout = this.options.layout || 'compact';
    const coverStyle = this.options.coverStyle || 'square';

    this.playerContainer = document.createElement('div');
    this.playerContainer.className = `cap cap--${layout}`;
    if (coverStyle === 'round') {
      this.playerContainer.classList.add('cap--cd');
    }

    // 播放列表控制按钮
    const playlistControls = this.hasPlaylist ? `
      <button class="cap__btn cap__btn--small" data-action="prev" title="上一首">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polygon points="19 20 9 12 19 4 19 20"></polygon>
          <line x1="5" y1="19" x2="5" y2="5"></line>
        </svg>
      </button>
      <button class="cap__btn cap__btn--small" data-action="next" title="下一首">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polygon points="5 4 15 12 5 20 5 4"></polygon>
          <line x1="19" y1="5" x2="19" y2="19"></line>
        </svg>
      </button>
    ` : '';

    // 倍速菜单选项
    const speedOptions = this.speeds.map(s =>
      `<div class="cap__speed-option${s === 1 ? ' cap__speed-option--active' : ''}" data-speed="${s}">${s}x</div>`
    ).join('');

    this.playerContainer.innerHTML = `
      <div class="cap__header">
        <div class="cap__cover">
          <img src="${this.options.cover || this.defaultCover}" alt="Cover" class="cap__cover-img" />
        </div>
        <div class="cap__info">
          <h4 class="cap__title">${this.options.title || '未知歌曲'}</h4>
          <p class="cap__artist">${this.options.artist || '未知艺术家'}</p>
        </div>
      </div>
      <div class="cap__main-row">
        <button class="cap__btn cap__btn--main" data-action="play" title="播放">
          <svg class="cap__icon-play" width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
            <polygon points="5 3 19 12 5 21 5 3"></polygon>
          </svg>
          <svg class="cap__icon-pause" width="22" height="22" viewBox="0 0 24 24" fill="currentColor" style="display:none">
            <rect x="6" y="4" width="4" height="16"></rect>
            <rect x="14" y="4" width="4" height="16"></rect>
          </svg>
        </button>
        <div class="cap__progress">
          <span class="cap__time-current">0:00</span>
          <div class="cap__progress-bar">
            <div class="cap__progress-fill"></div>
          </div>
          <span class="cap__time-duration">0:00</span>
        </div>
        ${playlistControls}
        <div class="cap__speed-wrapper">
          <button class="cap__btn cap__btn--text" data-action="speed" title="播放速度">1x</button>
          <div class="cap__speed-menu">${speedOptions}</div>
        </div>
        <div class="cap__volume-wrapper">
          <button class="cap__btn cap__btn--small" data-action="volume" title="音量">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
            </svg>
          </button>
          <div class="cap__volume-popup">
            <div class="cap__volume-slider">
              <div class="cap__volume-fill" style="height: 80%"></div>
            </div>
          </div>
        </div>
      </div>
    `;

    // 应用主题色
    if (this.options.themeColor) {
      this.playerContainer.style.setProperty('--cap-primary', this.options.themeColor);
    }

    // 应用高度设置
    if (this.options.height) {
      const h = typeof this.options.height === 'number' ? `${this.options.height}px` : this.options.height;
      this.playerContainer.style.height = h;
    }

    this.container.appendChild(this.playerContainer);

    // 如果需要显示歌词，添加歌词容器（放在 header 和 main-row 之间）
    if (this.options.showLyrics !== false) {
      this.lyricsContainer = document.createElement('div');
      this.lyricsContainer.className = 'cap__lyrics';
      // 设置歌词区域高度
      const lyricsHeight = this.options.lyricsHeight || 150;
      const lh = typeof lyricsHeight === 'number' ? `${lyricsHeight}px` : lyricsHeight;
      this.lyricsContainer.style.height = lh;

      this.lyricsContainer.innerHTML = `
        <div class="cap__lyrics-wrapper">
          <div class="cap__lyrics-scroll">
            <div class="cap__lyrics-line cap__lyrics-line--prev"></div>
            <div class="cap__lyrics-line cap__lyrics-line--current">♪ 暂无歌词</div>
            <div class="cap__lyrics-line cap__lyrics-line--next"></div>
          </div>
        </div>
      `;
      // 插入到 header 后面、main-row 前面
      const mainRow = this.playerContainer.querySelector('.cap__main-row');
      if (mainRow) {
        this.playerContainer.insertBefore(this.lyricsContainer, mainRow);
      } else {
        this.playerContainer.appendChild(this.lyricsContainer);
      }
    }

    // 获取 UI 元素引用
    this.coverImg = this.playerContainer.querySelector('.cap__cover-img') as HTMLImageElement;
    this.titleEl = this.playerContainer.querySelector('.cap__title') as HTMLElement;
    this.artistEl = this.playerContainer.querySelector('.cap__artist') as HTMLElement;
    this.progressBar = this.playerContainer.querySelector('.cap__progress-bar') as HTMLElement;
    this.progressFill = this.playerContainer.querySelector('.cap__progress-fill') as HTMLElement;
    this.currentTimeEl = this.playerContainer.querySelector('.cap__time-current') as HTMLElement;
    this.durationEl = this.playerContainer.querySelector('.cap__time-duration') as HTMLElement;
    this.playBtn = this.playerContainer.querySelector('[data-action="play"]') as HTMLElement;
    this.prevBtn = this.playerContainer.querySelector('[data-action="prev"]') as HTMLElement;
    this.nextBtn = this.playerContainer.querySelector('[data-action="next"]') as HTMLElement;
    this.volumeBtn = this.playerContainer.querySelector('[data-action="volume"]') as HTMLElement;
    this.volumeSlider = this.playerContainer.querySelector('.cap__volume-slider') as HTMLElement;
    this.volumeFill = this.playerContainer.querySelector('.cap__volume-fill') as HTMLElement;
    this.volumePopup = this.playerContainer.querySelector('.cap__volume-popup') as HTMLElement;
    this.speedBtn = this.playerContainer.querySelector('[data-action="speed"]') as HTMLElement;
    this.speedMenu = this.playerContainer.querySelector('.cap__speed-menu') as HTMLElement;
  }

  private bindEvents(): void {
    // 播放/暂停
    this.playBtn.addEventListener('click', () => {
      if (this.isPlaying) {
        this.pause();
      } else {
        this.play();
      }
    });

    // 上一首/下一首（仅在有播放列表时有效）
    if (this.prevBtn) {
      this.prevBtn.addEventListener('click', () => this.audioPlayer.prev?.());
    }
    if (this.nextBtn) {
      this.nextBtn.addEventListener('click', () => this.audioPlayer.next?.());
    }

    // 进度条点击
    this.progressBar.addEventListener('click', (e) => {
      const rect = this.progressBar.getBoundingClientRect();
      const percent = (e.clientX - rect.left) / rect.width;
      const duration = this.audioPlayer.getDuration() || 0;
      this.audioPlayer.seek(duration * percent);
    });

    // 音量弹窗控制
    if (this.volumeBtn && this.volumePopup) {
      this.volumeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.volumePopup!.classList.toggle('cap__volume-popup--visible');
      });

      // 点击外部关闭弹窗
      document.addEventListener('click', () => {
        this.volumePopup?.classList.remove('cap__volume-popup--visible');
      });
    }

    // 音量滑块（垂直方向）
    if (this.volumeSlider) {
      this.volumeSlider.addEventListener('click', (e) => {
        e.stopPropagation();
        const rect = this.volumeSlider.getBoundingClientRect();
        const percent = 1 - (e.clientY - rect.top) / rect.height;
        const vol = Math.max(0, Math.min(1, percent));
        this.audioPlayer.setVolume(vol);
        this.volumeFill.style.height = `${vol * 100}%`;
        this.updateVolumeIcon(vol === 0);
      });
    }

    // 倍速菜单
    if (this.speedBtn && this.speedMenu) {
      this.speedBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.speedMenu!.classList.toggle('cap__speed-menu--visible');
        this.volumePopup?.classList.remove('cap__volume-popup--visible');
      });

      // 倍速选项点击
      this.speedMenu.addEventListener('click', (e) => {
        e.stopPropagation();
        const target = e.target as HTMLElement;
        if (target.classList.contains('cap__speed-option')) {
          const speed = parseFloat(target.dataset.speed || '1');
          this.currentSpeed = speed;
          this.audioPlayer.setPlaybackRate?.(speed);
          this.speedBtn.textContent = `${speed}x`;

          // 更新选中状态
          this.speedMenu!.querySelectorAll('.cap__speed-option').forEach(el => {
            el.classList.remove('cap__speed-option--active');
          });
          target.classList.add('cap__speed-option--active');
          this.speedMenu!.classList.remove('cap__speed-menu--visible');
        }
      });

      // 点击外部关闭菜单
      document.addEventListener('click', () => {
        this.speedMenu?.classList.remove('cap__speed-menu--visible');
      });
    }

    // 监听播放器事件
    this.audioPlayer.on('play', () => {
      this.isPlaying = true;
      this.updatePlayIcon();
      this.updateCDRotation(true);
    });

    this.audioPlayer.on('pause', () => {
      this.isPlaying = false;
      this.updatePlayIcon();
      this.updateCDRotation(false);
    });

    this.audioPlayer.on('timeupdate', (data: any) => {
      const current = data.currentTime || 0;
      const duration = data.duration || 0;
      const percent = duration > 0 ? (current / duration) * 100 : 0;

      this.progressFill.style.width = `${percent}%`;
      this.currentTimeEl.textContent = this.formatTime(current);
      this.durationEl.textContent = this.formatTime(duration);

      // 更新歌词
      this.updateLyrics(current);
    });

    // 加载歌词
    if (this.options.lyrics) {
      this.loadLyrics(this.options.lyrics);
    }
  }

  private updateCDRotation(playing: boolean): void {
    const cover = this.playerContainer.querySelector('.cap__cover');
    if (cover) {
      if (playing) {
        cover.classList.add('cap__cover--playing');
      } else {
        cover.classList.remove('cap__cover--playing');
      }
    }
  }

  private async loadLyrics(lyricsSource: string): Promise<void> {
    this.lyricsParser = new LyricsParser();

    // 判断是URL还是LRC内容
    if (lyricsSource.startsWith('http') || lyricsSource.startsWith('/')) {
      try {
        await this.lyricsParser.loadFromUrl(lyricsSource);
      } catch (e) {
        console.warn('加载歌词失败:', e);
      }
    } else {
      this.lyricsParser.parse(lyricsSource);
    }
  }

  private updateLyrics(currentTime: number): void {
    if (!this.lyricsParser || !this.lyricsContainer) return;

    const lyrics = this.lyricsParser.getLyrics();
    if (!lyrics || lyrics.length === 0) return;

    // 找到当前歌词
    let newIndex = -1;
    for (let i = lyrics.length - 1; i >= 0; i--) {
      if (currentTime >= lyrics[i].time) {
        newIndex = i;
        break;
      }
    }

    if (newIndex !== this.currentLyricIndex && newIndex >= 0) {
      const prevIndex = this.currentLyricIndex;
      this.currentLyricIndex = newIndex;

      const prevLyric = lyrics[newIndex - 1];
      const currentLyric = lyrics[newIndex];
      const nextLyric = lyrics[newIndex + 1];

      const scrollContainer = this.lyricsContainer.querySelector('.cap__lyrics-scroll');
      if (scrollContainer) {
        // 添加切换动画类
        scrollContainer.classList.add('cap__lyrics-scroll--animating');

        // 更新内容
        setTimeout(() => {
          scrollContainer.innerHTML = `
            <div class="cap__lyrics-line cap__lyrics-line--prev">${prevLyric?.text || ''}</div>
            <div class="cap__lyrics-line cap__lyrics-line--current">${currentLyric.text || '♪'}</div>
            <div class="cap__lyrics-line cap__lyrics-line--next">${nextLyric?.text || ''}</div>
          `;
          scrollContainer.classList.remove('cap__lyrics-scroll--animating');
        }, 150);
      } else {
        // 兼容旧结构
        this.lyricsContainer.innerHTML = `
          <div class="cap__lyrics-wrapper">
            <div class="cap__lyrics-scroll">
              <div class="cap__lyrics-line cap__lyrics-line--prev">${prevLyric?.text || ''}</div>
              <div class="cap__lyrics-line cap__lyrics-line--current">${currentLyric.text || '♪'}</div>
              <div class="cap__lyrics-line cap__lyrics-line--next">${nextLyric?.text || ''}</div>
            </div>
          </div>
        `;
      }
    }
  }

  private formatTime(seconds: number): string {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  private updatePlayIcon(): void {
    const playIcon = this.playBtn.querySelector('.cap__icon-play') as HTMLElement;
    const pauseIcon = this.playBtn.querySelector('.cap__icon-pause') as HTMLElement;

    if (this.isPlaying) {
      playIcon.style.display = 'none';
      pauseIcon.style.display = 'block';
    } else {
      playIcon.style.display = 'block';
      pauseIcon.style.display = 'none';
    }
  }

  private updateVolumeIcon(muted: boolean): void {
    const svg = muted
      ? '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><line x1="23" y1="9" x2="17" y2="15"></line><line x1="17" y1="9" x2="23" y2="15"></line></svg>'
      : '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>';
    this.volumeBtn.innerHTML = svg;
  }

  // 公共 API
  public play(): void {
    this.audioPlayer.play();
  }

  public pause(): void {
    this.audioPlayer.pause();
  }

  public seek(time: number): void {
    this.audioPlayer.seek(time);
  }

  public setVolume(volume: number): void {
    this.audioPlayer.setVolume(volume);
    this.volumeFill.style.width = `${volume * 100}%`;
  }

  public setSrc(src: string): void {
    this.audioPlayer.load(src);
  }

  public setTrackInfo(title: string, artist: string, cover?: string): void {
    this.titleEl.textContent = title;
    this.artistEl.textContent = artist;
    if (cover) {
      this.coverImg.src = cover;
    }
  }

  public getAudioPlayer(): AudioPlayer {
    return this.audioPlayer;
  }

  public setLyrics(lyrics: string): void {
    this.loadLyrics(lyrics);
  }

  public getCurrentLyric(): string {
    if (!this.lyricsParser) return '';
    const lyrics = this.lyricsParser.getLyrics();
    if (this.currentLyricIndex >= 0 && lyrics[this.currentLyricIndex]) {
      return lyrics[this.currentLyricIndex].text;
    }
    return '';
  }

  public setHeight(height: number | string): void {
    const h = typeof height === 'number' ? `${height}px` : height;
    this.playerContainer.style.height = h;
  }

  public getContainer(): HTMLElement {
    return this.playerContainer;
  }

  public destroy(): void {
    this.audioPlayer.destroy();
    this.playerContainer.remove();
  }
}
