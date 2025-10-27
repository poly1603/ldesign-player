/**
 * 播放器核心类型定义
 */

import type { LoopMode } from './events';

/**
 * 播放状态
 */
export enum PlayState {
  IDLE = 'idle',
  LOADING = 'loading',
  PLAYING = 'playing',
  PAUSED = 'paused',
  STOPPED = 'stopped',
  ERROR = 'error',
  ENDED = 'ended',
}

/**
 * 播放器状态接口
 */
export interface PlayerState {
  playState: PlayState;
  currentTime: number;
  duration: number;
  volume: number;
  muted: boolean;
  playbackRate: number;
  buffered: number;
  loopMode: LoopMode;
  currentTrackIndex: number;
  error: string | null;
}

/**
 * 基础播放器配置
 */
export interface BasePlayerConfig {
  autoplay?: boolean;
  volume?: number;
  muted?: boolean;
  loop?: boolean;
  preload?: 'none' | 'metadata' | 'auto';
  playbackRate?: number;
  loopMode?: LoopMode;
}

/**
 * 播放器接口
 */
export interface IPlayer {
  // 播放控制
  play(): Promise<void>;
  pause(): void;
  stop(): void;
  seek(time: number): void;

  // 音量控制
  setVolume(volume: number): void;
  mute(): void;
  unmute(): void;

  // 状态获取
  getState(): PlayerState;
  getCurrentTime(): number;
  getDuration(): number;
  getVolume(): number;
  isMuted(): boolean;
  isPlaying(): boolean;

  // 播放速率
  setPlaybackRate(rate: number): void;
  getPlaybackRate(): number;

  // 销毁
  destroy(): void;
}

/**
 * 音频轨道信息
 */
export interface Track {
  id: string;
  title: string;
  artist?: string;
  album?: string;
  duration?: number;
  src: string;
  cover?: string;
  lyrics?: string; // LRC 格式歌词
}

