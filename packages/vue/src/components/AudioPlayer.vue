<template>
  <div ref="containerRef" class="ld-audio-player-wrapper"></div>
</template>

<script setup lang="ts">
/**
 * Vue AudioPlayer 组件
 * 内部使用 Core CustomAudioPlayer 渲染，确保与 Core 直接渲染完全一致
 */
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { CustomAudioPlayer } from '@ldesign/player-core'
import type { CustomAudioPlayerOptions } from '@ldesign/player-core'

interface Props {
  src: string
  title?: string
  artist?: string
  cover?: string
  volume?: number
  autoplay?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  title: '未知歌曲',
  artist: '未知艺术家',
  volume: 0.8,
  autoplay: false,
})

const emit = defineEmits<{
  play: []
  pause: []
  ended: []
  timeupdate: [time: number]
  error: [error: Error]
}>()

const containerRef = ref<HTMLElement>()
let player: CustomAudioPlayer | null = null

onMounted(() => {
  if (containerRef.value) {
    const options: CustomAudioPlayerOptions = {
      container: containerRef.value,
      src: props.src,
      title: props.title,
      artist: props.artist,
      cover: props.cover,
      volume: props.volume,
      autoplay: props.autoplay,
    }
    
    player = new CustomAudioPlayer(options)
    
    // 绑定事件
    const audioPlayer = player.getAudioPlayer()
    audioPlayer.on('play', () => emit('play'))
    audioPlayer.on('pause', () => emit('pause'))
    audioPlayer.on('ended', () => emit('ended'))
    audioPlayer.on('timeupdate', (data: any) => emit('timeupdate', data.currentTime))
    audioPlayer.on('error', () => emit('error', new Error('Audio error')))
  }
})

// 监听 src 变化
watch(() => props.src, (newSrc) => {
  if (player && newSrc) {
    player.setSrc(newSrc)
  }
})

// 监听歌曲信息变化
watch([() => props.title, () => props.artist, () => props.cover], ([title, artist, cover]) => {
  if (player) {
    player.setTrackInfo(title || '未知歌曲', artist || '未知艺术家', cover)
  }
})

onUnmounted(() => {
  player?.destroy()
  player = null
})

// 暴露方法给父组件
defineExpose({
  play: () => player?.play(),
  pause: () => player?.pause(),
  seek: (time: number) => player?.seek(time),
  setVolume: (vol: number) => player?.setVolume(vol),
  getPlayer: () => player,
})
</script>

<style>
.ld-audio-player-wrapper {
  width: 100%;
}
</style>
