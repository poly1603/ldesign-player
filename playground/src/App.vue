<template>
  <div class="app">
    <header class="header">
      <h1>🎬 LDesign Player</h1>
      <p class="subtitle">全功能音视频播放器演示 · 支持 Core / Vue / React / Lit</p>
    </header>

    <nav class="tabs">
      <button v-for="tab in tabs" :key="tab.id" class="tab-btn" :class="{ active: activeTab === tab.id }" @click="activeTab = tab.id">
        <span v-html="tab.icon"></span>
        {{ tab.label }}
      </button>
    </nav>

    <!-- ==================== 视频播放器 ==================== -->
    <section v-show="activeTab === 'video'" class="content">
      <div class="section-header">
        <h2>🎬 视频播放器</h2>
        <p>支持弹幕、字幕、截图、滤镜、画中画、手势控制等功能</p>
      </div>

      <div class="controls-row">
        <div class="control-group">
          <span class="label">布局：</span>
          <button class="btn-sm" :class="{ active: !compactMode }" @click="compactMode = false">标准</button>
          <button class="btn-sm" :class="{ active: compactMode }" @click="compactMode = true">紧凑</button>
        </div>
        <div class="control-group">
          <span class="label">主题：</span>
          <button v-for="c in themeColors" :key="c" class="color-btn" :style="{ background: c }" :class="{ active: videoThemeColor === c }" @click="setVideoTheme(c)"></button>
        </div>
      </div>

      <div class="player-wrapper">
        <div ref="videoContainer" class="player-box"></div>
      </div>

      <!-- 弹幕控制 -->
      <div class="feature-panel">
        <h3>💬 弹幕发送</h3>
        <div class="emoji-row">
          <button v-for="e in emojis" :key="e" class="emoji-btn" @click="danmakuText += e">{{ e }}</button>
        </div>
        <div class="input-row">
          <input type="color" v-model="danmakuColor" class="color-input" />
          <input v-model="danmakuText" class="text-input" placeholder="输入弹幕内容..." @keyup.enter="sendDanmaku" />
          <button class="btn-primary" @click="sendDanmaku">发送</button>
        </div>
      </div>

      <!-- 视频功能面板 -->
      <div class="features-grid">
        <div class="feature-card">
          <h4>🎨 视频滤镜</h4>
          <div class="filter-btns">
            <button v-for="f in videoFilters" :key="f.name" class="filter-btn" @click="applyVideoFilter(f.value)">{{ f.name }}</button>
          </div>
        </div>

        <div class="feature-card">
          <h4>📸 视频截图</h4>
          <button class="btn-primary" @click="takeScreenshot">截取当前帧</button>
          <img v-if="screenshotUrl" :src="screenshotUrl" class="screenshot-preview" alt="截图预览" />
        </div>

        <div class="feature-card">
          <h4>🖼️ 画中画</h4>
          <button class="btn-primary" @click="togglePiP">{{ pipActive ? '退出画中画' : '进入画中画' }}</button>
          <p class="hint">支持拖拽、缩放、位置记忆</p>
        </div>

        <div class="feature-card">
          <h4>🔄 视频旋转</h4>
          <div class="rotate-btns">
            <button class="btn-sm" @click="rotateVideo(-90)">↶ 左转</button>
            <button class="btn-sm" @click="rotateVideo(90)">↷ 右转</button>
            <button class="btn-sm" @click="rotateVideo(180)">⇅ 翻转</button>
          </div>
        </div>

        <div class="feature-card">
          <h4>🔁 AB循环</h4>
          <div class="loop-btns">
            <button class="btn-sm" @click="setLoopA">设置A点</button>
            <button class="btn-sm" @click="setLoopB">设置B点</button>
            <button class="btn-sm" @click="clearLoop">清除</button>
          </div>
          <p class="hint">A: {{ loopA?.toFixed(1) || '-' }}s / B: {{ loopB?.toFixed(1) || '-' }}s</p>
        </div>

        <div class="feature-card">
          <h4>⌨️ 快捷键</h4>
          <button class="btn-primary" @click="showShortcuts = true">查看快捷键</button>
          <p class="hint">空格暂停、方向键快进/音量、F全屏</p>
        </div>
      </div>
    </section>

    <!-- ==================== 音频播放器 ==================== -->
    <section v-show="activeTab === 'audio'" class="content">
      <div class="section-header">
        <h2>🎵 音频播放器</h2>
        <p>支持歌词同步、均衡器、音频可视化、音频增强等功能</p>
      </div>

      <div class="controls-row">
        <div class="control-group">
          <span class="label">布局：</span>
          <button class="btn-sm" :class="{ active: audioLayout === 'compact' }" @click="audioLayout = 'compact'">紧凑</button>
          <button class="btn-sm" :class="{ active: audioLayout === 'vertical' }" @click="audioLayout = 'vertical'">垂直</button>
        </div>
        <div class="control-group">
          <span class="label">封面：</span>
          <button class="btn-sm" :class="{ active: audioCoverStyle === 'square' }" @click="audioCoverStyle = 'square'">方形</button>
          <button class="btn-sm" :class="{ active: audioCoverStyle === 'round' }" @click="audioCoverStyle = 'round'">CD</button>
        </div>
        <div class="control-group">
          <span class="label">主题：</span>
          <button v-for="c in themeColors" :key="c" class="color-btn" :style="{ background: c }" :class="{ active: audioThemeColor === c }" @click="setAudioTheme(c)"></button>
        </div>
      </div>

      <div class="player-wrapper audio-wrapper">
        <div ref="audioContainer" class="player-box audio-box"></div>
      </div>

      <!-- 音频功能面板 -->
      <div class="features-grid">
        <div class="feature-card">
          <h4>🎛️ 均衡器预设</h4>
          <div class="eq-presets">
            <button v-for="p in eqPresets" :key="p" class="btn-sm" @click="applyEQPreset(p)">{{ p }}</button>
          </div>
        </div>

        <div class="feature-card">
          <h4>🎵 音频增强</h4>
          <div class="enhance-controls">
            <label><input type="checkbox" v-model="vocalEnhance" /> 人声增强</label>
            <label><input type="checkbox" v-model="bassBoost" /> 低音增强</label>
            <label><input type="checkbox" v-model="loudnessNorm" /> 响度标准化</label>
          </div>
        </div>

        <div class="feature-card wide">
          <h4>📊 音频可视化</h4>
          <div class="visualizer-controls">
            <select v-model="visualizerType">
              <option value="bars">频谱条</option>
              <option value="waveform">波形</option>
              <option value="circular">环形</option>
              <option value="circularDouble">双环形</option>
              <option value="circularWave">环形波浪</option>
              <option value="particles">粒子</option>
              <option value="particleFlow">粒子流</option>
              <option value="starfield">星空</option>
              <option value="pulse">脉冲</option>
              <option value="galaxy">银河</option>
              <option value="spectrum">频谱</option>
              <option value="oscilloscope">示波器</option>
            </select>
          </div>
          <canvas ref="visualizerCanvas" class="visualizer-canvas"></canvas>
        </div>
      </div>
    </section>

    <!-- ==================== 高级功能 ==================== -->
    <section v-show="activeTab === 'advanced'" class="content">
      <div class="section-header">
        <h2>⚙️ 高级功能</h2>
        <p>智能预加载、播放统计、网络自适应、睡眠定时器等</p>
      </div>

      <div class="features-grid">
        <div class="feature-card">
          <h4>📊 播放统计</h4>
          <div class="stats-info">
            <p>总观看时长: {{ formatTime(stats.totalWatchTime) }}</p>
            <p>会话数: {{ stats.totalSessions }}</p>
            <p>平均完播率: {{ (stats.avgCompletionRate * 100).toFixed(1) }}%</p>
          </div>
        </div>

        <div class="feature-card">
          <h4>⏰ 睡眠定时器</h4>
          <div class="timer-controls">
            <button v-for="t in sleepTimerOptions" :key="t.value" class="btn-sm" :class="{ active: sleepTimer === t.value }" @click="setSleepTimer(t.value)">
              {{ t.label }}
            </button>
          </div>
          <p v-if="sleepTimer > 0" class="hint">剩余 {{ formatTime(sleepRemaining) }}</p>
        </div>

        <div class="feature-card">
          <h4>🔗 智能预加载</h4>
          <div class="preload-info">
            <p>队列: {{ preloadStats.queueLength }} 项</p>
            <p>加载中: {{ preloadStats.loadingCount }} 项</p>
            <p>已缓存: {{ preloadStats.cachedCount }} 项</p>
            <p>缓存大小: {{ (preloadStats.totalCacheSize / 1024 / 1024).toFixed(2) }} MB</p>
          </div>
        </div>

        <div class="feature-card">
          <h4>📶 网络自适应</h4>
          <div class="network-info">
            <p>网络类型: {{ networkInfo.effectiveType || '未知' }}</p>
            <p>带宽估算: {{ networkInfo.downlink?.toFixed(1) || '?' }} Mbps</p>
            <p>建议画质: {{ suggestedQuality }}</p>
          </div>
        </div>

        <div class="feature-card">
          <h4>💾 离线缓存</h4>
          <button class="btn-primary" @click="cacheCurrentMedia">缓存当前媒体</button>
          <p class="hint">使用 Service Worker 实现离线播放</p>
        </div>

        <div class="feature-card">
          <h4>🎯 播放历史</h4>
          <div class="history-list">
            <div v-for="h in playHistory.slice(0, 5)" :key="h.id" class="history-item">
              <span>{{ h.title }}</span>
              <span class="time">{{ formatTime(h.position) }}</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ==================== 字幕功能 ==================== -->
    <section v-show="activeTab === 'subtitle'" class="content">
      <div class="section-header">
        <h2>📝 字幕功能</h2>
        <p>支持 SRT/VTT/ASS 格式、样式自定义、双语字幕、搜索跳转</p>
      </div>

      <div class="player-wrapper">
        <div ref="subtitleVideoContainer" class="player-box"></div>
      </div>

      <div class="features-grid">
        <div class="feature-card">
          <h4>🎨 字幕样式</h4>
          <div class="subtitle-style-controls">
            <label>字号: <input type="range" min="16" max="40" v-model.number="subtitleStyle.fontSize" /></label>
            <label>颜色: <input type="color" v-model="subtitleStyle.color" /></label>
            <label>背景: <input type="color" v-model="subtitleStyle.bgColor" /></label>
          </div>
        </div>

        <div class="feature-card">
          <h4>📋 样式预设</h4>
          <div class="preset-btns">
            <button v-for="p in subtitlePresets" :key="p" class="btn-sm">{{ p }}</button>
          </div>
        </div>

        <div class="feature-card">
          <h4>⏱️ 时间偏移</h4>
          <div class="offset-controls">
            <button class="btn-sm" @click="subtitleOffset -= 0.5">-0.5s</button>
            <span>{{ subtitleOffset.toFixed(1) }}s</span>
            <button class="btn-sm" @click="subtitleOffset += 0.5">+0.5s</button>
          </div>
        </div>

        <div class="feature-card">
          <h4>🔍 字幕搜索</h4>
          <div class="search-controls">
            <input v-model="subtitleSearchQuery" class="text-input" placeholder="搜索字幕内容..." />
            <button class="btn-sm">搜索</button>
          </div>
        </div>
      </div>
    </section>

    <!-- 快捷键弹窗 -->
    <div v-if="showShortcuts" class="modal-overlay" @click="showShortcuts = false">
      <div class="modal-content" @click.stop>
        <h3>⌨️ 快捷键列表</h3>
        <div class="shortcut-list">
          <div class="shortcut-item"><span class="key">Space</span> 播放/暂停</div>
          <div class="shortcut-item"><span class="key">←</span> 后退 5 秒</div>
          <div class="shortcut-item"><span class="key">→</span> 前进 5 秒</div>
          <div class="shortcut-item"><span class="key">↑</span> 增加音量</div>
          <div class="shortcut-item"><span class="key">↓</span> 降低音量</div>
          <div class="shortcut-item"><span class="key">M</span> 静音切换</div>
          <div class="shortcut-item"><span class="key">F</span> 全屏切换</div>
          <div class="shortcut-item"><span class="key">P</span> 画中画</div>
          <div class="shortcut-item"><span class="key">D</span> 弹幕开关</div>
          <div class="shortcut-item"><span class="key">C</span> 字幕开关</div>
          <div class="shortcut-item"><span class="key">[</span> 减慢播放</div>
          <div class="shortcut-item"><span class="key">]</span> 加快播放</div>
        </div>
        <button class="btn-primary" @click="showShortcuts = false">关闭</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted, watch, computed } from 'vue'
