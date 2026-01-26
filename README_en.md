# ChatLink

<div align="center">

![ChatLink Logo](./resources/icon.png)

**Connect iPhone SMS to DingTalk Workflows**

Forward iPhone SMS to DingTalk Group Robot automatically.

**English** | [中文](./README.md)

</div>

## 📖 Introduction

**ChatLink** is an Electron application running on macOS, designed to solve the problem of sharing SMS verification codes or notifications within a team.

It automatically monitors the local `chat.db` database of the native macOS iMessage application. When an iPhone receives an SMS and synchronizes it to the Mac, ChatLink immediately captures the message and forwards it to a specified DingTalk group via a robot.

**Typical Scenario:**
A company or team shares a single mobile number to receive verification codes (e.g., AWS, Alibaba Cloud, bank verification codes, etc.). With ChatLink, these SMS messages are automatically pushed to the team's DingTalk group, eliminating the need to manually check the phone and forward the message.

## ✨ Features

- **⚡️ Real-time Monitoring**: Detects new SMS in seconds, based on the macOS local `chat.db`.
- **🤖 DingTalk Forwarding**: Supports DingTalk Custom Robots (Webhook + Secret security verification).
- **🔒 Privacy & Security**: All data is processed locally and forwarded directly to your configured DingTalk group, without passing through any third-party servers.
- **📜 History Log**: Saves forwarding logs locally, supporting success/failure status review.
- **⚙️ Flexible Configuration**: Supports enabling/disabling forwarding and customizing scan intervals.

## 🛠 Prerequisites

Since ChatLink relies on the iMessage synchronization function of macOS, you need:

1. **Hardware**:
   - A macOS computer.
   - An iPhone (the phone receiving SMS).

2. **System Settings**:
   - **iPhone**: Go to `Settings` -> `Messages` -> `Text Message Forwarding`, and enable forwarding to your Mac device.
   - **Mac**: Log in with the same Apple ID and ensure the `Messages` app can receive SMS from the phone.

3. **Permissions (Crucial)**:
   - You **MUST** grant **Full Disk Access** to ChatLink (or your Terminal/VSCode during development), otherwise, it cannot read `~/Library/Messages/chat.db`.

## 🚀 Getting Started

### 1. Installation

```bash
# Clone the repository
git clone https://github.com/your-username/chat-link.git

# Enter the directory
cd chat-link

# Install dependencies
npm install
```

### 2. Development

```bash
npm run dev
```

> **Note**: In development mode, if you encounter permission errors, please ensure your Terminal (iTerm2/Terminal) or IDE (VSCode) has **Full Disk Access**.

### 3. Build

```bash
# Build for macOS (.dmg / .app)
npm run build:mac
```

## ⚙️ Configuration Guide

1. **Get DingTalk Robot Webhook**:
   - Add a "Custom Robot" in your DingTalk group settings.
   - Select "**Sign** (Secret)" for security settings.
   - Copy the **Webhook URL** and **Secret**.

2. **App Settings**:
   - Open ChatLink.
   - Go to the Settings page.
   - Enter the Webhook and Secret.
   - Click "Test Connection" to ensure the configuration is correct.
   - Enable "Forwarding".

## ❓ FAQ

**Q: Why is the SMS not being forwarded?**
A: Please check the following steps:
1. Confirm that the native "Messages" app on your Mac has received the SMS (check if iPhone Text Message Forwarding is working).
2. **Check Permissions**: In "System Settings" -> "Privacy & Security" -> "Full Disk Access", ensure ChatLink is checked. If in development mode, check Terminal/VSCode.
3. Check if the DingTalk Robot Webhook and Secret are correct.

**Q: Does the app need to be open all the time?**
A: Yes, ChatLink needs to run in the background to monitor database changes.

## 🤝 Contributing

Issues and Pull Requests are welcome!

## 📄 License

MIT License
