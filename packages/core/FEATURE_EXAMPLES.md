# 新功能使用示例

本文档展示如何使用新添加的功能。

---

## 📊 播放历史记录

### 基础使用

```typescript
import { PlayHistory, AudioPlayer } from '@ldesign/player-core';

// 创建播放历史实例
const history = new PlayHistory();

// 创建播放器
const player = new AudioPlayer({ container: '#player' });

// 监听播放结束，记录历史
player.on('ended', () => {
  const track = player.getCurrentTrack();
  const playTime = player.getCurrentTime();
  const duration = player.getDuration();
  
  history.addRecord(track.id, playTime, duration, track);
});
```

### 获取统计数据

```typescript
// 获取最近播放的20首歌曲
const recent = history.getRecentlyPlayed(20);
console.log('最近播放:', recent);

// 获取最常播放的10首歌曲
const frequent = history.getFrequentlyPlayed(10);
console.log('最常播放:', frequent);

// 获取完整统计信息
const stats = history.getStatistics();
console.log('统计信息:', {
  totalPlays: stats.totalPlays,
  totalPlayTime: `${Math.floor(stats.totalPlayTime / 3600)} 小时`,
  averagePlayTime: `${Math.floor(stats.averagePlayTime / 60)} 分钟`,
});
```

### 搜索和过滤

```typescript
// 搜索播放记录
const searchResults = history.search('周杰伦');

// 获取今天的播放记录
const todayRecords = history.getTodayRecords();

// 获取指定时间范围的记录
const startDate = new Date('2024-01-01');
const endDate = new Date('2024-12-31');
const yearRecords = history.getRecordsInRange(startDate, endDate);
```

### 数据管理

```typescript
// 清除90天前的旧记录
history.clearOldRecords(90);

// 导出历史记录
const json = history.exportToJSON();
localStorage.setItem('my-backup', json);

// 导入历史记录
const backup = localStorage.getItem('my-backup');
if (backup) {
  history.importFromJSON(backup);
}

// 清除所有记录
history.clearAll();
```

---

## 🔁 A-B 循环播放

### 基础使用

```typescript
import { ABLoop, AudioPlayer } from '@ldesign/player-core';

const player = new AudioPlayer({ container: '#player' });
const abLoop = new ABLoop(player);

// 设置 A 点（当前时间）
abLoop.setPointA();

// 播放到想要的位置后设置 B 点
setTimeout(() => {
  abLoop.setPointB();
  abLoop.enable(); // 启用循环
}, 5000);
```

### 手动设置时间点

```typescript
// 设置 A 点为 10 秒
abLoop.setPointA(10);

// 设置 B 点为 30 秒
abLoop.setPointB(30);

// 启用循环
abLoop.enable();
```

### 事件监听

```typescript
// 监听 A 点设置
abLoop.on('pointA-set', ({ time }) => {
  console.log(`A 点设置为: ${time}秒`);
  updateUI('A', time);
});

// 监听 B 点设置
abLoop.on('pointB-set', ({ time }) => {
  console.log(`B 点设置为: ${time}秒`);
  updateUI('B', time);
});

// 监听循环启用
abLoop.on('loop-enabled', () => {
  console.log('A-B 循环已启用');
  showNotification('循环播放已开启');
});

// 监听循环迭代
abLoop.on('loop-iteration', ({ iteration }) => {
  console.log(`第 ${iteration} 次循环`);
  updateCounter(iteration);
});
```

### 控制方法

```typescript
// 切换循环状态
abLoop.toggle();

// 检查是否启用
if (abLoop.isEnabled()) {
  console.log('循环已启用');
}

// 获取循环信息
console.log('A 点:', abLoop.getPointA());
console.log('B 点:', abLoop.getPointB());
console.log('循环区间长度:', abLoop.getLoopDuration(), '秒');
console.log('已循环次数:', abLoop.getIterations());

// 跳转到 A 点
abLoop.seekToPointA();

// 跳转到 B 点
abLoop.seekToPointB();

// 清除循环点
abLoop.clear();
```

### 实际应用场景

#### 1. 学习外语

```typescript
// 循环播放一段对话
const dialog = {
  start: 120, // 2分钟
  end: 180,   // 3分钟
};

abLoop.setPointA(dialog.start);
abLoop.setPointB(dialog.end);
abLoop.enable();

// 循环5次后自动停止
let count = 0;
abLoop.on('loop-iteration', ({ iteration }) => {
  count++;
  if (count >= 5) {
    abLoop.disable();
    player.pause();
    alert('已循环播放5次');
  }
});
```

#### 2. 音乐练习

```typescript
// 循环播放某个乐句
const phrase = { start: 45, end: 60 };

abLoop.setPointA(phrase.start);
abLoop.setPointB(phrase.end);

// 降低播放速度方便学习
player.setPlaybackRate(0.75);

abLoop.enable();

// UI 控制
document.getElementById('loop-toggle').addEventListener('click', () => {
  abLoop.toggle();
});

document.getElementById('speed-up').addEventListener('click', () => {
  const current = player.getPlaybackRate();
  player.setPlaybackRate(Math.min(current + 0.25, 2));
});
```

---

## 🎨 组合使用示例

### 智能练习系统

