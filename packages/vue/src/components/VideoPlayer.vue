<template>
  <div class="ld-video-player" ref="containerRef">
    <video
      ref="videoRef"
      class="ld-video-player__video"
      :src="src"
      :poster="poster"
      :autoplay="autoplay"
      :loop="loop"
      :muted="muted"
      @play="handlePlay"
      @pause="handlePause"
      @ended="handleEnded"
      @timeupdate="handleTimeUpdate"
      @loadedmetadata="handleLoadedMetadata"
      @error="handleError"
    ></video>
    
    <!-- 控制栏 -->
    <div class="ld-video-player__controls" v-if="controls">
      <!-- 播放按钮 -->
      <button @click="handlePlayPause" class="ld-video-player__btn">
        <slot name="play-icon" v-if="!isPlaying">▶️</slot>
        <slot name="pause-icon" v-else>⏸️</slot>
      </button>
      
      <!-- 时间显示 -->
      <span class="ld-video-player__time">
        {{ formatTime(currentTime) }} / {{ formatTime(duration) }}
      </span>
      
      <!-- 进度条 -->
      <div class="ld-video-player__progress" @click="handleSeek">
        <div class="ld-video-player__progress-bar" :style="{ width: progressPercent + '%' }"></div>
      </div>
      
      <!-- 音量控制 -->
      <div class="ld-video-player__volume">
        <button @click="toggleMute" class="ld-video-player__btn">
          {{ muted ? '🔇' : '🔊' }}
        </button>
        <div class="ld-video-player__volume-slider" @click="handleVolumeChange">
          <div class="ld-video-player__volume-bar" :style="{ width: (volume * 100) + '%' }"></div>
        </div>
      </div>
      
      <!-- 全屏按钮 -->
      <button @click="toggleFullscreen" class="ld-video-player__btn">
        <slot name="fullscreen-icon">⛶</slot>
      </button>
      
      <!-- 画中画按钮 -->
      <button @click="togglePiP" class="ld-video-player__btn" v-if="supportsPiP">
        <slot name="pip-icon">📱</slot>
      </button>
    </div>
    
    <!-- 字幕显示 -->
    <div class="ld-video-player__subtitles" v-if="currentSubtitle">
      {{ currentSubtitle }}
    </div>
    
    <!-- 加载指示器 -->
    <div class="ld-video-player__loading" v-if="loading">
      <slot name="loading">
        <div class="ld-video-player__spinner"></div>
      </slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useVideoPlayer } from '../composables/useVideoPlayer'
import type { VideoPlayerOptions } from '@ldesign/player-core'

interface Props {
  src: string
  poster?: string
  width?: number | string
  height?: number | string
  autoplay?: boolean
  loop?: boolean
  muted?: boolean
  controls?: boolean
  volume?: number
  subtitles?: string
  options?: VideoPlayerOptions
}

const props = withDefaults(defineProps<Props>(), {
  autoplay: false,
  loop: false,
  muted: false,
  controls: true,
  volume: 1,
})

const emit = defineEmits<{
  play: []
  pause: []
  ended: []
  timeupdate: [time: number]
  volumechange: [volume: number]
  fullscreenchange: [fullscreen: boolean]
  error: [error: Error]
}>()

const containerRef = ref<HTMLElement>()
const videoRef = ref<HTMLVideoElement>()

const {
  player,
  isPlaying,
  currentTime,
  duration,
  volume,
  muted,
  loading,
  currentSubtitle,
  supportsPiP,
  play,
  pause,
  seek,
  setVolume,
  toggleMute,
  toggleFullscreen,
  togglePiP,
  loadVideo,
  loadSubtitles
} = useVideoPlayer({
  ...props.options,
  container: containerRef.value,
  video: videoRef.value
})

// 计算进度百分比
const progressPercent = computed(() => {
  return duration.value > 0 ? (currentTime.value / duration.value) * 100 : 0
})

// 格式化时间
function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)
  
  if (hours > 0) {
    return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

// 播放/暂停
function handlePlayPause() {
  if (isPlaying.value) {
    pause()
  } else {
    play()
  }
}

// 进度跳转
function handleSeek(e: MouseEvent) {
  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
  const percent = (e.clientX - rect.left) / rect.width
  seek(duration.value * percent)
}

// 音量调节
function handleVolumeChange(e: MouseEvent) {
  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
  const percent = (e.clientX - rect.left) / rect.width
  setVolume(percent)
  emit('volumechange', percent)
}

// 视频事件处理
function handlePlay() {
  isPlaying.value = true
  emit('play')
}

function handlePause() {
  isPlaying.value = false
  emit('pause')
}

function handleEnded() {
  emit('ended')
}

function handleTimeUpdate() {
  if (videoRef.value) {
    currentTime.value = videoRef.value.currentTime
    emit('timeupdate', currentTime.value)
  }
}

function handleLoadedMetadata() {
  if (videoRef.value) {
    duration.value = videoRef.value.duration
  }
}

function handleError(e: Event) {
  emit('error', new Error('Video playback error'))
}

// 监听字幕变化
watch(() => props.subtitles, (subtitles) => {
  if (subtitles) {
    loadSubtitles(subtitles)
  }
})

// 监听src变化
watch(() => props.src, (newSrc) => {
  if (newSrc && videoRef.value) {
    loadVideo(newSrc)
  }
})

onMounted(() => {
  // 初始化播放器
  if (videoRef.value) {
    videoRef.value.volume = props.volume
  }
})

onUnmounted(() => {
  // 清理资源
  if (player.value) {
    player.value.destroy()
  }
})
</script>

<style scoped>
.ld-video-player {
  position: relative;
  background: black;
  border-radius: 8px;
  overflow: hidden;
}

.ld-video-player__video {
  width: 100%;
  height: 100%;
  display: block;
}

.ld-video-player__controls {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.7), transparent);
  padding: 15px;
  display: flex;
  align-items: center;
  gap: 15px;
  transition: opacity 0.3s;
}

.ld-video-player:not(:hover) .ld-video-player__controls {
  opacity: 0;
}

.ld-video-player__btn {
  background: transparent;
  border: none;
  color: white;
  cursor: pointer;
  font-size: 18px;
  padding: 5px;
  transition: transform 0.2s;
}

.ld-video-player__btn:hover {
  transform: scale(1.1);
}

.ld-video-player__time {
  color: white;
  font-size: 14px;
  white-space: nowrap;
}

.ld-video-player__progress {
  flex: 1;
  height: 4px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 2px;
  cursor: pointer;
  position: relative;
}

.ld-video-player__progress-bar {
  height: 100%;
  background: #ff0000;
  border-radius: 2px;
  position: relative;
}

.ld-video-player__progress-bar::after {
  content: '';
  position: absolute;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 12px;
  height: 12px;
  background: white;
  border-radius: 50%;
}

.ld-video-player__volume {
  display: flex;
  align-items: center;
  gap: 8px;
}

.ld-video-player__volume-slider {
  width: 80px;
  height: 4px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 2px;
  cursor: pointer;
}

.ld-video-player__volume-bar {
  height: 100%;
  background: white;
  border-radius: 2px;
}

.ld-video-player__subtitles {
  position: absolute;
  bottom: 80px;
  left: 50%;
  transform: translateX(-50%);
  color: white;
  font-size: 18px;
  text-align: center;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
  padding: 10px 20px;
  max-width: 80%;
}

.ld-video-player__loading {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.ld-video-player__spinner {
  width: 50px;
  height: 50px;
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>



