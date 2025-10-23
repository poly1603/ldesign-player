/**
 * Vue Composable - useVideoPlayer
 */

import { ref, onMounted, onUnmounted, type Ref } from 'vue';
import { VideoPlayer } from '../../../core/VideoPlayer';
import type { VideoPlayerConfig } from '../../../types';
import type { PlayerState } from '../../../types/player';

export interface UseVideoPlayerOptions extends VideoPlayerConfig {
  autoInit?: boolean;
}

export function useVideoPlayer(
  container: Ref<HTMLElement | null> | HTMLElement | string,
  options: UseVideoPlayerOptions = {}
) {
  const player = ref<VideoPlayer | null>(null);
  const state = ref<PlayerState | null>(null);
  const isPlaying = ref(false);
  const currentTime = ref(0);
  const duration = ref(0);
  const volume = ref(options.volume || 1);
  const muted = ref(options.muted || false);
  const buffered = ref(0);
  const isFullscreen = ref(false);
  const isPiP = ref(false);
  const error = ref<string | null>(null);

  // 初始化播放器
  const init = () => {
    if (player.value) return;

    let containerElement: HTMLElement | string;

    if (typeof container === 'string') {
      containerElement = container;
    } else if ('value' in container) {
      if (!container.value) {
        console.error('Container ref is null');
        return;
      }
      containerElement = container.value;
    } else {
      containerElement = container;
    }

    player.value = new VideoPlayer(containerElement, options);

    // 监听状态变化
    player.value.getStateManager().subscribe((newState) => {
      state.value = newState;
      currentTime.value = newState.currentTime;
      duration.value = newState.duration;
      volume.value = newState.volume;
      muted.value = newState.muted;
      buffered.value = newState.buffered;
      error.value = newState.error;
    });

    // 监听播放状态
    player.value.on('play', () => {
      isPlaying.value = true;
    });

    player.value.on('pause', () => {
      isPlaying.value = false;
    });

    player.value.on('stop', () => {
      isPlaying.value = false;
    });

    player.value.on('ended', () => {
      isPlaying.value = false;
    });
  };

  // 播放
  const play = async () => {
    await player.value?.play();
  };

  // 暂停
  const pause = () => {
    player.value?.pause();
  };

  // 停止
  const stop = () => {
    player.value?.stop();
  };

  // 切换播放/暂停
  const toggle = async () => {
    if (isPlaying.value) {
      pause();
    } else {
      await play();
    }
  };

  // 跳转
  const seek = (time: number) => {
    player.value?.seek(time);
  };

  // 设置音量
  const setVolume = (vol: number) => {
    player.value?.setVolume(vol);
  };

  // 静音/取消静音
  const toggleMute = () => {
    if (muted.value) {
      player.value?.unmute();
    } else {
      player.value?.mute();
    }
  };

  // 全屏
  const toggleFullscreen = async () => {
    await player.value?.toggleFullscreen();
    isFullscreen.value = player.value?.isFullscreen() || false;
  };

  // 画中画
  const togglePictureInPicture = async () => {
    await player.value?.togglePictureInPicture();
    isPiP.value = player.value?.isPictureInPicture() || false;
  };

  // 截图
  const screenshot = () => {
    return player.value?.screenshot();
  };

  // 加载视频
  const load = (src: string | any) => {
    player.value?.load(src);
  };

  // 生命周期
  onMounted(() => {
    if (options.autoInit !== false) {
      init();
    }
  });

  onUnmounted(() => {
    player.value?.destroy();
  });

  return {
    // 实例
    player,

    // 状态
    state,
    isPlaying,
    currentTime,
    duration,
    volume,
    muted,
    buffered,
    isFullscreen,
    isPiP,
    error,

    // 方法
    init,
    play,
    pause,
    stop,
    toggle,
    seek,
    setVolume,
    toggleMute,
    toggleFullscreen,
    togglePictureInPicture,
    screenshot,
    load,
  };
}

