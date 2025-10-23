/**
 * @ldesign/player - 音视频播放器
 * @author LDesign Team
 * @license MIT
 */

// 核心类
export { EventEmitter } from './core/EventEmitter';
export { StateManager } from './core/StateManager';
export { playerManager, PlayerManager } from './core/PlayerManager';
export { AudioPlayer } from './core/AudioPlayer';
export { VideoPlayer } from './core/VideoPlayer';

// 音频功能模块
export { PlaylistManager } from './audio/PlaylistManager';
export { WaveformRenderer } from './audio/WaveformRenderer';
export { LyricsParser } from './audio/LyricsParser';
export { Equalizer } from './audio/Equalizer';
export { AudioEffects } from './audio/AudioEffects';

// 视频功能模块
export { SubtitleParser } from './video/SubtitleParser';

// 工具函数
export * from './utils/helpers';

// 类型定义
export * from './types';

// 默认导出
export { AudioPlayer as default } from './core/AudioPlayer';

// 便捷创建函数
export function createAudioPlayer(config?: import('./types').AudioPlayerConfig) {
  return new AudioPlayer(config);
}

export function createVideoPlayer(
  container: HTMLElement | string,
  config?: import('./types').VideoPlayerConfig
) {
  return new VideoPlayer(container, config);
}
