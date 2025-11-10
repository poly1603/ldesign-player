/**
 * 通用媒体播放器 - 框架无关的统一播放器接口
 * 支持各种格式的音视频播放
 */

import { EventEmitter } from './EventEmitter';
import { StateManager } from './StateManager';
import { AdapterFactory } from './adapters/AdapterFactory';
import { MediaFormatDetector, type MediaFormatInfo } from './MediaFormatDetector';
import { PlayState, type IPlayer, type PlayerState } from '../types/player';
import type { MediaLoadOptions } from './adapters/IMediaAdapter';
import type { IMediaAdapter } from './adapters/IMediaAdapter';
import { generateId, clamp, deepMerge } from '../utils/helpers';

/**
 * 通用媒体播放器配置
 */
export interface UniversalMediaPlayerConfig extends MediaLoadOptions {
  /**
   * 媒体源（URL、File 或 Blob）
   */
  src?: string | File | Blob;

  /**
   * 媒体类型（如果不指定，会自动检测）
   */
  mediaType?: 'audio' | 'video';

  /**
   * 是否启用自动格式检测
   */
  autoDetectFormat?: boolean;

  /**
   * 自定义适配器（可选）
   */
  adapter?: IMediaAdapter;
}

/**
 * 默认配置
 */
const DEFAULT_CONFIG: Required<Omit<UniversalMediaPlayerConfig, 'src' | 'adapter'>> = {
  autoplay: false,
  preload: 'metadata',
  volume: 1,
  muted: false,
  playbackRate: 1,
  loop: false,
  mediaType: 'audio',
  autoDetectFormat: true,
};

/**
 * 通用媒体播放器
 * 这是一个框架无关的播放器核心，可以在任何框架中使用
 */
export class UniversalMediaPlayer extends EventEmitter implements IPlayer {
  private id: string;
  private config: Required<Omit<UniversalMediaPlayerConfig, 'src' | 'adapter'>> & {
    src?: string | File | Blob;
    adapter?: IMediaAdapter;
  };
  private stateManager: StateManager;
  private adapter: IMediaAdapter | null = null;
  private formatInfo: MediaFormatInfo | null = null;
  private isDestroyed = false;

  constructor(config: UniversalMediaPlayerConfig = {}) {
    super();

    // 合并配置
    this.config = deepMerge({ ...DEFAULT_CONFIG }, config) as typeof this.config;

    // 生成 ID
    this.id = generateId('media-player');

    // 初始化状态管理器
    this.stateManager = new StateManager({
      volume: this.config.volume,
      muted: this.config.muted,
      playbackRate: this.config.playbackRate,
      loopMode: this.config.loop ? 'single' : 'none',
    });

    // 如果有自定义适配器，使用它
    if (this.config.adapter) {
      this.adapter = this.config.adapter;
      this.setupAdapter();
    }

    // 如果有源，加载它
    if (this.config.src) {
      this.load(this.config.src);
    }
  }

  /**
   * 加载媒体源
   */
  async load(source: string | File | Blob): Promise<void> {
    // 检测格式
    if (this.config.autoDetectFormat) {
      this.formatInfo = MediaFormatDetector.detect(source);
    }

    // 创建或使用适配器
    if (!this.adapter) {
      this.adapter = AdapterFactory.createAdapter(
        source,
        this.config.mediaType,
        {
          autoplay: this.config.autoplay,
          preload: this.config.preload,
          volume: this.config.volume,
          muted: this.config.muted,
          playbackRate: this.config.playbackRate,
          loop: this.config.loop,
        }
      );
      this.setupAdapter();
    }

    // 加载媒体
    try {
      await this.adapter.load(source, {
        autoplay: this.config.autoplay,
        preload: this.config.preload,
        volume: this.config.volume,
        muted: this.config.muted,
        playbackRate: this.config.playbackRate,
        loop: this.config.loop,
      });

      // 更新状态
      this.config.src = source;
      this.stateManager.setState({
        playState: this.adapter.getPlayState(),
        duration: this.adapter.getDuration(),
      });
    } catch (error) {
      this.stateManager.setState({
        playState: PlayState.ERROR,
        error: error instanceof Error ? error.message : 'Failed to load media',
      });
      throw error;
    }
  }

  /**
   * 设置适配器事件监听
   */
  private setupAdapter(): void {
    if (!this.adapter) return;

    // 转发适配器事件
    const events: Array<keyof any> = [
      'play', 'pause', 'stop', 'ended',
      'loadstart', 'loadeddata', 'loadedmetadata', 'canplay', 'canplaythrough',
      'seeking', 'seeked', 'timeupdate', 'progress',
      'volumechange', 'ratechange', 'error',
    ];

    events.forEach(event => {
      this.adapter?.on(event as any, (data: any) => {
        // 更新状态
        if (event === 'timeupdate') {
          this.stateManager.set('currentTime', data.currentTime);
          this.stateManager.set('duration', data.duration);
        } else if (event === 'volumechange') {
          this.stateManager.setState({
            volume: data.volume,
            muted: data.muted,
          });
        } else if (event === 'ratechange') {
          this.stateManager.set('playbackRate', data.rate);
        } else if (event === 'play') {
          this.stateManager.set('playState', PlayState.PLAYING);
        } else if (event === 'pause') {
          this.stateManager.set('playState', PlayState.PAUSED);
        } else if (event === 'ended') {
          this.stateManager.set('playState', PlayState.ENDED);
        } else if (event === 'error') {
          this.stateManager.setState({
            playState: PlayState.ERROR,
            error: data.message,
          });
        }

        // 转发事件
        this.emit(event as any, data);
      });
    });
  }

