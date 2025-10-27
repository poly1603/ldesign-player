// 从源码导入（通过 vite alias）
// import { AudioPlayer, WaveformRenderer } from '@ldesign/player-core'

// 演示：模拟播放器功能
let isPlaying = false
let currentTime = 0
let duration = 180 // 3分钟
let currentTrackIndex = 0

const playBtn = document.getElementById('play-btn') as HTMLButtonElement
const progressBar = document.getElementById('progress') as HTMLElement
const progressBarContainer = document.getElementById('progress-bar') as HTMLElement
const currentTimeEl = document.getElementById('current-time') as HTMLElement
const durationEl = document.getElementById('duration') as HTMLElement
const volumeSlider = document.getElementById('volume-slider') as HTMLElement
const volumeBar = document.getElementById('volume-bar') as HTMLElement
const volumeValue = document.getElementById('volume-value') as HTMLElement
const playlistItems = document.querySelectorAll('.playlist-item')

console.log('🎵 Player Core 演示启动（Vite开发模式）')
console.log('📦 使用 alias: @ldesign/player-core → ../src/index.ts')

// 格式化时间
function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

// 更新时间显示
durationEl.textContent = formatTime(duration)

// 播放/暂停按钮
playBtn.addEventListener('click', () => {
  isPlaying = !isPlaying
  if (isPlaying) {
    playBtn.textContent = '⏸️ 暂停'
    playBtn.classList.add('pause')
    simulatePlayback()
    console.log('▶️ 开始播放')
  } else {
    playBtn.textContent = '▶️ 播放'
    playBtn.classList.remove('pause')
    console.log('⏸️ 暂停播放')
  }
})

// 模拟播放进度
function simulatePlayback() {
  if (isPlaying && currentTime < duration) {
    currentTime += 0.1
    const percent = (currentTime / duration) * 100
    progressBar.style.width = percent + '%'
    currentTimeEl.textContent = formatTime(currentTime)
    requestAnimationFrame(simulatePlayback)
  } else if (currentTime >= duration) {
    currentTime = 0
    isPlaying = false
    playBtn.textContent = '▶️ 播放'
    playBtn.classList.remove('pause')
    progressBar.style.width = '0%'
    currentTimeEl.textContent = '0:00'
    console.log('⏹️ 播放结束')
  }
}

// 进度条点击
progressBarContainer.addEventListener('click', (e) => {
  const rect = progressBarContainer.getBoundingClientRect()
  const percent = (e.clientX - rect.left) / rect.width
  currentTime = duration * percent
  progressBar.style.width = (percent * 100) + '%'
  currentTimeEl.textContent = formatTime(currentTime)
  console.log(`⏩ 跳转到: ${formatTime(currentTime)}`)
})

// 音量控制
volumeSlider.addEventListener('click', (e) => {
  const rect = volumeSlider.getBoundingClientRect()
  const percent = (e.clientX - rect.left) / rect.width
  volumeBar.style.width = (percent * 100) + '%'
  volumeValue.textContent = Math.round(percent * 100) + '%'
  console.log(`🔊 音量设置为: ${Math.round(percent * 100)}%`)
})

// 播放列表切换
playlistItems.forEach((item, index) => {
  item.addEventListener('click', () => {
    // 更新选中状态
    playlistItems.forEach(i => i.classList.remove('active'))
    item.classList.add('active')

    // 重置播放
    currentTrackIndex = index
    currentTime = 0
    progressBar.style.width = '0%'
    currentTimeEl.textContent = '0:00'

    console.log(`🎵 切换到: ${item.textContent}`)
  })
})

// 上一首
document.getElementById('prev-btn')?.addEventListener('click', () => {
  currentTrackIndex = (currentTrackIndex - 1 + playlistItems.length) % playlistItems.length
  playlistItems[currentTrackIndex].dispatchEvent(new Event('click'))
  console.log('⏮️ 上一首')
})

// 下一首
document.getElementById('next-btn')?.addEventListener('click', () => {
  currentTrackIndex = (currentTrackIndex + 1) % playlistItems.length
  playlistItems[currentTrackIndex].dispatchEvent(new Event('click'))
  console.log('⏭️ 下一首')
})

// 绘制波形（模拟）
const canvas = document.getElementById('waveform-canvas') as HTMLCanvasElement
const ctx = canvas.getContext('2d')!
canvas.width = canvas.offsetWidth
canvas.height = 150

function drawWaveform() {
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  ctx.beginPath()
  ctx.strokeStyle = '#667eea'
  ctx.lineWidth = 2

  for (let x = 0; x < canvas.width; x++) {
    const y = Math.sin(x * 0.05 + Date.now() * 0.001) * 30 * Math.random() + canvas.height / 2
    if (x === 0) {
      ctx.moveTo(x, y)
    } else {
      ctx.lineTo(x, y)
    }
  }
  ctx.stroke()

  if (isPlaying) {
    requestAnimationFrame(drawWaveform)
  }
}

drawWaveform()

// 监听窗口大小变化
window.addEventListener('resize', () => {
  canvas.width = canvas.offsetWidth
  drawWaveform()
})

console.log('✅ Player Core 演示初始化完成')
console.log('💡 你现在可以：')
console.log('   1. 点击播放按钮测试播放功能')
console.log('   2. 拖动进度条跳转')
console.log('   3. 调节音量')
console.log('   4. 切换播放列表')
console.log('   5. 修改 ../src 目录的源码，查看热更新效果')

