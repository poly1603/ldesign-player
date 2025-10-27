/**
 * Vue Composable - useVideoPlayer
 */

import { ref, onMounted, onUnmounted } from 'vue'
import { VideoPlayer } from '@ldesign/player-core'
import type { VideoPlayerOptions as VideoPlayerConfig } from '@ldesign/player-core'

export interface UseVideoPlayerOptions extends Partial<VideoPlayerConfig> {
  autoInit?: boolean
  container?: HTMLElement | null
  video?: HTMLVideoElement | null
}

export function useVideoPlayer(options: UseVideoPlayerOptions = {}) {
  const player = ref<VideoPlayer | null>(null)
  const isPlaying = ref(false)
  const currentTime = ref(0)
  const duration = ref(0)
  const volume = ref(options.volume || 1)
  const muted = ref(options.muted || false)
  const loading = ref(false)
  const currentSubtitle = ref('')
  const supportsPiP = ref(false)

  // 初始化播放器
  const init = () => {
    if (player.value) return

    player.value = new VideoPlayer(options as VideoPlayerConfig)

    // 检查画中画支持
    supportsPiP.value = 'pictureInPictureEnabled' in document

    // 监听播放状态
    if (player.value.on) {
      player.value.on('play', () => {
        isPlaying.value = true
      })

      player.value.on('pause', () => {
        isPlaying.value = false
      })

      player.value.on('ended', () => {
        isPlaying.value = false
      })

      player.value.on('timeupdate', (time: number) => {
        currentTime.value = time
      })

      player.value.on('durationchange', (dur: number) => {
        duration.value = dur
      })

      player.value.on('volumechange', (vol: number) => {
        volume.value = vol
      })
    }
  }

  // 播放
  const play = () => {
    player.value?.play()
  }

  // 暂停
  const pause = () => {
    player.value?.pause()
  }

  // 跳转
  const seek = (time: number) => {
    player.value?.seek(time)
  }

  // 设置音量
  const setVolume = (vol: number) => {
    player.value?.setVolume?.(vol)
  }

  // 切换静音
  const toggleMute = () => {
    muted.value = !muted.value
  }

  // 切换全屏
  const toggleFullscreen = () => {
    player.value?.toggleFullscreen?.()
  }

  // 切换画中画
  const togglePiP = () => {
    player.value?.togglePiP?.()
  }

  // 加载视频
  const loadVideo = (src: string) => {
    player.value?.load?.(src)
  }

  // 加载字幕
  const loadSubtitles = (url: string) => {
    player.value?.loadSubtitles?.(url)
  }

  // 生命周期
  onMounted(() => {
    if (options.autoInit !== false) {
      init()
    }
  })

  onUnmounted(() => {
    player.value?.destroy?.()
  })

  return {
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
    loadSubtitles,
  }
}

