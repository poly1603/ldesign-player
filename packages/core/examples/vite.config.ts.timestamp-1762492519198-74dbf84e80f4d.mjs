// vite.config.ts
import { defineConfig } from "file:///D:/WorkBench/ldesign/node_modules/.pnpm/vite@5.4.21_@types+node@24.9.1_less@4.4.2_sass-embedded@1.93.2_sass@1.93.2_stylus@0.54.8_terser@5.44.0/node_modules/vite/dist/node/index.js";
import { resolve } from "path";
var __vite_injected_original_dirname = "D:\\WorkBench\\ldesign\\libraries\\player\\packages\\core\\examples";
var vite_config_default = defineConfig({
  resolve: {
    alias: {
      // 开发阶段直接引用源码，方便调试
      "@ldesign/player-core": resolve(__vite_injected_original_dirname, "../src/index.ts"),
      "@ldesign/player-core/audio": resolve(__vite_injected_original_dirname, "../src/audio"),
      "@ldesign/player-core/core": resolve(__vite_injected_original_dirname, "../src/core"),
      "@ldesign/player-core/video": resolve(__vite_injected_original_dirname, "../src/video"),
      "@ldesign/player-core/types": resolve(__vite_injected_original_dirname, "../src/types"),
      "@ldesign/player-core/utils": resolve(__vite_injected_original_dirname, "../src/utils")
      // 也可以指向构建产物（取消下面注释）
      // '@ldesign/player-core': resolve(__dirname, '../es/index.js'),
    }
  },
  server: {
    port: 8889,
    host: "0.0.0.0",
    // 监听所有接口，包括 IPv4
    open: "/index.html"
  },
  build: {
    outDir: "dist"
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJEOlxcXFxXb3JrQmVuY2hcXFxcbGRlc2lnblxcXFxsaWJyYXJpZXNcXFxccGxheWVyXFxcXHBhY2thZ2VzXFxcXGNvcmVcXFxcZXhhbXBsZXNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkQ6XFxcXFdvcmtCZW5jaFxcXFxsZGVzaWduXFxcXGxpYnJhcmllc1xcXFxwbGF5ZXJcXFxccGFja2FnZXNcXFxcY29yZVxcXFxleGFtcGxlc1xcXFx2aXRlLmNvbmZpZy50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vRDovV29ya0JlbmNoL2xkZXNpZ24vbGlicmFyaWVzL3BsYXllci9wYWNrYWdlcy9jb3JlL2V4YW1wbGVzL3ZpdGUuY29uZmlnLnRzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSAndml0ZSdcbmltcG9ydCB7IHJlc29sdmUgfSBmcm9tICdwYXRoJ1xuXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoe1xuICByZXNvbHZlOiB7XG4gICAgYWxpYXM6IHtcbiAgICAgIC8vIFx1NUYwMFx1NTNEMVx1OTYzNlx1NkJCNVx1NzZGNFx1NjNBNVx1NUYxNVx1NzUyOFx1NkU5MFx1NzgwMVx1RkYwQ1x1NjVCOVx1NEZCRlx1OEMwM1x1OEJENVxuICAgICAgJ0BsZGVzaWduL3BsYXllci1jb3JlJzogcmVzb2x2ZShfX2Rpcm5hbWUsICcuLi9zcmMvaW5kZXgudHMnKSxcbiAgICAgICdAbGRlc2lnbi9wbGF5ZXItY29yZS9hdWRpbyc6IHJlc29sdmUoX19kaXJuYW1lLCAnLi4vc3JjL2F1ZGlvJyksXG4gICAgICAnQGxkZXNpZ24vcGxheWVyLWNvcmUvY29yZSc6IHJlc29sdmUoX19kaXJuYW1lLCAnLi4vc3JjL2NvcmUnKSxcbiAgICAgICdAbGRlc2lnbi9wbGF5ZXItY29yZS92aWRlbyc6IHJlc29sdmUoX19kaXJuYW1lLCAnLi4vc3JjL3ZpZGVvJyksXG4gICAgICAnQGxkZXNpZ24vcGxheWVyLWNvcmUvdHlwZXMnOiByZXNvbHZlKF9fZGlybmFtZSwgJy4uL3NyYy90eXBlcycpLFxuICAgICAgJ0BsZGVzaWduL3BsYXllci1jb3JlL3V0aWxzJzogcmVzb2x2ZShfX2Rpcm5hbWUsICcuLi9zcmMvdXRpbHMnKSxcblxuICAgICAgLy8gXHU0RTVGXHU1M0VGXHU0RUU1XHU2MzA3XHU1NDExXHU2Nzg0XHU1RUZBXHU0RUE3XHU3MjY5XHVGRjA4XHU1M0Q2XHU2RDg4XHU0RTBCXHU5NzYyXHU2Q0U4XHU5MUNBXHVGRjA5XG4gICAgICAvLyAnQGxkZXNpZ24vcGxheWVyLWNvcmUnOiByZXNvbHZlKF9fZGlybmFtZSwgJy4uL2VzL2luZGV4LmpzJyksXG4gICAgfVxuICB9LFxuICBzZXJ2ZXI6IHtcbiAgICBwb3J0OiA4ODg5LFxuICAgIGhvc3Q6ICcwLjAuMC4wJywgLy8gXHU3NkQxXHU1NDJDXHU2MjQwXHU2NzA5XHU2M0E1XHU1M0UzXHVGRjBDXHU1MzA1XHU2MkVDIElQdjRcbiAgICBvcGVuOiAnL2luZGV4Lmh0bWwnXG4gIH0sXG4gIGJ1aWxkOiB7XG4gICAgb3V0RGlyOiAnZGlzdCdcbiAgfVxufSlcblxuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUFzWCxTQUFTLG9CQUFvQjtBQUNuWixTQUFTLGVBQWU7QUFEeEIsSUFBTSxtQ0FBbUM7QUFHekMsSUFBTyxzQkFBUSxhQUFhO0FBQUEsRUFDMUIsU0FBUztBQUFBLElBQ1AsT0FBTztBQUFBO0FBQUEsTUFFTCx3QkFBd0IsUUFBUSxrQ0FBVyxpQkFBaUI7QUFBQSxNQUM1RCw4QkFBOEIsUUFBUSxrQ0FBVyxjQUFjO0FBQUEsTUFDL0QsNkJBQTZCLFFBQVEsa0NBQVcsYUFBYTtBQUFBLE1BQzdELDhCQUE4QixRQUFRLGtDQUFXLGNBQWM7QUFBQSxNQUMvRCw4QkFBOEIsUUFBUSxrQ0FBVyxjQUFjO0FBQUEsTUFDL0QsOEJBQThCLFFBQVEsa0NBQVcsY0FBYztBQUFBO0FBQUE7QUFBQSxJQUlqRTtBQUFBLEVBQ0Y7QUFBQSxFQUNBLFFBQVE7QUFBQSxJQUNOLE1BQU07QUFBQSxJQUNOLE1BQU07QUFBQTtBQUFBLElBQ04sTUFBTTtBQUFBLEVBQ1I7QUFBQSxFQUNBLE9BQU87QUFBQSxJQUNMLFFBQVE7QUFBQSxFQUNWO0FBQ0YsQ0FBQzsiLAogICJuYW1lcyI6IFtdCn0K
