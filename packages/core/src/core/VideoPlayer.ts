/**
 * 视频播放器核心类
 */

import { EventEmitter } from './EventEmitter';
import { StateManager } from './StateManager';
import { playerManager } from './PlayerManager';
import { SubtitleParser } from '../video/SubtitleParser';
import { PlayState, type IPlayer } from '../types/player';
import type { VideoPlayerConfig, VideoSource } from '../types/video';
import {
  generateId,
  clamp,
  deepMerge,
  requestFullscreen,
  exitFullscreen,
  getFullscreenElement,
  isPictureInPictureSupported,
  getBufferedPercent,
} from '../utils/helpers';

/**
 * 默认配置
 */
const DEFAULT_CONFIG: Required<Omit<VideoPlayerConfig, 'src'>> = {
  poster: '',
  autoplay: false,
  loop: false,
  muted: false,
  preload: 'metadata',
  volume: 1,
  playbackRate: 1,
  loopMode: 'none',
  aspectRatio: '16:9',
  controls: true,
  fullscreen: true,
  pictureInPicture: true,
  quality: {
    auto: true,
  },
  subtitle: {
    enabled: false,
  },
};

/**
 * 视频播放器类
 */
export class VideoPlayer extends EventEmitter implements IPlayer {
  private id: string;
  private config: Required<VideoPlayerConfig>;
  private container: HTMLElement | null = null;
  private videoElement: HTMLVideoElement;
  private stateManager: StateManager;
  private subtitleParser: SubtitleParser;
  private isDestroyed = false;
  private updateTimer: number | null = null;
  private currentQuality: string | null = null;

  constructor(container: HTMLElement | string, config: VideoPlayerConfig = {}) {
    super();

    // 获取容器
    if (typeof container === 'string') {
      this.container = document.querySelector(container);
    } else {
      this.container = container;
    }

    if (!this.container) {
      throw new Error('Container element not found');
    }

    // 合并配置
    this.config = deepMerge({ ...DEFAULT_CONFIG }, config) as Required<VideoPlayerConfig>;

    // 生成 ID
    this.id = generateId('video-player');

    // 创建视频元素
    this.videoElement = this.createVideoElement();

    // 初始化状态管理器
    this.stateManager = new StateManager({
      volume: this.config.volume,
      muted: this.config.muted,
      playbackRate: this.config.playbackRate,
      loopMode: this.config.loopMode,
    });

    // 初始化字幕解析器
    this.subtitleParser = new SubtitleParser();

    // 注册到管理器
    playerManager.register(this.id, this);

    // 初始化
    this.init();
  }

  /**
   * 创建视频元素
   */
  private createVideoElement(): HTMLVideoElement {
    const video = document.createElement('video');

    video.style.width = '100%';
    video.style.height = '100%';
    video.style.objectFit = 'contain';

    if (this.config.poster) {
      video.poster = this.config.poster;
    }

    video.autoplay = this.config.autoplay;
    video.loop = this.config.loop;
    video.muted = this.config.muted;
    video.preload = this.config.preload;
    video.controls = this.config.controls;
    video.volume = this.config.volume;
    video.playbackRate = this.config.playbackRate;

    return video;
  }

  /**
   * 初始化
   */
  private init(): void {
    // 添加到容器
    this.container?.appendChild(this.videoElement);

    // 绑定事件
    this.bindVideoEvents();

    // 加载视频源
    if (this.config.src) {
      this.load(this.config.src);
    }

    // 加载字幕
    if (this.config.subtitle.enabled && this.config.subtitle.src) {
      this.loadSubtitle(this.config.subtitle.src);
    }
  }

