/**
 * React Hook - useVideoPlayer
 */

import { useState, useEffect, useCallback, useRef, type RefObject } from 'react';
import { VideoPlayer } from '../../../core/VideoPlayer';
import type { VideoPlayerConfig } from '../../../types';
import type { PlayerState } from '../../../types/player';

export interface UseVideoPlayerOptions extends VideoPlayerConfig {
  autoInit?: boolean;
}

export function useVideoPlayer(
  containerRef: RefObject<HTMLElement>,
  options: UseVideoPlayerOptions = {}
) {
  const playerRef = useRef<VideoPlayer | null>(null);
  const [state, setState] = useState<PlayerState | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(options.volume || 1);
  const [muted, setMuted] = useState(options.muted || false);
  const [buffered, setBuffered] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPiP, setIsPiP] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 初始化播放器
  useEffect(() => {
    if (options.autoInit === false) return;
    if (!containerRef.current) return;

    const player = new VideoPlayer(containerRef.current, options);
    playerRef.current = player;

    // 监听状态变化
    const unsubscribe = player.getStateManager().subscribe((newState) => {
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

    return () => {
      unsubscribe();
      player.destroy();
    };
  }, [containerRef.current]); // 依赖容器元素

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

  // 全屏
  const toggleFullscreen = useCallback(async () => {
    await playerRef.current?.toggleFullscreen();
    setIsFullscreen(playerRef.current?.isFullscreen() || false);
  }, []);

  // 画中画
  const togglePictureInPicture = useCallback(async () => {
    await playerRef.current?.togglePictureInPicture();
    setIsPiP(playerRef.current?.isPictureInPicture() || false);
  }, []);

  // 截图
  const screenshot = useCallback(() => {
    return playerRef.current?.screenshot();
  }, []);

  // 加载视频
  const load = useCallback((src: string | any) => {
    playerRef.current?.load(src);
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
    isFullscreen,
    isPiP,
    error,

    // 方法
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

