# 🎯 新增功能使用指南

## ✅ 已实现功能

我们刚刚实现了4个核心的播放器增强功能：

1. **PlaybackResume** - 断点续播
2. **PlaybackRateMemory** - 播放速度记忆
3. **QualitySwitcher** - 画质切换
4. **GestureControl** - 手势控制

---

## 1. 断点续播功能 ⏯️

### 功能说明
自动记住每个视频/音频的播放位置，下次打开时自动从上次位置继续播放。

### 使用示例

```typescript
import { AudioPlayer, PlaybackResume } from '@ldesign/player-core';

// 创建播放器
const player = new AudioPlayer({ container: '#player' });

// 创建断点续播实例
const resume = new PlaybackResume(player, {
  minSavePosition: 10,       // 10秒后才开始保存位置
  maxSavePosition: 10,       // 结束前10秒不保存
  autoSaveInterval: 5000,    // 每5秒自动保存
  promptUser: true,          // 询问用户是否继续播放
});

// 加载视频时检查是否有断点
async function loadTrack(trackId: string, src: string) {
  await player.load(src);
  
  // 尝试恢复播放位置
  const resumed = await resume.resume(trackId);
  if (resumed) {
    console.log('已恢复到上次播放位置');
  }
  
  await player.play();
}

// 使用
loadTrack('song-001', 'path/to/audio.mp3');
```

### API

```typescript
// 获取断点位置
const position = resume.getResumePosition(trackId);

// 手动保存位置
resume.saveCurrentPosition();

// 获取所有未完成的记录
const incomplete = resume.getIncompletePositions();

// 清除旧记录（30天前）
resume.clearOldPositions(30);

// 清除所有记录
resume.clearAll();
```

---

## 2. 播放速度记忆功能 💾

### 功能说明
记住每个视频的播放速度，学习视频1.5x，音乐1.0x，有声书1.25x。

### 使用示例

```typescript
import { AudioPlayer, PlaybackRateMemory } from '@ldesign/player-core';

const player = new AudioPlayer({ container: '#player' });

// 创建速度记忆实例
const rateMemory = new PlaybackRateMemory({
  defaultRate: 1.0,
  globalRate: false,  // false=每个视频单独记忆，true=所有视频统一速度
});

// 加载视频时恢复速度
async function loadTrack(trackId: string, src: string) {
  await player.load(src);
  
  // 恢复播放速度
  const savedRate = rateMemory.getRate(trackId);
  player.setPlaybackRate(savedRate);
  console.log(`播放速度: ${savedRate}x`);
}

// 用户更改速度时记住
function changePlaybackRate(rate: number) {
  player.setPlaybackRate(rate);
  
  const trackId = player.getCurrentTrack().id;
  rateMemory.rememberRate(trackId, rate);
  console.log(`已保存速度: ${rate}x`);
}

// UI 控制
document.getElementById('speed-0.5')?.addEventListener('click', () => changePlaybackRate(0.5));
document.getElementById('speed-1.0')?.addEventListener('click', () => changePlaybackRate(1.0));
document.getElementById('speed-1.5')?.addEventListener('click', () => changePlaybackRate(1.5));
document.getElementById('speed-2.0')?.addEventListener('click', () => changePlaybackRate(2.0));
```

### 高级用法

```typescript
// 启用全局速度模式（所有视频使用相同速度）
rateMemory.enableGlobalRate(1.5);

// 获取推荐速度
const podcastRate = rateMemory.getRecommendedRate('podcast'); // 1.25x
const audiobookRate = rateMemory.getRecommendedRate('audiobook'); // 1.5x
const musicRate = rateMemory.getRecommendedRate('music'); // 1.0x

// 获取最常用的速度
const mostUsed = rateMemory.getMostUsedRate();
console.log(`您最常用的速度是: ${mostUsed}x`);
```

---

## 3. 画质切换功能 📺

### 功能说明
支持多清晰度（480p/720p/1080p/4K），自动根据网速选择最佳画质。

### 使用示例

