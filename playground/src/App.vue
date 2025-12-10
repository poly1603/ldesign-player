<template>
  <div class="app">
    <header class="header">
      <h1>LDesign Player</h1>
      <p class="subtitle">音视频播放器 · Core 与 Vue 渲染完全一致</p>
    </header>

    <nav class="tabs">
      <button class="tab-btn" :class="{ active: activeTab === 'video' }" @click="activeTab = 'video'">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="m9 8 6 4-6 4Z"/></svg>
        视频播放器
      </button>
      <button class="tab-btn" :class="{ active: activeTab === 'audio' }" @click="activeTab = 'audio'">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>
        音频播放器
      </button>
    </nav>

    <!-- 视频播放器 -->
    <section v-show="activeTab === 'video'" class="content">
      <!-- 布局切换 -->
      <div class="layout-switch">
        <span class="switch-label">布局模式：</span>
        <button class="switch-btn" :class="{ active: !compactMode }" @click="compactMode = false">标准</button>
        <button class="switch-btn" :class="{ active: compactMode }" @click="compactMode = true">紧凑</button>
      </div>

      <!-- 主题色切换 -->
      <div class="theme-switch">
        <span class="switch-label">主题色：</span>
        <div class="theme-colors">
          <button v-for="color in themeColors" :key="color" 
            class="theme-color-btn" 
            :style="{ background: color }"
            :class="{ active: videoThemeColor === color }"
            @click="setVideoTheme(color)"
          ></button>
        </div>
      </div>

      <div class="player-grid">
        <!-- Core 渲染 -->
        <div class="player-card">
          <div class="card-badge">Core 直接渲染</div>
          <div ref="coreVideoContainer" class="player-container"></div>
          <div class="danmaku-panel">
            <div class="emoji-bar">
              <button v-for="e in emojis" :key="e" class="emoji-btn" @click="addEmoji(e, 'core')">{{ e }}</button>
            </div>
            <div class="danmaku-row">
              <input type="color" v-model="coreDanmakuColor" class="color-picker" title="弹幕颜色" />
              <input v-model="coreDanmakuText" type="text" class="danmaku-input" placeholder="发送弹幕..." @keyup.enter="sendCoreDanmaku" />
              <button class="danmaku-send-btn" @click="sendCoreDanmaku">发送</button>
            </div>
          </div>
        </div>

        <!-- Vue 组件 -->
        <div class="player-card">
          <div class="card-badge card-badge--vue">Vue 组件</div>
          <div ref="vueVideoContainer" class="player-container"></div>
          <div class="danmaku-panel">
            <div class="emoji-bar">
              <button v-for="e in emojis" :key="e" class="emoji-btn" @click="addEmoji(e, 'vue')">{{ e }}</button>
            </div>
            <div class="danmaku-row">
              <input type="color" v-model="vueDanmakuColor" class="color-picker" title="弹幕颜色" />
              <input v-model="vueDanmakuText" type="text" class="danmaku-input" placeholder="发送弹幕..." @keyup.enter="sendVueDanmaku" />
              <button class="danmaku-send-btn" @click="sendVueDanmaku">发送</button>
            </div>
          </div>
        </div>
      </div>

      <div class="info-box">
        <strong>弹幕功能：</strong>预加载弹幕、实时发送、自定义颜色、emoji表情、速度/字体/透明度可调、多轨道显示
      </div>
    </section>

    <!-- 音频播放器 -->
    <section v-show="activeTab === 'audio'" class="content">
      <!-- 布局切换 -->
      <div class="layout-switch">
        <span class="switch-label">布局模式：</span>
        <button class="switch-btn" :class="{ active: audioLayout === 'compact' }" @click="audioLayout = 'compact'">紧凑</button>
        <button class="switch-btn" :class="{ active: audioLayout === 'vertical' }" @click="audioLayout = 'vertical'">垂直</button>
        <span class="switch-label" style="margin-left: 20px;">封面样式：</span>
        <button class="switch-btn" :class="{ active: audioCoverStyle === 'square' }" @click="audioCoverStyle = 'square'">方形</button>
        <button class="switch-btn" :class="{ active: audioCoverStyle === 'round' }" @click="audioCoverStyle = 'round'">CD</button>
      </div>

      <!-- 主题色切换 -->
      <div class="theme-switch">
        <span class="switch-label">主题色：</span>
        <div class="theme-colors">
          <button v-for="color in themeColors" :key="color" 
            class="theme-color-btn" 
            :style="{ background: color }"
            :class="{ active: audioThemeColor === color }"
            @click="setAudioTheme(color)"
          ></button>
        </div>
      </div>

      <div class="player-grid">
        <!-- Core 渲染 -->
        <div class="player-card">
          <div class="card-badge">Core 直接渲染</div>
          <div ref="coreAudioContainer" class="player-container"></div>
        </div>

        <!-- Vue 组件 -->
        <div class="player-card">
          <div class="card-badge card-badge--vue">Vue 组件</div>
          <div ref="vueAudioContainer" class="player-container"></div>
        </div>
      </div>

      <div class="info-box">
        <strong>功能特性：</strong>播放控制、进度拖拽、音量调节、倍速播放、歌词同步、CD旋转效果、布局切换、主题色切换
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { CustomVideoPlayer, CustomAudioPlayer } from '@ldesign/player-core'
import { AudioPlayer } from '@ldesign/player-vue'

