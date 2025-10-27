# @ldesign/player-react

React 音视频播放器组件，基于 @ldesign/player-core 构建。

## 安装

```bash
npm install @ldesign/player-react @ldesign/player-core
# 或
pnpm add @ldesign/player-react @ldesign/player-core
# 或
yarn add @ldesign/player-react @ldesign/player-core
```

## 快速开始

```tsx
import React from 'react'
import { AudioPlayer, VideoPlayer } from '@ldesign/player-react'
import '@ldesign/player-react/styles'

function App() {
  return (
    <div>
      <AudioPlayer 
        src="audio.mp3"
        showWaveform
        showLyrics
        onPlay={() => console.log('Playing')}
      />
      
      <VideoPlayer
        src="video.mp4"
        poster="poster.jpg"
        controls
        onEnded={() => console.log('Video ended')}
      />
    </div>
  )
}
```

## 组件

### AudioPlayer 音频播放器

功能丰富的音频播放器组件，支持波形显示、歌词同步、均衡器等功能。

#### Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| src | string | - | 音频文件地址 |
| autoplay | boolean | false | 自动播放 |
| loop | boolean | false | 循环播放 |
| volume | number | 0.8 | 音量（0-1）|
| showWaveform | boolean | true | 显示波形 |
| showVolume | boolean | true | 显示音量控制 |
| showLyrics | boolean | false | 显示歌词 |
| lyrics | string | - | LRC格式歌词内容 |
| playlist | Array | - | 播放列表 |
| onPlay | () => void | - | 播放事件 |
| onPause | () => void | - | 暂停事件 |
| onEnded | () => void | - | 播放结束事件 |
| onTimeUpdate | (time: number) => void | - | 时间更新事件 |
| onVolumeChange | (volume: number) => void | - | 音量变化事件 |
| onNext | () => void | - | 下一首事件 |
| onPrev | () => void | - | 上一首事件 |
| onError | (error: Error) => void | - | 错误事件 |
| className | string | - | 自定义类名 |
| style | CSSProperties | - | 自定义样式 |

#### 示例

```tsx
import React, { useState } from 'react'
import { AudioPlayer } from '@ldesign/player-react'

const MusicPlayer = () => {
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0)
  
  const playlist = [
    {
      id: '1',
      src: 'song1.mp3',
      title: 'Song 1',
      artist: 'Artist 1',
      lyrics: '[00:00.00]Lyrics here...'
    },
    // 更多歌曲...
  ]
  
  const currentTrack = playlist[currentTrackIndex]
  
  const handleNext = () => {
    setCurrentTrackIndex((prev) => (prev + 1) % playlist.length)
  }
  
  const handlePrev = () => {
    setCurrentTrackIndex((prev) => 
      (prev - 1 + playlist.length) % playlist.length
    )
  }
  
  return (
    <AudioPlayer
      src={currentTrack.src}
      showWaveform
      showLyrics
      lyrics={currentTrack.lyrics}
      playlist={playlist}
      onPlay={() => console.log('播放:', currentTrack.title)}
      onPause={() => console.log('暂停')}
      onEnded={handleNext}
      onNext={handleNext}
      onPrev={handlePrev}
    />
  )
}
```

### VideoPlayer 视频播放器

支持字幕、全屏、画中画等功能的视频播放器组件。

#### Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| src | string | - | 视频文件地址 |
| poster | string | - | 视频封面图片 |
| width | number/string | - | 播放器宽度 |
| height | number/string | - | 播放器高度 |
| autoplay | boolean | false | 自动播放 |
| loop | boolean | false | 循环播放 |
| muted | boolean | false | 静音 |
| controls | boolean | true | 显示控制栏 |
| volume | number | 1 | 音量（0-1）|
| subtitles | string | - | 字幕文件地址 |
| onPlay | () => void | - | 播放事件 |
| onPause | () => void | - | 暂停事件 |
| onEnded | () => void | - | 播放结束事件 |
| onTimeUpdate | (time: number) => void | - | 时间更新事件 |
| onVolumeChange | (volume: number) => void | - | 音量变化事件 |
| onFullscreenChange | (fullscreen: boolean) => void | - | 全屏状态变化 |
| onError | (error: Error) => void | - | 错误事件 |
| className | string | - | 自定义类名 |
| style | CSSProperties | - | 自定义样式 |

#### 示例

```tsx
import React from 'react'
import { VideoPlayer } from '@ldesign/player-react'

const VideoDemo = () => {
  return (
    <VideoPlayer
      src="video.mp4"
      poster="poster.jpg"
      subtitles="subtitles.srt"
      width={1280}
      height={720}
      controls
      onPlay={() => console.log('视频开始播放')}
      onEnded={() => console.log('视频播放结束')}
      onFullscreenChange={(fullscreen) => 
        console.log('全屏状态:', fullscreen)
      }
    />
  )
}
```

## Hooks

### useAudioPlayer

音频播放器 Hook，提供完整的音频控制能力。

```tsx
import { useAudioPlayer } from '@ldesign/player-react'

const MyAudioComponent = () => {
  const {
    player,          // 播放器实例
    isPlaying,       // 是否播放中
    currentTime,     // 当前时间
    duration,        // 总时长
    volume,          // 音量
    currentLyric,    // 当前歌词
    play,            // 播放
    pause,           // 暂停
    seek,            // 跳转
    setVolume,       // 设置音量
    next,            // 下一首
    prev,            // 上一首
    loadAudio        // 加载音频
  } = useAudioPlayer({
    src: 'audio.mp3',
    autoplay: false,
    volume: 0.8
  })
  
  return (
    <div>
      <button onClick={() => isPlaying ? pause() : play()}>
        {isPlaying ? '暂停' : '播放'}
      </button>
      <div>当前时间: {currentTime}s / {duration}s</div>
      <input
        type="range"
        min={0}
        max={duration}
        value={currentTime}
        onChange={(e) => seek(Number(e.target.value))}
      />
    </div>
  )
}
```

