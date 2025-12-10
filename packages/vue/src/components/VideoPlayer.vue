<template>
  <div ref="containerRef" class="ld-video-player-wrapper"></div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { CustomVideoPlayer } from '@ldesign/player-core'

interface Props {
  src: string
  poster?: string
  aspectRatio?: string
  autoplay?: boolean
  borderRadius?: number | string
}

const props = withDefaults(defineProps<Props>(), {
  aspectRatio: '16:9',
  autoplay: false,
  borderRadius: 8,
})

const emit = defineEmits<{
  play: []
  pause: []
  ended: []
  timeupdate: [time: number]
}>()

const containerRef = ref<HTMLElement>()
let player: CustomVideoPlayer | null = null

onMounted(() => {
  if (containerRef.value) {
    player = new CustomVideoPlayer({
      container: containerRef.value,
      src: props.src,
      poster: props.poster,
      aspectRatio: props.aspectRatio,
      autoplay: props.autoplay,
      borderRadius: props.borderRadius,
    })
    const video = player.getVideo()
    video.addEventListener('play', () => emit('play'))
    video.addEventListener('pause', () => emit('pause'))
    video.addEventListener('ended', () => emit('ended'))
    video.addEventListener('timeupdate', () => emit('timeupdate', video.currentTime))
  }
})

watch(() => props.src, (newSrc) => {
  if (player && newSrc) player.setSrc(newSrc)
})

onUnmounted(() => {
  player?.destroy()
})

defineExpose({
  play: () => player?.play(),
  pause: () => player?.pause(),
  seek: (time: number) => player?.seek(time),
  setVolume: (vol: number) => player?.setVolume(vol),
})
</script>

<style>
.ld-video-player-wrapper { width: 100%; }
</style>