```typescript
import { VideoPlayer, QualitySwitcher } from '@ldesign/player-core';

const player = new VideoPlayer({ container: '#player' });
const qualitySwitcher = new QualitySwitcher(player);

// 添加画质选项
qualitySwitcher.addQualities([
  {
    id: '4k',
    label: '4K',
    width: 3840,
    height: 2160,
    bitrate: 15000,
    url: 'https://example.com/video-4k.mp4',
  },
  {
    id: '1080p',
    label: '1080p',
    width: 1920,
    height: 1080,
    bitrate: 5000,
    url: 'https://example.com/video-1080p.mp4',
    isDefault: true, // 默认画质
  },
  {
    id: '720p',
    label: '720p',
    width: 1280,
    height: 720,
    bitrate: 2500,
    url: 'https://example.com/video-720p.mp4',
  },
  {
    id: '480p',
    label: '480p',
    width: 854,
    height: 480,
    bitrate: 1000,
    url: 'https://example.com/video-480p.mp4',
  },
]);

// 启用自动画质切换
qualitySwitcher.enableAutoSwitch();

// 手动切换画质
async function changeQuality(qualityId: string) {
  const success = await qualitySwitcher.switchQuality(qualityId);
  if (success) {
    console.log('画质切换成功');
  }
}

// 监听画质变化
qualitySwitcher.onChange((quality) => {
  console.log(`当前画质: ${quality.label}`);
  updateQualityUI(quality.label);
});

// 创建画质选择UI
function createQualityMenu() {
  const qualities = qualitySwitcher.getAllQualities();
  const menu = document.getElementById('quality-menu');
  
  qualities.forEach(quality => {
    const button = document.createElement('button');
    button.textContent = quality.label;
    button.onclick = () => changeQuality(quality.id);
    menu?.appendChild(button);
  });
}
```

### 自动画质

```typescript
// 根据网络状况自动选择
await qualitySwitcher.autoSelectQuality();

// 根据屏幕分辨率推荐
const recommended = qualitySwitcher.getRecommendedQuality();
if (recommended) {
  await qualitySwitcher.switchQuality(recommended.id);
}
```

---

## 4. 手势控制功能 👆

### 功能说明
移动端手势操作：
- 双击：暂停/播放
- 左右滑动：快进/快退
- 上下滑动（左侧）：亮度
- 上下滑动（右侧）：音量

### 使用示例

```typescript
import { VideoPlayer, GestureControl } from '@ldesign/player-core';

const player = new VideoPlayer({ container: '#player' });
const container = document.getElementById('player-container') as HTMLElement;

// 创建手势控制
const gesture = new GestureControl(player, container, {
  enableDoubleTap: true,
  enableHorizontalSwipe: true,
  enableVerticalSwipe: true,
  doubleTapDelay: 300,      // 双击间隔
  swipeThreshold: 30,       // 滑动触发阈值
  seekSensitivity: 0.1,     // 快进灵敏度
  volumeSensitivity: 0.003, // 音量灵敏度
});

// 手势控制会自动工作，无需额外代码

// 如果需要禁用某些手势
const customGesture = new GestureControl(player, container, {
  enableDoubleTap: true,
  enableHorizontalSwipe: true,
  enableVerticalSwipe: false, // 禁用音量/亮度手势
});
```

### 效果

- **双击中间**：暂停/播放
- **左右滑动**：显示快进预览"+ 5s → 1:23"
- **左侧上下滑动**：显示亮度指示器"☀️ 80%"
- **右侧上下滑动**：显示音量指示器"🔊 75%"

---

## 💡 组合使用示例

### 完整的智能播放器