### useVideoPlayer

视频播放器 Hook，提供完整的视频控制能力。

```tsx
import { useVideoPlayer } from '@ldesign/player-react'

const MyVideoComponent = () => {
  const {
    player,           // 播放器实例
    isPlaying,        // 是否播放中
    currentTime,      // 当前时间
    duration,         // 总时长
    volume,           // 音量
    muted,            // 是否静音
    loading,          // 是否加载中
    currentSubtitle,  // 当前字幕
    supportsPiP,      // 是否支持画中画
    play,             // 播放
    pause,            // 暂停
    seek,             // 跳转
    setVolume,        // 设置音量
    toggleMute,       // 切换静音
    toggleFullscreen, // 切换全屏
    togglePiP,        // 切换画中画
    loadVideo,        // 加载视频
    loadSubtitles     // 加载字幕
  } = useVideoPlayer({
    container: containerRef.current,
    video: videoRef.current
  })
  
  return (
    <div>
      <video ref={videoRef} />
      <button onClick={() => isPlaying ? pause() : play()}>
        {isPlaying ? '暂停' : '播放'}
      </button>
      <button onClick={toggleFullscreen}>全屏</button>
      {supportsPiP && <button onClick={togglePiP}>画中画</button>}
    </div>
  )
}
```

## 高级用法

### 自定义播放器外观

```tsx
import React from 'react'
import { useAudioPlayer } from '@ldesign/player-react'

const CustomPlayer = () => {
  const { play, pause, isPlaying, currentTime, duration, seek } = useAudioPlayer({
    src: 'audio.mp3'
  })
  
  return (
    <div className="custom-player">
      <button onClick={() => isPlaying ? pause() : play()}>
        {isPlaying ? 'Pause' : 'Play'}
      </button>
      
      <div className="custom-progress" onClick={(e) => {
        const rect = e.currentTarget.getBoundingClientRect()
        const percent = (e.clientX - rect.left) / rect.width
        seek(duration * percent)
      }}>
        <div 
          className="custom-progress-bar"
          style={{ width: `${(currentTime / duration) * 100}%` }}
        />
      </div>
      
      <span>{Math.floor(currentTime)}s / {Math.floor(duration)}s</span>
    </div>
  )
}
```

### 播放列表管理

```tsx
import React, { useState } from 'react'
import { AudioPlayer } from '@ldesign/player-react'

const PlaylistPlayer = () => {
  const [playlist] = useState([/* ... */])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [repeatMode, setRepeatMode] = useState('all') // 'all' | 'one' | 'none'
  const [shuffle, setShuffle] = useState(false)
  
  const currentTrack = playlist[currentIndex]
  
  const handleTrackEnd = () => {
    if (repeatMode === 'one') {
      // 单曲循环，重新播放当前曲目
      return
    }
    
    if (shuffle) {
      // 随机播放
      const nextIndex = Math.floor(Math.random() * playlist.length)
      setCurrentIndex(nextIndex)
    } else if (repeatMode === 'all') {
      // 列表循环
      setCurrentIndex((prev) => (prev + 1) % playlist.length)
    } else if (currentIndex < playlist.length - 1) {
      // 顺序播放
      setCurrentIndex((prev) => prev + 1)
    }
  }
  
  return (
    <div>
      <AudioPlayer
        src={currentTrack.src}
        onEnded={handleTrackEnd}
      />
      
      <div className="playlist-controls">
        <button onClick={() => setShuffle(!shuffle)}>
          随机: {shuffle ? '开' : '关'}
        </button>
        <button onClick={() => {
          const modes = ['all', 'one', 'none']
          const currentModeIndex = modes.indexOf(repeatMode)
          setRepeatMode(modes[(currentModeIndex + 1) % modes.length])
        }}>
          循环: {repeatMode}
        </button>
      </div>
      
      <div className="playlist">
        {playlist.map((track, index) => (
          <div
            key={track.id}
            className={index === currentIndex ? 'active' : ''}
            onClick={() => setCurrentIndex(index)}
          >
            {track.title}
          </div>
        ))}
      </div>
    </div>
  )
}
```

### 音频可视化

```tsx
import React, { useEffect, useRef } from 'react'
import { useAudioPlayer } from '@ldesign/player-react'
import { WaveformRenderer } from '@ldesign/player-core'

const AudioVisualizer = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { player, isPlaying } = useAudioPlayer({
    src: 'audio.mp3'
  })
  
  useEffect(() => {
    if (!canvasRef.current || !player) return
    
    const waveform = new WaveformRenderer({
      container: canvasRef.current,
      player,
      height: 200,
      waveColor: '#00bcd4',
      progressColor: '#ff4081'
    })
    
    if (isPlaying) {
      waveform.render()
    }
    
    return () => waveform.destroy()
  }, [player, isPlaying])
  
  return <canvas ref={canvasRef} width={800} height={200} />
}
```

## TypeScript 支持

本包完全使用 TypeScript 编写，提供完整的类型定义。

```tsx
import type { 
  AudioPlayerProps, 
  VideoPlayerProps,
  AudioPlayerOptions,
  VideoPlayerOptions 
} from '@ldesign/player-react'
```

## License

MIT


