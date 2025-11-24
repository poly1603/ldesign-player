# 🎉 新功能介绍

@ldesign/player-core 已进行全面优化，新增了多个实用功能！

---

## 🆕 新增功能概览

### 1. 📊 播放历史记录
记录用户的播放行为，提供统计和分析功能。

### 2. 🔁 A-B 循环播放
支持在两个时间点之间循环播放，适合学习和练习。

### 3. 💾 离线缓存
使用 IndexedDB 缓存媒体文件，支持离线播放和节省流量。

---

## 🚀 快速开始

### 安装

```bash
npm install @ldesign/player-core
# 或
pnpm add @ldesign/player-core
```

### 基础使用

```typescript
import { 
  AudioPlayer,
  PlayHistory,
  ABLoop,
  OfflineCache,
} from '@ldesign/player-core';

// 创建播放器
const player = new AudioPlayer({
  container: '#player',
  autoplay: false,
});

// 加载音频
await player.load('path/to/audio.mp3');
```

---

## 📊 播放历史功能

### 记录播放历史

```typescript
const history = new PlayHistory();

// 监听播放结束事件
player.on('ended', () => {
  const track = player.getCurrentTrack();
  history.addRecord(
    track.id,
    player.getCurrentTime(),
    player.getDuration(),
    track
  );
});
```

### 查看统计信息

```typescript
// 获取最近播放的歌曲
const recent = history.getRecentlyPlayed(20);
console.log('最近播放:', recent);

// 获取最常播放的歌曲
const frequent = history.getFrequentlyPlayed(10);
console.log('播放次数最多:', frequent);

// 获取完整统计
const stats = history.getStatistics();
console.log('总播放次数:', stats.totalPlays);
console.log('总播放时长:', `${Math.floor(stats.totalPlayTime / 3600)}小时`);
```

---

## 🔁 A-B 循环功能

### 基本使用

```typescript
const abLoop = new ABLoop(player);

// 设置循环区间（例如：10秒到30秒）
abLoop.setPointA(10);
abLoop.setPointB(30);

// 启用循环
abLoop.enable();
```

### 交互式设置

```typescript
// HTML 按钮
// <button id="set-a">设置 A 点</button>
// <button id="set-b">设置 B 点</button>
// <button id="toggle-loop">开始/停止循环</button>

document.getElementById('set-a').onclick = () => {
  abLoop.setPointA(); // 使用当前播放时间
  alert(`A 点已设置: ${abLoop.getPointA()}秒`);
};

document.getElementById('set-b').onclick = () => {
  abLoop.setPointB();
  alert(`B 点已设置: ${abLoop.getPointB()}秒`);
};

document.getElementById('toggle-loop').onclick = () => {
  abLoop.toggle();
};
```

### 监听循环事件

```typescript
// 监听循环迭代
abLoop.on('loop-iteration', ({ iteration }) => {
  console.log(`第 ${iteration} 次循环`);
  document.getElementById('loop-count').textContent = iteration;
});

// 监听循环启用
abLoop.on('loop-enabled', () => {
  console.log('循环已启用');
});
```

---

## 💾 离线缓存功能

### 初始化缓存

```typescript
const cache = new OfflineCache();
await cache.init();
```

### 缓存音频文件

```typescript
const track = {
  id: 'song-001',
  title: '歌曲名称',
  src: 'https://example.com/audio.mp3',
};

// 缓存单个音轨（带进度）
await cache.cacheTrack(track, (progress) => {
  console.log(`下载进度: ${progress.toFixed(1)}%`);
  // 更新 UI 进度条
  updateProgressBar(progress);
});
```

### 使用缓存播放

```typescript
// 检查是否已缓存
const isCached = await cache.isCached(track.id);

if (isCached) {
  // 使用缓存的 URL
  const cachedUrl = await cache.getCachedUrl(track.id);
  await player.load(cachedUrl);
  console.log('使用缓存播放');
} else {
  // 使用网络 URL
  await player.load(track.src);
  console.log('使用网络播放');
}
```

### 批量缓存

```typescript
const playlist = [
  { id: '1', title: '歌曲1', src: 'https://example.com/1.mp3' },
  { id: '2', title: '歌曲2', src: 'https://example.com/2.mp3' },
  { id: '3', title: '歌曲3', src: 'https://example.com/3.mp3' },
];

await cache.batchCache(playlist, (trackIndex, progress) => {
  console.log(`缓存第 ${trackIndex + 1} 首: ${progress.toFixed(1)}%`);
});
```

### 缓存管理

```typescript
// 获取缓存统计
const stats = await cache.getStatistics();
console.log('已缓存:', stats.totalTracks, '首');
console.log('占用空间:', (stats.totalSize / 1024 / 1024).toFixed(2), 'MB');

// 清理 30 天前的缓存
const removed = await cache.clearOldCache(30);
console.log('清理了', removed, '个过期缓存');

// 设置最大缓存大小 (500MB)
cache.setMaxCacheSize(500 * 1024 * 1024);
```

---

## 🎨 完整示例

### 多功能播放器

