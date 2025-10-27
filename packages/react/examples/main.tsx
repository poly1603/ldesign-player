import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import '@ldesign/player-react/styles'

console.log('🎵 React Player 演示启动（Vite开发模式）')
console.log('📦 使用 alias:')
console.log('   @ldesign/player-react → ../src/index.ts')
console.log('   @ldesign/player-core → ../../core/src/index.ts')
console.log('💡 修改源码后会自动热更新，支持 React Fast Refresh！')

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)

console.log('✅ React应用挂载完成')
