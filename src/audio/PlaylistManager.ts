/**
 * 播放列表管理器
 */

import type { Track } from '../types/player';
import type { LoopMode } from '../types/events';
import { shuffle } from '../utils/helpers';
import { EventEmitter } from '../core/EventEmitter';

export class PlaylistManager extends EventEmitter {
  private playlist: Track[] = [];
  private currentIndex = -1;
  private loopMode: LoopMode = 'none';
  private shuffledIndices: number[] = [];
  private isShuffled = false;

  constructor(tracks: Track[] = []) {
    super();
    this.playlist = tracks;
  }

  /**
   * 添加轨道
   */
  add(track: Track, index?: number): void {
    if (index !== undefined && index >= 0 && index <= this.playlist.length) {
      this.playlist.splice(index, 0, track);
    } else {
      this.playlist.push(track);
    }
    this.updateShuffledIndices();
    this.emit('playlistchange', { playlist: this.getAll() });
  }

  /**
   * 添加多个轨道
   */
  addMultiple(tracks: Track[]): void {
    this.playlist.push(...tracks);
    this.updateShuffledIndices();
    this.emit('playlistchange', { playlist: this.getAll() });
  }

  /**
   * 移除轨道
   */
  remove(index: number): Track | undefined {
    if (index >= 0 && index < this.playlist.length) {
      const removed = this.playlist.splice(index, 1)[0];

      // 更新当前索引
      if (index < this.currentIndex) {
        this.currentIndex--;
      } else if (index === this.currentIndex) {
        // 如果移除的是当前播放的轨道，保持索引不变（将播放下一首）
        if (this.currentIndex >= this.playlist.length) {
          this.currentIndex = this.playlist.length - 1;
        }
      }

      this.updateShuffledIndices();
      this.emit('playlistchange', { playlist: this.getAll() });
      return removed;
    }
    return undefined;
  }

  /**
   * 根据 ID 移除轨道
   */
  removeById(id: string): boolean {
    const index = this.playlist.findIndex(track => track.id === id);
    if (index !== -1) {
      this.remove(index);
      return true;
    }
    return false;
  }

  /**
   * 移除所有轨道
   */
  clear(): void {
    this.playlist = [];
    this.currentIndex = -1;
    this.shuffledIndices = [];
    this.emit('playlistchange', { playlist: [] });
  }

  /**
   * 重新排序（拖拽排序）
   */
  reorder(fromIndex: number, toIndex: number): boolean {
    if (
      fromIndex < 0 ||
      fromIndex >= this.playlist.length ||
      toIndex < 0 ||
      toIndex >= this.playlist.length
    ) {
      return false;
    }

    const [track] = this.playlist.splice(fromIndex, 1);
    this.playlist.splice(toIndex, 0, track);

    // 更新当前索引
    if (this.currentIndex === fromIndex) {
      this.currentIndex = toIndex;
    } else if (fromIndex < this.currentIndex && toIndex >= this.currentIndex) {
      this.currentIndex--;
    } else if (fromIndex > this.currentIndex && toIndex <= this.currentIndex) {
      this.currentIndex++;
    }

    this.updateShuffledIndices();
    this.emit('playlistchange', { playlist: this.getAll() });
    return true;
  }

  /**
   * 获取轨道
   */
  get(index: number): Track | undefined {
    return this.playlist[index];
  }

  /**
   * 根据 ID 获取轨道
   */
  getById(id: string): Track | undefined {
    return this.playlist.find(track => track.id === id);
  }

  /**
   * 获取所有轨道
   */
  getAll(): Track[] {
    return [...this.playlist];
  }

  /**
   * 获取当前轨道
   */
  getCurrent(): Track | undefined {
    return this.currentIndex >= 0 ? this.playlist[this.currentIndex] : undefined;
  }

  /**
   * 获取当前索引
   */
  getCurrentIndex(): number {
    return this.currentIndex;
  }

