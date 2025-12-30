/**
 * 设备检测和适配工具
 * 提供设备类型检测、触摸支持检测、屏幕方向检测等功能
 */

export interface DeviceInfo {
  /** 是否为移动设备 */
  isMobile: boolean;
  /** 是否为平板设备 */
  isTablet: boolean;
  /** 是否为桌面设备 */
  isDesktop: boolean;
  /** 是否支持触摸 */
  hasTouch: boolean;
  /** 是否为 iOS 设备 */
  isIOS: boolean;
  /** 是否为 Android 设备 */
  isAndroid: boolean;
  /** 是否为 Safari 浏览器 */
  isSafari: boolean;
  /** 是否为 Chrome 浏览器 */
  isChrome: boolean;
  /** 是否为 Firefox 浏览器 */
  isFirefox: boolean;
  /** 是否为 Edge 浏览器 */
  isEdge: boolean;
  /** 是否为微信浏览器 */
  isWeChat: boolean;
  /** 屏幕方向 */
  orientation: 'portrait' | 'landscape';
  /** 像素密度比 */
  pixelRatio: number;
  /** 视口宽度 */
  viewportWidth: number;
  /** 视口高度 */
  viewportHeight: number;
}

export interface FeatureSupport {
  /** 是否支持 Fullscreen API */
  fullscreen: boolean;
  /** 是否支持 Picture-in-Picture */
  pictureInPicture: boolean;
  /** 是否支持 Web Audio API */
  webAudio: boolean;
  /** 是否支持 MediaSource Extensions */
  mse: boolean;
  /** 是否支持 Encrypted Media Extensions */
  eme: boolean;
  /** 是否支持 Media Session API */
  mediaSession: boolean;
  /** 是否支持 Intersection Observer */
  intersectionObserver: boolean;
  /** 是否支持 ResizeObserver */
  resizeObserver: boolean;
  /** 是否支持 CSS backdrop-filter */
  backdropFilter: boolean;
  /** 是否支持触觉反馈 */
  hapticFeedback: boolean;
}

/**
 * 获取设备信息
 */
export function getDeviceInfo(): DeviceInfo {
  const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
  const platform = typeof navigator !== 'undefined' ? navigator.platform : '';

  // 设备类型检测
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
  const isTablet = /iPad|Android(?!.*Mobile)/i.test(ua) || 
    (typeof navigator !== 'undefined' && navigator.maxTouchPoints > 1 && /Macintosh/i.test(ua));
  const isDesktop = !isMobile && !isTablet;

  // 操作系统检测
  const isIOS = /iPad|iPhone|iPod/.test(ua) || 
    (/Macintosh/i.test(ua) && typeof navigator !== 'undefined' && navigator.maxTouchPoints > 1);
  const isAndroid = /Android/i.test(ua);

  // 浏览器检测
  const isSafari = /^((?!chrome|android).)*safari/i.test(ua);
  const isChrome = /Chrome/i.test(ua) && !/Edge|Edg/i.test(ua);
  const isFirefox = /Firefox/i.test(ua);
  const isEdge = /Edge|Edg/i.test(ua);
  const isWeChat = /MicroMessenger/i.test(ua);

  // 触摸支持检测
  const hasTouch = typeof window !== 'undefined' && (
    'ontouchstart' in window ||
    (navigator && navigator.maxTouchPoints > 0) ||
    (typeof matchMedia !== 'undefined' && matchMedia('(pointer: coarse)').matches)
  );

  // 屏幕方向
  const orientation = typeof window !== 'undefined' && window.innerWidth > window.innerHeight
    ? 'landscape' : 'portrait';

  // 像素密度
  const pixelRatio = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;

  // 视口尺寸
  const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 0;
  const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 0;

  return {
    isMobile,
    isTablet,
    isDesktop,
    hasTouch,
    isIOS,
    isAndroid,
    isSafari,
    isChrome,
    isFirefox,
    isEdge,
    isWeChat,
    orientation,
    pixelRatio,
    viewportWidth,
    viewportHeight,
  };
}

/**
 * 获取功能支持情况
 */
export function getFeatureSupport(): FeatureSupport {
  const isClient = typeof window !== 'undefined' && typeof document !== 'undefined';

  return {
    fullscreen: isClient && !!(
      document.fullscreenEnabled ||
      (document as any).webkitFullscreenEnabled ||
      (document as any).mozFullScreenEnabled ||
      (document as any).msFullscreenEnabled
    ),
    pictureInPicture: isClient && !!(
      'pictureInPictureEnabled' in document &&
      (document as any).pictureInPictureEnabled
    ),
    webAudio: isClient && !!(
      window.AudioContext ||
      (window as any).webkitAudioContext
    ),
    mse: isClient && !!(
      'MediaSource' in window &&
      typeof MediaSource !== 'undefined' &&
      typeof MediaSource.isTypeSupported === 'function'
    ),
    eme: isClient && !!(
      'requestMediaKeySystemAccess' in navigator
    ),
    mediaSession: isClient && 'mediaSession' in navigator,
    intersectionObserver: isClient && 'IntersectionObserver' in window,
    resizeObserver: isClient && 'ResizeObserver' in window,
    backdropFilter: isClient && (
      CSS.supports('backdrop-filter', 'blur(10px)') ||
      CSS.supports('-webkit-backdrop-filter', 'blur(10px)')
    ),
    hapticFeedback: isClient && 'vibrate' in navigator,
  };
}

