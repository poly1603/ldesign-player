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

- 🎵 **音频播放** - 支持多种音频格式播放
- 📊 **波形可视化** - 实时音频波形渲染
- 🎤 **歌词同步** - LRC 格式歌词解析与同步
- 🎚️ **均衡器** - 多段音频均衡器调节
- 🎬 **视频播放** - 视频播放与控制
- 📝 **字幕支持** - SRT/VTT 格式字幕解析
- 📋 **播放列表** - 播放列表管理
- 🎨 **音频特效** - 内置多种音频效果

## 基础使用

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

## API 文档

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



