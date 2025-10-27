/**
 * React Hook - useVideoPlayer
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { VideoPlayer } from '@ldesign/player-core';
import type { VideoPlayerOptions as VideoPlayerConfig } from '@ldesign/player-core';

export interface UseVideoPlayerOptions extends Partial<VideoPlayerConfig> {
  autoInit?: boolean;
  container?: HTMLElement | null;
  video?: HTMLVideoElement | null;
}

export function useVideoPlayer(options: UseVideoPlayerOptions = {}) {
  const playerRef = useRef<VideoPlayer | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(options.volume || 1);
  const [muted, setMuted] = useState(options.muted || false);
  const [loading, setLoading] = useState(false);
  const [currentSubtitle, setCurrentSubtitle] = useState('');
  const [supportsPiP, setSupportsPiP] = useState(false);

  // 初始化播放器
  useEffect(() => {
    if (options.autoInit === false) return;

    const player = new VideoPlayer(options as VideoPlayerConfig);
    playerRef.current = player;

    // 检查画中画支持
    setSupportsPiP('pictureInPictureEnabled' in document);

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

  // 跳转
  const seek = useCallback((time: number) => {
    playerRef.current?.seek(time);
  }, []);

  // 设置音量
  const setVolume = useCallback((vol: number) => {
    playerRef.current?.setVolume?.(vol);
  }, []);

  // 切换静音
  const toggleMute = useCallback(() => {
    setMuted(prev => !prev);
  }, []);

  // 切换全屏
  const toggleFullscreen = useCallback(() => {
    playerRef.current?.toggleFullscreen?.();
  }, []);

  // 切换画中画
  const togglePiP = useCallback(() => {
    playerRef.current?.togglePiP?.();
  }, []);

  // 加载视频
  const loadVideo = useCallback((src: string) => {
    playerRef.current?.load?.(src);
  }, []);

  // 加载字幕
  const loadSubtitles = useCallback((url: string) => {
    playerRef.current?.loadSubtitles?.(url);
  }, []);

  return {
    player: playerRef.current,
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
  };
}

