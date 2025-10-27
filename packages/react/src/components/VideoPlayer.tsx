import React, { useRef, useEffect, useState, useCallback } from 'react'
import { useVideoPlayer } from '../hooks/useVideoPlayer'
import type { VideoPlayerOptions } from '@ldesign/player-core'

export interface VideoPlayerProps {
  src: string
  poster?: string
  width?: number | string
  height?: number | string
  autoplay?: boolean
  loop?: boolean
  muted?: boolean
  controls?: boolean
  volume?: number
  subtitles?: string
  options?: VideoPlayerOptions
  onPlay?: () => void
  onPause?: () => void
  onEnded?: () => void
  onTimeUpdate?: (time: number) => void
  onVolumeChange?: (volume: number) => void
  onFullscreenChange?: (fullscreen: boolean) => void
  onError?: (error: Error) => void
  className?: string
  style?: React.CSSProperties
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  src,
  poster,
  width,
  height,
  autoplay = false,
  loop = false,
  muted: initialMuted = false,
  controls = true,
  volume: initialVolume = 1,
  subtitles,
  options,
  onPlay,
  onPause,
  onEnded,
  onTimeUpdate,
  onVolumeChange,
  onFullscreenChange,
  onError,
  className = '',
  style
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const progressRef = useRef<HTMLDivElement>(null)
  const volumeRef = useRef<HTMLDivElement>(null)
  const [controlsVisible, setControlsVisible] = useState(false)
  const controlsTimeoutRef = useRef<NodeJS.Timeout>()

  const {
    player,
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
    loadSubtitles
  } = useVideoPlayer({
    ...options,
    container: containerRef.current,
    video: videoRef.current
  })

  // 计算进度百分比
  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0

  // 格式化时间
  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = Math.floor(seconds % 60)

    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // 显示/隐藏控制栏
  const showControls = useCallback(() => {
    setControlsVisible(true)
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current)
    }
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) {
        setControlsVisible(false)
      }
    }, 3000)
  }, [isPlaying])

  // 播放/暂停
  const handlePlayPause = () => {
    if (isPlaying) {
      pause()
      onPause?.()
    } else {
      play()
      onPlay?.()
    }
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

  // 全屏切换
  const handleFullscreen = () => {
    toggleFullscreen()
    onFullscreenChange?.(document.fullscreenElement !== null)
  }

  // 视频事件处理
  const handleVideoPlay = () => {
    onPlay?.()
  }

  const handleVideoPause = () => {
    onPause?.()
  }

  const handleVideoEnded = () => {
    onEnded?.()
  }

  const handleVideoTimeUpdate = () => {
    if (videoRef.current) {
      onTimeUpdate?.(videoRef.current.currentTime)
    }
  }

  const handleVideoError = () => {
    onError?.(new Error('Video playback error'))
  }

  // 加载视频
  useEffect(() => {
    if (src && videoRef.current) {
      loadVideo(src)
    }
  }, [src, loadVideo])

  // 加载字幕
  useEffect(() => {
    if (subtitles) {
      loadSubtitles(subtitles)
    }
  }, [subtitles, loadSubtitles])

  // 初始化
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = initialVolume
      videoRef.current.muted = initialMuted
    }
  }, [initialVolume, initialMuted])

  // 清理
  useEffect(() => {
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current)
      }
    }
  }, [])

  return (
    <div
      className={`ld-video-player ${className}`}
      ref={containerRef}
      style={{ width, height, ...style }}
      onMouseMove={showControls}
      onMouseEnter={showControls}
      onMouseLeave={() => isPlaying && setControlsVisible(false)}
    >
      <video
        ref={videoRef}
        className="ld-video-player__video"
        src={src}
        poster={poster}
        autoPlay={autoplay}
        loop={loop}
        muted={initialMuted}
        onPlay={handleVideoPlay}
        onPause={handleVideoPause}
        onEnded={handleVideoEnded}
        onTimeUpdate={handleVideoTimeUpdate}
        onError={handleVideoError}
      />

      {/* 控制栏 */}
      {controls && (
        <div
          className={`ld-video-player__controls ${controlsVisible ? 'ld-video-player__controls--visible' : ''}`}
        >
          {/* 播放按钮 */}
          <button onClick={handlePlayPause} className="ld-video-player__btn">
            {isPlaying ? '⏸️' : '▶️'}
          </button>

          {/* 时间显示 */}
          <span className="ld-video-player__time">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>

          {/* 进度条 */}
          <div
            className="ld-video-player__progress"
            ref={progressRef}
            onClick={handleSeek}
          >
            <div
              className="ld-video-player__progress-bar"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* 音量控制 */}
          <div className="ld-video-player__volume">
            <button onClick={toggleMute} className="ld-video-player__btn">
              {muted ? '🔇' : '🔊'}
            </button>
            <div
              className="ld-video-player__volume-slider"
              ref={volumeRef}
              onClick={handleVolumeChange}
            >
              <div
                className="ld-video-player__volume-bar"
                style={{ width: `${volume * 100}%` }}
              />
            </div>
          </div>

          {/* 全屏按钮 */}
          <button onClick={handleFullscreen} className="ld-video-player__btn">
            ⛶
          </button>

          {/* 画中画按钮 */}
          {supportsPiP && (
            <button onClick={togglePiP} className="ld-video-player__btn">
              📱
            </button>
          )}
        </div>
      )}

      {/* 字幕显示 */}
      {currentSubtitle && (
        <div className="ld-video-player__subtitles">
          {currentSubtitle}
        </div>
      )}

      {/* 加载指示器 */}
      {loading && (
        <div className="ld-video-player__loading">
          <div className="ld-video-player__spinner" />
        </div>
      )}
    </div>
  )
}



