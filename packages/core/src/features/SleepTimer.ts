/**
 * 睡眠定时器功能
 * 支持定时暂停播放、渐弱音量、完成特定曲目后停止等模式
 */

import type { IPlayer } from '../types/player';

export type SleepTimerMode = 
  | 'duration'      // 固定时长后停止
  | 'time'          // 指定时间停止
  | 'tracks'        // 播放指定曲目数后停止
  | 'endOfTrack';   // 当前曲目结束后停止

export interface SleepTimerOptions {
  /** 播放器实例 */
  player: IPlayer;
  /** 定时器模式 */
  mode?: SleepTimerMode;
  /** 持续时长（分钟），mode 为 'duration' 时使用 */
  duration?: number;
  /** 目标时间，mode 为 'time' 时使用 */
  targetTime?: Date;
  /** 曲目数量，mode 为 'tracks' 时使用 */
  trackCount?: number;
  /** 是否渐弱音量 */
  fadeOut?: boolean;
  /** 渐弱时长（秒） */
  fadeDuration?: number;
  /** 定时器触发时的回调 */
  onTrigger?: () => void;
  /** 倒计时更新回调 */
  onTick?: (remaining: number) => void;
  /** 取消回调 */
  onCancel?: () => void;
}

export interface SleepTimerState {
  isActive: boolean;
  mode: SleepTimerMode | null;
  remainingMs: number;
  targetTime: Date | null;
  tracksRemaining: number;
}

export class SleepTimer {
  private player: IPlayer;
  private mode: SleepTimerMode | null = null;
  private fadeOut: boolean;
  private fadeDuration: number;
  private onTrigger?: () => void;
  private onTick?: (remaining: number) => void;
  private onCancel?: () => void;

  private timerId: number | null = null;
  private targetTime: Date | null = null;
  private tracksRemaining = 0;
  private remainingMs = 0;
  private isActive = false;
  private isFading = false;
  private originalVolume = 1;
  private fadeInterval: number | null = null;
  private trackChangeHandler: (() => void) | null = null;
  private trackEndHandler: (() => void) | null = null;

  // 预设时长选项（分钟）
  public static readonly PRESETS = [5, 10, 15, 30, 45, 60, 90, 120];

  constructor(options: SleepTimerOptions) {
    this.player = options.player;
    this.fadeOut = options.fadeOut ?? true;
    this.fadeDuration = options.fadeDuration ?? 30;
    this.onTrigger = options.onTrigger;
    this.onTick = options.onTick;
    this.onCancel = options.onCancel;
  }

  /**
   * 设置定时时长（分钟）
   */
  public setDuration(minutes: number): void {
    this.cancel();
    this.mode = 'duration';
    this.remainingMs = minutes * 60 * 1000;
    this.targetTime = new Date(Date.now() + this.remainingMs);
    this.startTimer();
  }

  /**
   * 设置目标时间
   */
  public setTargetTime(time: Date): void {
    this.cancel();
    this.mode = 'time';
    this.targetTime = time;
    this.remainingMs = Math.max(0, time.getTime() - Date.now());
    this.startTimer();
  }

  /**
   * 设置播放曲目数后停止
   */
  public setTrackCount(count: number): void {
    this.cancel();
    this.mode = 'tracks';
    this.tracksRemaining = count;
    this.isActive = true;
    this.setupTrackCountListener();
  }

  /**
   * 设置当前曲目结束后停止
   */
  public setEndOfTrack(): void {
    this.cancel();
    this.mode = 'endOfTrack';
    this.isActive = true;
    this.setupEndOfTrackListener();
  }

  /**
   * 延长定时器（分钟）
   */
  public extend(minutes: number): void {
    if (!this.isActive || this.mode !== 'duration') return;
    
    const additionalMs = minutes * 60 * 1000;
    this.remainingMs += additionalMs;
    if (this.targetTime) {
      this.targetTime = new Date(this.targetTime.getTime() + additionalMs);
    }
  }

  /**
   * 取消定时器
   */
  public cancel(): void {
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
    if (this.fadeInterval) {
      clearInterval(this.fadeInterval);
      this.fadeInterval = null;
    }
    this.removeTrackListeners();
    
    const wasActive = this.isActive;
    this.isActive = false;
    this.isFading = false;
    this.mode = null;
    this.targetTime = null;
    this.remainingMs = 0;
    this.tracksRemaining = 0;

    // 恢复音量
    if (this.originalVolume) {
      this.player.setVolume(this.originalVolume);
    }

    if (wasActive && this.onCancel) {
      this.onCancel();
    }
  }