  /**
   * 绑定视频事件
   */
  private bindVideoEvents(): void {
    this.videoElement.addEventListener('loadstart', () => {
      this.stateManager.set('playState', PlayState.LOADING);
      this.emit('loadstart', undefined);
    });

    this.videoElement.addEventListener('loadeddata', () => {
      this.emit('loadeddata', undefined);
    });

    this.videoElement.addEventListener('loadedmetadata', () => {
      const duration = this.videoElement.duration;
      this.stateManager.set('duration', duration);
      this.emit('loadedmetadata', undefined);
      this.emit('durationchange', { duration });
    });

    this.videoElement.addEventListener('canplay', () => {
      this.emit('canplay', undefined);
    });

    this.videoElement.addEventListener('canplaythrough', () => {
      this.emit('canplaythrough', undefined);
    });

    this.videoElement.addEventListener('play', () => {
      this.stateManager.set('playState', PlayState.PLAYING);
      this.emit('play', undefined);
      this.startUpdateTimer();
    });

    this.videoElement.addEventListener('pause', () => {
      this.stateManager.set('playState', PlayState.PAUSED);
      this.emit('pause', undefined);
      this.stopUpdateTimer();
    });

    this.videoElement.addEventListener('ended', () => {
      this.stateManager.set('playState', PlayState.ENDED);
      this.emit('ended', undefined);
      this.stopUpdateTimer();
    });

    this.videoElement.addEventListener('seeking', () => {
      this.emit('seeking', undefined);
    });

    this.videoElement.addEventListener('seeked', () => {
      this.emit('seeked', undefined);
    });

    this.videoElement.addEventListener('timeupdate', () => {
      const currentTime = this.videoElement.currentTime;
      const duration = this.videoElement.duration;
      this.stateManager.set('currentTime', currentTime);
      this.emit('timeupdate', { currentTime, duration });
    });

    this.videoElement.addEventListener('progress', () => {
      const buffered = getBufferedPercent(this.videoElement.buffered, this.videoElement.currentTime);
      this.stateManager.set('buffered', buffered);
      this.emit('progress', { buffered });
    });

    this.videoElement.addEventListener('volumechange', () => {
      const volume = this.videoElement.volume;
      const muted = this.videoElement.muted;
      this.stateManager.setState({ volume, muted });
      this.emit('volumechange', { volume, muted });
    });

    this.videoElement.addEventListener('ratechange', () => {
      const rate = this.videoElement.playbackRate;
      this.stateManager.set('playbackRate', rate);
      this.emit('ratechange', { rate });
    });

    this.videoElement.addEventListener('error', () => {
      const error = this.videoElement.error;
      const errorMessage = error ? `Video error: ${error.message}` : 'Unknown video error';
      this.stateManager.setState({
        playState: PlayState.ERROR,
        error: errorMessage,
      });
      this.emit('error', { message: errorMessage, code: error?.code });
    });
  }

  /**
   * 加载视频
   */
  load(src: string | VideoSource): void {
    if (typeof src === 'string') {
      this.videoElement.src = src;
    } else {
      this.videoElement.src = src.src;
      // HTMLVideoElement 没有 type 属性，需要通过 source 元素设置
      if (src.type) {
        // 移除旧的 source 元素
        const sources = this.videoElement.querySelectorAll('source');
        sources.forEach(s => s.remove());
        
        // 创建新的 source 元素
        const source = document.createElement('source');
        source.src = src.src;
        source.type = src.type;
        this.videoElement.appendChild(source);
      }
      if (src.quality) {
        this.currentQuality = src.quality.label;
      }
    }

    this.videoElement.load();
  }

  /**
   * 播放
   */
  async play(): Promise<void> {
    // 暂停其他播放器
    playerManager.pauseOthers(this.id);

    try {
      await this.videoElement.play();
    } catch (error) {
      console.error('Play error:', error);
      throw error;
    }
  }

  /**
   * 暂停
   */
  pause(): void {
    this.videoElement.pause();
  }

  /**
   * 停止
   */
  stop(): void {
    this.videoElement.pause();
    this.videoElement.currentTime = 0;
    this.stateManager.setState({
      playState: PlayState.STOPPED,
      currentTime: 0,
    });
    this.emit('stop', undefined);
  }

  /**
   * 跳转
   */
  seek(time: number): void {
    const duration = this.videoElement.duration;
    this.videoElement.currentTime = clamp(time, 0, duration);
  }

  /**
   * 设置音量
   */
  setVolume(volume: number): void {
    this.videoElement.volume = clamp(volume, 0, 1);
  }

  /**
   * 静音
   */
  mute(): void {
    this.videoElement.muted = true;
  }

  /**
   * 取消静音
   */
  unmute(): void {
    this.videoElement.muted = false;
  }

  /**
   * 设置播放速率
   */
  setPlaybackRate(rate: number): void {
    this.videoElement.playbackRate = clamp(rate, 0.25, 2);
  }

  /**
   * 获取播放速率
   */
  getPlaybackRate(): number {
    return this.videoElement.playbackRate;
  }

  /**
   * 请求全屏
   */
  async requestFullscreen(): Promise<void> {
    if (!this.config.fullscreen) {
      throw new Error('Fullscreen is disabled');
    }

    if (this.container) {
      await requestFullscreen(this.container);
    }
  }

  /**
   * 退出全屏
   */
  async exitFullscreen(): Promise<void> {
    await exitFullscreen();
  }