/**
 * 检测是否为触摸设备
 */
export function isTouchDevice(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
    (typeof matchMedia !== 'undefined' && matchMedia('(pointer: coarse)').matches)
  );
}

/**
 * 检测是否为低端设备
 */
export function isLowEndDevice(): boolean {
  if (typeof navigator === 'undefined') return false;

  // 检查硬件并发数
  const hardwareConcurrency = navigator.hardwareConcurrency || 0;
  if (hardwareConcurrency > 0 && hardwareConcurrency <= 2) {
    return true;
  }

  // 检查设备内存（Chrome 特性）
  const deviceMemory = (navigator as any).deviceMemory;
  if (deviceMemory !== undefined && deviceMemory <= 2) {
    return true;
  }

  // 检查连接类型
  const connection = (navigator as any).connection;
  if (connection && connection.effectiveType) {
    if (['slow-2g', '2g'].includes(connection.effectiveType)) {
      return true;
    }
  }

  return false;
}

/**
 * 监听屏幕方向变化
 */
export function onOrientationChange(
  callback: (orientation: 'portrait' | 'landscape') => void
): () => void {
  if (typeof window === 'undefined') {
    return () => {};
  }

  const handleChange = () => {
    const orientation = window.innerWidth > window.innerHeight ? 'landscape' : 'portrait';
    callback(orientation);
  };

  // 优先使用 screen.orientation API
  if (screen.orientation) {
    screen.orientation.addEventListener('change', handleChange);
    return () => screen.orientation.removeEventListener('change', handleChange);
  }

  // 回退到 resize 事件
  window.addEventListener('resize', handleChange);
  return () => window.removeEventListener('resize', handleChange);
}

/**
 * 监听视口大小变化
 */
export function onViewportChange(
  callback: (width: number, height: number) => void,
  options?: { debounce?: number }
): () => void {
  if (typeof window === 'undefined') {
    return () => {};
  }

  let timeoutId: number | null = null;
  const debounceMs = options?.debounce ?? 100;

  const handleResize = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = window.setTimeout(() => {
      callback(window.innerWidth, window.innerHeight);
    }, debounceMs);
  };

  window.addEventListener('resize', handleResize);
  return () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    window.removeEventListener('resize', handleResize);
  };
}

/**
 * 获取推荐的播放器配置
 */
export function getRecommendedConfig(): {
  enableGestures: boolean;
  enableKeyboard: boolean;
  enableHover: boolean;
  controlsSize: 'small' | 'medium' | 'large';
  touchTargetSize: number;
  progressBarHeight: number;
} {
  const device = getDeviceInfo();
  const isLowEnd = isLowEndDevice();

  return {
    enableGestures: device.hasTouch,
    enableKeyboard: device.isDesktop,
    enableHover: !device.hasTouch,
    controlsSize: device.isMobile ? 'large' : device.isTablet ? 'medium' : 'small',
    touchTargetSize: device.hasTouch ? 44 : 32, // 满足可访问性要求
    progressBarHeight: device.hasTouch ? 8 : 4,
  };
}

/**
 * 根据设备类型应用 CSS 类
 */
export function applyDeviceClasses(element: HTMLElement): void {
  const device = getDeviceInfo();

  element.classList.toggle('device-mobile', device.isMobile);
  element.classList.toggle('device-tablet', device.isTablet);
  element.classList.toggle('device-desktop', device.isDesktop);
  element.classList.toggle('device-touch', device.hasTouch);
  element.classList.toggle('device-ios', device.isIOS);
  element.classList.toggle('device-android', device.isAndroid);
  element.classList.toggle('orientation-portrait', device.orientation === 'portrait');
  element.classList.toggle('orientation-landscape', device.orientation === 'landscape');
}

/**
 * 检测是否支持特定视频格式
 */
export function canPlayType(mimeType: string): boolean {
  if (typeof document === 'undefined') return false;
  
  const video = document.createElement('video');
  const canPlay = video.canPlayType(mimeType);
  return canPlay === 'probably' || canPlay === 'maybe';
}

/**
 * 获取支持的视频格式
 */
export function getSupportedVideoFormats(): string[] {
  const formats = [
    'video/mp4',
    'video/webm',
    'video/ogg',
    'video/mp4; codecs="avc1.42E01E"',
    'video/mp4; codecs="avc1.42E01E, mp4a.40.2"',
    'video/webm; codecs="vp8"',
    'video/webm; codecs="vp8, vorbis"',
    'video/webm; codecs="vp9"',
    'video/ogg; codecs="theora"',
  ];

  return formats.filter(canPlayType);
}

/**
 * 获取支持的音频格式
 */
export function getSupportedAudioFormats(): string[] {
  if (typeof document === 'undefined') return [];
  
  const audio = document.createElement('audio');
  const formats = [
    'audio/mp3',
    'audio/mpeg',
    'audio/wav',
    'audio/ogg',
    'audio/aac',
    'audio/flac',
    'audio/webm',
  ];

  return formats.filter(format => {
    const canPlay = audio.canPlayType(format);
    return canPlay === 'probably' || canPlay === 'maybe';
  });
}
