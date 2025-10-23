/**
 * 音频播放器核心类 - 基于 howler.js
 */

import { Howl, Howler } from 'howler';
import { EventEmitter } from './EventEmitter';
import { StateManager } from './StateManager';
import { playerManager } from './PlayerManager';
import { PlaylistManager } from '../audio/PlaylistManager';
import { PlayState, type IPlayer, type Track } from '../types/player';
import type { AudioPlayerConfig } from '../types/audio';
import type { LoopMode } from '../types/events';
import { generateId, clamp, deepMerge } from '../utils/helpers';

/**
 * 默认配置
 */
const DEFAULT_CONFIG: Required<Omit<AudioPlayerConfig, 'src' | 'playlist'>> = {
  autoplay: false,
  volume: 1,
  muted: false,
  loop: false,
  preload: 'metadata',
  playbackRate: 1,
  loopMode: 'none',
  visualizer: {
    enabled: false,
    type: 'waveform',
    fftSize: 2048,
    smoothingTimeConstant: 0.8,
    minDecibels: -100,
    maxDecibels: -30,
  },
  equalizer: {
    enabled: false,
    preset: 'flat',
  },
  enableWebAudio: true,
};

/**
 * 音频播放器类
 */
export class AudioPlayer extends EventEmitter implements IPlayer {
  private id: string;
  private config: Required<AudioPlayerConfig>;
  private stateManager: StateManager;
  private playlistManager: PlaylistManager;
  private currentHowl: Howl | null = null;
  private audioContext: AudioContext | null = null;
  private sourceNode: MediaElementAudioSourceNode | null = null;
  private isDestroyed = false;
  private updateTimer: number | null = null;
  private fadeTimeout: number | null = null;

  constructor(config: AudioPlayerConfig = {}) {
    super();

    // 合并配置
    this.config = deepMerge({ ...DEFAULT_CONFIG }, config) as Required<AudioPlayerConfig>;

    // 生成 ID
    this.id = generateId('audio-player');

    // 初始化状态管理器
    this.stateManager = new StateManager({
      volume: this.config.volume,
      muted: this.config.muted,
      playbackRate: this.config.playbackRate,
      loopMode: this.config.loopMode,
    });

    // 初始化播放列表管理器
    this.playlistManager = new PlaylistManager(this.config.playlist || []);

    // 监听播放列表事件
    this.playlistManager.on('trackchange', ({ index, track }) => {
      this.loadTrack(track);
      this.emit('trackchange', { index, track });
    });

    this.playlistManager.on('playlistchange', ({ playlist }) => {
      this.emit('playlistchange', { playlist });
    });

    this.playlistManager.on('loopmodechange', ({ mode }) => {
      this.stateManager.set('loopMode', mode);
      this.emit('loopmodechange', { mode });
    });

    // 注册到管理器
    playerManager.register(this.id, this);

    // 初始化
    this.init();
  }

  /**
   * 初始化
   */
  private init(): void {
    // 设置全局音量
    Howler.volume(this.config.volume);
    Howler.mute(this.config.muted);

    // 初始化 Web Audio Context
    if (this.config.enableWebAudio && typeof AudioContext !== 'undefined') {
      this.audioContext = new AudioContext();
    }

    // 加载初始音频
    if (this.config.src) {
      this.load(this.config.src);
    } else if (this.playlistManager.length() > 0) {
      this.playlistManager.setCurrentIndex(0);
    }
  }

