# Player 项目构建和测试指南

## ✅ 项目重构完成

player 项目已成功重构为 monorepo 架构，配置文件已移至 `.ldesign` 目录。

## 📦 包结构

```
libraries/player/
├── packages/
│   ├── core/              # 核心包 ✅ 构建成功
│   │   ├── .ldesign/
│   │   │   └── ldesign.config.ts
│   │   ├── src/
│   │   ├── examples/
│   │   └── package.json
│   ├── vue/               # Vue 3 适配器
│   │   ├── .ldesign/
│   │   │   └── ldesign.config.ts
│   │   ├── src/
│   │   ├── examples/
│   │   └── package.json
│   ├── react/             # React 适配器
│   │   ├── .ldesign/
│   │   │   └── ldesign.config.ts
│   │   ├── src/
│   │   ├── examples/
│   │   └── package.json
│   └── lit/               # Lit Web Components
│       ├── .ldesign/
│       │   └── ldesign.config.ts
│       ├── src/
│       ├── examples/
│       └── package.json
├── package.json
└── README.md
```

## 🔧 构建配置

所有包的 `ldesign.config.ts` 已移至各自的 `.ldesign/` 目录。

构建脚本使用相对路径引用主项目的 `@ldesign/builder`：
```json
{
  "scripts": {
    "build": "node ../../../../tools/builder/bin/cli.js build"
  }
}
```

## 🚀 构建和测试

### 1. 构建单个包

```bash
# 构建 core 包
cd libraries/player/packages/core
node ../../../../tools/builder/bin/cli.js build

# 构建 vue 包
cd libraries/player/packages/vue
node ../../../../tools/builder/bin/cli.js build

# 构建 react 包
cd libraries/player/packages/react
node ../../../../tools/builder/bin/cli.js build

# 构建 lit 包
cd libraries/player/packages/lit
node ../../../../tools/builder/bin/cli.js build
```

### 2. 使用 pnpm 构建

```bash
# 构建所有包
cd libraries/player
pnpm -r build

# 构建特定包
pnpm --filter @ldesign/player-core build
pnpm --filter @ldesign/player-vue build
pnpm --filter @ldesign/player-react build
pnpm --filter @ldesign/player-lit build
```

### 3. 开发模式

```bash
# 监听模式构建
cd libraries/player/packages/core
node ../../../../tools/builder/bin/cli.js build --watch
```

## 📝 测试示例

每个包都包含演示示例，在各自的 `examples/` 目录下。

### Core 包示例

```bash
cd libraries/player/packages/core/examples
# 使用浏览器打开 audio-demo.html
start audio-demo.html
```

### Vue 包示例

```bash
cd libraries/player/packages/vue/examples
# 使用浏览器打开 audio-demo.html
start audio-demo.html
```

### React 包示例

```bash
cd libraries/player/packages/react/examples
# 使用浏览器打开 audio-demo.html
start audio-demo.html
```

### Lit 包示例

```bash
cd libraries/player/packages/lit/examples
# 使用浏览器打开 demo.html
start demo.html
```

## ✨ 构建产物

每个包构建后会生成以下目录：

- `es/` - ESM 模块（保持目录结构）
- `lib/` - CommonJS 模块（保持目录结构）
- `dist/` - UMD 捆绑包（用于 CDN）

## 📋 已知问题和解决方案

### 问题 1: workspace 依赖

由于 player 包需要引用主项目的 `@ldesign/shared` 等包，已删除 player 独立的 `pnpm-workspace.yaml`，使用主项目的 workspace 配置。

### 问题 2: @ldesign/builder 依赖

包的 package.json 已移除 `@ldesign/builder` 依赖，直接通过相对路径调用主项目的 builder CLI。

### 问题 3: 构建脚本路径

所有包的构建脚本都使用：
```bash
node ../../../../tools/builder/bin/cli.js build
```

## 🎯 核心包构建测试结果

✅ **@ldesign/player-core 构建成功！**

```
✓ 构建成功
------------------------------------------------------------
⏱ 耗时: 6.30s
📦 文件: 92 个
📊 总大小: 1.88 MB
============================================================
```

## 📚 使用文档

详细的使用文档请参考各包的 README.md：

- [Core 文档](./packages/core/README.md)
- [Vue 文档](./packages/vue/README.md)
- [React 文档](./packages/react/README.md)
- [Lit 文档](./packages/lit/README.md)

## 🔄 持续集成

TODO: 添加 CI/CD 配置，自动构建和测试所有包。

## 📮 问题反馈

如果遇到构建或使用问题，请查看：
1. [主 README](./README.md)
2. [重构完成报告](./REFACTORING_COMPLETE.md)
3. 各包的 README.md

---

**重构完成日期**: 2025-10-27
**测试日期**: 2025-10-27
**状态**: ✅ Core 包构建通过，其他包待测试

