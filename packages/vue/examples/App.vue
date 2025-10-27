<template>
  <div class="demo-container">
    <h1>
      🎵 Vue 音频播放器演示
      <span class="dev-badge">VUE + VITE</span>
    </h1>
    
    <!-- 音频播放器组件 -->
    <AudioPlayer
      :src="currentTrack.src"
      :show-waveform="true"
      :show-volume="true"
      :show-lyrics="true"
      :lyrics="currentTrack.lyrics"
      @play="onPlay"
      @pause="onPause"
      @ended="onEnded"
      @next="playNext"
      @prev="playPrev"
    />
    
    <!-- 播放列表 -->
    <div class="playlist-section">
      <h3>播放列表</h3>
      <div 
        v-for="(track, index) in playlist" 
        :key="track.id"
        class="playlist-item"
        :class="{ active: currentTrackIndex === index }"
        @click="selectTrack(index)"
      >
        <img :src="track.cover" :alt="track.title">
        <div class="playlist-info">
          <div class="playlist-title">{{ track.title }}</div>
          <div class="playlist-artist">{{ track.artist }}</div>
        </div>
        <div class="playlist-duration">{{ track.duration }}</div>
      </div>
    </div>
    
    <!-- 功能特点 -->
    <div class="features">
      <div class="feature-card">
        <div class="feature-icon">📊</div>
        <div class="feature-title">波形可视化</div>
        <div class="feature-desc">实时音频波形显示</div>
      </div>
      <div class="feature-card">
        <div class="feature-icon">🎤</div>
        <div class="feature-title">歌词同步</div>
        <div class="feature-desc">LRC格式歌词支持</div>
      </div>
      <div class="feature-card">
        <div class="feature-icon">🎚️</div>
        <div class="feature-title">均衡器</div>
        <div class="feature-desc">多段音频调节</div>
      </div>
      <div class="feature-card">
        <div class="feature-icon">📋</div>
        <div class="feature-title">播放列表</div>
        <div class="feature-desc">列表管理与循环</div>
      </div>
    </div>
    
    <!-- 开发提示 -->
    <div class="info">
      <h3>💡 开发提示</h3>
      <p>
        此演示运行在 <strong>Vite + Vue 3</strong> 开发环境，使用了 alias 配置：<br>
        <code>@ldesign/player-vue</code> → <code>../src/index.ts</code><br>
        <code>@ldesign/player-core</code> → <code>../../core/src/index.ts</code><br>
        修改源码后会自动热更新，支持 Vue HMR！
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { AudioPlayer } from '@ldesign/player-vue'

const currentTrackIndex = ref(0)
const playlist = ref([
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
])

const currentTrack = computed(() => playlist.value[currentTrackIndex.value])

function selectTrack(index: number) {
  currentTrackIndex.value = index
  console.log('🎵 切换到:', playlist.value[index].title)
}

function playNext() {
  currentTrackIndex.value = (currentTrackIndex.value + 1) % playlist.value.length
  console.log('⏭️ 下一首:', currentTrack.value.title)
}

function playPrev() {
  currentTrackIndex.value = (currentTrackIndex.value - 1 + playlist.value.length) % playlist.value.length
  console.log('⏮️ 上一首:', currentTrack.value.title)
}

function onPlay() {
  console.log('▶️ 播放:', currentTrack.value.title)
}

function onPause() {
  console.log('⏸️ 暂停:', currentTrack.value.title)
}

function onEnded() {
  console.log('⏹️ 播放结束，自动播放下一首')
  playNext()
}
</script>

<style scoped>
.playlist-section {
  margin-top: 30px;
  padding-top: 30px;
  border-top: 1px solid #e0e0e0;
}

h3 {
  color: #666;
  margin-bottom: 20px;
}

.playlist-item {
  display: flex;
  align-items: center;
  padding: 15px;
  background: #f8f8f8;
  border-radius: 10px;
  margin-bottom: 10px;
  cursor: pointer;
  transition: all 0.3s;
}

.playlist-item:hover {
  background: #e8e8e8;
  transform: translateX(5px);
}

.playlist-item.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.playlist-item img {
  width: 50px;
  height: 50px;
  border-radius: 5px;
  margin-right: 15px;
}

.playlist-info {
  flex: 1;
}

.playlist-title {
  font-weight: 600;
  margin-bottom: 5px;
}

.playlist-artist {
  font-size: 14px;
  opacity: 0.7;
}

.playlist-duration {
  font-size: 14px;
  opacity: 0.7;
}

.features {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 15px;
  margin-top: 30px;
  padding-top: 30px;
  border-top: 1px solid #e0e0e0;
}

.feature-card {
  padding: 20px;
  background: #f8f8f8;
  border-radius: 10px;
  text-align: center;
  transition: transform 0.3s;
}

.feature-card:hover {
  transform: translateY(-3px);
}

.feature-icon {
  font-size: 32px;
  margin-bottom: 10px;
}

.feature-title {
  font-weight: 600;
  margin-bottom: 5px;
  font-size: 16px;
}

.feature-desc {
  font-size: 13px;
  color: #666;
}

.info {
  margin-top: 30px;
  padding: 20px;
  background: rgba(66, 211, 146, 0.1);
  border-radius: 10px;
  border-left: 4px solid #42d392;
}

.info h3 {
  color: #42d392;
  margin-bottom: 10px;
}

.info p {
  color: #666;
  font-size: 14px;
  line-height: 1.6;
}

.info code {
  background: rgba(0, 0, 0, 0.05);
  padding: 2px 6px;
  border-radius: 3px;
  font-family: 'Courier New', monospace;
}
</style>