  /**
   * 是否全屏
   */
  isFullscreen(): boolean {
    return getFullscreenElement() === this.container;
  }

  /**
   * 切换全屏
   */
  async toggleFullscreen(): Promise<void> {
    if (this.isFullscreen()) {
      await this.exitFullscreen();
    } else {
      await this.requestFullscreen();
    }
  }

  /**
   * 请求画中画
   */
  async requestPictureInPicture(): Promise<PictureInPictureWindow> {
    if (!this.config.pictureInPicture) {
      throw new Error('Picture-in-Picture is disabled');
    }

    if (!isPictureInPictureSupported()) {
      throw new Error('Picture-in-Picture is not supported');
    }

    return await (this.videoElement as any).requestPictureInPicture();
  }

  /**
   * 退出画中画
   */
  async exitPictureInPicture(): Promise<void> {
    if ((document as any).pictureInPictureElement) {
      await (document as any).exitPictureInPicture();
    }
  }

  /**
   * 是否在画中画模式
   */
  isPictureInPicture(): boolean {
    return (document as any).pictureInPictureElement === this.videoElement;
  }

  /**
   * 切换画中画
   */
  async togglePictureInPicture(): Promise<void> {
    if (this.isPictureInPicture()) {
      await this.exitPictureInPicture();
    } else {
      await this.requestPictureInPicture();
    }
  }

  /**
   * 加载字幕
   */
  async loadSubtitle(url: string): Promise<void> {
    await this.subtitleParser.loadFromUrl(url);
  }

  /**
   * 获取字幕解析器
   */
  getSubtitleParser(): SubtitleParser {
    return this.subtitleParser;
  }

  /**
   * 获取当前字幕
   */
  getCurrentSubtitle(): string | null {
    const cue = this.subtitleParser.getCurrentCue(this.videoElement.currentTime);
    return cue ? cue.text : null;
  }

  /**
   * 切换质量
   */
  switchQuality(quality: VideoSource): void {
    const currentTime = this.videoElement.currentTime;
    const wasPlaying = !this.videoElement.paused;

    this.load(quality);

    // 恢复播放位置
    this.videoElement.addEventListener('loadedmetadata', () => {
      this.videoElement.currentTime = currentTime;
      if (wasPlaying) {
        this.play();
      }
    }, { once: true });

    this.currentQuality = quality.quality?.label || null;
  }

  /**
   * 获取当前质量
   */
  getCurrentQuality(): string | null {
    return this.currentQuality;
  }

  /**
   * 截图
   */
  screenshot(): string {
    const canvas = document.createElement('canvas');
    canvas.width = this.videoElement.videoWidth;
    canvas.height = this.videoElement.videoHeight;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(this.videoElement, 0, 0, canvas.width, canvas.height);
    }

    return canvas.toDataURL('image/png');
  }

  /**
   * 获取视频元素
   */
  getVideoElement(): HTMLVideoElement {
    return this.videoElement;
  }

  /**
   * 获取状态
   */
  getState() {
    return this.stateManager.getState();
  }

  /**
   * 获取当前时间
   */
  getCurrentTime(): number {
    return this.videoElement.currentTime;
  }

  /**
   * 获取总时长
   */
  getDuration(): number {
    return this.videoElement.duration;
  }

  /**
   * 获取音量
   */
  getVolume(): number {
    return this.videoElement.volume;
  }

  /**
   * 是否静音
   */
  isMuted(): boolean {
    return this.videoElement.muted;
  }

  /**
   * 是否正在播放
   */
  isPlaying(): boolean {
    return !this.videoElement.paused && !this.videoElement.ended;
  }

  /**
   * 启动更新定时器
   */
  private startUpdateTimer(): void {
    // 视频元素已经有 timeupdate 事件，这里可以留空或做额外处理
  }

  /**
   * 停止更新定时器
   */
  private stopUpdateTimer(): void {
    if (this.updateTimer !== null) {
      cancelAnimationFrame(this.updateTimer);
      this.updateTimer = null;
    }
  }

  /**
   * 销毁播放器
   */
  destroy(): void {
    if (this.isDestroyed) return;

    this.stopUpdateTimer();
    this.videoElement.pause();
    this.videoElement.src = '';
    this.videoElement.load();

    if (this.container && this.videoElement.parentNode === this.container) {
      this.container.removeChild(this.videoElement);
    }

    this.stateManager.clear();
    this.subtitleParser.clear();
    this.clear();

    playerManager.unregister(this.id);
    this.isDestroyed = true;
  }
}

