/**
 * 状态管理器 - 统一管理播放器状态
 */

import { PlayState, type PlayerState } from '../types/player';

export class StateManager {
  private state: PlayerState;
  private listeners: Set<(state: PlayerState) => void> = new Set();

  constructor(initialState?: Partial<PlayerState>) {
    this.state = {
      playState: PlayState.IDLE,
      currentTime: 0,
      duration: 0,
      volume: 1,
      muted: false,
      playbackRate: 1,
      buffered: 0,
      loopMode: 'none',
      currentTrackIndex: -1,
      error: null,
      ...initialState,
    };
  }

  /**
   * 获取当前状态
   */
  getState(): PlayerState {
    return { ...this.state };
  }

  /**
   * 更新状态
   */
  setState(updates: Partial<PlayerState>): void {
    const hasChanges = Object.keys(updates).some(
      key => this.state[key as keyof PlayerState] !== updates[key as keyof PlayerState]
    );

    if (hasChanges) {
      this.state = { ...this.state, ...updates };
      this.notifyListeners();
    }
  }

  /**
   * 获取特定状态值
   */
  get<K extends keyof PlayerState>(key: K): PlayerState[K] {
    return this.state[key];
  }

  /**
   * 设置特定状态值
   */
  set<K extends keyof PlayerState>(key: K, value: PlayerState[K]): void {
    if (this.state[key] !== value) {
      this.state[key] = value;
      this.notifyListeners();
    }
  }

  /**
   * 订阅状态变化
   */
  subscribe(listener: (state: PlayerState) => void): () => void {
    this.listeners.add(listener);
    // 立即通知当前状态
    listener(this.getState());

    // 返回取消订阅函数
    return () => this.unsubscribe(listener);
  }

  /**
   * 取消订阅
   */
  unsubscribe(listener: (state: PlayerState) => void): void {
    this.listeners.delete(listener);
  }

  /**
   * 通知所有监听器
   */
  private notifyListeners(): void {
    const state = this.getState();
    this.listeners.forEach(listener => {
      try {
        listener(state);
      } catch (error) {
        console.error('Error in state listener:', error);
      }
    });
  }

  /**
   * 重置状态
   */
  reset(): void {
    this.setState({
      playState: PlayState.IDLE,
      currentTime: 0,
      duration: 0,
      buffered: 0,
      error: null,
    });
  }

  /**
   * 清除所有监听器
   */
  clear(): void {
    this.listeners.clear();
  }
}

