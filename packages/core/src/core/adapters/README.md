# 媒体适配器系统

## 概述

媒体适配器系统提供了一个框架无关的播放器核心，支持各种格式的音视频播放。通过适配器模式，可以轻松扩展支持新的媒体格式和播放方式。

## 核心组件

### 1. MediaFormatDetector（格式检测器）

自动检测媒体格式，支持：
- 音频格式：MP3, WAV, OGG, M4A, AAC, FLAC, WebM Audio
- 视频格式：MP4, WebM Video, OGG Video, MOV, AVI, MKV, FLV
- 流媒体格式：HLS (.m3u8), DASH (.mpd)

```typescript
import { MediaFormatDetector } from '@ldesign/player-core';

// 检测格式
const formatInfo = MediaFormatDetector.detect('audio.mp3');
console.log(formatInfo);
// {
//   type: 'audio',
//   format: 'mp3',
//   mimeType: 'audio/mpeg',
//   extension: 'mp3',
//   isStreaming: false,
//   isSupported: true
// }

// 检查格式是否支持
const isSupported = MediaFormatDetector.isFormatSupported('mp3');
```

### 2. IMediaAdapter（适配器接口）

所有媒体适配器都需要实现此接口，提供统一的播放控制 API。

### 3. HTML5Adapter（HTML5 适配器）

基于原生 HTML5 Audio/Video 元素的适配器，支持所有浏览器原生支持的格式。

### 4. AdapterFactory（适配器工厂）

根据媒体格式自动选择合适的适配器。

```typescript
import { AdapterFactory } from '@ldesign/player-core';

// 自动创建适配器
const adapter = AdapterFactory.createAdapter('video.mp4', 'video');
await adapter.load('video.mp4');

// 检测格式
const formatInfo = AdapterFactory.detectFormat('audio.mp3');
```

### 5. UniversalMediaPlayer（通用媒体播放器）

框架无关的统一播放器接口，自动处理格式检测和适配器选择。

```typescript
import { UniversalMediaPlayer } from '@ldesign/player-core';

// 创建播放器
const player = new UniversalMediaPlayer({
  src: 'audio.mp3',
  autoplay: false,
  volume: 0.8
});

// 播放控制
await player.play();
player.pause();
player.seek(30);

// 监听事件
player.on('play', () => console.log('Playing'));
player.on('timeupdate', ({ currentTime, duration }) => {
  console.log(`Time: ${currentTime}/${duration}`);
});
```

## 使用示例

### 基础音频播放

```typescript
import { UniversalMediaPlayer } from '@ldesign/player-core';

const player = new UniversalMediaPlayer({
  src: 'https://example.com/audio.mp3',
  autoplay: false,
  volume: 0.8
});

await player.load('https://example.com/audio.mp3');
await player.play();
```

### 基础视频播放

```typescript
import { UniversalMediaPlayer } from '@ldesign/player-core';

const player = new UniversalMediaPlayer({
  src: 'https://example.com/video.mp4',
  mediaType: 'video',
  autoplay: false
});

await player.load('https://example.com/video.mp4');
await player.play();
```

### 支持多种格式

```typescript
import { UniversalMediaPlayer, MediaFormatDetector } from '@ldesign/player-core';

// 自动检测格式
const sources = [
  'audio.mp3',
  'audio.wav',
  'audio.ogg',
  'audio.m4a',
];

sources.forEach(async (src) => {
  const formatInfo = MediaFormatDetector.detect(src);
  if (formatInfo.isSupported) {
    const player = new UniversalMediaPlayer({ src });
    await player.load(src);
  }
});
```

### 自定义适配器

```typescript
import { UniversalMediaPlayer, IMediaAdapter } from '@ldesign/player-core';

// 创建自定义适配器
class CustomAdapter implements IMediaAdapter {
  // 实现接口方法...
}

// 使用自定义适配器
const player = new UniversalMediaPlayer({
  adapter: new CustomAdapter()
});
```

## 框架集成

### React 示例

```tsx
import { useEffect, useRef } from 'react';
import { UniversalMediaPlayer } from '@ldesign/player-core';

function AudioPlayer({ src }: { src: string }) {
  const playerRef = useRef<UniversalMediaPlayer | null>(null);

  useEffect(() => {
    const player = new UniversalMediaPlayer({ src });
    playerRef.current = player;

    player.on('timeupdate', ({ currentTime, duration }) => {
      console.log(`Progress: ${currentTime}/${duration}`);
    });

    return () => {
      player.destroy();
    };
  }, [src]);

  return (
    <div>
      <button onClick={() => playerRef.current?.play()}>播放</button>
      <button onClick={() => playerRef.current?.pause()}>暂停</button>
    </div>
  );
}
```

### Vue 示例

```vue
<template>
  <div>
    <button @click="play">播放</button>
    <button @click="pause">暂停</button>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';
import { UniversalMediaPlayer } from '@ldesign/player-core';

const props = defineProps<{ src: string }>();
const player = ref<UniversalMediaPlayer | null>(null);

onMounted(() => {
  player.value = new UniversalMediaPlayer({ src: props.src });
  
  player.value.on('timeupdate', ({ currentTime, duration }) => {
    console.log(`Progress: ${currentTime}/${duration}`);
  });
});

onUnmounted(() => {
  player.value?.destroy();
});

const play = () => player.value?.play();
const pause = () => player.value?.pause();
</script>
```

## 扩展适配器

要实现新的适配器，只需实现 `IMediaAdapter` 接口：

```typescript
import { IMediaAdapter, MediaLoadOptions } from '@ldesign/player-core';
import { EventEmitter } from '@ldesign/player-core';
import { PlayState } from '@ldesign/player-core';

class CustomAdapter extends EventEmitter implements IMediaAdapter {
  async load(source: string | File | Blob, options?: MediaLoadOptions): Promise<void> {
    // 实现加载逻辑
  }

  async play(): Promise<void> {
    // 实现播放逻辑
  }

  // ... 实现其他接口方法
}
```

## 支持的格式

### 音频格式
- MP3 (.mp3)
- WAV (.wav)
- OGG (.ogg, .oga)
- M4A (.m4a)
- AAC (.aac)
- FLAC (.flac)
- WebM Audio (.webm)

### 视频格式
- MP4 (.mp4, .m4v)
- WebM Video (.webm)
- OGG Video (.ogv)
- MOV (.mov)
- AVI (.avi)
- MKV (.mkv)
- FLV (.flv)

### 流媒体格式
- HLS (.m3u8, .m3u) - 需要浏览器支持或 hls.js
- DASH (.mpd) - 需要 dash.js

## 注意事项

1. **浏览器兼容性**：不同浏览器支持的格式不同，建议提供多个格式的源
2. **流媒体支持**：HLS 和 DASH 需要额外的库支持（如 hls.js、dash.js）
3. **CORS 限制**：跨域媒体资源需要正确的 CORS 配置
4. **移动端限制**：某些移动浏览器对自动播放有限制






