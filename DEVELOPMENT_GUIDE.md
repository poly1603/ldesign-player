# 📖 Player 项目开发指南

## 🚀 快速开始

### 启动所有演示

```bash
cd libraries/player
./start-all-examples.ps1
```

这会启动4个Vite开发服务器：
- Core 演示: http://localhost:8081
- Vue 演示: http://localhost:8082
- React 演示: http://localhost:8083
- Lit 演示: http://localhost:8084

---

## 🛠️ 开发环境

### 技术栈

- **构建工具**: Vite 5
- **开发服务器**: Vite Dev Server
- **热更新**: HMR (Hot Module Replacement)
- **包管理**: pnpm workspace

### 端口分配

| 演示 | 端口 | 地址 |
|------|------|------|
| Core | 8081 | http://localhost:8081 |
| Vue | 8082 | http://localhost:8082 |
| React | 8083 | http://localhost:8083 |
| Lit | 8084 | http://localhost:8084 |

---

## 🎯 Alias 配置

每个包的 examples 都配置了 alias，直接引用源码，方便开发调试。

### Core 包 Alias

```typescript
// packages/core/examples/vite.config.ts
{
  resolve: {
    alias: {
      '@ldesign/player-core': resolve(__dirname, '../src/index.ts'),
      '@ldesign/player-core/audio': resolve(__dirname, '../src/audio'),
      '@ldesign/player-core/core': resolve(__dirname, '../src/core'),
      '@ldesign/player-core/video': resolve(__dirname, '../src/video'),
      '@ldesign/player-core/types': resolve(__dirname, '../src/types'),
      '@ldesign/player-core/utils': resolve(__dirname, '../src/utils'),
    }
  }
}
```

### Vue 包 Alias

```typescript
// packages/vue/examples/vite.config.ts
{
  resolve: {
    alias: {
      '@ldesign/player-vue': resolve(__dirname, '../src/index.ts'),
      '@ldesign/player-core': resolve(__dirname, '../../core/src/index.ts'),
    }
  }
}
```

### React 包 Alias

```typescript
// packages/react/examples/vite.config.ts
{
  resolve: {
    alias: {
      '@ldesign/player-react': resolve(__dirname, '../src/index.ts'),
      '@ldesign/player-core': resolve(__dirname, '../../core/src/index.ts'),
    }
  }
}
```

### Lit 包 Alias

```typescript
// packages/lit/examples/vite.config.ts
{
  resolve: {
    alias: {
      '@ldesign/player-lit': resolve(__dirname, '../src/index.ts'),
      '@ldesign/player-lit/define': resolve(__dirname, '../src/define.ts'),
      '@ldesign/player-core': resolve(__dirname, '../../core/src/index.ts'),
    }
  }
}
```

---

## 🔧 开发流程

### 1. 启动单个演示

```bash
# Core 演示
cd packages/core/examples
npx vite

# Vue 演示
cd packages/vue/examples
npx vite

# React 演示
cd packages/react/examples
npx vite

# Lit 演示
cd packages/lit/examples
npx vite
```

### 2. 修改源码

修改各包 `src/` 目录下的源码，Vite 会自动热更新：

```bash
# 例如修改 Core 包
edit packages/core/src/core/AudioPlayer.ts

# 保存后，浏览器会自动刷新
# 查看 http://localhost:8081 的变化
```

### 3. 调试

打开浏览器开发者工具（F12），可以：
- 查看控制台日志
- 调试源码（支持 Source Map）
- 查看网络请求
- 检查元素

### 4. 构建包

在开发完成后，构建各包：

```bash
cd packages/core
node ../../../../tools/builder/bin/cli.js build

cd ../vue
node ../../../../tools/builder/bin/cli.js build

cd ../react
node ../../../../tools/builder/bin/cli.js build

cd ../lit
node ../../../../tools/builder/bin/cli.js build
```

---

## 📁 项目结构

```
player/
├── packages/
│   ├── core/
│   │   ├── src/              # 源代码
│   │   ├── examples/         # Vite 演示
│   │   │   ├── index.html
│   │   │   ├── main.ts
│   │   │   ├── vite.config.ts  # Vite配置 + Alias
│   │   │   └── package.json
│   │   ├── .ldesign/         # 构建配置
│   │   ├── es/               # ESM 构建产物
│   │   ├── lib/              # CJS 构建产物
│   │   └── dist/             # UMD 构建产物
│   │
│   ├── vue/
│   │   ├── src/              # 源代码
│   │   ├── examples/         # Vite 演示
│   │   │   ├── index.html
│   │   │   ├── main.ts
│   │   │   ├── App.vue        # Vue 应用
│   │   │   ├── vite.config.ts  # Vite配置 + Alias
│   │   │   └── package.json
│   │   └── ...
│   │
│   ├── react/
│   │   ├── src/              # 源代码
│   │   ├── examples/         # Vite 演示
│   │   │   ├── index.html
│   │   │   ├── main.tsx
│   │   │   ├── App.tsx        # React 应用
│   │   │   ├── App.css
│   │   │   ├── vite.config.ts  # Vite配置 + Alias
│   │   │   └── package.json
│   │   └── ...
│   │
│   └── lit/
│       ├── src/              # 源代码
│       ├── examples/         # Vite 演示
│       │   ├── index.html
│       │   ├── main.ts
│       │   ├── vite.config.ts  # Vite配置 + Alias
│       │   └── package.json
│       └── ...
```

---

## 💡 开发技巧

### 1. 快速迭代

由于使用了 alias 配置，修改源码后会立即看到效果：

