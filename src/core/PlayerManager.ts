/**
 * 播放器管理器 - 全局播放器实例管理
 */

export class PlayerManager {
  private players: Map<string, any> = new Map();
  private activePlayerId: string | null = null;

  /**
   * 注册播放器实例
   */
  register(id: string, player: any): void {
    if (this.players.has(id)) {
      console.warn(`Player with id "${id}" already exists. Overwriting.`);
    }
    this.players.set(id, player);
  }

  /**
   * 注销播放器实例
   */
  unregister(id: string): void {
    this.players.delete(id);
    if (this.activePlayerId === id) {
      this.activePlayerId = null;
    }
  }

  /**
   * 获取播放器实例
   */
  get(id: string): any | undefined {
    return this.players.get(id);
  }

  /**
   * 检查播放器是否存在
   */
  has(id: string): boolean {
    return this.players.has(id);
  }

  /**
   * 获取所有播放器实例
   */
  getAll(): any[] {
    return Array.from(this.players.values());
  }

  /**
   * 获取所有播放器 ID
   */
  getAllIds(): string[] {
    return Array.from(this.players.keys());
  }

  /**
   * 获取播放器数量
   */
  count(): number {
    return this.players.size;
  }

  /**
   * 设置当前活跃播放器
   */
  setActive(id: string): void {
    if (this.players.has(id)) {
      this.activePlayerId = id;
    } else {
      console.warn(`Player with id "${id}" not found.`);
    }
  }

  /**
   * 获取当前活跃播放器
   */
  getActive(): any | null {
    if (this.activePlayerId) {
      return this.players.get(this.activePlayerId);
    }
    return null;
  }

  /**
   * 暂停所有其他播放器（单例播放模式）
   */
  pauseOthers(exceptId: string): void {
    this.players.forEach((player, id) => {
      if (id !== exceptId && player.isPlaying && player.isPlaying()) {
        player.pause();
      }
    });
  }

  /**
   * 暂停所有播放器
   */
  pauseAll(): void {
    this.players.forEach(player => {
      if (player.isPlaying && player.isPlaying()) {
        player.pause();
      }
    });
  }

  /**
   * 销毁所有播放器
   */
  destroyAll(): void {
    this.players.forEach(player => {
      if (player.destroy) {
        player.destroy();
      }
    });
    this.players.clear();
    this.activePlayerId = null;
  }

  /**
   * 清空管理器
   */
  clear(): void {
    this.players.clear();
    this.activePlayerId = null;
  }
}

// 导出单例
export const playerManager = new PlayerManager();

