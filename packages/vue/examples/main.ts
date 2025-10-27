import { createApp } from 'vue'
import App from './App.vue'

console.log('🎵 Vue Player 演示启动（Vite开发模式）')
console.log('📦 使用 alias:')
console.log('   @ldesign/player-vue → ../src/index.ts')
console.log('   @ldesign/player-core → ../../core/src/index.ts')
console.log('💡 修改源码后会自动热更新！')

const app = createApp(App)
app.mount('#app')

console.log('✅ Vue应用挂载完成')

