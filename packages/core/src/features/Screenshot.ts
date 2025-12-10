/**
 * 视频截图功能
 * 支持多种格式和自定义尺寸
 */

export interface ScreenshotOptions {
  /** 视频元素 */
  video: HTMLVideoElement;
  /** 截图格式 */
  format?: 'png' | 'jpeg' | 'webp';
  /** JPEG/WebP 质量 (0-1) */
  quality?: number;
  /** 截图宽度，默认为视频原始宽度 */
  width?: number;
  /** 截图高度，默认为视频原始高度 */
  height?: number;
  /** 文件名前缀 */
  filenamePrefix?: string;
}

export interface ScreenshotResult {
  /** Base64 数据 URL */
  dataUrl: string;
  /** Blob 对象 */
  blob: Blob;
  /** 截图宽度 */
  width: number;
  /** 截图高度 */
  height: number;
  /** 截图时的视频时间点 */
  timestamp: number;
}

export class Screenshot {
  private video: HTMLVideoElement;
  private format: 'png' | 'jpeg' | 'webp';
  private quality: number;
  private width?: number;
  private height?: number;
  private filenamePrefix: string;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  constructor(options: ScreenshotOptions) {
    this.video = options.video;
    this.format = options.format || 'png';
    this.quality = options.quality || 0.92;
    this.width = options.width;
    this.height = options.height;
    this.filenamePrefix = options.filenamePrefix || 'screenshot';

    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d')!;
  }

  /**
   * 截取当前帧
   */
  public async capture(): Promise<ScreenshotResult> {
    const videoWidth = this.video.videoWidth;
    const videoHeight = this.video.videoHeight;

    if (!videoWidth || !videoHeight) {
      throw new Error('Video dimensions not available');
    }

    const width = this.width || videoWidth;
    const height = this.height || videoHeight;

    this.canvas.width = width;
    this.canvas.height = height;

    // 绘制视频帧
    this.ctx.drawImage(this.video, 0, 0, width, height);

    // 获取数据 URL
    const mimeType = `image/${this.format}`;
    const dataUrl = this.canvas.toDataURL(mimeType, this.quality);

    // 转换为 Blob
    const blob = await this.dataUrlToBlob(dataUrl);

    return {
      dataUrl,
      blob,
      width,
      height,
      timestamp: this.video.currentTime,
    };
  }

  /**
   * 截图并下载
   */
  public async download(filename?: string): Promise<void> {
    const result = await this.capture();

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const time = this.formatTime(result.timestamp);
    const name = filename || `${this.filenamePrefix}_${time}_${timestamp}.${this.format}`;

    const link = document.createElement('a');
    link.href = result.dataUrl;
    link.download = name;
    link.click();
  }

  /**
   * 截图并复制到剪贴板
   */
  public async copyToClipboard(): Promise<void> {
    const result = await this.capture();

    try {
      await navigator.clipboard.write([
        new ClipboardItem({
          [result.blob.type]: result.blob,
        }),
      ]);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      throw error;
    }
  }

  /**
   * 截取指定时间点的帧
   */
  public async captureAt(time: number): Promise<ScreenshotResult> {
    return new Promise((resolve, reject) => {
      const currentTime = this.video.currentTime;

      const handleSeeked = async () => {
        this.video.removeEventListener('seeked', handleSeeked);
        try {
          const result = await this.capture();
          // 恢复原来的时间点
          this.video.currentTime = currentTime;
          resolve(result);
        } catch (error) {
          reject(error);
        }
      };

      this.video.addEventListener('seeked', handleSeeked);
      this.video.currentTime = time;
    });
  }

  private dataUrlToBlob(dataUrl: string): Promise<Blob> {
    return new Promise((resolve) => {
      const arr = dataUrl.split(',');
      const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/png';
      const bstr = atob(arr[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }
      resolve(new Blob([u8arr], { type: mime }));
    });
  }

  private formatTime(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);

    if (h > 0) {
      return `${h}-${m.toString().padStart(2, '0')}-${s.toString().padStart(2, '0')}`;
    }
    return `${m}-${s.toString().padStart(2, '0')}`;
  }

  public destroy(): void {
    // 清理 canvas
    this.canvas.width = 0;
    this.canvas.height = 0;
  }
}
