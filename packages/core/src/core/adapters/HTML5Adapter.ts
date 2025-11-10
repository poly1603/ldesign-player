/**
 * HTML5 媒体适配器 - 基于原生 HTML5 Audio/Video 元素
 */

import { EventEmitter } from '../EventEmitter';
import { PlayState } from '../../types/player';
import type { IMediaAdapter, MediaLoadOptions, AdapterCapabilities } from './IMediaAdapter';
import { clamp } from '../../utils/helpers';

/**
 * HTML5 媒体适配器
 * 支持所有浏览器原生支持的音视频格式
 */
export class HTML5Adapter extends EventEmitter implements IMediaAdapter {
  private mediaElement: HTMLMediaElement | null = null;
  private mediaType: 'audio' | 'video';
  private playState: PlayState = PlayState.IDLE;
  private updateTimer: number | null = null;
  private isDestroyed = false;

  constructor(mediaType: 'audio' | 'video' = 'audio') {
    super();
    this.mediaType = mediaType;
  }

  /**
   * 加载媒体源
   */
  async load(source: string | File | Blob, options: MediaLoadOptions = {}): Promise<void> {
    this.cleanup();

    // 创建媒体元素
    this.mediaElement = this.mediaType === 'audio'
      ? document.createElement('audio')
      : document.createElement('video');

    // 设置属性
    if (options.preload) {
      this.mediaElement.preload = options.preload;
    }
    if (options.autoplay) {
      this.mediaElement.autoplay = true;
    }
    if (options.volume !== undefined) {
      this.mediaElement.volume = clamp(options.volume, 0, 1);
    }
    if (options.muted !== undefined) {
      this.mediaElement.muted = options.muted;
    }
    if (options.playbackRate !== undefined) {
      this.mediaElement.playbackRate = clamp(options.playbackRate, 0.25, 2);
    }
    if (options.loop !== undefined) {
      this.mediaElement.loop = options.loop;
    }

    // 设置源
    let src: string;
    if (typeof source === 'string') {
      src = source;
    } else {
      src = URL.createObjectURL(source);
    }

    this.mediaElement.src = src;

    // 绑定事件
    this.bindEvents();

    // 加载媒体
    return new Promise((resolve, reject) => {
      const onCanPlay = () => {
        this.mediaElement?.removeEventListener('canplay', onCanPlay);
        this.mediaElement?.removeEventListener('error', onError);
        this.playState = PlayState.PAUSED;
        resolve();
      };

      const onError = () => {
        this.mediaElement?.removeEventListener('canplay', onCanPlay);
        this.mediaElement?.removeEventListener('error', onError);
        const error = this.mediaElement?.error;
        const errorMessage = error
          ? `Media error: ${error.message} (code: ${error.code})`
          : 'Failed to load media';
        this.playState = PlayState.ERROR;
        this.emit('error', { message: errorMessage, code: error?.code });
        reject(new Error(errorMessage));
      };

      this.mediaElement?.addEventListener('canplay', onCanPlay, { once: true });
      this.mediaElement?.addEventListener('error', onError, { once: true });
      this.mediaElement?.load();
    });
  }

  /**
   * 绑定事件
   */
  private bindEvents(): void {
    if (!this.mediaElement) return;

    this.mediaElement.addEventListener('loadstart', () => {
      this.playState = PlayState.LOADING;
      this.emit('loadstart', undefined);
    });

    this.mediaElement.addEventListener('loadeddata', () => {
      this.emit('loadeddata', undefined);
    });

    this.mediaElement.addEventListener('loadedmetadata', () => {
      this.emit('loadedmetadata', undefined);
      this.emit('durationchange', { duration: this.mediaElement!.duration });
    });

    this.mediaElement.addEventListener('canplay', () => {
      this.emit('canplay', undefined);
    });

    this.mediaElement.addEventListener('canplaythrough', () => {
      this.emit('canplaythrough', undefined);
    });

    this.mediaElement.addEventListener('play', () => {
      this.playState = PlayState.PLAYING;
      this.emit('play', undefined);
      this.startUpdateTimer();
    });

    this.mediaElement.addEventListener('pause', () => {
      this.playState = PlayState.PAUSED;
      this.emit('pause', undefined);
      this.stopUpdateTimer();
    });

    this.mediaElement.addEventListener('ended', () => {
      this.playState = PlayState.ENDED;
      this.emit('ended', undefined);
      this.stopUpdateTimer();
    });

    this.mediaElement.addEventListener('seeking', () => {
      this.emit('seeking', undefined);
    });

    this.mediaElement.addEventListener('seeked', () => {
      this.emit('seeked', undefined);
    });

    this.mediaElement.addEventListener('timeupdate', () => {
      if (this.mediaElement) {
        this.emit('timeupdate', {
          currentTime: this.mediaElement.currentTime,
          duration: this.mediaElement.duration,
        });
      }
    });

    this.mediaElement.addEventListener('progress', () => {
      if (this.mediaElement) {
        const buffered = this.getBuffered();
        this.emit('progress', { buffered });
      }
    });

    this.mediaElement.addEventListener('volumechange', () => {
      if (this.mediaElement) {
        this.emit('volumechange', {
          volume: this.mediaElement.volume,
          muted: this.mediaElement.muted,
        });
      }
    });

    this.mediaElement.addEventListener('ratechange', () => {
      if (this.mediaElement) {
        this.emit('ratechange', { rate: this.mediaElement.playbackRate });
      }
    });

    this.mediaElement.addEventListener('error', () => {
      const error = this.mediaElement?.error;
      const errorMessage = error
        ? `Media error: ${error.message} (code: ${error.code})`
        : 'Unknown media error';
      this.playState = PlayState.ERROR;
      this.emit('error', { message: errorMessage, code: error?.code });
    });
  }

