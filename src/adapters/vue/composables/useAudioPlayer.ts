/**
 * Vue Composable - useAudioPlayer
 */

import { ref, onMounted, onUnmounted, watch, type Ref } from 'vue';
import { AudioPlayer } from '../../../core/AudioPlayer';
import type { AudioPlayerConfig, Track } from '../../../types';
import type { PlayerState } from '../../../types/player';

export interface UseAudioPlayerOptions extends AudioPlayerConfig {
  autoInit?: boolean;
}

export function useAudioPlayer(options: UseAudioPlayerOptions = {}) {
  const player = ref<AudioPlayer | null>(null);
  const state = ref<PlayerState | null>(null);
  const isPlaying = ref(false);
  const currentTime = ref(0);
  const duration = ref(0);
  const volume = ref(options.volume || 1);
  const muted = ref(options.muted || false);
  const buffered = ref(0);
  const currentTrack = ref<Track | null>(null);
  const error = ref<string | null>(null);

  // 初始化播放器
  const init = () => {
    if (player.value) return;

    player.value = new AudioPlayer(options);

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

    // 监听轨道变化
    player.value.on('trackchange', ({ track }) => {
      currentTrack.value = track;
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

  // 下一首
  const next = () => {
    player.value?.next();
  };

  // 上一首
  const prev = () => {
    player.value?.prev();
  };

  // 加载音频
  const load = async (src: string) => {
    await player.value?.load(src);
  };

  // 获取播放列表管理器
  const getPlaylistManager = () => {
    return player.value?.getPlaylistManager();
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
    currentTrack,
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
    next,
    prev,
    load,
    getPlaylistManager,
  };
}

