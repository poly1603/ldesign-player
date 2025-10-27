# 测试所有 player 包的构建
# 使用方法: ./test-build-all.ps1

Write-Host "🚀 开始测试所有 player 包的构建..." -ForegroundColor Cyan
Write-Host ""

$packages = @("core", "vue", "react", "lit")
$results = @{}
$startTime = Get-Date

foreach ($pkg in $packages) {
    Write-Host "=" * 60 -ForegroundColor Gray
    Write-Host "📦 构建 @ldesign/player-$pkg..." -ForegroundColor Yellow
    Write-Host "=" * 60 -ForegroundColor Gray
    
    $pkgStartTime = Get-Date
    $pkgPath = "packages/$pkg"
    
    Push-Location $pkgPath
    
    try {
        # 执行构建
        $output = node ../../../../tools/builder/bin/cli.js build 2>&1
        $exitCode = $LASTEXITCODE
        
        $pkgEndTime = Get-Date
        $duration = ($pkgEndTime - $pkgStartTime).TotalSeconds
        
        if ($exitCode -eq 0) {
            Write-Host "✅ $pkg 构建成功 (耗时: $($duration.ToString('0.00'))s)" -ForegroundColor Green
            $results[$pkg] = @{
                status = "成功"
                duration = $duration
                output = $output
            }
        } else {
            Write-Host "❌ $pkg 构建失败 (耗时: $($duration.ToString('0.00'))s)" -ForegroundColor Red
            $results[$pkg] = @{
                status = "失败"
                duration = $duration
                output = $output
            }
        }
    }
    catch {
        Write-Host "❌ $pkg 构建出错: $_" -ForegroundColor Red
        $results[$pkg] = @{
            status = "错误"
            duration = 0
            output = $_.Exception.Message
        }
    }
    finally {
        Pop-Location
    }
    
    Write-Host ""
}

$endTime = Get-Date
$totalDuration = ($endTime - $startTime).TotalSeconds

# 输出总结
Write-Host "=" * 60 -ForegroundColor Cyan
Write-Host "📊 构建总结" -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor Cyan

$successCount = 0
$failCount = 0

foreach ($pkg in $packages) {
    $result = $results[$pkg]
    $statusIcon = if ($result.status -eq "成功") { "✅" } else { "❌" }
    $statusColor = if ($result.status -eq "成功") { "Green" } else { "Red" }
    
    Write-Host "$statusIcon $pkg - " -NoNewline
    Write-Host "$($result.status) " -ForegroundColor $statusColor -NoNewline
    Write-Host "(耗时: $($result.duration.ToString('0.00'))s)"
    
    if ($result.status -eq "成功") {
        $successCount++
    } else {
        $failCount++
    }
}

Write-Host ""
Write-Host "总计: $successCount 成功, $failCount 失败" -ForegroundColor $(if ($failCount -eq 0) { "Green" } else { "Yellow" })
Write-Host "总耗时: $($totalDuration.ToString('0.00'))s" -ForegroundColor Cyan
Write-Host ""

if ($failCount -eq 0) {
    Write-Host "🎉 所有包构建成功！" -ForegroundColor Green
    exit 0
} else {
    Write-Host "⚠️  部分包构建失败，请检查日志。" -ForegroundColor Yellow
    exit 1
}

