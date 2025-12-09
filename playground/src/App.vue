<template>
  <div class="app">
    <h1>LDesign Player Playground</h1>

    <div class="tabs">
      <button class="tab-btn" :class="{ active: activeTab === 'audio' }" @click="activeTab = 'audio'">
        音频播放器
      </button>
      <button class="tab-btn" :class="{ active: activeTab === 'video' }" @click="activeTab = 'video'">
        视频播放器
      </button>
    </div>

    <div v-show="activeTab === 'audio'">
      <div class="demo-grid">
        <div class="section">
          <h2>使用原生 Core</h2>
          <div class="demo-card">
            <h3>AudioPlayer (Core)</h3>
            <div ref="coreAudioContainer"></div>
            <div class="info">
              <p>状态: {{ coreAudioState.isPlaying ? '播放中' : '暂停' }}</p>
              <p>时间: {{ formatTime(coreAudioState.currentTime) }} / {{ formatTime(coreAudioState.duration) }}</p>
              <p>音量: {{ Math.round(coreAudioState.volume * 100) }}%</p>
            </div>
            <div class="controls">
              <button class="btn btn-primary" @click="coreAudioPlay">播放</button>
              <button class="btn btn-secondary" @click="coreAudioPause">暂停</button>
              <button class="btn btn-secondary" @click="coreAudioStop">停止</button>
            </div>
          </div>
        </div>

        <div class="section">
          <h2>使用 Vue 组件</h2>
          <div class="demo-card">
            <h3>AudioPlayer (Vue Component)</h3>
            <AudioPlayer
              :src="audioSrc"
              :show-waveform="true"
              :show-volume="true"
              @play="onAudioPlay"
              @pause="onAudioPause"
              @timeupdate="onAudioTimeUpdate"
            />
          </div>
        </div>

        <div class="section">
          <h2>使用 Vue Hook</h2>
          <div class="demo-card">
            <h3>useAudioPlayer Hook</h3>
            <div class="info">
              <p>状态: {{ hookAudio.isPlaying.value ? '播放中' : '暂停' }}</p>
              <p>时间: {{ formatTime(hookAudio.currentTime.value) }} / {{ formatTime(hookAudio.duration.value) }}</p>
            </div>
            <div class="controls">
              <button class="btn btn-primary" @click="hookAudio.play">播放</button>
              <button class="btn btn-secondary" @click="hookAudio.pause">暂停</button>
              <button class="btn btn-secondary" @click="hookAudio.stop">停止</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-show="activeTab === 'video'">
      <div class="demo-grid">
        <div class="section">
          <h2>使用原生 Core</h2>
          <div class="demo-card">
            <h3>VideoPlayer (Core)</h3>
            <div ref="coreVideoContainer" class="video-container"></div>
            <div class="info">
              <p>状态: {{ coreVideoState.isPlaying ? '播放中' : '暂停' }}</p>
              <p>时间: {{ formatTime(coreVideoState.currentTime) }} / {{ formatTime(coreVideoState.duration) }}</p>
            </div>
            <div class="controls">
              <button class="btn btn-primary" @click="coreVideoPlay">播放</button>
              <button class="btn btn-secondary" @click="coreVideoPause">暂停</button>
              <button class="btn btn-secondary" @click="coreVideoFullscreen">全屏</button>
            </div>
          </div>
        </div>

        <div class="section">
          <h2>使用 Vue 组件</h2>
          <div class="demo-card">
            <h3>VideoPlayer (Vue Component)</h3>
            <VideoPlayer
              :src="videoSrc"
              :controls="true"
              @play="onVideoPlay"
              @pause="onVideoPause"
            />
          </div>
        </div>

        <div class="section">
          <h2>使用 Vue Hook</h2>
          <div class="demo-card">
            <h3>useVideoPlayer Hook</h3>
            <div ref="hookVideoContainer" class="video-container"></div>
            <div class="info">
              <p>状态: {{ hookVideo.isPlaying.value ? '播放中' : '暂停' }}</p>
              <p>时间: {{ formatTime(hookVideo.currentTime.value) }} / {{ formatTime(hookVideo.duration.value) }}</p>
            </div>
            <div class="controls">
              <button class="btn btn-primary" @click="hookVideo.play">播放</button>
              <button class="btn btn-secondary" @click="hookVideo.pause">暂停</button>
              <button class="btn btn-secondary" @click="hookVideo.toggleFullscreen">全屏</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { AudioPlayer as CoreAudioPlayer, VideoPlayer as CoreVideoPlayer } from '@ldesign/player-core'
