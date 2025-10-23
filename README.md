# @ldesign/player

> 功能强大的音视频播放器，支持任意框架使用

[![NPM version](https://img.shields.io/npm/v/@ldesign/player.svg)](https://www.npmjs.com/package/@ldesign/player)
[![License](https://img.shields.io/npm/l/@ldesign/player.svg)](https://github.com/ldesign/player/blob/main/LICENSE)

## ✨ 特性

### 🎵 音频播放器

**P0 核心功能（18项）**
- ✅ 完整的播放控制（播放/暂停/停止/上一曲/下一曲）
- ✅ 音量控制（音量调节/静音/淡入淡出）
- ✅ 进度显示（可拖拽进度条/时间显示/缓冲进度）
- ✅ 播放列表管理（增删改查/拖拽排序/当前播放高亮）
- ✅ 多种加载方式（本地文件/URL/Blob/File）
- ✅ 循环模式（单曲/列表/随机/不循环）

**P1 高级功能（15项）**
- ✅ 波形可视化（Canvas 渲染/实时波形/频谱显示）
- ✅ 歌词同步（LRC 格式解析/滚动显示/点击跳转）
- ✅ 10频段均衡器（预设音效：摇滚/流行/古典等）
- ✅ 音效处理（播放速度/音调调节/AB 循环/淡入淡出）

### 🎬 视频播放器

- ✅ 完整的播放控制（播放/暂停/停止/跳转）
- ✅ 音量控制（音量调节/静音）
- ✅ 全屏支持（请求全屏/退出全屏）
- ✅ 画中画模式（PiP）
- ✅ 字幕支持（SRT/VTT 格式）
- ✅ 多清晰度切换
- ✅ 视频截图

### 🚀 通用特性

- 🎯 **框架无关**: 支持 Vue 3、React 16.8+、原生 JS
- 📦 **体积小巧**: 核心库 < 50KB（gzipped）
- 💪 **TypeScript**: 完整的类型定义
- 🎨 **可定制**: 支持主题定制和样式覆盖
- 🔌 **插件系统**: 易于扩展
- 📱 **响应式**: 移动端友好

## 📦 安装

```bash
npm install @ldesign/player howler
# or
yarn add @ldesign/player howler
# or
pnpm add @ldesign/player howler
```

## 🔨 使用

### 原生 JavaScript

```javascript
import { createAudioPlayer, createVideoPlayer } from '@ldesign/player';
import '@ldesign/player/style.css';

// 音频播放器
const audioPlayer = createAudioPlayer({
  playlist: [
    { id: '1', title: '歌曲1', src: 'audio1.mp3' },
    { id: '2', title: '歌曲2', src: 'audio2.mp3' },
  ],
  volume: 0.8,
  loopMode: 'list',
});

audioPlayer.play();

// 视频播放器
const videoPlayer = createVideoPlayer('#video-container', {
  src: 'video.mp4',
  poster: 'poster.jpg',
  controls: true,
});

videoPlayer.play();
```

### Vue 3

```vue
<template>
  <div>
    <h2>音频播放器</h2>
    <button @click="toggle">{{ isPlaying ? '暂停' : '播放' }}</button>
    <div>{{ formatTime(currentTime) }} / {{ formatTime(duration) }}</div>
    <input 
      type="range" 
      :value="(currentTime / duration) * 100"
      @input="seek($event.target.value)"
    >
    
    <h2>视频播放器</h2>
    <div ref="videoContainer"></div>
    <button @click="videoToggle">{{ videoIsPlaying ? '暂停' : '播放' }}</button>
    <button @click="toggleFullscreen">全屏</button>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useAudioPlayer, useVideoPlayer } from '@ldesign/player/vue';
import '@ldesign/player/style.css';

// 音频播放器
const {
  isPlaying,
  currentTime,
  duration,
  toggle,
  seek: seekAudio,
} = useAudioPlayer({
  playlist: [
    { id: '1', title: '歌曲1', src: 'audio1.mp3' },
  ],
});

// 视频播放器
const videoContainer = ref(null);
const {
  isPlaying: videoIsPlaying,
  toggle: videoToggle,
  toggleFullscreen,
} = useVideoPlayer(videoContainer, {
  src: 'video.mp4',
});

const formatTime = (sec) => {
  const min = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${min}:${s.toString().padStart(2, '0')}`;
};

const seek = (value) => {
  seekAudio((value / 100) * duration.value);
};
</script>
```

### React

```jsx
import { useRef } from 'react';
import { useAudioPlayer, useVideoPlayer } from '@ldesign/player/react';
import '@ldesign/player/style.css';

function App() {
  // 音频播放器
  const {
    isPlaying,
    currentTime,
    duration,
    toggle,
    seek,
  } = useAudioPlayer({
    playlist: [
      { id: '1', title: '歌曲1', src: 'audio1.mp3' },
    ],
  });

  // 视频播放器
  const videoContainerRef = useRef(null);
  const {
    isPlaying: videoIsPlaying,
    toggle: videoToggle,
    toggleFullscreen,
  } = useVideoPlayer(videoContainerRef, {
    src: 'video.mp4',
  });

  return (
    <div>
      <h2>音频播放器</h2>
      <button onClick={toggle}>
        {isPlaying ? '暂停' : '播放'}
      </button>
      <div>{currentTime.toFixed(2)} / {duration.toFixed(2)}</div>
      
      <h2>视频播放器</h2>
      <div ref={videoContainerRef}></div>
      <button onClick={videoToggle}>
        {videoIsPlaying ? '暂停' : '播放'}
      </button>
      <button onClick={toggleFullscreen}>全屏</button>
    </div>
  );
}
```

## 📚 高级功能

### 波形可视化

```javascript
import { AudioPlayer, WaveformRenderer } from '@ldesign/player';

const player = new AudioPlayer({ enableWebAudio: true });
const canvas = document.getElementById('waveform');
const audioContext = player.getAudioContext();

const waveform = new WaveformRenderer(canvas, audioContext, {
  waveColor: '#1890ff',
  progressColor: '#096dd9',
});

// 绘制实时波形
waveform.drawRealtimeWaveform();

// 连接音频源
const howl = player.getHowl();
if (howl) {
  const source = audioContext.createMediaElementSource(howl._sounds[0]._node);
  waveform.connectSource(source);
}
```

### 歌词同步

```javascript
import { AudioPlayer, LyricsParser } from '@ldesign/player';

const player = new AudioPlayer();
const lyricsParser = new LyricsParser();

// 解析 LRC 歌词
await lyricsParser.loadFromUrl('lyrics.lrc');

// 监听时间更新，获取当前歌词
player.on('timeupdate', ({ currentTime }) => {
  const currentLine = lyricsParser.getCurrentLine(currentTime);
  if (currentLine) {
    console.log(currentLine.text);
  }
});
```

### 均衡器

```javascript
import { AudioPlayer, Equalizer } from '@ldesign/player';

const player = new AudioPlayer({ enableWebAudio: true });
const audioContext = player.getAudioContext();
const equalizer = new Equalizer(audioContext);

// 应用预设
equalizer.applyPreset('rock'); // rock, pop, jazz, classical, etc.

// 自定义频段
equalizer.setBandGain(0, 5); // 32Hz +5dB
equalizer.setBandGain(1, 3); // 64Hz +3dB
```

## 🎨 主题定制

```css
:root {
  --player-primary-color: #1890ff;
  --player-bg-color: #fff;
  --player-text-color: #000000d9;
  --player-border-radius: 4px;
}

/* 暗色主题 */
.ldesign-player.dark {
  --player-bg-color: #141414;
  --player-text-color: #ffffffd9;
}
```

## 📖 API 文档

详细 API 文档请参考 [API.md](./API.md)

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License © LDesign Team






