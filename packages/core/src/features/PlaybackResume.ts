/**
 * 断点续播功能
 * 自动记住每个音视频的播放位置，下次打开自动从上次位置继续播放
 */

import type { IPlayer } from '../types/player';

export interface ResumePosition {
  trackId: string;
  position: number;
  duration: number;
  timestamp: Date;
  completed: boolean;
}

export interface PlaybackResumeOptions {
  storageKey?: string;
  minSavePosition?: number; // 最小保存位置（秒），避免保存开头
  maxSavePosition?: number; // 最大保存位置（秒），避免保存结尾
  autoSaveInterval?: number; // 自动保存间隔（毫秒）
  promptUser?: boolean; // 是否询问用户是否继续播放
}

export class PlaybackResume {
  private player: IPlayer;
  private storageKey = 'ldesign-player-resume';
  private positions: Map<string, ResumePosition> = new Map();
  private minSavePosition = 10; // 10秒后才保存
  private maxSavePosition = 10; // 结束前10秒不保存
  private autoSaveInterval = 5000; // 每5秒自动保存
  private saveTimer: number | null = null;
  private promptUser = true;

  constructor(player: IPlayer, options: PlaybackResumeOptions = {}) {
    this.player = player;

    if (options.storageKey) {
      this.storageKey = options.storageKey;
    }
    if (options.minSavePosition !== undefined) {
      this.minSavePosition = options.minSavePosition;
    }
    if (options.maxSavePosition !== undefined) {
      this.maxSavePosition = options.maxSavePosition;
    }
    if (options.autoSaveInterval !== undefined) {
      this.autoSaveInterval = options.autoSaveInterval;
    }
    if (options.promptUser !== undefined) {
      this.promptUser = options.promptUser;
    }

    this.loadFromStorage();
    this.setupListeners();
  }

  /**
   * 设置监听器
   */
  private setupListeners(): void {
    // 定期保存播放位置
    this.player.on('play', () => {
      this.startAutoSave();
    });

    this.player.on('pause', () => {
      this.stopAutoSave();
      this.saveCurrentPosition();
    });

    this.player.on('ended', () => {
      this.stopAutoSave();
      this.markAsCompleted();
    });

    // 页面卸载时保存
    window.addEventListener('beforeunload', () => {
      this.saveCurrentPosition();
    });
  }

  /**
   * 开始自动保存
   */
  private startAutoSave(): void {
    if (this.saveTimer !== null) return;

    this.saveTimer = window.setInterval(() => {
      this.saveCurrentPosition();
    }, this.autoSaveInterval);
  }

  /**
   * 停止自动保存
   */
  private stopAutoSave(): void {
    if (this.saveTimer !== null) {
      clearInterval(this.saveTimer);
      this.saveTimer = null;
    }
  }

  /**
   * 保存当前播放位置
   */
  saveCurrentPosition(): void {
    const currentTime = this.player.getCurrentTime();
    const duration = this.player.getDuration();
    const trackId = this.getCurrentTrackId();

    if (!trackId || duration === 0) return;

    // 只保存中间位置
    if (
      currentTime < this.minSavePosition ||
      currentTime > duration - this.maxSavePosition
    ) {
      return;
    }

    const position: ResumePosition = {
      trackId,
      position: currentTime,
      duration,
      timestamp: new Date(),
      completed: false,
    };

    this.positions.set(trackId, position);
    this.saveToStorage();
  }

  /**
   * 标记为已完成
   */
  private markAsCompleted(): void {
    const trackId = this.getCurrentTrackId();
    if (!trackId) return;

    const position = this.positions.get(trackId);
    if (position) {
      position.completed = true;
      this.positions.set(trackId, position);
      this.saveToStorage();
    }
  }

  /**
   * 获取恢复位置
   */
  getResumePosition(trackId: string): number | null {
    const position = this.positions.get(trackId);

    if (!position || position.completed) {
      return null;
    }

    return position.position;
  }

  /**
   * 获取恢复信息
   */
  getResumeInfo(trackId: string): ResumePosition | null {
    return this.positions.get(trackId) || null;
  }

  /**
   * 恢复播放
   */
  async resume(trackId: string): Promise<boolean> {
    const position = this.getResumePosition(trackId);

    if (position === null) {
      return false;
    }

    // 询问用户
    if (this.promptUser) {
      const shouldResume = await this.promptUserResume(position);
      if (!shouldResume) {
        return false;
      }
    }

    this.player.seek(position);
    return true;
  }

  /**
   * 询问用户是否继续播放
   */
  private async promptUserResume(position: number): Promise<boolean> {
    const formatted = this.formatTime(position);

    return new Promise((resolve) => {
      const result = confirm(`从 ${formatted} 继续播放？`);
      resolve(result);
    });
  }

  /**
   * 格式化时间
   */
  private formatTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
      return `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
    return `${minutes}:${String(secs).padStart(2, '0')}`;
  }

  /**
   * 清除指定记录
   */
  clearPosition(trackId: string): void {
    this.positions.delete(trackId);
    this.saveToStorage();
  }

  /**
   * 清除所有记录
   */
  clearAll(): void {
    this.positions.clear();
    this.saveToStorage();
  }

  /**
   * 清除已完成的记录
   */
  clearCompleted(): void {
    for (const [trackId, position] of this.positions.entries()) {
      if (position.completed) {
        this.positions.delete(trackId);
      }
    }
    this.saveToStorage();
  }

  /**
   * 清除旧记录
   */
  clearOldPositions(daysOld = 30): void {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    for (const [trackId, position] of this.positions.entries()) {
      if (new Date(position.timestamp) < cutoffDate) {
        this.positions.delete(trackId);
      }
    }
    this.saveToStorage();
  }

  /**
   * 获取所有位置
   */
  getAllPositions(): ResumePosition[] {
    return Array.from(this.positions.values());
  }

  /**
   * 获取未完成的位置
   */
  getIncompletePositions(): ResumePosition[] {
    return this.getAllPositions().filter(p => !p.completed);
  }

  /**
   * 从 localStorage 加载
   */
  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        this.positions = new Map(
          parsed.map((item: any) => [
            item.trackId,
            {
              ...item,
              timestamp: new Date(item.timestamp),
            },
          ])
        );
      }
    } catch (error) {
      console.error('Failed to load resume positions:', error);
    }
  }

  /**
   * 保存到 localStorage
   */
  private saveToStorage(): void {
    try {
      const data = Array.from(this.positions.values());
      localStorage.setItem(this.storageKey, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save resume positions:', error);
    }
  }

  /**
   * 获取当前音轨 ID
   */
  private getCurrentTrackId(): string | null {
    try {
      const track = (this.player as any).getCurrentTrack?.();
      return track?.id || null;
    } catch {
      return null;
    }
  }

  /**
   * 销毁
   */
  destroy(): void {
    this.stopAutoSave();
    this.saveCurrentPosition();
  }
}
