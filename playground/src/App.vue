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
        <strong>功能特性：</strong>播放控制、进度拖拽、音量调节、倍速播放、歌词同步、CD旋转效果、布局切换
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
const coreDanmakuText = ref('')
const vueDanmakuText = ref('')
const coreDanmakuColor = ref('#ffffff')
const vueDanmakuColor = ref('#ffffff')

// 弹幕设置
const danmakuSpeed = ref(150)
const danmakuFontSize = ref(24)
const danmakuOpacity = ref(1)

// 常用emoji
const emojis = ['😀', '😂', '🤣', '❤️', '🔥', '👍', '👏', '🎉', '💯', '⭐', '🚀', '😎']

// 免费在线媒体资源
const videoSrc = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'
const audioSrc = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3'

// 示例歌词 (LRC格式)
const sampleLyrics = `[ti:SoundHelix Song 1]
[ar:SoundHelix]
[00:00.00]♪ SoundHelix Song 1 ♪
[00:05.00]Electronic Music Demo
[00:10.00]Perfect for testing audio players
[00:15.00]Enjoy the rhythm and beats
[00:20.00]Let the music flow
[00:25.00]Feel the electronic vibes
[00:30.00]Moving to the sound
[00:35.00]Dancing in the code
[00:40.00]Programming with music
[00:45.00]Creative inspiration
[00:50.00]Building something great
[00:55.00]One line at a time
[01:00.00]The beat goes on
[01:05.00]Never stop coding
[01:10.00]Music and technology
[01:15.00]A perfect combination`

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
      themeColor: '#6366f1',  // 主题色
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
      themeColor: '#ec4899',  // 不同主题色
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
      title: 'SoundHelix Song 1',
      artist: 'SoundHelix',
      lyrics: sampleLyrics,
      showLyrics: true,
      layout: audioLayout.value,
      coverStyle: audioCoverStyle.value,
      lyricsHeight: 150,
      themeColor: '#6366f1',  // 主题色
    })
  }
  
  if (vueAudioContainer.value) {
    vueAudioPlayer = new CustomAudioPlayer({
      container: vueAudioContainer.value,
      src: audioSrc,
      title: 'SoundHelix Song 1',
      artist: 'SoundHelix',
      lyrics: sampleLyrics,
      showLyrics: true,
      layout: audioLayout.value,
      coverStyle: audioCoverStyle.value,
      lyricsHeight: 150,
      themeColor: '#ec4899',  // 不同主题色
    })
  }
}

// 监听音频布局/样式变化
watch([audioLayout, audioCoverStyle], () => {
  createAudioPlayers()
})

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
