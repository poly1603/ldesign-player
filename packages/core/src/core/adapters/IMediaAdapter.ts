/**
 * 媒体适配器接口 - 框架无关的媒体播放适配器
 */

import type { PlayState } from '../../types/player';
import type { PlayerEventMap, EventListener } from '../../types/events';

/**
 * 媒体适配器接口
 * 所有媒体播放适配器都需要实现此接口
 */
export interface IMediaAdapter {
  /**
   * 订阅事件
   */
  on<K extends keyof PlayerEventMap>(
    event: K,
    listener: EventListener<K>
  ): () => void;

  /**
   * 订阅一次性事件
   */
  once<K extends keyof PlayerEventMap>(
    event: K,
    listener: EventListener<K>
  ): () => void;

  /**
   * 取消订阅
   */
  off<K extends keyof PlayerEventMap>(
    event: K,
    listener: EventListener<K>
  ): void;

  /**
   * 触发事件
   */
  emit<K extends keyof PlayerEventMap>(
    event: K,
    data: PlayerEventMap[K]
  ): void;
  /**
   * 加载媒体源
   */
  load(source: string | File | Blob, options?: MediaLoadOptions): Promise<void>;

  /**
   * 播放
   */
  play(): Promise<void>;

  /**
   * 暂停
   */
  pause(): void;

  /**
   * 停止
   */
  stop(): void;

  /**
   * 跳转到指定时间
   */
  seek(time: number): void;

  /**
   * 设置音量 (0-1)
   */
  setVolume(volume: number): void;

  /**
   * 静音
   */
  mute(): void;

  /**
   * 取消静音
   */
  unmute(): void;

  /**
   * 设置播放速率
   */
  setPlaybackRate(rate: number): void;

  /**
   * 设置循环播放
   */
  setLoop(loop: boolean): void;

  /**
   * 获取当前播放状态
   */
  getPlayState(): PlayState;

  /**
   * 获取当前播放时间（秒）
   */
  getCurrentTime(): number;

  /**
   * 获取总时长（秒）
   */
  getDuration(): number;

  /**
   * 获取音量 (0-1)
   */
  getVolume(): number;

  /**
   * 是否静音
   */
  isMuted(): boolean;

  /**
   * 是否正在播放
   */
  isPlaying(): boolean;

  /**
   * 获取播放速率
   */
  getPlaybackRate(): number;

  /**
   * 获取缓冲进度（秒）
   */
  getBuffered(): number;

  /**
   * 获取底层媒体元素（如果可用）
   */
  getMediaElement(): HTMLMediaElement | null;

  /**
   * 销毁适配器
   */
  destroy(): void;
}

/**
 * 媒体加载选项
 */
export interface MediaLoadOptions {
  autoplay?: boolean;
  preload?: 'none' | 'metadata' | 'auto';
  volume?: number;
  muted?: boolean;
  playbackRate?: number;
  loop?: boolean;
}

/**
 * 适配器能力
 */
export interface AdapterCapabilities {
  /**
   * 支持的格式列表
   */
  supportedFormats: string[];

  /**
   * 是否支持流媒体
   */
  supportsStreaming: boolean;

  /**
   * 是否支持 Web Audio API
   */
  supportsWebAudio: boolean;

  /**
   * 是否支持自定义渲染
   */
  supportsCustomRender: boolean;
}

