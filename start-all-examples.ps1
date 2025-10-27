# 启动所有 Player 演示（Vite 开发模式）

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  启动所有 Player 演示 (Vite 开发服务器)" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "正在启动4个Vite开发服务器..." -ForegroundColor Yellow
Write-Host ""

# 启动 Core 演示
Write-Host "[1/4] 启动 Core 演示 (端口 8081)..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'D:\WorkBench\ldesign\libraries\player\packages\core\examples'; npx vite" -WindowStyle Minimized
Start-Sleep -Seconds 1

# 启动 Vue 演示
Write-Host "[2/4] 启动 Vue 演示 (端口 8082)..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'D:\WorkBench\ldesign\libraries\player\packages\vue\examples'; npx vite" -WindowStyle Minimized
Start-Sleep -Seconds 1

# 启动 React 演示
Write-Host "[3/4] 启动 React 演示 (端口 8083)..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'D:\WorkBench\ldesign\libraries\player\packages\react\examples'; npx vite" -WindowStyle Minimized
Start-Sleep -Seconds 1

# 启动 Lit 演示
Write-Host "[4/4] 启动 Lit 演示 (端口 8084)..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'D:\WorkBench\ldesign\libraries\player\packages\lit\examples'; npx vite" -WindowStyle Minimized

Write-Host ""
Write-Host "等待服务器启动..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  所有演示服务器已启动！" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "访问地址:" -ForegroundColor Yellow
Write-Host "  Core 演示:   http://localhost:8081" -ForegroundColor White
Write-Host "  Vue 演示:    http://localhost:8082" -ForegroundColor White
Write-Host "  React 演示:  http://localhost:8083" -ForegroundColor White
Write-Host "  Lit 演示:    http://localhost:8084" -ForegroundColor White
Write-Host ""

Write-Host "功能特点:" -ForegroundColor Yellow
Write-Host "  ⚡ Vite 快速开发服务器" -ForegroundColor Gray
Write-Host "  🔄 源码热更新 (HMR)" -ForegroundColor Gray
Write-Host "  🎯 Alias 配置，直接引用源码" -ForegroundColor Gray
Write-Host "  🐛 方便调试和开发" -ForegroundColor Gray
Write-Host ""

Write-Host "按 Ctrl+C 可停止所有服务器" -ForegroundColor Gray
Write-Host ""
