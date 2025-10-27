/**
 * 音频播放器特有类型定义
 */

import type { BasePlayerConfig, Track } from './player';

/**
 * 音频播放器配置
 */
export interface AudioPlayerConfig extends BasePlayerConfig {
  src?: string;
  playlist?: Track[];
  visualizer?: VisualizerConfig;
  equalizer?: EqualizerConfig;
  enableWebAudio?: boolean; // 是否启用 Web Audio API 高级功能
}

/**
 * 可视化配置
 */
export interface VisualizerConfig {
  enabled?: boolean;
  type?: 'waveform' | 'frequency' | 'oscilloscope';
  fftSize?: 256 | 512 | 1024 | 2048 | 4096 | 8192 | 16384 | 32768;
  smoothingTimeConstant?: number;
  minDecibels?: number;
  maxDecibels?: number;
}

/**
 * 波形渲染配置
 */
export interface WaveformConfig {
  width: number;
  height: number;
  waveColor?: string;
  progressColor?: string;
  cursorColor?: string;
  backgroundColor?: string;
  pixelRatio?: number;
  barWidth?: number;
  barGap?: number;
  normalize?: boolean;
  interact?: boolean;
}

/**
 * 均衡器配置
 */
export interface EqualizerConfig {
  enabled?: boolean;
  preset?: EqualizerPreset;
  bands?: EqualizerBand[];
}

/**
 * 均衡器预设
 */
export type EqualizerPreset =
  | 'flat'
  | 'rock'
  | 'pop'
  | 'jazz'
  | 'classical'
  | 'electronic'
  | 'bass-boost'
  | 'treble-boost'
  | 'vocal-boost'
  | 'custom';

/**
 * 均衡器频段
 */
export interface EqualizerBand {
  frequency: number; // Hz
  gain: number; // dB (-40 to 40)
  Q?: number; // 品质因数
  type?: BiquadFilterType;
}

/**
 * 歌词行
 */
export interface LyricLine {
  time: number; // 秒
  text: string;
  duration?: number;
}

/**
 * 歌词配置
 */
export interface LyricsConfig {
  enabled?: boolean;
  autoScroll?: boolean;
  highlightColor?: string;
  fontSize?: number;
  lineHeight?: number;
}

/**
 * AB 循环配置
 */
export interface ABLoopConfig {
  start: number;
  end: number;
  enabled: boolean;
}

/**
 * 音频效果配置
 */
export interface AudioEffectsConfig {
  pitchShift?: number; // -12 到 12 半音
  reverb?: number; // 0 到 1
  echo?: {
    delay: number;
    feedback: number;
    mix: number;
  };
  compressor?: {
    threshold: number;
    knee: number;
    ratio: number;
    attack: number;
    release: number;
  };
}

