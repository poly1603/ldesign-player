/**
 * Vue Composable - useAudioPlayer
 */

import { ref, onMounted, onUnmounted, watch, type Ref } from 'vue';
import { AudioPlayer } from '@ldesign/player-core';
import type { AudioPlayerOptions as AudioPlayerConfig } from '@ldesign/player-core';

export interface UseAudioPlayerOptions extends Partial<AudioPlayerConfig> {
  autoInit?: boolean
  container?: HTMLElement | null
}

export function useAudioPlayer(options: UseAudioPlayerOptions = {}) {
  const player = ref<AudioPlayer | null>(null)
  const isPlaying = ref(false)
  const currentTime = ref(0)
  const duration = ref(0)
  const volume = ref(options.volume || 0.8)
  const currentLyric = ref('')

  // 初始化播放器
  const init = () => {
    if (player.value) return

    player.value = new AudioPlayer(options as AudioPlayerConfig)

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

  // 停止
  const stop = () => {
    player.value?.stop?.()
  }

  // 跳转
  const seek = (time: number) => {
    player.value?.seek(time)
  }

  // 设置音量
  const setVolume = (vol: number) => {
    player.value?.setVolume?.(vol)
  }

  // 下一首
  const next = () => {
    // 触发 next 事件
  }

  // 上一首
  const prev = () => {
    // 触发 prev 事件
  }

  // 加载音频
  const loadAudio = (src: string) => {
    player.value?.load?.(src)
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
    currentLyric,
    play,
    pause,
    stop,
    seek,
    setVolume,
    next,
    prev,
    loadAudio,
  }
}

