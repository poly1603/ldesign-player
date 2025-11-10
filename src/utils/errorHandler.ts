/**
 * 错误处理工具类
 */

/**
 * 播放器错误类型
 */
export enum PlayerErrorType {
  LOAD_ERROR = 'LOAD_ERROR',
  PLAY_ERROR = 'PLAY_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  DECODE_ERROR = 'DECODE_ERROR',
  FORMAT_ERROR = 'FORMAT_ERROR',
  PERMISSION_ERROR = 'PERMISSION_ERROR',
  NOT_SUPPORTED = 'NOT_SUPPORTED',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

/**
 * 播放器错误类
 */
export class PlayerError extends Error {
  public readonly type: PlayerErrorType;
  public readonly code?: number;
  public readonly details?: any;
  public readonly recoverable: boolean;

  constructor(
    message: string,
    type: PlayerErrorType = PlayerErrorType.UNKNOWN_ERROR,
    options?: {
      code?: number;
      details?: any;
      recoverable?: boolean;
    }
  ) {
    super(message);
    this.name = 'PlayerError';
    this.type = type;
    this.code = options?.code;
    this.details = options?.details;
    this.recoverable = options?.recoverable ?? false;
  }
}

/**
 * 错误处理器
 */
export class ErrorHandler {
  private static readonly ERROR_MESSAGES: Record<PlayerErrorType, string> = {
    [PlayerErrorType.LOAD_ERROR]: '无法加载媒体文件',
    [PlayerErrorType.PLAY_ERROR]: '播放失败',
    [PlayerErrorType.NETWORK_ERROR]: '网络错误',
    [PlayerErrorType.DECODE_ERROR]: '解码错误',
    [PlayerErrorType.FORMAT_ERROR]: '格式不支持',
    [PlayerErrorType.PERMISSION_ERROR]: '权限不足',
    [PlayerErrorType.NOT_SUPPORTED]: '浏览器不支持此功能',
    [PlayerErrorType.UNKNOWN_ERROR]: '未知错误',
  };

  /**
   * 处理媒体错误
   */
  static handleMediaError(error: MediaError | null): PlayerError {
    if (!error) {
      return new PlayerError('未知媒体错误', PlayerErrorType.UNKNOWN_ERROR);
    }

    switch (error.code) {
      case MediaError.MEDIA_ERR_ABORTED:
        return new PlayerError(
          '媒体加载被用户中止',
          PlayerErrorType.LOAD_ERROR,
          { code: error.code, recoverable: true }
        );

      case MediaError.MEDIA_ERR_NETWORK:
        return new PlayerError(
          '网络错误导致媒体下载失败',
          PlayerErrorType.NETWORK_ERROR,
          { code: error.code, recoverable: true }
        );

      case MediaError.MEDIA_ERR_DECODE:
        return new PlayerError(
          '媒体解码失败',
          PlayerErrorType.DECODE_ERROR,
          { code: error.code, recoverable: false }
        );

      case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
        return new PlayerError(
          '不支持的媒体格式或源',
          PlayerErrorType.FORMAT_ERROR,
          { code: error.code, recoverable: false }
        );

      default:
        return new PlayerError(
          error.message || '未知媒体错误',
          PlayerErrorType.UNKNOWN_ERROR,
          { code: error.code }
        );
    }
  }

  /**
   * 处理播放错误
   */
  static handlePlayError(error: Error): PlayerError {
    const message = error.message.toLowerCase();

    if (message.includes('permission') || message.includes('gesture')) {
      return new PlayerError(
        '需要用户交互才能播放',
        PlayerErrorType.PERMISSION_ERROR,
        { details: error, recoverable: true }
      );
    }

    if (message.includes('network')) {
      return new PlayerError(
        '网络错误',
        PlayerErrorType.NETWORK_ERROR,
        { details: error, recoverable: true }
      );
    }

    if (message.includes('format') || message.includes('codec')) {
      return new PlayerError(
        '不支持的媒体格式',
        PlayerErrorType.FORMAT_ERROR,
        { details: error, recoverable: false }
      );
    }

    return new PlayerError(
      error.message || '播放失败',
      PlayerErrorType.PLAY_ERROR,
      { details: error }
    );
  }

  /**
   * 获取用户友好的错误消息
   */
  static getFriendlyMessage(error: PlayerError): string {
    const baseMessage = this.ERROR_MESSAGES[error.type] || error.message;
    
    if (error.recoverable) {
      return `${baseMessage}，请重试`;
    }
    
    return baseMessage;
  }

  /**
   * 尝试恢复错误
   */
  static async tryRecover(
    error: PlayerError,
    retryCallback: () => Promise<void>,
    maxRetries = 3
  ): Promise<void> {
    if (!error.recoverable) {
      throw error;
    }

    let lastError: Error = error;
    
    for (let i = 0; i < maxRetries; i++) {
      try {
        // 等待递增的时间后重试
        await new Promise(resolve => setTimeout(resolve, (i + 1) * 1000));
        await retryCallback();
        return; // 成功恢复
      } catch (e) {
        lastError = e as Error;
        console.warn(`恢复尝试 ${i + 1}/${maxRetries} 失败:`, e);
      }
    }

    throw lastError;
  }

  /**
   * 安全执行函数
   */
  static async safeExecute<T>(
    fn: () => T | Promise<T>,
    fallback?: T,
    errorCallback?: (error: Error) => void
  ): Promise<T | undefined> {
    try {
      return await fn();
    } catch (error) {
      const err = error as Error;
      console.error('执行错误:', err);
      
      if (errorCallback) {
        errorCallback(err);
      }
      
      return fallback;
    }
  }

  /**
   * 验证媒体源
   */
  static validateMediaSource(src: string | File | Blob): void {
    if (!src) {
      throw new PlayerError('媒体源不能为空', PlayerErrorType.LOAD_ERROR);
    }

    if (typeof src === 'string') {
      // 验证URL格式
      try {
        const url = new URL(src, window.location.href);
        
        // 检查协议
        if (!['http:', 'https:', 'blob:', 'data:'].includes(url.protocol)) {
          throw new PlayerError(
            `不支持的协议: ${url.protocol}`,
            PlayerErrorType.FORMAT_ERROR
          );
        }
      } catch (e) {
        if (!(e instanceof PlayerError)) {
          throw new PlayerError(
            '无效的媒体URL',
            PlayerErrorType.LOAD_ERROR,
            { details: e }
          );
        }
        throw e;
      }
    } else if (src instanceof File) {
      // 验证文件类型
      if (!src.type.startsWith('audio/') && !src.type.startsWith('video/')) {
        throw new PlayerError(
          `不支持的文件类型: ${src.type}`,
          PlayerErrorType.FORMAT_ERROR
        );
      }
    }
  }

  /**
   * 检查浏览器支持
   */
  static checkBrowserSupport(feature: string): void {
    const features: Record<string, boolean> = {
      audio: typeof Audio !== 'undefined',
      video: typeof HTMLVideoElement !== 'undefined',
      webAudio: typeof AudioContext !== 'undefined' || typeof (window as any).webkitAudioContext !== 'undefined',
      mediaSource: typeof MediaSource !== 'undefined',
      pictureInPicture: 'pictureInPictureEnabled' in document,
      fullscreen: document.fullscreenEnabled || (document as any).webkitFullscreenEnabled,
    };

    if (!features[feature]) {
      throw new PlayerError(
        `浏览器不支持: ${feature}`,
        PlayerErrorType.NOT_SUPPORTED,
        { recoverable: false }
      );
    }
  }
}