  /**
   * 加载音频
   */
  load(src: string | File | Blob): Promise<void> {
    return new Promise((resolve, reject) => {
      this.cleanup();

      this.stateManager.setState({
        playState: PlayState.LOADING,
        error: null,
      });
      this.emit('loadstart', undefined);

      let audioSrc: string;

      if (typeof src === 'string') {
        audioSrc = src;
      } else {
        audioSrc = URL.createObjectURL(src);
      }

      this.currentHowl = new Howl({
        src: [audioSrc],
        html5: true, // 使用 HTML5 Audio 以支持流式播放
        preload: this.config.preload !== 'none',
        autoplay: this.config.autoplay,
        loop: this.config.loop || this.config.loopMode === 'single',
        volume: this.config.volume,
        rate: this.config.playbackRate,
        mute: this.config.muted,

        onload: () => {
          if (!this.currentHowl) return;

          const duration = this.currentHowl.duration();
          this.stateManager.setState({
            playState: this.currentHowl.playing() ? PlayState.PLAYING : PlayState.PAUSED,
            duration,
          });

          this.emit('loadedmetadata', undefined);
          this.emit('canplay', undefined);
          this.emit('durationchange', { duration });

          resolve();
        },

        onloaderror: (_id, error) => {
          const errorMessage = typeof error === 'string' ? error : 'Failed to load audio';
          this.stateManager.setState({
            playState: PlayState.ERROR,
            error: errorMessage,
          });
          this.emit('error', { message: errorMessage });
          reject(new Error(errorMessage));
        },

        onplay: () => {
          this.stateManager.set('playState', PlayState.PLAYING);
          this.emit('play', undefined);
          this.startUpdateTimer();
        },

        onpause: () => {
          this.stateManager.set('playState', PlayState.PAUSED);
          this.emit('pause', undefined);
          this.stopUpdateTimer();
        },

        onstop: () => {
          this.stateManager.set('playState', PlayState.STOPPED);
          this.emit('stop', undefined);
          this.stopUpdateTimer();
        },

        onend: () => {
          this.stateManager.set('playState', PlayState.ENDED);
          this.emit('ended', undefined);
          this.stopUpdateTimer();
          this.handleTrackEnd();
        },

        onseek: () => {
          this.emit('seeked', undefined);
        },

        onrate: () => {
          if (!this.currentHowl) return;
          const rate = this.currentHowl.rate();
          this.stateManager.set('playbackRate', rate);
          this.emit('ratechange', { rate });
        },

        onvolume: () => {
          if (!this.currentHowl) return;
          const volume = this.currentHowl.volume();
          const muted = this.currentHowl.mute();
          this.stateManager.setState({ volume, muted });
          this.emit('volumechange', { volume, muted });
        },
      });
    });
  }

  /**
   * 加载轨道
   */
  private loadTrack(track: Track): void {
    this.load(track.src).catch(error => {
      console.error('Failed to load track:', error);
    });
  }

  /**
   * 播放
   */
  async play(): Promise<void> {
    if (!this.currentHowl) {
      if (this.playlistManager.length() > 0 && this.playlistManager.getCurrentIndex() === -1) {
        this.playlistManager.setCurrentIndex(0);
        return;
      }
      throw new Error('No audio loaded');
    }

    // 暂停其他播放器
    playerManager.pauseOthers(this.id);

    this.currentHowl.play();
  }

  /**
   * 暂停
   */
  pause(): void {
    if (this.currentHowl) {
      this.currentHowl.pause();
    }
  }

  /**
   * 停止
   */
  stop(): void {
    if (this.currentHowl) {
      this.currentHowl.stop();
      this.stateManager.set('currentTime', 0);
    }
  }

  /**
   * 跳转
   */
  seek(time: number): void {
    if (this.currentHowl) {
      const duration = this.currentHowl.duration();
      const clampedTime = clamp(time, 0, duration);

      this.emit('seeking', undefined);
      this.currentHowl.seek(clampedTime);
      this.stateManager.set('currentTime', clampedTime);
      this.emit('timeupdate', { currentTime: clampedTime, duration });
    }
  }

  /**
   * 设置音量
   */
  setVolume(volume: number): void {
    const clampedVolume = clamp(volume, 0, 1);
    this.config.volume = clampedVolume;

    if (this.currentHowl) {
      this.currentHowl.volume(clampedVolume);
    } else {
      Howler.volume(clampedVolume);
      this.stateManager.set('volume', clampedVolume);
      this.emit('volumechange', { volume: clampedVolume, muted: this.config.muted });
    }
  }

  /**
   * 静音
   */
  mute(): void {
    this.config.muted = true;

    if (this.currentHowl) {
      this.currentHowl.mute(true);
    } else {
      Howler.mute(true);
      this.stateManager.set('muted', true);
      this.emit('volumechange', { volume: this.config.volume, muted: true });
    }
  }

  /**
   * 取消静音
   */
  unmute(): void {
    this.config.muted = false;

    if (this.currentHowl) {
      this.currentHowl.mute(false);
    } else {
      Howler.mute(false);
      this.stateManager.set('muted', false);
      this.emit('volumechange', { volume: this.config.volume, muted: false });
    }
  }

