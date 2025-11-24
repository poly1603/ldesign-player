/**
 * A-B 循环播放功能
 * 允许用户在两个时间点之间循环播放
 */

import type { IPlayer } from '../types/player';

export type ABLoopEventMap = {
  'pointA-set': { time: number };
  'pointB-set': { time: number };
  'loop-enabled': void;
  'loop-disabled': void;
  'loop-cleared': void;
  'loop-iteration': { iteration: number };
};

export type ABLoopEventListener<K extends keyof ABLoopEventMap> = (
  data: ABLoopEventMap[K]
) => void;

export class ABLoop {
  private player: IPlayer;
  private pointA: number | null = null;
  private pointB: number | null = null;
  private enabled = false;
  private animationId: number | null = null;
  private iterations = 0;
  private listeners: Map<keyof ABLoopEventMap, Set<ABLoopEventListener<any>>> = new Map();

  constructor(player: IPlayer) {
    this.player = player;
  }

  /**
   * 订阅事件
   */
  on<K extends keyof ABLoopEventMap>(
    event: K,
    listener: ABLoopEventListener<K>
  ): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(listener);
    return () => this.off(event, listener);
  }

  /**
   * 取消订阅
   */
  off<K extends keyof ABLoopEventMap>(
    event: K,
    listener: ABLoopEventListener<K>
  ): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.delete(listener);
    }
  }

  /**
   * 触发事件
   */
  private emit<K extends keyof ABLoopEventMap>(
    event: K,
    data: ABLoopEventMap[K]
  ): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach(listener => {
        try {
          listener(data);
        } catch (error) {
          console.error(`Error in ABLoop event listener for ${String(event)}:`, error);
        }
      });
    }
  }

  /**
   * 设置 A 点
   */
  setPointA(time?: number): void {
    this.pointA = time ?? this.player.getCurrentTime();

    // 确保 A < B
    if (this.pointB !== null && this.pointA > this.pointB) {
      [this.pointA, this.pointB] = [this.pointB, this.pointA];
    }

    this.emit('pointA-set', { time: this.pointA });

    // 如果已经启用，重新开始循环
    if (this.enabled) {
      this.startLoop();
    }
  }

  /**
   * 设置 B 点
   */
  setPointB(time?: number): void {
    this.pointB = time ?? this.player.getCurrentTime();

    // 确保 A < B
    if (this.pointA !== null && this.pointB < this.pointA) {
      [this.pointA, this.pointB] = [this.pointB, this.pointA];
    }

    this.emit('pointB-set', { time: this.pointB });

    // 如果已经启用，重新开始循环
    if (this.enabled) {
      this.startLoop();
    }
  }

  /**
   * 清除 A 点
   */
  clearPointA(): void {
    this.pointA = null;
    if (this.pointB === null) {
      this.disable();
    }
  }

  /**
   * 清除 B 点
   */
  clearPointB(): void {
    this.pointB = null;
    if (this.pointA === null) {
      this.disable();
    }
  }

  /**
   * 清除所有点
   */
  clear(): void {
    this.pointA = null;
    this.pointB = null;
    this.disable();
    this.emit('loop-cleared', undefined);
  }

  /**
   * 启用循环
   */
  enable(): void {
    if (this.pointA === null || this.pointB === null) {
      throw new Error('Both point A and point B must be set before enabling loop');
    }

    if (this.pointA >= this.pointB) {
      throw new Error('Point A must be less than point B');
    }

    this.enabled = true;
    this.iterations = 0;
    this.startLoop();
    this.emit('loop-enabled', undefined);
  }

  /**
   * 禁用循环
   */
  disable(): void {
    this.enabled = false;
    this.stopLoop();
    this.emit('loop-disabled', undefined);
  }

  /**
   * 切换启用状态
   */
  toggle(): void {
    if (this.enabled) {
      this.disable();
    } else {
      this.enable();
    }
  }

  /**
   * 是否已启用
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * 获取 A 点
   */
  getPointA(): number | null {
    return this.pointA;
  }

  /**
   * 获取 B 点
   */
  getPointB(): number | null {
    return this.pointB;
  }

  /**
   * 获取循环次数
   */
  getIterations(): number {
    return this.iterations;
  }

  /**
   * 跳转到 A 点
   */
  seekToPointA(): void {
    if (this.pointA !== null) {
      this.player.seek(this.pointA);
    }
  }

  /**
   * 跳转到 B 点
   */
  seekToPointB(): void {
    if (this.pointB !== null) {
      this.player.seek(this.pointB);
    }
  }

  /**
   * 获取循环区间长度（秒）
   */
  getLoopDuration(): number {
    if (this.pointA === null || this.pointB === null) {
      return 0;
    }
    return this.pointB - this.pointA;
  }

  /**
   * 检查时间是否在循环区间内
   */
  isTimeInLoop(time: number): boolean {
    if (this.pointA === null || this.pointB === null) {
      return false;
    }
    return time >= this.pointA && time <= this.pointB;
  }

  /**
   * 开始循环监控
   */
  private startLoop(): void {
    this.stopLoop();

    if (!this.enabled || this.pointA === null || this.pointB === null) {
      return;
    }

    const checkLoop = () => {
      if (!this.enabled) return;

      const currentTime = this.player.getCurrentTime();

      // 如果播放超过 B 点，跳回 A 点
      if (currentTime >= this.pointB!) {
        this.player.seek(this.pointA!);
        this.iterations++;
        this.emit('loop-iteration', { iteration: this.iterations });
      }

      this.animationId = requestAnimationFrame(checkLoop);
    };

    // 如果当前时间不在循环区间内，先跳到 A 点
    const currentTime = this.player.getCurrentTime();
    if (currentTime < this.pointA || currentTime >= this.pointB) {
      this.player.seek(this.pointA);
    }

    this.animationId = requestAnimationFrame(checkLoop);
  }

  /**
   * 停止循环监控
   */
  private stopLoop(): void {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  /**
   * 销毁
   */
  destroy(): void {
    this.disable();
    this.clear();
  }
}
