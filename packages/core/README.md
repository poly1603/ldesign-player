# @ldesign/player-core

音视频播放器核心功能库，提供强大的媒体播放能力。

## 安装

```bash
npm install @ldesign/player-core
# 或
pnpm add @ldesign/player-core
# 或
yarn add @ldesign/player-core
```

## 特性

- 🎵 **音频播放** - 支持多种音频格式播放（MP3, WAV, OGG, M4A, AAC, FLAC, WebM）
- 🎬 **视频播放** - 支持多种视频格式播放（MP4, WebM, OGG, MOV, AVI, MKV, FLV）
- 📡 **流媒体支持** - 支持 HLS 和 DASH 流媒体格式
- 🔌 **框架无关** - 可在任意框架中使用（React, Vue, Angular, 原生 JS 等）
- 🔍 **自动格式检测** - 自动检测媒体格式并选择合适的播放适配器
- 📊 **波形可视化** - 实时音频波形渲染
- 🎤 **歌词同步** - LRC 格式歌词解析与同步
- 🎚️ **均衡器** - 多段音频均衡器调节
- 📝 **字幕支持** - SRT/VTT 格式字幕解析
- 📋 **播放列表** - 播放列表管理
- 🎨 **音频特效** - 内置多种音频效果

## 基础使用

### 通用媒体播放器（推荐）

`UniversalMediaPlayer` 是一个框架无关的统一播放器，支持各种格式的音视频，自动检测格式并选择合适的适配器。

```typescript
import { UniversalMediaPlayer } from '@ldesign/player-core'

// 创建播放器（自动检测格式）
const player = new UniversalMediaPlayer({
  src: 'path/to/media.mp3', // 支持音频或视频
  autoplay: false,
  volume: 0.8
})

// 播放控制
await player.play()
player.pause()
player.seek(30) // 跳转到 30 秒

// 监听事件
player.on('play', () => console.log('Playing'))
player.on('timeupdate', ({ currentTime, duration }) => {
  console.log(`Time: ${currentTime}/${duration}`)
})

// 获取格式信息
const formatInfo = player.getFormatInfo()
console.log(`Format: ${formatInfo?.format}, Type: ${formatInfo?.type}`)
```

### 音频播放器

```typescript
import { AudioPlayer } from '@ldesign/player-core'

// 创建音频播放器
const player = new AudioPlayer({
  src: 'path/to/audio.mp3',
  autoplay: false,
  volume: 0.8
})

// 播放控制
player.play()
player.pause()
player.stop()

// 监听事件
player.on('play', () => console.log('Playing'))
player.on('pause', () => console.log('Paused'))
player.on('ended', () => console.log('Ended'))
player.on('timeupdate', (time) => console.log('Time:', time))
```

### 视频播放器

```typescript
import { VideoPlayer } from '@ldesign/player-core'

// 创建视频播放器
const player = new VideoPlayer({
  container: '#video-container',
  src: 'path/to/video.mp4',
  width: 1280,
  height: 720,
  controls: true
})

// 播放控制
player.play()
player.pause()
player.seek(30) // 跳转到 30 秒

// 字幕
player.loadSubtitle('path/to/subtitle.srt')
```

## 高级功能

### 波形可视化

```typescript
import { WaveformRenderer, AudioPlayer } from '@ldesign/player-core'

const player = new AudioPlayer({ src: 'audio.mp3' })
const waveform = new WaveformRenderer({
  container: '#waveform',
  player,
  height: 200,
  waveColor: '#00bcd4',
  progressColor: '#ff4081'
})

// 开始渲染
waveform.render()
```

### 歌词同步

```typescript
import { LyricsParser, AudioPlayer } from '@ldesign/player-core'

const player = new AudioPlayer({ src: 'song.mp3' })
const lyrics = new LyricsParser()

// 加载歌词
await lyrics.load('path/to/lyrics.lrc')

// 监听播放进度，获取当前歌词
player.on('timeupdate', (time) => {
  const currentLine = lyrics.getCurrentLine(time)
  console.log(currentLine?.text)
})
```

### 均衡器

```typescript
import { Equalizer, AudioPlayer } from '@ldesign/player-core'

const player = new AudioPlayer({ src: 'audio.mp3' })
const equalizer = new Equalizer(player)

// 预设
equalizer.setPreset('rock')
equalizer.setPreset('jazz')
equalizer.setPreset('classical')

// 自定义调节
equalizer.setBand(60, 5)    // 60Hz +5dB
equalizer.setBand(230, -3)  // 230Hz -3dB
equalizer.setBand(910, 2)   // 910Hz +2dB
```

### 播放列表

