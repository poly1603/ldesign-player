# @ldesign/player-lit

基于 Lit 的 Web Components 音视频播放器组件，可在任何框架或原生 HTML 中使用。

## 安装

```bash
npm install @ldesign/player-lit @ldesign/player-core
# 或
pnpm add @ldesign/player-lit @ldesign/player-core
# 或
yarn add @ldesign/player-lit @ldesign/player-core
```

## 快速开始

### 在 HTML 中使用

```html
<!DOCTYPE html>
<html>
<head>
    <script type="module">
        // 自动注册所有组件
        import '@ldesign/player-lit/define'
    </script>
</head>
<body>
    <!-- 音频播放器 -->
    <ld-audio-player 
        src="audio.mp3"
        show-waveform
        show-lyrics
    ></ld-audio-player>
    
    <!-- 视频播放器 -->
    <ld-video-player
        src="video.mp4"
        poster="poster.jpg"
        controls
    ></ld-video-player>
</body>
</html>
```

### 在 JavaScript 中使用

```javascript
import { LdAudioPlayer, LdVideoPlayer } from '@ldesign/player-lit'

// 如果组件未自动注册，可手动注册
if (!customElements.get('ld-audio-player')) {
    customElements.define('ld-audio-player', LdAudioPlayer)
}

// 创建元素
const audioPlayer = document.createElement('ld-audio-player')
audioPlayer.src = 'audio.mp3'
audioPlayer.showWaveform = true
document.body.appendChild(audioPlayer)

// 监听事件
audioPlayer.addEventListener('play', () => {
    console.log('播放开始')
})
```

### 在 Vue 中使用

```vue
<template>
  <div>
    <ld-audio-player 
      :src="audioSrc"
      show-waveform
      @play="onPlay"
    ></ld-audio-player>
  </div>
</template>

<script setup>
import '@ldesign/player-lit/define'

const audioSrc = 'audio.mp3'

function onPlay() {
  console.log('播放开始')
}
</script>
```

### 在 React 中使用

```jsx
import { useEffect, useRef } from 'react'
import '@ldesign/player-lit/define'

function App() {
  const playerRef = useRef(null)
  
  useEffect(() => {
    const player = playerRef.current
    
    const handlePlay = () => {
      console.log('播放开始')
    }
    
    player?.addEventListener('play', handlePlay)
    
    return () => {
      player?.removeEventListener('play', handlePlay)
    }
  }, [])
  
  return (
    <ld-audio-player 
      ref={playerRef}
      src="audio.mp3"
      show-waveform
    />
  )
}
```

## 组件

### `<ld-audio-player>` 音频播放器

功能丰富的音频播放器 Web Component。

#### 属性

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| src | string | - | 音频文件地址 |
| autoplay | boolean | false | 自动播放 |
| loop | boolean | false | 循环播放 |
| volume | number | 0.8 | 音量（0-1）|
| show-waveform | boolean | true | 显示波形 |
| show-volume | boolean | true | 显示音量控制 |
| show-lyrics | boolean | false | 显示歌词 |
| lyrics | string | - | LRC格式歌词内容 |

#### 事件

| 事件名 | 说明 | 详情 |
|--------|------|-------|
| play | 开始播放 | - |
| pause | 暂停播放 | - |
| ended | 播放结束 | - |
| timeupdate | 播放进度更新 | event.detail: 当前时间（秒）|
| volumechange | 音量变化 | event.detail: 音量值（0-1）|
| next | 下一首 | - |
| prev | 上一首 | - |

#### 方法

```javascript
const player = document.querySelector('ld-audio-player')

// 播放控制
player.play()
player.pause()
player.togglePlay()

// 进度控制
player.seek(30) // 跳转到30秒

// 音量控制
player.setVolume(0.5) // 设置音量为50%
```

#### 示例

```html
<ld-audio-player
    id="my-player"
    src="music.mp3"
    show-waveform
    show-lyrics
    lyrics="[00:00.00]第一行歌词
[00:05.00]第二行歌词
[00:10.00]第三行歌词"
></ld-audio-player>

<script>
const player = document.getElementById('my-player')

// 监听事件
player.addEventListener('play', () => {
    console.log('播放开始')
})

player.addEventListener('timeupdate', (e) => {
    console.log('当前时间:', e.detail)
})

player.addEventListener('ended', () => {
    console.log('播放结束')
})

// 控制播放
setTimeout(() => {
    player.play()
}, 1000)
</script>
```

### `<ld-video-player>` 视频播放器

支持字幕、全屏、画中画的视频播放器 Web Component。

#### 属性

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| src | string | - | 视频文件地址 |
| poster | string | - | 视频封面图片 |
| width | string | - | 播放器宽度 |
| height | string | - | 播放器高度 |
| autoplay | boolean | false | 自动播放 |
| loop | boolean | false | 循环播放 |
| muted | boolean | false | 静音 |
| controls | boolean | true | 显示控制栏 |
| volume | number | 1 | 音量（0-1）|
| subtitles | string | - | 字幕文件地址 |

