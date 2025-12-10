/**
 * 视频旋转功能
 * 支持顺时针/逆时针旋转，内部旋转和外部旋转
 */

export interface VideoRotateOptions {
  /** 视频元素 */
  video: HTMLVideoElement;
  /** 容器元素 */
  container: HTMLElement;
}

export class VideoRotate {
  private video: HTMLVideoElement;
  private container: HTMLElement;
  private currentRotation = 0;
  private isInnerRotate = true;

  constructor(options: VideoRotateOptions) {
    this.video = options.video;
    this.container = options.container;
  }

  /**
   * 旋转视频
   * @param clockwise 是否顺时针旋转，默认 true
   * @param innerRotate 是否内部旋转（只旋转视频），默认 true
   * @param times 旋转次数（每次90度），默认 1
   */
  public rotate(clockwise = true, innerRotate = true, times = 1): void {
    const degrees = 90 * times * (clockwise ? 1 : -1);
    this.currentRotation = (this.currentRotation + degrees) % 360;
    this.isInnerRotate = innerRotate;
    this.applyRotation();
  }

  /**
   * 重置旋转
   */
  public reset(): void {
    this.currentRotation = 0;
    this.applyRotation();
  }

  /**
   * 获取当前旋转角度
   */
  public getRotation(): number {
    return this.currentRotation;
  }

  /**
   * 顺时针旋转90度
   */
  public rotateClockwise(): void {
    this.rotate(true, this.isInnerRotate, 1);
  }

  /**
   * 逆时针旋转90度
   */
  public rotateCounterClockwise(): void {
    this.rotate(false, this.isInnerRotate, 1);
  }

  private applyRotation(): void {
    const target = this.isInnerRotate ? this.video : this.container;
    const absRotation = Math.abs(this.currentRotation);

    // 计算缩放比例以适应容器
    let scale = 1;
    if (absRotation === 90 || absRotation === 270) {
      const containerWidth = this.container.clientWidth;
      const containerHeight = this.container.clientHeight;
      const videoWidth = this.video.videoWidth || containerWidth;
      const videoHeight = this.video.videoHeight || containerHeight;

      // 旋转90度后，视频的宽高互换
      scale = Math.min(
        containerWidth / videoHeight,
        containerHeight / videoWidth
      );
    }

    target.style.transform = `rotate(${this.currentRotation}deg) scale(${scale})`;
    target.style.transition = 'transform 0.3s ease';
  }

  public destroy(): void {
    this.reset();
  }
}