```typescript
import { PlaylistManager, AudioPlayer } from '@ldesign/player-core'

const player = new AudioPlayer()
const playlist = new PlaylistManager(player)

// 添加歌曲
playlist.add({
  id: '1',
  title: 'Song 1',
  src: 'song1.mp3',
  duration: 180
})

// 播放列表操作
playlist.next()
playlist.previous()
playlist.shuffle()
playlist.setRepeatMode('all') // 'all' | 'one' | 'none'
```

## 格式支持

### 音频格式
- **MP3** (.mp3) - 最广泛支持的音频格式
- **WAV** (.wav) - 无损音频格式
- **OGG** (.ogg, .oga) - 开源音频格式
- **M4A** (.m4a) - Apple 音频格式
- **AAC** (.aac) - 高质量音频格式
- **FLAC** (.flac) - 无损压缩音频
- **WebM Audio** (.webm) - WebM 音频格式

### 视频格式
- **MP4** (.mp4, .m4v) - 最广泛支持的视频格式
- **WebM Video** (.webm) - 开源视频格式
- **OGG Video** (.ogv) - OGG 视频格式
- **MOV** (.mov) - QuickTime 视频格式
- **AVI** (.avi) - 传统视频格式
- **MKV** (.mkv) - Matroska 视频格式
- **FLV** (.flv) - Flash 视频格式

### 流媒体格式
- **HLS** (.m3u8, .m3u) - HTTP Live Streaming（需要浏览器支持或 hls.js）
- **DASH** (.mpd) - Dynamic Adaptive Streaming（需要 dash.js）

### 格式检测

```typescript
import { MediaFormatDetector } from '@ldesign/player-core'

// 检测格式
const formatInfo = MediaFormatDetector.detect('audio.mp3')
console.log(formatInfo)
// {
//   type: 'audio',
//   format: 'mp3',
//   mimeType: 'audio/mpeg',
//   extension: 'mp3',
//   isStreaming: false,
//   isSupported: true
// }

// 检查格式是否支持
const isSupported = MediaFormatDetector.isFormatSupported('mp3')
```

## 框架集成示例

### React

```tsx
import { useEffect, useRef } from 'react'
import { UniversalMediaPlayer } from '@ldesign/player-core'

function MediaPlayer({ src }: { src: string }) {
  const playerRef = useRef<UniversalMediaPlayer | null>(null)

  useEffect(() => {
    const player = new UniversalMediaPlayer({ src })
    playerRef.current = player

    player.on('timeupdate', ({ currentTime, duration }) => {
      console.log(`Progress: ${currentTime}/${duration}`)
    })

    return () => {
      player.destroy()
    }
  }, [src])

  return (
    <div>
      <button onClick={() => playerRef.current?.play()}>播放</button>
      <button onClick={() => playerRef.current?.pause()}>暂停</button>
    </div>
  )
}
```

### Vue

```vue
<template>
  <div>
    <button @click="play">播放</button>
    <button @click="pause">暂停</button>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { UniversalMediaPlayer } from '@ldesign/player-core'

const props = defineProps<{ src: string }>()
const player = ref<UniversalMediaPlayer | null>(null)

onMounted(() => {
  player.value = new UniversalMediaPlayer({ src: props.src })
})

onUnmounted(() => {
  player.value?.destroy()
})

const play = () => player.value?.play()
const pause = () => player.value?.pause()
</script>
```

## API 文档

### UniversalMediaPlayer

| 方法 | 说明 | 参数 |
|------|------|------|
| load(src) | 加载媒体源 | src: string \| File \| Blob |
| play() | 播放 | - |
| pause() | 暂停 | - |
| stop() | 停止 | - |
| seek(time) | 跳转 | time: number |
| setVolume(volume) | 设置音量 | volume: 0-1 |
| setPlaybackRate(rate) | 设置播放速度 | rate: number |
| getFormatInfo() | 获取格式信息 | - |
| getMediaElement() | 获取媒体元素 | - |

### AudioPlayer

| 方法 | 说明 | 参数 |
|------|------|------|
| play() | 播放 | - |
| pause() | 暂停 | - |
| stop() | 停止 | - |
| seek(time) | 跳转 | time: number |
| setVolume(volume) | 设置音量 | volume: 0-1 |
| setPlaybackRate(rate) | 设置播放速度 | rate: number |

### VideoPlayer

| 方法 | 说明 | 参数 |
|------|------|------|
| play() | 播放 | - |
| pause() | 暂停 | - |
| seek(time) | 跳转 | time: number |
| fullscreen() | 全屏 | - |
| pip() | 画中画 | - |
| loadSubtitle(url) | 加载字幕 | url: string |

### 事件

| 事件名 | 说明 | 回调参数 |
|--------|------|----------|
| play | 开始播放 | - |
| pause | 暂停播放 | - |
| ended | 播放结束 | - |
| timeupdate | 播放进度更新 | currentTime: number |
| volumechange | 音量变化 | volume: number |
| error | 播放错误 | error: Error |

## License

MIT



