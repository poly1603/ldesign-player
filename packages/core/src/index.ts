// Core Player Classes
export * from './core/AudioPlayer'
export * from './core/VideoPlayer'
export * from './core/UniversalMediaPlayer'
export * from './core/PlayerManager'
export * from './core/StateManager'
export * from './core/EventEmitter'
export * from './core/MediaFormatDetector'

// Adapters
export * from './core/adapters/IMediaAdapter'
export * from './core/adapters/HTML5Adapter'
export * from './core/adapters/AdapterFactory'

// Audio Features
export * from './audio/AudioEffects'
export * from './audio/Equalizer'
export * from './audio/LyricsParser'
export * from './audio/PlaylistManager'
export * from './audio/WaveformRenderer'
export * from './audio/CustomAudioPlayer'

// Video Features
export * from './video/SubtitleParser'
export * from './video/CustomVideoPlayer'

// Types
export * from './types'

// Utils
export * from './utils/helpers';
export {
  rafThrottle,
  LazyLoader,
  ObjectPool,
  MemoryAwareCache,
  createLazyObserver,
  measureTime,
  measureTimeAsync,
  globalLazyLoader
} from './utils/performance';

// Audio Visualizer
export * from './audio/AudioVisualizer';

// 导出新功能
export * from './features/KeyboardControl';
export * from './features/PlayHistory';
export * from './features/ABLoop';
export * from './features/OfflineCache';
export * from './features/PlaybackResume';
export * from './features/PlaybackRateMemory';
export * from './features/QualitySwitcher';
export * from './features/GestureControl';
export * from './features/MiniPlayer';
export * from './features/VideoRotate';
export * from './features/Screenshot';
export * from './features/Danmaku';
export * from './features/VideoDownload';
