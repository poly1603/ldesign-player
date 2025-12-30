/**
 * Media Session API 支持
 * 提供系统媒体控制集成，支持锁屏控制、通知中心控制等
 */

import type { IPlayer } from '../types/player';

export interface MediaMetadataInfo {
  title?: string;
  artist?: string;
  album?: string;
  artwork?: Array<{
    src: string;
    sizes?: string;
    type?: string;
  }>;
}

export interface MediaSessionOptions {
  /** 播放器实例 */
  player: IPlayer;
  /** 是否自动更新播放位置 */
  autoUpdatePosition?: boolean;
  /** 位置更新间隔（毫秒） */
  positionUpdateInterval?: number;
  /** 跳转步长（秒） */
  seekOffset?: number;
  /** 快进快退步长（秒） */
  skipTime?: number;
}

export class MediaSessionController {
  private player: IPlayer;
  private autoUpdatePosition: boolean;
  private positionUpdateInterval: number;
  private seekOffset: number;
  private skipTime: number;
  private positionUpdateTimer: number | null = null;
  private isSupported: boolean;

  constructor(options: MediaSessionOptions) {
    this.player = options.player;
    this.autoUpdatePosition = options.autoUpdatePosition ?? true;
    this.positionUpdateInterval = options.positionUpdateInterval ?? 1000;
    this.seekOffset = options.seekOffset ?? 10;
    this.skipTime = options.skipTime ?? 10;
    this.isSupported = 'mediaSession' in navigator;

    if (this.isSupported) {
      this.setupActionHandlers();
    }
  }

  /**
   * 检查是否支持 Media Session API
   */
  public static isSupported(): boolean {
    return 'mediaSession' in navigator;
  }

  /**
   * 设置媒体元数据
   */
  public setMetadata(info: MediaMetadataInfo): void {
    if (!this.isSupported) return;

    const artwork = info.artwork?.map(art => ({
      src: art.src,
      sizes: art.sizes || '512x512',
      type: art.type || 'image/png',
    })) || [];

    navigator.mediaSession.metadata = new MediaMetadata({
      title: info.title || '未知标题',
      artist: info.artist || '未知艺术家',
      album: info.album || '',
      artwork,
    });
  }

  /**
   * 更新播放状态
   */
  public setPlaybackState(state: 'playing' | 'paused' | 'none'): void {
    if (!this.isSupported) return;
    navigator.mediaSession.playbackState = state;
  }

  /**
   * 更新播放位置信息
   */
  public updatePositionState(): void {
    if (!this.isSupported) return;

    try {
      const duration = this.player.getDuration();
      const currentTime = this.player.getCurrentTime();
      const playbackRate = this.player.getPlaybackRate();

      if (duration && !isNaN(duration) && isFinite(duration)) {
        navigator.mediaSession.setPositionState({
          duration,
          playbackRate,
          position: Math.min(currentTime, duration),
        });
      }
    } catch (e) {
      // 某些浏览器可能不支持 setPositionState
      console.debug('MediaSession setPositionState not supported:', e);
    }
  }

  /**
   * 开始自动更新播放位置
   */
  public startPositionUpdates(): void {
    if (!this.autoUpdatePosition || !this.isSupported) return;

    this.stopPositionUpdates();
    this.positionUpdateTimer = window.setInterval(() => {
      this.updatePositionState();
    }, this.positionUpdateInterval);
  }

  /**
   * 停止自动更新播放位置
   */
  public stopPositionUpdates(): void {
    if (this.positionUpdateTimer) {
      clearInterval(this.positionUpdateTimer);
      this.positionUpdateTimer = null;
    }
  }

  /**
   * 设置动作处理器
   */
  private setupActionHandlers(): void {
    const session = navigator.mediaSession;

    // 播放
    session.setActionHandler('play', () => {
      this.player.play();
      this.setPlaybackState('playing');
      this.startPositionUpdates();
    });

    // 暂停
    session.setActionHandler('pause', () => {
      this.player.pause();
      this.setPlaybackState('paused');
      this.stopPositionUpdates();
    });

    // 停止
    session.setActionHandler('stop', () => {
      this.player.stop();
      this.setPlaybackState('none');
      this.stopPositionUpdates();
    });

    // 跳转
    session.setActionHandler('seekto', (details) => {
      if (details.seekTime !== undefined) {
        this.player.seek(details.seekTime);
        this.updatePositionState();
      }
    });

    // 快进
    session.setActionHandler('seekforward', (details) => {
      const offset = details.seekOffset || this.seekOffset;
      const currentTime = this.player.getCurrentTime();
      const duration = this.player.getDuration();
      this.player.seek(Math.min(currentTime + offset, duration));
      this.updatePositionState();
    });

    // 快退
    session.setActionHandler('seekbackward', (details) => {
      const offset = details.seekOffset || this.seekOffset;
      const currentTime = this.player.getCurrentTime();
      this.player.seek(Math.max(currentTime - offset, 0));
      this.updatePositionState();
    });

    // 上一曲（如果支持）
    try {
      session.setActionHandler('previoustrack', () => {
        (this.player as any).prev?.();
      });
    } catch (e) {
      // 不支持 previoustrack
    }

    // 下一曲（如果支持）
    try {
      session.setActionHandler('nexttrack', () => {
        (this.player as any).next?.();
      });
    } catch (e) {
      // 不支持 nexttrack
    }
  }

  /**
   * 自定义动作处理器
   */
  public setActionHandler(
    action: MediaSessionAction,
    handler: MediaSessionActionHandler | null
  ): void {
    if (!this.isSupported) return;
    try {
      navigator.mediaSession.setActionHandler(action, handler);
    } catch (e) {
      console.debug(`MediaSession action '${action}' not supported:`, e);
    }
  }

  /**
   * 绑定播放器事件自动更新状态
   */
  public bindPlayerEvents(): void {
    const player = this.player as any;

    if (player.on) {
      player.on('play', () => {
        this.setPlaybackState('playing');
        this.startPositionUpdates();
      });

      player.on('pause', () => {
        this.setPlaybackState('paused');
        this.stopPositionUpdates();
      });

      player.on('stop', () => {
        this.setPlaybackState('none');
        this.stopPositionUpdates();
      });

      player.on('ended', () => {
        this.setPlaybackState('paused');
        this.stopPositionUpdates();
      });

      player.on('trackchange', (data: any) => {
        if (data?.track) {
          this.setMetadata({
            title: data.track.title,
            artist: data.track.artist,
            album: data.track.album,
            artwork: data.track.cover ? [{ src: data.track.cover }] : undefined,
          });
        }
      });
    }
  }

  /**
   * 销毁
   */
  public destroy(): void {
    this.stopPositionUpdates();

    if (!this.isSupported) return;

    // 清除所有动作处理器
    const actions: MediaSessionAction[] = [
      'play', 'pause', 'stop', 'seekto', 'seekforward', 'seekbackward',
      'previoustrack', 'nexttrack'
    ];

    actions.forEach(action => {
      try {
        navigator.mediaSession.setActionHandler(action, null);
      } catch (e) {
        // 忽略不支持的动作
      }
    });

    navigator.mediaSession.metadata = null;
    navigator.mediaSession.playbackState = 'none';
  }
}

/**
 * 创建 MediaSession 控制器的便捷函数
 */
export function createMediaSession(
  player: IPlayer,
  options?: Partial<MediaSessionOptions>
): MediaSessionController | null {
  if (!MediaSessionController.isSupported()) {
    console.debug('MediaSession API is not supported in this browser');
    return null;
  }

  return new MediaSessionController({
    player,
    ...options,
  });
}
