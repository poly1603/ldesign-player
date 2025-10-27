<template>
  <div class="ld-audio-player">
    <!-- 波形显示 -->
    <div class="ld-audio-player__waveform" ref="waveformRef" v-if="showWaveform"></div>
    
    <!-- 播放控制 -->
    <div class="ld-audio-player__controls">
      <button @click="handlePrev" class="ld-audio-player__btn">
        <slot name="prev-icon">⏮️</slot>
      </button>
      <button @click="handlePlayPause" class="ld-audio-player__btn ld-audio-player__btn--main">
        <slot name="play-icon" v-if="!isPlaying">▶️</slot>
        <slot name="pause-icon" v-else>⏸️</slot>
      </button>
      <button @click="handleNext" class="ld-audio-player__btn">
        <slot name="next-icon">⏭️</slot>
      </button>
    </div>
    
    <!-- 进度条 -->
    <div class="ld-audio-player__progress" @click="handleSeek">
      <div class="ld-audio-player__progress-bar" :style="{ width: progressPercent + '%' }"></div>
    </div>
    
    <!-- 时间显示 -->
    <div class="ld-audio-player__time">
      <span>{{ formatTime(currentTime) }}</span>
      <span>{{ formatTime(duration) }}</span>
    </div>
    
    <!-- 音量控制 -->
    <div class="ld-audio-player__volume" v-if="showVolume">
      <span class="ld-audio-player__volume-icon">🔊</span>
      <div class="ld-audio-player__volume-slider" @click="handleVolumeChange">
        <div class="ld-audio-player__volume-bar" :style="{ width: (volume * 100) + '%' }"></div>
      </div>
    </div>
    
    <!-- 歌词显示 -->
    <div class="ld-audio-player__lyrics" v-if="showLyrics && currentLyric">
      {{ currentLyric }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useAudioPlayer } from '../composables/useAudioPlayer'
import type { AudioPlayerOptions } from '@ldesign/player-core'

interface Props {
  src?: string
  autoplay?: boolean
  loop?: boolean
  volume?: number
  showWaveform?: boolean
  showVolume?: boolean
  showLyrics?: boolean
  lyrics?: string
  playlist?: Array<{
    id: string
    src: string
    title?: string
    artist?: string
    cover?: string
  }>
  options?: AudioPlayerOptions
}

const props = withDefaults(defineProps<Props>(), {
  autoplay: false,
  loop: false,
  volume: 0.8,
  showWaveform: true,
  showVolume: true,
  showLyrics: false,
})

const emit = defineEmits<{
  play: []
  pause: []
  ended: []
  timeupdate: [time: number]
  volumechange: [volume: number]
  next: []
  prev: []
  error: [error: Error]
}>()

const waveformRef = ref<HTMLElement>()

const {
  player,
  isPlaying,
  currentTime,
  duration,
  volume,
  currentLyric,
  play,
  pause,
  seek,
  setVolume,
  next,
  prev,
  loadAudio
} = useAudioPlayer({
  ...props.options,
  src: props.src,
  autoplay: props.autoplay,
  volume: props.volume,
  loop: props.loop,
  container: waveformRef.value
})

// 计算进度百分比
const progressPercent = computed(() => {
  return duration.value > 0 ? (currentTime.value / duration.value) * 100 : 0
})

// 格式化时间
function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

// 播放/暂停
function handlePlayPause() {
  if (isPlaying.value) {
    pause()
    emit('pause')
  } else {
    play()
    emit('play')
  }
}

// 上一首
function handlePrev() {
  prev()
  emit('prev')
}

// 下一首
function handleNext() {
  next()
  emit('next')
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

// 监听 src 变化
watch(() => props.src, (newSrc) => {
  if (newSrc) {
    loadAudio(newSrc)
  }
})

// 监听时间更新
watch(currentTime, (time) => {
  emit('timeupdate', time)
})

// 监听播放结束
watch(isPlaying, (playing, oldPlaying) => {
  if (oldPlaying && !playing && currentTime.value >= duration.value) {
    emit('ended')
  }
})

onMounted(() => {
  // 初始化波形
  if (props.showWaveform && waveformRef.value && player.value) {
    // 初始化波形渲染器
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
.ld-audio-player {
  padding: 20px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.ld-audio-player__waveform {
  height: 120px;
  background: #f5f5f5;
  border-radius: 8px;
  margin-bottom: 20px;
}

.ld-audio-player__controls {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 15px;
  margin-bottom: 20px;
}

.ld-audio-player__btn {
  padding: 10px;
  background: transparent;
  border: none;
  cursor: pointer;
  font-size: 20px;
  transition: transform 0.2s;
}

.ld-audio-player__btn:hover {
  transform: scale(1.1);
}

.ld-audio-player__btn--main {
  padding: 15px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 50%;
  color: white;
}

.ld-audio-player__progress {
  height: 6px;
  background: #e0e0e0;
  border-radius: 3px;
  cursor: pointer;
  margin-bottom: 10px;
  position: relative;
}

.ld-audio-player__progress-bar {
  height: 100%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 3px;
  transition: width 0.1s;
}

.ld-audio-player__time {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
  color: #666;
  margin-bottom: 15px;
}

.ld-audio-player__volume {
  display: flex;
  align-items: center;
  gap: 10px;
}

.ld-audio-player__volume-slider {
  flex: 1;
  height: 6px;
  background: #e0e0e0;
  border-radius: 3px;
  cursor: pointer;
  position: relative;
}

.ld-audio-player__volume-bar {
  height: 100%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 3px;
}

.ld-audio-player__lyrics {
  text-align: center;
  font-size: 16px;
  color: #333;
  margin-top: 20px;
  padding: 15px;
  background: #f8f8f8;
  border-radius: 8px;
}
</style>



