/**
 * 视频下载功能
 */

export interface VideoDownloadOptions {
  video: HTMLVideoElement | string;
  filename?: string;
  onProgress?: (percent: number) => void;
  onComplete?: () => void;
  onError?: (error: Error) => void;
}

export class VideoDownload {
  private url: string;
  private filename: string;
  private onProgress?: (percent: number) => void;
  private onComplete?: () => void;
  private onError?: (error: Error) => void;
  private abortController: AbortController | null = null;

  constructor(options: VideoDownloadOptions) {
    this.url = typeof options.video === 'string'
      ? options.video
      : options.video.currentSrc || options.video.src;
    this.filename = options.filename || this.extractFilename(this.url);
    this.onProgress = options.onProgress;
    this.onComplete = options.onComplete;
    this.onError = options.onError;
  }

  private extractFilename(url: string): string {
    try {
      const pathname = new URL(url).pathname;
      return pathname.split('/').pop() || 'video.mp4';
    } catch {
      return 'video.mp4';
    }
  }

  public async download(): Promise<void> {
    try {
      this.abortController = new AbortController();
      const response = await fetch(this.url, { signal: this.abortController.signal });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const total = parseInt(response.headers.get('content-length') || '0', 10);
      const reader = response.body?.getReader();
      if (!reader) {
        const blob = await response.blob();
        this.downloadBlob(blob);
        return;
      }

      const chunks: BlobPart[] = [];
      let loaded = 0;
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value as BlobPart);
        loaded += value.length;
        if (total) this.onProgress?.((loaded / total) * 100);
      }

      this.downloadBlob(new Blob(chunks, { type: 'video/mp4' }));
      this.onComplete?.();
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        this.onError?.(err as Error);
      }
    }
  }

  private downloadBlob(blob: Blob): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = this.filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  public quickDownload(): void {
    const a = document.createElement('a');
    a.href = this.url;
    a.download = this.filename;
    a.click();
  }

  public cancel(): void {
    this.abortController?.abort();
  }
}
