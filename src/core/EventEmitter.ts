/**
 * 事件发射器 - 类型安全的事件系统
 */

import type { PlayerEventMap, EventListener } from '../types/events';

export class EventEmitter {
  private listeners: Map<keyof PlayerEventMap, Set<EventListener<any>>> = new Map();

  /**
   * 订阅事件
   */
  on<K extends keyof PlayerEventMap>(
    event: K,
    listener: EventListener<K>
  ): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }

    this.listeners.get(event)!.add(listener);

    // 返回取消订阅函数
    return () => this.off(event, listener);
  }

  /**
   * 订阅一次性事件
   */
  once<K extends keyof PlayerEventMap>(
    event: K,
    listener: EventListener<K>
  ): () => void {
    const wrapper: EventListener<K> = (data) => {
      this.off(event, wrapper);
      listener(data);
    };

    return this.on(event, wrapper);
  }

  /**
   * 取消订阅
   */
  off<K extends keyof PlayerEventMap>(
    event: K,
    listener: EventListener<K>
  ): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.delete(listener);
      if (eventListeners.size === 0) {
        this.listeners.delete(event);
      }
    }
  }

  /**
   * 触发事件
   */
  emit<K extends keyof PlayerEventMap>(
    event: K,
    data: PlayerEventMap[K]
  ): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach(listener => {
        try {
          listener(data);
        } catch (error) {
          console.error(`Error in event listener for ${String(event)}:`, error);
        }
      });
    }
  }

  /**
   * 清除所有事件监听器
   */
  clear(): void {
    this.listeners.clear();
  }

  /**
   * 清除特定事件的所有监听器
   */
  clearEvent<K extends keyof PlayerEventMap>(event: K): void {
    this.listeners.delete(event);
  }

  /**
   * 获取事件监听器数量
   */
  listenerCount<K extends keyof PlayerEventMap>(event: K): number {
    return this.listeners.get(event)?.size || 0;
  }

  /**
   * 获取所有事件名称
   */
  eventNames(): Array<keyof PlayerEventMap> {
    return Array.from(this.listeners.keys());
  }
}

