# LDesign Player Playground

这是一个用于演示和测试 `@ldesign/player` 的 playground 项目。

## 功能演示

- **原生 Core 使用**: 直接使用 `@ldesign/player-core` 的 `AudioPlayer` 和 `VideoPlayer` 类
- **Vue 组件使用**: 使用 `@ldesign/player-vue` 提供的 `<AudioPlayer>` 和 `<VideoPlayer>` 组件
- **Vue Hook 使用**: 使用 `useAudioPlayer` 和 `useVideoPlayer` composables

## 启动

```bash
# 在 playground 目录下
pnpm install
pnpm dev
```

## 项目结构

```
playground/
├── src/
│   ├── App.vue          # 主应用组件
│   ├── main.ts          # 入口文件
│   ├── style.css        # 全局样式
│   └── vite-env.d.ts    # 类型声明
├── index.html           # HTML 入口
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## 使用示例

### 原生 Core

```typescript
import { AudioPlayer, VideoPlayer } from '@ldesign/player-core'

// 音频播放器
const audioPlayer = new AudioPlayer({
  src: 'https://example.com/audio.mp3',
  volume: 0.8,
})

audioPlayer.on('play', () => console.log('Playing'))
audioPlayer.on('timeupdate', ({ currentTime }) => console.log(currentTime))
audioPlayer.play()

// 视频播放器
const videoPlayer = new VideoPlayer('#container', {
  src: 'https://example.com/video.mp4',
  controls: true,
})

videoPlayer.play()
```

### Vue 组件

```vue
<template>
  <AudioPlayer :src="audioSrc" @play="onPlay" />
  <VideoPlayer :src="videoSrc" :controls="true" />
</template>

<script setup>
import { AudioPlayer, VideoPlayer } from '@ldesign/player-vue'

const audioSrc = 'https://example.com/audio.mp3'
const videoSrc = 'https://example.com/video.mp4'

const onPlay = () => console.log('Playing')
</script>
```

### Vue Hook

```vue
<script setup>
import { useAudioPlayer, useVideoPlayer } from '@ldesign/player-vue'

const { isPlaying, currentTime, play, pause } = useAudioPlayer({
  src: 'https://example.com/audio.mp3',
})

const { play: playVideo, toggleFullscreen } = useVideoPlayer({
  src: 'https://example.com/video.mp4',
})
</script>
```