const activeTab = ref<'video' | 'audio'>('video')
const compactMode = ref(false)
const audioLayout = ref<'compact' | 'vertical'>('compact')
const audioCoverStyle = ref<'square' | 'round'>('round')
const audioThemeColor = ref('#6366f1')
const videoThemeColor = ref('#6366f1')
const coreDanmakuText = ref('')
const vueDanmakuText = ref('')
const coreDanmakuColor = ref('#ffffff')
const vueDanmakuColor = ref('#ffffff')

// 可选主题色
const themeColors = ['#6366f1', '#ec4899', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16']

// 弹幕设置
const danmakuSpeed = ref(150)
const danmakuFontSize = ref(24)
const danmakuOpacity = ref(1)

// 常用emoji
const emojis = ['😀', '😂', '🤣', '❤️', '🔥', '👍', '👏', '🎉', '💯', '⭐', '🚀', '😎']

// 免费在线媒体资源
// 带字幕的示例视频 (Sintel - 开源电影)
const videoSrc = 'https://media.w3.org/2010/05/sintel/trailer.mp4'
// 中文歌曲示例
const audioSrc = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3'

// 中文示例歌词 (LRC格式) - 模拟《小幸运》
const sampleLyrics = `[ti:小幸运]
[ar:田馥甄]
[al:我的少女时代 电影原声带]
[00:00.00]♪ 小幸运 - 田馥甄 ♪
[00:04.00]
[00:08.00]我听见雨滴落在青青草地
[00:14.00]我听见远方下课钟声响起
[00:20.00]可是我没有听见你的声音
[00:26.00]认真呼唤我姓名
[00:32.00]爱上你的时候还不懂感情
[00:38.00]离别了才觉得刻骨铭心
[00:44.00]为什么没有发现遇见了你
[00:50.00]是生命最好的事情
[00:56.00]也许当时忙着微笑和哭泣
[01:02.00]忙着追逐天空中的流星
[01:08.00]人理所当然的忘记
[01:14.00]是谁风里雨里一直默默守护在原地
[01:20.00]原来你是我最想留住的幸运
[01:26.00]原来我们和爱情曾经靠得那么近
[01:32.00]那为我对抗世界的决定
[01:38.00]那陪我淋的雨 一幕幕都是你
[01:44.00]一尘不染的真心`

// 模拟弹幕数据
const sampleDanmakuData = [
  { text: '前方高能预警！🔥', time: 2, color: '#ff6b6b' },
  { text: '这画面太美了 ❤️', time: 5, color: '#ff69b4' },
  { text: '开始啦！', time: 3, color: '#ffffff' },
  { text: '兔子好可爱 🐰', time: 8, color: '#ffd93d' },
  { text: '经典开场', time: 4, color: '#6bcb77' },
  { text: '童年回忆', time: 10, color: '#4d96ff' },
  { text: '画质真不错', time: 12, color: '#ffffff' },
  { text: '大家好！👋', time: 6, color: '#ff6b6b' },
  { text: '第一次看', time: 15, color: '#a66cff' },
  { text: '这个动画太棒了 🎉', time: 18, color: '#ffd93d' },
  { text: '笑死我了 😂', time: 20, color: '#ff9f43' },
  { text: '弹幕护体！', time: 22, color: '#00d2d3' },
  { text: '经典永不过时', time: 25, color: '#ffffff' },
  { text: '前排占座', time: 1, color: '#6bcb77' },
  { text: '233333', time: 28, color: '#ff6b6b' },
  { text: '看了无数遍了', time: 30, color: '#4d96ff' },
  { text: '太可爱了！😍', time: 35, color: '#ff69b4' },
  { text: '哈哈哈哈', time: 38, color: '#ffffff' },
  { text: '这是什么神仙动画', time: 40, color: '#a66cff' },
  { text: '来了来了 🚀', time: 45, color: '#00d2d3' },
]

// 播放器容器
const coreVideoContainer = ref<HTMLElement>()
const vueVideoContainer = ref<HTMLElement>()
const coreAudioContainer = ref<HTMLElement>()
const vueAudioContainer = ref<HTMLElement>()

let coreVideoPlayer: CustomVideoPlayer | null = null
let vueVideoPlayer: CustomVideoPlayer | null = null
let coreAudioPlayer: CustomAudioPlayer | null = null
let vueAudioPlayer: CustomAudioPlayer | null = null

function createVideoPlayers() {
  // 销毁旧实例
  coreVideoPlayer?.destroy()
  vueVideoPlayer?.destroy()
  
  // 创建 Core 视频播放器（带预设弹幕和自动封面）
  if (coreVideoContainer.value) {
    coreVideoPlayer = new CustomVideoPlayer({
      container: coreVideoContainer.value,
      src: videoSrc,
      aspectRatio: '16:9',
      borderRadius: 12,
      compactMode: compactMode.value,
      poster: 2, // 从第2秒截取封面
      themeColor: videoThemeColor.value,
      danmaku: true,
      danmakuData: sampleDanmakuData,
    })
  }
  
  // 创建 Vue 容器中的视频播放器
  if (vueVideoContainer.value) {
    vueVideoPlayer = new CustomVideoPlayer({
      container: vueVideoContainer.value,
      src: videoSrc,
      aspectRatio: '16:9',
      borderRadius: 12,
      compactMode: compactMode.value,
      poster: 2, // 从第2秒截取封面
      themeColor: videoThemeColor.value,
      danmaku: true,
      danmakuData: sampleDanmakuData,
    })
  }
}

// 监听布局模式变化
watch(compactMode, () => {
  createVideoPlayers()
})

// 创建音频播放器
function createAudioPlayers() {
  coreAudioPlayer?.destroy()
  vueAudioPlayer?.destroy()
  
  if (coreAudioContainer.value) {
    coreAudioPlayer = new CustomAudioPlayer({
      container: coreAudioContainer.value,
      src: audioSrc,
      title: '小幸运',
      artist: '田馥甄',
      lyrics: sampleLyrics,
      showLyrics: true,
      layout: audioLayout.value,
      coverStyle: audioCoverStyle.value,
      lyricsHeight: 150,
      themeColor: audioThemeColor.value,
    })
  }
  
  if (vueAudioContainer.value) {
    vueAudioPlayer = new CustomAudioPlayer({
      container: vueAudioContainer.value,
      src: audioSrc,
      title: '小幸运',
      artist: '田馥甄',
      lyrics: sampleLyrics,
      showLyrics: true,
      layout: audioLayout.value,
      coverStyle: audioCoverStyle.value,
      lyricsHeight: 150,
      themeColor: audioThemeColor.value,
    })
  }
}

// 监听音频布局/样式变化
watch([audioLayout, audioCoverStyle], () => {
  createAudioPlayers()
})

// 设置音频播放器主题色
function setAudioTheme(color: string) {
  audioThemeColor.value = color
  coreAudioPlayer?.setThemeColor(color)
  vueAudioPlayer?.setThemeColor(color)
}

// 设置视频播放器主题色
function setVideoTheme(color: string) {
  videoThemeColor.value = color
  coreVideoPlayer?.setThemeColor(color)
  vueVideoPlayer?.setThemeColor(color)
}

// 发送弹幕
function sendCoreDanmaku() {
  if (!coreDanmakuText.value.trim()) return
  coreVideoPlayer?.sendDanmaku(coreDanmakuText.value, { 
    color: coreDanmakuColor.value,
    fontSize: danmakuFontSize.value
  })
  coreDanmakuText.value = ''
}

function sendVueDanmaku() {
  if (!vueDanmakuText.value.trim()) return
  vueVideoPlayer?.sendDanmaku(vueDanmakuText.value, {
    color: vueDanmakuColor.value,
    fontSize: danmakuFontSize.value
  })
  vueDanmakuText.value = ''
}

// 添加emoji到弹幕
function addEmoji(emoji: string, target: 'core' | 'vue') {
  if (target === 'core') {
    coreDanmakuText.value += emoji
  } else {
    vueDanmakuText.value += emoji
  }
}

// 更新弹幕设置
function updateDanmakuSettings() {
  // 这里可以调用 player 的 API 更新设置
  // 由于需要重新创建，这里简化处理
}

onMounted(() => {
  createVideoPlayers()
  createAudioPlayers()
})

onUnmounted(() => {
  coreVideoPlayer?.destroy()
  vueVideoPlayer?.destroy()
  coreAudioPlayer?.destroy()
  vueAudioPlayer?.destroy()
})
</script>

<style>
* { margin: 0; padding: 0; box-sizing: border-box; }

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: #0f172a;
  background-image: 
    radial-gradient(ellipse at 20% 0%, rgba(99, 102, 241, 0.15) 0%, transparent 50%),
    radial-gradient(ellipse at 80% 100%, rgba(236, 72, 153, 0.1) 0%, transparent 50%);
  min-height: 100vh;
  color: #f8fafc;
}

