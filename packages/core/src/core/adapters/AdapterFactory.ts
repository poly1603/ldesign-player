/**
 * 适配器工厂 - 根据媒体格式自动选择合适的适配器
 */

import { MediaFormatDetector, type MediaFormatInfo } from '../MediaFormatDetector';
import { HTML5Adapter } from './HTML5Adapter';
import type { IMediaAdapter, MediaLoadOptions } from './IMediaAdapter';

/**
 * 适配器工厂
 */
export class AdapterFactory {
  /**
   * 创建适配器
   */
  static createAdapter(
    source: string | File | Blob,
    mediaType?: 'audio' | 'video',
    options?: MediaLoadOptions
  ): IMediaAdapter {
    // 检测媒体格式
    const formatInfo = MediaFormatDetector.detect(source);

    // 如果没有指定媒体类型，从格式信息推断
    const type = mediaType || formatInfo.type === 'unknown' ? 'audio' : formatInfo.type;

    // 根据格式选择适配器
    let adapter: IMediaAdapter;

    switch (formatInfo.format) {
      case 'hls':
      case 'dash':
        // 流媒体格式 - 需要特殊适配器（可以后续扩展）
        // 目前回退到 HTML5 适配器
        adapter = new HTML5Adapter(type);
        break;

      case 'unknown':
        // 未知格式，尝试使用 HTML5 适配器
        console.warn('Unknown media format, trying HTML5 adapter');
        adapter = new HTML5Adapter(type);
        break;

      default:
        // 默认使用 HTML5 适配器
        adapter = new HTML5Adapter(type);
        break;
    }

    return adapter;
  }

  /**
   * 检测媒体格式信息
   */
  static detectFormat(source: string | File | Blob): MediaFormatInfo {
    return MediaFormatDetector.detect(source);
  }

  /**
   * 检查格式是否支持
   */
  static isFormatSupported(format: string): boolean {
    return MediaFormatDetector.isFormatSupported(format as any);
  }

  /**
   * 获取推荐的适配器
   */
  static getRecommendedAdapter(
    formatInfo: MediaFormatInfo
  ): new (mediaType?: 'audio' | 'video') => IMediaAdapter {
    if (formatInfo.isStreaming) {
      // 流媒体需要特殊适配器
      // 目前返回 HTML5 适配器，后续可以扩展 HLS/DASH 适配器
      return HTML5Adapter;
    }

    // 默认使用 HTML5 适配器
    return HTML5Adapter;
  }
}






