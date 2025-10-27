import React, { useRef, useEffect, useState } from 'react'
import { useAudioPlayer } from '../hooks/useAudioPlayer'
import type { AudioPlayerOptions } from '@ldesign/player-core'

export interface AudioPlayerProps {
  src?: string
  autoplay?: boolean
  loop?: boolean
  volume?: number
  showWaveform?: boolean
  showVolume?: boolean
  showLyrics?: boolean
  lyrics?: string
  playlist?: Array<{
    id: string
    src: string
    title?: string
    artist?: string
    cover?: string
  }>
  options?: AudioPlayerOptions
  onPlay?: () => void
  onPause?: () => void
  onEnded?: () => void
  onTimeUpdate?: (time: number) => void
  onVolumeChange?: (volume: number) => void
  onNext?: () => void
  onPrev?: () => void
  onError?: (error: Error) => void
  className?: string
  style?: React.CSSProperties
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({
  src,
  autoplay = false,
  loop = false,
  volume: initialVolume = 0.8,
  showWaveform = true,
  showVolume = true,
  showLyrics = false,
  lyrics,
  playlist,
  options,
  onPlay,
  onPause,
  onEnded,
  onTimeUpdate,
  onVolumeChange,
  onNext,
  onPrev,
  onError,
  className = '',
  style
}) => {
  const waveformRef = useRef<HTMLDivElement>(null)
  const progressRef = useRef<HTMLDivElement>(null)
  const volumeRef = useRef<HTMLDivElement>(null)

  const {
    player,
    isPlaying,
    currentTime,
    duration,
    volume,
    currentLyric,
    play,
    pause,
    seek,
    setVolume,
    next,
    prev,
    loadAudio
  } = useAudioPlayer({
    ...options,
    src,
    autoplay,
    volume: initialVolume,
    loop,
    container: waveformRef.current
  })

  // 计算进度百分比
  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0

  // 格式化时间
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // 播放/暂停处理
  const handlePlayPause = () => {
    if (isPlaying) {
      pause()
      onPause?.()
    } else {
      play()
      onPlay?.()
    }
  }

  // 上一首
  const handlePrev = () => {
    prev()
    onPrev?.()
  }

  // 下一首  
  const handleNext = () => {
    next()
    onNext?.()
  }

  // 进度跳转
  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressRef.current) return
    const rect = progressRef.current.getBoundingClientRect()
    const percent = (e.clientX - rect.left) / rect.width
    seek(duration * percent)
  }

  // 音量调节
  const handleVolumeChange = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!volumeRef.current) return
    const rect = volumeRef.current.getBoundingClientRect()
    const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    setVolume(percent)
    onVolumeChange?.(percent)
  }

  // 监听时间更新
  useEffect(() => {
    if (onTimeUpdate) {
      onTimeUpdate(currentTime)
    }
  }, [currentTime, onTimeUpdate])

  // 监听播放结束
  useEffect(() => {
    if (!isPlaying && currentTime >= duration && duration > 0) {
      onEnded?.()
    }
  }, [isPlaying, currentTime, duration, onEnded])

  // 监听 src 变化
  useEffect(() => {
    if (src) {
      loadAudio(src)
    }
  }, [src, loadAudio])

  return (
    <div className={`ld-audio-player ${className}`} style={style}>
      {/* 波形显示 */}
      {showWaveform && (
        <div className="ld-audio-player__waveform" ref={waveformRef}></div>
      )}

      {/* 播放控制 */}
      <div className="ld-audio-player__controls">
        <button onClick={handlePrev} className="ld-audio-player__btn">
          ⏮️
        </button>
        <button
          onClick={handlePlayPause}
          className="ld-audio-player__btn ld-audio-player__btn--main"
        >
          {isPlaying ? '⏸️' : '▶️'}
        </button>
        <button onClick={handleNext} className="ld-audio-player__btn">
          ⏭️
        </button>
      </div>

      {/* 进度条 */}
      <div
        className="ld-audio-player__progress"
        ref={progressRef}
        onClick={handleSeek}
      >
        <div
          className="ld-audio-player__progress-bar"
          style={{ width: `${progressPercent}%` }}
        ></div>
      </div>

      {/* 时间显示 */}
      <div className="ld-audio-player__time">
        <span>{formatTime(currentTime)}</span>
        <span>{formatTime(duration)}</span>
      </div>

      {/* 音量控制 */}
      {showVolume && (
        <div className="ld-audio-player__volume">
          <span className="ld-audio-player__volume-icon">🔊</span>
          <div
            className="ld-audio-player__volume-slider"
            ref={volumeRef}
            onClick={handleVolumeChange}
          >
            <div
              className="ld-audio-player__volume-bar"
              style={{ width: `${volume * 100}%` }}
            ></div>
          </div>
          <span className="ld-audio-player__volume-value">
            {Math.round(volume * 100)}%
          </span>
        </div>
      )}

      {/* 歌词显示 */}
      {showLyrics && currentLyric && (
        <div className="ld-audio-player__lyrics">
          {currentLyric}
        </div>
      )}
    </div>
  )
}



