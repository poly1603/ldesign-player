// 导入并自动注册所有组件
import '@ldesign/player-lit/define'

console.log('🎵 Lit Player 演示启动（Vite开发模式）')
console.log('📦 使用 alias:')
console.log('   @ldesign/player-lit → ../src/index.ts')
console.log('   @ldesign/player-core → ../../core/src/index.ts')
console.log('💡 修改源码后会自动热更新，支持 Lit HMR！')

// 等待 DOM 加载完成
document.addEventListener('DOMContentLoaded', () => {
  const audioPlayer = document.getElementById('audio-player')
  const videoPlayer = document.getElementById('video-player')
  const playlistItems = document.querySelectorAll('.playlist-item')

  console.log('✅ Web Components 已注册')
  console.log('🎵 音频播放器:', audioPlayer)
  console.log('🎬 视频播放器:', videoPlayer)

  // 监听播放器事件
  if (audioPlayer) {
    audioPlayer.addEventListener('play', () => {
      console.log('▶️ 音频开始播放')
    })

    audioPlayer.addEventListener('pause', () => {
      console.log('⏸️ 音频暂停')
    })

    audioPlayer.addEventListener('ended', () => {
      console.log('⏹️ 音频播放结束')
    })

    audioPlayer.addEventListener('prev', () => {
      console.log('⏮️ 上一首')
    })

    audioPlayer.addEventListener('next', () => {
      console.log('⏭️ 下一首')
    })
  }

  // 播放列表切换
  playlistItems.forEach((item) => {
    item.addEventListener('click', (e) => {
      // 更新选中状态
      playlistItems.forEach(i => i.classList.remove('active'))
        ; (e.currentTarget as HTMLElement).classList.add('active')

      // 更新播放器源
      const src = (e.currentTarget as HTMLElement).dataset.src
      if (audioPlayer && src) {
        (audioPlayer as any).src = src
        const title = (e.currentTarget as HTMLElement).querySelector('.playlist-title')?.textContent
        console.log('🎵 切换到:', title)
      }
    })
  })

  // 监听视频播放器事件
  if (videoPlayer) {
    videoPlayer.addEventListener('play', () => {
      console.log('▶️ 视频开始播放')
    })

    videoPlayer.addEventListener('fullscreenchange', (e: any) => {
      console.log('⛶ 全屏状态:', e.detail)
    })
  }

  console.log('✅ Lit演示初始化完成')
  console.log('💡 你现在可以：')
  console.log('   1. 测试音频播放器功能')
  console.log('   2. 测试视频播放器功能')
  console.log('   3. 切换播放列表')
  console.log('   4. 修改 ../src 目录的源码，查看热更新效果')
})