```typescript
import { 
  AudioPlayer,
  PlayHistory,
  ABLoop,
  OfflineCache,
} from '@ldesign/player-core';

class AdvancedPlayer {
  private player: AudioPlayer;
  private history: PlayHistory;
  private abLoop: ABLoop;
  private cache: OfflineCache;

  constructor() {
    // 初始化播放器
    this.player = new AudioPlayer({
      container: '#player',
      autoplay: false,
    });

    // 初始化功能模块
    this.history = new PlayHistory();
    this.abLoop = new ABLoop(this.player);
    this.cache = new OfflineCache();
    
    this.setupListeners();
    this.cache.init();
  }

  private setupListeners(): void {
    // 记录播放历史
    this.player.on('ended', () => {
      const track = this.player.getCurrentTrack();
      this.history.addRecord(
        track.id,
        this.player.getCurrentTime(),
        this.player.getDuration(),
        track
      );
    });

    // A-B 循环计数
    this.abLoop.on('loop-iteration', ({ iteration }) => {
      console.log(`循环播放第 ${iteration} 次`);
    });
  }

  // 智能加载：优先使用缓存
  async loadTrack(track: Track): Promise<void> {
    const isCached = await this.cache.isCached(track.id);
    
    if (isCached) {
      const cachedUrl = await this.cache.getCachedUrl(track.id);
      await this.player.load(cachedUrl!);
      console.log('✅ 使用缓存播放');
    } else {
      await this.player.load(track.src);
      console.log('🌐 使用网络播放');
      
      // 后台缓存
      this.cacheInBackground(track);
    }
  }

  // 后台缓存
  private async cacheInBackground(track: Track): Promise<void> {
    try {
      await this.cache.cacheTrack(track, (progress) => {
        if (progress === 100) {
          console.log('✅ 缓存完成:', track.title);
        }
      });
    } catch (error) {
      console.error('缓存失败:', error);
    }
  }

  // 设置循环区间
  setLoopRegion(start: number, end: number): void {
    this.abLoop.setPointA(start);
    this.abLoop.setPointB(end);
    this.abLoop.enable();
  }

  // 获取播放统计
  getPlayStats() {
    const stats = this.history.getStatistics();
    return {
      plays: stats.totalPlays,
      hours: Math.floor(stats.totalPlayTime / 3600),
      mostPlayed: stats.mostPlayed.slice(0, 5),
    };
  }

  // 清理
  destroy(): void {
    this.player.destroy();
    this.abLoop.destroy();
    this.cache.close();
  }
}

// 使用
const player = new AdvancedPlayer();

// 加载并播放
await player.loadTrack({
  id: 'song-001',
  title: '示例歌曲',
  src: 'https://example.com/audio.mp3',
});

// 设置循环（10秒到30秒）
player.setLoopRegion(10, 30);

// 查看统计
console.log(player.getPlayStats());
```

---

## 🎯 实际应用场景

### 1. 语言学习应用

```typescript
// 循环播放对话片段
abLoop.setPointA(120); // 2分钟
abLoop.setPointB(180); // 3分钟
abLoop.enable();

// 降低播放速度
player.setPlaybackRate(0.75);

// 循环5次后自动停止
let count = 0;
const unsubscribe = abLoop.on('loop-iteration', ({ iteration }) => {
  count++;
  if (count >= 5) {
    abLoop.disable();
    player.pause();
    unsubscribe();
    alert('已完成5次循环');
  }
});
```

### 2. 音乐练习应用

```typescript
// 练习某个乐句
class PracticeMode {
  constructor(player, abLoop) {
    this.player = player;
    this.abLoop = abLoop;
    this.practiceCount = 0;
  }

  startPractice(start, end, targetLoops = 10) {
    this.abLoop.setPointA(start);
    this.abLoop.setPointB(end);
    this.player.setPlaybackRate(0.5); // 半速播放
    this.abLoop.enable();

    this.abLoop.on('loop-iteration', ({ iteration }) => {
      this.practiceCount = iteration;
      
      // 每完成5次，速度提升
      if (iteration === 5) {
        this.player.setPlaybackRate(0.75);
      } else if (iteration === targetLoops) {
        this.player.setPlaybackRate(1.0);
        this.abLoop.disable();
        alert('练习完成！');
      }
    });
  }
}
```

### 3. PWA 离线音乐应用

```typescript
// 预加载用户喜欢的歌曲
async function preloadFavorites(favorites) {
  const cache = new OfflineCache();
  await cache.init();

  for (let i = 0; i < favorites.length; i++) {
    const track = favorites[i];
    
    // 检查是否已缓存
    if (await cache.isCached(track.id)) {
      continue;
    }

    // 缓存
    await cache.cacheTrack(track, (progress) => {
      console.log(`[${i + 1}/${favorites.length}] ${track.title}: ${progress}%`);
    });
  }

  console.log('所有收藏歌曲已缓存完成！');
}

// 离线播放
async function playOffline(trackId) {
  const cache = new OfflineCache();
  await cache.init();

  if (await cache.isCached(trackId)) {
    const url = await cache.getCachedUrl(trackId);
    player.load(url);
    player.play();
  } else {
    alert('该歌曲未缓存，请联网后播放');
  }
}
```

---

## 📚 更多资源

- [完整 API 文档](./API.md)
- [功能使用示例](./FEATURE_EXAMPLES.md)
- [优化报告](./OPTIMIZATION_REPORT.md)
- [优化总结](./OPTIMIZATION_SUMMARY.md)

---

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License

---

**🎉 享受新功能带来的便利！**
