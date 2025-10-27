# 测试所有 player 包的演示示例
# 使用方法: ./test-examples.ps1

Write-Host "测试所有 player 包的演示示例" -ForegroundColor Cyan
Write-Host ""

$examples = @(
    @{
        Name = "Core Audio Demo"
        Path = "packages/core/examples/audio-demo.html"
    },
    @{
        Name = "Vue Audio Demo"
        Path = "packages/vue/examples/audio-demo.html"
    },
    @{
        Name = "React Audio Demo"
        Path = "packages/react/examples/audio-demo.html"
    },
    @{
        Name = "Lit Player Demo"
        Path = "packages/lit/examples/demo.html"
    }
)

Write-Host "将在浏览器中打开以下演示:" -ForegroundColor Yellow
foreach ($example in $examples) {
    Write-Host "  - $($example.Name): $($example.Path)" -ForegroundColor Gray
}
Write-Host ""

Read-Host "按 Enter 键继续"

foreach ($example in $examples) {
    Write-Host ""
    Write-Host "打开: $($example.Name)..." -ForegroundColor Green
    $fullPath = Resolve-Path $example.Path
    Start-Process $fullPath
    Start-Sleep -Seconds 2
}

Write-Host ""
Write-Host "所有演示已在浏览器中打开！" -ForegroundColor Cyan
Write-Host ""
Write-Host "请在浏览器中测试以下功能:" -ForegroundColor Yellow
Write-Host "  1. 播放/暂停按钮是否正常工作" -ForegroundColor Gray
Write-Host "  2. 进度条拖动是否响应" -ForegroundColor Gray
Write-Host "  3. 音量控制是否正常" -ForegroundColor Gray
Write-Host "  4. 播放列表切换是否正常" -ForegroundColor Gray
Write-Host "  5. UI 显示是否正确" -ForegroundColor Gray
Write-Host ""