import { AudioPlayer, VideoPlayer, useAudioPlayer, useVideoPlayer } from '@ldesign/player-vue'

const activeTab = ref<'audio' | 'video'>('audio')

// 示例媒体源
const audioSrc = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3'
const videoSrc = 'https://www.w3schools.com/html/mov_bbb.mp4'

// Core Audio Player
const coreAudioContainer = ref<HTMLElement>()
let coreAudioPlayer: CoreAudioPlayer | null = null
const coreAudioState = reactive({
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  volume: 0.8,
})

// Core Video Player
const coreVideoContainer = ref<HTMLElement>()
let coreVideoPlayer: CoreVideoPlayer | null = null
const coreVideoState = reactive({
  isPlaying: false,
  currentTime: 0,
  duration: 0,
})

// Hook Audio Player
const hookAudio = useAudioPlayer({
  src: audioSrc,
  autoInit: false,
})

// Hook Video Player
const hookVideoContainer = ref<HTMLElement>()
const hookVideo = useVideoPlayer({
  src: videoSrc,
  autoInit: false,
})

// 格式化时间
function formatTime(seconds: number): string {
  if (!seconds || isNaN(seconds)) return '0:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

// Core Audio 控制
function coreAudioPlay() {
  coreAudioPlayer?.play()
}

function coreAudioPause() {
  coreAudioPlayer?.pause()
}

function coreAudioStop() {
  coreAudioPlayer?.stop()
}

// Core Video 控制
function coreVideoPlay() {
  coreVideoPlayer?.play()
}

function coreVideoPause() {
  coreVideoPlayer?.pause()
}

function coreVideoFullscreen() {
  coreVideoPlayer?.requestFullscreen()
}

// 事件处理
function onAudioPlay() {
  console.log('Audio playing')
}

function onAudioPause() {
  console.log('Audio paused')
}

function onAudioTimeUpdate(time: number) {
  console.log('Audio time:', time)
}

function onVideoPlay() {
  console.log('Video playing')
}

function onVideoPause() {
  console.log('Video paused')
}

onMounted(() => {
  // 初始化 Core Audio Player
  coreAudioPlayer = new CoreAudioPlayer({
    src: audioSrc,
    volume: 0.8,
  })

  coreAudioPlayer.on('play', () => {
    coreAudioState.isPlaying = true
  })

  coreAudioPlayer.on('pause', () => {
    coreAudioState.isPlaying = false
  })

  coreAudioPlayer.on('timeupdate', ({ currentTime, duration }) => {
    coreAudioState.currentTime = currentTime
    coreAudioState.duration = duration
  })

  coreAudioPlayer.on('volumechange', ({ volume }) => {
    coreAudioState.volume = volume
  })

  // 初始化 Core Video Player
  if (coreVideoContainer.value) {
    coreVideoPlayer = new CoreVideoPlayer(coreVideoContainer.value, {
      src: videoSrc,
      controls: false,
    })

    coreVideoPlayer.on('play', () => {
      coreVideoState.isPlaying = true
    })

    coreVideoPlayer.on('pause', () => {
      coreVideoState.isPlaying = false
    })

    coreVideoPlayer.on('timeupdate', ({ currentTime, duration }) => {
      coreVideoState.currentTime = currentTime
      coreVideoState.duration = duration
    })
  }
})

onUnmounted(() => {
  coreAudioPlayer?.destroy()
  coreVideoPlayer?.destroy()
})
</script>

<style scoped>
.app {
  min-height: 100vh;
}
</style>