```bash
# 1. 启动演示
cd packages/core/examples
npx vite

# 2. 修改源码
edit ../src/core/AudioPlayer.ts

# 3. 保存后浏览器自动刷新
# 无需重新构建！
```

### 2. 调试源码

在浏览器开发者工具中：
1. 打开 Sources 标签
2. 找到 `packages/core/src` 目录
3. 设置断点
4. 开始调试

### 3. 切换构建产物

如果想测试构建产物而不是源码，修改 `vite.config.ts`：

```typescript
// 注释掉源码 alias
// '@ldesign/player-core': resolve(__dirname, '../src/index.ts'),

// 取消注释构建产物
'@ldesign/player-core': resolve(__dirname, '../es/index.js'),
```

### 4. 查看控制台日志

所有演示都包含详细的控制台日志：
- 启动信息
- Alias 配置
- 用户操作（播放、暂停、切换等）
- 错误信息

---

## 🔄 热更新支持

### Core 包

- ✅ TypeScript 热更新
- ✅ 样式热更新
- ✅ 完全刷新

### Vue 包

- ✅ Vue 组件热更新 (Vue HMR)
- ✅ TypeScript 热更新
- ✅ 样式热更新
- ✅ 状态保持

### React 包

- ✅ React 组件热更新 (React Fast Refresh)
- ✅ TypeScript 热更新
- ✅ 样式热更新
- ✅ 状态保持

### Lit 包

- ✅ Lit 组件热更新 (Lit HMR)
- ✅ TypeScript 热更新
- ✅ 样式热更新
- ✅ Custom Elements 更新

---

## 🎯 常见开发任务

### 添加新功能

1. 在 `src/` 目录修改源码
2. 在对应的 `examples/` 查看效果
3. 测试功能正常后，构建包

### 修复Bug

1. 在演示中复现Bug
2. 在浏览器开发者工具中调试
3. 修改源码
4. 验证修复

### 性能优化

1. 在演示中测试性能
2. 使用浏览器 Performance 工具分析
3. 优化源码
4. 对比优化前后的效果

---

## 📦 包依赖关系

```
player-vue
  └── @ldesign/player-core
      └── @ldesign/shared

player-react
  └── @ldesign/player-core
      └── @ldesign/shared

player-lit
  └── @ldesign/player-core
      └── @ldesign/shared
```

由于使用了 alias，开发时直接引用源码，无需构建依赖包。

---

## 🚨 注意事项

### 1. Alias 路径

确保 `vite.config.ts` 中的 alias 路径正确：

```typescript
// 正确 ✅
'@ldesign/player-core': resolve(__dirname, '../../core/src/index.ts')

// 错误 ❌ (路径不对)
'@ldesign/player-core': resolve(__dirname, '../core/src/index.ts')
```

### 2. TypeScript 配置

examples 的 TypeScript 配置会继承包的 `tsconfig.json`，确保类型检查正常。

### 3. 端口冲突

如果端口被占用，修改 `vite.config.ts` 中的 port：

```typescript
server: {
  port: 8085, // 改成其他端口
  open: true
}
```

### 4. 样式导入

React 包需要导入样式：

```typescript
import '@ldesign/player-react/styles'
```

---

## 🎨 演示页面说明

### Core 演示

- **文件**: `packages/core/examples/index.html`
- **入口**: `main.ts`
- **特点**: 
  - 纯 TypeScript
  - 波形动画
  - 播放列表
  - 音量控制

### Vue 演示

- **文件**: `packages/vue/examples/index.html`
- **入口**: `main.ts` → `App.vue`
- **特点**:
  - Vue 3 Composition API
  - AudioPlayer 组件
  - 响应式数据
  - 动态歌词

### React 演示

- **文件**: `packages/react/examples/index.html`
- **入口**: `main.tsx` → `App.tsx`
- **特点**:
  - React 18
  - Hooks (useState, useEffect)
  - AudioPlayer 组件
  - Fast Refresh

### Lit 演示

- **文件**: `packages/lit/examples/index.html`
- **入口**: `main.ts`
- **特点**:
  - Web Components
  - Shadow DOM
  - 双播放器（音频+视频）
  - 标准 API

---

## 📚 相关文档

- [主 README](./README.md) - 项目概览
- [快速开始](./START_HERE.md) - 快速开始指南
- [测试报告](./TEST_REPORT.md) - 构建和测试报告
- [功能测试](./FUNCTIONAL_TEST_REPORT.md) - 功能验证详情
- [验收报告](./✅_验收报告.md) - 验收结果

---

## 🎊 开发优势

使用 Vite + Alias 开发的优势：

1. ⚡ **极速启动** - Vite 冷启动速度快
2. 🔄 **即时热更新** - 修改源码立即生效
3. 🎯 **直接调试源码** - 无需构建即可调试
4. 🐛 **Source Map 支持** - 精确定位错误
5. 📦 **按需编译** - 只编译用到的模块
6. 🚀 **快速迭代** - 开发体验极佳

---

## 💻 命令速查

```bash
# 启动所有演示
./start-all-examples.ps1

# 启动单个演示
cd packages/core/examples && npx vite
cd packages/vue/examples && npx vite
cd packages/react/examples && npx vite
cd packages/lit/examples && npx vite

# 构建所有包
cd packages/core && node ../../../../tools/builder/bin/cli.js build
cd packages/vue && node ../../../../tools/builder/bin/cli.js build
cd packages/react && node ../../../../tools/builder/bin/cli.js build
cd packages/lit && node ../../../../tools/builder/bin/cli.js build
```

---

<p align="center">
  <strong>🎉 开始愉快的开发吧！🎉</strong>
</p>

<p align="center">
  修改源码，立即看到效果！
</p>
