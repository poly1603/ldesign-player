/**
 * 春节主题包 - 超精美版
 * 使用 Canvas 绘制精美的春节特色 UI 元素：精美灯笼、鞭炮串、福字、金色装饰等
 */

import { ThemePackage } from './ThemePackage';

export class SpringFestivalTheme implements ThemePackage {
  name = 'spring-festival';
  displayName = '春节主题';
  description = '精美春节主题，包含精美灯笼、鞭炮串、福字等传统元素';

  private readonly colors = {
    primary: '#DC143C',           // 深红色（中国红）
    secondary: '#FF4500',          // 橙红色
    accent: '#FFD700',            // 金色
    gold: '#FFC125',              // 亮金色
    lightGold: '#FFE87C',         // 浅金色
    darkGold: '#DAA520',          // 深金色
    darkRed: '#8B0000',           // 深红色
    controlBg: 'rgba(220, 20, 60, 0.95)',
    controlBgHover: 'rgba(220, 20, 60, 1)',
    background: 'rgba(139, 0, 0, 0.3)'
  };

  getColors() {
    return {
      primary: this.colors.primary,
      secondary: this.colors.secondary,
      controlBg: this.colors.controlBg,
      controlBgHover: this.colors.controlBgHover
    };
  }

  /**
   * 绘制精美的灯笼（播放按钮）- 完整形象版
   */
  drawPlayButton(canvas: HTMLCanvasElement, size: number, isHover = false): void {
    const ctx = canvas.getContext('2d')!;
    canvas.width = size;
    canvas.height = size;
    
    ctx.clearRect(0, 0, size, size);
    
    const centerX = size / 2;
    const centerY = size / 2;
    const radius = size / 2 - 4;
    
    // 悬停时的外圈光晕（更亮）
    if (isHover) {
      const outerGlow = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius * 1.5);
      outerGlow.addColorStop(0, 'rgba(255, 215, 0, 0.6)');
      outerGlow.addColorStop(0.4, 'rgba(255, 69, 0, 0.4)');
      outerGlow.addColorStop(0.7, 'rgba(255, 69, 0, 0.2)');
      outerGlow.addColorStop(1, 'rgba(255, 69, 0, 0)');
      ctx.fillStyle = outerGlow;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius * 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // 绘制阴影（更明显）
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.beginPath();
    ctx.ellipse(centerX + 2, centerY + 3, radius, radius * 1.15, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // 绘制顶部挂环（金色圆环）
    const topRingY = centerY - radius * 1.2;
    ctx.strokeStyle = this.colors.gold;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(centerX, topRingY, radius * 0.15, 0, Math.PI * 2);
    ctx.stroke();
    // 挂环高光
    ctx.strokeStyle = this.colors.lightGold;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(centerX, topRingY - 1, radius * 0.15, 0, Math.PI * 2);
    ctx.stroke();
    
    // 绘制灯笼顶部装饰（金色横条，更宽更立体）
    const topBarHeight = radius * 0.35;
    const topBarY = centerY - radius * 1.1;
    const topGoldGradient = ctx.createLinearGradient(0, topBarY - topBarHeight / 2, 0, topBarY + topBarHeight / 2);
    topGoldGradient.addColorStop(0, this.colors.lightGold);
    topGoldGradient.addColorStop(0.2, this.colors.gold);
    topGoldGradient.addColorStop(0.5, this.colors.darkGold);
    topGoldGradient.addColorStop(0.8, this.colors.gold);
    topGoldGradient.addColorStop(1, this.colors.lightGold);
    ctx.fillStyle = topGoldGradient;
    ctx.fillRect(centerX - radius * 0.7, topBarY - topBarHeight / 2, radius * 1.4, topBarHeight);
    
    // 顶部装饰的立体效果（高光和阴影）
    const topHighlight = ctx.createLinearGradient(0, topBarY - topBarHeight / 2, 0, topBarY);
    topHighlight.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
    topHighlight.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = topHighlight;
    ctx.fillRect(centerX - radius * 0.7, topBarY - topBarHeight / 2, radius * 1.4, topBarHeight / 2);
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(centerX - radius * 0.7, topBarY, radius * 1.4, topBarHeight / 2);
    
    // 绘制灯笼主体 - 多层渐变（更丰富，更立体）
    const mainGradient = ctx.createRadialGradient(
      centerX, centerY - radius * 0.3, 0,
      centerX, centerY, radius * 1.15
    );
    mainGradient.addColorStop(0, isHover ? '#FF6347' : '#FF4757');
    mainGradient.addColorStop(0.15, '#FF4500');
    mainGradient.addColorStop(0.35, '#DC143C');
    mainGradient.addColorStop(0.6, '#C41E3A');
    mainGradient.addColorStop(0.85, '#A52A2A');
    mainGradient.addColorStop(1, '#8B0000');
    
    ctx.fillStyle = mainGradient;
    ctx.beginPath();
    ctx.ellipse(centerX, centerY, radius, radius * 1.15, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // 绘制灯笼竖条纹（传统灯笼纹理，更明显，带渐变）
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 2.5;
    for (let i = 0; i < 14; i++) {
      const angle = (i * Math.PI * 2) / 14;
      const x1 = centerX + Math.cos(angle) * (radius * 0.12);
      const y1 = centerY + Math.sin(angle) * (radius * 0.12);
      const x2 = centerX + Math.cos(angle) * (radius * 0.98);
      const y2 = centerY + Math.sin(angle) * (radius * 0.98);
      
      // 竖线渐变（中间亮，两端暗）
      const lineGradient = ctx.createLinearGradient(x1, y1, x2, y2);
      lineGradient.addColorStop(0, 'rgba(255, 255, 255, 0.2)');
      lineGradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.5)');
      lineGradient.addColorStop(1, 'rgba(255, 255, 255, 0.2)');
      ctx.strokeStyle = lineGradient;
      
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }
    
    // 绘制高光效果（灯笼的光泽，更明显，模拟内部光源）
    const highlightGradient = ctx.createRadialGradient(
      centerX - radius * 0.4, centerY - radius * 0.5, 0,
      centerX - radius * 0.4, centerY - radius * 0.5, radius * 0.8
    );
    highlightGradient.addColorStop(0, 'rgba(255, 255, 255, 0.7)');
    highlightGradient.addColorStop(0.3, 'rgba(255, 255, 255, 0.4)');
    highlightGradient.addColorStop(0.6, 'rgba(255, 255, 255, 0.15)');
    highlightGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = highlightGradient;
    ctx.beginPath();
    ctx.ellipse(centerX - radius * 0.4, centerY - radius * 0.5, radius * 0.8, radius * 0.9, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // 绘制底部装饰（金色横条，带流苏效果）
    const bottomBarHeight = radius * 0.35;
    const bottomBarY = centerY + radius * 1.1;
    const bottomGoldGradient = ctx.createLinearGradient(0, bottomBarY - bottomBarHeight / 2, 0, bottomBarY + bottomBarHeight / 2);
    bottomGoldGradient.addColorStop(0, this.colors.gold);
    bottomGoldGradient.addColorStop(0.2, this.colors.darkGold);
    bottomGoldGradient.addColorStop(0.5, this.colors.gold);
    bottomGoldGradient.addColorStop(0.8, this.colors.lightGold);
    bottomGoldGradient.addColorStop(1, this.colors.gold);
    ctx.fillStyle = bottomGoldGradient;
    ctx.fillRect(centerX - radius * 0.7, bottomBarY - bottomBarHeight / 2, radius * 1.4, bottomBarHeight);
    
    // 底部装饰的立体效果
    const bottomHighlight = ctx.createLinearGradient(0, bottomBarY - bottomBarHeight / 2, 0, bottomBarY);
    bottomHighlight.addColorStop(0, 'rgba(255, 255, 255, 0.3)');
    bottomHighlight.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = bottomHighlight;
    ctx.fillRect(centerX - radius * 0.7, bottomBarY - bottomBarHeight / 2, radius * 1.4, bottomBarHeight / 2);
    
    // 绘制流苏（底部金色小点）
    ctx.fillStyle = this.colors.gold;
    const tasselCount = 8;
    const tasselSpacing = (radius * 1.4) / (tasselCount - 1);
    for (let i = 0; i < tasselCount; i++) {
      const tasselX = centerX - radius * 0.7 + i * tasselSpacing;
      const tasselY = bottomBarY + bottomBarHeight / 2 + radius * 0.1;
      ctx.beginPath();
      ctx.arc(tasselX, tasselY, radius * 0.06, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // 绘制播放图标（三角形，带金色边框和光晕）
    const iconSize = size * 0.36;
    const iconX = centerX + iconSize * 0.1;
    const iconY = centerY;
    
    // 图标光晕（金色，更亮）
    const iconGlow = ctx.createRadialGradient(iconX, iconY, 0, iconX, iconY, iconSize * 0.9);
    iconGlow.addColorStop(0, 'rgba(255, 215, 0, 0.8)');
    iconGlow.addColorStop(0.4, 'rgba(255, 215, 0, 0.5)');
    iconGlow.addColorStop(0.7, 'rgba(255, 215, 0, 0.2)');
    iconGlow.addColorStop(1, 'rgba(255, 215, 0, 0)');
    ctx.fillStyle = iconGlow;
    ctx.beginPath();
    ctx.moveTo(iconX - iconSize * 0.3, iconY - iconSize * 0.5);
    ctx.lineTo(iconX - iconSize * 0.3, iconY + iconSize * 0.5);
    ctx.lineTo(iconX + iconSize * 0.65, iconY);
    ctx.closePath();
    ctx.fill();
    
    // 图标阴影（更明显）
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.beginPath();
    ctx.moveTo(iconX + 1.5, iconY - iconSize * 0.5 + 1.5);
    ctx.lineTo(iconX + 1.5, iconY + iconSize * 0.5 + 1.5);
    ctx.lineTo(iconX + iconSize * 0.65 + 1.5, iconY + 1.5);
    ctx.closePath();
    ctx.fill();
    
    // 图标主体（白色，更亮，带渐变）
    const iconGradient = ctx.createLinearGradient(iconX - iconSize * 0.3, iconY, iconX + iconSize * 0.65, iconY);
    iconGradient.addColorStop(0, '#FFFFFF');
    iconGradient.addColorStop(0.5, '#F0F0F0');
    iconGradient.addColorStop(1, '#FFFFFF');
    ctx.fillStyle = iconGradient;
    ctx.beginPath();
    ctx.moveTo(iconX, iconY - iconSize * 0.5);
    ctx.lineTo(iconX, iconY + iconSize * 0.5);
    ctx.lineTo(iconX + iconSize * 0.65, iconY);
    ctx.closePath();
    ctx.fill();
    
    // 金色边框装饰（更粗，带渐变）
    const iconBorderGradient = ctx.createLinearGradient(iconX - iconSize * 0.3, iconY, iconX + iconSize * 0.65, iconY);
    iconBorderGradient.addColorStop(0, this.colors.lightGold);
    iconBorderGradient.addColorStop(0.5, this.colors.gold);
    iconBorderGradient.addColorStop(1, this.colors.lightGold);
    ctx.strokeStyle = iconBorderGradient;
    ctx.lineWidth = 3.5;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(iconX, iconY - iconSize * 0.5);
    ctx.lineTo(iconX, iconY + iconSize * 0.5);
    ctx.lineTo(iconX + iconSize * 0.65, iconY);
    ctx.closePath();
    ctx.stroke();
  }

  /**
   * 绘制精美的灯笼（暂停按钮）- 完整形象版
   */
  drawPauseButton(canvas: HTMLCanvasElement, size: number, isHover = false): void {
    const ctx = canvas.getContext('2d')!;
    canvas.width = size;
    canvas.height = size;
    
    ctx.clearRect(0, 0, size, size);
    
    const centerX = size / 2;
    const centerY = size / 2;
    const radius = size / 2 - 4;
    
    // 悬停时的外圈光晕（更亮）
    if (isHover) {
      const outerGlow = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius * 1.5);
      outerGlow.addColorStop(0, 'rgba(255, 215, 0, 0.6)');
      outerGlow.addColorStop(0.4, 'rgba(255, 69, 0, 0.4)');
      outerGlow.addColorStop(0.7, 'rgba(255, 69, 0, 0.2)');
      outerGlow.addColorStop(1, 'rgba(255, 69, 0, 0)');
      ctx.fillStyle = outerGlow;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius * 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // 绘制阴影（更明显）
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.beginPath();
    ctx.ellipse(centerX + 2, centerY + 3, radius, radius * 1.15, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // 绘制顶部挂环（金色圆环）
    const topRingY = centerY - radius * 1.2;
    ctx.strokeStyle = this.colors.gold;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(centerX, topRingY, radius * 0.15, 0, Math.PI * 2);
    ctx.stroke();
    // 挂环高光
    ctx.strokeStyle = this.colors.lightGold;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(centerX, topRingY - 1, radius * 0.15, 0, Math.PI * 2);
    ctx.stroke();
    
    // 绘制灯笼顶部装饰（金色横条，更宽更立体）
    const topBarHeight = radius * 0.35;
    const topBarY = centerY - radius * 1.1;
    const topGoldGradient = ctx.createLinearGradient(0, topBarY - topBarHeight / 2, 0, topBarY + topBarHeight / 2);
    topGoldGradient.addColorStop(0, this.colors.lightGold);
    topGoldGradient.addColorStop(0.2, this.colors.gold);
    topGoldGradient.addColorStop(0.5, this.colors.darkGold);
    topGoldGradient.addColorStop(0.8, this.colors.gold);
    topGoldGradient.addColorStop(1, this.colors.lightGold);
    ctx.fillStyle = topGoldGradient;
    ctx.fillRect(centerX - radius * 0.7, topBarY - topBarHeight / 2, radius * 1.4, topBarHeight);
    
    // 顶部装饰的立体效果（高光和阴影）
    const topHighlight = ctx.createLinearGradient(0, topBarY - topBarHeight / 2, 0, topBarY);
    topHighlight.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
    topHighlight.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = topHighlight;
    ctx.fillRect(centerX - radius * 0.7, topBarY - topBarHeight / 2, radius * 1.4, topBarHeight / 2);
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(centerX - radius * 0.7, topBarY, radius * 1.4, topBarHeight / 2);
    
    // 绘制灯笼主体 - 多层渐变（更丰富，更立体）
    const mainGradient = ctx.createRadialGradient(
      centerX, centerY - radius * 0.3, 0,
      centerX, centerY, radius * 1.15
    );
    mainGradient.addColorStop(0, isHover ? '#FF6347' : '#FF4757');
    mainGradient.addColorStop(0.15, '#FF4500');
    mainGradient.addColorStop(0.35, '#DC143C');
    mainGradient.addColorStop(0.6, '#C41E3A');
    mainGradient.addColorStop(0.85, '#A52A2A');
    mainGradient.addColorStop(1, '#8B0000');
    
    ctx.fillStyle = mainGradient;
    ctx.beginPath();
    ctx.ellipse(centerX, centerY, radius, radius * 1.15, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // 绘制灯笼竖条纹（传统灯笼纹理，更明显，带渐变）
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 2.5;
    for (let i = 0; i < 14; i++) {
      const angle = (i * Math.PI * 2) / 14;
      const x1 = centerX + Math.cos(angle) * (radius * 0.12);
      const y1 = centerY + Math.sin(angle) * (radius * 0.12);
      const x2 = centerX + Math.cos(angle) * (radius * 0.98);
      const y2 = centerY + Math.sin(angle) * (radius * 0.98);
      
      // 竖线渐变（中间亮，两端暗）
      const lineGradient = ctx.createLinearGradient(x1, y1, x2, y2);
      lineGradient.addColorStop(0, 'rgba(255, 255, 255, 0.2)');
      lineGradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.5)');
      lineGradient.addColorStop(1, 'rgba(255, 255, 255, 0.2)');
      ctx.strokeStyle = lineGradient;
      
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }
    
    // 绘制高光效果（灯笼的光泽，更明显，模拟内部光源）
    const highlightGradient = ctx.createRadialGradient(
      centerX - radius * 0.4, centerY - radius * 0.5, 0,
      centerX - radius * 0.4, centerY - radius * 0.5, radius * 0.8
    );
    highlightGradient.addColorStop(0, 'rgba(255, 255, 255, 0.7)');
    highlightGradient.addColorStop(0.3, 'rgba(255, 255, 255, 0.4)');
    highlightGradient.addColorStop(0.6, 'rgba(255, 255, 255, 0.15)');
    highlightGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = highlightGradient;
    ctx.beginPath();
    ctx.ellipse(centerX - radius * 0.4, centerY - radius * 0.5, radius * 0.8, radius * 0.9, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // 绘制底部装饰（金色横条，带流苏效果）
    const bottomBarHeight = radius * 0.35;
    const bottomBarY = centerY + radius * 1.1;
    const bottomGoldGradient = ctx.createLinearGradient(0, bottomBarY - bottomBarHeight / 2, 0, bottomBarY + bottomBarHeight / 2);
    bottomGoldGradient.addColorStop(0, this.colors.gold);
    bottomGoldGradient.addColorStop(0.2, this.colors.darkGold);
    bottomGoldGradient.addColorStop(0.5, this.colors.gold);
    bottomGoldGradient.addColorStop(0.8, this.colors.lightGold);
    bottomGoldGradient.addColorStop(1, this.colors.gold);
    ctx.fillStyle = bottomGoldGradient;
    ctx.fillRect(centerX - radius * 0.7, bottomBarY - bottomBarHeight / 2, radius * 1.4, bottomBarHeight);
    
    // 底部装饰的立体效果
    const bottomHighlight = ctx.createLinearGradient(0, bottomBarY - bottomBarHeight / 2, 0, bottomBarY);
    bottomHighlight.addColorStop(0, 'rgba(255, 255, 255, 0.3)');
    bottomHighlight.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = bottomHighlight;
    ctx.fillRect(centerX - radius * 0.7, bottomBarY - bottomBarHeight / 2, radius * 1.4, bottomBarHeight / 2);
    
    // 绘制流苏（底部金色小点）
    ctx.fillStyle = this.colors.gold;
    const tasselCount = 8;
    const tasselSpacing = (radius * 1.4) / (tasselCount - 1);
    for (let i = 0; i < tasselCount; i++) {
      const tasselX = centerX - radius * 0.7 + i * tasselSpacing;
      const tasselY = bottomBarY + bottomBarHeight / 2 + radius * 0.1;
      ctx.beginPath();
      ctx.arc(tasselX, tasselY, radius * 0.06, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // 绘制暂停图标（两个竖条，带金色边框和光晕）
    const barWidth = size * 0.13;
    const barHeight = size * 0.46;
    const gap = size * 0.2;
    const barX = centerX - gap / 2 - barWidth;
    const barY = centerY - barHeight / 2;
    
    // 图标光晕（金色，更亮）
    const iconGlow = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, barHeight * 0.8);
    iconGlow.addColorStop(0, 'rgba(255, 215, 0, 0.8)');
    iconGlow.addColorStop(0.4, 'rgba(255, 215, 0, 0.5)');
    iconGlow.addColorStop(0.7, 'rgba(255, 215, 0, 0.2)');
    iconGlow.addColorStop(1, 'rgba(255, 215, 0, 0)');
    ctx.fillStyle = iconGlow;
    ctx.fillRect(barX - barWidth * 0.5, barY - barHeight * 0.1, barWidth * 2 + gap, barHeight * 1.2);
    
    // 阴影（更明显）
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(barX + 1.5, barY + 1.5, barWidth, barHeight);
    ctx.fillRect(barX + gap + 1.5, barY + 1.5, barWidth, barHeight);
    
    // 主体（白色，带渐变）
    const barGradient = ctx.createLinearGradient(barX, barY, barX + barWidth, barY);
    barGradient.addColorStop(0, '#FFFFFF');
    barGradient.addColorStop(0.5, '#F0F0F0');
    barGradient.addColorStop(1, '#FFFFFF');
    ctx.fillStyle = barGradient;
    ctx.fillRect(barX, barY, barWidth, barHeight);
    ctx.fillRect(barX + gap, barY, barWidth, barHeight);
    
    // 金色边框（更粗，带渐变）
    const barBorderGradient = ctx.createLinearGradient(barX, barY, barX + barWidth, barY);
    barBorderGradient.addColorStop(0, this.colors.lightGold);
    barBorderGradient.addColorStop(0.5, this.colors.gold);
    barBorderGradient.addColorStop(1, this.colors.lightGold);
    ctx.strokeStyle = barBorderGradient;
    ctx.lineWidth = 3.5;
    ctx.lineJoin = 'round';
    ctx.strokeRect(barX, barY, barWidth, barHeight);
    ctx.strokeRect(barX + gap, barY, barWidth, barHeight);
  }

  /**
   * 绘制精美的鞭炮串进度条背景（更立体，更像真正的鞭炮）
   */
  drawProgressBarBackground(canvas: HTMLCanvasElement, width: number, height: number): void {
    const ctx = canvas.getContext('2d')!;
    canvas.width = width;
    canvas.height = height;
    
    ctx.clearRect(0, 0, width, height);
    
    // 绘制深红色背景（带渐变）
    const bgGradient = ctx.createLinearGradient(0, 0, 0, height);
    bgGradient.addColorStop(0, 'rgba(139, 0, 0, 0.5)');
    bgGradient.addColorStop(0.5, 'rgba(139, 0, 0, 0.7)');
    bgGradient.addColorStop(1, 'rgba(139, 0, 0, 0.9)');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, width, height);
    
    // 绘制鞭炮串（更立体，每个鞭炮都是圆柱体）
    const firecrackerWidth = height * 1.5;
    const firecrackerGap = height * 0.5;
    const totalWidth = firecrackerWidth + firecrackerGap;
    
    let x = -firecrackerWidth / 2;
    while (x < width + firecrackerWidth) {
      // 单个鞭炮的渐变（圆柱体效果）
      const firecrackerGradient = ctx.createLinearGradient(x, 0, x + firecrackerWidth, 0);
      firecrackerGradient.addColorStop(0, '#8B0000');
      firecrackerGradient.addColorStop(0.15, '#A52A2A');
      firecrackerGradient.addColorStop(0.3, '#DC143C');
      firecrackerGradient.addColorStop(0.5, '#FF4500');
      firecrackerGradient.addColorStop(0.7, '#DC143C');
      firecrackerGradient.addColorStop(0.85, '#A52A2A');
      firecrackerGradient.addColorStop(1, '#8B0000');
      
      // 绘制鞭炮主体
      ctx.fillStyle = firecrackerGradient;
      ctx.fillRect(x, height * 0.05, firecrackerWidth, height * 0.9);
      
      // 绘制鞭炮的立体效果（高光和阴影）
      // 左侧阴影
      const leftShadow = ctx.createLinearGradient(x, 0, x + firecrackerWidth * 0.2, 0);
      leftShadow.addColorStop(0, 'rgba(0, 0, 0, 0.3)');
      leftShadow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = leftShadow;
      ctx.fillRect(x, height * 0.05, firecrackerWidth * 0.2, height * 0.9);
      
      // 右侧高光
      const rightHighlight = ctx.createLinearGradient(x + firecrackerWidth * 0.8, 0, x + firecrackerWidth, 0);
      rightHighlight.addColorStop(0, 'rgba(255, 255, 255, 0.2)');
      rightHighlight.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = rightHighlight;
      ctx.fillRect(x + firecrackerWidth * 0.8, height * 0.05, firecrackerWidth * 0.2, height * 0.9);
      
      // 顶部高光
      const topHighlight = ctx.createLinearGradient(0, height * 0.05, 0, height * 0.25);
      topHighlight.addColorStop(0, 'rgba(255, 255, 255, 0.15)');
      topHighlight.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = topHighlight;
      ctx.fillRect(x, height * 0.05, firecrackerWidth, height * 0.2);
      
      // 鞭炮纹理（竖线分割，更明显）
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.lineWidth = 1.5;
      for (let i = 1; i < 5; i++) {
        ctx.beginPath();
        ctx.moveTo(x + (firecrackerWidth / 5) * i, height * 0.05);
        ctx.lineTo(x + (firecrackerWidth / 5) * i, height * 0.95);
        ctx.stroke();
      }
      
      // 顶部和底部金色装饰（引线，更明显）
      const goldGradient = ctx.createLinearGradient(0, 0, 0, height * 0.2);
      goldGradient.addColorStop(0, this.colors.lightGold);
      goldGradient.addColorStop(0.5, this.colors.gold);
      goldGradient.addColorStop(1, this.colors.darkGold);
      ctx.fillStyle = goldGradient;
      ctx.fillRect(x + firecrackerWidth * 0.35, 0, firecrackerWidth * 0.3, height * 0.2);
      ctx.fillRect(x + firecrackerWidth * 0.35, height * 0.8, firecrackerWidth * 0.3, height * 0.2);
      
      x += totalWidth;
    }
    
    // 添加整体渐变遮罩（让背景更柔和）
    const overlayGradient = ctx.createLinearGradient(0, 0, width, 0);
    overlayGradient.addColorStop(0, 'rgba(139, 0, 0, 0.25)');
    overlayGradient.addColorStop(0.5, 'rgba(139, 0, 0, 0.15)');
    overlayGradient.addColorStop(1, 'rgba(139, 0, 0, 0.25)');
    ctx.fillStyle = overlayGradient;
    ctx.fillRect(0, 0, width, height);
  }

  /**
   * 绘制已播放进度（金色填充，象征财富和好运，更明显）
   */
  drawProgressBarFill(canvas: HTMLCanvasElement, width: number, height: number, progress: number): void {
    const ctx = canvas.getContext('2d')!;
    canvas.width = width;
    canvas.height = height;
    
    ctx.clearRect(0, 0, width, height);
    
    const fillWidth = width * progress;
    if (fillWidth <= 0) return;
    
    // 金色渐变填充（多层渐变，更丰富，更亮）
    const fillGradient = ctx.createLinearGradient(0, 0, fillWidth, 0);
    fillGradient.addColorStop(0, '#FFD700');
    fillGradient.addColorStop(0.2, '#FFE87C');
    fillGradient.addColorStop(0.4, '#FFC125');
    fillGradient.addColorStop(0.6, '#FFD700');
    fillGradient.addColorStop(0.8, '#FFE87C');
    fillGradient.addColorStop(1, '#FFC125');
    
    ctx.fillStyle = fillGradient;
    ctx.fillRect(0, height * 0.05, fillWidth, height * 0.9);
    
    // 添加金色高光（顶部，更亮）
    const highlightGradient = ctx.createLinearGradient(0, height * 0.05, 0, height * 0.35);
    highlightGradient.addColorStop(0, 'rgba(255, 255, 255, 0.7)');
    highlightGradient.addColorStop(0.3, 'rgba(255, 255, 255, 0.4)');
    highlightGradient.addColorStop(0.6, 'rgba(255, 215, 0, 0.5)');
    highlightGradient.addColorStop(1, 'rgba(255, 215, 0, 0.2)');
    ctx.fillStyle = highlightGradient;
    ctx.fillRect(0, height * 0.05, fillWidth, height * 0.3);
    
    // 添加纹理（模拟鞭炮串的竖线，更明显）
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 1.5;
    const segmentWidth = height * 2;
    for (let x = 0; x < fillWidth; x += segmentWidth) {
      ctx.beginPath();
      ctx.moveTo(x, height * 0.05);
      ctx.lineTo(x, height * 0.95);
      ctx.stroke();
    }
    
    // 添加底部阴影（增加立体感）
    const shadowGradient = ctx.createLinearGradient(0, height * 0.7, 0, height * 0.95);
    shadowGradient.addColorStop(0, 'rgba(139, 0, 0, 0.4)');
    shadowGradient.addColorStop(1, 'rgba(139, 0, 0, 0.6)');
    ctx.fillStyle = shadowGradient;
    ctx.fillRect(0, height * 0.7, fillWidth, height * 0.25);
    
    // 添加闪烁效果（金色光点）
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    const sparkleCount = Math.floor(fillWidth / (height * 3));
    for (let i = 0; i < sparkleCount; i++) {
      const sparkleX = (fillWidth / sparkleCount) * i + (fillWidth / sparkleCount) * 0.5;
      const sparkleY = height * 0.5;
      ctx.beginPath();
      ctx.arc(sparkleX, sparkleY, height * 0.08, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  /**
   * 绘制进度条滑块（精美的鞭炮，更立体）
   */
  drawProgressBarThumb(canvas: HTMLCanvasElement, size: number, progress = 0, isHover = false): void {
    const ctx = canvas.getContext('2d')!;
    canvas.width = size;
    canvas.height = size;
    
    ctx.clearRect(0, 0, size, size);
    
    const centerX = size / 2;
    const centerY = size / 2;
    const radius = size / 2 - 2;
    
    // 悬停时的光晕效果（鞭炮爆炸效果，更大更亮）
    if (isHover) {
      const glowGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius * 2);
      glowGradient.addColorStop(0, 'rgba(255, 215, 0, 0.8)');
      glowGradient.addColorStop(0.2, 'rgba(255, 69, 0, 0.6)');
      glowGradient.addColorStop(0.4, 'rgba(220, 20, 60, 0.4)');
      glowGradient.addColorStop(0.6, 'rgba(220, 20, 60, 0.2)');
      glowGradient.addColorStop(1, 'rgba(220, 20, 60, 0)');
      ctx.fillStyle = glowGradient;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius * 2, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // 绘制阴影
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.beginPath();
    ctx.arc(centerX + 2, centerY + 2, radius * 0.95, 0, Math.PI * 2);
    ctx.fill();
    
    // 绘制外圈（金色边框，更粗）
    const borderGradient = ctx.createRadialGradient(centerX, centerY, radius * 0.7, centerX, centerY, radius);
    borderGradient.addColorStop(0, this.colors.lightGold);
    borderGradient.addColorStop(0.5, this.colors.gold);
    borderGradient.addColorStop(1, this.colors.darkGold);
    ctx.strokeStyle = borderGradient;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.stroke();
    
    // 绘制主体（红色渐变，模拟鞭炮，更立体）
    const mainGradient = ctx.createRadialGradient(
      centerX, centerY - radius * 0.25, 0,
      centerX, centerY, radius * 0.95
    );
    mainGradient.addColorStop(0, '#FF6347');
    mainGradient.addColorStop(0.2, '#FF4500');
    mainGradient.addColorStop(0.4, '#DC143C');
    mainGradient.addColorStop(0.7, '#C41E3A');
    mainGradient.addColorStop(1, '#8B0000');
    
    ctx.fillStyle = mainGradient;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius * 0.95, 0, Math.PI * 2);
    ctx.fill();
    
    // 添加高光（顶部，更明显）
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.beginPath();
    ctx.arc(centerX - radius * 0.35, centerY - radius * 0.35, radius * 0.45, 0, Math.PI * 2);
    ctx.fill();
    
    // 绘制中心点（金色引线，更立体）
    const centerGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius * 0.28);
    centerGradient.addColorStop(0, this.colors.lightGold);
    centerGradient.addColorStop(0.5, this.colors.gold);
    centerGradient.addColorStop(1, this.colors.darkGold);
    ctx.fillStyle = centerGradient;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius * 0.28, 0, Math.PI * 2);
    ctx.fill();
    
    // 中心点高光
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.beginPath();
    ctx.arc(centerX - radius * 0.1, centerY - radius * 0.1, radius * 0.1, 0, Math.PI * 2);
    ctx.fill();
    
    // 添加纹理（竖线，更明显）
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 8; i++) {
      const angle = (i * Math.PI * 2) / 8;
      const x1 = centerX + Math.cos(angle) * (radius * 0.25);
      const y1 = centerY + Math.sin(angle) * (radius * 0.25);
      const x2 = centerX + Math.cos(angle) * (radius * 0.9);
      const y2 = centerY + Math.sin(angle) * (radius * 0.9);
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }
    
    // 悬停时的闪烁效果（金色光环，更明显）
    if (isHover) {
      ctx.strokeStyle = this.colors.gold;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius * 0.88, 0, Math.PI * 2);
      ctx.stroke();
      
      // 添加闪烁点
      ctx.fillStyle = this.colors.lightGold;
      for (let i = 0; i < 8; i++) {
        const angle = (i * Math.PI * 2) / 8;
        const x = centerX + Math.cos(angle) * (radius * 0.88);
        const y = centerY + Math.sin(angle) * (radius * 0.88);
        ctx.beginPath();
        ctx.arc(x, y, radius * 0.08, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  /**
   * 绘制音量按钮（精美版 - 带春节元素）
   */
  drawVolumeButton(canvas: HTMLCanvasElement, size: number, volume: number, isMuted: boolean, isHover = false): void {
    const ctx = canvas.getContext('2d')!;
    canvas.width = size;
    canvas.height = size;
    
    ctx.clearRect(0, 0, size, size);
    
    const centerX = size / 2;
    const centerY = size / 2;
    const radius = size / 2 - 2;
    
    // 悬停时的外圈光晕
    if (isHover) {
      const outerGlow = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius * 1.3);
      outerGlow.addColorStop(0, 'rgba(255, 215, 0, 0.4)');
      outerGlow.addColorStop(0.5, 'rgba(255, 69, 0, 0.2)');
      outerGlow.addColorStop(1, 'rgba(255, 69, 0, 0)');
      ctx.fillStyle = outerGlow;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius * 1.3, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // 绘制阴影
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.beginPath();
    ctx.arc(centerX + 1, centerY + 1, radius, 0, Math.PI * 2);
    ctx.fill();
    
    // 绘制背景（红色圆形，带渐变）
    const bgGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
    bgGradient.addColorStop(0, isHover ? '#FF6347' : '#FF4757');
    bgGradient.addColorStop(0.3, '#FF4500');
    bgGradient.addColorStop(0.6, '#DC143C');
    bgGradient.addColorStop(0.9, '#C41E3A');
    bgGradient.addColorStop(1, '#8B0000');
    ctx.fillStyle = bgGradient;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fill();
    
    // 金色边框（更粗，带渐变）
    const borderGradient = ctx.createLinearGradient(centerX - radius, centerY, centerX + radius, centerY);
    borderGradient.addColorStop(0, this.colors.lightGold);
    borderGradient.addColorStop(0.5, this.colors.gold);
    borderGradient.addColorStop(1, this.colors.lightGold);
    ctx.strokeStyle = borderGradient;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.stroke();
    
    // 高光（更明显）
    const highlightGradient = ctx.createRadialGradient(
      centerX - radius * 0.35, centerY - radius * 0.35, 0,
      centerX - radius * 0.35, centerY - radius * 0.35, radius * 0.4
    );
    highlightGradient.addColorStop(0, 'rgba(255, 255, 255, 0.6)');
    highlightGradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.3)');
    highlightGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = highlightGradient;
    ctx.beginPath();
    ctx.arc(centerX - radius * 0.35, centerY - radius * 0.35, radius * 0.4, 0, Math.PI * 2);
    ctx.fill();
    
    // 绘制音量图标（更精美）
    ctx.strokeStyle = '#FFFFFF';
    ctx.fillStyle = '#FFFFFF';
    ctx.lineWidth = 3.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    if (isMuted) {
      // 静音：绘制带斜线的喇叭（更精美）
      const baseX = size * 0.3;
      const baseY = size * 0.5;
      
      // 喇叭主体（带渐变）
      const speakerGradient = ctx.createLinearGradient(baseX, baseY - size * 0.2, baseX, baseY + size * 0.2);
      speakerGradient.addColorStop(0, '#FFFFFF');
      speakerGradient.addColorStop(0.5, '#F0F0F0');
      speakerGradient.addColorStop(1, '#FFFFFF');
      ctx.fillStyle = speakerGradient;
      
      ctx.beginPath();
      ctx.moveTo(baseX, baseY);
      ctx.lineTo(baseX + size * 0.2, baseY - size * 0.2);
      ctx.lineTo(baseX + size * 0.2, baseY + size * 0.2);
      ctx.closePath();
      ctx.fill();
      
      // 喇叭口（更宽）
      ctx.beginPath();
      ctx.moveTo(baseX + size * 0.2, baseY - size * 0.14);
      ctx.lineTo(baseX + size * 0.42, baseY - size * 0.26);
      ctx.lineTo(baseX + size * 0.42, baseY + size * 0.26);
      ctx.lineTo(baseX + size * 0.2, baseY + size * 0.14);
      ctx.closePath();
      ctx.fill();
      
      // 金色边框
      ctx.strokeStyle = this.colors.gold;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(baseX, baseY);
      ctx.lineTo(baseX + size * 0.2, baseY - size * 0.2);
      ctx.lineTo(baseX + size * 0.2, baseY + size * 0.2);
      ctx.closePath();
      ctx.stroke();
      
      // 斜线（禁止，红色，更粗）
      ctx.strokeStyle = '#FF0000';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(baseX + size * 0.1, baseY - size * 0.15);
      ctx.lineTo(baseX + size * 0.45, baseY + size * 0.15);
      ctx.stroke();
      
      // 斜线阴影
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(baseX + size * 0.1 + 1, baseY - size * 0.15 + 1);
      ctx.lineTo(baseX + size * 0.45 + 1, baseY + size * 0.15 + 1);
      ctx.stroke();
    } else {
      // 有声音：绘制精美的波形（带金色装饰）
      const baseX = size * 0.24;
      const centerY = size / 2;
      const waveHeight = size * 0.16;
      
      // 绘制波形（更粗，更明显）
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 4;
      
      // 左波形（基础波形）
      ctx.beginPath();
      ctx.moveTo(baseX, centerY);
      ctx.lineTo(baseX + size * 0.12, centerY - waveHeight);
      ctx.lineTo(baseX + size * 0.16, centerY);
      ctx.lineTo(baseX + size * 0.24, centerY + waveHeight);
      ctx.lineTo(baseX + size * 0.28, centerY);
      ctx.stroke();
      
      // 中波形（根据音量）
      if (volume > 0.3) {
        ctx.beginPath();
        ctx.moveTo(baseX + size * 0.32, centerY);
        ctx.lineTo(baseX + size * 0.44, centerY - waveHeight * 1.3);
        ctx.lineTo(baseX + size * 0.48, centerY);
        ctx.lineTo(baseX + size * 0.56, centerY + waveHeight * 1.3);
        ctx.lineTo(baseX + size * 0.6, centerY);
        ctx.stroke();
      }
      
      // 右波形（高音量）
      if (volume > 0.6) {
        ctx.beginPath();
        ctx.moveTo(baseX + size * 0.64, centerY);
        ctx.lineTo(baseX + size * 0.76, centerY - waveHeight * 1.5);
        ctx.lineTo(baseX + size * 0.8, centerY);
        ctx.lineTo(baseX + size * 0.88, centerY + waveHeight * 1.5);
        ctx.lineTo(baseX + size * 0.92, centerY);
        ctx.stroke();
      }
      
      // 添加金色高光点（装饰）
      ctx.fillStyle = this.colors.gold;
      const dotCount = Math.floor(volume * 5) + 1;
      for (let i = 0; i < dotCount && i < 5; i++) {
        const dotX = baseX + size * 0.15 + i * size * 0.15;
        const dotY = centerY + (i % 2 === 0 ? -waveHeight * 0.3 : waveHeight * 0.3);
        ctx.beginPath();
        ctx.arc(dotX, dotY, size * 0.04, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  /**
   * 绘制页面全屏按钮（精美版 - 带春节元素）
   */
  drawPageFullscreenButton(canvas: HTMLCanvasElement, size: number, isPageFullscreen: boolean, isHover = false): void {
    const ctx = canvas.getContext('2d')!;
    canvas.width = size;
    canvas.height = size;
    
    ctx.clearRect(0, 0, size, size);
    
    const centerX = size / 2;
    const centerY = size / 2;
    const radius = size / 2 - 2;
    
    // 悬停时的外圈光晕
    if (isHover) {
      const outerGlow = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius * 1.3);
      outerGlow.addColorStop(0, 'rgba(255, 215, 0, 0.4)');
      outerGlow.addColorStop(0.5, 'rgba(255, 69, 0, 0.2)');
      outerGlow.addColorStop(1, 'rgba(255, 69, 0, 0)');
      ctx.fillStyle = outerGlow;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius * 1.3, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // 绘制阴影
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.beginPath();
    ctx.arc(centerX + 1, centerY + 1, radius, 0, Math.PI * 2);
    ctx.fill();
    
    // 绘制背景
    const bgGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
    bgGradient.addColorStop(0, isHover ? '#FF6347' : '#FF4757');
    bgGradient.addColorStop(0.3, '#FF4500');
    bgGradient.addColorStop(0.6, '#DC143C');
    bgGradient.addColorStop(0.9, '#C41E3A');
    bgGradient.addColorStop(1, '#8B0000');
    ctx.fillStyle = bgGradient;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fill();
    
    // 金色边框（带渐变）
    const borderGradient = ctx.createLinearGradient(centerX - radius, centerY, centerX + radius, centerY);
    borderGradient.addColorStop(0, this.colors.lightGold);
    borderGradient.addColorStop(0.5, this.colors.gold);
    borderGradient.addColorStop(1, this.colors.lightGold);
    ctx.strokeStyle = borderGradient;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.stroke();
    
    // 高光（更明显）
    const highlightGradient = ctx.createRadialGradient(
      centerX - radius * 0.35, centerY - radius * 0.35, 0,
      centerX - radius * 0.35, centerY - radius * 0.35, radius * 0.4
    );
    highlightGradient.addColorStop(0, 'rgba(255, 255, 255, 0.6)');
    highlightGradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.3)');
    highlightGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = highlightGradient;
    ctx.beginPath();
    ctx.arc(centerX - radius * 0.35, centerY - radius * 0.35, radius * 0.4, 0, Math.PI * 2);
    ctx.fill();
    
    // 绘制页面全屏图标（精美的角标，类似全屏但略有不同）
    const margin = size * 0.18;
    const cornerSize = size * 0.22;
    const lineWidth = 3.5;
    
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    if (isPageFullscreen) {
      // 退出页面全屏：内缩图标（带阴影和金色装饰）
      // 左上
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.lineWidth = lineWidth + 1;
      ctx.beginPath();
      ctx.moveTo(margin + cornerSize + 1, margin + 1);
      ctx.lineTo(margin + 1, margin + 1);
      ctx.lineTo(margin + 1, margin + cornerSize + 1);
      ctx.stroke();
      
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = lineWidth;
      ctx.beginPath();
      ctx.moveTo(margin + cornerSize, margin);
      ctx.lineTo(margin, margin);
      ctx.lineTo(margin, margin + cornerSize);
      ctx.stroke();
      
      ctx.strokeStyle = this.colors.gold;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(margin + cornerSize * 0.3, margin);
      ctx.lineTo(margin, margin);
      ctx.lineTo(margin, margin + cornerSize * 0.3);
      ctx.stroke();
      
      // 右上
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.lineWidth = lineWidth + 1;
      ctx.beginPath();
      ctx.moveTo(size - margin - cornerSize + 1, margin + 1);
      ctx.lineTo(size - margin + 1, margin + 1);
      ctx.lineTo(size - margin + 1, margin + cornerSize + 1);
      ctx.stroke();
      
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = lineWidth;
      ctx.beginPath();
      ctx.moveTo(size - margin - cornerSize, margin);
      ctx.lineTo(size - margin, margin);
      ctx.lineTo(size - margin, margin + cornerSize);
      ctx.stroke();
      
      ctx.strokeStyle = this.colors.gold;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(size - margin - cornerSize * 0.3, margin);
      ctx.lineTo(size - margin, margin);
      ctx.lineTo(size - margin, margin + cornerSize * 0.3);
      ctx.stroke();
      
      // 左下
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.lineWidth = lineWidth + 1;
      ctx.beginPath();
      ctx.moveTo(margin + 1, size - margin - cornerSize + 1);
      ctx.lineTo(margin + 1, size - margin + 1);
      ctx.lineTo(margin + cornerSize + 1, size - margin + 1);
      ctx.stroke();
      
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = lineWidth;
      ctx.beginPath();
      ctx.moveTo(margin, size - margin - cornerSize);
      ctx.lineTo(margin, size - margin);
      ctx.lineTo(margin + cornerSize, size - margin);
      ctx.stroke();
      
      ctx.strokeStyle = this.colors.gold;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(margin, size - margin - cornerSize * 0.3);
      ctx.lineTo(margin, size - margin);
      ctx.lineTo(margin + cornerSize * 0.3, size - margin);
      ctx.stroke();
      
      // 右下
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.lineWidth = lineWidth + 1;
      ctx.beginPath();
      ctx.moveTo(size - margin + 1, size - margin - cornerSize + 1);
      ctx.lineTo(size - margin + 1, size - margin + 1);
      ctx.lineTo(size - margin - cornerSize + 1, size - margin + 1);
      ctx.stroke();
      
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = lineWidth;
      ctx.beginPath();
      ctx.moveTo(size - margin, size - margin - cornerSize);
      ctx.lineTo(size - margin, size - margin);
      ctx.lineTo(size - margin - cornerSize, size - margin);
      ctx.stroke();
      
      ctx.strokeStyle = this.colors.gold;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(size - margin, size - margin - cornerSize * 0.3);
      ctx.lineTo(size - margin, size - margin);
      ctx.lineTo(size - margin - cornerSize * 0.3, size - margin);
      ctx.stroke();
    } else {
      // 页面全屏：外扩图标（带阴影和金色装饰）
      // 左上
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.lineWidth = lineWidth + 1;
      ctx.beginPath();
      ctx.moveTo(margin + 1, margin + cornerSize + 1);
      ctx.lineTo(margin + 1, margin + 1);
      ctx.lineTo(margin + cornerSize + 1, margin + 1);
      ctx.stroke();
      
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = lineWidth;
      ctx.beginPath();
      ctx.moveTo(margin, margin + cornerSize);
      ctx.lineTo(margin, margin);
      ctx.lineTo(margin + cornerSize, margin);
      ctx.stroke();
      
      ctx.strokeStyle = this.colors.gold;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(margin, margin + cornerSize * 0.7);
      ctx.lineTo(margin, margin);
      ctx.lineTo(margin + cornerSize * 0.7, margin);
      ctx.stroke();
      
      // 右上
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.lineWidth = lineWidth + 1;
      ctx.beginPath();
      ctx.moveTo(size - margin + 1, margin + cornerSize + 1);
      ctx.lineTo(size - margin + 1, margin + 1);
      ctx.lineTo(size - margin - cornerSize + 1, margin + 1);
      ctx.stroke();
      
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = lineWidth;
      ctx.beginPath();
      ctx.moveTo(size - margin, margin + cornerSize);
      ctx.lineTo(size - margin, margin);
      ctx.lineTo(size - margin - cornerSize, margin);
      ctx.stroke();
      
      ctx.strokeStyle = this.colors.gold;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(size - margin, margin + cornerSize * 0.7);
      ctx.lineTo(size - margin, margin);
      ctx.lineTo(size - margin - cornerSize * 0.7, margin);
      ctx.stroke();
      
      // 左下
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.lineWidth = lineWidth + 1;
      ctx.beginPath();
      ctx.moveTo(margin + 1, size - margin - cornerSize + 1);
      ctx.lineTo(margin + 1, size - margin + 1);
      ctx.lineTo(margin + cornerSize + 1, size - margin + 1);
      ctx.stroke();
      
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = lineWidth;
      ctx.beginPath();
      ctx.moveTo(margin, size - margin - cornerSize);
      ctx.lineTo(margin, size - margin);
      ctx.lineTo(margin + cornerSize, size - margin);
      ctx.stroke();
      
      ctx.strokeStyle = this.colors.gold;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(margin, size - margin - cornerSize * 0.7);
      ctx.lineTo(margin, size - margin);
      ctx.lineTo(margin + cornerSize * 0.7, size - margin);
      ctx.stroke();
      
      // 右下
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.lineWidth = lineWidth + 1;
      ctx.beginPath();
      ctx.moveTo(size - margin + 1, size - margin - cornerSize + 1);
      ctx.lineTo(size - margin + 1, size - margin + 1);
      ctx.lineTo(size - margin - cornerSize + 1, size - margin + 1);
      ctx.stroke();
      
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = lineWidth;
      ctx.beginPath();
      ctx.moveTo(size - margin, size - margin - cornerSize);
      ctx.lineTo(size - margin, size - margin);
      ctx.lineTo(size - margin - cornerSize, size - margin);
      ctx.stroke();
      
      ctx.strokeStyle = this.colors.gold;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(size - margin, size - margin - cornerSize * 0.7);
      ctx.lineTo(size - margin, size - margin);
      ctx.lineTo(size - margin - cornerSize * 0.7, size - margin);
      ctx.stroke();
    }
  }

  /**
   * 绘制全屏按钮（精美版 - 带春节元素）
   */
  drawFullscreenButton(canvas: HTMLCanvasElement, size: number, isFullscreen: boolean, isHover = false): void {
    const ctx = canvas.getContext('2d')!;
    canvas.width = size;
    canvas.height = size;
    
    ctx.clearRect(0, 0, size, size);
    
    const centerX = size / 2;
    const centerY = size / 2;
    const radius = size / 2 - 2;
    
    // 悬停时的外圈光晕
    if (isHover) {
      const outerGlow = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius * 1.3);
      outerGlow.addColorStop(0, 'rgba(255, 215, 0, 0.4)');
      outerGlow.addColorStop(0.5, 'rgba(255, 69, 0, 0.2)');
      outerGlow.addColorStop(1, 'rgba(255, 69, 0, 0)');
      ctx.fillStyle = outerGlow;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius * 1.3, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // 绘制阴影
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.beginPath();
    ctx.arc(centerX + 1, centerY + 1, radius, 0, Math.PI * 2);
    ctx.fill();
    
    // 绘制背景
    const bgGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
    bgGradient.addColorStop(0, isHover ? '#FF6347' : '#FF4757');
    bgGradient.addColorStop(0.3, '#FF4500');
    bgGradient.addColorStop(0.6, '#DC143C');
    bgGradient.addColorStop(0.9, '#C41E3A');
    bgGradient.addColorStop(1, '#8B0000');
    ctx.fillStyle = bgGradient;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fill();
    
    // 金色边框（带渐变）
    const borderGradient = ctx.createLinearGradient(centerX - radius, centerY, centerX + radius, centerY);
    borderGradient.addColorStop(0, this.colors.lightGold);
    borderGradient.addColorStop(0.5, this.colors.gold);
    borderGradient.addColorStop(1, this.colors.lightGold);
    ctx.strokeStyle = borderGradient;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.stroke();
    
    // 高光（更明显）
    const highlightGradient = ctx.createRadialGradient(
      centerX - radius * 0.35, centerY - radius * 0.35, 0,
      centerX - radius * 0.35, centerY - radius * 0.35, radius * 0.4
    );
    highlightGradient.addColorStop(0, 'rgba(255, 255, 255, 0.6)');
    highlightGradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.3)');
    highlightGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = highlightGradient;
    ctx.beginPath();
    ctx.arc(centerX - radius * 0.35, centerY - radius * 0.35, radius * 0.4, 0, Math.PI * 2);
    ctx.fill();
    
    // 绘制全屏图标（精美的角标）
    const margin = size * 0.18;
    const cornerSize = size * 0.22;
    const lineWidth = 3.5;
    
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    if (isFullscreen) {
      // 退出全屏：内缩图标（带阴影和金色装饰）
      // 左上（带阴影）
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.lineWidth = lineWidth + 1;
      ctx.beginPath();
      ctx.moveTo(margin + cornerSize + 1, margin + 1);
      ctx.lineTo(margin + 1, margin + 1);
      ctx.lineTo(margin + 1, margin + cornerSize + 1);
      ctx.stroke();
      
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = lineWidth;
      ctx.beginPath();
      ctx.moveTo(margin + cornerSize, margin);
      ctx.lineTo(margin, margin);
      ctx.lineTo(margin, margin + cornerSize);
      ctx.stroke();
      
      // 左上金色装饰
      ctx.strokeStyle = this.colors.gold;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(margin + cornerSize * 0.3, margin);
      ctx.lineTo(margin, margin);
      ctx.lineTo(margin, margin + cornerSize * 0.3);
      ctx.stroke();
      
      // 右上
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.lineWidth = lineWidth + 1;
      ctx.beginPath();
      ctx.moveTo(size - margin - cornerSize + 1, margin + 1);
      ctx.lineTo(size - margin + 1, margin + 1);
      ctx.lineTo(size - margin + 1, margin + cornerSize + 1);
      ctx.stroke();
      
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = lineWidth;
      ctx.beginPath();
      ctx.moveTo(size - margin - cornerSize, margin);
      ctx.lineTo(size - margin, margin);
      ctx.lineTo(size - margin, margin + cornerSize);
      ctx.stroke();
      
      ctx.strokeStyle = this.colors.gold;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(size - margin - cornerSize * 0.3, margin);
      ctx.lineTo(size - margin, margin);
      ctx.lineTo(size - margin, margin + cornerSize * 0.3);
      ctx.stroke();
      
      // 左下
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.lineWidth = lineWidth + 1;
      ctx.beginPath();
      ctx.moveTo(margin + 1, size - margin - cornerSize + 1);
      ctx.lineTo(margin + 1, size - margin + 1);
      ctx.lineTo(margin + cornerSize + 1, size - margin + 1);
      ctx.stroke();
      
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = lineWidth;
      ctx.beginPath();
      ctx.moveTo(margin, size - margin - cornerSize);
      ctx.lineTo(margin, size - margin);
      ctx.lineTo(margin + cornerSize, size - margin);
      ctx.stroke();
      
      ctx.strokeStyle = this.colors.gold;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(margin, size - margin - cornerSize * 0.3);
      ctx.lineTo(margin, size - margin);
      ctx.lineTo(margin + cornerSize * 0.3, size - margin);
      ctx.stroke();
      
      // 右下
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.lineWidth = lineWidth + 1;
      ctx.beginPath();
      ctx.moveTo(size - margin + 1, size - margin - cornerSize + 1);
      ctx.lineTo(size - margin + 1, size - margin + 1);
      ctx.lineTo(size - margin - cornerSize + 1, size - margin + 1);
      ctx.stroke();
      
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = lineWidth;
      ctx.beginPath();
      ctx.moveTo(size - margin, size - margin - cornerSize);
      ctx.lineTo(size - margin, size - margin);
      ctx.lineTo(size - margin - cornerSize, size - margin);
      ctx.stroke();
      
      ctx.strokeStyle = this.colors.gold;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(size - margin, size - margin - cornerSize * 0.3);
      ctx.lineTo(size - margin, size - margin);
      ctx.lineTo(size - margin - cornerSize * 0.3, size - margin);
      ctx.stroke();
    } else {
      // 全屏：外扩图标（带阴影和金色装饰）
      // 左上
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.lineWidth = lineWidth + 1;
      ctx.beginPath();
      ctx.moveTo(margin + 1, margin + cornerSize + 1);
      ctx.lineTo(margin + 1, margin + 1);
      ctx.lineTo(margin + cornerSize + 1, margin + 1);
      ctx.stroke();
      
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = lineWidth;
      ctx.beginPath();
      ctx.moveTo(margin, margin + cornerSize);
      ctx.lineTo(margin, margin);
      ctx.lineTo(margin + cornerSize, margin);
      ctx.stroke();
      
      ctx.strokeStyle = this.colors.gold;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(margin, margin + cornerSize * 0.7);
      ctx.lineTo(margin, margin);
      ctx.lineTo(margin + cornerSize * 0.7, margin);
      ctx.stroke();
      
      // 右上
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.lineWidth = lineWidth + 1;
      ctx.beginPath();
      ctx.moveTo(size - margin + 1, margin + cornerSize + 1);
      ctx.lineTo(size - margin + 1, margin + 1);
      ctx.lineTo(size - margin - cornerSize + 1, margin + 1);
      ctx.stroke();
      
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = lineWidth;
      ctx.beginPath();
      ctx.moveTo(size - margin, margin + cornerSize);
      ctx.lineTo(size - margin, margin);
      ctx.lineTo(size - margin - cornerSize, margin);
      ctx.stroke();
      
      ctx.strokeStyle = this.colors.gold;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(size - margin, margin + cornerSize * 0.7);
      ctx.lineTo(size - margin, margin);
      ctx.lineTo(size - margin - cornerSize * 0.7, margin);
      ctx.stroke();
      
      // 左下
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.lineWidth = lineWidth + 1;
      ctx.beginPath();
      ctx.moveTo(margin + 1, size - margin - cornerSize + 1);
      ctx.lineTo(margin + 1, size - margin + 1);
      ctx.lineTo(margin + cornerSize + 1, size - margin + 1);
      ctx.stroke();
      
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = lineWidth;
      ctx.beginPath();
      ctx.moveTo(margin, size - margin - cornerSize);
      ctx.lineTo(margin, size - margin);
      ctx.lineTo(margin + cornerSize, size - margin);
      ctx.stroke();
      
      ctx.strokeStyle = this.colors.gold;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(margin, size - margin - cornerSize * 0.7);
      ctx.lineTo(margin, size - margin);
      ctx.lineTo(margin + cornerSize * 0.7, size - margin);
      ctx.stroke();
      
      // 右下
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.lineWidth = lineWidth + 1;
      ctx.beginPath();
      ctx.moveTo(size - margin + 1, size - margin - cornerSize + 1);
      ctx.lineTo(size - margin + 1, size - margin + 1);
      ctx.lineTo(size - margin - cornerSize + 1, size - margin + 1);
      ctx.stroke();
      
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = lineWidth;
      ctx.beginPath();
      ctx.moveTo(size - margin, size - margin - cornerSize);
      ctx.lineTo(size - margin, size - margin);
      ctx.lineTo(size - margin - cornerSize, size - margin);
      ctx.stroke();
      
      ctx.strokeStyle = this.colors.gold;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(size - margin, size - margin - cornerSize * 0.7);
      ctx.lineTo(size - margin, size - margin);
      ctx.lineTo(size - margin - cornerSize * 0.7, size - margin);
      ctx.stroke();
    }
  }

  /**
   * 绘制速度按钮（精美版 - 带春节元素）
   */
  drawSpeedButton(canvas: HTMLCanvasElement, size: number, speed: number, isHover = false): void {
    const ctx = canvas.getContext('2d')!;
    canvas.width = size;
    canvas.height = size;
    
    ctx.clearRect(0, 0, size, size);
    
    const centerX = size / 2;
    const centerY = size / 2;
    const radius = size / 2 - 2;
    
    // 悬停时的外圈光晕
    if (isHover) {
      const outerGlow = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius * 1.3);
      outerGlow.addColorStop(0, 'rgba(255, 215, 0, 0.4)');
      outerGlow.addColorStop(0.5, 'rgba(255, 69, 0, 0.2)');
      outerGlow.addColorStop(1, 'rgba(255, 69, 0, 0)');
      ctx.fillStyle = outerGlow;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius * 1.3, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // 绘制阴影
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.beginPath();
    ctx.arc(centerX + 1, centerY + 1, radius, 0, Math.PI * 2);
    ctx.fill();
    
    // 绘制背景
    const bgGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
    bgGradient.addColorStop(0, isHover ? '#FF6347' : '#FF4757');
    bgGradient.addColorStop(0.3, '#FF4500');
    bgGradient.addColorStop(0.6, '#DC143C');
    bgGradient.addColorStop(0.9, '#C41E3A');
    bgGradient.addColorStop(1, '#8B0000');
    ctx.fillStyle = bgGradient;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fill();
    
    // 金色边框（带渐变）
    const borderGradient = ctx.createLinearGradient(centerX - radius, centerY, centerX + radius, centerY);
    borderGradient.addColorStop(0, this.colors.lightGold);
    borderGradient.addColorStop(0.5, this.colors.gold);
    borderGradient.addColorStop(1, this.colors.lightGold);
    ctx.strokeStyle = borderGradient;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.stroke();
    
    // 高光（更明显）
    const highlightGradient = ctx.createRadialGradient(
      centerX - radius * 0.35, centerY - radius * 0.35, 0,
      centerX - radius * 0.35, centerY - radius * 0.35, radius * 0.4
    );
    highlightGradient.addColorStop(0, 'rgba(255, 255, 255, 0.6)');
    highlightGradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.3)');
    highlightGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = highlightGradient;
    ctx.beginPath();
    ctx.arc(centerX - radius * 0.35, centerY - radius * 0.35, radius * 0.4, 0, Math.PI * 2);
    ctx.fill();
    
    // 绘制速度表图标（精美的圆形仪表盘）
    const dialRadius = size * 0.32;
    
    // 绘制外圈（金色装饰圈）
    ctx.strokeStyle = this.colors.gold;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(centerX, centerY, dialRadius + size * 0.08, Math.PI * 0.2, Math.PI * 0.8);
    ctx.stroke();
    
    // 绘制圆弧（仪表盘主体，白色）
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(centerX, centerY, dialRadius, Math.PI * 0.2, Math.PI * 0.8);
    ctx.stroke();
    
    // 绘制刻度（更明显，带金色装饰）
    ctx.lineWidth = 3;
    for (let i = 0; i <= 4; i++) {
      const angle = Math.PI * 0.2 + (i / 4) * Math.PI * 0.6;
      const x1 = centerX + Math.cos(angle) * dialRadius;
      const y1 = centerY - Math.sin(angle) * dialRadius;
      const x2 = centerX + Math.cos(angle) * (dialRadius + size * 0.08);
      const y2 = centerY - Math.sin(angle) * (dialRadius + size * 0.08);
      
      // 主刻度（金色）
      if (i === 0 || i === 2 || i === 4) {
        ctx.strokeStyle = this.colors.gold;
        ctx.lineWidth = 3;
      } else {
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2;
      }
      
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }
    
    // 绘制指针（金色，更粗，带阴影）
    const pointerAngle = Math.PI * 0.2 + (speed / 2) * Math.PI * 0.6;
    const pointerLength = dialRadius * 0.9;
    
    // 指针阴影
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(centerX + 1, centerY + 1);
    ctx.lineTo(
      centerX + Math.cos(pointerAngle) * pointerLength + 1,
      centerY - Math.sin(pointerAngle) * pointerLength + 1
    );
    ctx.stroke();
    
    // 指针主体（金色渐变）
    const pointerGradient = ctx.createLinearGradient(
      centerX, centerY,
      centerX + Math.cos(pointerAngle) * pointerLength,
      centerY - Math.sin(pointerAngle) * pointerLength
    );
    pointerGradient.addColorStop(0, this.colors.lightGold);
    pointerGradient.addColorStop(1, this.colors.gold);
    ctx.strokeStyle = pointerGradient;
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(
      centerX + Math.cos(pointerAngle) * pointerLength,
      centerY - Math.sin(pointerAngle) * pointerLength
    );
    ctx.stroke();
    
    // 中心点（金色，带高光）
    const centerGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, size * 0.08);
    centerGradient.addColorStop(0, this.colors.lightGold);
    centerGradient.addColorStop(0.5, this.colors.gold);
    centerGradient.addColorStop(1, this.colors.darkGold);
    ctx.fillStyle = centerGradient;
    ctx.beginPath();
    ctx.arc(centerX, centerY, size * 0.08, 0, Math.PI * 2);
    ctx.fill();
    
    // 中心点高光
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.beginPath();
    ctx.arc(centerX - size * 0.03, centerY - size * 0.03, size * 0.03, 0, Math.PI * 2);
    ctx.fill();
  }

  /**
   * 绘制画中画按钮（精美版 - 带春节元素）
   */
  drawPipButton(canvas: HTMLCanvasElement, size: number, isHover = false): void {
    const ctx = canvas.getContext('2d')!;
    canvas.width = size;
    canvas.height = size;
    
    ctx.clearRect(0, 0, size, size);
    
    const centerX = size / 2;
    const centerY = size / 2;
    const radius = size / 2 - 2;
    
    // 悬停时的外圈光晕
    if (isHover) {
      const outerGlow = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius * 1.3);
      outerGlow.addColorStop(0, 'rgba(255, 215, 0, 0.4)');
      outerGlow.addColorStop(0.5, 'rgba(255, 69, 0, 0.2)');
      outerGlow.addColorStop(1, 'rgba(255, 69, 0, 0)');
      ctx.fillStyle = outerGlow;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius * 1.3, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // 绘制阴影
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.beginPath();
    ctx.arc(centerX + 1, centerY + 1, radius, 0, Math.PI * 2);
    ctx.fill();
    
    // 绘制背景
    const bgGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
    bgGradient.addColorStop(0, isHover ? '#FF6347' : '#FF4757');
    bgGradient.addColorStop(0.3, '#FF4500');
    bgGradient.addColorStop(0.6, '#DC143C');
    bgGradient.addColorStop(0.9, '#C41E3A');
    bgGradient.addColorStop(1, '#8B0000');
    ctx.fillStyle = bgGradient;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fill();
    
    // 金色边框（带渐变）
    const borderGradient = ctx.createLinearGradient(centerX - radius, centerY, centerX + radius, centerY);
    borderGradient.addColorStop(0, this.colors.lightGold);
    borderGradient.addColorStop(0.5, this.colors.gold);
    borderGradient.addColorStop(1, this.colors.lightGold);
    ctx.strokeStyle = borderGradient;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.stroke();
    
    // 高光（更明显）
    const highlightGradient = ctx.createRadialGradient(
      centerX - radius * 0.35, centerY - radius * 0.35, 0,
      centerX - radius * 0.35, centerY - radius * 0.35, radius * 0.4
    );
    highlightGradient.addColorStop(0, 'rgba(255, 255, 255, 0.6)');
    highlightGradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.3)');
    highlightGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = highlightGradient;
    ctx.beginPath();
    ctx.arc(centerX - radius * 0.35, centerY - radius * 0.35, radius * 0.4, 0, Math.PI * 2);
    ctx.fill();
    
    // 绘制画中画图标（精美的嵌套矩形）
    const margin = size * 0.14;
    const rectSize = size * 0.52;
    const innerOffset = size * 0.22;
    
    // 大矩形（外框，白色，带阴影）
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.lineWidth = 4;
    ctx.lineJoin = 'round';
    ctx.strokeRect(margin + 1, margin + 1, rectSize, rectSize);
    
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 3.5;
    ctx.strokeRect(margin, margin, rectSize, rectSize);
    
    // 大矩形金色装饰角
    ctx.strokeStyle = this.colors.gold;
    ctx.lineWidth = 2;
    const cornerSize = size * 0.08;
    // 左上角
    ctx.beginPath();
    ctx.moveTo(margin, margin + cornerSize);
    ctx.lineTo(margin, margin);
    ctx.lineTo(margin + cornerSize, margin);
    ctx.stroke();
    // 右上角
    ctx.beginPath();
    ctx.moveTo(margin + rectSize - cornerSize, margin);
    ctx.lineTo(margin + rectSize, margin);
    ctx.lineTo(margin + rectSize, margin + cornerSize);
    ctx.stroke();
    // 左下角
    ctx.beginPath();
    ctx.moveTo(margin, margin + rectSize - cornerSize);
    ctx.lineTo(margin, margin + rectSize);
    ctx.lineTo(margin + cornerSize, margin + rectSize);
    ctx.stroke();
    // 右下角
    ctx.beginPath();
    ctx.moveTo(margin + rectSize - cornerSize, margin + rectSize);
    ctx.lineTo(margin + rectSize, margin + rectSize);
    ctx.lineTo(margin + rectSize, margin + rectSize - cornerSize);
    ctx.stroke();
    
    // 小矩形（内框，白色，带阴影）
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.lineWidth = 4;
    ctx.strokeRect(margin + innerOffset + 1, margin + innerOffset + 1, rectSize, rectSize);
    
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 3.5;
    ctx.strokeRect(margin + innerOffset, margin + innerOffset, rectSize, rectSize);
    
    // 小矩形金色装饰角
    ctx.strokeStyle = this.colors.gold;
    ctx.lineWidth = 2;
    // 左上角
    ctx.beginPath();
    ctx.moveTo(margin + innerOffset, margin + innerOffset + cornerSize);
    ctx.lineTo(margin + innerOffset, margin + innerOffset);
    ctx.lineTo(margin + innerOffset + cornerSize, margin + innerOffset);
    ctx.stroke();
    // 右上角
    ctx.beginPath();
    ctx.moveTo(margin + innerOffset + rectSize - cornerSize, margin + innerOffset);
    ctx.lineTo(margin + innerOffset + rectSize, margin + innerOffset);
    ctx.lineTo(margin + innerOffset + rectSize, margin + innerOffset + cornerSize);
    ctx.stroke();
    // 左下角
    ctx.beginPath();
    ctx.moveTo(margin + innerOffset, margin + innerOffset + rectSize - cornerSize);
    ctx.lineTo(margin + innerOffset, margin + innerOffset + rectSize);
    ctx.lineTo(margin + innerOffset + cornerSize, margin + innerOffset + rectSize);
    ctx.stroke();
    // 右下角
    ctx.beginPath();
    ctx.moveTo(margin + innerOffset + rectSize - cornerSize, margin + innerOffset + rectSize);
    ctx.lineTo(margin + innerOffset + rectSize, margin + innerOffset + rectSize);
    ctx.lineTo(margin + innerOffset + rectSize, margin + innerOffset + rectSize - cornerSize);
    ctx.stroke();
  }

  /**
   * 绘制循环按钮（带金色装饰，更精美）
   */
  drawLoopButton(canvas: HTMLCanvasElement, size: number, isHover = false): void {
    const ctx = canvas.getContext('2d')!;
    canvas.width = size;
    canvas.height = size;
    
    ctx.clearRect(0, 0, size, size);
    
    const centerX = size / 2;
    const centerY = size / 2;
    const radius = size / 2 - 2;
    
    // 绘制阴影
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.beginPath();
    ctx.arc(centerX + 1, centerY + 1, radius, 0, Math.PI * 2);
    ctx.fill();
    
    // 绘制背景
    const bgGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
    bgGradient.addColorStop(0, isHover ? '#FF6347' : '#FF4757');
    bgGradient.addColorStop(0.4, '#DC143C');
    bgGradient.addColorStop(0.8, '#C41E3A');
    bgGradient.addColorStop(1, '#8B0000');
    ctx.fillStyle = bgGradient;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fill();
    
    // 金色边框
    ctx.strokeStyle = this.colors.gold;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.stroke();
    
    // 高光
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.beginPath();
    ctx.arc(centerX - radius * 0.3, centerY - radius * 0.3, radius * 0.35, 0, Math.PI * 2);
    ctx.fill();
    
    // 绘制循环图标（圆形箭头）
    ctx.strokeStyle = '#FFFFFF';
    ctx.fillStyle = '#FFFFFF';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    const loopRadius = size * 0.3;
    
    // 绘制圆形（部分圆弧）
    ctx.beginPath();
    ctx.arc(centerX, centerY, loopRadius, Math.PI * 0.2, Math.PI * 2.2);
    ctx.stroke();
    
    // 绘制箭头（金色，更明显）
    ctx.strokeStyle = this.colors.gold;
    ctx.fillStyle = this.colors.gold;
    ctx.lineWidth = 4;
    const arrowX = centerX + loopRadius * 0.95;
    const arrowY = centerY - loopRadius * 0.2;
    ctx.beginPath();
    ctx.moveTo(arrowX, arrowY);
    ctx.lineTo(arrowX + size * 0.14, arrowY - size * 0.07);
    ctx.lineTo(arrowX + size * 0.07, arrowY);
    ctx.lineTo(arrowX + size * 0.14, arrowY + size * 0.07);
    ctx.closePath();
    ctx.fill();
  }
}