```typescript
import { AudioPlayer, ABLoop, PlayHistory } from '@ldesign/player-core';

class SmartPracticeSystem {
  private player: AudioPlayer;
  private abLoop: ABLoop;
  private history: PlayHistory;
  private practiceLog: Array<{
    sectionId: string;
    loops: number;
    masteryLevel: number;
  }> = [];

  constructor() {
    this.player = new AudioPlayer({ container: '#player' });
    this.abLoop = new ABLoop(this.player);
    this.history = new PlayHistory('practice-history');
    
    this.setupListeners();
  }

  private setupListeners(): void {
    // 记录练习历史
    this.abLoop.on('loop-iteration', ({ iteration }) => {
      const currentSection = this.getCurrentSection();
      this.updatePracticeLog(currentSection, iteration);
    });

    // 自动调整难度
    this.player.on('ended', () => {
      this.analyzeMastery();
      this.suggestNextSection();
    });
  }

  practiceSection(start: number, end: number, targetLoops = 5): void {
    this.abLoop.setPointA(start);
    this.abLoop.setPointB(end);
    this.abLoop.enable();

    // 达到目标次数后停止
    const unsubscribe = this.abLoop.on('loop-iteration', ({ iteration }) => {
      if (iteration >= targetLoops) {
        this.abLoop.disable();
        unsubscribe();
        this.markSectionComplete();
      }
    });
  }

  private updatePracticeLog(sectionId: string, loops: number): void {
    const existing = this.practiceLog.find(log => log.sectionId === sectionId);
    if (existing) {
      existing.loops = loops;
      existing.masteryLevel = this.calculateMastery(loops);
    } else {
      this.practiceLog.push({
        sectionId,
        loops,
        masteryLevel: this.calculateMastery(loops),
      });
    }
  }

  private calculateMastery(loops: number): number {
    // 简单的熟练度计算：循环次数越多，熟练度越高
    return Math.min(loops / 10 * 100, 100);
  }

  private analyzeMastery(): void {
    const stats = this.history.getStatistics();
    console.log('练习统计:', {
      总练习次数: stats.totalPlays,
      总练习时长: `${Math.floor(stats.totalPlayTime / 3600)}小时`,
      平均每次时长: `${Math.floor(stats.averagePlayTime / 60)}分钟`,
    });
  }

  private suggestNextSection(): void {
    // 根据历史推荐下一个练习片段
    const weakSections = this.practiceLog
      .filter(log => log.masteryLevel < 70)
      .sort((a, b) => a.masteryLevel - b.masteryLevel);

    if (weakSections.length > 0) {
      console.log('建议加强练习:', weakSections[0]);
    }
  }

  private getCurrentSection(): string {
    const a = this.abLoop.getPointA();
    const b = this.abLoop.getPointB();
    return `section-${a}-${b}`;
  }

  private markSectionComplete(): void {
    console.log('片段练习完成！');
    // 记录到历史
    const track = this.player.getCurrentTrack();
    this.history.addRecord(
      track.id,
      this.abLoop.getLoopDuration() * this.abLoop.getIterations(),
      track.duration || 0,
      track
    );
  }

  exportProgress(): string {
    return JSON.stringify({
      history: this.history.exportToJSON(),
      practiceLog: this.practiceLog,
      timestamp: new Date().toISOString(),
    });
  }
}

// 使用示例
const practiceSystem = new SmartPracticeSystem();

// 练习第1-3小节，循环5次
practiceSystem.practiceSection(0, 30, 5);

// 导出进度
const progress = practiceSystem.exportProgress();
localStorage.setItem('practice-progress', progress);
```

---

## 💡 最佳实践

### 1. 内存管理

```typescript
// 组件卸载时清理资源
class PlayerComponent {
  private abLoop: ABLoop;
  private history: PlayHistory;
  private unsubscribers: Array<() => void> = [];

  mount() {
    // 订阅事件时保存取消订阅函数
    this.unsubscribers.push(
      this.abLoop.on('loop-enabled', this.handleLoopEnabled)
    );
    this.unsubscribers.push(
      this.abLoop.on('loop-iteration', this.handleIteration)
    );
  }

  unmount() {
    // 取消所有订阅
    this.unsubscribers.forEach(unsub => unsub());
    this.unsubscribers = [];
    
    // 销毁实例
    this.abLoop.destroy();
  }
}
```

### 2. 错误处理

```typescript
try {
  // 确保设置了两个点才启用循环
  if (abLoop.getPointA() === null || abLoop.getPointB() === null) {
    throw new Error('请先设置 A 点和 B 点');
  }
  
  abLoop.enable();
} catch (error) {
  console.error('启用循环失败:', error);
  showNotification('请先标记循环区间', 'error');
}
```

### 3. 数据持久化

```typescript
// 定期保存历史记录
setInterval(() => {
  const backup = history.exportToJSON();
  localStorage.setItem('player-history-backup', backup);
}, 60000); // 每分钟保存一次

// 页面加载时恢复
window.addEventListener('load', () => {
  const backup = localStorage.getItem('player-history-backup');
  if (backup) {
    try {
      history.importFromJSON(backup);
    } catch (error) {
      console.error('恢复历史记录失败:', error);
    }
  }
});
```

### 4. 性能优化

```typescript
// 使用防抖优化频繁的事件
const debouncedSave = debounce((data) => {
  localStorage.setItem('ab-loop-state', JSON.stringify(data));
}, 1000);

abLoop.on('pointA-set', ({ time }) => {
  debouncedSave({ pointA: time, pointB: abLoop.getPointB() });
});
```

---

## 🔗 相关资源

- [完整 API 文档](./API.md)
- [优化报告](./OPTIMIZATION_REPORT.md)
- [更新日志](./CHANGELOG.md)