  /**
   * 获取当前状态
   */
  public getState(): SleepTimerState {
    return {
      isActive: this.isActive,
      mode: this.mode,
      remainingMs: this.remainingMs,
      targetTime: this.targetTime,
      tracksRemaining: this.tracksRemaining,
    };
  }

  /**
   * 格式化剩余时间
   */
  public formatRemaining(): string {
    if (!this.isActive) return '';

    if (this.mode === 'tracks') {
      return `${this.tracksRemaining} 首后停止`;
    }

    if (this.mode === 'endOfTrack') {
      return '曲目结束后停止';
    }

    const totalSeconds = Math.floor(this.remainingMs / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  /**
   * 启动定时器
   */
  private startTimer(): void {
    this.isActive = true;
    this.originalVolume = this.player.getVolume();

    this.timerId = window.setInterval(() => {
      this.remainingMs = Math.max(0, this.targetTime!.getTime() - Date.now());

      if (this.onTick) {
        this.onTick(this.remainingMs);
      }

      // 开始渐弱
      if (this.fadeOut && !this.isFading && this.remainingMs <= this.fadeDuration * 1000) {
        this.startFadeOut();
      }

      // 定时器触发
      if (this.remainingMs <= 0) {
        this.trigger();
      }
    }, 1000);
  }

  /**
   * 开始渐弱音量
   */
  private startFadeOut(): void {
    this.isFading = true;
    const currentVolume = this.player.getVolume();
    const steps = this.fadeDuration;
    const volumeStep = currentVolume / steps;
    let step = 0;

    this.fadeInterval = window.setInterval(() => {
      step++;
      const newVolume = Math.max(0, currentVolume - volumeStep * step);
      this.player.setVolume(newVolume);

      if (step >= steps) {
        if (this.fadeInterval) {
          clearInterval(this.fadeInterval);
          this.fadeInterval = null;
        }
      }
    }, 1000);
  }

  /**
   * 触发定时器
   */
  private trigger(): void {
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }

    this.player.pause();
    
    if (this.onTrigger) {
      this.onTrigger();
    }

    // 保持 isActive 为 false，但保留 mode 信息供 UI 显示
    const mode = this.mode;
    this.isActive = false;
    this.mode = null;
    this.isFading = false;

    // 恢复原始音量（下次播放时）
    if (this.originalVolume) {
      this.player.setVolume(this.originalVolume);
    }
  }

  /**
   * 设置曲目计数监听
   */
  private setupTrackCountListener(): void {
    const playerAny = this.player as any;
    
    if (playerAny.on) {
      this.trackChangeHandler = () => {
        this.tracksRemaining--;
        if (this.onTick) {
          this.onTick(this.tracksRemaining);
        }
        if (this.tracksRemaining <= 0) {
          this.trigger();
        }
      };
      playerAny.on('trackchange', this.trackChangeHandler);
    }
  }

  /**
   * 设置曲目结束监听
   */
  private setupEndOfTrackListener(): void {
    const playerAny = this.player as any;
    
    if (playerAny.on) {
      this.trackEndHandler = () => {
        this.trigger();
      };
      playerAny.on('ended', this.trackEndHandler);
    }
  }

  /**
   * 移除轨道监听器
   */
  private removeTrackListeners(): void {
    const playerAny = this.player as any;
    
    if (playerAny.off) {
      if (this.trackChangeHandler) {
        playerAny.off('trackchange', this.trackChangeHandler);
        this.trackChangeHandler = null;
      }
      if (this.trackEndHandler) {
        playerAny.off('ended', this.trackEndHandler);
        this.trackEndHandler = null;
      }
    }
  }

  /**
   * 销毁
   */
  public destroy(): void {
    this.cancel();
  }
}

/**
 * 创建睡眠定时器的便捷函数
 */
export function createSleepTimer(
  player: IPlayer,
  options?: Partial<SleepTimerOptions>
): SleepTimer {
  return new SleepTimer({
    player,
    ...options,
  });
}
