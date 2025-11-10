/**
 * 媒体格式检测器 - 检测和识别各种音视频格式
 */

export type MediaType = 'audio' | 'video' | 'unknown';

export type MediaFormat =
  | 'mp3'
  | 'wav'
  | 'ogg'
  | 'm4a'
  | 'aac'
  | 'flac'
  | 'webm-audio'
  | 'mp4'
  | 'webm-video'
  | 'ogg-video'
  | 'mov'
  | 'avi'
  | 'mkv'
  | 'flv'
  | 'hls'
  | 'dash'
  | 'unknown';

export interface MediaFormatInfo {
  type: MediaType;
  format: MediaFormat;
  mimeType: string;
  extension: string;
  isStreaming: boolean;
  isSupported: boolean;
}

/**
 * MIME 类型映射
 */
const MIME_TYPE_MAP: Record<string, { type: MediaType; format: MediaFormat }> = {
  // 音频格式
  'audio/mpeg': { type: 'audio', format: 'mp3' },
  'audio/mp3': { type: 'audio', format: 'mp3' },
  'audio/wav': { type: 'audio', format: 'wav' },
  'audio/wave': { type: 'audio', format: 'wav' },
  'audio/x-wav': { type: 'audio', format: 'wav' },
  'audio/ogg': { type: 'audio', format: 'ogg' },
  'audio/vorbis': { type: 'audio', format: 'ogg' },
  'audio/mp4': { type: 'audio', format: 'm4a' },
  'audio/x-m4a': { type: 'audio', format: 'm4a' },
  'audio/aac': { type: 'audio', format: 'aac' },
  'audio/flac': { type: 'audio', format: 'flac' },
  'audio/x-flac': { type: 'audio', format: 'flac' },
  'audio/webm': { type: 'audio', format: 'webm-audio' },
  // 视频格式
  'video/mp4': { type: 'video', format: 'mp4' },
  'video/x-m4v': { type: 'video', format: 'mp4' },
  'video/webm': { type: 'video', format: 'webm-video' },
  'video/ogg': { type: 'video', format: 'ogg-video' },
  'video/quicktime': { type: 'video', format: 'mov' },
  'video/x-msvideo': { type: 'video', format: 'avi' },
  'video/x-matroska': { type: 'video', format: 'mkv' },
  'video/x-flv': { type: 'video', format: 'flv' },
  // 流媒体格式
  'application/vnd.apple.mpegurl': { type: 'video', format: 'hls' },
  'application/x-mpegURL': { type: 'video', format: 'hls' },
  'application/dash+xml': { type: 'video', format: 'dash' },
};

/**
 * 文件扩展名映射
 */
const EXTENSION_MAP: Record<string, { type: MediaType; format: MediaFormat }> = {
  // 音频扩展名
  mp3: { type: 'audio', format: 'mp3' },
  wav: { type: 'audio', format: 'wav' },
  ogg: { type: 'audio', format: 'ogg' },
  oga: { type: 'audio', format: 'ogg' },
  m4a: { type: 'audio', format: 'm4a' },
  aac: { type: 'audio', format: 'aac' },
  flac: { type: 'audio', format: 'flac' },
  // 视频扩展名
  mp4: { type: 'video', format: 'mp4' },
  m4v: { type: 'video', format: 'mp4' },
  webm: { type: 'video', format: 'webm-video' },
  ogv: { type: 'video', format: 'ogg-video' },
  mov: { type: 'video', format: 'mov' },
  avi: { type: 'video', format: 'avi' },
  mkv: { type: 'video', format: 'mkv' },
  flv: { type: 'video', format: 'flv' },
  // 流媒体扩展名
  m3u8: { type: 'video', format: 'hls' },
  m3u: { type: 'video', format: 'hls' },
  mpd: { type: 'video', format: 'dash' },
};

/**
 * 流媒体 URL 模式
 */
const STREAMING_PATTERNS = {
  hls: /\.m3u8(\?|$)/i,
  dash: /\.mpd(\?|$)/i,
};

/**
 * 媒体格式检测器
 */
export class MediaFormatDetector {
  /**
   * 检测媒体格式
   */
  static detect(
    source: string | File | Blob,
    explicitMimeType?: string
  ): MediaFormatInfo {
    let url = '';
    let mimeType = explicitMimeType || '';
    let extension = '';

    if (typeof source === 'string') {
      url = source;
      extension = this.getExtensionFromUrl(url);
    } else if (source instanceof File) {
      url = source.name;
      mimeType = source.type || mimeType;
      extension = this.getExtensionFromFilename(source.name);
    } else if (source instanceof Blob) {
      mimeType = source.type || mimeType;
    }

    // 检测流媒体格式
    const streamingFormat = this.detectStreamingFormat(url);
    if (streamingFormat) {
      return {
        type: 'video',
        format: streamingFormat,
        mimeType: streamingFormat === 'hls' ? 'application/vnd.apple.mpegurl' : 'application/dash+xml',
        extension: streamingFormat === 'hls' ? 'm3u8' : 'mpd',
        isStreaming: true,
        isSupported: this.isFormatSupported(streamingFormat),
      };
    }

    // 通过 MIME 类型检测
    if (mimeType) {
      const mimeInfo = MIME_TYPE_MAP[mimeType.toLowerCase()];
      if (mimeInfo) {
        return {
          type: mimeInfo.type,
          format: mimeInfo.format,
          mimeType,
          extension: extension || this.getExtensionFromFormat(mimeInfo.format),
          isStreaming: false,
          isSupported: this.isFormatSupported(mimeInfo.format),
        };
      }
    }

    // 通过文件扩展名检测
    if (extension) {
      const extInfo = EXTENSION_MAP[extension.toLowerCase()];
      if (extInfo) {
        return {
          type: extInfo.type,
          format: extInfo.format,
          mimeType: mimeType || this.getMimeTypeFromFormat(extInfo.format),
          extension,
          isStreaming: false,
          isSupported: this.isFormatSupported(extInfo.format),
        };
      }
    }

    // 默认返回未知格式
    return {
      type: 'unknown',
      format: 'unknown',
      mimeType: mimeType || 'application/octet-stream',
      extension,
      isStreaming: false,
      isSupported: false,
    };
  }

