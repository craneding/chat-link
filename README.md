# ChatLink

<div align="center">

![ChatLink Logo](./resources/icon.png)

**Connect iPhone SMS to DingTalk Workflows**

iPhone 短信自动转发到钉钉群机器人工具

[English](./README_en.md) | **中文**

</div>

## 📖 简介 | Introduction

**ChatLink** 是一款运行在 macOS 上的 Electron 应用程序，旨在解决团队协作中验证码/通知短信共享的痛点。

它能够自动监听 macOS 原生 iMessage (信息) 应用的数据库，当 iPhone 收到短信并同步到 Mac 后，ChatLink 会立即捕获该消息并通过钉钉机器人转发到指定的钉钉群。

**典型场景：**
公司或团队共用一个手机号码接收验证码（如 AWS、阿里云、银行验证码等）。通过 ChatLink，这些短信会自动推送到团队的钉钉群，无需人工查阅手机并手动转发。

## ✨ 核心功能 | Features

- **⚡️ 实时监听**: 秒级检测新短信，基于 macOS 本地 `chat.db` 数据库。
- **🤖 钉钉转发**: 支持钉钉自定义机器人（Webhook + 加签安全验证）。
- **🔒 安全隐私**: 所有数据仅在本地处理和转发到您配置的钉钉群，不经过任何第三方服务器。
- **📜 历史记录**: 本地保存转发日志，支持查看成功/失败状态。
- **⚙️ 灵活配置**: 支持开启/关闭转发，自定义扫描间隔。

## 🛠 前置要求 | Prerequisites

由于 ChatLink 依赖 macOS 的 iMessage 同步功能，您需要：

1. **硬件**:
   - 一台 macOS 电脑。
   - 一台 iPhone（接收短信的手机）。

2. **系统设置**:
   - **iPhone**: 进入 `设置` -> `信息` -> `短信转发`，开启转发到您的 Mac 设备。
   - **Mac**: 登录相同的 Apple ID，并确保 `信息` 应用能收到手机的短信。

3. **权限 (非常重要)**:
   - 必须授予 ChatLink (或由于开发环境下的终端/VSCode) **完全磁盘访问权限 (Full Disk Access)**，否则无法读取 `~/Library/Messages/chat.db`。

## 🚀 快速开始 | Getting Started

### 1. 安装 | Installation

```bash
# 克隆项目
git clone https://github.com/your-username/chat-link.git

# 进入目录
cd chat-link

# 安装依赖
npm install
```

### 2. 开发 | Development

```bash
npm run dev
```

> **注意**: 在开发模式下，如果遇到权限错误，请确保您的终端 (Terminal/iTerm2) 或 IDE (VSCode) 已获得 **完全磁盘访问权限**。

### 3. 构建 | Build

```bash
# 构建 macOS 应用 (.dmg / .app)
npm run build:mac
```

## ⚙️ 配置指南 | Configuration

1. **获取钉钉机器人 Webhook**:
   - 在钉钉群设置中添加“自定义机器人”。
   - 安全设置选择“**加签** (Secret)”。
   - 复制 **Webhook 地址** 和 **加签密钥 (Secret)**。

2. **软件设置**:
   - 打开 ChatLink。
   - 进入设置页面。
   - 填入 Webhook 和 Secret。
   - 点击“测试连接”确保配置正确。
   - 开启“启用转发”。

## ❓ 常见问题 | FAQ

**Q: 为什么没有转发短信？**
A: 请按以下步骤排查：
1. 确认 Mac 自带的“信息”APP里是否已经收到了那条短信（iPhone 短信转发功能是否正常）。
2. **检查权限**: 在“系统设置” -> “隐私与安全性” -> “完全磁盘访问权限”中，确保 ChatLink 已被勾选。如果是开发模式，请勾选 Terminal/VSCode。
3. 检查钉钉机器人的 Webhook 和 Secret 是否正确。

**Q: 需要一直开着软件吗？**
A: 是的，ChatLink 需要在后台运行以监听数据库变化。

## 🤝 贡献 | Contributing

欢迎提交 Issue 和 Pull Request！

## 📄 许可证 | License

MIT License
