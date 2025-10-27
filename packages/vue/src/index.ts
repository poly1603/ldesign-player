import { App, Plugin } from 'vue'
import AudioPlayer from './components/AudioPlayer.vue'
import VideoPlayer from './components/VideoPlayer.vue'

// 导出组件
export { AudioPlayer, VideoPlayer }

// 导出 composables
export { useAudioPlayer } from './composables/useAudioPlayer'
export { useVideoPlayer } from './composables/useVideoPlayer'

// 导出类型
export * from '@ldesign/player-core'

// 组件安装函数
const components = [AudioPlayer, VideoPlayer]

const install = (app: App) => {
  components.forEach(component => {
    app.component(component.name || 'LdPlayer', component)
  })
}

// 导出插件
const LDesignPlayerVue: Plugin = {
  install
}

export default LDesignPlayerVue



