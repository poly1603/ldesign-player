/**
 * 主题包接口定义
 * 每个主题包都需要实现这个接口，使用 Canvas 绘制所有 UI 元素
 */

export interface ThemePackage {
  /** 主题名称 */
  name: string;
  /** 主题显示名称 */
  displayName: string;
  /** 主题描述 */
  description?: string;

  /**
   * 绘制播放按钮
   * @param canvas Canvas 元素
   * @param size 按钮大小（宽高）
   * @param isHover 是否悬停状态
   */
  drawPlayButton(canvas: HTMLCanvasElement, size: number, isHover?: boolean): void;

  /**
   * 绘制暂停按钮
   * @param canvas Canvas 元素
   * @param size 按钮大小（宽高）
   * @param isHover 是否悬停状态
   */
  drawPauseButton(canvas: HTMLCanvasElement, size: number, isHover?: boolean): void;

  /**
   * 绘制进度条背景
   * @param canvas Canvas 元素
   * @param width 宽度
   * @param height 高度
   */
  drawProgressBarBackground(canvas: HTMLCanvasElement, width: number, height: number): void;

  /**
   * 绘制进度条已播放部分
   * @param canvas Canvas 元素
   * @param width 宽度
   * @param height 高度
   * @param progress 进度百分比 (0-1)
   */
  drawProgressBarFill(canvas: HTMLCanvasElement, width: number, height: number, progress: number): void;

  /**
   * 绘制进度条滑块（圆点）
   * @param canvas Canvas 元素
   * @param size 滑块大小
   * @param progress 进度百分比 (0-1)
   * @param isHover 是否悬停状态
   */
  drawProgressBarThumb(canvas: HTMLCanvasElement, size: number, progress?: number, isHover?: boolean): void;

  /**
   * 绘制音量按钮
   * @param canvas Canvas 元素
   * @param size 按钮大小
   * @param volume 音量 (0-1)
   * @param isMuted 是否静音
   * @param isHover 是否悬停状态
   */
  drawVolumeButton(canvas: HTMLCanvasElement, size: number, volume: number, isMuted: boolean, isHover?: boolean): void;

  /**
   * 绘制全屏按钮
   * @param canvas Canvas 元素
   * @param size 按钮大小
   * @param isFullscreen 是否全屏
   * @param isHover 是否悬停状态
   */
  drawFullscreenButton(canvas: HTMLCanvasElement, size: number, isFullscreen: boolean, isHover?: boolean): void;

  /**
   * 绘制页面全屏按钮
   * @param canvas Canvas 元素
   * @param size 按钮大小
   * @param isPageFullscreen 是否页面全屏
   * @param isHover 是否悬停状态
   */
  drawPageFullscreenButton(canvas: HTMLCanvasElement, size: number, isPageFullscreen: boolean, isHover?: boolean): void;

  /**
   * 绘制速度按钮
   * @param canvas Canvas 元素
   * @param size 按钮大小
   * @param speed 播放速度
   * @param isHover 是否悬停状态
   */
  drawSpeedButton(canvas: HTMLCanvasElement, size: number, speed: number, isHover?: boolean): void;

  /**
   * 绘制画中画按钮
   * @param canvas Canvas 元素
   * @param size 按钮大小
   * @param isHover 是否悬停状态
   */
  drawPipButton(canvas: HTMLCanvasElement, size: number, isHover?: boolean): void;

  /**
   * 绘制循环按钮
   * @param canvas Canvas 元素
   * @param size 按钮大小
   * @param isHover 是否悬停状态
   */
  drawLoopButton(canvas: HTMLCanvasElement, size: number, isHover?: boolean): void;

  /**
   * 获取主题颜色
   */
  getColors(): {
    primary: string;
    secondary: string;
    controlBg: string;
    controlBgHover: string;
  };
}



