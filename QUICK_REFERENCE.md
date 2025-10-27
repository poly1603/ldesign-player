# Player 快速参考

## ✅ 构建状态

| 包 | 状态 | 耗时 | 大小 |
|---|------|------|------|
| core | ✅ | 8.35s | 1.88 MB |
| vue | ✅ | 5.02s | 283 KB |
| react | ✅ | 4.91s | 318 KB |
| lit | ✅ | 2.90s | 249 KB |

## 🚀 快速命令

### 构建单个包
```bash
cd packages/core
node ../../../../tools/builder/bin/cli.js build
```

### 构建所有包
```bash
cd packages/core && node ../../../../tools/builder/bin/cli.js build && cd ../..
cd packages/vue && node ../../../../tools/builder/bin/cli.js build && cd ../..
cd packages/react && node ../../../../tools/builder/bin/cli.js build && cd ../..
cd packages/lit && node ../../../../tools/builder/bin/cli.js build && cd ../..
```

### 打开演示
```bash
start packages/core/examples/audio-demo.html
start packages/vue/examples/audio-demo.html
start packages/react/examples/audio-demo.html
start packages/lit/examples/demo.html
```

## 📁 目录结构

```
player/
├── packages/
│   ├── core/.ldesign/ldesign.config.ts
│   ├── vue/.ldesign/ldesign.config.ts
│   ├── react/.ldesign/ldesign.config.ts
│   └── lit/.ldesign/ldesign.config.ts
└── 📚 文档齐全
```

## 💻 使用示例

### Vue
```vue
<template>
  <AudioPlayer :src="audio.mp3" show-waveform />
</template>

<script setup>
import { AudioPlayer } from '@ldesign/player-vue'
</script>
```

### React
```tsx
import { AudioPlayer } from '@ldesign/player-react'

<AudioPlayer src="audio.mp3" showWaveform />
```

### Lit/Web Components
```html
<script type="module">
  import '@ldesign/player-lit/define'
</script>

<ld-audio-player src="audio.mp3" show-waveform></ld-audio-player>
```

### 原生 JS
```javascript
import { AudioPlayer } from '@ldesign/player-core'

const player = new AudioPlayer({ src: 'audio.mp3' })
player.play()
```

## 📚 文档

- [README.md](./README.md) - 主文档
- [TEST_REPORT.md](./TEST_REPORT.md) - 测试报告
- [packages/*/README.md](./packages/) - 各包文档

## ✅ 已完成

- ✅ 重构为 monorepo
- ✅ 配置移至 .ldesign
- ✅ 全部包构建成功
- ✅ 演示已打开测试

---

**状态**: 🎉 完成并测试通过