import { CustomVideoPlayer, CustomAudioPlayer } from '@ldesign/player-core'

// ============ 标签页 ============
const tabs = [
  { id: 'video', label: '视频播放', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="m9 8 6 4-6 4Z"/></svg>' },
  { id: 'audio', label: '音频播放', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>' },
  { id: 'advanced', label: '高级功能', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M12 1v6M12 17v6M4.22 4.22l4.24 4.24M15.54 15.54l4.24 4.24M1 12h6M17 12h6M4.22 19.78l4.24-4.24M15.54 8.46l4.24-4.24"/></svg>' },
  { id: 'subtitle', label: '字幕功能', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="18" height="14" x="3" y="5" rx="2"/><path d="M7 15h4M15 15h2M7 11h2M13 11h4"/></svg>' },
]
const activeTab = ref('video')

// ============ 主题色 ============
const themeColors = ['#6366f1', '#ec4899', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']
const videoThemeColor = ref('#6366f1')
const audioThemeColor = ref('#6366f1')

// ============ 开源媒体资源 ============
// 视频: Big Buck Bunny (Blender Foundation 开源电影)
const videoSources = {
  main: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
  poster: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/BigBuckBunny.jpg',
}

// 音频: 免费音乐 (SoundHelix)
const audioSources = {
  main: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
  cover: 'https://picsum.photos/300/300?random=1',
}

// 示例歌词
const sampleLyrics = `[ti:Electronic Dreams]
[ar:SoundHelix]
[al:Sample Album]
[00:00.00]♪ Electronic Dreams ♪
[00:05.00]
[00:10.00]Lights are flashing in the night
[00:16.00]Colors dancing, burning bright
[00:22.00]Feel the rhythm in your soul
[00:28.00]Let the music take control
[00:34.00]
[00:40.00]Electronic dreams tonight
[00:46.00]We're flying high, feeling right
[00:52.00]Bass is dropping, crowd is jumping
[00:58.00]Hearts are beating, never stopping
[01:04.00]
[01:10.00]In this moment we're alive
[01:16.00]Nothing else can make us feel so high
[01:22.00]Electronic waves wash over me
[01:28.00]Setting all my spirit free`

// 示例弹幕
const sampleDanmaku = [
  { text: '前方高能！🔥', time: 2, color: '#ff6b6b' },
  { text: '太可爱了 ❤️', time: 5, color: '#ff69b4' },
  { text: '经典开场', time: 8, color: '#ffffff' },
  { text: '兔子好萌 🐰', time: 12, color: '#ffd93d' },
  { text: '233333', time: 15, color: '#6bcb77' },
  { text: '弹幕护体', time: 18, color: '#4d96ff' },
  { text: '哈哈哈哈', time: 22, color: '#ffffff' },
  { text: '这画质绝了', time: 25, color: '#ff9f43' },
  { text: '童年回忆', time: 30, color: '#a66cff' },
  { text: '大家好！👋', time: 35, color: '#00d2d3' },
]

// ============ 容器引用 ============
const videoContainer = ref<HTMLElement>()
const audioContainer = ref<HTMLElement>()
const visualizerCanvas = ref<HTMLCanvasElement>()
const subtitleVideoContainer = ref<HTMLElement>()

// ============ 播放器实例 ============
let videoPlayer: CustomVideoPlayer | null = null
let audioPlayer: CustomAudioPlayer | null = null
let subtitlePlayer: CustomVideoPlayer | null = null

// ============ 视频状态 ============
const compactMode = ref(false)
const danmakuText = ref('')
const danmakuColor = ref('#ffffff')
const screenshotUrl = ref('')
const pipActive = ref(false)
const loopA = ref<number | null>(null)
const loopB = ref<number | null>(null)
const showShortcuts = ref(false)
const currentRotation = ref(0)

const emojis = ['😀', '😂', '🤣', '❤️', '🔥', '👍', '👏', '🎉', '💯', '⭐', '🚀', '😎']

const videoFilters = [
  { name: '原始', value: 'none' },
  { name: '复古', value: 'sepia(80%)' },
  { name: '黑白', value: 'grayscale(100%)' },
  { name: '高对比', value: 'contrast(150%)' },
  { name: '暖色', value: 'sepia(30%) saturate(140%)' },
  { name: '冷色', value: 'saturate(80%) hue-rotate(180deg)' },
]

// ============ 音频状态 ============
const audioLayout = ref<'compact' | 'vertical'>('compact')
const audioCoverStyle = ref<'square' | 'round'>('round')
const visualizerType = ref('bars')

const vocalEnhance = ref(false)
const bassBoost = ref(false)
const loudnessNorm = ref(false)

const eqPresets = ['默认', '流行', '摇滚', '古典', '电子', '低音']

// ============ 高级功能状态 ============
const stats = reactive({
  totalWatchTime: 3600,
  totalSessions: 12,
  avgCompletionRate: 0.75,
})

const sleepTimer = ref(0)
const sleepRemaining = ref(0)
const sleepTimerOptions = [
  { label: '关闭', value: 0 },
  { label: '15分钟', value: 15 * 60 },
  { label: '30分钟', value: 30 * 60 },
  { label: '1小时', value: 60 * 60 },
]

const preloadStats = reactive({
  queueLength: 3,
  loadingCount: 1,
  cachedCount: 5,
  totalCacheSize: 15 * 1024 * 1024,
})

const networkInfo = reactive({
  effectiveType: '4g',
  downlink: 8.5,
})

const suggestedQuality = computed(() => {
  if (networkInfo.downlink >= 10) return '1080p'
  if (networkInfo.downlink >= 5) return '720p'
  if (networkInfo.downlink >= 2) return '480p'
  return '360p'
})

const playHistory = ref([
  { id: '1', title: 'Big Buck Bunny', position: 120 },
  { id: '2', title: 'Sintel', position: 300 },
  { id: '3', title: 'Tears of Steel', position: 45 },
])

// ============ 字幕状态 ============
const subtitleStyle = reactive({
  fontSize: 24,
  color: '#ffffff',
  bgColor: '#000000',
})
const subtitlePresets = ['默认', 'Netflix', 'YouTube', '电影', '极简', '高对比']
const subtitleOffset = ref(0)
const subtitleSearchQuery = ref('')

// ============ 方法 ============
function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  return `${m}:${s.toString().padStart(2, '0')}`
}

// 视频播放器
function createVideoPlayer() {
  if (videoPlayer) videoPlayer.destroy()
  
  if (videoContainer.value) {
    videoPlayer = new CustomVideoPlayer({
      container: videoContainer.value,
      src: videoSources.main,
      poster: videoSources.poster,
      aspectRatio: '16:9',
      borderRadius: 12,
      compactMode: compactMode.value,
      themeColor: videoThemeColor.value,
      danmaku: true,
      danmakuData: sampleDanmaku,
    })
  }
}

function setVideoTheme(color: string) {
  videoThemeColor.value = color
  videoPlayer?.setThemeColor(color)
}

function sendDanmaku() {
  if (!danmakuText.value.trim()) return
  videoPlayer?.sendDanmaku(danmakuText.value, { color: danmakuColor.value })
  danmakuText.value = ''
}

function applyVideoFilter(filterValue: string) {
  const videoEl = videoContainer.value?.querySelector('video') as HTMLVideoElement
  if (videoEl) {
    videoEl.style.filter = filterValue === 'none' ? '' : filterValue
  }
}

function takeScreenshot() {
  const videoEl = videoContainer.value?.querySelector('video') as HTMLVideoElement
  if (videoEl) {
    const canvas = document.createElement('canvas')
    canvas.width = videoEl.videoWidth
    canvas.height = videoEl.videoHeight
    const ctx = canvas.getContext('2d')
    ctx?.drawImage(videoEl, 0, 0)
    screenshotUrl.value = canvas.toDataURL('image/png')
  }
}

function togglePiP() {
  const videoEl = videoContainer.value?.querySelector('video') as HTMLVideoElement
  if (videoEl) {
    if (document.pictureInPictureElement) {
      document.exitPictureInPicture()
      pipActive.value = false
    } else {
      videoEl.requestPictureInPicture()
      pipActive.value = true
    }
  }
}

function rotateVideo(deg: number) {
  currentRotation.value = (currentRotation.value + deg) % 360
  const videoEl = videoContainer.value?.querySelector('video') as HTMLVideoElement
  if (videoEl) {
    videoEl.style.transform = `rotate(${currentRotation.value}deg)`
  }
}

function setLoopA() {
  loopA.value = videoPlayer?.getCurrentTime() || 0
}

function setLoopB() {
  loopB.value = videoPlayer?.getCurrentTime() || 0
}

function clearLoop() {
  loopA.value = null
  loopB.value = null
}

// 音频播放器
function createAudioPlayer() {
  if (audioPlayer) audioPlayer.destroy()
  
  if (audioContainer.value) {
    audioPlayer = new CustomAudioPlayer({
      container: audioContainer.value,
      src: audioSources.main,
      title: 'Electronic Dreams',
      artist: 'SoundHelix',
      cover: audioSources.cover,
      lyrics: sampleLyrics,
      showLyrics: true,
      layout: audioLayout.value,
      coverStyle: audioCoverStyle.value,
      lyricsHeight: 120,
      themeColor: audioThemeColor.value,
    })
  }
}

function setAudioTheme(color: string) {
  audioThemeColor.value = color
  audioPlayer?.setThemeColor(color)
}

function applyEQPreset(preset: string) {
  console.log('应用均衡器预设:', preset)
}

// 高级功能
function setSleepTimer(seconds: number) {
  sleepTimer.value = seconds
  sleepRemaining.value = seconds
}

function cacheCurrentMedia() {
  alert('媒体已加入缓存队列')
}

// 字幕播放器
function createSubtitlePlayer() {
  if (subtitlePlayer) subtitlePlayer.destroy()
  
  if (subtitleVideoContainer.value) {
    subtitlePlayer = new CustomVideoPlayer({
      container: subtitleVideoContainer.value,
      src: videoSources.main,
      poster: videoSources.poster,
      aspectRatio: '16:9',
      borderRadius: 12,
      themeColor: videoThemeColor.value,
    })
  }
}

// 监听布局变化
watch(compactMode, createVideoPlayer)
watch([audioLayout, audioCoverStyle], createAudioPlayer)

// 睡眠定时器倒计时
let sleepInterval: number | null = null
watch(sleepTimer, (val) => {
  if (sleepInterval) clearInterval(sleepInterval)
  if (val > 0) {
    sleepRemaining.value = val
    sleepInterval = window.setInterval(() => {
      sleepRemaining.value--
      if (sleepRemaining.value <= 0) {
        videoPlayer?.pause()
        audioPlayer?.pause()
        sleepTimer.value = 0
        if (sleepInterval) clearInterval(sleepInterval)
      }
    }, 1000)
  }
})

onMounted(() => {
  createVideoPlayer()
  createAudioPlayer()
  createSubtitlePlayer()
})

onUnmounted(() => {
  videoPlayer?.destroy()
  audioPlayer?.destroy()
  subtitlePlayer?.destroy()
  if (sleepInterval) clearInterval(sleepInterval)
})
</script>

<style>
* { margin: 0; padding: 0; box-sizing: border-box; }

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'PingFang SC', 'Microsoft YaHei', sans-serif;
  background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%);
  min-height: 100vh;
  color: #f8fafc;
}

.app { max-width: 1000px; margin: 0 auto; padding: 40px 20px 80px; }

.header { text-align: center; margin-bottom: 36px; }
.header h1 { font-size: 2.2rem; font-weight: 700; margin-bottom: 8px; }
.subtitle { color: rgba(255,255,255,0.6); font-size: 1rem; }

/* 标签页 */
.tabs { display: flex; justify-content: center; gap: 8px; margin-bottom: 32px; flex-wrap: wrap; }
.tab-btn {
  display: flex; align-items: center; gap: 8px; padding: 12px 20px;
  border: 1px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.05);
  color: rgba(255,255,255,0.7); border-radius: 10px; cursor: pointer;
  font-size: 0.9rem; transition: all 0.2s;
}
.tab-btn:hover { background: rgba(255,255,255,0.1); color: #fff; border-color: rgba(255,255,255,0.2); }
.tab-btn.active { background: #fff; color: #6366f1; border-color: #fff; }
.tab-btn svg { stroke: currentColor; }

.content { animation: fadeIn 0.3s ease; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

/* Section Header */
.section-header { text-align: center; margin-bottom: 24px; }
.section-header h2 { font-size: 1.5rem; margin-bottom: 8px; }
.section-header p { color: rgba(255,255,255,0.6); font-size: 0.9rem; }

/* Controls */
.controls-row { display: flex; justify-content: center; gap: 24px; margin-bottom: 20px; flex-wrap: wrap; }
.control-group { display: flex; align-items: center; gap: 8px; }
.label { color: rgba(255,255,255,0.7); font-size: 0.85rem; }

.btn-sm {
  padding: 6px 14px; border: 1px solid rgba(255,255,255,0.2);
  background: transparent; color: rgba(255,255,255,0.7);
  border-radius: 6px; cursor: pointer; font-size: 0.8rem; transition: all 0.2s;
}
.btn-sm:hover { border-color: rgba(255,255,255,0.4); color: #fff; }
.btn-sm.active { background: #6366f1; border-color: #6366f1; color: #fff; }

.btn-primary {
  padding: 10px 20px; background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: #fff; border: none; border-radius: 8px; cursor: pointer;
  font-size: 0.9rem; transition: all 0.2s;
}
.btn-primary:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(99,102,241,0.4); }

.color-btn {
  width: 24px; height: 24px; border-radius: 50%; border: 2px solid transparent;
  cursor: pointer; transition: all 0.2s;
}
.color-btn:hover { transform: scale(1.15); }
.color-btn.active { border-color: #fff; transform: scale(1.1); }

/* Player */
.player-wrapper { margin-bottom: 24px; }
.player-box { background: #000; border-radius: 12px; overflow: hidden; }
.audio-wrapper { max-width: 600px; margin: 0 auto 24px; }
.audio-box { background: rgba(255,255,255,0.95); border-radius: 12px; }

/* Feature Panel */
.feature-panel {
  background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1);
  border-radius: 12px; padding: 16px; margin-bottom: 24px;
}
.feature-panel h3 { font-size: 1rem; margin-bottom: 12px; color: rgba(255,255,255,0.9); }

.emoji-row { display: flex; gap: 6px; margin-bottom: 12px; flex-wrap: wrap; }
.emoji-btn {
  width: 36px; height: 36px; border: none; background: rgba(255,255,255,0.1);
  border-radius: 8px; cursor: pointer; font-size: 1.2rem; transition: all 0.15s;
}
.emoji-btn:hover { background: rgba(255,255,255,0.2); transform: scale(1.1); }

.input-row { display: flex; gap: 10px; align-items: center; }
.color-input { width: 44px; height: 44px; border: none; border-radius: 8px; cursor: pointer; }
.text-input {
  flex: 1; padding: 12px 16px; background: rgba(255,255,255,0.1);
  border: 1px solid rgba(255,255,255,0.2); border-radius: 8px;
  color: #fff; font-size: 0.9rem; outline: none;
}
.text-input:focus { border-color: #6366f1; }
.text-input::placeholder { color: rgba(255,255,255,0.4); }

/* Features Grid */
.features-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px; }
.feature-card {
  background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1);
  border-radius: 12px; padding: 16px;
}
.feature-card.wide { grid-column: span 2; }
@media (max-width: 700px) { .feature-card.wide { grid-column: span 1; } }
.feature-card h4 { font-size: 0.95rem; margin-bottom: 12px; color: rgba(255,255,255,0.9); }
.hint { font-size: 0.8rem; color: rgba(255,255,255,0.5); margin-top: 8px; }

/* Filter buttons */
.filter-btns, .rotate-btns, .preset-btns, .loop-btns { display: flex; flex-wrap: wrap; gap: 8px; }
.filter-btn {
  padding: 6px 12px; background: rgba(255,255,255,0.1); border: none;
  border-radius: 6px; color: rgba(255,255,255,0.8); cursor: pointer;
  font-size: 0.8rem; transition: all 0.2s;
}
.filter-btn:hover { background: #6366f1; color: #fff; }

/* Screenshot */
.screenshot-preview { width: 100%; max-height: 120px; object-fit: cover; border-radius: 8px; margin-top: 12px; }

/* EQ */
.eq-presets { display: flex; flex-wrap: wrap; gap: 6px; }

/* Audio Enhance */
.enhance-controls label {
  display: flex; align-items: center; gap: 8px; padding: 6px 0;
  font-size: 0.85rem; color: rgba(255,255,255,0.8); cursor: pointer;
}
.enhance-controls input[type="checkbox"] { width: 16px; height: 16px; }

/* Visualizer */
.visualizer-controls { margin-bottom: 12px; }
.visualizer-controls select {
  padding: 8px 12px; background: rgba(255,255,255,0.1);
  border: 1px solid rgba(255,255,255,0.2); border-radius: 6px;
  color: #fff; font-size: 0.85rem;
}
.visualizer-canvas { width: 100%; height: 150px; background: #000; border-radius: 8px; }

/* Stats */
.stats-info, .preload-info, .network-info { font-size: 0.85rem; color: rgba(255,255,255,0.7); }
.stats-info p, .preload-info p, .network-info p { margin-bottom: 4px; }

/* Timer */
.timer-controls { display: flex; flex-wrap: wrap; gap: 8px; }

/* History */
.history-list { max-height: 150px; overflow-y: auto; }
.history-item {
  display: flex; justify-content: space-between; padding: 8px 0;
  border-bottom: 1px solid rgba(255,255,255,0.1); font-size: 0.85rem;
}
.history-item .time { color: rgba(255,255,255,0.5); }

/* Subtitle */
.subtitle-style-controls label {
  display: flex; align-items: center; gap: 8px; margin-bottom: 8px;
  font-size: 0.85rem; color: rgba(255,255,255,0.8);
}
.subtitle-style-controls input[type="range"] { width: 100px; }
.subtitle-style-controls input[type="color"] { width: 32px; height: 24px; border: none; border-radius: 4px; }

.offset-controls { display: flex; align-items: center; gap: 12px; }
.offset-controls span { min-width: 50px; text-align: center; font-size: 0.9rem; }

.search-controls { display: flex; gap: 8px; }

/* Modal */
.modal-overlay {
  position: fixed; top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.7); display: flex; align-items: center;
  justify-content: center; z-index: 1000; backdrop-filter: blur(4px);
}
.modal-content {
  background: #1e293b; border-radius: 16px; padding: 24px;
  max-width: 400px; width: 90%;
}
.modal-content h3 { margin-bottom: 16px; }
.shortcut-list { margin-bottom: 20px; }
.shortcut-item { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.1); font-size: 0.9rem; }
.shortcut-item .key {
  background: rgba(255,255,255,0.1); padding: 2px 8px; border-radius: 4px;
  font-family: monospace; font-size: 0.85rem;
}
</style>