#### 事件

| 事件名 | 说明 | 详情 |
|--------|------|-------|
| play | 开始播放 | - |
| pause | 暂停播放 | - |
| ended | 播放结束 | - |
| timeupdate | 播放进度更新 | event.detail: 当前时间（秒）|
| volumechange | 音量变化 | event.detail: 音量值（0-1）|
| fullscreenchange | 全屏状态变化 | event.detail: 是否全屏 |

#### 方法

```javascript
const player = document.querySelector('ld-video-player')

// 播放控制
player.play()
player.pause()
player.togglePlay()

// 进度控制
player.seek(60) // 跳转到60秒

// 音量控制
player.setVolume(0.8) // 设置音量为80%
player.toggleMute() // 切换静音

// 全屏和画中画
player.toggleFullscreen() // 切换全屏
player.togglePiP() // 切换画中画
```

#### 示例

```html
<ld-video-player
    id="my-video"
    src="video.mp4"
    poster="poster.jpg"
    controls
    subtitles="subtitles.srt"
    width="1280"
    height="720"
></ld-video-player>

<script>
const video = document.getElementById('my-video')

// 监听事件
video.addEventListener('play', () => {
    console.log('视频开始播放')
})

video.addEventListener('fullscreenchange', (e) => {
    console.log('全屏状态:', e.detail)
})

// 控制播放
document.getElementById('play-btn').onclick = () => {
    video.play()
}

document.getElementById('fullscreen-btn').onclick = () => {
    video.toggleFullscreen()
}
</script>
```

## 高级用法

### 自定义样式

Web Components 支持通过 CSS 变量自定义样式：

```css
ld-audio-player {
    --player-primary-color: #00bcd4;
    --player-background: #ffffff;
    --player-text-color: #333333;
    --player-border-radius: 12px;
}

ld-video-player {
    --controls-background: rgba(0, 0, 0, 0.7);
    --controls-text-color: #ffffff;
    --progress-color: #ff0000;
}
```

### 播放列表管理

```html
<div id="playlist-container">
    <ld-audio-player id="player"></ld-audio-player>
    
    <ul id="playlist">
        <li data-src="song1.mp3">歌曲 1</li>
        <li data-src="song2.mp3">歌曲 2</li>
        <li data-src="song3.mp3">歌曲 3</li>
    </ul>
</div>

<script>
const player = document.getElementById('player')
const playlist = document.getElementById('playlist')
const items = playlist.querySelectorAll('li')
let currentIndex = 0

// 播放列表项点击
items.forEach((item, index) => {
    item.addEventListener('click', () => {
        currentIndex = index
        playTrack(index)
    })
})

// 播放指定曲目
function playTrack(index) {
    const item = items[index]
    player.src = item.dataset.src
    player.play()
    
    // 更新UI
    items.forEach(i => i.classList.remove('active'))
    item.classList.add('active')
}

// 监听播放结束，自动下一首
player.addEventListener('ended', () => {
    currentIndex = (currentIndex + 1) % items.length
    playTrack(currentIndex)
})

// 监听上一首/下一首按钮
player.addEventListener('prev', () => {
    currentIndex = (currentIndex - 1 + items.length) % items.length
    playTrack(currentIndex)
})

player.addEventListener('next', () => {
    currentIndex = (currentIndex + 1) % items.length
    playTrack(currentIndex)
})
</script>
```

### 与状态管理集成

```javascript
// 与 Redux/Vuex/MobX 等状态管理集成
import { store } from './store'

const player = document.querySelector('ld-audio-player')

// 监听播放器事件，更新状态
player.addEventListener('play', () => {
    store.dispatch({ type: 'PLAYER_PLAY' })
})

player.addEventListener('pause', () => {
    store.dispatch({ type: 'PLAYER_PAUSE' })
})

player.addEventListener('timeupdate', (e) => {
    store.dispatch({ 
        type: 'PLAYER_TIME_UPDATE', 
        payload: e.detail 
    })
})

// 监听状态变化，控制播放器
store.subscribe(() => {
    const state = store.getState()
    
    if (state.player.src !== player.src) {
        player.src = state.player.src
    }
    
    if (state.player.isPlaying && !player.isPlaying) {
        player.play()
    } else if (!state.player.isPlaying && player.isPlaying) {
        player.pause()
    }
})
```

## TypeScript 支持

本包提供完整的 TypeScript 类型定义：

```typescript
import { LdAudioPlayer, LdVideoPlayer } from '@ldesign/player-lit'

// 类型安全的属性访问
const player = document.querySelector<LdAudioPlayer>('ld-audio-player')
if (player) {
    player.src = 'audio.mp3'
    player.volume = 0.8
    player.showWaveform = true
}

// 类型安全的事件监听
player?.addEventListener('timeupdate', (e: CustomEvent<number>) => {
    console.log('Current time:', e.detail)
})
```

## 浏览器兼容性

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

需要支持：
- Web Components (Custom Elements v1)
- ES Modules
- Shadow DOM

## License

MIT


