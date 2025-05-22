# ShellAPI Bridge Extension

🔌 **Shell API一键对接浏览器插件** | One-Click Shell API Integration Browser Extension

一个强大的浏览器插件，支持自动扫描网页表格、提取API密钥、获取模型列表并生成桥接URL，实现Shell API的一键快速对接。

## ✨ 功能特色

- 🔍 **智能表格扫描** - 自动识别网页中的表格并添加操作按钮
- 🔗 **一键API调用** - 点击按钮自动请求 `/v1/models` 接口
- 🚀 **自动URL生成** - 智能拼接模型列表生成桥接URL
- ⚙️ **灵活配置** - 支持自定义桥接URL、名称等参数
- 💾 **设置保存** - 自动保存常用配置，提升使用效率
- 🎯 **快捷操作** - 浮动按钮和键盘快捷键支持

## 🎯 使用场景

适用于需要快速对接Shell API的开发者和系统管理员：
- API密钥管理平台
- 模型服务提供商对接
- 多模型聚合服务配置
- API网关快速配置

## 🚀 快速开始

### 安装方式

1. **下载源码**
   ```bash
   git clone https://github.com/您的用户名/ShellAPI-Bridge-Extension.git
   ```

2. **加载插件**
    - 打开Chrome浏览器，访问 `chrome://extensions/`
    - 开启"开发者模式"
    - 点击"加载已解压的扩展程序"
    - 选择项目文件夹

3. **开始使用**
    - 点击浏览器工具栏中的插件图标
    - 配置桥接基础URL和名称
    - 在目标网页点击"扫描表格"即可开始使用

### 基本使用

1. **配置参数**
   ```
   桥接基础URL: https://kfcv50.link
   桥接名称: KFC V50 API 一键对接
   ```

2. **扫描表格**
    - 点击"🔍 扫描表格并添加按钮"
    - 插件会自动为表格行添加操作按钮

3. **执行对接**
    - 点击表格行中的"🔗 获取模型"按钮
    - 自动获取模型列表并生成桥接URL
    - 在新标签页打开对接页面

## 📋 API数据格式

插件支持以下JSON响应格式：

```json
{
    "data": [
        "gemini-1.5-flash",
        "gemini-1.5-pro",
        "gpt-4",
        "claude-3"
    ],
    "message": "",
    "success": true
}
```

## 🔧 生成URL格式

最终生成的桥接URL格式：
```
https://your-domain.com/channel/bridge?name=桥接名称&base_url=基础URL&model=模型1,模型2,模型3&billing_type=4&type=7007
```

## ⌨️ 快捷键

- `Ctrl + Shift + R` - 快速发送API请求
- `Ctrl + Shift + J` - 快速跳转搜索选中文字
- `Enter` - 在输入框中按回车执行对应操作

## 📁 项目结构

```
ShellAPI-Bridge-Extension/
├── manifest.json          # 插件配置文件
├── popup.html             # 插件弹窗界面
├── popup.js               # 弹窗逻辑处理
├── content.js             # 内容脚本
├── background.js          # 后台服务
├── icons/                 # 插件图标
│   ├── icon16.png
│   ├── icon32.png
│   ├── icon48.png
│   └── icon128.png
└── README.md              # 项目说明
```

## 🔒 权限说明

- `activeTab` - 访问当前活动标签页
- `storage` - 保存用户配置
- `contextMenus` - 右键菜单功能
- `host_permissions` - 访问网页内容进行表格扫描

## 🌟 支持的浏览器

- ✅ Chrome 88+
- ✅ Edge 88+
- 🔄 Firefox (计划支持)

## 🤝 贡献指南

欢迎提交Issue和Pull Request！

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 🙏 致谢

感谢所有为这个项目做出贡献的开发者！

---

**⭐ 如果这个项目对你有帮助，请给它一个星标！**
