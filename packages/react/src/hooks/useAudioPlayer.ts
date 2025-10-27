/**
 * React Hook - useAudioPlayer
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { AudioPlayer } from '@ldesign/player-core';
import type { AudioPlayerOptions as AudioPlayerConfig } from '@ldesign/player-core';

export interface UseAudioPlayerOptions extends Partial<AudioPlayerConfig> {
  autoInit?: boolean;
  container?: HTMLElement | null;
}

export function useAudioPlayer(options: UseAudioPlayerOptions = {}) {
  const playerRef = useRef<AudioPlayer | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(options.volume || 0.8);
  const [currentLyric, setCurrentLyric] = useState('');

  // 初始化播放器
  useEffect(() => {
    if (options.autoInit === false) return;

    const player = new AudioPlayer(options as AudioPlayerConfig);
    playerRef.current = player;

    // 监听播放状态
    if (player.on) {
      player.on('play', () => setIsPlaying(true));
      player.on('pause', () => setIsPlaying(false));
      player.on('ended', () => setIsPlaying(false));
      player.on('timeupdate', (time: number) => setCurrentTime(time));
      player.on('durationchange', (dur: number) => setDuration(dur));
      player.on('volumechange', (vol: number) => setVolumeState(vol));
    }

    return () => {
      player.destroy?.();
    };
  }, []); // 只在组件挂载时初始化

  // 播放
  const play = useCallback(() => {
    playerRef.current?.play();
  }, []);

  // 暂停
  const pause = useCallback(() => {
    playerRef.current?.pause();
  }, []);

  // 停止
  const stop = useCallback(() => {
    playerRef.current?.stop?.();
  }, []);

  // 跳转
  const seek = useCallback((time: number) => {
    playerRef.current?.seek(time);
  }, []);

  // 设置音量
  const setVolume = useCallback((vol: number) => {
    playerRef.current?.setVolume?.(vol);
  }, []);

  // 下一首
  const next = useCallback(() => {
    // 触发 next 事件
  }, []);

  // 上一首
  const prev = useCallback(() => {
    // 触发 prev 事件
  }, []);

  // 加载音频
  const loadAudio = useCallback((src: string) => {
    playerRef.current?.load?.(src);
  }, []);

  return {
    player: playerRef.current,
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
  };
}

