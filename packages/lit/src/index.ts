// 导出 Lit 组件
export { LdAudioPlayer } from './components/audio-player'
export { LdVideoPlayer } from './components/video-player'

// 从核心包导出类型和功能
export * from '@ldesign/player-core'

// 定义自定义元素（可选，用户也可以自己定义）
export function defineElements() {
  if (typeof window !== 'undefined' && !customElements.get('ld-audio-player')) {
    import('./components/audio-player')
  }
  if (typeof window !== 'undefined' && !customElements.get('ld-video-player')) {
    import('./components/video-player')
  }
}