  /**
   * 音量淡入淡出
   */
  fade(from: number, to: number, duration: number): void {
    if (this.currentHowl) {
      const clampedFrom = clamp(from, 0, 1);
      const clampedTo = clamp(to, 0, 1);

      this.currentHowl.fade(clampedFrom, clampedTo, duration);

      // 更新配置和状态
      if (this.fadeTimeout) {
        clearTimeout(this.fadeTimeout);
      }

      this.fadeTimeout = window.setTimeout(() => {
        this.config.volume = clampedTo;
        this.stateManager.set('volume', clampedTo);
      }, duration);
    }
  }

  /**
   * 设置播放速率
   */
  setPlaybackRate(rate: number): void {
    const clampedRate = clamp(rate, 0.5, 2);
    this.config.playbackRate = clampedRate;

    if (this.currentHowl) {
      this.currentHowl.rate(clampedRate);
    }
  }

  /**
   * 获取播放速率
   */
  getPlaybackRate(): number {
    return this.currentHowl?.rate() || this.config.playbackRate;
  }

  /**
   * 设置循环模式
   */
  setLoopMode(mode: LoopMode): void {
    this.config.loopMode = mode;
    this.playlistManager.setLoopMode(mode);

    // 更新当前 Howl 的循环设置
    if (this.currentHowl) {
      this.currentHowl.loop(mode === 'single');
    }
  }

  /**
   * 获取循环模式
   */
  getLoopMode(): LoopMode {
    return this.config.loopMode;
  }

  /**
   * 下一首
   */
  next(): void {
    const nextTrack = this.playlistManager.next();
    if (nextTrack && this.isPlaying()) {
      // 自动播放下一首
      setTimeout(() => this.play(), 10);
    }
  }

  /**
   * 上一首
   */
  prev(): void {
    const prevTrack = this.playlistManager.previous();
    if (prevTrack && this.isPlaying()) {
      // 自动播放上一首
      setTimeout(() => this.play(), 10);
    }
  }

  /**
   * 处理轨道结束
   */
  private handleTrackEnd(): void {
    const loopMode = this.getLoopMode();

    if (loopMode === 'single') {
      // 单曲循环由 Howl 自动处理
      return;
    }

    if (loopMode === 'list' || loopMode === 'random') {
      this.next();
    }
  }

  /**
   * 获取播放列表管理器
   */
  getPlaylistManager(): PlaylistManager {
    return this.playlistManager;
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
    return this.currentHowl?.seek() as number || 0;
  }

  /**
   * 获取总时长
   */
  getDuration(): number {
    return this.currentHowl?.duration() || 0;
  }

  /**
   * 获取音量
   */
  getVolume(): number {
    return this.currentHowl?.volume() || this.config.volume;
  }

  /**
   * 是否静音
   */
  isMuted(): boolean {
    return this.currentHowl?.mute() || this.config.muted;
  }

  /**
   * 是否正在播放
   */
  isPlaying(): boolean {
    return this.currentHowl?.playing() || false;
  }

  /**
   * 获取 Audio Context（用于高级音频处理）
   */
  getAudioContext(): AudioContext | null {
    return this.audioContext;
  }

  /**
   * 获取当前 Howl 实例
   */
  getHowl(): Howl | null {
    return this.currentHowl;
  }

  /**
   * 启动更新定时器
   */
  private startUpdateTimer(): void {
    this.stopUpdateTimer();

    const update = () => {
      if (this.currentHowl && this.currentHowl.playing()) {
        const currentTime = this.currentHowl.seek() as number;
        const duration = this.currentHowl.duration();

        this.stateManager.set('currentTime', currentTime);
        this.emit('timeupdate', { currentTime, duration });

        // 更新缓冲进度（howler.js 不直接支持，这里模拟）
        const buffered = Math.min(currentTime + 10, duration);
        this.stateManager.set('buffered', buffered);
        this.emit('progress', { buffered });
      }

      this.updateTimer = requestAnimationFrame(update);
    };

    this.updateTimer = requestAnimationFrame(update);
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
   * 清理当前音频
   */
  private cleanup(): void {
    this.stopUpdateTimer();

    if (this.fadeTimeout) {
      clearTimeout(this.fadeTimeout);
      this.fadeTimeout = null;
    }

    if (this.currentHowl) {
      this.currentHowl.unload();
      this.currentHowl = null;
    }
  }

  /**
   * 销毁播放器
   */
  destroy(): void {
    if (this.isDestroyed) return;

    this.cleanup();
    this.stateManager.clear();
    this.playlistManager.clear();
    this.clear();

    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    playerManager.unregister(this.id);
    this.isDestroyed = true;
  }
}

