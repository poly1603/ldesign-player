import React, { useState } from 'react'
import { AudioPlayer } from '@ldesign/player-react'
import './App.css'

const App: React.FC = () => {
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0)

  const playlist = [
    {
      id: '1',
      src: 'track1.mp3',
      title: '夏日微风',
      artist: '轻音乐大师',
      cover: 'https://via.placeholder.com/50/667eea/ffffff?text=♪',
      duration: '3:24',
      lyrics: '[00:00.00]夏日微风 - 轻音乐大师\n[00:05.00]♪♪♪'
    },
    {
      id: '2',
      src: 'track2.mp3',
      title: '雨后彩虹',
      artist: '自然之声',
      cover: 'https://via.placeholder.com/50/764ba2/ffffff?text=♪',
      duration: '4:15',
      lyrics: '[00:00.00]雨后彩虹 - 自然之声\n[00:05.00]♪♪♪'
    },
    {
      id: '3',
      src: 'track3.mp3',
      title: '星空漫步',
      artist: '梦幻乐团',
      cover: 'https://via.placeholder.com/50/f093fb/ffffff?text=♪',
      duration: '5:02',
      lyrics: '[00:00.00]星空漫步 - 梦幻乐团\n[00:05.00]♪♪♪'
    },
    {
      id: '4',
      src: 'track4.mp3',
      title: '晨曦之光',
      artist: '新世纪音乐',
      cover: 'https://via.placeholder.com/50/f5576c/ffffff?text=♪',
      duration: '3:48',
      lyrics: '[00:00.00]晨曦之光 - 新世纪音乐\n[00:05.00]♪♪♪'
    }
  ]

  const currentTrack = playlist[currentTrackIndex]

  const selectTrack = (index: number) => {
    setCurrentTrackIndex(index)
    console.log('🎵 切换到:', playlist[index].title)
  }

  const playNext = () => {
    const nextIndex = (currentTrackIndex + 1) % playlist.length
    setCurrentTrackIndex(nextIndex)
    console.log('⏭️ 下一首:', playlist[nextIndex].title)
  }

  const playPrev = () => {
    const prevIndex = (currentTrackIndex - 1 + playlist.length) % playlist.length
    setCurrentTrackIndex(prevIndex)
    console.log('⏮️ 上一首:', playlist[prevIndex].title)
  }

  const onPlay = () => {
    console.log('▶️ 播放:', currentTrack.title)
  }

  const onPause = () => {
    console.log('⏸️ 暂停:', currentTrack.title)
  }

  const onEnded = () => {
    console.log('⏹️ 播放结束，自动播放下一首')
    playNext()
  }

  return (
    <div className="demo-container">
      <h1>
        🎵 React 音频播放器演示
        <span className="dev-badge">REACT + VITE</span>
      </h1>

      <AudioPlayer
        src={currentTrack.src}
        showWaveform={true}
        showVolume={true}
        showLyrics={true}
        lyrics={currentTrack.lyrics}
        onPlay={onPlay}
        onPause={onPause}
        onEnded={onEnded}
        onNext={playNext}
        onPrev={playPrev}
      />

      <div className="playlist-section">
        <h3>播放列表</h3>
        {playlist.map((track, index) => (
          <div
            key={track.id}
            className={`playlist-item ${currentTrackIndex === index ? 'active' : ''}`}
            onClick={() => selectTrack(index)}
          >
            <img src={track.cover} alt={track.title} />
            <div className="playlist-info">
              <div className="playlist-title">{track.title}</div>
              <div className="playlist-artist">{track.artist}</div>
            </div>
            <div className="playlist-duration">{track.duration}</div>
          </div>
        ))}
      </div>

      <div className="features">
        <div className="feature-card">
          <div className="feature-icon">📊</div>
          <div className="feature-title">波形可视化</div>
          <div className="feature-desc">实时音频波形显示</div>
        </div>
        <div className="feature-card">
          <div className="feature-icon">🎤</div>
          <div className="feature-title">歌词同步</div>
          <div className="feature-desc">LRC格式歌词支持</div>
        </div>
        <div className="feature-card">
          <div className="feature-icon">🎚️</div>
          <div className="feature-title">均衡器</div>
          <div className="feature-desc">多段音频调节</div>
        </div>
        <div className="feature-card">
          <div className="feature-icon">📋</div>
          <div className="feature-title">播放列表</div>
          <div className="feature-desc">列表管理与循环</div>
        </div>
      </div>

      <div className="info">
        <h3>💡 开发提示</h3>
        <p>
          此演示运行在 <strong>Vite + React 18</strong> 开发环境，使用了 alias 配置：<br />
          <code>@ldesign/player-react</code> → <code>../src/index.ts</code><br />
          <code>@ldesign/player-core</code> → <code>../../core/src/index.ts</code><br />
          修改源码后会自动热更新，支持 React Fast Refresh！
        </p>
      </div>
    </div>
  )
}

export default App
