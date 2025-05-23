#!/usr/bin/env python3
"""
基于现有图标创建不同尺寸的PNG图标文件
需要安装Pillow库：pip install Pillow
并处理四个角的白色边缘，使其透明
"""

from PIL import Image
import os
import math

# 确保icons目录存在
if not os.path.exists('icons'):
    os.makedirs('icons')

# 源图片路径
source_image_path = 'icons/icon.png'

# 检查源图片是否存在
if not os.path.exists(source_image_path):
    print(f"错误：源图片 {source_image_path} 不存在！")
    exit(1)

# 加载源图片并处理四个角的白色边缘
try:
    # 加载原始图像
    source_image = Image.open(source_image_path)
    print(f"已加载源图片: {source_image_path}, 尺寸: {source_image.size}")
    
    # 确保图像有透明通道
    if source_image.mode != 'RGBA':
        source_image = source_image.convert('RGBA')
        print("已将图像转换为RGBA模式")
    
    # 获取图像尺寸
    width, height = source_image.size
    
    # 创建处理后的图像副本
    processed_image = source_image.copy()
    pixels = processed_image.load()
    
    # 定义圆角半径（可调整，值越大，切除的角越多）
    corner_radius = min(width, height) // 4
    
    # 定义白色阈值 (RGB值均高于这个值被视为"白色")
    white_threshold = 240
    
    # 处理四个角落的像素
    for y in range(height):
        for x in range(width):
            # 检查像素是否在四个角之一
            in_top_left = x < corner_radius and y < corner_radius
            in_top_right = x >= width - corner_radius and y < corner_radius
            in_bottom_left = x < corner_radius and y >= height - corner_radius
            in_bottom_right = x >= width - corner_radius and y >= height - corner_radius
            
            if in_top_left or in_top_right or in_bottom_left or in_bottom_right:
                # 计算到最近角的距离
                if in_top_left:
                    dx, dy = x, y
                elif in_top_right:
                    dx, dy = width - 1 - x, y
                elif in_bottom_left:
                    dx, dy = x, height - 1 - y
                else:  # in_bottom_right
                    dx, dy = width - 1 - x, height - 1 - y
                
                # 计算到角的欧几里得距离
                distance = math.sqrt(dx**2 + dy**2)
                
                # 如果距离大于角半径，跳过该像素
                if distance <= corner_radius:
                    # 获取当前像素的RGB值
                    r, g, b, a = pixels[x, y]
                    
                    # 如果像素是白色或接近白色，使其透明
                    if r > white_threshold and g > white_threshold and b > white_threshold:
                        # 根据到角的距离设置透明度，边缘更加平滑
                        # distance越小，透明度越高
                        alpha = int(255 * (distance / corner_radius))
                        pixels[x, y] = (r, g, b, alpha)
    
    print("已处理图像四个角的白色边缘")
    source_image = processed_image  # 使用处理后的图像
    
except Exception as e:
    print(f"处理图像时出错: {e}")
    exit(1)

# 定义图标尺寸
sizes = [16, 32, 48, 128]

# 创建不同尺寸的图标
for size in sizes:
    # 创建调整大小后的图像
    resized_image = source_image.resize((size, size), Image.Resampling.LANCZOS)
    
    # 保存PNG文件
    filename = f"icons/icon{size}.png"
    resized_image.save(filename)
    print(f"创建了图标: {filename}, 尺寸: {size}x{size}")

print("完成图标创建！") 