  /**
   * 检测流媒体格式
   */
  private static detectStreamingFormat(url: string): MediaFormat | null {
    if (STREAMING_PATTERNS.hls.test(url)) {
      return 'hls';
    }
    if (STREAMING_PATTERNS.dash.test(url)) {
      return 'dash';
    }
    return null;
  }

  /**
   * 从 URL 获取扩展名
   */
  private static getExtensionFromUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      const lastDot = pathname.lastIndexOf('.');
      if (lastDot !== -1) {
        return pathname.slice(lastDot + 1).toLowerCase();
      }
    } catch {
      // 如果不是有效的 URL，尝试直接解析
      const lastDot = url.lastIndexOf('.');
      if (lastDot !== -1) {
        const ext = url.slice(lastDot + 1).toLowerCase();
        const queryIndex = ext.indexOf('?');
        return queryIndex !== -1 ? ext.slice(0, queryIndex) : ext;
      }
    }
    return '';
  }

  /**
   * 从文件名获取扩展名
   */
  private static getExtensionFromFilename(filename: string): string {
    const lastDot = filename.lastIndexOf('.');
    return lastDot !== -1 ? filename.slice(lastDot + 1).toLowerCase() : '';
  }

  /**
   * 从格式获取扩展名
   */
  private static getExtensionFromFormat(format: MediaFormat): string {
    for (const [ext, info] of Object.entries(EXTENSION_MAP)) {
      if (info.format === format) {
        return ext;
      }
    }
    return '';
  }

  /**
   * 从格式获取 MIME 类型
   */
  private static getMimeTypeFromFormat(format: MediaFormat): string {
    for (const [mime, info] of Object.entries(MIME_TYPE_MAP)) {
      if (info.format === format) {
        return mime;
      }
    }
    return 'application/octet-stream';
  }

  /**
   * 检查格式是否被浏览器支持
   */
  static isFormatSupported(format: MediaFormat): boolean {
    if (typeof document === 'undefined') {
      // 非浏览器环境，假设都支持（需要运行时检测）
      return true;
    }

    const testElement = format.startsWith('webm-audio') || format.includes('audio')
      ? document.createElement('audio')
      : document.createElement('video');

    const mimeTypeMap: Record<MediaFormat, string> = {
      'mp3': 'audio/mpeg',
      'wav': 'audio/wav',
      'ogg': 'audio/ogg',
      'm4a': 'audio/mp4',
      'aac': 'audio/aac',
      'flac': 'audio/flac',
      'webm-audio': 'audio/webm',
      'mp4': 'video/mp4',
      'webm-video': 'video/webm',
      'ogg-video': 'video/ogg',
      'mov': 'video/quicktime',
      'avi': 'video/x-msvideo',
      'mkv': 'video/x-matroska',
      'flv': 'video/x-flv',
      'hls': 'application/vnd.apple.mpegurl',
      'dash': 'application/dash+xml',
      'unknown': '',
    };

    const mimeType = mimeTypeMap[format];
    if (!mimeType) {
      return false;
    }

    // HLS 和 DASH 需要特殊检测
    if (format === 'hls') {
      return this.isHLSSupported();
    }
    if (format === 'dash') {
      return this.isDASHSupported();
    }

    const canPlay = testElement.canPlayType(mimeType);
    return canPlay === 'probably' || canPlay === 'maybe';
  }

  /**
   * 检查 HLS 支持
   */
  static isHLSSupported(): boolean {
    if (typeof document === 'undefined') {
      return false;
    }

    const video = document.createElement('video');
    const canPlayHLS = video.canPlayType('application/vnd.apple.mpegurl');
    
    // 检查是否原生支持 HLS（Safari）
    if (canPlayHLS === 'probably' || canPlayHLS === 'maybe') {
      return true;
    }

    // 检查是否可以通过 MediaSource API 支持（需要 hls.js）
    return typeof MediaSource !== 'undefined';
  }

  /**
   * 检查 DASH 支持
   */
  static isDASHSupported(): boolean {
    if (typeof document === 'undefined') {
      return false;
    }

    // DASH 需要通过 dash.js 库支持
    return typeof MediaSource !== 'undefined';
  }

  /**
   * 获取所有支持的格式
   */
  static getSupportedFormats(): MediaFormat[] {
    const formats: MediaFormat[] = [
      'mp3', 'wav', 'ogg', 'm4a', 'aac', 'flac', 'webm-audio',
      'mp4', 'webm-video', 'ogg-video', 'mov',
    ];

    return formats.filter(format => this.isFormatSupported(format));
  }

  /**
   * 获取推荐的格式列表（按优先级排序）
   */
  static getRecommendedFormats(type: MediaType): MediaFormat[] {
    if (type === 'audio') {
      return ['mp3', 'm4a', 'aac', 'ogg', 'wav', 'flac', 'webm-audio'];
    } else {
      return ['mp4', 'webm-video', 'ogg-video', 'mov'];
    }
  }
}






