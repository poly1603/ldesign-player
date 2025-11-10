# @ldesign/player API 文档

## 目录

- [AudioPlayer](#audioplayer)
- [VideoPlayer](#videoplayer)
- [PlaylistManager](#playlistmanager)
- [事件系统](#事件系统)
- [错误处理](#错误处理)
- [性能监控](#性能监控)
- [工具函数](#工具函数)

## AudioPlayer

音频播放器核心类。

### 构造函数

```typescript
new AudioPlayer(config?: AudioPlayerConfig)
```

#### AudioPlayerConfig

```typescript
interface AudioPlayerConfig {
  src?: string | File | Blob;         // 音频源
  playlist?: Track[];                 // 播放列表
  autoplay?: boolean;                 // 自动播放，默认 false
  volume?: number;                    // 音量 (0-1)，默认 1
  muted?: boolean;                    // 静音，默认 false
  loop?: boolean;                     // 循环播放，默认 false
  preload?: 'none' | 'metadata' | 'auto'; // 预加载策略
  playbackRate?: number;              // 播放速率，默认 1
  loopMode?: 'none' | 'single' | 'list' | 'random'; // 循环模式
  enableWebAudio?: boolean;           // 启用 Web Audio API，默认 true
  visualizer?: VisualizerConfig;     // 可视化配置
  equalizer?: EqualizerConfig;       // 均衡器配置
}
```

### 方法

#### 播放控制

```typescript
// 加载音频
load(src: string | File | Blob): Promise<void>

// 播放
play(): Promise<void>

// 暂停
pause(): void

// 停止
stop(): void

// 跳转到指定时间（秒）
seek(time: number): void

// 下一首
next(): void

// 上一首
prev(): void
```

#### 音量控制

```typescript
// 设置音量 (0-1)
setVolume(volume: number): void

// 静音
mute(): void

// 取消静音
unmute(): void

// 音量淡入淡出
fade(from: number, to: number, duration: number): void
```

#### 播放设置

```typescript
// 设置播放速率 (0.5-2)
setPlaybackRate(rate: number): void

// 获取播放速率
getPlaybackRate(): number

// 设置循环模式
setLoopMode(mode: 'none' | 'single' | 'list' | 'random'): void

// 获取循环模式
getLoopMode(): LoopMode
```

#### 状态获取

```typescript
// 获取播放器状态
getState(): PlayerState

// 获取当前播放时间（秒）
getCurrentTime(): number

// 获取总时长（秒）
getDuration(): number

// 获取音量
getVolume(): number

// 是否静音
isMuted(): boolean

// 是否正在播放
isPlaying(): boolean

// 获取播放列表管理器
getPlaylistManager(): PlaylistManager

// 获取状态管理器
getStateManager(): StateManager

// 获取 Audio Context
getAudioContext(): AudioContext | null

// 获取 Howl 实例
getHowl(): Howl | null
```

#### 生命周期

```typescript
// 销毁播放器
destroy(): void
```

### 事件

```typescript
// 播放事件
player.on('play', () => {})
player.on('pause', () => {})
player.on('stop', () => {})
player.on('ended', () => {})

// 进度事件
player.on('timeupdate', ({ currentTime, duration }) => {})
player.on('progress', ({ buffered }) => {})
player.on('seeking', () => {})
player.on('seeked', () => {})

// 音量事件
player.on('volumechange', ({ volume, muted }) => {})

// 加载事件
player.on('loadstart', () => {})
player.on('loadedmetadata', () => {})
player.on('canplay', () => {})

// 播放列表事件
player.on('trackchange', ({ index, track }) => {})
player.on('playlistchange', ({ playlist }) => {})

// 错误事件
player.on('error', ({ message, code }) => {})
```

## VideoPlayer

视频播放器核心类。

### 构造函数

```typescript
new VideoPlayer(container: HTMLElement | string, config?: VideoPlayerConfig)
```

#### VideoPlayerConfig

```typescript
interface VideoPlayerConfig {
  src?: string | VideoSource;         // 视频源
  poster?: string;                    // 封面图
  autoplay?: boolean;                 // 自动播放
  loop?: boolean;                     // 循环播放
  muted?: boolean;                    // 静音
  preload?: 'none' | 'metadata' | 'auto'; // 预加载
  volume?: number;                    // 音量
  playbackRate?: number;              // 播放速率
  aspectRatio?: string;               // 宽高比，如 '16:9'
  controls?: boolean;                 // 显示控制栏
  fullscreen?: boolean;               // 启用全屏
  pictureInPicture?: boolean;         // 启用画中画
  quality?: QualityConfig;            // 清晰度配置
  subtitle?: SubtitleConfig;          // 字幕配置
}
```

### 方法

#### 播放控制

```typescript
// 加载视频
load(src: string | VideoSource): void

// 播放
play(): Promise<void>

// 暂停
pause(): void

// 停止
stop(): void

// 跳转
seek(time: number): void
```

#### 全屏控制

```typescript
// 请求全屏
requestFullscreen(): Promise<void>

// 退出全屏
exitFullscreen(): Promise<void>

// 切换全屏
toggleFullscreen(): Promise<void>

// 是否全屏
isFullscreen(): boolean
```

#### 画中画

```typescript
// 请求画中画
requestPictureInPicture(): Promise<PictureInPictureWindow>

// 退出画中画
exitPictureInPicture(): Promise<void>

// 切换画中画
togglePictureInPicture(): Promise<void>

// 是否在画中画模式
isPictureInPicture(): boolean
```

#### 字幕

```typescript
// 加载字幕
loadSubtitle(url: string): Promise<void>

// 获取字幕解析器
getSubtitleParser(): SubtitleParser

// 获取当前字幕
getCurrentSubtitle(): string | null
```

#### 其他功能

```typescript
// 切换清晰度
switchQuality(quality: VideoSource): void

// 获取当前清晰度
getCurrentQuality(): string | null

// 截图
screenshot(): string

// 获取视频元素
getVideoElement(): HTMLVideoElement
```

## PlaylistManager

播放列表管理器。

### 方法

```typescript
// 添加轨道
add(track: Track): void
addMany(tracks: Track[]): void

// 移除轨道
remove(index: number): void
removeById(id: string): void

// 清空播放列表
clear(): void

// 移动轨道位置
move(fromIndex: number, toIndex: number): void

// 获取播放列表
getPlaylist(): Track[]

// 获取轨道
getTrack(index: number): Track | null
getTrackById(id: string): Track | null

// 播放指定轨道
play(index: number): void
playById(id: string): void

// 下一首/上一首
next(): Track | null
previous(): Track | null

// 随机播放
shuffle(): void

// 设置循环模式
setLoopMode(mode: LoopMode): void

// 获取当前索引
getCurrentIndex(): number

// 设置当前索引
setCurrentIndex(index: number): void

// 获取播放列表长度
length(): number
```

## 事件系统

### EventEmitter

```typescript
// 订阅事件
on<K extends keyof PlayerEventMap>(
  event: K,
  listener: EventListener<K>
): () => void

// 订阅一次性事件
once<K extends keyof PlayerEventMap>(
  event: K,
  listener: EventListener<K>
): () => void

// 取消订阅
off<K extends keyof PlayerEventMap>(
  event: K,
  listener: EventListener<K>
): void

// 触发事件
emit<K extends keyof PlayerEventMap>(
  event: K,
  data: PlayerEventMap[K]
): void

// 清除所有监听器
clear(): void

// 获取事件监听器数量
listenerCount(event: K): number
```

## 错误处理

### PlayerError

```typescript
class PlayerError extends Error {
  type: PlayerErrorType;
  code?: number;
  details?: any;
  recoverable: boolean;
}

enum PlayerErrorType {
  LOAD_ERROR = 'LOAD_ERROR',
  PLAY_ERROR = 'PLAY_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  DECODE_ERROR = 'DECODE_ERROR',
  FORMAT_ERROR = 'FORMAT_ERROR',
  PERMISSION_ERROR = 'PERMISSION_ERROR',
  NOT_SUPPORTED = 'NOT_SUPPORTED',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}
```

### ErrorHandler

```typescript
// 处理媒体错误
ErrorHandler.handleMediaError(error: MediaError): PlayerError

// 处理播放错误
ErrorHandler.handlePlayError(error: Error): PlayerError

// 获取友好的错误消息
ErrorHandler.getFriendlyMessage(error: PlayerError): string

// 尝试恢复错误
ErrorHandler.tryRecover(
  error: PlayerError,
  retryCallback: () => Promise<void>,
  maxRetries?: number
): Promise<void>

// 验证媒体源
ErrorHandler.validateMediaSource(src: string | File | Blob): void

// 检查浏览器支持
ErrorHandler.checkBrowserSupport(feature: string): void
```

## 性能监控

### PerformanceMonitor

```typescript
// 开始监控
performanceMonitor.start(): void

// 停止监控
performanceMonitor.stop(): void

// 获取性能指标
performanceMonitor.getMetrics(): PerformanceMetrics

// 订阅指标更新
performanceMonitor.subscribe(
  listener: (metrics: PerformanceMetrics) => void
): () => void

// 更新视频指标
performanceMonitor.updateVideoMetrics(videoElement: HTMLVideoElement): void

// 更新音频指标
performanceMonitor.updateAudioMetrics(audioContext?: AudioContext): void

// 检测内存泄漏
performanceMonitor.checkMemoryLeak(threshold?: number): boolean

// 性能标记
performanceMonitor.mark(name: string): void

// 性能测量
performanceMonitor.measure(name: string, startMark: string, endMark?: string): number

// 获取性能报告
performanceMonitor.getReport(): string
```

#### PerformanceMetrics

```typescript
interface PerformanceMetrics {
  fps: number;                // 帧率
  memoryUsage?: number;       // 内存使用（MB）
  bufferHealth: number;       // 缓冲健康度（0-1）
  droppedFrames?: number;     // 丢帧数
  latency?: number;           // 延迟（毫秒）
  decodeTime?: number;        // 解码时间（毫秒）
}
```

## 工具函数

```typescript
// 生成唯一ID
generateId(prefix?: string): string

// 限制数值范围
clamp(value: number, min: number, max: number): number

// 深度合并对象
deepMerge<T>(target: T, source: Partial<T>): T

// 格式化时间
formatTime(seconds: number): string

// 解析时间字符串
parseTime(timeString: string): number

// 节流函数
throttle<T>(func: T, wait: number): (...args: Parameters<T>) => void

// 防抖函数
debounce<T>(func: T, wait: number): (...args: Parameters<T>) => void

// 检查全屏支持
isFullscreenSupported(): boolean

// 请求全屏
requestFullscreen(element: HTMLElement): Promise<void>

// 退出全屏
exitFullscreen(): Promise<void>

// 获取全屏元素
getFullscreenElement(): Element | null

// 检查画中画支持
isPictureInPictureSupported(): boolean

// 获取缓冲百分比
getBufferedPercent(buffered: TimeRanges, currentTime: number): number
```

## 框架集成

### Vue 3

```typescript
import { useAudioPlayer, useVideoPlayer } from '@ldesign/player/vue';

// 音频播放器
const {
  player,
  isPlaying,
  currentTime,
  duration,
  play,
  pause,
  seek,
  // ...
} = useAudioPlayer(options);

// 视频播放器
const {
  player,
  isPlaying,
  toggleFullscreen,
  // ...
} = useVideoPlayer(containerRef, options);
```

### React

```typescript
import { useAudioPlayer, useVideoPlayer } from '@ldesign/player/react';

// 音频播放器
const {
  player,
  isPlaying,
  currentTime,
  duration,
  play,
  pause,
  seek,
  // ...
} = useAudioPlayer(options);

// 视频播放器
const {
  player,
  isPlaying,
  toggleFullscreen,
  // ...
} = useVideoPlayer(containerRef, options);
```

## 高级特性

### 波形可视化

```typescript
const waveform = new WaveformRenderer(canvas, audioContext, {
  waveColor: '#1890ff',
  progressColor: '#096dd9',
  height: 128,
  barWidth: 3,
  barGap: 1,
});

// 绘制波形
waveform.drawWaveform(audioBuffer);

// 实时频谱
waveform.drawRealtimeWaveform();
```

### 歌词同步

```typescript
const lyricsParser = new LyricsParser();

// 加载歌词
await lyricsParser.loadFromUrl('lyrics.lrc');

// 获取当前歌词
const currentLine = lyricsParser.getCurrentLine(currentTime);
```

### 均衡器

```typescript
const equalizer = new Equalizer(audioContext);

// 应用预设
equalizer.applyPreset('rock');

// 自定义频段
equalizer.setBandGain(0, 5); // 32Hz +5dB
```

### 音效处理

```typescript
const effects = new AudioEffects(audioContext);

// 设置播放速度
effects.setPlaybackRate(1.5);

// AB循环
effects.setABLoop(10, 30); // 10-30秒循环
```

## 最佳实践

### 错误处理

```typescript
try {
  await player.load('audio.mp3');
  await player.play();
} catch (error) {
  if (error instanceof PlayerError) {
    console.error('播放器错误:', ErrorHandler.getFriendlyMessage(error));
    
    if (error.recoverable) {
      // 尝试恢复
      await ErrorHandler.tryRecover(error, () => player.play());
    }
  }
}
```

### 性能优化

```typescript
// 启动性能监控
performanceMonitor.start();

// 订阅性能指标
const unsubscribe = performanceMonitor.subscribe(metrics => {
  if (metrics.fps < 30) {
    console.warn('低帧率:', metrics.fps);
  }
  
  if (metrics.bufferHealth < 0.3) {
    console.warn('缓冲不足');
  }
});

// 清理
player.on('destroy', () => {
  unsubscribe();
  performanceMonitor.stop();
});
```

### 内存管理

```typescript
// 使用完毕后销毁播放器
player.destroy();

// 检查内存泄漏
if (performanceMonitor.checkMemoryLeak(200)) {
  console.warn('可能存在内存泄漏');
}
```

## 浏览器兼容性

| 功能 | Chrome | Firefox | Safari | Edge |
| --- | --- | --- | --- | --- |
| 音频播放 | ✅ 45+ | ✅ 40+ | ✅ 10+ | ✅ 79+ |
| 视频播放 | ✅ 45+ | ✅ 40+ | ✅ 10+ | ✅ 79+ |
| Web Audio API | ✅ 35+ | ✅ 25+ | ✅ 14.1+ | ✅ 79+ |
| 全屏 API | ✅ 71+ | ✅ 64+ | ✅ 16.4+ | ✅ 79+ |
| 画中画 | ✅ 70+ | ✅ 113+ | ✅ 13.1+ | ✅ 79+ |
| Media Session | ✅ 73+ | ✅ 82+ | ✅ 15+ | ✅ 79+ |

## License

MIT