.app { max-width: 1200px; margin: 0 auto; padding: 40px 20px 60px; }

.header { text-align: center; margin-bottom: 32px; }
.header h1 { font-size: 2rem; font-weight: 700; margin-bottom: 8px; }
.subtitle { color: rgba(255,255,255,0.6); }

.tabs {
  display: flex; justify-content: center; gap: 8px; margin-bottom: 32px;
}
.tab-btn {
  display: flex; align-items: center; gap: 8px; padding: 12px 24px;
  border: none; background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.7);
  border-radius: 10px; cursor: pointer; font-size: 0.95rem; transition: all 0.2s;
}
.tab-btn:hover { background: rgba(255,255,255,0.12); color: #fff; }
.tab-btn.active { background: #fff; color: #6366f1; }

.content { animation: fadeIn 0.3s ease; }
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

.player-grid {
  display: grid; grid-template-columns: repeat(2, 1fr); gap: 24px;
}
@media (max-width: 900px) { .player-grid { grid-template-columns: 1fr; } }

.player-card {
  background: rgba(255,255,255,0.95); border-radius: 16px; padding: 16px;
  position: relative; color: #1e293b;
}

.card-badge {
  position: absolute; top: -10px; left: 16px; z-index: 10;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: #fff; font-size: 0.75rem; font-weight: 600;
  padding: 4px 12px; border-radius: 20px;
}
.card-badge--vue { background: linear-gradient(135deg, #10b981, #059669); }

.player-container { margin-top: 8px; }

.info-box {
  background: rgba(255,255,255,0.9); border-radius: 12px;
  padding: 16px 20px; margin-top: 24px; font-size: 0.9rem; color: #475569;
}
.info-box code {
  background: rgba(99,102,241,0.1); color: #6366f1;
  padding: 2px 6px; border-radius: 4px; font-size: 0.85rem;
}

.layout-switch {
  display: flex; align-items: center; justify-content: center;
  gap: 8px; margin-bottom: 20px;
}
.switch-label { color: rgba(255,255,255,0.7); font-size: 0.9rem; }
.switch-btn {
  padding: 6px 16px; border: 1px solid rgba(255,255,255,0.2);
  background: transparent; color: rgba(255,255,255,0.7);
  border-radius: 6px; cursor: pointer; font-size: 0.85rem; transition: all 0.2s;
}
.switch-btn:hover { border-color: rgba(255,255,255,0.4); color: #fff; }
.switch-btn.active { background: #6366f1; border-color: #6366f1; color: #fff; }

.theme-switch {
  display: flex; align-items: center; justify-content: center;
  gap: 12px; margin-bottom: 20px;
}
.theme-colors { display: flex; gap: 8px; }
.theme-color-btn {
  width: 28px; height: 28px; border-radius: 50%; border: 3px solid transparent;
  cursor: pointer; transition: all 0.2s; box-shadow: 0 2px 8px rgba(0,0,0,0.2);
}
.theme-color-btn:hover { transform: scale(1.15); }
.theme-color-btn.active { border-color: #fff; transform: scale(1.1); }

.danmaku-panel {
  display: flex; gap: 8px; margin-top: 12px;
  background: #f1f5f9; border-radius: 8px; padding: 10px 12px;
}
.danmaku-input {
  flex: 1; padding: 10px 14px; border: 1px solid #e2e8f0;
  border-radius: 8px; font-size: 0.9rem; outline: none;
}
.danmaku-input:focus { border-color: #6366f1; }
.danmaku-send-btn {
  padding: 10px 20px; background: #6366f1; color: #fff;
  border: none; border-radius: 8px; cursor: pointer; font-size: 0.9rem;
  transition: background 0.2s;
}
.danmaku-send-btn:hover { background: #4f46e5; }

.danmaku-row { display: flex; gap: 8px; align-items: center; }

.emoji-bar {
  display: flex; gap: 4px; margin-bottom: 8px; flex-wrap: wrap;
}
.emoji-btn {
  width: 32px; height: 32px; border: none; background: #fff;
  border-radius: 6px; cursor: pointer; font-size: 1.1rem;
  transition: all 0.15s; display: flex; align-items: center; justify-content: center;
}
.emoji-btn:hover { background: #e2e8f0; transform: scale(1.1); }

.color-picker {
  width: 36px; height: 36px; padding: 2px; border: 2px solid #e2e8f0;
  border-radius: 8px; cursor: pointer; background: #fff;
}
.color-picker::-webkit-color-swatch { border-radius: 4px; border: none; }
.color-picker::-webkit-color-swatch-wrapper { padding: 0; }
</style>
