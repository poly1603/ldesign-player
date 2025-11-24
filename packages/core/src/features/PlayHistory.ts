/**
 * 播放历史记录管理
 * 记录用户的播放行为，提供统计和分析功能
 */

import type { Track } from '../types/player';

export interface PlayRecord {
  trackId: string;
  track?: Track;
  playedAt: Date;
  duration: number;
  playTime: number; // 实际播放时长（秒）
  completed: boolean; // 是否播放完成（>80%视为完成）
}

export interface PlayStatistics {
  totalPlays: number;
  totalPlayTime: number;
  averagePlayTime: number;
  mostPlayed: Array<{ trackId: string; count: number }>;
  recentlyPlayed: PlayRecord[];
}

export class PlayHistory {
  private storageKey = 'ldesign-player-history';
  private history: PlayRecord[] = [];
  private maxRecords = 1000; // 最多保存1000条记录

  constructor(storageKey?: string) {
    if (storageKey) {
      this.storageKey = storageKey;
    }
    this.loadFromStorage();
  }

  /**
   * 添加播放记录
   */
  addRecord(trackId: string, playTime: number, duration: number, track?: Track): void {
    const completed = duration > 0 && (playTime / duration) >= 0.8;

    const record: PlayRecord = {
      trackId,
      track,
      playedAt: new Date(),
      duration,
      playTime,
      completed,
    };

    this.history.unshift(record);

    // 限制记录数量
    if (this.history.length > this.maxRecords) {
      this.history = this.history.slice(0, this.maxRecords);
    }

    this.saveToStorage();
  }

  /**
   * 获取最近播放
   */
  getRecentlyPlayed(limit = 20): PlayRecord[] {
    return this.history.slice(0, limit);
  }

  /**
   * 获取最常播放
   */
  getFrequentlyPlayed(limit = 10): Array<{ trackId: string; count: number; track?: Track }> {
    const countMap = new Map<string, { count: number; track?: Track }>();

    for (const record of this.history) {
      const existing = countMap.get(record.trackId);
      if (existing) {
        existing.count++;
      } else {
        countMap.set(record.trackId, {
          count: 1,
          track: record.track,
        });
      }
    }

    const sorted = Array.from(countMap.entries())
      .map(([trackId, data]) => ({
        trackId,
        count: data.count,
        track: data.track,
      }))
      .sort((a, b) => b.count - a.count);

    return sorted.slice(0, limit);
  }

  /**
   * 获取播放统计
   */
  getStatistics(): PlayStatistics {
    const totalPlays = this.history.length;
    const totalPlayTime = this.history.reduce((sum, record) => sum + record.playTime, 0);
    const averagePlayTime = totalPlays > 0 ? totalPlayTime / totalPlays : 0;

    return {
      totalPlays,
      totalPlayTime,
      averagePlayTime,
      mostPlayed: this.getFrequentlyPlayed(10),
      recentlyPlayed: this.getRecentlyPlayed(20),
    };
  }

  /**
   * 搜索播放记录
   */
  search(keyword: string): PlayRecord[] {
    const lowerKeyword = keyword.toLowerCase();
    return this.history.filter(record => {
      if (!record.track) return false;
      return (
        record.track.title?.toLowerCase().includes(lowerKeyword) ||
        record.track.artist?.toLowerCase().includes(lowerKeyword) ||
        record.track.album?.toLowerCase().includes(lowerKeyword)
      );
    });
  }

  /**
   * 获取指定时间范围的记录
   */
  getRecordsInRange(startDate: Date, endDate: Date): PlayRecord[] {
    return this.history.filter(record => {
      const playedAt = new Date(record.playedAt);
      return playedAt >= startDate && playedAt <= endDate;
    });
  }

  /**
   * 获取今天的播放记录
   */
  getTodayRecords(): PlayRecord[] {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return this.getRecordsInRange(today, tomorrow);
  }

  /**
   * 清除指定天数之前的记录
   */
  clearOldRecords(daysOld = 90): void {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    this.history = this.history.filter(record => {
      const playedAt = new Date(record.playedAt);
      return playedAt >= cutoffDate;
    });

    this.saveToStorage();
  }

  /**
   * 清除所有记录
   */
  clearAll(): void {
    this.history = [];
    this.saveToStorage();
  }

  /**
   * 导出记录为 JSON
   */
  exportToJSON(): string {
    return JSON.stringify(this.history, null, 2);
  }

  /**
   * 从 JSON 导入记录
   */
  importFromJSON(json: string): void {
    try {
      const imported = JSON.parse(json);
      if (Array.isArray(imported)) {
        this.history = imported.map(record => ({
          ...record,
          playedAt: new Date(record.playedAt),
        }));
        this.saveToStorage();
      }
    } catch (error) {
      console.error('Failed to import history:', error);
      throw new Error('Invalid history data');
    }
  }

  /**
   * 从 localStorage 加载
   */
  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        this.history = parsed.map((record: any) => ({
          ...record,
          playedAt: new Date(record.playedAt),
        }));
      }
    } catch (error) {
      console.error('Failed to load history from storage:', error);
    }
  }

  /**
   * 保存到 localStorage
   */
  private saveToStorage(): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.history));
    } catch (error) {
      console.error('Failed to save history to storage:', error);
    }
  }
}
