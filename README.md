# ShellAPI Bridge Extension

🔌 **Shell API一键对接浏览器插件** | One-Click Shell API Integration Browser Extension

一个强大的浏览器插件，支持自动扫描网页表格、提取API密钥、获取模型列表并生成桥接URL，实现Shell API的一键快速对接。

![插件版本](https://img.shields.io/badge/version-1.0.0-blue)
![支持浏览器](https://img.shields.io/badge/browser-Chrome%20|%20Edge-green)
![许可证](https://img.shields.io/badge/license-MIT-orange)

## ✨ 功能特色

- 🔍 **智能表格扫描** - 自动识别网页中的表格，精准定位操作按钮位置
- 🔑 **Access Token获取** - 安全获取当前页面Token，不会刷新现有Token
- ⚡ **一键API调用** - 快速发起API请求，自动处理认证和参数
- 🌐 **自动URL生成** - 智能生成模型列表查询URL，支持多种API格式
- ⚙️ **灵活配置** - 可自定义桥接URL、参数等，适配不同平台需求
- 💾 **设置保存** - 自动保存配置信息，下次使用更便捷
- 📢 **实时通知** - 操作状态实时反馈，成功、失败、进度一目了然
- ⌨️ **快捷操作** - 支持悬浮按钮、快捷键等多种操作方式
- 🛡️ **错误处理** - 完善的异常处理机制，详细的错误提示和用户引导
- 📱 **移动适配** - 兼容移动设备，支持触屏操作
- 📁 **可折叠界面** - 控制面板可折叠，减少页面内容遮挡
- 🖱️ **智能贴边收起** - 控制面板支持自由拖动定位，贴近浏览器边缘时自动收起成小条，位置记忆保存
- 📋 **自动复制SK** - 一键对接时自动复制SK令牌到剪切板，方便跨页面使用

## 🎯 使用场景

适用于需要快速对接Shell API的开发者和系统管理员：
- API密钥管理平台（如ShellAPI控制台）
- 模型服务提供商对接
- 多模型聚合服务配置
- API网关快速配置
- 开发环境快速调试

## 🚀 快速开始

### 安装方式

#### 方式一：从源码安装（推荐）

1. **下载源码**
   ```bash
   git clone https://github.com/akl7777777/ShellAPI-Bridge-Extension.git
   cd ShellAPI-Bridge-Extension
   ```

2. **加载插件**
   - 打开Chrome浏览器，访问 `chrome://extensions/`
   - 开启右上角的"开发者模式"
   - 点击"加载已解压的扩展程序"
   - 选择项目文件夹

3. **验证安装**
   - 在浏览器工具栏看到插件图标
   - 点击图标能正常打开弹窗界面

#### 方式二：离线安装包
> 开发中，敬请期待...

### 使用步骤

#### 第一步：基础配置
1. 点击浏览器工具栏中的插件图标
2. 在弹窗中配置以下参数：
   ```
   桥接基础URL: https://kfcv50.link
   桥接名称: KFC V50 API 一键对接
   ```
3. 点击"💾 保存配置"

#### 第二步：获取Access Token（重要）
1. **首先登录ShellAPI管理页面**
2. 在插件弹窗中点击"获取当前页面Access Token"
3. 成功后会显示"Access Token获取成功！此操作不会刷新现有Token"

> ⚠️ **注意**: 必须在已登录的ShellAPI页面中获取Token，此操作只是读取现有Token，不会导致Token失效。

#### 第三步：扫描表格并对接
1. 在目标网页右上角会出现一个绿色的🔌图标（可折叠控制面板）
2. **智能定位功能**：
   - **拖动定位**：长按图标可拖动到任意位置，释放后位置会自动保存
   - **贴边收起**：当图标靠近浏览器边缘（距离边缘10像素内）时，会自动收起成小条状，节省屏幕空间
   - **边缘类型**：
     - 左边缘 → 收起成右半圆条状
     - 右边缘 → 收起成左半圆条状  
     - 上边缘 → 收起成下半圆条状
     - 下边缘 → 收起成上半圆条状
   - **悬停展开**：鼠标悬停在收起的小条上会有高亮效果，点击可正常展开菜单
3. 点击🔌图标展开菜单，然后点击"🔍 一键对接"
4. 插件会自动为表格行添加"🔗 获取模型"按钮
5. 点击按钮后：
   - 自动复制SK令牌到剪切板（格式：sk-xxx）
   - 自动调用API获取模型列表
   - 生成完整的桥接URL
   - 在新标签页打开对接页面
6. 使用完毕后可点击菜单右上角的"×"收起面板，减少页面遮挡

## 📋 支持的API数据格式

插件兼容以下JSON响应格式：

### 格式一：对象数组
```json
{
  "data": [
    {
      "id": "gemini-1.5-flash",
      "name": "Gemini 1.5 Flash"
    },
    {
      "id": "gpt-4",
      "name": "GPT-4"
    }
  ],
  "success": true
}
```

### 格式二：字符串数组
```json
{
  "data": [
    "gemini-1.5-flash",
    "gemini-1.5-pro",
    "gpt-4",
    "claude-3"
  ],
  "message": "获取成功",
  "success": true
}
```

## 🔧 生成URL格式

最终生成的桥接URL格式：
```
https://your-domain.com/channel/bridge?name=桥接名称&base_url=基础URL&model=模型1,模型2,模型3&billing_type=4&type=7007
```

### 参数说明
- `name`: 桥接名称
- `base_url`: API基础URL
- `model`: 模型列表（逗号分隔）
- `billing_type`: 计费类型（固定值4）
- `type`: 类型标识（固定值7007）

## ⌨️ 快捷键

- `Ctrl + Shift + R` - 快速发送API请求
- `Ctrl + Shift + J` - 快速跳转搜索选中文字
- `Enter` - 在输入框中按回车执行对应操作

## 📁 项目结构

```
ShellAPI-Bridge-Extension/
├── manifest.json          # 插件配置文件（V3规范）
├── popup.html             # 插件弹窗界面
├── popup.js               # 弹窗逻辑处理
├── content.js             # 内容脚本（核心功能）
├── background.js          # 后台服务
├── icons/                 # 插件图标资源
│   ├── icon16.png         # 16x16 图标
│   ├── icon32.png         # 32x32 图标
│   ├── icon48.png         # 48x48 图标
│   └── icon128.png        # 128x128 图标
├── .gitignore            # Git忽略文件
└── README.md             # 项目文档
```

## 🔒 权限说明

| 权限 | 用途 | 安全说明 |
|------|------|----------|
| `activeTab` | 访问当前活动标签页 | 仅在用户主动操作时访问 |
| `storage` | 保存用户配置 | 本地存储，不上传任何数据 |
| `contextMenus` | 右键菜单功能 | 提供快捷操作入口 |
| `host_permissions: *://*/*` | 访问所有网站 | 用于表格扫描和API调用 |

## 🌟 支持的浏览器

| 浏览器 | 最低版本 | 状态 | 说明 |
|--------|----------|------|------|
| Chrome | 88+ | ✅ 完全支持 | 推荐使用 |
| Edge | 88+ | ✅ 完全支持 | 基于Chromium |
| Firefox | - | 🔄 计划中 | 需要适配WebExtensions |
| Safari | - | ❌ 不支持 | API差异较大 |
| 移动浏览器 | - | ❌ 不支持 | 不支持扩展安装 |

## 🐛 故障排除

### 常见问题

#### 1. Token获取失败
```
错误：获取Access Token失败
解决：请确保在已登录的ShellAPI页面使用
```
- 确认已登录ShellAPI管理页面
- 刷新页面后重试
- 检查网络连接

#### 2. 表格扫描无反应
```
问题：点击"扫描表格"后没有添加按钮
解决方案：
```
- 确认页面包含表格元素
- 刷新页面重新扫描
- 检查是否有JavaScript错误

#### 3. API请求失败
```
错误：模型获取失败
检查项：
```
- Token是否有效
- API地址是否正确
- 网络是否畅通
- 服务器是否正常

#### 4. 插件无法加载
```
问题：Chrome扩展页面显示错误
解决：
```
- 确保manifest.json格式正确
- 检查文件路径是否存在
- 重新加载扩展

### 调试方法

1. **开启开发者工具**
   - 按F12打开控制台
   - 查看Console标签页的错误信息

2. **查看后台页面**
   - 访问 `chrome://extensions/`
   - 点击插件的"检查视图"链接

3. **查看日志**
   - 插件会在控制台输出详细日志
   - 关键词：`ShellAPI Bridge`

## 🔐 安全说明

### 数据隐私
- **本地存储**：所有配置数据仅保存在浏览器本地
- **无数据上传**：插件不会向第三方服务器发送用户数据
- **Token安全**：Access Token仅用于API调用，不会被存储或泄露

### 权限使用
- **最小权限原则**：仅请求必要的浏览器权限
- **用户控制**：所有操作需要用户主动触发
- **透明操作**：所有网络请求都有明确提示

### 代码安全
- **开源代码**：所有源码公开，可审计
- **无恶意代码**：不包含任何恶意或间谍功能
- **定期更新**：及时修复安全漏洞

## 🚀 更新日志

### v1.0.0 (当前版本)
- 🎯 核心功能完善，支持智能表格扫描和一键API对接
- 🔑 增强Token获取安全性，确保不会刷新现有Token
- 🖱️ 智能贴边收起功能 - 拖动到边缘时自动收起成小条，节省屏幕空间
- 🖱️ 支持拖动定位，位置记忆保存
- 📋 自动复制SK令牌到剪切板（格式：sk-xxx）
- 📱 移动设备兼容性优化
- 🎨 界面美化和交互体验提升

### 计划功能
- 📊 使用统计面板
- 🎨 自定义主题
- 📱 移动端适配
- 🌐 多语言支持
- 🔄 自动更新检查

## 🤝 贡献指南

我们欢迎任何形式的贡献！

### 如何贡献

1. **Fork 本仓库**
2. **创建特性分支**
   ```bash
   git checkout -b feature/AmazingFeature
   ```
3. **提交更改**
   ```bash
   git commit -m 'Add some AmazingFeature'
   ```
4. **推送到分支**
   ```bash
   git push origin feature/AmazingFeature
   ```
5. **打开 Pull Request**

### 贡献类型

- 🐛 **Bug修复** - 报告或修复问题
- ✨ **新功能** - 提出或实现新特性
- 📚 **文档** - 改进文档和说明
- 🎨 **UI/UX** - 界面和体验优化
- 🔧 **工具** - 开发工具和流程改进

### 代码规范

- 使用ES6+语法
- 添加适当的注释
- 遵循现有的代码风格
- 添加必要的错误处理

## 📞 支持与反馈

### 获取帮助

- 📝 [提交Issue](https://github.com/akl7777777/ShellAPI-Bridge-Extension/issues)
- 💬 [讨论区](https://github.com/akl7777777/ShellAPI-Bridge-Extension/discussions)
- 📧 Email: your-email@example.com

### 反馈渠道

- 🐛 **Bug报告**: 使用Issue模板详细描述问题
- 💡 **功能建议**: 在Discussions中提出想法
- ⭐ **使用反馈**: 给项目点星支持我们

## 📄 许可证

本项目采用 [MIT License](LICENSE) 许可证

```
MIT License

Copyright (c) 2024 ShellAPI Bridge Extension

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction...
```

## 🙏 致谢

感谢以下贡献者和项目：

- 所有提交代码和建议的贡献者
- Chrome Extensions API开发团队
- 开源社区的支持和反馈

### 特别鸣谢

- 🔧 **核心开发**: [@akl7777777](https://github.com/akl7777777)
- 📝 **文档维护**: 社区贡献者
- 🧪 **测试反馈**: 早期用户

---

<div align="center">

**⭐ 如果这个项目对你有帮助，请给它一个星标！**

[🏠 主页](https://github.com/akl7777777/ShellAPI-Bridge-Extension) | 
[📝 文档](README.md) | 
[🐛 报告问题](https://github.com/akl7777777/ShellAPI-Bridge-Extension/issues) | 
[💬 讨论](https://github.com/akl7777777/ShellAPI-Bridge-Extension/discussions)

</div>
