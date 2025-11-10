/**
 * React Hook - useAudioPlayer
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { AudioPlayer } from '../../../core/AudioPlayer';
import type { AudioPlayerConfig, Track } from '../../../types';
import type { PlayerState } from '../../../types/player';

export interface UseAudioPlayerOptions extends AudioPlayerConfig {
  autoInit?: boolean;
}

export function useAudioPlayer(options: UseAudioPlayerOptions = {}) {
  const playerRef = useRef<AudioPlayer | null>(null);
  const [state, setState] = useState<PlayerState | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(options.volume || 1);
  const [muted, setMuted] = useState(options.muted || false);
  const [buffered, setBuffered] = useState(0);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 初始化播放器
  useEffect(() => {
    if (options.autoInit === false) return;

    const player = new AudioPlayer(options);
    playerRef.current = player;

    // 监听状态变化
    const unsubscribe = player.getStateManager().subscribe((newState: PlayerState) => {
      setState(newState);
      setCurrentTime(newState.currentTime);
      setDuration(newState.duration);
      setVolumeState(newState.volume);
      setMuted(newState.muted);
      setBuffered(newState.buffered);
      setError(newState.error);
    });

    // 监听播放状态
    player.on('play', () => setIsPlaying(true));
    player.on('pause', () => setIsPlaying(false));
    player.on('stop', () => setIsPlaying(false));
    player.on('ended', () => setIsPlaying(false));

    // 监听轨道变化
    player.on('trackchange', ({ track }) => {
      setCurrentTrack(track);
    });

    return () => {
      unsubscribe();
      player.destroy();
    };
  }, []); // 只在组件挂载时初始化

  // 播放
  const play = useCallback(async () => {
    await playerRef.current?.play();
  }, []);

  // 暂停
  const pause = useCallback(() => {
    playerRef.current?.pause();
  }, []);

  // 停止
  const stop = useCallback(() => {
    playerRef.current?.stop();
  }, []);

  // 切换播放/暂停
  const toggle = useCallback(async () => {
    if (isPlaying) {
      pause();
    } else {
      await play();
    }
  }, [isPlaying, play, pause]);

  // 跳转
  const seek = useCallback((time: number) => {
    playerRef.current?.seek(time);
  }, []);

  // 设置音量
  const setVolume = useCallback((vol: number) => {
    playerRef.current?.setVolume(vol);
  }, []);

  // 静音/取消静音
  const toggleMute = useCallback(() => {
    if (muted) {
      playerRef.current?.unmute();
    } else {
      playerRef.current?.mute();
    }
  }, [muted]);

  // 下一首
  const next = useCallback(() => {
    playerRef.current?.next();
  }, []);

  // 上一首
  const prev = useCallback(() => {
    playerRef.current?.prev();
  }, []);

  // 加载音频
  const load = useCallback(async (src: string) => {
    await playerRef.current?.load(src);
  }, []);

  // 获取播放列表管理器
  const getPlaylistManager = useCallback(() => {
    return playerRef.current?.getPlaylistManager();
  }, []);

  return {
    // 实例
    player: playerRef.current,

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