```typescript
import {
  AudioPlayer,
  PlaybackResume,
  PlaybackRateMemory,
  QualitySwitcher,
  GestureControl,
  PlayHistory,
  ABLoop,
} from '@ldesign/player-core';

class SmartPlayer {
  private player: AudioPlayer;
  private resume: PlaybackResume;
  private rateMemory: PlaybackRateMemory;
  private qualitySwitcher: QualitySwitcher;
  private gestureControl: GestureControl;
  private history: PlayHistory;
  private abLoop: ABLoop;

  constructor(container: string) {
    // 创建播放器
    this.player = new AudioPlayer({ container });

    // 初始化所有功能
    this.resume = new PlaybackResume(this.player);
    this.rateMemory = new PlaybackRateMemory();
    this.qualitySwitcher = new QualitySwitcher(this.player);
    this.history = new PlayHistory();
    this.abLoop = new ABLoop(this.player);

    // 移动端启用手势控制
    if (this.isMobile()) {
      const containerEl = document.querySelector(container) as HTMLElement;
      this.gestureControl = new GestureControl(this.player, containerEl);
    }

    this.setupListeners();
  }

  /**
   * 智能加载：自动恢复位置和速度
   */
  async loadTrack(track: Track) {
    // 1. 加载视频
    await this.player.load(track.src);

    // 2. 恢复播放速度
    const savedRate = this.rateMemory.getRate(track.id);
    this.player.setPlaybackRate(savedRate);

    // 3. 恢复播放位置
    const resumed = await this.resume.resume(track.id);
    if (!resumed) {
      // 如果没有断点，从头开始
      this.player.seek(0);
    }

    // 4. 开始播放
    await this.player.play();
  }

  /**
   * 设置监听器
   */
  private setupListeners(): void {
    // 播放结束记录历史
    this.player.on('ended', () => {
      const track = this.player.getCurrentTrack();
      this.history.addRecord(
        track.id,
        this.player.getCurrentTime(),
        this.player.getDuration(),
        track
      );
    });

    // 速度变化时记住
    this.player.on('ratechange', ({ rate }) => {
      const track = this.player.getCurrentTrack();
      this.rateMemory.rememberRate(track.id, rate);
    });
  }

  /**
   * 检测是否移动设备
   */
  private isMobile(): boolean {
    return /Android|webOS|iPhone|iPad|iPod/i.test(navigator.userAgent);
  }

  /**
   * 销毁
   */
  destroy(): void {
    this.resume.destroy();
    this.qualitySwitcher.destroy();
    this.gestureControl?.destroy();
    this.abLoop.destroy();
    this.player.destroy();
  }
}

// 使用
const player = new SmartPlayer('#player');

await player.loadTrack({
  id: 'video-001',
  title: '示例视频',
  src: 'https://example.com/video.mp4',
});
```

---

## 📊 功能对比

| 功能 | 实现状态 | 优先级 | 适用场景 |
|------|----------|--------|----------|
| ✅ 断点续播 | 已完成 | 🔴 P0 | 所有场景 |
| ✅ 速度记忆 | 已完成 | 🔴 P0 | 学习、有声书 |
| ✅ 画质切换 | 已完成 | 🔴 P0 | 视频播放 |
| ✅ 手势控制 | 已完成 | 🟡 P1 | 移动端 |
| ⏳ 迷你播放器 | 待实现 | 🟡 P1 | 桌面端 |
| ⏳ 弹幕系统 | 待实现 | 🟡 P1 | 视频分享 |
| ✅ 播放历史 | 已完成 | 🟢 P2 | 统计分析 |
| ✅ A-B循环 | 已完成 | 🟢 P2 | 学习场景 |
| ✅ 离线缓存 | 已完成 | 🟢 P2 | PWA应用 |

---

## 🎯 下一步计划

继续实现：
1. **迷你播放器** - 浮动小窗口播放
2. **弹幕系统** - 实时滚动弹幕
3. **章节标记** - 视频章节导航
4. **播放统计** - 详细的数据分析

---

## 📝 注意事项

### 类型兼容性

某些功能需要播放器实例支持事件监听。如果遇到类型错误，请确保：

1. 使用 `AudioPlayer` 或 `VideoPlayer` 实例
2. 或者扩展 `IPlayer` 接口添加事件方法

```typescript
// 如果使用自定义播放器，需要实现事件系统
class CustomPlayer implements IPlayer {
  // ... 其他方法
  
  on(event: string, callback: Function) {
    // 实现事件监听
  }
}
```

### 浏览器兼容性

- **手势控制**：需要支持 Touch Events
- **画质切换**：部分功能需要 Network Information API
- **离线缓存**：需要 IndexedDB 支持

---

🎉 **现在你的播放器已经具备了强大的智能功能！**