  /**
   * 播放
   */
  async play(): Promise<void> {
    if (!this.adapter) {
      throw new Error('No media loaded');
    }
    await this.adapter.play();
  }

  /**
   * 暂停
   */
  pause(): void {
    if (this.adapter) {
      this.adapter.pause();
    }
  }

  /**
   * 停止
   */
  stop(): void {
    if (this.adapter) {
      this.adapter.stop();
      this.stateManager.set('currentTime', 0);
    }
  }

  /**
   * 跳转
   */
  seek(time: number): void {
    if (this.adapter) {
      this.adapter.seek(time);
    }
  }

  /**
   * 设置音量
   */
  setVolume(volume: number): void {
    const clampedVolume = clamp(volume, 0, 1);
    this.config.volume = clampedVolume;
    if (this.adapter) {
      this.adapter.setVolume(clampedVolume);
    } else {
      this.stateManager.set('volume', clampedVolume);
    }
  }

  /**
   * 静音
   */
  mute(): void {
    this.config.muted = true;
    if (this.adapter) {
      this.adapter.mute();
    } else {
      this.stateManager.set('muted', true);
    }
  }

  /**
   * 取消静音
   */
  unmute(): void {
    this.config.muted = false;
    if (this.adapter) {
      this.adapter.unmute();
    } else {
      this.stateManager.set('muted', false);
    }
  }

  /**
   * 设置播放速率
   */
  setPlaybackRate(rate: number): void {
    const clampedRate = clamp(rate, 0.25, 2);
    this.config.playbackRate = clampedRate;
    if (this.adapter) {
      this.adapter.setPlaybackRate(clampedRate);
    } else {
      this.stateManager.set('playbackRate', clampedRate);
    }
  }

  /**
   * 获取播放速率
   */
  getPlaybackRate(): number {
    return this.adapter?.getPlaybackRate() || this.config.playbackRate;
  }

  /**
   * 设置循环模式
   */
  setLoopMode(mode: 'none' | 'single' | 'list' | 'random'): void {
    const loop = mode === 'single';
    this.config.loop = loop;
    if (this.adapter) {
      this.adapter.setLoop(loop);
    }
  }

  /**
   * 获取循环模式
   */
  getLoopMode(): 'none' | 'single' | 'list' | 'random' {
    return this.config.loop ? 'single' : 'none';
  }

  /**
   * 获取状态
   */
  getState(): PlayerState {
    const state = this.stateManager.getState();
    if (this.adapter) {
      return {
        ...state,
        playState: this.adapter.getPlayState(),
        currentTime: this.adapter.getCurrentTime(),
        duration: this.adapter.getDuration(),
        volume: this.adapter.getVolume(),
        muted: this.adapter.isMuted(),
        playbackRate: this.adapter.getPlaybackRate(),
        buffered: this.adapter.getBuffered(),
      };
    }
    return state;
  }

  /**
   * 获取当前时间
   */
  getCurrentTime(): number {
    return this.adapter?.getCurrentTime() || 0;
  }

  /**
   * 获取总时长
   */
  getDuration(): number {
    return this.adapter?.getDuration() || 0;
  }

  /**
   * 获取音量
   */
  getVolume(): number {
    return this.adapter?.getVolume() || this.config.volume;
  }

  /**
   * 是否静音
   */
  isMuted(): boolean {
    return this.adapter?.isMuted() || this.config.muted;
  }

  /**
   * 是否正在播放
   */
  isPlaying(): boolean {
    return this.adapter?.isPlaying() || false;
  }

  /**
   * 获取格式信息
   */
  getFormatInfo(): MediaFormatInfo | null {
    return this.formatInfo;
  }

  /**
   * 获取适配器
   */
  getAdapter(): IMediaAdapter | null {
    return this.adapter;
  }

  /**
   * 获取媒体元素（如果可用）
   */
  getMediaElement(): HTMLMediaElement | null {
    return this.adapter?.getMediaElement() || null;
  }

  /**
   * 销毁播放器
   */
  destroy(): void {
    if (this.isDestroyed) return;

    if (this.adapter) {
      this.adapter.destroy();
      this.adapter = null;
    }

    this.stateManager.clear();
    this.clear();
    this.isDestroyed = true;
  }
}