  /**
   * 设置当前索引
   */
  setCurrentIndex(index: number): boolean {
    if (index >= 0 && index < this.playlist.length) {
      this.currentIndex = index;
      const track = this.playlist[index];
      if (track) {
        this.emit('trackchange', { index, track });
      }
      return true;
    }
    return false;
  }

  /**
   * 获取播放列表长度
   */
  length(): number {
    return this.playlist.length;
  }

  /**
   * 检查是否为空
   */
  isEmpty(): boolean {
    return this.playlist.length === 0;
  }

  /**
   * 设置循环模式
   */
  setLoopMode(mode: LoopMode): void {
    this.loopMode = mode;
    this.isShuffled = mode === 'random';
    if (this.isShuffled) {
      this.updateShuffledIndices();
    }
    this.emit('loopmodechange', { mode });
  }

  /**
   * 获取循环模式
   */
  getLoopMode(): LoopMode {
    return this.loopMode;
  }

  /**
   * 获取下一首索引
   */
  getNextIndex(): number {
    if (this.playlist.length === 0) {
      return -1;
    }

    switch (this.loopMode) {
      case 'single':
        return this.currentIndex;

      case 'random':
        return this.getRandomNextIndex();

      case 'list':
        return (this.currentIndex + 1) % this.playlist.length;

      case 'none':
      default:
        const nextIndex = this.currentIndex + 1;
        return nextIndex < this.playlist.length ? nextIndex : -1;
    }
  }

  /**
   * 获取上一首索引
   */
  getPreviousIndex(): number {
    if (this.playlist.length === 0) {
      return -1;
    }

    switch (this.loopMode) {
      case 'single':
        return this.currentIndex;

      case 'random':
        return this.getRandomPreviousIndex();

      case 'list':
      case 'none':
      default:
        const prevIndex = this.currentIndex - 1;
        return prevIndex >= 0 ? prevIndex : (this.loopMode === 'list' ? this.playlist.length - 1 : -1);
    }
  }

  /**
   * 切换到下一首
   */
  next(): Track | undefined {
    const nextIndex = this.getNextIndex();
    if (nextIndex !== -1) {
      this.setCurrentIndex(nextIndex);
      return this.getCurrent();
    }
    return undefined;
  }

  /**
   * 切换到上一首
   */
  previous(): Track | undefined {
    const prevIndex = this.getPreviousIndex();
    if (prevIndex !== -1) {
      this.setCurrentIndex(prevIndex);
      return this.getCurrent();
    }
    return undefined;
  }

  /**
   * 更新随机播放索引
   */
  private updateShuffledIndices(): void {
    if (this.isShuffled && this.playlist.length > 0) {
      this.shuffledIndices = shuffle(
        Array.from({ length: this.playlist.length }, (_, i) => i)
      );
    }
  }

  /**
   * 获取随机的下一首索引
   */
  private getRandomNextIndex(): number {
    if (this.shuffledIndices.length === 0) {
      this.updateShuffledIndices();
    }

    const currentShuffledPos = this.shuffledIndices.indexOf(this.currentIndex);
    const nextShuffledPos = (currentShuffledPos + 1) % this.shuffledIndices.length;
    return this.shuffledIndices[nextShuffledPos];
  }

  /**
   * 获取随机的上一首索引
   */
  private getRandomPreviousIndex(): number {
    if (this.shuffledIndices.length === 0) {
      this.updateShuffledIndices();
    }

    const currentShuffledPos = this.shuffledIndices.indexOf(this.currentIndex);
    const prevShuffledPos =
      currentShuffledPos === 0
        ? this.shuffledIndices.length - 1
        : currentShuffledPos - 1;
    return this.shuffledIndices[prevShuffledPos];
  }

  /**
   * 查找轨道索引
   */
  findIndex(predicate: (track: Track) => boolean): number {
    return this.playlist.findIndex(predicate);
  }

  /**
   * 过滤轨道
   */
  filter(predicate: (track: Track) => boolean): Track[] {
    return this.playlist.filter(predicate);
  }

  /**
   * 映射轨道
   */
  map<T>(mapper: (track: Track, index: number) => T): T[] {
    return this.playlist.map(mapper);
  }
}

