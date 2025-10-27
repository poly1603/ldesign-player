/**
 * 视频播放器特有类型定义
 */

import type { BasePlayerConfig } from './player';

/**
 * 视频播放器配置
 */
export interface VideoPlayerConfig extends BasePlayerConfig {
  src?: string | VideoSource;
  poster?: string;
  aspectRatio?: string; // '16:9', '4:3', 'auto'
  controls?: boolean;
  fullscreen?: boolean;
  pictureInPicture?: boolean;
  quality?: QualityConfig;
  subtitle?: SubtitleConfig;
}

/**
 * 视频源
 */
export interface VideoSource {
  src: string;
  type?: string; // 'video/mp4', 'application/x-mpegURL' (HLS), 'application/dash+xml' (DASH)
  quality?: VideoQuality;
}

/**
 * 视频质量
 */
export interface VideoQuality {
  label: string; // '1080p', '720p', '480p', '360p'
  height: number;
  bitrate?: number;
}

/**
 * 质量配置
 */
export interface QualityConfig {
  default?: string; // 默认质量标签
  sources?: VideoSource[];
  auto?: boolean; // 自动切换质量
}

/**
 * 字幕配置
 */
export interface SubtitleConfig {
  enabled?: boolean;
  src?: string;
  default?: boolean;
  label?: string;
  language?: string;
}

/**
 * 字幕行
 */
export interface SubtitleCue {
  start: number; // 秒
  end: number;
  text: string;
}

/**
 * 流媒体配置
 */
export interface StreamConfig {
  type: 'hls' | 'dash' | 'native';
  lowLatency?: boolean;
  maxBufferLength?: number;
  maxMaxBufferLength?: number;
  startLevel?: number;
}

/**
 * 全屏选项
 */
export interface FullscreenOptions {
  navigationUI?: 'auto' | 'hide' | 'show';
}

