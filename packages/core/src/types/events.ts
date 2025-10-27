/**
 * 播放器事件类型定义
 */

export type PlayerEventMap = {
  // 播放控制事件
  play: void;
  pause: void;
  stop: void;
  ended: void;
  seeking: void;
  seeked: void;

  // 时间和进度事件
  timeupdate: { currentTime: number; duration: number };
  progress: { buffered: number };
  durationchange: { duration: number };

  // 音量事件
  volumechange: { volume: number; muted: boolean };

  // 加载事件
  loadstart: void;
  loadeddata: void;
  loadedmetadata: void;
  canplay: void;
  canplaythrough: void;

  // 错误事件
  error: { message: string; code?: number };

  // 播放列表事件
  playlistchange: { playlist: any[] };
  trackchange: { index: number; track: any };

  // 状态变化事件
  statechange: { state: string };

  // 速率变化事件
  ratechange: { rate: number };

  // 循环模式变化
  loopmodechange: { mode: LoopMode };
};

export type LoopMode = 'none' | 'single' | 'list' | 'random';

export type PlayerEvent<K extends keyof PlayerEventMap> = {
  type: K;
  data: PlayerEventMap[K];
  timestamp: number;
};

export type EventListener<K extends keyof PlayerEventMap> = (
  data: PlayerEventMap[K]
) => void;