  /**
   * 播放
   */
  async play(): Promise<void> {
    if (!this.mediaElement) {
      throw new Error('Media not loaded');
    }

    try {
      await this.mediaElement.play();
    } catch (error) {
      console.error('Play error:', error);
      throw error;
    }
  }

  /**
   * 暂停
   */
  pause(): void {
    if (this.mediaElement) {
      this.mediaElement.pause();
    }
  }

  /**
   * 停止
   */
  stop(): void {
    if (this.mediaElement) {
      this.mediaElement.pause();
      this.mediaElement.currentTime = 0;
      this.playState = PlayState.STOPPED;
      this.emit('stop', undefined);
    }
  }

  /**
   * 跳转
   */
  seek(time: number): void {
    if (this.mediaElement) {
      const duration = this.mediaElement.duration;
      this.mediaElement.currentTime = clamp(time, 0, duration || 0);
    }
  }

  /**
   * 设置音量
   */
  setVolume(volume: number): void {
    if (this.mediaElement) {
      this.mediaElement.volume = clamp(volume, 0, 1);
    }
  }

  /**
   * 静音
   */
  mute(): void {
    if (this.mediaElement) {
      this.mediaElement.muted = true;
    }
  }

  /**
   * 取消静音
   */
  unmute(): void {
    if (this.mediaElement) {
      this.mediaElement.muted = false;
    }
  }

  /**
   * 设置播放速率
   */
  setPlaybackRate(rate: number): void {
    if (this.mediaElement) {
      this.mediaElement.playbackRate = clamp(rate, 0.25, 2);
    }
  }

  /**
   * 设置循环播放
   */
  setLoop(loop: boolean): void {
    if (this.mediaElement) {
      this.mediaElement.loop = loop;
    }
  }

  /**
   * 获取播放状态
   */
  getPlayState(): PlayState {
    return this.playState;
  }

  /**
   * 获取当前时间
   */
  getCurrentTime(): number {
    return this.mediaElement?.currentTime || 0;
  }

  /**
   * 获取总时长
   */
  getDuration(): number {
    return this.mediaElement?.duration || 0;
  }

  /**
   * 获取音量
   */
  getVolume(): number {
    return this.mediaElement?.volume || 0;
  }

  /**
   * 是否静音
   */
  isMuted(): boolean {
    return this.mediaElement?.muted || false;
  }

  /**
   * 是否正在播放
   */
  isPlaying(): boolean {
    return !!(this.mediaElement && !this.mediaElement.paused && !this.mediaElement.ended);
  }

  /**
   * 获取播放速率
   */
  getPlaybackRate(): number {
    return this.mediaElement?.playbackRate || 1;
  }

  /**
   * 获取缓冲进度
   */
  getBuffered(): number {
    if (!this.mediaElement || !this.mediaElement.buffered.length) {
      return 0;
    }

    const buffered = this.mediaElement.buffered;
    const currentTime = this.mediaElement.currentTime;

    for (let i = 0; i < buffered.length; i++) {
      if (buffered.start(i) <= currentTime && currentTime <= buffered.end(i)) {
        return buffered.end(i);
      }
    }

    return 0;
  }

  /**
   * 获取媒体元素
   */
  getMediaElement(): HTMLMediaElement | null {
    return this.mediaElement;
  }

  /**
   * 启动更新定时器
   */
  private startUpdateTimer(): void {
    this.stopUpdateTimer();
    // HTML5 媒体元素已经有 timeupdate 事件，这里可以留空
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
   * 清理资源
   */
  private cleanup(): void {
    this.stopUpdateTimer();

    if (this.mediaElement) {
      // 移除事件监听器
      const newElement = this.mediaElement.cloneNode(false) as HTMLMediaElement;
      if (this.mediaElement.parentNode) {
        this.mediaElement.parentNode.replaceChild(newElement, this.mediaElement);
      }
      this.mediaElement = newElement;
    }
  }

  /**
   * 销毁适配器
   */
  destroy(): void {
    if (this.isDestroyed) return;

    this.cleanup();
    this.clear();

    if (this.mediaElement) {
      this.mediaElement.pause();
      this.mediaElement.src = '';
      this.mediaElement.load();
      this.mediaElement = null;
    }

    this.isDestroyed = true;
  }

  /**
   * 获取适配器能力
   */
  static getCapabilities(): AdapterCapabilities {
    return {
      supportedFormats: [
        'mp3', 'wav', 'ogg', 'm4a', 'aac', 'webm-audio',
        'mp4', 'webm-video', 'ogg-video', 'mov',
      ],
      supportsStreaming: false,
      supportsWebAudio: true,
      supportsCustomRender: false,
    };
  }
}






