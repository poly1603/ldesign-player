# @ldesign/player-vue

Vue 3 音视频播放器组件，基于 @ldesign/player-core 构建。

## 安装

```bash
npm install @ldesign/player-vue @ldesign/player-core
# 或
pnpm add @ldesign/player-vue @ldesign/player-core
# 或
yarn add @ldesign/player-vue @ldesign/player-core
```

## 快速开始

### 全局注册

```typescript
import { createApp } from 'vue'
import LDesignPlayerVue from '@ldesign/player-vue'
import App from './App.vue'

const app = createApp(App)
app.use(LDesignPlayerVue)
app.mount('#app')
```

### 局部导入

```vue
<template>
  <AudioPlayer
    :src="audioSrc"
    :show-waveform="true"
    :show-lyrics="true"
    @play="onPlay"
    @pause="onPause"
  />
</template>

<script setup>
import { AudioPlayer } from '@ldesign/player-vue'

const audioSrc = 'path/to/audio.mp3'

function onPlay() {
  console.log('开始播放')
}

function onPause() {
  console.log('暂停播放')
}
</script>
```

## 组件

### AudioPlayer 音频播放器

功能丰富的音频播放器组件，支持波形显示、歌词同步、均衡器等功能。

#### 属性

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

#### 事件

| 事件名 | 说明 | 回调参数 |
|--------|------|----------|
| play | 开始播放 | - |
| pause | 暂停播放 | - |
| ended | 播放结束 | - |
| timeupdate | 播放进度更新 | (time: number) |
| volumechange | 音量变化 | (volume: number) |
| next | 下一首 | - |
| prev | 上一首 | - |
| error | 播放错误 | (error: Error) |

#### 插槽

| 插槽名 | 说明 |
|--------|------|
| play-icon | 自定义播放图标 |
| pause-icon | 自定义暂停图标 |
| prev-icon | 自定义上一首图标 |
| next-icon | 自定义下一首图标 |

#### 示例

```vue
<template>
  <div class="player-demo">
    <AudioPlayer
      :src="currentTrack.src"
      :show-waveform="true"
      :show-lyrics="true"
      :lyrics="currentTrack.lyrics"
      :playlist="playlist"
      @play="handlePlay"
      @pause="handlePause"
      @ended="handleEnded"
      @next="playNext"
      @prev="playPrev"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { AudioPlayer } from '@ldesign/player-vue'

const currentTrackIndex = ref(0)
const playlist = ref([
  {
    id: '1',
    src: 'song1.mp3',
    title: 'Song 1',
    artist: 'Artist 1',
    lyrics: '[00:00.00]Lyrics here...'
  },
  // ...
])

const currentTrack = computed(() => playlist.value[currentTrackIndex.value])

function handlePlay() {
  console.log('播放:', currentTrack.value.title)
}

function handlePause() {
  console.log('暂停')
}

function handleEnded() {
  playNext()
}

function playNext() {
  currentTrackIndex.value = (currentTrackIndex.value + 1) % playlist.value.length
}

function playPrev() {
  currentTrackIndex.value = (currentTrackIndex.value - 1 + playlist.value.length) % playlist.value.length
}
</script>
```

### VideoPlayer 视频播放器

支持字幕、全屏、画中画等功能的视频播放器组件。

#### 属性

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

#### 事件

| 事件名 | 说明 | 回调参数 |
|--------|------|----------|
| play | 开始播放 | - |
| pause | 暂停播放 | - |
| ended | 播放结束 | - |
| timeupdate | 播放进度更新 | (time: number) |
| volumechange | 音量变化 | (volume: number) |
| fullscreenchange | 全屏状态变化 | (fullscreen: boolean) |
| error | 播放错误 | (error: Error) |

#### 插槽

| 插槽名 | 说明 |
|--------|------|
| play-icon | 自定义播放图标 |
| pause-icon | 自定义暂停图标 |
| fullscreen-icon | 自定义全屏图标 |
| pip-icon | 自定义画中画图标 |
| loading | 自定义加载指示器 |

#### 示例

```vue
<template>
  <div class="video-demo">
    <VideoPlayer
      :src="videoSrc"
      :poster="posterSrc"
      :subtitles="subtitlesSrc"
      :width="1280"
      :height="720"
      @play="onPlay"
      @pause="onPause"
      @ended="onEnded"
    />
  </div>
</template>

<script setup>
import { VideoPlayer } from '@ldesign/player-vue'

const videoSrc = 'path/to/video.mp4'
const posterSrc = 'path/to/poster.jpg'
const subtitlesSrc = 'path/to/subtitles.srt'

function onPlay() {
  console.log('视频开始播放')
}

function onPause() {
  console.log('视频暂停')
}

function onEnded() {
  console.log('视频播放结束')
}
</script>
```

## Composables

### useAudioPlayer

音频播放器组合式 API。

```typescript
import { useAudioPlayer } from '@ldesign/player-vue'

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
} = useAudioPlayer(options)
```

### useVideoPlayer

视频播放器组合式 API。

```typescript
import { useVideoPlayer } from '@ldesign/player-vue'

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
} = useVideoPlayer(options)
```

## 高级用法

### 自定义控制栏

```vue
<template>
  <div class="custom-player">
    <AudioPlayer
      ref="playerRef"
      :src="audioSrc"
      :show-waveform="false"
    >
      <template #play-icon>
        <MyCustomPlayIcon />
      </template>
      <template #pause-icon>
        <MyCustomPauseIcon />
      </template>
    </AudioPlayer>
    
    <!-- 自定义控制栏 -->
    <div class="custom-controls">
      <button @click="customPlay">播放</button>
      <button @click="customPause">暂停</button>
      <button @click="customSeek(30)">跳转到30秒</button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { AudioPlayer } from '@ldesign/player-vue'

const playerRef = ref()
const audioSrc = 'path/to/audio.mp3'

function customPlay() {
  playerRef.value?.play()
}

function customPause() {
  playerRef.value?.pause()
}

function customSeek(time) {
  playerRef.value?.seek(time)
}
</script>
```

### 播放列表管理

```vue
<template>
  <div class="playlist-player">
    <AudioPlayer
      :src="currentTrack.src"
      @ended="handleTrackEnd"
    />
    
    <div class="playlist">
      <div
        v-for="(track, index) in playlist"
        :key="track.id"
        :class="{ active: currentIndex === index }"
        @click="selectTrack(index)"
      >
        {{ track.title }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { AudioPlayer } from '@ldesign/player-vue'

const playlist = ref([/* ... */])
const currentIndex = ref(0)
const repeatMode = ref('all') // 'all' | 'one' | 'none'

const currentTrack = computed(() => playlist.value[currentIndex.value])

function selectTrack(index) {
  currentIndex.value = index
}

function handleTrackEnd() {
  if (repeatMode.value === 'one') {
    // 单曲循环，重新播放当前曲目
    return
  }
  
  if (repeatMode.value === 'all') {
    // 列表循环
    currentIndex.value = (currentIndex.value + 1) % playlist.value.length
  } else if (currentIndex.value < playlist.value.length - 1) {
    // 顺序播放
    currentIndex.value++
  }
}
</script>
```

## License

MIT



